import ProjectGallery from './components/ProjectGallery.jsx';
import { dateRange, yearRange } from '../lib/format.js';

export const IMAGE = {
  kind: 'image',
  accept: 'image/jpeg,image/png,image/webp,image/gif',
  hint: 'JPG, PNG, WebP or GIF. Max 5 MB.',
};

export const PARAGRAPH_HINT = 'Separate paragraphs with a blank line.';

export const SECTION_NAMES = {
  hero: 'Hero',
  about: 'About',
  skills: 'Skills',
  experience: 'Experience',
  education: 'Education',
  projects: 'Projects',
  certificates: 'Certificates / Awards',
  testimonials: 'Testimonials',
  contact: 'Contact',
};

// section (lists) and panel (profile, settings) say where each resource is
// edited in the live editor, so its form page can link straight there.
export const resources = {
  social_links: {
    endpoint: 'social_links',
    section: 'contact',
    title: 'Social links',
    singular: 'link',
    description: 'Shown in the contact section and the footer.',
    itemLabel: (r) => r.platform,
    itemMeta: (r) => r.url,
    fields: [
      { name: 'platform', label: 'Label', required: true },
      { name: 'url', label: 'URL', type: 'url', required: true, hint: 'https://…, mailto:… or tel:…' },
    ],
  },
  skill_categories: {
    endpoint: 'skill_categories',
    section: 'skills',
    title: 'Skill categories',
    singular: 'category',
    description: 'Deleting a category also deletes its skills.',
    itemLabel: (r) => r.name,
    fields: [{ name: 'name', label: 'Name', required: true }],
  },
  skills: {
    endpoint: 'skills',
    section: 'skills',
    title: 'Skills',
    singular: 'skill',
    itemLabel: (r) => r.name,
    itemMeta: (r) => (r.level != null ? `Level ${r.level}` : 'No level shown'),
    fields: ({ categories = [] }) => [
      {
        name: 'category_id',
        label: 'Category',
        type: 'select',
        numeric: true,
        required: true,
        options: categories.map((c) => ({ value: String(c.id), label: c.name })),
      },
      { name: 'name', label: 'Name', required: true },
      { name: 'level', label: 'Proficiency (0–100)', type: 'number', min: 0, max: 100, hint: 'Optional. Leave empty to hide the bar.' },
    ],
  },
  experience: {
    endpoint: 'experience',
    section: 'experience',
    title: 'Experience',
    singular: 'position',
    itemLabel: (r) => r.role,
    itemMeta: (r) => [r.company, dateRange(r.start_date, r.end_date, r.is_current)].filter(Boolean).join(' · '),
    fields: [
      { name: 'role', label: 'Role', required: true },
      { name: 'company', label: 'Company', required: true },
      { name: 'location', label: 'Location' },
      { name: 'start_date', label: 'Start date', type: 'date', required: true },
      { name: 'end_date', label: 'End date', type: 'date' },
      { name: 'is_current', label: 'I currently work here', type: 'checkbox' },
      { name: 'description', label: 'Description', type: 'textarea', rows: 6, hint: PARAGRAPH_HINT, wide: true },
    ],
  },
  education: {
    endpoint: 'education',
    section: 'education',
    title: 'Education',
    singular: 'entry',
    itemLabel: (r) => r.degree || r.school,
    itemMeta: (r) => [r.school, yearRange(r.start_year, r.end_year)].filter(Boolean).join(' · '),
    fields: [
      { name: 'school', label: 'School', required: true },
      { name: 'degree', label: 'Degree' },
      { name: 'start_year', label: 'Start year', type: 'number', min: 1900, max: 2100 },
      { name: 'end_year', label: 'End year', type: 'number', min: 1900, max: 2100, hint: 'Leave empty if ongoing.' },
      { name: 'description', label: 'Description', type: 'textarea', rows: 5, hint: PARAGRAPH_HINT, wide: true },
    ],
  },
  projects: {
    endpoint: 'projects',
    section: 'projects',
    title: 'Projects',
    singular: 'project',
    thumb: 'thumbnail_url',
    itemLabel: (r) => r.title,
    itemMeta: (r) => `/projects/${r.slug}`,
    fields: [
      { name: 'title', label: 'Title', required: true },
      { name: 'slug', label: 'URL slug', hint: 'Leave empty to generate it from the title.' },
      { name: 'summary', label: 'Short description', type: 'textarea', rows: 3, wide: true },
      { name: 'description', label: 'Full description', type: 'textarea', rows: 8, hint: PARAGRAPH_HINT, wide: true },
      { name: 'tech_tags', label: 'Tech tags', type: 'tags', hint: 'Comma separated.', wide: true },
      { name: 'live_url', label: 'Live URL', type: 'url' },
      { name: 'repo_url', label: 'Repository URL', type: 'url' },
    ],
    files: [{ name: 'thumbnail', label: 'Thumbnail', ...IMAGE }],
    Extra: ProjectGallery,
  },
  certificates: {
    endpoint: 'certificates',
    section: 'certificates',
    title: 'Certificates & awards',
    singular: 'certificate',
    thumb: 'image_url',
    itemLabel: (r) => r.title,
    itemMeta: (r) => [r.issuer, r.issued_on].filter(Boolean).join(' · '),
    fields: [
      { name: 'title', label: 'Title', required: true },
      { name: 'issuer', label: 'Issuer' },
      { name: 'issued_on', label: 'Date', type: 'date' },
      { name: 'credential_url', label: 'Credential URL', type: 'url' },
    ],
    files: [{ name: 'image', label: 'Image', ...IMAGE }],
  },
  testimonials: {
    endpoint: 'testimonials',
    section: 'testimonials',
    title: 'Testimonials',
    singular: 'testimonial',
    thumb: 'photo_url',
    description: 'The first visible testimonial is shown large.',
    itemLabel: (r) => r.name,
    itemMeta: (r) => r.role,
    fields: [
      { name: 'name', label: 'Name', required: true },
      { name: 'role', label: 'Role' },
      { name: 'quote', label: 'Quote', type: 'textarea', rows: 4, required: true, wide: true },
    ],
    files: [{ name: 'photo', label: 'Photo', ...IMAGE }],
  },
};

export const profileConfig = {
  endpoint: 'profile',
  panel: 'profile',
  title: 'Profile',
  description: 'Used in the header, hero, about and contact sections.',
  fields: [
    { name: 'full_name', label: 'Name', required: true },
    { name: 'title', label: 'Title / role' },
    { name: 'short_intro', label: 'Short intro (hero)', type: 'textarea', rows: 3, wide: true },
    { name: 'bio', label: 'Long bio (about)', type: 'textarea', rows: 10, hint: PARAGRAPH_HINT, wide: true },
    { name: 'location', label: 'Location' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'phone', label: 'Phone' },
    { name: 'birthday', label: 'Birthday', type: 'date' },
  ],
  files: [
    { name: 'photo', label: 'Profile photo (hero)', ...IMAGE },
    { name: 'about_photo', label: 'About photo', ...IMAGE },
    { name: 'cv', label: 'CV', kind: 'pdf', accept: 'application/pdf', hint: 'PDF. Max 10 MB.' },
  ],
};

export const settingsConfig = {
  endpoint: 'settings',
  panel: 'settings',
  title: 'Site settings',
  fields: [
    { name: 'site_title', label: 'Site title', required: true, hint: 'Shown in the browser tab.' },
    { name: 'accent_color', label: 'Accent color', type: 'color', required: true },
    { name: 'meta_description', label: 'Meta description', type: 'textarea', rows: 3, hint: 'Shown by search engines. Around 150 characters.', wide: true },
    { name: 'copyright_text', label: 'Footer copyright text', hint: 'Shown after the year.' },
  ],
  files: [
    { name: 'favicon', label: 'Favicon', kind: 'icon', accept: 'image/png,image/x-icon,.ico', hint: 'PNG or ICO, square. Max 1 MB.' },
  ],
};
