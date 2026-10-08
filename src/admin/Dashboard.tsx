import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { adminApi, formatDate, STATUS_LABELS, type DashboardData } from './api';
import { ADMIN_PATH } from './route';

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi
      .dashboard()
      .then(setData)
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Could not load'));
  }, []);

  if (error) return <p className="admin-error">{error}</p>;
  if (!data) return <p className="admin-muted">Loading...</p>;

  const tiles = [
    { label: 'All enquiries', value: data.total },
    { label: 'Last 30 days', value: data.last_30_days },
    { label: 'New, not contacted', value: data.statusCounts.new },
    { label: 'Won', value: data.statusCounts.won },
  ];

  return (
    <div className="admin-page">
      <h1>Dashboard</h1>

      <div className="admin-tiles">
        {tiles.map((tile) => (
          <div className="admin-tile" key={tile.label}>
            <strong>{tile.value}</strong>
            <span>{tile.label}</span>
          </div>
        ))}
      </div>

      {data.topWebsiteType && <p className="admin-muted">Most requested: {data.topWebsiteType}</p>}

      <div className="admin-section-head">
        <h2>Latest enquiries</h2>
        <Link to={`${ADMIN_PATH}/enquiries`}>See all <ArrowUpRight size={14} /></Link>
      </div>

      {data.recent.length === 0 ? (
        <p className="admin-muted">No enquiries yet. They appear here the moment someone submits the contact form.</p>
      ) : (
        <ul className="admin-list">
          {data.recent.map((enquiry) => (
            <li key={enquiry.id}>
              <div>
                <strong>{enquiry.name}</strong>
                <span className="admin-muted">{enquiry.business || enquiry.website_type || 'No business name'}</span>
              </div>
              <div className="admin-list-meta">
                <span className={`admin-status status-${enquiry.status}`}>{STATUS_LABELS[enquiry.status]}</span>
                <span className="admin-muted">{formatDate(enquiry.created_at)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
