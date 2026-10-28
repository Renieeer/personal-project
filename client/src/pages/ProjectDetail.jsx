import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import { useSiteData } from '../lib/siteData.jsx';
import { useText } from '../lib/uiText.js';
import { EditAdd, EditFile, EditItem, EditText, useEditor } from '../lib/edit.jsx';
import { ProjectSkeleton } from '../components/Skeleton.jsx';
import { ProjectLinks } from '../components/sections/Projects.jsx';
import Prose from '../components/Prose.jsx';
import Reveal from '../components/Reveal.jsx';
import Lightbox from '../components/Lightbox.jsx';
import LoadError from '../components/LoadError.jsx';
import NotFound from './NotFound.jsx';

// The project page itself. The admin live editor renders it from its draft.
export function ProjectView({ project, images }) {
  const editor = useEditor();
  const text = useText();
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const at = (field) => `projects.${project.id}.${field}`;

  return (
    <article className="project-page">
      <div className="container">
        <Link to="/#projects" className="text-link back-link"><EditText at="ui.project_back">{text('project_back')}</EditText></Link>

        <header className="project-header">
          <Reveal as="h1" className="project-page-title"><EditText at={at('title')}>{project.title}</EditText></Reveal>
          {(project.summary || editor) && (
            <Reveal as="p" className="project-lede" delay={100}><EditText at={at('summary')}>{project.summary}</EditText></Reveal>
          )}
        </header>

        {project.thumbnail_url && (
          <Reveal as="figure" className="project-cover" delay={150}>
            <img src={project.thumbnail_url} alt="" width="1600" height="1000" />
            <EditFile at={at('thumbnail')} />
          </Reveal>
        )}

        <div className="project-body">
          <aside className="project-facts">
            {(project.tech_tags?.length > 0 || editor) && (
              <div>
                <h2 className="eyebrow"><EditText at="ui.project_stack">{text('project_stack')}</EditText></h2>
                <p><EditText at={at('tech_tags')} panel>{project.tech_tags?.join(' / ')}</EditText></p>
              </div>
            )}
            <ProjectLinks project={project} />
          </aside>
          <Prose text={project.description} at={at('description')} className="prose project-description" />
        </div>

        {(images.length > 0 || editor) && (
          <section className="gallery" aria-label="Gallery">
            {images.map((image, i) => (
              <Reveal as="figure" key={image.id} className="gallery-item" delay={(i % 3) * 80}>
                <button
                  type="button"
                  className="gallery-open"
                  onClick={() => setLightboxIndex(i)}
                  aria-label={image.caption ? `Open image: ${image.caption}` : `Open image ${i + 1}`}
                >
                  <img src={image.image_url} alt={image.caption || ''} loading="lazy" width="1600" height="1200" />
                </button>
                {(image.caption || editor) && (
                  <figcaption><EditText at={`project_images.${image.id}.caption`}>{image.caption}</EditText></figcaption>
                )}
                <EditFile at={`project_images.${image.id}.image`} />
                <EditItem at={`project_images.${image.id}`} />
              </Reveal>
            ))}
          </section>
        )}
        <EditAdd table="project_images" parent={project.id} />
      </div>

      {lightboxIndex !== null && (
        <Lightbox images={images} index={lightboxIndex} onChange={setLightboxIndex} onClose={closeLightbox} />
      )}
    </article>
  );
}

export default function ProjectDetail() {
  const { slug } = useParams();
  const { data: site } = useSiteData();
  const [state, setState] = useState({ status: 'loading', project: null });

  useEffect(() => {
    let active = true;
    setState({ status: 'loading', project: null });
    window.scrollTo(0, 0);

    supabase
      .from('projects')
      .select('*, project_images(*)')
      .eq('slug', slug)
      .order('sort_order', { referencedTable: 'project_images' })
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setState({ status: 'error', project: null });
        else if (!data) setState({ status: 'missing', project: null });
        else setState({ status: 'ready', project: data });
      });

    return () => {
      active = false;
    };
  }, [slug]);

  useEffect(() => {
    if (state.project) {
      document.title = [state.project.title, site?.settings?.site_title].filter(Boolean).join(' — ');
    }
  }, [state.project, site]);

  if (state.status === 'loading') return <ProjectSkeleton />;
  if (state.status === 'missing') return <NotFound />;
  if (state.status === 'error') return <LoadError />;

  const { project } = state;
  return <ProjectView key={project.id} project={project} images={project.project_images || []} />;
}
