import Reveal from './Reveal.jsx';
import { pad } from '../lib/format.js';
import { EditText, useEditor } from '../lib/edit.jsx';

// Shared editorial frame: index + title on the left, content on the right.
// layout="stacked" puts the heading above a full-width body.
export default function Section({ section, index, layout = 'split', children }) {
  const editor = useEditor();
  const titleId = `${section.key}-title`;
  return (
    <section
      id={section.key}
      className={`section section--${section.key}${layout === 'stacked' ? ' section--stacked' : ''}`}
      aria-labelledby={titleId}
    >
      <div className="container section-grid">
        <Reveal className="section-head">
          {index != null && <span className="section-index">{pad(index)}</span>}
          <h2 id={titleId} className="section-title">
            <EditText at={`sections.${section.key}.title`}>{section.title}</EditText>
          </h2>
          {(section.intro || editor) && (
            <p className="section-intro">
              <EditText at={`sections.${section.key}.intro`}>{section.intro}</EditText>
            </p>
          )}
        </Reveal>
        <div className="section-body">{children}</div>
      </div>
    </section>
  );
}
