import { useState } from 'react';
import Section from '../Section.jsx';
import Reveal from '../Reveal.jsx';
import SocialLinks from '../SocialLinks.jsx';
import { api } from '../../lib/api.js';
import { EditText } from '../../lib/edit.jsx';
import { useText } from '../../lib/uiText.js';

const EMPTY = { name: '', email: '', subject: '', message: '', website: '' };

function ContactForm() {
  const text = useText();
  const [values, setValues] = useState(EMPTY);
  const [status, setStatus] = useState({ state: 'idle', message: '' });
  const [errors, setErrors] = useState({});

  const update = (event) => setValues({ ...values, [event.target.name]: event.target.value });

  const submit = async (event) => {
    event.preventDefault();
    setStatus({ state: 'sending', message: '' });
    setErrors({});
    try {
      await api.publicPost('/contact', values);
      setValues(EMPTY);
      setStatus({ state: 'sent', message: text('contact_sent') });
    } catch (error) {
      setErrors(error.details || {});
      setStatus({ state: 'error', message: error.message });
    }
  };

  const field = (name, labelKey, props = {}) => {
    const Tag = props.as || 'input';
    const { as, ...rest } = props;
    return (
      <div className="input-field">
        <label htmlFor={`contact-${name}`}><EditText at={`ui.${labelKey}`}>{text(labelKey)}</EditText></label>
        <Tag
          id={`contact-${name}`}
          name={name}
          value={values[name]}
          onChange={update}
          aria-invalid={errors[name] ? 'true' : undefined}
          aria-describedby={errors[name] ? `contact-${name}-error` : undefined}
          {...rest}
        />
        {errors[name] && <p id={`contact-${name}-error`} className="field-error">{errors[name]}</p>}
      </div>
    );
  };

  return (
    <form className="contact-form" onSubmit={submit} noValidate={false}>
      <div className="form-row">
        {field('name', 'contact_name', { required: true, maxLength: 100, autoComplete: 'name' })}
        {field('email', 'contact_email', { type: 'email', required: true, maxLength: 200, autoComplete: 'email' })}
      </div>
      {field('subject', 'contact_subject', { maxLength: 200 })}
      {field('message', 'contact_message', { as: 'textarea', required: true, maxLength: 5000, rows: 6 })}
      <div className="honeypot" aria-hidden="true">
        <label htmlFor="contact-website">Website</label>
        <input id="contact-website" name="website" value={values.website} onChange={update} tabIndex={-1} autoComplete="off" />
      </div>
      <div className="form-actions">
        <button type="submit" className="button" disabled={status.state === 'sending'}>
          {status.state === 'sending'
            ? text('contact_sending')
            : <EditText at="ui.contact_send">{text('contact_send')}</EditText>}
        </button>
        <p className={`form-status form-status--${status.state}`} role="status" aria-live="polite">
          {status.message}
        </p>
      </div>
    </form>
  );
}

export default function Contact({ data, section, index }) {
  const { profile, socials } = data;

  return (
    <Section section={section} index={index}>
      <div className="contact-grid">
        <Reveal className="contact-details">
          {profile?.email && (
            <a className="contact-email" href={`mailto:${profile.email}`}><EditText at="profile.email">{profile.email}</EditText></a>
          )}
          {(profile?.phone || profile?.location) && (
            <p className="contact-meta">
              {[profile.phone, profile.location].filter(Boolean).join(' · ')}
            </p>
          )}
          <SocialLinks links={socials} className="social-list social-list--stacked" editable />
        </Reveal>
        <Reveal delay={120}>
          <ContactForm />
        </Reveal>
      </div>
    </Section>
  );
}
