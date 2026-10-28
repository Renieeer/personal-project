import Section from '../Section.jsx';
import Reveal from '../Reveal.jsx';
import { EditAdd, EditItem, EditText, useEditor } from '../../lib/edit.jsx';

function Quote({ item, lead = false }) {
  const editor = useEditor();
  const at = (field) => `testimonials.${item.id}.${field}`;
  return (
    <figure className={`quote${lead ? ' quote--lead' : ''}`}>
      <blockquote>
        <p>&ldquo;<EditText at={at('quote')}>{item.quote}</EditText>&rdquo;</p>
      </blockquote>
      <figcaption>
        {item.photo_url && <img className="quote-photo" src={item.photo_url} alt="" loading="lazy" width="96" height="96" />}
        <span>
          <span className="quote-name"><EditText at={at('name')}>{item.name}</EditText></span>
          {(item.role || editor) && <span className="quote-role"><EditText at={at('role')}>{item.role}</EditText></span>}
        </span>
      </figcaption>
      <EditItem at={`testimonials.${item.id}`} />
    </figure>
  );
}

export default function Testimonials({ data, section, index }) {
  const [lead, ...rest] = data.testimonials;

  return (
    <Section section={section} index={index} layout="stacked">
      <Reveal className="quote-lead-wrap">
        <Quote item={lead} lead />
      </Reveal>
      {rest.length > 0 && (
        <div className="quote-columns">
          {rest.map((item, i) => (
            <Reveal key={item.id} delay={(i % 2) * 120}>
              <Quote item={item} />
            </Reveal>
          ))}
        </div>
      )}
      <EditAdd table="testimonials" />
    </Section>
  );
}
