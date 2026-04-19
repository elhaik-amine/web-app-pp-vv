const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const { notFound, errorHandler } = require("./middlewares/errorMiddleware");
const { stripeWebhook } = require("./controllers/tokenController");


// Auth routes (split by role)
const authRoutes = require("./routes/authRoutes"); // shared: logout, forgot, reset
const authClientRoutes = require("./routes/authClientRoutes"); // client register + login
const authProviderRoutes = require("./routes/authProviderRoutes"); // provider register + login

// Feature routes
const userRoutes = require("./routes/userRoutes");
const providerRoutes = require("./routes/providerRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const tokenRoutes = require("./routes/tokenRoutes");
const reportRoutes = require("./routes/reportRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const adminRoutes = require("./routes/adminRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const availabilityRoutes = require("./routes/availabilityRoutes");

const app = express();
app.use(morgan("dev"));

// ─── Stripe webhook — MUST be before express.json() ──────────────────────────
// Stripe needs the raw request body to verify the signature.
// If express.json() runs first, the raw bytes are lost and verification fails.
app.post(
  "/api/tokens/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook
);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


app.use((req, res, next) => {
  console.log("Request Body:", req.body);
  next();
});

// Auth
app.use("/api/auth", authRoutes);
app.use("/api/auth/client", authClientRoutes);
app.use("/api/auth/provider", authProviderRoutes);

// Users & providers
app.use("/api/users", userRoutes);
app.use("/api/providers", providerRoutes);

// Features
app.use("/api/bookings", bookingRoutes);
app.use("/api/tokens", tokenRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/availability", availabilityRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
