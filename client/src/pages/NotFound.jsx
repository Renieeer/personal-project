import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useText } from '../lib/uiText.js';

export default function NotFound() {
  const text = useText();
  const title = text('not_found_title');

  useEffect(() => {
    document.title = title.replace(/\.$/, '');
  }, [title]);

  return (
    <div className="container status-page">
      <p className="section-index">404</p>
      <h1 className="status-title">{title}</h1>
      <Link to="/" className="text-link">{text('not_found_link')}</Link>
    </div>
  );
}
