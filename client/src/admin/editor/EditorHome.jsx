import Section from '../../components/Section.jsx';
import { SECTION_REGISTRY, getRenderableSections } from '../../components/sections.js';
import { useStore } from './store.js';
import { rowKey } from './model.js';
import { SECTION_NAMES, SECTION_TABLE } from './schema.js';
import EditorAdd from './EditorAdd.jsx';
import Icon from './Icon.jsx';

const PROFILE_SECTIONS = ['hero', 'about', 'contact'];

function SectionBar({ section, first, last, status }) {
  const store = useStore();
  const name = SECTION_NAMES[section.key];
  const visible = section.is_visible !== false;
  const error = store.state.errors[rowKey('sections', section.key)];

  return (
    <div className="ed-section-bar ed-ui">
      <span className="ed-section-name">{name}</span>
      {status && <span className="ed-badge">{status}</span>}
      {error && <span className="ed-badge ed-badge--error" title={error.message}>Not saved: {error.message}</span>}
      <span className="ed-section-tools">
        <button
          type="button"
          className="ed-tool"
          aria-label={`Move the ${name} section up`}
          title="Move section up"
          disabled={first}
          onClick={() => store.step('sections', section.key, -1)}
        >
          <Icon name="up" />
        </button>
        <button
          type="button"
          className="ed-tool"
          aria-label={`Move the ${name} section down`}
          title="Move section down"
          disabled={last}
          onClick={() => store.step('sections', section.key, 1)}
        >
          <Icon name="down" />
        </button>
        <button type="button" className="ed-text-button" onClick={() => store.toggleVisible('sections', section.key)}>
          <Icon name={visible ? 'eye-off' : 'eye'} />
          {visible ? 'Hide section' : 'Show section'}
        </button>
        {section.key !== 'hero' && (
          <button type="button" className="ed-text-button" onClick={() => store.openPanel({ table: 'sections', id: section.key })}>
            <Icon name="edit" />
            Heading
          </button>
        )}
        {PROFILE_SECTIONS.includes(section.key) && (
          <button type="button" className="ed-text-button" onClick={() => store.openPanel({ table: 'profile', id: null })}>
            <Icon name="edit" />
            Profile details
          </button>
        )}
      </span>
    </div>
  );
}

function EmptySection({ section }) {
  const table = SECTION_TABLE[section.key];
  return (
    <Section section={section} index={null}>
      <div className="ed-empty ed-ui">
        <p>Nothing here yet. This section stays off the site until it has something visible in it.</p>
        <EditorAdd table={table} />
      </div>
    </Section>
  );
}

// The home page with every section, hidden and empty ones included, each
// under a bar to move, hide or rename it.
export default function EditorHome() {
  const { data } = useStore();
  const shown = new Set(getRenderableSections(data).map((section) => section.key));
  let number = 0;

  return data.sections.map((section, i) => {
    const { Component } = SECTION_REGISTRY[section.key];
    const index = section.key !== 'hero' && shown.has(section.key) ? ++number : null;
    const hasRows = !SECTION_TABLE[section.key] || data[section.key].length > 0;
    let status = null;
    if (section.is_visible === false) status = 'Hidden';
    else if (!shown.has(section.key)) status = 'Not on the site: nothing visible in it';

    return (
      <div
        key={section.key}
        id={`ed-section-${section.key}`}
        className="ed-section"
        data-hidden={section.is_visible === false || undefined}
      >
        <SectionBar section={section} first={i === 0} last={i === data.sections.length - 1} status={status} />
        {hasRows ? <Component data={data} section={section} index={index} /> : <EmptySection section={section} />}
      </div>
    );
  });
}
