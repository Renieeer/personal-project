import { useSiteData } from './siteData.jsx';

// Default interface text. The admin can override any of these (stored in the
// ui_text table); a missing or empty override falls back to the default.
export const UI_TEXT_DEFAULTS = {
  skip_link: 'Skip to content',
  nav_menu: 'Menu',
  nav_close: 'Close',
  theme_dark: 'Dark mode',
  theme_light: 'Light mode',
  hero_cv: 'Download CV',
  about_location: 'Location',
  about_email: 'Email',
  about_phone: 'Phone',
  about_birthday: 'Birthday',
  date_present: 'Present',
  project_live: 'Live site',
  project_source: 'Source',
  project_back: 'Back to all projects',
  project_stack: 'Stack',
  cert_view: 'View credential',
  contact_name: 'Name',
  contact_email: 'Email',
  contact_subject: 'Subject',
  contact_message: 'Message',
  contact_send: 'Send message',
  contact_sending: 'Sending…',
  contact_sent: 'Thank you. Your message has been sent.',
  lightbox_close: 'Close',
  lightbox_previous: 'Previous',
  lightbox_next: 'Next',
  not_found_title: 'Page not found.',
  not_found_link: 'Back to the home page',
  load_error_title: 'Content could not be loaded.',
  load_error_body: 'Please refresh the page in a moment.',
};

// Returns text(key): the saved override, or the default.
export function useText() {
  const { data } = useSiteData();
  const texts = data?.ui;
  return (key) => texts?.[key] || UI_TEXT_DEFAULTS[key];
}
