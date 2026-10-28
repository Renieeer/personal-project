import { IMAGE, SECTION_NAMES, profileConfig, resources, settingsConfig } from '../resources.js';

export { SECTION_NAMES };

// Tables the live editor changes. Lists are in save order: parents first.
export const SINGLETONS = ['profile', 'settings'];
export const LISTS = [
  'social_links', 'skill_categories', 'skills', 'experience', 'education',
  'projects', 'project_images', 'certificates', 'testimonials',
];

// Rows that belong to a parent row: [parent table, foreign key]. Their order
// is kept per parent, and deleting the parent deletes them too.
export const PARENTS = {
  skills: ['skill_categories', 'category_id'],
  project_images: ['projects', 'project_id'],
};

export const groupOf = (table, row) => (PARENTS[table] ? row[PARENTS[table][1]] : null);

// The field shown as an item's name: focused after adding, suffixed on duplicate.
export const LABEL_FIELD = {
  social_links: 'platform',
  skill_categories: 'name',
  skills: 'name',
  experience: 'role',
  education: 'school',
  projects: 'title',
  project_images: 'caption',
  certificates: 'title',
  testimonials: 'name',
};

// The list a home page section is built from (for its empty state).
export const SECTION_TABLE = {
  skills: 'skill_categories',
  experience: 'experience',
  education: 'education',
  projects: 'projects',
  certificates: 'certificates',
  testimonials: 'testimonials',
};

const sectionsConfig = {
  endpoint: 'sections',
  title: 'Section',
  singular: 'section',
  fields: [
    { name: 'title', label: 'Heading (also used in the menu)' },
    { name: 'intro', label: 'Intro line', type: 'textarea', rows: 2, wide: true },
  ],
};

const galleryConfig = {
  endpoint: 'project_images',
  title: 'Gallery image',
  singular: 'image',
  itemLabel: (r) => r.caption || 'Gallery image',
  fields: [{ name: 'caption', label: 'Caption' }],
  files: [{ name: 'image', label: 'Image', ...IMAGE }],
};

const CONFIGS = {
  ...resources,
  project_images: galleryConfig,
  profile: profileConfig,
  settings: settingsConfig,
  sections: sectionsConfig,
};

// The admin config of a table with `fields` resolved (skills need the categories).
export function configFor(table, context = {}) {
  const config = CONFIGS[table];
  if (!config) return null;
  const fields = typeof config.fields === 'function' ? config.fields(context) : config.fields;
  return { ...config, fields };
}

// Fields the API accepts for a table.
export function fieldNames(table) {
  const names = configFor(table).fields.map((field) => field.name);
  return SINGLETONS.includes(table) ? names : [...names, 'is_visible'];
}

export const fieldSpec = (table, field) => configFor(table)?.fields.find((f) => f.name === field) || null;
export const fileFields = (table) => (CONFIGS[table]?.files || []).map((file) => file.name);
export const fileSpec = (table, field) => CONFIGS[table]?.files?.find((file) => file.name === field) || null;

const MB = 1024 * 1024;

// Same limits as server/middleware/upload.js, checked before a file is queued.
const UPLOAD_RULES = {
  image: { maxSize: 5 * MB, types: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'], label: 'JPG, PNG, WebP or GIF' },
  pdf: { maxSize: 10 * MB, types: ['application/pdf'], label: 'PDF' },
  icon: { maxSize: 1 * MB, types: ['image/png', 'image/x-icon', 'image/vnd.microsoft.icon'], label: 'PNG or ICO' },
};

export function checkFile(kind, file) {
  const rule = UPLOAD_RULES[kind];
  if (!rule.types.includes(file.type)) return `"${file.name}" is not a ${rule.label} file.`;
  if (file.size > rule.maxSize) return `"${file.name}" is too large. Maximum size is ${rule.maxSize / MB} MB.`;
  return null;
}

const today = () => new Date().toISOString().slice(0, 10);

// Starting values for new rows. Empty required fields show as placeholders
// on the page, and saving reports them until they are filled in.
export const NEW_ROW = {
  social_links: () => ({ platform: '', url: '' }),
  skill_categories: () => ({ name: '' }),
  skills: () => ({ name: '', level: null }),
  experience: () => ({
    role: '', company: '', location: null, start_date: today(), end_date: null, is_current: true, description: null,
  }),
  education: () => ({ school: '', degree: null, start_year: new Date().getFullYear(), end_year: null, description: null }),
  projects: () => ({
    title: '', slug: '', summary: null, description: null, tech_tags: [], live_url: null, repo_url: null,
  }),
  certificates: () => ({ title: '', issuer: null, issued_on: null, credential_url: null }),
  testimonials: () => ({ name: '', role: null, quote: '' }),
};

// Labels for the "Site text" panel, grouped by where the text appears.
export const UI_TEXT_GROUPS = [
  {
    title: 'Header and menu',
    items: {
      skip_link: 'Skip link (shown to keyboard users)',
      nav_menu: 'Menu button (phones)',
      nav_close: 'Close menu button',
      theme_dark: 'Switch to dark mode',
      theme_light: 'Switch to light mode',
    },
  },
  {
    title: 'Hero and about',
    items: {
      hero_cv: 'CV button',
      about_location: 'Location label',
      about_email: 'Email label',
      about_phone: 'Phone label',
      about_birthday: 'Birthday label',
      date_present: 'End of a current date range',
    },
  },
  {
    title: 'Projects and certificates',
    items: {
      project_live: 'Live site link',
      project_source: 'Source code link',
      project_back: 'Back link on project pages',
      project_stack: 'Stack heading on project pages',
      cert_view: 'Credential link',
    },
  },
  {
    title: 'Contact form',
    items: {
      contact_name: 'Name label',
      contact_email: 'Email label',
      contact_subject: 'Subject label',
      contact_message: 'Message label',
      contact_send: 'Send button',
      contact_sending: 'Send button while sending',
      contact_sent: 'Message after sending',
    },
  },
  {
    title: 'Image viewer',
    items: {
      lightbox_close: 'Close button',
      lightbox_previous: 'Previous button',
      lightbox_next: 'Next button',
    },
  },
  {
    title: 'Error pages',
    items: {
      not_found_title: 'Page not found heading',
      not_found_link: 'Page not found link',
      load_error_title: 'Loading error heading',
      load_error_body: 'Loading error text',
    },
  },
];
