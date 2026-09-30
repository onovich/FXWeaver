import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import type { PropertyDefinition } from '../graph/registry';
import type { JsonValue } from '../graph/schema';

interface Props {
  id: string;
  property: PropertyDefinition;
  value: JsonValue;
  onCommit: (value: JsonValue) => boolean;
}

function format(value: JsonValue): string {
  return Array.isArray(value) ? value.join(', ') : String(value);
}

function parse(raw: string, property: PropertyDefinition): JsonValue | undefined {
  if (property.type === 'float') {
    if (raw.trim() === '') return undefined;
    const value = Number(raw);
    return Number.isFinite(value) ? value : undefined;
  }
  if (property.type === 'vec2' || property.type === 'vec3' || property.type === 'vec4') {
    const length = Number(property.type.slice(3));
    const values = raw.split(',').map((part) => Number(part.trim()));
    return values.length === length && values.every(Number.isFinite) ? values : undefined;
  }
  return raw;
}

export function PropertyControl({ id, property, value, onCommit }: Props) {
  const [draft, setDraft] = useState(format(value));
  const [error, setError] = useState<string | null>(null);
  const skipBlur = useRef(false);

  useEffect(() => { setDraft(format(value)); setError(null); }, [value]);

  function commit() {
    const parsed = parse(draft, property);
    if (parsed === undefined) { setError('Enter a valid value.'); return; }
    if (JSON.stringify(parsed) === JSON.stringify(value)) { setError(null); return; }
    if (!onCommit(parsed)) { setError('Value rejected; the previous value is preserved.'); return; }
    setError(null);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') { skipBlur.current = true; commit(); event.currentTarget.blur(); }
    if (event.key === 'Escape') { skipBlur.current = true; setDraft(format(value)); setError(null); event.currentTarget.blur(); }
  }

  function onBlur() {
    if (skipBlur.current) { skipBlur.current = false; return; }
    commit();
  }

  return <div className="property-control">
    <label htmlFor={id}>{property.label}</label>
    <input id={id} type={property.type === 'float' ? 'number' : 'text'} min={property.min} max={property.max} step={property.step ?? 'any'} value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={onKeyDown} onBlur={onBlur} aria-invalid={error !== null} aria-describedby={error ? `${id}-error` : undefined} />
    {property.type === 'float' && typeof value === 'number' && property.min !== undefined && property.max !== undefined &&
      <input aria-label={`${property.label} slider`} type="range" min={property.min} max={property.max} step={property.step ?? 1} value={draft === '' || !Number.isFinite(Number(draft)) ? value : Number(draft)} onChange={(event) => setDraft(event.target.value)} onPointerUp={commit} onKeyUp={commit} />}
    {error && <small id={`${id}-error`} className="field-error">{error}</small>}
  </div>;
}
