import { useEffect, useState } from 'react';
import type { GraphParameter } from '../graph/schema';

interface Props { parameter: GraphParameter; onCommit: (min: number, max: number) => boolean }

export function ParameterRangeControl({ parameter, onCommit }: Props) {
  const [min, setMin] = useState(String(parameter.min ?? 0));
  const [max, setMax] = useState(String(parameter.max ?? 1));
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { setMin(String(parameter.min ?? 0)); setMax(String(parameter.max ?? 1)); setError(null); }, [parameter.min, parameter.max]);

  const commit = () => {
    if (min.trim() === '' || max.trim() === '' || !onCommit(Number(min), Number(max))) {
      setError('Choose a finite range that contains the default value.');
      return;
    }
    setError(null);
  };
  return <div className="parameter-range">
    <label>Slider min<input aria-label="Slider minimum" type="number" step="any" value={min} onChange={(event) => setMin(event.target.value)} /></label>
    <label>Slider max<input aria-label="Slider maximum" type="number" step="any" value={max} onChange={(event) => setMax(event.target.value)} /></label>
    <button type="button" onClick={commit}>Set range</button>
    {error && <small className="field-error">{error}</small>}
  </div>;
}
