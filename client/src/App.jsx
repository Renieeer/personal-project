import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import { SiteDataProvider } from './lib/siteData.jsx';
import PublicLayout from './components/PublicLayout.jsx';
import Home from './pages/Home.jsx';
import ProjectDetail from './pages/ProjectDetail.jsx';
import NotFound from './pages/NotFound.jsx';

// The admin panel is a separate chunk, so visitors never download it.
const AdminApp = lazy(() => import('./admin/AdminApp.jsx'));

export default function App() {
  return (
    <Routes>
      <Route
        path="/admin/*"
        element={(
          <Suspense fallback={<div className="admin-boot">Loading…</div>}>
            <AdminApp />
          </Suspense>
        )}
      />
      <Route element={<SiteDataProvider><PublicLayout /></SiteDataProvider>}>
        <Route index element={<Home />} />
        <Route path="projects/:slug" element={<ProjectDetail />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
