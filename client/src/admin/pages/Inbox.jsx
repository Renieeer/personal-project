import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { formatDateTime } from '../../lib/format.js';

export default function Inbox() {
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = Number(searchParams.get('open')) || null;
  const selected = messages.find((m) => m.id === selectedId) || null;
  const unread = messages.filter((m) => !m.is_read).length;

  useEffect(() => {
    api.get('/admin/messages')
      .then((data) => {
        setMessages(data);
        setStatus('ready');
      })
      .catch((err) => {
        setError(err.message);
        setStatus('error');
      });
  }, []);

  const setRead = async (message, isRead) => {
    setError(null);
    try {
      const updated = await api.patch(`/admin/messages/${message.id}`, { is_read: isRead });
      setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    } catch (err) {
      setError(err.message);
    }
  };

  // Opening a message marks it as read.
  useEffect(() => {
    if (selected && !selected.is_read) setRead(selected, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  const open = (id) => setSearchParams(id ? { open: String(id) } : {});

  const remove = async (message) => {
    if (!window.confirm(`Delete the message from ${message.name}? This cannot be undone.`)) return;
    setError(null);
    try {
      await api.del(`/admin/messages/${message.id}`);
      setMessages((prev) => prev.filter((m) => m.id !== message.id));
      open(null);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="admin-panel">
      <header className="admin-panel-head">
        <div>
          <h1 className="admin-title">Inbox</h1>
          <p className="admin-muted">
            {messages.length} {messages.length === 1 ? 'message' : 'messages'}, {unread} unread
          </p>
        </div>
      </header>

      {error && <p className="admin-alert" role="alert">{error}</p>}
      {status === 'loading' && <p className="admin-muted">Loading…</p>}
      {status === 'ready' && messages.length === 0 && <p className="admin-empty">No messages yet.</p>}

      {messages.length > 0 && (
        <div className={`admin-inbox${selected ? ' has-selection' : ''}`}>
          <ul className="admin-inbox-list">
            {messages.map((message) => (
              <li key={message.id}>
                <button
                  type="button"
                  className={`admin-inbox-item${message.is_read ? '' : ' is-unread'}${message.id === selectedId ? ' is-active' : ''}`}
                  onClick={() => open(message.id)}
                >
                  <span className="admin-inbox-from">{message.name}</span>
                  <span className="admin-inbox-subject">{message.subject || '(no subject)'}</span>
                  <span className="admin-muted admin-small">{formatDateTime(message.created_at)}</span>
                </button>
              </li>
            ))}
          </ul>

          <div className="admin-inbox-detail">
            {selected ? (
              <article>
                <button type="button" className="admin-link-button admin-inbox-back" onClick={() => open(null)}>
                  Back to list
                </button>
                <h2 className="admin-subtitle">{selected.subject || '(no subject)'}</h2>
                <p className="admin-inbox-meta">
                  <strong>{selected.name}</strong>{' '}
                  <a href={`mailto:${selected.email}`}>{selected.email}</a>
                  <span className="admin-muted"> · {formatDateTime(selected.created_at)}</span>
                </p>
                <p className="admin-inbox-body">{selected.body}</p>
                <div className="admin-form-actions">
                  <a
                    className="admin-button"
                    href={`mailto:${selected.email}?subject=${encodeURIComponent(`Re: ${selected.subject || ''}`)}`}
                  >
                    Reply by email
                  </a>
                  <button type="button" className="admin-button admin-button--ghost" onClick={() => setRead(selected, !selected.is_read)}>
                    Mark as {selected.is_read ? 'unread' : 'read'}
                  </button>
                  <button type="button" className="admin-button admin-button--danger" onClick={() => remove(selected)}>
                    Delete
                  </button>
                </div>
              </article>
            ) : (
              <p className="admin-muted">Select a message to read it.</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
