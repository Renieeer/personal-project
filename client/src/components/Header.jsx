import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSiteData } from '../lib/siteData.jsx';
import { useText } from '../lib/uiText.js';
import { useEditor } from '../lib/edit.jsx';
import { getRenderableSections } from './sections.js';
import ThemeToggle from './ThemeToggle.jsx';
import { Skeleton } from './Skeleton.jsx';

export default function Header() {
  const { status, data } = useSiteData();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const text = useText();
  const editor = useEditor();

  useEffect(() => setOpen(false), [location]);

  // While the full-screen menu is open the page behind it stays put.
  // Escape closes it, and so does widening past the desktop breakpoint.
  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const desktop = window.matchMedia('(min-width: 1024px)');
    const onResize = () => {
      if (desktop.matches) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    desktop.addEventListener('change', onResize);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
      desktop.removeEventListener('change', onResize);
    };
  }, [open]);

  const links = status === 'ready'
    ? getRenderableSections(data).filter((section) => section.key !== 'hero')
    : [];

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link to="/" className="brand">
          {status === 'loading' ? <Skeleton width="9rem" height="1.1rem" /> : data?.profile?.full_name}
        </Link>
        <button
          type="button"
          className="menu-button plain-button"
          aria-expanded={open}
          aria-controls="site-nav"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? text('nav_close') : text('nav_menu')}
        </button>
        <nav id="site-nav" className={`site-nav${open ? ' is-open' : ''}`} aria-label="Primary">
          <ul>
            {links.map((section) => (
              <li key={section.key}>
                <Link to={`/#${section.key}`}>{section.title}</Link>
              </li>
            ))}
          </ul>
          {/* Five quick taps open the admin; off inside the admin's live editor. */}
          <ThemeToggle entryPath={editor ? undefined : '/admin'} />
        </nav>
      </div>
    </header>
  );
}
