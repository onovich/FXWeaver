import { useEffect, useRef, useState, type KeyboardEvent } from 'react';

interface Props { id: string; name: string; onCommit: (name: string) => boolean }

export function ParameterNameControl({ id, name, onCommit }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const [error, setError] = useState<string | null>(null);
  const skipBlur = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { setDraft(name); setError(null); }, [name]);
  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  function commit() {
    if (draft === name) { setEditing(false); return; }
    if (!draft.trim()) { setError('Parameter name cannot be empty.'); return; }
    if (!onCommit(draft)) { setError('Parameter name was rejected.'); return; }
    setError(null);
    setEditing(false);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') { skipBlur.current = true; commit(); event.currentTarget.blur(); }
    if (event.key === 'Escape') { skipBlur.current = true; setDraft(name); setError(null); setEditing(false); event.currentTarget.blur(); }
  }

  if (!editing) return <button className="text-button" type="button" onClick={() => setEditing(true)} aria-label={`Rename ${name}`}>Rename</button>;
  return <div className="parameter-name-control">
    <label htmlFor={id}>Parameter name</label>
    <input ref={inputRef} id={id} value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={onKeyDown} onBlur={() => { if (skipBlur.current) skipBlur.current = false; else commit(); }} aria-invalid={error !== null} />
    {error && <small className="field-error">{error}</small>}
    <small>Renaming may affect code that will use this parameter later. The ID stays stable.</small>
  </div>;
}
