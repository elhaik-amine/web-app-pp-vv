import React, { useEffect, useState } from 'react';
import { FiCheckCircle, FiClock, FiImage, FiShieldOff, FiXCircle } from 'react-icons/fi';
import './AdminReports.css';

const STATUS_OPTIONS = ['all', 'pending_review', 'under_admin_review', 'auto_resolved', 'resolved', 'rejected'];

const AdminReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  useEffect(() => {
    fetchReports();
  }, [filter]);

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('khidmati_token')}`,
    'Content-Type': 'application/json',
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

  const updateReport = async (reportId, status, adminNotes = '') => {
    try {
      const res = await fetch(`${API_URL}/admin/reports/${reportId}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status, admin_notes: adminNotes || null }),
      });

      if (res.ok) {
        fetchReports();
      }
    } catch (error) {
      console.error('Error updating report:', error);
    }
  };

  const resolveReport = async (report) => {
    const adminNotes = window.prompt('Notes admin pour cette résolution (optionnel) :', report.admin_notes || '');
    await updateReport(report.id, 'RESOLVED', adminNotes || '');
  };

  const rejectReport = async (report) => {
    const adminNotes = window.prompt('Pourquoi rejeter ce signalement ?', report.admin_notes || '');
    await updateReport(report.id, 'REJECTED', adminNotes || '');
  };

  const markUnderReview = async (report) => {
    await updateReport(report.id, 'UNDER_ADMIN_REVIEW', report.admin_notes || 'Escaladé pour revue manuelle');
  };

  const suspendUser = async (userId) => {
    if (!window.confirm('Suspendre cet utilisateur ? Cette action reste réversible.')) return;

    try {
      const res = await fetch(`${API_URL}/admin/users/${userId}/suspend`, {
        method: 'PATCH',
        headers: getHeaders(),
      });
      if (res.ok) {
        fetchReports();
      }
    } catch (error) {
      console.error('Error suspending user:', error);
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'NOSHOW':
        return 'badge-danger';
      case 'ABSENT':
        return 'badge-warning';
      case 'OTHER':
        return 'badge-primary';
      default:
        return 'badge-secondary';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING_REVIEW':
        return 'badge-warning';
      case 'UNDER_ADMIN_REVIEW':
        return 'badge-primary';
      case 'AUTO_RESOLVED':
      case 'RESOLVED':
        return 'badge-success';
      case 'REJECTED':
        return 'badge-danger';
      case 'PENDING':
        return 'badge-warning';
      default:
        return 'badge-secondary';
    }
  };

  return (
    <div className="reports-container animate-fade-in">
      <header className="page-header reports-header">
        <div>
          <h1>Signalements</h1>
          <p className="subtitle">Traitez les litiges d'absence avec preuves, délais et contexte de réservation.</p>
        </div>
        <div className="filter-tabs glass-card">
          {STATUS_OPTIONS.map((value) => (
            <button
              key={value}
              className={`filter-tab ${filter === value ? 'active' : ''}`}
              onClick={() => setFilter(value)}
            >
              {value === 'all' ? 'Tous' : value.replaceAll('_', ' ')}
            </button>
          ))}
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
          <p>Aucun dossier ne correspond à ce filtre.</p>
        </div>
      ) : (
        <div className="reports-grid">
          {reports.map((report) => (
            <div key={report.id} className="report-card glass-card">
              <div className="report-card-header">
                <div className="reporter-info">
                  <div className="avatar">{report.reporter_name?.charAt(0) || 'R'}</div>
                  <div>
                    <h4>{report.reporter_name || 'Anonyme'}</h4>
                    <span>{new Date(report.created_at).toLocaleString()}</span>
                  </div>
                </div>
                <div className="badge-stack">
                  <span className={`badge ${getTypeColor(report.type)}`}>{report.type}</span>
                  <span className={`badge ${getStatusColor(report.status)}`}>{report.status}</span>
                </div>
              </div>

              <div className="report-card-body">
                <p className="report-meta">
                  Réservation <strong>#{report.booking_id || '-'}</strong>
                  {report.date_meeting ? ` • ${new Date(report.date_meeting).toLocaleDateString()} • ${report.time_slot}` : ''}
                </p>
                <p className="reported-user">
                  Signalé : <strong>{report.reported_user_name || 'Utilisateur inconnu'}</strong>
                </p>
                <p className="report-description">{report.description || 'Aucune description fournie.'}</p>

                {report.response_deadline && (
                  <div className="info-chip">
                    <FiClock />
                    <span>Réponse attendue avant {new Date(report.response_deadline).toLocaleString()}</span>
                  </div>
                )}

                {report.evidence_photo_url && (
                  <a className="evidence-link" href={report.evidence_photo_url} target="_blank" rel="noreferrer">
                    <FiImage />
                    <span>Voir la photo preuve</span>
                  </a>
                )}

                {report.resolution_reason && (
                  <p className="admin-note">Motif : {report.resolution_reason}</p>
                )}

                {report.admin_notes && (
                  <p className="admin-note">Notes admin : {report.admin_notes}</p>
                )}
              </div>

              <div className="report-card-footer">
                {['PENDING_REVIEW', 'UNDER_ADMIN_REVIEW', 'PENDING'].includes(report.status) && (
                  <>
                    <button
                      onClick={() => suspendUser(report.reported_user_id)}
                      className="btn btn-outline btn-sm text-danger"
                      title="Suspendre l'utilisateur signalé"
                    >
                      <FiShieldOff /> Suspendre
                    </button>
                    {report.status !== 'UNDER_ADMIN_REVIEW' && (
                      <button onClick={() => markUnderReview(report)} className="btn btn-outline btn-sm">
                        <FiClock /> Revue admin
                      </button>
                    )}
                    <button onClick={() => rejectReport(report)} className="btn btn-outline btn-sm">
                      <FiXCircle /> Rejeter
                    </button>
                    <button onClick={() => resolveReport(report)} className="btn btn-secondary btn-sm">
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
