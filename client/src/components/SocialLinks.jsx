import { EditAdd, EditItem, EditText, useEditor } from '../lib/edit.jsx';

// With `editable`, the live editor shows hidden links too, with their toolbars.
export default function SocialLinks({ links, className = 'social-list', editable = false }) {
  const editor = useEditor();
  const edit = Boolean(editable && editor);
  const shown = (links || []).filter((link) => edit || link.is_visible !== false);
  if (!shown.length) return edit ? <EditAdd table="social_links" /> : null;
  return (
    <>
      <ul className={className}>
        {shown.map((link) => {
          const external = /^https?:/i.test(link.url);
          return (
            <li key={link.id}>
              <a
                className="text-link"
                href={link.url}
                {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
              >
                {edit ? <EditText at={`social_links.${link.id}.platform`}>{link.platform}</EditText> : link.platform}
              </a>
              {edit && <EditItem at={`social_links.${link.id}`} />}
            </li>
          );
        })}
      </ul>
      {edit && <EditAdd table="social_links" />}
    </>
  );
}
