import work03 from '../../examples/03-radial-burn.fxweave.json?raw';
import work05 from '../../examples/05-local-melt.fxweave.json?raw';
import work09 from '../../examples/09-hologram-scan.fxweave.json?raw';
import manifest03 from '../../examples/generated/03-radial-burn.manifest.json?raw';
import manifest05 from '../../examples/generated/05-local-melt.manifest.json?raw';
import manifest09 from '../../examples/generated/09-hologram-scan.manifest.json?raw';
import manifest03Url from '../../examples/generated/03-radial-burn.manifest.json?url';
import manifest05Url from '../../examples/generated/05-local-melt.manifest.json?url';
import manifest09Url from '../../examples/generated/09-hologram-scan.manifest.json?url';
import log03Url from '../../examples/03-radial-burn.creation-log.json?url';
import log05Url from '../../examples/05-local-melt.creation-log.json?url';
import log09Url from '../../examples/09-hologram-scan.creation-log.json?url';
import image03 from '../../docs/visuals/work03-radial-burn.png?url';
import image05 from '../../docs/visuals/work05-local-melt.png?url';
import image09 from '../../docs/visuals/work09-hologram-scan.png?url';
import { parseProject, type ProjectFile } from '../graph/project';

interface ExampleSource {
  id: string;
  title: string;
  purpose: string;
  projectJson: string;
  manifestJson: string;
  manifestUrl: string;
  creationLogUrl: string;
  imageUrl: string;
}

const sources: ExampleSource[] = [
  { id: '03', title: 'Radial burn', purpose: 'A local reveal with a noise edge and transparent cutout.', projectJson: work03, manifestJson: manifest03, manifestUrl: manifest03Url, creationLogUrl: log03Url, imageUrl: image03 },
  { id: '05', title: 'Local melt', purpose: 'A time driven wave that resamples the host image.', projectJson: work05, manifestJson: manifest05, manifestUrl: manifest05Url, creationLogUrl: log05Url, imageUrl: image05 },
  { id: '09', title: 'Hologram scan', purpose: 'Local scan lines and a small red channel offset.', projectJson: work09, manifestJson: manifest09, manifestUrl: manifest09Url, creationLogUrl: log09Url, imageUrl: image09 },
];

export const examples = sources.map(({ projectJson, manifestJson, ...item }) => ({
  ...item,
  buildId: (JSON.parse(manifestJson) as { buildId: string }).buildId,
}));

/** Parse the committed source afresh so every editor session has its own mutable project identity. */
export function deriveExample(id: string, projectId: string): ProjectFile {
  const source = sources.find((item) => item.id === id);
  if (!source) throw new Error(`Example ${id} is unavailable.`);
  const result = parseProject(source.projectJson);
  if (!result.ok) throw new Error(`Example ${id} is invalid: ${result.code}: ${result.message}`);
  return { ...result.project, id: projectId, name: `${result.project.name} copy` };
}
