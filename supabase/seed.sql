-- =====================================================================
-- Sample seed data. Run AFTER migrations.sql.
--
-- Fills every table with realistic sample content for a fictional
-- developer ("Alex Rivera"). People, companies and schools are made up;
-- replace everything from the admin panel.
--
-- WARNING: this script clears every content table (including messages)
-- before inserting the sample data. Do not run it on a live site.
--
-- Images point to picsum.photos placeholders and the CV points to a
-- public sample PDF. Replace them by uploading files in the admin panel.
-- =====================================================================

truncate table
  public.project_images,
  public.projects,
  public.skills,
  public.skill_categories,
  public.social_links,
  public.experience,
  public.education,
  public.certificates,
  public.testimonials,
  public.messages
restart identity cascade;


-- Profile --------------------------------------------------------------

insert into public.profile (
  id, full_name, title, short_intro, bio, location, email, phone, birthday,
  photo_url, photo_path, about_photo_url, about_photo_path, cv_url, cv_path
) values (
  1,
  'Alex Rivera',
  'Full-Stack Web Developer',
  'I build fast, accessible websites and web apps with React, Node.js and SQL, from the first sketch to the final deploy.',
  E'I''m a web developer who enjoys turning rough ideas into clean, working products. I started by building small websites for friends and local shops, and I''ve been hooked on the craft ever since.\n\nToday I work across the stack: React on the front end, Node.js and Express on the server, and MySQL or PostgreSQL for data. I care about clear code, pages that load quickly on any device, and interfaces that are easy for everyone to use.\n\nI''m currently completing my on-the-job training as a web developer, where I help a small team ship features for client projects. Outside of work I contribute to student tech events and keep a running list of side projects I want to build next.',
  'Manila, Philippines',
  'alex.rivera@example.com',
  '+63 900 000 0000',
  '2002-05-14',
  'https://picsum.photos/seed/sample-portrait/900/1125?grayscale',
  null,
  'https://picsum.photos/seed/sample-desk/800/800?grayscale',
  null,
  'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  null
)
on conflict (id) do update set
  full_name        = excluded.full_name,
  title            = excluded.title,
  short_intro      = excluded.short_intro,
  bio              = excluded.bio,
  location         = excluded.location,
  email            = excluded.email,
  phone            = excluded.phone,
  birthday         = excluded.birthday,
  photo_url        = excluded.photo_url,
  photo_path       = excluded.photo_path,
  about_photo_url  = excluded.about_photo_url,
  about_photo_path = excluded.about_photo_path,
  cv_url           = excluded.cv_url,
  cv_path          = excluded.cv_path;


-- Settings -------------------------------------------------------------

insert into public.settings (
  id, site_title, meta_description, accent_color, copyright_text, favicon_url, favicon_path
) values (
  1,
  'Alex Rivera — Web Developer',
  'Portfolio of Alex Rivera, a full-stack web developer building fast, accessible websites and web apps with React, Node.js and SQL.',
  '#b3441e',
  'Alex Rivera. All rights reserved.',
  null,
  null
)
on conflict (id) do update set
  site_title       = excluded.site_title,
  meta_description = excluded.meta_description,
  accent_color     = excluded.accent_color,
  copyright_text   = excluded.copyright_text,
  favicon_url      = excluded.favicon_url,
  favicon_path     = excluded.favicon_path;


-- Interface text (empty = the built-in defaults) -----------------------

insert into public.ui_text (id, texts) values (1, '{}'::jsonb)
on conflict (id) do update set texts = excluded.texts;


-- Sections -------------------------------------------------------------

insert into public.section_visibility (key, title, intro, sort_order, is_visible) values
  ('hero',         'Home',         null, 0, true),
  ('about',        'About',        'A little about who I am and how I work.', 1, true),
  ('skills',       'Skills',       'The tools and technologies I use day to day.', 2, true),
  ('experience',   'Experience',   'Where I''ve worked and what I did there.', 3, true),
  ('education',    'Education',    'My studies so far.', 4, true),
  ('projects',     'Projects',     'A selection of things I''ve designed and built. Open any project for details and screenshots.', 5, true),
  ('certificates', 'Certificates', 'Courses, certifications and awards.', 6, true),
  ('testimonials', 'Testimonials', null, 7, true),
  ('contact',      'Contact',      'Have a project in mind or just want to say hello? Send me a message and I''ll reply within two working days.', 8, true)
on conflict (key) do update set
  title      = excluded.title,
  intro      = excluded.intro,
  sort_order = excluded.sort_order,
  is_visible = excluded.is_visible;


-- Social links ---------------------------------------------------------

insert into public.social_links (platform, url, sort_order) values
  ('GitHub',   'https://github.com/',                 0),
  ('LinkedIn', 'https://www.linkedin.com/',           1),
  ('Facebook', 'https://www.facebook.com/',           2),
  ('Email',    'mailto:alex.rivera@example.com',      3);


-- Skills ---------------------------------------------------------------

insert into public.skill_categories (name, sort_order) values
  ('Front end',  0),
  ('Back end',   1),
  ('Databases',  2),
  ('Tools',      3);

insert into public.skills (category_id, name, level, sort_order) values
  (1, 'HTML & CSS',          90, 0),
  (1, 'JavaScript',          85, 1),
  (1, 'React',               80, 2),
  (1, 'Responsive design',   85, 3),
  (2, 'Node.js',             75, 0),
  (2, 'Express',             75, 1),
  (2, 'PHP',                 70, 2),
  (2, 'REST APIs',           75, 3),
  (3, 'MySQL',               75, 0),
  (3, 'PostgreSQL',          65, 1),
  (3, 'Supabase',            70, 2),
  (4, 'Git & GitHub',        null, 0),
  (4, 'VS Code',             null, 1),
  (4, 'Figma',               null, 2),
  (4, 'Laragon',             null, 3);


-- Experience -----------------------------------------------------------

insert into public.experience (company, role, location, start_date, end_date, is_current, description, sort_order) values
  ('Brightlane Digital', 'Web Developer Intern (OJT)', 'Manila', '2026-02-01', null, true,
   E'Building and maintaining client websites with a team of four developers. I turn Figma designs into responsive React pages, connect them to REST APIs and fix bugs reported by clients.\n\nI also wrote the team''s first checklist for accessibility testing, which is now part of every release.', 0),
  ('Freelance', 'Web Developer', 'Remote', '2024-06-01', '2026-01-31', false,
   'Designed and built websites for small businesses, including a bakery ordering page, a clinic appointment system and several landing pages. Handled everything from planning with the client to hosting and handover.', 1),
  ('Westfield Public Library', 'IT Support Assistant (part-time)', 'Quezon City', '2023-06-01', '2024-05-31', false,
   'Kept public computers and the library network running, set up new workstations and helped visitors with printing, accounts and basic software questions.', 2);


-- Education ------------------------------------------------------------

insert into public.education (school, degree, start_year, end_year, description, sort_order) values
  ('Westbridge State University', 'BS Information Technology', 2022, 2026,
   'Major in web and mobile development. Capstone project: an online appointment system for a community health clinic. Active member of the campus IT Society.', 0),
  ('Riverside National High School', 'Senior High School, ICT strand', 2020, 2022,
   'Focused on programming and computer systems servicing. Graduated with honors.', 1);


-- Projects -------------------------------------------------------------

insert into public.projects (slug, title, summary, description, tech_tags, live_url, repo_url, thumbnail_url, sort_order) values
  ('shoplite', 'ShopLite',
   'A lightweight online store for small sellers, with a product catalog, cart and order tracking.',
   E'ShopLite started as a request from a friend who sold handmade goods through chat messages and spreadsheets. I built a simple storefront where customers can browse products, add them to a cart and place an order without creating an account.\n\nThe admin side lets the seller add products with photos, update stock and move orders from "new" to "shipped". Orders are stored in MySQL and the API is written in Node.js with Express.\n\nThe biggest lesson was keeping it simple: every feature had to be something the seller would actually use every day.',
   array['React', 'Node.js', 'Express', 'MySQL'],
   'https://example.com/shoplite', 'https://github.com/',
   'https://picsum.photos/seed/sample-project-1/1600/1000?grayscale', 0),
  ('taskflow', 'TaskFlow',
   'A team task board with drag-and-drop columns, due dates and real-time updates.',
   E'TaskFlow is a Kanban-style board for small teams. Tasks can be dragged between columns, assigned to members and given due dates, and every change appears instantly for everyone on the board.\n\nI used React for the interface and Supabase for the database, authentication and real-time updates, with row-level security so each team only sees its own boards.',
   array['React', 'Supabase', 'PostgreSQL'],
   'https://example.com/taskflow', null,
   'https://picsum.photos/seed/sample-project-2/1600/1000?grayscale', 1),
  ('clinic-booking', 'Clinic Booking System',
   'An online appointment system for a community health clinic, built as my capstone project.',
   E'Patients used to line up early in the morning to get a number. This system lets them book a time slot online, get a reference code and receive a reminder the day before.\n\nStaff can manage the daily schedule, mark patients as served and print a simple daily report. It was built with PHP and MySQL so the clinic could host it on affordable shared hosting.',
   array['PHP', 'MySQL', 'JavaScript'],
   null, 'https://github.com/',
   'https://picsum.photos/seed/sample-project-3/1600/1000?grayscale', 2),
  ('weather-now', 'Weather Now',
   'A clean weather dashboard with a 5-day forecast and saved locations.',
   E'A small side project to practice working with public APIs. Weather Now shows the current conditions and a five-day forecast for any city, and remembers your favorite locations on the device.\n\nI focused on fast loading, clear typography and making it work well on slow mobile connections.',
   array['JavaScript', 'REST API', 'CSS'],
   'https://example.com/weather-now', 'https://github.com/',
   'https://picsum.photos/seed/sample-project-4/1600/1000?grayscale', 3);

insert into public.project_images (project_id, image_url, caption, sort_order)
select p.id, v.image_url, v.caption, v.sort_order
from (values
  ('shoplite', 'https://picsum.photos/seed/sample-gallery-1/1600/1200?grayscale', 'Product catalog on desktop.', 0),
  ('shoplite', 'https://picsum.photos/seed/sample-gallery-2/1600/1200?grayscale', 'Cart and checkout flow.', 1),
  ('shoplite', 'https://picsum.photos/seed/sample-gallery-3/1600/1200?grayscale', 'Order management for the seller.', 2),
  ('shoplite', 'https://picsum.photos/seed/sample-gallery-4/1600/1200?grayscale', null, 3),
  ('taskflow', 'https://picsum.photos/seed/sample-gallery-5/1600/1200?grayscale', 'Board view with drag-and-drop columns.', 0),
  ('taskflow', 'https://picsum.photos/seed/sample-gallery-6/1600/1200?grayscale', 'Task details and assignees.', 1),
  ('taskflow', 'https://picsum.photos/seed/sample-gallery-7/1600/1200?grayscale', null, 2)
) as v (slug, image_url, caption, sort_order)
join public.projects p on p.slug = v.slug;


-- Certificates ---------------------------------------------------------

insert into public.certificates (title, issuer, issued_on, credential_url, image_url, sort_order) values
  ('Responsive Web Design', 'Open Web Academy', '2025-08-01', 'https://example.com/credential/responsive-web-design',
   'https://picsum.photos/seed/sample-cert-1/800/600?grayscale', 0),
  ('Best User Interface Award, Campus Hackathon', 'Westbridge State University IT Society', '2024-11-01', null,
   'https://picsum.photos/seed/sample-cert-2/800/600?grayscale', 1),
  ('JavaScript Algorithms and Data Structures', 'Open Web Academy', '2024-03-01', 'https://example.com/credential/javascript',
   null, 2);


-- Testimonials ---------------------------------------------------------

insert into public.testimonials (name, role, quote, photo_url, sort_order) values
  ('Maria Santos', 'Project Lead, Brightlane Digital',
   'Alex picks things up quickly and asks the right questions. Within a few weeks Alex was shipping features on client projects with very little supervision.',
   'https://picsum.photos/seed/sample-person-1/400/400?grayscale', 0),
  ('Daniel Cruz', 'Owner, Cruz Family Bakery',
   'Our new ordering page made weekends so much easier. Alex explained everything in plain language and was always quick to help when we had questions.',
   'https://picsum.photos/seed/sample-person-2/400/400?grayscale', 1),
  ('Ana Reyes', 'Capstone Adviser, Westbridge State University',
   'A careful, reliable developer who thinks about the people using the system, not just the code.',
   'https://picsum.photos/seed/sample-person-3/400/400?grayscale', 2);


-- Messages -------------------------------------------------------------

insert into public.messages (name, email, subject, body, is_read, created_at) values
  ('Jamie Lopez', 'jamie.lopez@example.com', 'Website for my coffee shop',
   E'Hi Alex,\n\nI saw your ShopLite project and I''m interested in something similar for my coffee shop. Are you available for a short call next week?\n\nThanks,\nJamie',
   false, now() - interval '2 hours'),
  ('Chris Tan', 'chris.tan@example.com', 'Internship follow-up',
   'Hello! Thanks for sharing your portfolio during the career fair. Our team would love to hear about your capstone project. Please reply with a good time to talk.',
   true, now() - interval '3 days');
