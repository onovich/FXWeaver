import { useState } from 'react';
import { PropertyControl } from './PropertyControl';
import type { PreviewScene } from '../graph/assets';
import type { GraphDocument, JsonValue } from '../graph/schema';
import { isValueOfType } from '../graph/values';

interface Props {
  graph: GraphDocument;
  scene: PreviewScene;
  playing: boolean;
  displayTime: number;
  onPlayChange: (playing: boolean) => void;
  onSetTime: (seconds: number) => void;
  onParameterChange: (id: string, value: JsonValue) => void;
  onResetParameters: () => void;
}

export function RuntimeControls({ graph, scene, playing, displayTime, onPlayChange, onSetTime,
  onParameterChange, onResetParameters }: Props) {
  const [initialOverrides] = useState(() => new Set(Object.keys(scene.parameterValues)));
  const parameters = [...graph.parameters].sort((a, b) => Number(initialOverrides.has(b.id)) - Number(initialOverrides.has(a.id)));
  return <div className="runtime-controls">
    <h3>Playback</h3>
    <div className="playback-row">
      <button type="button" onClick={() => onPlayChange(!playing)}>{playing ? 'Pause' : 'Play'}</button>
      <button type="button" onClick={() => onSetTime(0)}>Reset to 0</button>
      <output aria-label="Preview time">{displayTime.toFixed(2)} s</output>
    </div>
    <label className="fixed-time-label">Fixed seconds<input type="number" aria-label="Fixed preview time" min="0" step="0.01" disabled={playing}
      value={scene.timeSeconds} onChange={(event) => { const value = Number(event.target.value); if (Number.isFinite(value) && value >= 0) onSetTime(value); }} /></label>
    <div className="runtime-parameter-heading"><h3>Runtime parameters</h3><button type="button" disabled={graph.parameters.length === 0} onClick={onResetParameters}>Defaults</button></div>
    {graph.parameters.length === 0 && <p className="preview-note">Expose a node value as a parameter to adjust it without changing the generated code.</p>}
    {parameters.map((parameter) => {
      const value = scene.parameterValues[parameter.id] ?? parameter.defaultValue;
      return <div key={parameter.id} className="runtime-parameter">
        <PropertyControl id={`runtime-${parameter.id}`} property={{ id: parameter.sourceKey, label: parameter.name, type: parameter.valueType,
          defaultValue: parameter.defaultValue, min: parameter.min, max: parameter.max,
          step: parameter.min !== undefined && parameter.max !== undefined ? (parameter.max - parameter.min) / 100 || 0.01 : undefined }}
          value={value} onCommit={(next) => {
            if (!isValueOfType(next, parameter.valueType) ||
              typeof next === 'number' && (parameter.min !== undefined && next < parameter.min || parameter.max !== undefined && next > parameter.max)) return false;
            onParameterChange(parameter.id, next);
            return true;
          }} />
        <small>Live value / graph default {String(parameter.defaultValue)}</small>
      </div>;
    })}
  </div>;
}
