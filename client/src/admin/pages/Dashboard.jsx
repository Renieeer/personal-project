import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { formatDateTime } from '../../lib/format.js';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/admin/stats').then(setStats).catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="admin-alert" role="alert">{error}</p>;
  if (!stats) return <p className="admin-muted">Loading…</p>;

  const { counts, recent_messages: recent } = stats;
  const primary = [
    { label: 'Projects', value: counts.projects, to: '/admin/projects' },
    { label: 'Messages', value: counts.messages, to: '/admin/inbox' },
    { label: 'Unread', value: counts.unread, to: '/admin/inbox', accent: counts.unread > 0 },
  ];
  const secondary = [
    ['Skills', counts.skills, '/admin/skills'],
    ['Experience', counts.experience, '/admin/experience'],
    ['Certificates', counts.certificates, '/admin/certificates'],
    ['Testimonials', counts.testimonials, '/admin/testimonials'],
  ];

  return (
    <section className="admin-panel">
      <header className="admin-panel-head">
        <div>
          <h1 className="admin-title">Dashboard</h1>
          <p className="admin-muted">Click anything on your site to change it in the live editor.</p>
        </div>
        <Link className="admin-button" to="/admin/editor">Open live editor</Link>
      </header>

      <dl className="admin-stats">
        {primary.map((stat) => (
          <div key={stat.label} className={stat.accent ? 'is-accent' : undefined}>
            <dt><Link to={stat.to}>{stat.label}</Link></dt>
            <dd>{stat.value}</dd>
          </div>
        ))}
      </dl>

      <dl className="admin-stats-secondary">
        {secondary.map(([label, value, to]) => (
          <div key={label}>
            <dt><Link to={to}>{label}</Link></dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      <h2 className="admin-subtitle">Recent messages</h2>
      {recent.length === 0 ? (
        <p className="admin-empty">No messages yet.</p>
      ) : (
        <ul className="admin-simple-list">
          {recent.map((message) => (
            <li key={message.id} className={message.is_read ? undefined : 'is-unread'}>
              <Link to={`/admin/inbox?open=${message.id}`}>
                <strong>{message.name}</strong>
                <span>{message.subject || '(no subject)'}</span>
              </Link>
              <span className="admin-muted admin-small">{formatDateTime(message.created_at)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
