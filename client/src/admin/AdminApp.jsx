import { Suspense, lazy, useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './AuthContext.jsx';
import RequireAuth from './RequireAuth.jsx';
import AdminLayout from './AdminLayout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Inbox from './pages/Inbox.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import SectionsPage from './pages/SectionsPage.jsx';
import SkillsPage from './pages/SkillsPage.jsx';
import CollectionPage from './pages/CollectionPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import PasswordPage from './pages/PasswordPage.jsx';
import '../styles/admin.css';

// The live editor is its own chunk: the other admin pages don't need it.
const LiveEditor = lazy(() => import('./editor/LiveEditor.jsx'));

export default function AdminApp() {
  useEffect(() => {
    document.title = 'Admin';
    let robots = document.querySelector('meta[name="robots"]');
    if (!robots) {
      robots = document.createElement('meta');
      robots.name = 'robots';
      document.head.appendChild(robots);
    }
    robots.content = 'noindex, nofollow';
  }, []);

  return (
    <AuthProvider>
      <Routes>
        <Route path="login" element={<Login />} />
        <Route
          path="editor"
          element={(
            <RequireAuth>
              <Suspense fallback={<div className="admin-boot">Loading…</div>}>
                <LiveEditor />
              </Suspense>
            </RequireAuth>
          )}
        />
        <Route element={<RequireAuth><AdminLayout /></RequireAuth>}>
          <Route index element={<Dashboard />} />
          <Route path="inbox" element={<Inbox />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="sections" element={<SectionsPage />} />
          <Route path="skills" element={<SkillsPage />} />
          <Route path="experience" element={<CollectionPage key="experience" resource="experience" />} />
          <Route path="education" element={<CollectionPage key="education" resource="education" />} />
          <Route path="projects" element={<CollectionPage key="projects" resource="projects" />} />
          <Route path="certificates" element={<CollectionPage key="certificates" resource="certificates" />} />
          <Route path="testimonials" element={<CollectionPage key="testimonials" resource="testimonials" />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="password" element={<PasswordPage />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
