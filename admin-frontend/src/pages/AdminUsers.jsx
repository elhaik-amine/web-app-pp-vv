import React, { useState, useEffect } from 'react';
import { FiSearch, FiFilter, FiShieldOff, FiTrash2, FiUser, FiCheckCircle } from 'react-icons/fi';
import './AdminUsers.css';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL, CLIENT, PROVIDER
  const [search, setSearch] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  useEffect(() => {
    fetchUsers();
  }, [filter]);

  const getHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('khidmati_token')}`,
    'Content-Type': 'application/json'
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/admin/users`;
      if (filter !== 'ALL') {
        url += `?role=${filter}`;
      }
      
      const res = await fetch(url, { headers: getHeaders() });
      const data = await res.json();
      
      if (data.success) {
        // Exclude ADMIN users in case the backend returns them
        const nonAdmins = data.data.filter(u => u.role !== 'ADMIN');
        setUsers(nonAdmins);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const suspendUser = async (userId) => {
    if (!window.confirm('Voulez-vous vraiment suspendre cet utilisateur ? (Il ne pourra plus se connecter)')) return;
    try {
      const res = await fetch(`${API_URL}/admin/users/${userId}/suspend`, {
        method: 'PATCH',
        headers: getHeaders(),
      });
      if (res.ok) fetchUsers();
    } catch (error) {
      console.error('Error suspending user:', error);
    }
  };

  const banUser = async (userId) => {
    if (!window.confirm('Voulez-vous vraiment BANNIR (supprimer) cet utilisateur ? Cette action est irréversible.')) return;
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

  const getRoleColor = (role) => {
    return role === 'PROVIDER' ? 'badge-primary' : 'badge-success';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'badge-success';
      case 'SUSPENDED': return 'badge-warning';
      case 'RESTRICTED': return 'badge-danger';
      case 'PENDING': return 'badge-primary';
      default: return 'badge-secondary';
    }
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
          <button 
            className={`filter-tab ${filter === 'ALL' ? 'active' : ''}`}
            onClick={() => setFilter('ALL')}
          >
            Tous
          </button>
          <button 
            className={`filter-tab ${filter === 'CLIENT' ? 'active' : ''}`}
            onClick={() => setFilter('CLIENT')}
          >
            Clients
          </button>
          <button 
            className={`filter-tab ${filter === 'PROVIDER' ? 'active' : ''}`}
            onClick={() => setFilter('PROVIDER')}
          >
            Prestataires
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loader-container">
          <div className="spinner"></div>
        </div>
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
                  <div className="avatar">
                    {user.name?.charAt(0) || 'U'}
                  </div>
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
                {user.role === 'PROVIDER' && user.token_balance !== undefined && (
                  <p className="user-tokens">Jetons: <strong>{user.token_balance}</strong></p>
                )}
              </div>

              <div className="user-card-footer">
                <button 
                  onClick={() => suspendUser(user.id)} 
                  className="btn btn-outline btn-sm text-warning"
                  title="Suspendre"
                  disabled={user.status === 'SUSPENDED'}
                >
                  <FiShieldOff /> {user.status === 'SUSPENDED' ? 'Suspendu' : 'Suspendre'}
                </button>
                <button 
                  onClick={() => banUser(user.id)} 
                  className="btn btn-outline btn-sm text-danger"
                  title="Bannir (Supprimer)"
                >
                  <FiTrash2 /> Bannir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
