import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiCalendar, FiAlertCircle, FiUsers, FiUserCheck, FiCheck, FiX, FiChevronRight } from 'react-icons/fi';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [pendingProviders, setPendingProviders] = useState([]);
  const [pendingReports, setPendingReports] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchDashboardData(),
      fetchPendingProviders(),
      fetchPendingReports(),
      fetchRecentBookings()
    ]);
    setLoading(false);
  };

  const getHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('khidmati_token')}`,
    'Content-Type': 'application/json'
  });

  const fetchDashboardData = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/dashboard`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) setDashboardData(data.data);
    } catch (err) { console.error(err); }
  };

  const fetchPendingProviders = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/users?role=PROVIDER&status=PENDING`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) setPendingProviders(data.data);
    } catch (err) { console.error(err); }
  };

  const fetchPendingReports = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/reports?status=PENDING`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) setPendingReports(data.data);
    } catch (err) { console.error(err); }
  };

  const fetchRecentBookings = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/bookings`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) setRecentBookings(data.data.slice(0, 5));
    } catch (err) { console.error(err); }
  };

  const approveProvider = async (userId) => {
    if (!window.confirm('Approuver ce prestataire ?')) return;
    try {
      const res = await fetch(`${API_URL}/admin/users/${userId}/verify`, { method: 'PATCH', headers: getHeaders() });
      if (res.ok) {
        fetchPendingProviders();
        fetchDashboardData();
      }
    } catch (err) { console.error(err); }
  };

  const rejectProvider = async (userId) => {
    if (!window.confirm('Refuser ce prestataire ?')) return;
    try {
      const res = await fetch(`${API_URL}/admin/users/${userId}`, { method: 'DELETE', headers: getHeaders() });
      if (res.ok) {
        fetchPendingProviders();
      }
    } catch (err) { console.error(err); }
  };

  const resolveReport = async (reportId) => {
    try {
      const res = await fetch(`${API_URL}/admin/reports/${reportId}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status: 'RESOLVED' })
      });
      if (res.ok) {
        fetchPendingReports();
      }
    } catch (err) { console.error(err); }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'CONFIRMED': return 'badge-primary';
      case 'COMPLETED': return 'badge-success';
      case 'CANCELLED': return 'badge-danger';
      case 'PENDING': return 'badge-warning';
      default: return 'badge-primary'; // fallback
    }
  };

  if (loading && !dashboardData) {
    return (
      <div className="loader-container">
        <div className="spinner"></div>
        <p>Chargement du dashboard...</p>
      </div>
    );
  }

  const kpis = [
    { id: 1, label: 'Réservations', value: dashboardData?.total_bookings || 0, icon: FiCalendar, colorClass: 'primary' },
    { id: 2, label: 'Signalements', value: pendingReports.length, icon: FiAlertCircle, colorClass: 'danger' },
    { id: 3, label: 'Utilisateurs', value: dashboardData?.total_users || 0, icon: FiUsers, colorClass: 'success' },
    { id: 4, label: 'En attente', value: pendingProviders.length, icon: FiUserCheck, colorClass: 'warning' }
  ];

  return (
    <div className="dashboard-container animate-fade-in">
      <header className="page-header">
        <h1>Dashboard Overview</h1>
        <p className="subtitle">Welcome back, Admin</p>
      </header>

      <div className="kpi-grid">
        {kpis.map((kpi) => (
          <div key={kpi.id} className={`kpi-card glass-card kpi-${kpi.colorClass}`}>
            <div className="kpi-icon-wrapper">
              <kpi.icon size={24} />
            </div>
            <div className="kpi-info">
              <h3>{kpi.value}</h3>
              <p>{kpi.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        {/* Left Column */}
        <div className="dashboard-col">
          {pendingProviders.length > 0 && (
            <section className="dashboard-section glass-card">
              <div className="section-header">
                <h2>Prestataires en attente</h2>
                <span className="badge badge-warning">{pendingProviders.length}</span>
              </div>
              <div className="list-container">
                {pendingProviders.map(provider => (
                  <div key={provider.id} className="list-item">
                    <div className="item-avatar">
                      {provider.name?.charAt(0) || 'P'}
                    </div>
                    <div className="item-details">
                      <h4>{provider.name}</h4>
                      <p>{provider.email}</p>
                      <small>Inscrit le {new Date(provider.created_at).toLocaleDateString()}</small>
                    </div>
                    <div className="item-actions">
                      <button onClick={() => rejectProvider(provider.id)} className="btn btn-danger btn-icon" title="Refuser">
                        <FiX size={18} />
                      </button>
                      <button onClick={() => approveProvider(provider.id)} className="btn btn-secondary btn-icon" title="Approuver">
                        <FiCheck size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {pendingReports.length > 0 && (
            <section className="dashboard-section glass-card">
              <div className="section-header">
                <h2>Signalements récents</h2>
                <Link to="/reports" className="btn btn-outline btn-sm">Voir tout</Link>
              </div>
              <div className="list-container">
                {pendingReports.slice(0, 3).map(report => (
                  <div key={report.id} className="list-item report-item">
                    <div className="report-header">
                      <span className="reporter">{report.reporter_name}</span>
                      <span className="badge badge-danger">{report.type}</span>
                    </div>
                    <p className="report-desc">{report.description}</p>
                    <div className="report-footer">
                      <button onClick={() => resolveReport(report.id)} className="btn btn-secondary btn-sm">
                        Résoudre
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right Column */}
        <div className="dashboard-col">
          <section className="dashboard-section glass-card">
            <div className="section-header">
              <h2>Dernières réservations</h2>
            </div>
            <div className="list-container activity-list">
              {recentBookings.length > 0 ? recentBookings.map(booking => (
                <div key={booking.id} className="activity-item">
                  <div className="activity-info">
                    <h4>{booking.category_name || 'Service'}</h4>
                    <p>{booking.client_name} • {new Date(booking.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="activity-status">
                    <span className={`badge ${getStatusColor(booking.status)}`}>{booking.status}</span>
                  </div>
                </div>
              )) : (
                <div className="empty-state">Aucune réservation récente</div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
