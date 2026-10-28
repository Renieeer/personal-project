import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import CollectionEditor from '../components/CollectionEditor.jsx';
import { resources } from '../resources.js';

export default function SkillsPage() {
  const [categories, setCategories] = useState([]);
  const [selected, setSelected] = useState('');

  // Keep a valid category selected as categories are added or removed.
  useEffect(() => {
    if (!categories.length) setSelected('');
    else if (!categories.some((c) => String(c.id) === selected)) setSelected(String(categories[0].id));
  }, [categories, selected]);

  const context = useMemo(() => ({ categories }), [categories]);
  const query = useMemo(() => (selected ? { category_id: selected } : undefined), [selected]);
  const defaults = useMemo(() => ({ category_id: selected ? Number(selected) : '' }), [selected]);

  return (
    <>
      <header className="admin-panel-head admin-page-title">
        <h1 className="admin-title">Skills</h1>
        <Link className="admin-button admin-button--ghost" to="/admin/editor?section=skills">Edit on the live page</Link>
      </header>
      <CollectionEditor config={resources.skill_categories} onItemsChange={setCategories} />

      <section className="admin-panel">
        {categories.length === 0 ? (
          <p className="admin-empty">Add a category before adding skills.</p>
        ) : (
          <>
            <div className="admin-field admin-filter">
              <label htmlFor="skill-category-filter">Showing skills in</label>
              <select id="skill-category-filter" value={selected} onChange={(e) => setSelected(e.target.value)}>
                {categories.map((c) => (
                  <option key={c.id} value={String(c.id)}>{c.name}</option>
                ))}
              </select>
            </div>
            {selected && (
              <CollectionEditor
                key={selected}
                config={resources.skills}
                context={context}
                query={query}
                defaults={defaults}
              />
            )}
          </>
        )}
      </section>
    </>
  );
}
