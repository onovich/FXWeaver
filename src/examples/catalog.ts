import manifest03 from '../../examples/showcase/03-radial-burn.manifest.json?raw';
import manifest05 from '../../examples/generated/05-local-melt.manifest.json?raw';
import manifest09 from '../../examples/showcase/09-hologram-scan.manifest.json?raw';
import manifest03Url from '../../examples/showcase/03-radial-burn.manifest.json?url';
import manifest05Url from '../../examples/generated/05-local-melt.manifest.json?url';
import manifest09Url from '../../examples/showcase/09-hologram-scan.manifest.json?url';
import log03Url from '../../examples/showcase/03-radial-burn.creation-log.json?url';
import log05Url from '../../examples/05-local-melt.creation-log.json?url';
import log09Url from '../../examples/showcase/09-hologram-scan.creation-log.json?url';
import image03 from '../../docs/visuals/showcase-03-effect.png?url';
import image05 from '../../docs/visuals/showcase-05-effect.png?url';
import image09 from '../../docs/visuals/showcase-09-effect.png?url';
import { parseProject, type ProjectFile } from '../graph/project';

interface ExampleSource {
  id: string;
  title: string;
  purpose: string;
  loadProject: () => Promise<string>;
  manifestJson: string;
  manifestUrl: string;
  creationLogUrl: string;
  imageUrl: string;
}

const sources: ExampleSource[] = [
  { id: '03', title: 'Radial burn', purpose: 'Animated orange-hot erosion. Play the cycle; set Auto burn to 0 for manual Burn progress.', loadProject: async () => (await import('../../examples/showcase/03-radial-burn.fxweave.json?raw')).default, manifestJson: manifest03, manifestUrl: manifest03Url, creationLogUrl: log03Url, imageUrl: image03 },
  { id: '05', title: 'Local melt', purpose: 'A time driven wave that resamples the host image.', loadProject: async () => (await import('../../examples/showcase/05-local-melt.fxweave.json?raw')).default, manifestJson: manifest05, manifestUrl: manifest05Url, creationLogUrl: log05Url, imageUrl: image05 },
  { id: '09', title: 'Hologram scan', purpose: 'Fine scan lines, restrained RGB separation, moving scan glow and intermittent horizontal glitches.', loadProject: async () => (await import('../../examples/showcase/09-hologram-scan.fxweave.json?raw')).default, manifestJson: manifest09, manifestUrl: manifest09Url, creationLogUrl: log09Url, imageUrl: image09 },
];

export const examples = sources.map(({ loadProject: _loadProject, manifestJson, ...item }) => ({
  ...item,
  buildId: (JSON.parse(manifestJson) as { buildId: string }).buildId,
}));

/** Parse the committed source afresh so every editor session has its own mutable project identity. */
export async function deriveExample(id: string, projectId: string): Promise<ProjectFile> {
  const source = sources.find((item) => item.id === id);
  if (!source) throw new Error(`Example ${id} is unavailable.`);
  const result = parseProject(await source.loadProject());
  if (!result.ok) throw new Error(`Example ${id} is invalid: ${result.code}: ${result.message}`);
  return { ...result.project, layout: { ...result.project.layout, selectedNodeIds: [] }, id: projectId, name: `${result.project.name} copy` };
}
