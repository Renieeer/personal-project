import Reveal from '../Reveal.jsx';
import { EditFile, EditText, useEditor } from '../../lib/edit.jsx';
import { useText } from '../../lib/uiText.js';

export default function Hero({ data }) {
  const { profile } = data;
  const editor = useEditor();
  const text = useText();

  return (
    <section id="hero" className="hero" aria-label={profile.full_name}>
      <div className="container hero-grid">
        <div className="hero-text">
          {(profile.title || editor) && (
            <Reveal as="p" className="hero-role"><EditText at="profile.title">{profile.title}</EditText></Reveal>
          )}
          <Reveal as="h1" className="hero-name" delay={80}><EditText at="profile.full_name">{profile.full_name}</EditText></Reveal>
          {(profile.short_intro || editor) && (
            <Reveal as="p" className="hero-intro" delay={160}><EditText at="profile.short_intro">{profile.short_intro}</EditText></Reveal>
          )}
          {(profile.cv_url || profile.email) && (
            <Reveal className="hero-actions" delay={240}>
              {profile.cv_url && (
                <a className="button" href={profile.cv_url} target="_blank" rel="noreferrer" download>
                  <EditText at="ui.hero_cv">{text('hero_cv')}</EditText>
                </a>
              )}
              {profile.email && (
                <a className="text-link" href={`mailto:${profile.email}`}><EditText at="profile.email">{profile.email}</EditText></a>
              )}
              {profile.cv_url && <EditFile at="profile.cv" />}
            </Reveal>
          )}
        </div>
        {profile.photo_url && (
          <Reveal as="figure" className="hero-photo" delay={200}>
            <img src={profile.photo_url} alt={profile.full_name} width="900" height="1125" />
            <EditFile at="profile.photo" />
          </Reveal>
        )}
      </div>
    </section>
  );
}
