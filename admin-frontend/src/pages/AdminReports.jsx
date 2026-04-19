import React, { useState, useEffect } from 'react';
import { FiFilter, FiCheckCircle, FiShieldOff, FiSearch } from 'react-icons/fi';
import './AdminReports.css';

const AdminReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  useEffect(() => {
    fetchReports();
  }, [filter]);

  const getHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('khidmati_token')}`,
    'Content-Type': 'application/json'
  });

  const fetchReports = async () => {
    setLoading(true);
    try {
      const status = filter === 'all' ? '' : filter.toUpperCase();
      const url = status ? `${API_URL}/admin/reports?status=${status}` : `${API_URL}/admin/reports`;
      
      const res = await fetch(url, { headers: getHeaders() });
      const data = await res.json();
      
      if (data.success) {
        setReports(data.data);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const resolveReport = async (reportId) => {
    if (!window.confirm('Marquer ce signalement comme résolu ?')) return;
    try {
      const res = await fetch(`${API_URL}/admin/reports/${reportId}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status: 'RESOLVED' }),
      });
      if (res.ok) fetchReports();
    } catch (error) {
      console.error('Error resolving report:', error);
    }
  };

  const suspendUser = async (userId) => {
    if (!window.confirm('Suspendre cet utilisateur ? Cette action est réversible.')) return;
    try {
      const res = await fetch(`${API_URL}/admin/users/${userId}/suspend`, {
        method: 'PATCH',
        headers: getHeaders(),
      });
      if (res.ok) fetchReports();
    } catch (error) {
      console.error('Error suspending user:', error);
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'NOSHOW': return 'badge-danger';
      case 'ABSENT': return 'badge-warning';
      case 'OTHER': return 'badge-primary';
      default: return 'badge-secondary';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'badge-warning';
      case 'REVIEWED': return 'badge-primary';
      case 'RESOLVED': return 'badge-success';
      default: return 'badge-secondary';
    }
  };

  return (
    <div className="reports-container animate-fade-in">
      <header className="page-header reports-header">
        <div>
          <h1>Signalements</h1>
          <p className="subtitle">Gérez les signalements et modérez les utilisateurs</p>
        </div>
        <div className="filter-group">
          <div className="filter-tabs glass-card">
            <button 
              className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              Tous
            </button>
            <button 
              className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
              onClick={() => setFilter('pending')}
            >
              En attente
            </button>
            <button 
              className={`filter-tab ${filter === 'resolved' ? 'active' : ''}`}
              onClick={() => setFilter('resolved')}
            >
              Résolus
            </button>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="loader-container">
          <div className="spinner"></div>
        </div>
      ) : reports.length === 0 ? (
        <div className="empty-state glass-card">
          <FiCheckCircle size={48} color="var(--secondary)" />
          <h3>Aucun signalement</h3>
          <p>{filter === 'pending' ? 'Aucun signalement en attente.' : 'Tout est propre ici.'}</p>
        </div>
      ) : (
        <div className="reports-grid">
          {reports.map((report) => (
            <div key={report.id} className="report-card glass-card">
              <div className="report-card-header">
                <div className="reporter-info">
                  <div className="avatar">
                    {report.reporter_name?.charAt(0) || 'R'}
                  </div>
                  <div>
                    <h4>{report.reporter_name || 'Anonyme'}</h4>
                    <span>{new Date(report.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <span className={`badge ${getTypeColor(report.type)}`}>
                  {report.type}
                </span>
              </div>
              
              <div className="report-card-body">
                <p className="reported-user">
                  Signalé: <strong>{report.reported_user_name || 'Utilisateur inconnu'}</strong>
                </p>
                <p className="report-description">
                  {report.description || 'Aucune description fournie.'}
                </p>
                <div className="report-status">
                  <span className={`badge ${getStatusColor(report.status)}`}>
                    {report.status}
                  </span>
                </div>
              </div>

              <div className="report-card-footer">
                {report.status === 'PENDING' && (
                  <>
                    <button 
                      onClick={() => suspendUser(report.reported_user_id)} 
                      className="btn btn-outline btn-sm text-danger"
                      title="Suspendre l'utilisateur"
                    >
                      <FiShieldOff /> Suspendre
                    </button>
                    <button 
                      onClick={() => resolveReport(report.id)} 
                      className="btn btn-secondary btn-sm"
                    >
                      <FiCheckCircle /> Résoudre
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminReports;
