import Section from '../Section.jsx';
import Reveal from '../Reveal.jsx';
import Prose from '../Prose.jsx';
import { dateRange } from '../../lib/format.js';
import { EditAdd, EditItem, EditText, useEditor } from '../../lib/edit.jsx';
import { useText } from '../../lib/uiText.js';

export default function Experience({ data, section, index }) {
  const editor = useEditor();
  const text = useText();

  return (
    <Section section={section} index={index}>
      <ol className="timeline">
        {data.experience.map((item) => {
          const at = (field) => `experience.${item.id}.${field}`;
          return (
            <Reveal as="li" key={item.id} className={`timeline-item${item.is_current ? ' is-current' : ''}`}>
              <p className="timeline-dates">
                <EditText at={at('start_date')} panel>
                  {dateRange(item.start_date, item.end_date, item.is_current, text('date_present'))}
                </EditText>
              </p>
              <div className="timeline-content">
                <h3 className="timeline-title"><EditText at={at('role')}>{item.role}</EditText></h3>
                <p className="timeline-meta">
                  <EditText at={at('company')}>{item.company}</EditText>
                  {(item.location || editor) && ' · '}
                  <EditText at={at('location')}>{item.location}</EditText>
                </p>
                <Prose text={item.description} at={at('description')} />
              </div>
              <EditItem at={`experience.${item.id}`} />
            </Reveal>
          );
        })}
      </ol>
      <EditAdd table="experience" />
    </Section>
  );
}
