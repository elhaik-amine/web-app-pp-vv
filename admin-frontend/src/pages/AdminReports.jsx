import React, { useEffect, useState } from 'react';
import { FiCheckCircle, FiClock, FiImage, FiShieldOff, FiX, FiXCircle } from 'react-icons/fi';
import './AdminReports.css';

const STATUS_OPTIONS = ['all', 'pending_review', 'under_admin_review', 'auto_resolved', 'resolved', 'rejected'];

const AdminReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [suspendModal, setSuspendModal] = useState(null);
  const [suspendDays, setSuspendDays] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  useEffect(() => {
    fetchReports();
  }, [filter]);

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('khidmati_token')}`,
    'Content-Type': 'application/json',
  });

  const formatDate = (date) => new Date(date).toLocaleDateString('fr-FR');
  const formatDateTime = (date) => new Date(date).toLocaleString('fr-FR');

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
    if (adminNotes === null) return;
    await updateReport(report.id, 'RESOLVED', adminNotes || '');
  };

  const rejectReport = async (report) => {
    const adminNotes = window.prompt('Pourquoi rejeter ce signalement ?', report.admin_notes || '');
    if (adminNotes === null) return;
    await updateReport(report.id, 'REJECTED', adminNotes || '');
  };

  const markUnderReview = async (report) => {
    await updateReport(report.id, 'UNDER_ADMIN_REVIEW', report.admin_notes || 'Escaladé pour revue manuelle');
  };

  const openSuspendModal = (user) => {
    if (!user?.id) return;
    setSuspendDays('');
    setSuspendModal(user);
  };

  const confirmSuspend = async () => {
    if (!suspendModal?.id) return;

    try {
      const payload = suspendDays ? { days: Number(suspendDays) } : {};
      const res = await fetch(`${API_URL}/admin/users/${suspendModal.id}/suspend`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSuspendModal(null);
        setSuspendDays('');
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

  const getBookingParty = (report, role) => {
    const isClient = role === 'client';
    const bookingParty = isClient ? report.booking?.client : report.booking?.provider;
    const fallbackId = isClient ? report.client_id : report.provider_id;
    const fallbackName = isClient ? report.client_name : report.provider_name;

    return {
      id: bookingParty?.id || fallbackId,
      name: bookingParty?.name || fallbackName || (isClient ? 'Client' : 'Prestataire'),
      role: isClient ? 'client' : 'prestataire',
    };
  };

  const renderPhotoStrip = (title, photos = []) => (
    <div className="case-photo-section">
      <div className="case-photo-title">
        <FiImage />
        <span>{title} ({photos.length})</span>
      </div>
      {photos.length > 0 ? (
        <div className="case-photo-grid">
          {photos.map((photo) => (
            <a key={photo.id || photo.url} href={photo.url} target="_blank" rel="noreferrer" className="case-photo-link">
              <img src={photo.url} alt={title} />
            </a>
          ))}
        </div>
      ) : (
        <p className="case-empty-text">Aucune photo.</p>
      )}
    </div>
  );

  return (
    <div className="reports-container animate-fade-in">
      <header className="page-header reports-header">
        <div>
          <h1>Signalements</h1>
          <p className="subtitle">Traitez les litiges avec preuves, délais et contexte de réservation.</p>
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
                    <span>{formatDateTime(report.created_at)}</span>
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
                  {report.date_meeting ? ` - ${formatDate(report.date_meeting)} - ${report.time_slot}` : ''}
                </p>
                <p className="reported-user">
                  Signalé : <strong>{report.reported_user_name || 'Utilisateur inconnu'}</strong>
                </p>
                <p className="report-description">{report.description || 'Aucune description fournie.'}</p>

                {report.booking && (
                  <div className="booking-case-box">
                    <div className="booking-case-header">
                      <strong>Réservation #{report.booking.id}</strong>
                      <span>{report.booking.status}</span>
                    </div>
                    <div className="booking-case-grid">
                      <span>Client</span>
                      <strong>{report.booking.client?.name || '-'}</strong>
                      <span>Prestataire</span>
                      <strong>{report.booking.provider?.name || '-'}</strong>
                      <span>Prix</span>
                      <strong>{report.booking.agreed_price || report.booking.estimated_price || 0} MAD</strong>
                      <span>Créneau</span>
                      <strong>
                        {report.booking.date_meeting
                          ? `${formatDate(report.booking.date_meeting)} - ${report.booking.time_slot}`
                          : '-'}
                      </strong>
                    </div>
                    {report.booking.notes && (
                      <p className="booking-notes">{report.booking.notes}</p>
                    )}
                  </div>
                )}

                {report.response_deadline && (
                  <div className="info-chip">
                    <FiClock />
                    <span>Réponse attendue avant {formatDateTime(report.response_deadline)}</span>
                  </div>
                )}

                {report.evidence_photo_url && (
                  <div className="case-photo-section">
                    <div className="case-photo-title">
                      <FiImage />
                      <span>Preuve du signalement</span>
                    </div>
                    <a className="evidence-preview" href={report.evidence_photo_url} target="_blank" rel="noreferrer">
                      <img src={report.evidence_photo_url} alt="Preuve du signalement" />
                    </a>
                  </div>
                )}

                {report.booking && (
                  <div className="case-photos-wrapper">
                    {renderPhotoStrip('Photos avant client', report.booking.photos?.before)}
                    {renderPhotoStrip('Photos après prestataire', report.booking.photos?.after)}
                  </div>
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
                    {report.booking ? (
                      <div className="moderation-group suspend-group">
                        <span className="action-group-label">Suspendre</span>
                        <button
                          onClick={() => openSuspendModal(getBookingParty(report, 'client'))}
                          className="btn btn-sm suspend-choice"
                          title="Suspendre le client"
                        >
                          <FiShieldOff /> Le client
                        </button>
                        <button
                          onClick={() => openSuspendModal(getBookingParty(report, 'provider'))}
                          className="btn btn-sm suspend-choice"
                          title="Suspendre le prestataire"
                        >
                          <FiShieldOff /> Le prestataire
                        </button>
                      </div>
                    ) : (
                      <div className="moderation-group suspend-group">
                        <span className="action-group-label">Suspendre</span>
                        <button
                          onClick={() => openSuspendModal({
                            id: report.reported_user_id,
                            name: report.reported_user_name || 'Utilisateur signalé',
                            role: 'utilisateur signalé',
                          })}
                          className="btn btn-sm suspend-choice"
                          title="Suspendre l'utilisateur signalé"
                        >
                          <FiShieldOff /> Utilisateur
                        </button>
                      </div>
                    )}
                    <div className="moderation-group decision-group">
                      {report.status !== 'UNDER_ADMIN_REVIEW' && (
                        <button onClick={() => markUnderReview(report)} className="btn btn-outline btn-sm">
                          <FiClock /> Revue
                        </button>
                      )}
                      <button onClick={() => rejectReport(report)} className="btn btn-outline btn-sm">
                        <FiXCircle /> Rejeter
                      </button>
                      <button onClick={() => resolveReport(report)} className="btn btn-secondary btn-sm">
                        <FiCheckCircle /> Résoudre
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {suspendModal && (
        <div className="modal-overlay" onClick={() => setSuspendModal(null)}>
          <div className="modal-box glass-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Suspendre {suspendModal.role}</h3>
              <button className="modal-close" onClick={() => setSuspendModal(null)}><FiX /></button>
            </div>
            <p className="modal-subtitle">
              Utilisateur : <strong>{suspendModal.name}</strong>. Choisissez le nombre de jours, ou laissez vide pour une suspension indéfinie.
            </p>
            <div className="modal-input-group">
              <label>Nombre de jours</label>
              <input
                type="number"
                min="1"
                max="365"
                placeholder="Ex: 7 (vide = indéfini)"
                value={suspendDays}
                onChange={(event) => setSuspendDays(event.target.value)}
                className="input-field"
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setSuspendModal(null)}>Annuler</button>
              <button className="btn btn-warning" onClick={confirmSuspend}>
                {suspendDays ? `Suspendre ${suspendDays} jour(s)` : 'Suspendre indéfiniment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReports;
