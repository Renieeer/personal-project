import { paragraphs } from '../lib/format.js';
import { EditText, useEditor } from '../lib/edit.jsx';

// Renders plain text as paragraphs (blank line = new paragraph).
// `at` makes it editable in the admin live editor (see lib/edit.jsx).
export default function Prose({ text, className = 'prose', at }) {
  const editor = useEditor();
  if (editor && at) return <EditText at={at} block className={className} />;
  const parts = paragraphs(text);
  if (!parts.length) return null;
  return (
    <div className={className}>
      {parts.map((part, i) => (
        <p key={i}>{part}</p>
      ))}
    </div>
  );
}
