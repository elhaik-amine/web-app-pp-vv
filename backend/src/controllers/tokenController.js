const Stripe = require('stripe');
const { pool } = require('../config/db');
const { getIO } = require('../socket');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const PRICE_PER_TOKEN = Number(process.env.STRIPE_PRICE_PER_TOKEN_CENTIMES) || 100; // centimes

// ─── GET /api/tokens/balance ──────────────────────────────────────────────────
const getBalance = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT token_balance FROM users WHERE id = ?',
      [req.user.id]
    );
    res.json({ success: true, data: { balance: rows[0].token_balance } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET /api/tokens/history ─────────────────────────────────────────────────
const getHistory = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM token_transactions WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── POST /api/tokens/buy ─────────────────────────────────────────────────────
// Creates a Stripe PaymentIntent. The client uses the returned client_secret
// to confirm the payment on the frontend (Stripe SDK / Payment Sheet).
// Tokens are credited ONLY after the webhook confirms payment.
const buyTokens = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0 || !Number.isInteger(Number(amount))) {
      return res.status(400).json({ success: false, message: 'amount must be a positive integer' });
    }

    const tokens = Number(amount);
    const amountCentimes = tokens * PRICE_PER_TOKEN; // total in smallest unit

    // Create a PaymentIntent with metadata so the webhook knows what to credit
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCentimes,
      currency: 'mad',
      metadata: {
        user_id: String(req.user.id),
        token_amount: String(tokens),
      },
      description: `Khidmati — ${tokens} token(s) for user #${req.user.id}`,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never', // required for mobile / server-side confirmation
      },
    });

    res.json({
      success: true,
      data: {
        client_secret:     paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
        token_amount:      tokens,
        amount_centimes:   amountCentimes,
      },
      message: 'PaymentIntent created — confirm on the client side',
    });
  } catch (error) {
    console.error('Stripe buyTokens error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── POST /api/tokens/webhook ─────────────────────────────────────────────────
// Called by Stripe. MUST use raw body (express.raw middleware) — see app.js.
// Verifies the signature, then credits tokens on payment_intent.succeeded.
const stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ success: false, message: `Webhook error: ${err.message}` });
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object;
    const userId      = Number(pi.metadata.user_id);
    const tokenAmount = Number(pi.metadata.token_amount);

    if (!userId || !tokenAmount) {
      console.error('Webhook: missing metadata on PaymentIntent', pi.id);
      return res.status(400).json({ success: false, message: 'Missing metadata' });
    }

    try {
      // Credit the tokens
      await pool.execute(
        'UPDATE users SET token_balance = token_balance + ? WHERE id = ?',
        [tokenAmount, userId]
      );

      // Record transaction
      await pool.execute(
        `INSERT INTO token_transactions (user_id, type, amount, description)
         VALUES (?, 'PURCHASE', ?, ?)`,
        [userId, tokenAmount, `Stripe payment ${pi.id}`]
      );

      // Fetch new balance
      const [rows] = await pool.execute('SELECT token_balance FROM users WHERE id = ?', [userId]);
      const newBalance = rows[0]?.token_balance ?? tokenAmount;

      // Real-time socket notification
      try {
        getIO()
          .to(`user_${userId}`)
          .emit('token:updated', { type: 'PURCHASE', amount: tokenAmount, balance: newBalance });
      } catch (_) {}

      console.log(`✅ Tokens credited: user=${userId} tokens=${tokenAmount} balance=${newBalance}`);
    } catch (dbError) {
      console.error('Webhook DB error:', dbError);
      // Return 500 so Stripe retries
      return res.status(500).json({ success: false, message: dbError.message });
    }
  }

  // Acknowledge all other event types
  res.json({ received: true });
};

// ─── POST /api/tokens/spend ────────────────────────────────────────────────
const spendTokens = async (req, res) => {
  try {
    const { token_amount, description } = req.body;

    if (!token_amount || token_amount <= 0 || !Number.isInteger(Number(token_amount))) {
      return res.status(400).json({ success: false, message: 'token_amount must be a positive integer' });
    }

    const tokens = Number(token_amount);

    // Check current balance first
    const [rows] = await pool.execute('SELECT token_balance FROM users WHERE id = ?', [req.user.id]);
    const currentBalance = Number(rows[0]?.token_balance ?? 0);

    if (currentBalance < tokens) {
      return res.status(400).json({
        success: false,
        message: `Solde insuffisant. Vous avez ${currentBalance} token(s), besoin de ${tokens}.`,
        data: { balance: currentBalance },
      });
    }

    await pool.execute(
      'UPDATE users SET token_balance = token_balance - ? WHERE id = ?',
      [tokens, req.user.id]
    );

    await pool.execute(
      `INSERT INTO token_transactions (user_id, type, amount, description)
       VALUES (?, 'DEDUCTION', ?, ?)`,
      [req.user.id, tokens, description || 'Token spend']
    );

    const [updated] = await pool.execute('SELECT token_balance FROM users WHERE id = ?', [req.user.id]);
    const newBalance = Number(updated[0].token_balance);

    try {
      getIO().to(`user_${req.user.id}`).emit('token:updated', { type: 'SPEND', amount: tokens, balance: newBalance });
    } catch (_) {}

    res.json({
      success: true,
      data: { new_balance: newBalance, spent: tokens },
      message: `${tokens} token(s) déduit(s)`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── POST /api/tokens/confirm-payment ─────────────────────────────────────────
// Called by the mobile app after Stripe PaymentSheet confirms the payment.
// Verifies the PaymentIntent status with Stripe, then credits tokens immediately.
const confirmPayment = async (req, res) => {
  try {
    const { payment_intent_id } = req.body;

    if (!payment_intent_id) {
      return res.status(400).json({ success: false, message: 'payment_intent_id is required' });
    }

    // Retrieve the PaymentIntent from Stripe to verify it succeeded
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: `Payment not completed. Status: ${paymentIntent.status}`,
      });
    }

    const userId      = Number(paymentIntent.metadata.user_id);
    const tokenAmount = Number(paymentIntent.metadata.token_amount);

    if (!userId || !tokenAmount) {
      return res.status(400).json({ success: false, message: 'Missing payment metadata' });
    }

    // Verify the authenticated user matches the PaymentIntent owner
    if (req.user.id !== userId) {
      return res.status(403).json({ success: false, message: 'Payment does not belong to you' });
    }

    // Check if already credited (idempotency)
    const [existing] = await pool.execute(
      "SELECT id FROM token_transactions WHERE description = ?",
      [`Stripe payment ${payment_intent_id}`]
    );
    if (existing.length > 0) {
      const [rows] = await pool.execute('SELECT token_balance FROM users WHERE id = ?', [userId]);
      return res.json({
        success: true,
        data: { already_credited: true, balance: rows[0]?.token_balance },
        message: 'Tokens already credited',
      });
    }

    // Credit the tokens
    await pool.execute(
      'UPDATE users SET token_balance = token_balance + ? WHERE id = ?',
      [tokenAmount, userId]
    );

    await pool.execute(
      `INSERT INTO token_transactions (user_id, type, amount, description)
       VALUES (?, 'PURCHASE', ?, ?)`,
      [userId, tokenAmount, `Stripe payment ${payment_intent_id}`]
    );

    const [rows] = await pool.execute('SELECT token_balance FROM users WHERE id = ?', [userId]);
    const newBalance = rows[0]?.token_balance ?? tokenAmount;

    try {
      getIO()
        .to(`user_${userId}`)
        .emit('token:updated', { type: 'PURCHASE', amount: tokenAmount, balance: newBalance });
    } catch (_) {}

    console.log(`✅ Tokens credited (direct): user=${userId} tokens=${tokenAmount} balance=${newBalance}`);

    res.json({
      success: true,
      data: { balance: newBalance, credited: tokenAmount },
      message: `${tokenAmount} token(s) crédités`,
    });
  } catch (error) {
    console.error('confirmPayment error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getBalance, getHistory, buyTokens, stripeWebhook, spendTokens, confirmPayment };

