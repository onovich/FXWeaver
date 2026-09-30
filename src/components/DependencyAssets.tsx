import { useState } from 'react';
import { checkProjectAssets, type ProjectAssets } from '../graph/assets';
import { readEmbeddedImage } from '../graph/imageImport';
import type { GraphDocument } from '../graph/schema';

interface Props { graph: GraphDocument; assets: ProjectAssets; onAssetsChange: (assets: ProjectAssets) => void }

export function DependencyAssets({ graph, assets, onAssetsChange }: Props) {
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const add = async (file: File) => {
    setBusy(true);
    try {
      const image = await readEmbeddedImage(file);
      const candidate = { ...assets, dependencies: [...assets.dependencies, image] };
      const checked = checkProjectAssets(candidate);
      if (!checked.ok) throw new Error(checked.message);
      onAssetsChange(candidate);
      setMessage(`${file.name} added as a graph dependency. Select it in a Sample Image node.`);
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  };

  return <section className="dependency-assets" aria-labelledby="dependency-assets-heading">
    <p className="section-kicker">PROJECT ASSETS</p>
    <h3 id="dependency-assets-heading">Dependency images</h3>
    <p>Embedded images sampled by graph nodes. Preview source images are managed in the Preview panel.</p>
    <label>Import dependency image<input aria-label="Import dependency image" type="file" accept="image/png,image/jpeg,image/webp" disabled={busy}
      onChange={(event) => { const file = event.target.files?.[0]; if (file) void add(file); event.target.value = ''; }} /></label>
    {assets.dependencies.length === 0 && <p>No dependency images yet.</p>}
    <ul>{assets.dependencies.map((image) => {
      const references = graph.nodes.filter((node) => Object.values(node.values).includes(image.id)).length;
      return <li key={image.id}>
        <strong>{image.name}</strong><small>{image.width} × {image.height} · {image.id.slice(0, 8)} · {references} node{references === 1 ? '' : 's'}</small>
        <button type="button" aria-label={`Remove dependency ${image.name}`} onClick={() => {
          onAssetsChange({ ...assets, dependencies: assets.dependencies.filter((item) => item.id !== image.id) });
          setMessage(references ? `${image.name} removed; ${references} graph node${references === 1 ? ' now has' : 's now have'} a missing dependency.` : `${image.name} removed.`);
        }}>Remove</button>
      </li>;
    })}</ul>
    {message && <p role="status" className="dependency-message">{message}</p>}
  </section>;
}
