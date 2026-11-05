import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSiteData } from '../lib/siteData.jsx';
import { useText } from '../lib/uiText.js';
import { ProjectSkeleton } from '../components/Skeleton.jsx';
import Prose from '../components/Prose.jsx';
import LoadError from '../components/LoadError.jsx';
import NotFound from './NotFound.jsx';

// The resume text pasted in the admin panel. Without any, the page doesn't exist.
export default function Resume() {
  const { status, data } = useSiteData();
  const text = useText();
  const profile = data?.profile;
  const title = text('resume_title');
  const siteTitle = data?.settings?.site_title;
  const hasResume = Boolean(profile?.resume_text);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (hasResume) document.title = [title, siteTitle].filter(Boolean).join(' — ');
  }, [hasResume, title, siteTitle]);

  if (status === 'loading') return <ProjectSkeleton />;
  if (status === 'error') return <LoadError />;
  if (!hasResume) return <NotFound />;

  return (
    <article className="project-page resume-page">
      <div className="container">
        <Link to="/" className="text-link back-link">{text('resume_back')}</Link>

        <header className="project-header">
          <h1 className="project-page-title">{title}</h1>
          <div className="resume-actions">
            <button type="button" className="button" onClick={() => window.print()}>{text('resume_print')}</button>
            {profile.cv_url && (
              <a className="text-link" href={profile.cv_url} target="_blank" rel="noreferrer" download>{text('resume_download')}</a>
            )}
          </div>
        </header>

        <Prose text={profile.resume_text} className="prose resume-text" />
      </div>
    </article>
  );
}
