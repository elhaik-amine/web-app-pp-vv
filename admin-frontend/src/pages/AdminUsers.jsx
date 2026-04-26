import React, { useState, useEffect } from 'react';
import { FiSearch, FiShieldOff, FiTrash2, FiUser, FiUnlock, FiX } from 'react-icons/fi';
import './AdminUsers.css';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Suspend modal state
  const [suspendModal, setSuspendModal] = useState(null); // { userId, userName }
  const [suspendDays, setSuspendDays] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  useEffect(() => { fetchUsers(); }, [filter]);

  const getHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('khidmati_token')}`,
    'Content-Type': 'application/json'
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/admin/users`;
      if (filter !== 'ALL') url += `?role=${filter}`;
      const res = await fetch(url, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) {
        setUsers(data.data.filter(u => u.role !== 'ADMIN'));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const openSuspendModal = (user) => {
    setSuspendDays('');
    setSuspendModal({ userId: user.id, userName: user.name });
  };

  const confirmSuspend = async () => {
    if (!suspendModal) return;
    try {
      const body = suspendDays && Number(suspendDays) > 0
        ? { days: Number(suspendDays) }
        : {};
      const res = await fetch(`${API_URL}/admin/users/${suspendModal.userId}/suspend`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(body),
      });
      if (res.ok) { setSuspendModal(null); fetchUsers(); }
    } catch (error) {
      console.error('Error suspending user:', error);
    }
  };

  const unsuspendUser = async (userId) => {
    try {
      const res = await fetch(`${API_URL}/admin/users/${userId}/activate`, {
        method: 'PATCH',
        headers: getHeaders(),
      });
      if (res.ok) fetchUsers();
    } catch (error) {
      console.error('Error unsuspending user:', error);
    }
  };

  const banUser = async (userId) => {
    if (!window.confirm('Voulez-vous vraiment BANNIR cet utilisateur ? Cette action est irréversible.')) return;
    try {
      const res = await fetch(`${API_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (res.ok) fetchUsers();
    } catch (error) {
      console.error('Error banning user:', error);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(search.toLowerCase()) ||
    user.email?.toLowerCase().includes(search.toLowerCase())
  );

  const getRoleColor = (role) => role === 'PROVIDER' ? 'badge-primary' : 'badge-success';

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE':     return 'badge-success';
      case 'SUSPENDED':  return 'badge-warning';
      case 'BANNED':     return 'badge-danger';
      case 'RESTRICTED': return 'badge-danger';
      case 'PENDING':    return 'badge-primary';
      default:           return 'badge-secondary';
    }
  };

  const formatSuspendedUntil = (date) => {
    if (!date) return 'Indéfini';
    return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="users-container animate-fade-in">
      <header className="page-header users-header">
        <div>
          <h1>Utilisateurs</h1>
          <p className="subtitle">Gérez les clients et les prestataires (bannir ou suspendre)</p>
        </div>
      </header>

      <div className="users-controls glass-card">
        <div className="search-bar">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher par nom ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field"
          />
        </div>

        <div className="filter-tabs">
          {['ALL', 'CLIENT', 'PROVIDER'].map(f => (
            <button key={f} className={`filter-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f === 'ALL' ? 'Tous' : f === 'CLIENT' ? 'Clients' : 'Prestataires'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loader-container"><div className="spinner"></div></div>
      ) : filteredUsers.length === 0 ? (
        <div className="empty-state glass-card">
          <FiUser size={48} color="var(--text-light)" />
          <h3>Aucun utilisateur trouvé</h3>
          <p>Essayez de modifier vos filtres ou votre recherche.</p>
        </div>
      ) : (
        <div className="users-grid">
          {filteredUsers.map((user) => (
            <div key={user.id} className="user-card glass-card">
              <div className="user-card-header">
                <div className="user-info">
                  <div className="avatar">{user.name?.charAt(0) || 'U'}</div>
                  <div>
                    <h4>{user.name}</h4>
                    <span className="user-email">{user.email}</span>
                  </div>
                </div>
              </div>

              <div className="user-card-body">
                <div className="user-badges">
                  <span className={`badge ${getRoleColor(user.role)}`}>
                    {user.role === 'PROVIDER' ? 'PRESTATAIRE' : 'CLIENT'}
                  </span>
                  <span className={`badge ${getStatusColor(user.status || 'ACTIVE')}`}>
                    {user.status || 'ACTIVE'}
                  </span>
                </div>
                <p className="user-date">Inscrit le: {new Date(user.created_at).toLocaleDateString()}</p>
                {user.status === 'SUSPENDED' && (
                  <p className="user-date" style={{ color: '#f59e0b', marginTop: 2 }}>
                    ⏳ Jusqu'au: {formatSuspendedUntil(user.suspended_until)}
                  </p>
                )}
                {user.role === 'PROVIDER' && user.token_balance !== undefined && (
                  <p className="user-tokens">Jetons: <strong>{user.token_balance}</strong></p>
                )}
              </div>

              <div className="user-card-footer">
                {user.status === 'SUSPENDED' ? (
                  <button
                    onClick={() => unsuspendUser(user.id)}
                    className="btn btn-outline btn-sm text-success"
                    title="Lever la suspension"
                  >
                    <FiUnlock /> Lever
                  </button>
                ) : (
                  <button
                    onClick={() => openSuspendModal(user)}
                    className="btn btn-outline btn-sm text-warning"
                    title="Suspendre"
                    disabled={user.status === 'BANNED'}
                  >
                    <FiShieldOff /> Suspendre
                  </button>
                )}
                <button
                  onClick={() => banUser(user.id)}
                  className="btn btn-outline btn-sm text-danger"
                  title="Bannir"
                  disabled={user.status === 'BANNED'}
                >
                  <FiTrash2 /> {user.status === 'BANNED' ? 'Banni' : 'Bannir'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Suspend Modal ── */}
      {suspendModal && (
        <div className="modal-overlay" onClick={() => setSuspendModal(null)}>
          <div className="modal-box glass-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Suspendre {suspendModal.userName}</h3>
              <button className="modal-close" onClick={() => setSuspendModal(null)}><FiX /></button>
            </div>
            <p className="modal-subtitle">
              Choisissez la durée de suspension. Laissez vide pour une suspension indéfinie.
            </p>
            <div className="modal-input-group">
              <label>Nombre de jours</label>
              <input
                type="number"
                min="1"
                max="365"
                placeholder="Ex: 7  (laisser vide = indéfini)"
                value={suspendDays}
                onChange={e => setSuspendDays(e.target.value)}
                className="input-field"
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setSuspendModal(null)}>Annuler</button>
              <button className="btn btn-warning" onClick={confirmSuspend}>
                {suspendDays ? `Suspendre ${suspendDays} jour(s)` : 'Suspendre (indéfini)'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
