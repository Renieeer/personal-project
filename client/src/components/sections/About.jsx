import Section from '../Section.jsx';
import Reveal from '../Reveal.jsx';
import Prose from '../Prose.jsx';
import { formatDate } from '../../lib/format.js';
import { EditFile, EditText } from '../../lib/edit.jsx';
import { useText } from '../../lib/uiText.js';

export default function About({ data, section, index }) {
  const { profile } = data;
  const text = useText();
  // [label key, profile field, shown value, link]
  const details = [
    ['about_location', 'location', profile.location],
    ['about_email', 'email', profile.email, profile.email && `mailto:${profile.email}`],
    ['about_phone', 'phone', profile.phone, profile.phone && `tel:${profile.phone.replace(/[^\d+]/g, '')}`],
    ['about_birthday', 'birthday', formatDate(profile.birthday)],
  ].filter(([, , value]) => value);

  return (
    <Section section={section} index={index}>
      <div className="about-grid">
        <Reveal>
          <Prose text={profile.bio} at="profile.bio" className="prose prose--lead" />
        </Reveal>
        {(profile.about_photo_url || details.length > 0) && (
          <Reveal className="about-aside" delay={120}>
            {profile.about_photo_url && (
              <img className="about-photo" src={profile.about_photo_url} alt="" loading="lazy" width="800" height="800" />
            )}
            {profile.about_photo_url && <EditFile at="profile.about_photo" />}
            {details.length > 0 && (
              <dl className="details">
                {details.map(([label, field, value, href]) => {
                  const shown = <EditText at={`profile.${field}`} panel={field === 'birthday'}>{value}</EditText>;
                  return (
                    <div key={label}>
                      <dt><EditText at={`ui.${label}`}>{text(label)}</EditText></dt>
                      <dd>{href ? <a className="text-link" href={href}>{shown}</a> : shown}</dd>
                    </div>
                  );
                })}
              </dl>
            )}
          </Reveal>
        )}
      </div>
    </Section>
  );
}
