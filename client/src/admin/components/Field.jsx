// Field definitions: { name, label, type, required, hint, rows, min, max, options, numeric }
// type: text | textarea | email | url | date | number | checkbox | select | tags | color

export function toFormValues(fields, row = {}) {
  const values = {};
  for (const field of fields) {
    const value = row?.[field.name];
    if (field.type === 'tags') values[field.name] = (value || []).join(', ');
    else if (field.type === 'checkbox') values[field.name] = Boolean(value);
    else if (value === null || value === undefined) values[field.name] = field.default ?? '';
    else values[field.name] = String(value);
  }
  return values;
}

export function toPayload(fields, values) {
  const payload = {};
  for (const field of fields) {
    const value = values[field.name];
    if (field.type === 'tags') {
      payload[field.name] = value.split(',').map((tag) => tag.trim()).filter(Boolean);
    } else if (field.type === 'checkbox') {
      payload[field.name] = Boolean(value);
    } else if (field.type === 'number' || field.numeric) {
      payload[field.name] = value === '' ? null : Number(value);
    } else {
      payload[field.name] = value;
    }
  }
  return payload;
}

export function Field({ field, value, onChange, error, disabled }) {
  const id = `field-${field.name}`;
  const describedBy = [field.hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;
  const common = {
    id,
    name: field.name,
    required: field.required,
    disabled,
    'aria-invalid': error ? 'true' : undefined,
    'aria-describedby': describedBy,
  };

  if (field.type === 'checkbox') {
    return (
      <div className="admin-field admin-field--check">
        <label className="admin-check" htmlFor={id}>
          <input {...common} type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
          {field.label}
        </label>
        {field.hint && <p id={`${id}-hint`} className="admin-hint">{field.hint}</p>}
        {error && <p id={`${id}-error`} className="admin-error">{error}</p>}
      </div>
    );
  }

  let control;
  switch (field.type) {
    case 'textarea':
      control = <textarea {...common} rows={field.rows || 5} value={value} onChange={(e) => onChange(e.target.value)} />;
      break;
    case 'select':
      control = (
        <select {...common} value={value} onChange={(e) => onChange(e.target.value)}>
          {!field.required && <option value="">None</option>}
          {field.required && !value && <option value="" disabled>Choose…</option>}
          {(field.options || []).map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      );
      break;
    case 'color':
      control = (
        <div className="admin-color">
          <input
            type="color"
            aria-label={`${field.label} picker`}
            value={/^#[0-9a-f]{6}$/i.test(value) ? value : '#000000'}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
          />
          <input {...common} type="text" value={value} onChange={(e) => onChange(e.target.value)} pattern="#[0-9a-fA-F]{6}" />
        </div>
      );
      break;
    case 'tags':
      control = <input {...common} type="text" value={value} onChange={(e) => onChange(e.target.value)} />;
      break;
    default:
      control = (
        <input
          {...common}
          type={field.type || 'text'}
          value={value}
          min={field.min}
          max={field.max}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }

  return (
    <div className={`admin-field${field.wide ? ' admin-field--wide' : ''}`}>
      <label htmlFor={id}>
        {field.label}
        {field.required && <span className="admin-required" aria-hidden="true"> *</span>}
      </label>
      {control}
      {field.hint && <p id={`${id}-hint`} className="admin-hint">{field.hint}</p>}
      {error && <p id={`${id}-error`} className="admin-error">{error}</p>}
    </div>
  );
}

export function FieldGrid({ fields, values, setValues, errors = {}, disabled }) {
  return (
    <div className="admin-field-grid">
      {fields.map((field) => (
        <Field
          key={field.name}
          field={field}
          value={values[field.name]}
          error={errors[field.name]}
          disabled={disabled}
          onChange={(value) => setValues((prev) => ({ ...prev, [field.name]: value }))}
        />
      ))}
    </div>
  );
}
