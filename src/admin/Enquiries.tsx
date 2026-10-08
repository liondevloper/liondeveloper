import { useCallback, useEffect, useState } from 'react';
import { Download, Mail, MessageCircle, Search, Trash2, X } from 'lucide-react';
import {
  adminApi,
  formatDate,
  STATUS_LABELS,
  STATUS_ORDER,
  whatsappLink,
  type Enquiry,
  type EnquiryStatus,
} from './api';

export default function Enquiries() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [status, setStatus] = useState<EnquiryStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Enquiry | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setEnquiries(await adminApi.listEnquiries({ status, q: search }));
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load enquiries');
    } finally {
      setLoading(false);
    }
  }, [status, search]);

  useEffect(() => {
    const timer = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [load, search]);

  const applyChange = (updated: Enquiry) => {
    setEnquiries((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    setSelected((current) => (current && current.id === updated.id ? updated : current));
  };

  const remove = async (enquiry: Enquiry) => {
    if (!confirm(`Delete the enquiry from ${enquiry.name}? This cannot be undone.`)) return;
    await adminApi.deleteEnquiry(enquiry.id);
    setEnquiries((current) => current.filter((item) => item.id !== enquiry.id));
    setSelected(null);
  };

  return (
    <div className="admin-page">
      <div className="admin-section-head">
        <h1>Enquiries</h1>
        <a href="/api/enquiries/export">Export CSV <Download size={14} /></a>
      </div>

      <div className="admin-filters">
        <div className="admin-search">
          <Search size={15} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, business, number, email"
          />
        </div>
        <div className="admin-chips">
          {(['all', ...STATUS_ORDER] as const).map((value) => (
            <button
              key={value}
              className={status === value ? 'is-active' : ''}
              onClick={() => setStatus(value)}
              type="button"
            >
              {value === 'all' ? 'All' : STATUS_LABELS[value]}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="admin-error">{error}</p>}
      {loading && <p className="admin-muted">Loading...</p>}
      {!loading && enquiries.length === 0 && (
        <p className="admin-muted">Nothing here yet.</p>
      )}

      <ul className="admin-list">
        {enquiries.map((enquiry) => (
          <li key={enquiry.id} className="is-clickable" onClick={() => setSelected(enquiry)}>
            <div>
              <strong>{enquiry.name}</strong>
              <span className="admin-muted">
                {[enquiry.business, enquiry.website_type, enquiry.budget].filter(Boolean).join(' / ') || 'No details'}
              </span>
            </div>
            <div className="admin-list-meta">
              <span className={`admin-status status-${enquiry.status}`}>{STATUS_LABELS[enquiry.status]}</span>
              <span className="admin-muted">{formatDate(enquiry.created_at)}</span>
            </div>
          </li>
        ))}
      </ul>

      {selected && (
        <EnquiryDetail
          enquiry={selected}
          onClose={() => setSelected(null)}
          onChange={applyChange}
          onDelete={() => remove(selected)}
        />
      )}
    </div>
  );
}

function EnquiryDetail({
  enquiry,
  onClose,
  onChange,
  onDelete,
}: {
  enquiry: Enquiry;
  onClose: () => void;
  onChange: (updated: Enquiry) => void;
  onDelete: () => void;
}) {
  const [notes, setNotes] = useState(enquiry.notes);
  const [savedAt, setSavedAt] = useState('');
  const whatsapp = whatsappLink(enquiry.whatsapp);

  useEffect(() => {
    setNotes(enquiry.notes);
    setSavedAt('');
  }, [enquiry.id, enquiry.notes]);

  const setStatus = async (status: EnquiryStatus) => onChange(await adminApi.updateEnquiry(enquiry.id, { status }));

  const saveNotes = async () => {
    onChange(await adminApi.updateEnquiry(enquiry.id, { notes }));
    setSavedAt('Saved');
  };

  return (
    <div className="admin-drawer-backdrop" onClick={onClose}>
      <aside className="admin-drawer" onClick={(event) => event.stopPropagation()}>
        <button className="admin-drawer-close" onClick={onClose} type="button" aria-label="Close">
          <X size={18} />
        </button>

        <span className="admin-kicker">{formatDate(enquiry.created_at)}</span>
        <h2>{enquiry.name}</h2>
        {enquiry.business && <p className="admin-muted">{enquiry.business}</p>}

        <div className="admin-actions">
          {whatsapp && (
            <a className="admin-button" href={whatsapp} target="_blank" rel="noreferrer">
              <MessageCircle size={15} /> WhatsApp
            </a>
          )}
          {enquiry.email && (
            <a className="admin-button admin-button-ghost" href={`mailto:${enquiry.email}`}>
              <Mail size={15} /> Reply by email
            </a>
          )}
        </div>

        <dl className="admin-facts">
          <div><dt>WhatsApp</dt><dd>{enquiry.whatsapp || '—'}</dd></div>
          <div><dt>Email</dt><dd>{enquiry.email || '—'}</dd></div>
          <div><dt>Website type</dt><dd>{enquiry.website_type || '—'}</dd></div>
          <div><dt>Budget</dt><dd>{enquiry.budget || '—'}</dd></div>
        </dl>

        <h3>Project details</h3>
        <p className="admin-details">{enquiry.details}</p>

        <h3>Status</h3>
        <div className="admin-chips">
          {STATUS_ORDER.map((value) => (
            <button
              key={value}
              type="button"
              className={enquiry.status === value ? 'is-active' : ''}
              onClick={() => setStatus(value)}
            >
              {STATUS_LABELS[value]}
            </button>
          ))}
        </div>

        <h3>Private notes</h3>
        <textarea
          rows={4}
          value={notes}
          onChange={(event) => {
            setNotes(event.target.value);
            setSavedAt('');
          }}
          placeholder="Quote sent, follow up Monday..."
        />
        <div className="admin-actions">
          <button className="admin-button" type="button" onClick={saveNotes} disabled={notes === enquiry.notes}>
            Save notes
          </button>
          {savedAt && <span className="admin-muted">{savedAt}</span>}
        </div>

        <button className="admin-delete" type="button" onClick={onDelete}>
          <Trash2 size={14} /> Delete enquiry
        </button>
      </aside>
    </div>
  );
}
