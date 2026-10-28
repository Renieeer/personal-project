import { Link } from 'react-router-dom';
import Section from '../Section.jsx';
import Reveal from '../Reveal.jsx';
import { pad } from '../../lib/format.js';
import { EditAdd, EditFile, EditItem, EditText, useEditor } from '../../lib/edit.jsx';
import { useText } from '../../lib/uiText.js';

export function ProjectLinks({ project }) {
  const text = useText();
  if (!project.live_url && !project.repo_url) return null;
  return (
    <p className="project-links">
      {project.live_url && (
        <a className="text-link" href={project.live_url} target="_blank" rel="noreferrer">
          <EditText at="ui.project_live">{text('project_live')}</EditText>
        </a>
      )}
      {project.repo_url && (
        <a className="text-link" href={project.repo_url} target="_blank" rel="noreferrer">
          <EditText at="ui.project_source">{text('project_source')}</EditText>
        </a>
      )}
    </p>
  );
}

export default function Projects({ data, section, index }) {
  const editor = useEditor();

  return (
    <Section section={section} index={index} layout="stacked">
      <ol className="project-list">
        {data.projects.map((project, i) => {
          const href = `/projects/${project.slug}`;
          const variant = i === 0 ? ' project--lead' : i % 2 === 1 ? ' project--flip' : '';
          const at = (field) => `projects.${project.id}.${field}`;
          return (
            <Reveal as="li" key={project.id} className={`project${variant}`}>
              <Link to={href} className="project-media" tabIndex={-1} aria-hidden="true">
                {project.thumbnail_url
                  ? <img src={project.thumbnail_url} alt="" loading="lazy" width="1600" height="1000" />
                  : <span className="project-media-empty" />}
                <EditFile at={at('thumbnail')} />
              </Link>
              <div className="project-text">
                <span className="project-number">{pad(i + 1)}</span>
                <h3 className="project-title"><Link to={href}><EditText at={at('title')}>{project.title}</EditText></Link></h3>
                {(project.summary || editor) && (
                  <p className="project-summary"><EditText at={at('summary')}>{project.summary}</EditText></p>
                )}
                {(project.tech_tags?.length > 0 || editor) && (
                  <p className="tag-line"><EditText at={at('tech_tags')} panel>{project.tech_tags?.join(' / ')}</EditText></p>
                )}
                <ProjectLinks project={project} />
              </div>
              <EditItem at={`projects.${project.id}`} />
            </Reveal>
          );
        })}
      </ol>
      <EditAdd table="projects" />
    </Section>
  );
}
