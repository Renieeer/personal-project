import { useEffect, useRef } from 'react';
import { useText } from '../lib/uiText.js';

export default function Lightbox({ images, index, onChange, onClose }) {
  const closeRef = useRef(null);
  const text = useText();
  const count = images.length;
  const image = images[index];

  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus?.();
    };
  }, []);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
      else if (event.key === 'ArrowRight' && count > 1) onChange((index + 1) % count);
      else if (event.key === 'ArrowLeft' && count > 1) onChange((index - 1 + count) % count);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, count, onChange, onClose]);

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label="Image viewer">
      <div className="lightbox-bar">
        <span className="lightbox-count">{index + 1} / {count}</span>
        <button ref={closeRef} type="button" className="plain-button text-link" onClick={onClose}>{text('lightbox_close')}</button>
      </div>
      <figure className="lightbox-figure" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <img src={image.image_url} alt={image.caption || ''} />
        {image.caption && <figcaption>{image.caption}</figcaption>}
      </figure>
      {count > 1 && (
        <div className="lightbox-nav">
          <button type="button" className="plain-button text-link" onClick={() => onChange((index - 1 + count) % count)}>
            {text('lightbox_previous')}
          </button>
          <button type="button" className="plain-button text-link" onClick={() => onChange((index + 1) % count)}>
            {text('lightbox_next')}
          </button>
        </div>
      )}
    </div>
  );
}
