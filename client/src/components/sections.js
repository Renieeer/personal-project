import Hero from './sections/Hero.jsx';
import About from './sections/About.jsx';
import Skills from './sections/Skills.jsx';
import Experience from './sections/Experience.jsx';
import Education from './sections/Education.jsx';
import Projects from './sections/Projects.jsx';
import Certificates from './sections/Certificates.jsx';
import Testimonials from './sections/Testimonials.jsx';
import Contact from './sections/Contact.jsx';

// Rows from the public API are always visible. The admin live editor also
// passes hidden rows (is_visible = false), which must not count as content.
const shown = (rows) => (rows || []).filter((row) => row.is_visible !== false);

// hasContent decides whether a visible section has anything to show;
// empty sections are not rendered and do not appear in the navigation.
export const SECTION_REGISTRY = {
  hero: { Component: Hero, hasContent: (d) => Boolean(d.profile?.full_name) },
  about: {
    Component: About,
    hasContent: (d) => Boolean(d.profile && ['bio', 'location', 'email', 'phone', 'birthday', 'about_photo_url'].some((k) => d.profile[k])),
  },
  skills: { Component: Skills, hasContent: (d) => shown(d.skills).some((category) => shown(category.skills).length) },
  experience: { Component: Experience, hasContent: (d) => shown(d.experience).length > 0 },
  education: { Component: Education, hasContent: (d) => shown(d.education).length > 0 },
  projects: { Component: Projects, hasContent: (d) => shown(d.projects).length > 0 },
  certificates: { Component: Certificates, hasContent: (d) => shown(d.certificates).length > 0 },
  testimonials: { Component: Testimonials, hasContent: (d) => shown(d.testimonials).length > 0 },
  contact: { Component: Contact, hasContent: () => true },
};

export function getRenderableSections(data) {
  return shown(data?.sections).filter((section) => SECTION_REGISTRY[section.key]?.hasContent(data));
}
