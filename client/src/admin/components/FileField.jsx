import { useEffect, useMemo, useRef } from 'react';

// Shows the current file (or a pending local file) with Choose/Replace/Remove actions.
export default function FileField({ file, url, pendingFile, busy, onSelect, onRemove }) {
  const inputRef = useRef(null);
  const isImage = file.kind !== 'pdf';

  const pendingPreview = useMemo(
    () => (pendingFile && isImage ? URL.createObjectURL(pendingFile) : null),
    [pendingFile, isImage],
  );
  useEffect(() => () => pendingPreview && URL.revokeObjectURL(pendingPreview), [pendingPreview]);

  const previewUrl = pendingPreview || url;
  const hasFile = Boolean(url || pendingFile);

  return (
    <div className="admin-file">
      <p className="admin-label">{file.label}</p>
      <div className="admin-file-row">
        {isImage ? (
          previewUrl
            ? <img className={`admin-file-preview${file.kind === 'icon' ? ' is-icon' : ''}`} src={previewUrl} alt="" />
            : <span className="admin-file-empty">No image</span>
        ) : (
          <span className="admin-file-doc">
            {pendingFile
              ? pendingFile.name
              : url ? <a href={url} target="_blank" rel="noreferrer">Open current file</a> : 'No file'}
          </span>
        )}
        <div className="admin-file-actions">
          <button
            type="button"
            className="admin-button admin-button--ghost admin-button--small"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
          >
            {busy ? 'Uploading…' : hasFile ? 'Replace' : 'Choose file'}
          </button>
          {hasFile && onRemove && (
            <button type="button" className="admin-link-button admin-danger-text" onClick={onRemove} disabled={busy}>
              Remove
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={file.accept}
          hidden
          onChange={(event) => {
            const selected = event.target.files?.[0];
            event.target.value = '';
            if (selected) onSelect(selected);
          }}
        />
      </div>
      {pendingFile && <p className="admin-hint">Uploads when you save.</p>}
      {file.hint && <p className="admin-hint">{file.hint}</p>}
    </div>
  );
}
