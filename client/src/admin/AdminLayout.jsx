import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';

const NAV = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/editor', label: 'Live editor' },
  { to: '/admin/inbox', label: 'Inbox' },
  { group: 'Content' },
  { to: '/admin/profile', label: 'Profile & links' },
  { to: '/admin/sections', label: 'Sections' },
  { to: '/admin/skills', label: 'Skills' },
  { to: '/admin/experience', label: 'Experience' },
  { to: '/admin/education', label: 'Education' },
  { to: '/admin/projects', label: 'Projects' },
  { to: '/admin/certificates', label: 'Certificates' },
  { to: '/admin/testimonials', label: 'Testimonials' },
  { group: 'Site' },
  { to: '/admin/settings', label: 'Settings' },
  { to: '/admin/password', label: 'Password' },
];

export default function AdminLayout() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <div className="admin">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span>Admin</span>
          <button
            type="button"
            className="admin-menu-button"
            aria-expanded={open}
            aria-controls="admin-nav"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? 'Close' : 'Menu'}
          </button>
        </div>
        <div id="admin-nav" className={`admin-nav-wrap${open ? ' is-open' : ''}`}>
          <nav className="admin-nav" aria-label="Admin">
            {NAV.map((item) => (item.group
              ? <p key={item.group} className="admin-nav-group">{item.group}</p>
              : <NavLink key={item.to} to={item.to} end={item.end}>{item.label}</NavLink>))}
          </nav>
          <div className="admin-sidebar-foot">
            <a href="/" target="_blank" rel="noreferrer">View site</a>
            <ThemeToggle className="admin-link-button" />
            <button type="button" className="admin-link-button" onClick={signOut}>Sign out</button>
            <p className="admin-muted admin-small">{user?.email}</p>
          </div>
        </div>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
