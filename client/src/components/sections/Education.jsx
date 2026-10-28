import Section from '../Section.jsx';
import Reveal from '../Reveal.jsx';
import Prose from '../Prose.jsx';
import { yearRange } from '../../lib/format.js';
import { EditAdd, EditItem, EditText } from '../../lib/edit.jsx';
import { useText } from '../../lib/uiText.js';

export default function Education({ data, section, index }) {
  const text = useText();

  return (
    <Section section={section} index={index}>
      <ol className="timeline">
        {data.education.map((item) => {
          const at = (field) => `education.${item.id}.${field}`;
          return (
            <Reveal as="li" key={item.id} className="timeline-item">
              <p className="timeline-dates">
                <EditText at={at('start_year')} panel>{yearRange(item.start_year, item.end_year, text('date_present'))}</EditText>
              </p>
              <div className="timeline-content">
                <h3 className="timeline-title">
                  <EditText at={at(item.degree ? 'degree' : 'school')}>{item.degree || item.school}</EditText>
                </h3>
                {item.degree && <p className="timeline-meta"><EditText at={at('school')}>{item.school}</EditText></p>}
                <Prose text={item.description} at={at('description')} />
              </div>
              <EditItem at={`education.${item.id}`} />
            </Reveal>
          );
        })}
      </ol>
      <EditAdd table="education" />
    </Section>
  );
}
