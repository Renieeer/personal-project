import { useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api.js';
import SortableList from './SortableList.jsx';

function CaptionInput({ image, onSave }) {
  const [caption, setCaption] = useState(image.caption || '');
  const dirty = caption !== (image.caption || '');

  return (
    <div className="admin-inline-form">
      <input
        type="text"
        value={caption}
        placeholder="Caption"
        aria-label="Caption"
        maxLength={300}
        onChange={(e) => setCaption(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            if (dirty) onSave(caption);
          }
        }}
      />
      <button type="button" className="admin-button admin-button--small admin-button--ghost" disabled={!dirty} onClick={() => onSave(caption)}>
        Save
      </button>
    </div>
  );
}

export default function ProjectGallery({ row }) {
  const [images, setImages] = useState([]);
  const [status, setStatus] = useState('loading');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    let active = true;
    api.get(`/admin/project_images?project_id=${row.id}`)
      .then((data) => {
        if (!active) return;
        setImages(data);
        setStatus('ready');
      })
      .catch((err) => active && setError(err.message));
    return () => {
      active = false;
    };
  }, [row.id]);

  const replace = (updated) => setImages((prev) => prev.map((img) => (img.id === updated.id ? updated : img)));

  const upload = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    setUploading(true);
    setError(null);
    try {
      const created = await api.upload('/admin/project_images/upload', { project_id: row.id, files });
      setImages((prev) => [...prev, ...created]);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const run = async (fn) => {
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(err.message);
    }
  };

  const reorder = (next) => run(async () => {
    const previous = images;
    setImages(next);
    try {
      await api.put('/admin/project_images/reorder', { ids: next.map((img) => img.id) });
    } catch (err) {
      setImages(previous);
      throw err;
    }
  });

  return (
    <section className="admin-gallery">
      <header className="admin-panel-head">
        <div>
          <h3 className="admin-editor-title">Gallery</h3>
          <p className="admin-muted admin-small">Shown on the project page. JPG, PNG, WebP or GIF, up to 5 MB each, 10 at a time.</p>
        </div>
        <button type="button" className="admin-button admin-button--ghost" disabled={uploading} onClick={() => inputRef.current?.click()}>
          {uploading ? 'Uploading…' : 'Add images'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          hidden
          onChange={(e) => {
            const { files } = e.target;
            upload(files).finally(() => {
              e.target.value = '';
            });
          }}
        />
      </header>

      {error && <p className="admin-alert" role="alert">{error}</p>}
      {status === 'loading' && !error && <p className="admin-muted">Loading…</p>}
      {status === 'ready' && images.length === 0 && <p className="admin-empty">No gallery images yet.</p>}

      {images.length > 0 && (
        <SortableList
          items={images}
          getKey={(img) => img.id}
          onReorder={reorder}
          renderItem={(img) => (
            <div className={`admin-row${img.is_visible ? '' : ' is-hidden'}`}>
              <img className="admin-row-thumb" src={img.image_url} alt="" loading="lazy" />
              <CaptionInput
                image={img}
                onSave={(caption) => run(async () => replace(await api.put(`/admin/project_images/${img.id}`, { caption })))}
              />
              <div className="admin-row-actions">
                <button
                  type="button"
                  className={`admin-toggle${img.is_visible ? ' is-on' : ''}`}
                  aria-pressed={img.is_visible}
                  onClick={() => run(async () => replace(await api.put(`/admin/project_images/${img.id}`, { is_visible: !img.is_visible })))}
                >
                  {img.is_visible ? 'Visible' : 'Hidden'}
                </button>
                <button
                  type="button"
                  className="admin-link-button admin-danger-text"
                  onClick={() => {
                    if (!window.confirm('Delete this image? This cannot be undone.')) return;
                    run(async () => {
                      await api.del(`/admin/project_images/${img.id}`);
                      setImages((prev) => prev.filter((i) => i.id !== img.id));
                    });
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        />
      )}
    </section>
  );
}
