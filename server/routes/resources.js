import { supabaseAdmin } from '../lib/supabase.js';
import { HttpError, asyncHandler, must, parseId } from '../lib/http.js';
import { t } from '../lib/validate.js';
import { uploadToBucket, removeFromBucket } from '../lib/storage.js';
import { handleUpload } from '../middleware/upload.js';
import { nextSortOrder } from './crud.js';

export function slugify(value) {
  return String(value)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/, '');
}

function prepareProject(data, { isNew }) {
  if (!isNew && !('slug' in data)) return data;
  const slug = slugify(data.slug || data.title || '');
  if (!slug) {
    if (!isNew && !data.title) {
      delete data.slug;
      return data;
    }
    throw new HttpError(400, 'Please check the highlighted fields.', { slug: 'Use letters or numbers for the URL slug.' });
  }
  data.slug = slug;
  return data;
}

function prepareExperience(data) {
  if (data.is_current === true) data.end_date = null;
  return data;
}

async function projectGalleryFiles(project) {
  const images = must(await supabaseAdmin.from('project_images').select('image_path').eq('project_id', project.id));
  return [{ bucket: 'projects', paths: images.map((image) => image.image_path) }];
}

// POST /project_images/upload  { project_id, files: [{ path, name }] } (staged uploads)
function mountGalleryUpload(router) {
  router.post('/upload', handleUpload('image', { field: 'files', maxCount: 10 }), asyncHandler(async (req, res) => {
    const projectId = parseId(req.body.project_id);
    const project = must(await supabaseAdmin.from('projects').select('id').eq('id', projectId).maybeSingle());
    if (!project) throw new HttpError(404, 'Project not found.');

    let sortOrder = await nextSortOrder('project_images', { project_id: projectId });
    const rows = [];
    for (const file of req.files) {
      const uploaded = await uploadToBucket('projects', file, `project_images/${projectId}`);
      const { data, error } = await supabaseAdmin.from('project_images')
        .insert({ project_id: projectId, image_url: uploaded.url, image_path: uploaded.path, sort_order: sortOrder++ })
        .select().single();
      if (error) {
        await removeFromBucket('projects', [uploaded.path]);
        must({ error });
      }
      rows.push(data);
    }
    res.status(201).json(rows);
  }));
}

const image = (bucket) => ({ bucket, kind: 'image' });

export const listResources = {
  social_links: {
    fields: {
      platform: t.text({ required: true, max: 60 }),
      url: t.url({ required: true }),
    },
  },
  skill_categories: {
    fields: {
      name: t.text({ required: true, max: 80 }),
    },
  },
  skills: {
    fields: {
      category_id: t.int({ required: true, min: 1 }),
      name: t.text({ required: true, max: 80 }),
      level: t.int({ min: 0, max: 100 }),
    },
    filters: ['category_id'],
  },
  experience: {
    fields: {
      company: t.text({ required: true, max: 160 }),
      role: t.text({ required: true, max: 160 }),
      location: t.text({ max: 160 }),
      start_date: t.date({ required: true }),
      end_date: t.date(),
      is_current: t.bool(),
      description: t.text({ max: 5000 }),
    },
    prepare: prepareExperience,
  },
  education: {
    fields: {
      school: t.text({ required: true, max: 160 }),
      degree: t.text({ max: 160 }),
      start_year: t.int({ min: 1900, max: 2100 }),
      end_year: t.int({ min: 1900, max: 2100 }),
      description: t.text({ max: 5000 }),
    },
  },
  projects: {
    fields: {
      title: t.text({ required: true, max: 160 }),
      slug: t.text({ max: 120 }),
      summary: t.text({ max: 600 }),
      description: t.text({ max: 20000 }),
      tech_tags: t.tags(),
      live_url: t.url(),
      repo_url: t.url(),
    },
    files: { thumbnail: image('projects') },
    prepare: prepareProject,
    collectFiles: projectGalleryFiles,
  },
  project_images: {
    fields: {
      project_id: t.int({ required: true, min: 1 }),
      caption: t.text({ max: 300 }),
    },
    files: { image: image('projects') },
    filters: ['project_id'],
    extend: mountGalleryUpload,
  },
  certificates: {
    fields: {
      title: t.text({ required: true, max: 200 }),
      issuer: t.text({ max: 160 }),
      issued_on: t.date(),
      credential_url: t.url(),
    },
    files: { image: image('certificates') },
  },
  testimonials: {
    fields: {
      name: t.text({ required: true, max: 120 }),
      role: t.text({ max: 160 }),
      quote: t.text({ required: true, max: 2000 }),
    },
    files: { photo: image('avatars') },
  },
};

export const singletonResources = {
  profile: {
    fields: {
      full_name: t.text({ required: true, notNull: true, max: 120 }),
      title: t.text({ max: 160 }),
      short_intro: t.text({ max: 600 }),
      bio: t.text({ max: 10000 }),
      location: t.text({ max: 160 }),
      email: t.email(),
      phone: t.text({ max: 40 }),
      birthday: t.date(),
    },
    files: {
      photo: image('avatars'),
      about_photo: image('avatars'),
      cv: { bucket: 'documents', kind: 'pdf' },
    },
  },
  settings: {
    fields: {
      site_title: t.text({ required: true, notNull: true, max: 120 }),
      meta_description: t.text({ max: 300 }),
      accent_color: t.color({ required: true }),
      copyright_text: t.text({ max: 200 }),
    },
    files: {
      favicon: { bucket: 'documents', kind: 'icon' },
    },
  },
};
