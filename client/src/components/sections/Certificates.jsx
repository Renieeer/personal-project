import Section from '../Section.jsx';
import Reveal from '../Reveal.jsx';
import { formatMonthYear } from '../../lib/format.js';
import { EditAdd, EditFile, EditItem, EditText, useEditor } from '../../lib/edit.jsx';
import { useText } from '../../lib/uiText.js';

export default function Certificates({ data, section, index }) {
  const editor = useEditor();
  const text = useText();

  return (
    <Section section={section} index={index}>
      <ul className="cert-list">
        {data.certificates.map((cert) => {
          const at = (field) => `certificates.${cert.id}.${field}`;
          return (
            <Reveal as="li" key={cert.id} className="cert">
              <p className="cert-date"><EditText at={at('issued_on')} panel>{formatMonthYear(cert.issued_on)}</EditText></p>
              <div className="cert-text">
                <h3 className="cert-title"><EditText at={at('title')}>{cert.title}</EditText></h3>
                {(cert.issuer || editor) && <p className="cert-issuer"><EditText at={at('issuer')}>{cert.issuer}</EditText></p>}
                {cert.credential_url && (
                  <a className="text-link cert-link" href={cert.credential_url} target="_blank" rel="noreferrer">
                    <EditText at="ui.cert_view">{text('cert_view')}</EditText>
                  </a>
                )}
              </div>
              {cert.image_url && (
                <a className="cert-image" href={cert.image_url} target="_blank" rel="noreferrer">
                  <img src={cert.image_url} alt={cert.title} loading="lazy" width="240" height="180" />
                  <EditFile at={at('image')} />
                </a>
              )}
              <EditItem at={`certificates.${cert.id}`} />
            </Reveal>
          );
        })}
      </ul>
      <EditAdd table="certificates" />
    </Section>
  );
}
