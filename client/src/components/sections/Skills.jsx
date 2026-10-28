import Section from '../Section.jsx';
import Reveal from '../Reveal.jsx';
import { EditAdd, EditItem, EditText, useEditor } from '../../lib/edit.jsx';

export default function Skills({ data, section, index }) {
  const editor = useEditor();
  // The live editor also shows empty categories, so skills can be added to them.
  const categories = editor ? data.skills : data.skills.filter((category) => category.skills?.length);

  return (
    <Section section={section} index={index}>
      <div className="skill-groups">
        {categories.map((category, i) => (
          <Reveal key={category.id} className="skill-group" delay={(i % 2) * 100}>
            <h3 className="eyebrow"><EditText at={`skill_categories.${category.id}.name`}>{category.name}</EditText></h3>
            <ul className="skill-list">
              {category.skills.map((skill) => (
                <li key={skill.id} className="skill">
                  <span className="skill-name"><EditText at={`skills.${skill.id}.name`}>{skill.name}</EditText></span>
                  {skill.level != null && (
                    <span
                      className="skill-level"
                      role="meter"
                      aria-label={`${skill.name} proficiency`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={skill.level}
                    >
                      <span style={{ width: `${skill.level}%` }} />
                    </span>
                  )}
                  <EditItem at={`skills.${skill.id}`} />
                </li>
              ))}
            </ul>
            <EditAdd table="skills" parent={category.id} />
            <EditItem at={`skill_categories.${category.id}`} />
          </Reveal>
        ))}
      </div>
      <EditAdd table="skill_categories" />
    </Section>
  );
}
