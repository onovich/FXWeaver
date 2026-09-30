import { getNodeDefinition } from './registry';
import type { GraphDocument, JsonValue } from './schema';

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
export const MAX_PROJECT_IMAGE_BYTES = 3 * 1024 * 1024;
export const MAX_IMAGE_DIMENSION = 4096;
export type ImageMimeType = 'image/png' | 'image/jpeg' | 'image/webp';

export interface EmbeddedImage {
  id: string;
  name: string;
  mimeType: ImageMimeType;
  dataUrl: string;
  width: number;
  height: number;
}

export interface ProjectAssets {
  dependencies: EmbeddedImage[];
  preview: EmbeddedImage[];
}

export interface PreviewScene {
  host: 'sprite' | 'container';
  sourceAssetId: string | null;
  background: 'checker' | 'dark' | 'light';
  width: number;
  height: number;
  padding: number;
  filterAreaInset: number;
  resolution: number;
  sampling: 'nearest' | 'linear';
  timeSeconds: number;
  parameterValues: Record<string, JsonValue>;
}

export interface AssetIssue {
  code: 'MISSING_PREVIEW_ASSET' | 'MISSING_DEPENDENCY_ASSET';
  message: string;
  assetId: string;
  nodeId?: string;
}

export function createEmptyAssets(): ProjectAssets { return { dependencies: [], preview: [] }; }

export function createDefaultPreviewScene(): PreviewScene {
  return { host: 'sprite', sourceAssetId: null, background: 'checker', width: 400, height: 320,
    padding: 0, filterAreaInset: 0, resolution: 1, sampling: 'linear', timeSeconds: 0, parameterValues: {} };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

function imageBytes(image: EmbeddedImage): number {
  const payload = image.dataUrl.slice(image.dataUrl.indexOf(',') + 1);
  return payload.length * 3 / 4 - (payload.endsWith('==') ? 2 : payload.endsWith('=') ? 1 : 0);
}

/** Validate portable image data before accepting it into a project or browser draft. */
export function checkProjectAssets(value: unknown): { ok: true; assets: ProjectAssets } | { ok: false; code: 'INVALID_ASSET' | 'ASSET_TOO_LARGE'; message: string } {
  if (!isRecord(value) || !Array.isArray(value.dependencies) || !Array.isArray(value.preview)) {
    return { ok: false, code: 'INVALID_ASSET', message: 'Project assets must have dependency and preview image lists.' };
  }
  const assets = value as unknown as ProjectAssets;
  const ids = new Set<string>();
  let totalBytes = 0;
  for (const image of [...assets.dependencies, ...assets.preview]) {
    if (!isRecord(image) || typeof image.id !== 'string' || !image.id || ids.has(image.id) ||
      typeof image.name !== 'string' || !image.name ||
      !['image/png', 'image/jpeg', 'image/webp'].includes(image.mimeType) ||
      !isPositiveInteger(image.width) || image.width > MAX_IMAGE_DIMENSION ||
      !isPositiveInteger(image.height) || image.height > MAX_IMAGE_DIMENSION ||
      typeof image.dataUrl !== 'string' ||
      !new RegExp(`^data:${image.mimeType};base64,(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$`).test(image.dataUrl)) {
      return { ok: false, code: 'INVALID_ASSET', message: 'An image has an invalid ID, format, size, or embedded data.' };
    }
    ids.add(image.id);
    const bytes = imageBytes(image);
    if (bytes > MAX_IMAGE_BYTES) return { ok: false, code: 'ASSET_TOO_LARGE', message: `${image.name} exceeds the 2 MiB per-image limit.` };
    totalBytes += bytes;
  }
  if (totalBytes > MAX_PROJECT_IMAGE_BYTES) {
    return { ok: false, code: 'ASSET_TOO_LARGE', message: 'Embedded images exceed the 3 MiB project limit.' };
  }
  return { ok: true, assets };
}

export function isPreviewScene(value: unknown): value is PreviewScene {
  if (!isRecord(value) || !isRecord(value.parameterValues)) return false;
  return ['sprite', 'container'].includes(value.host as string) &&
    (value.sourceAssetId === null || typeof value.sourceAssetId === 'string' && value.sourceAssetId.length > 0) &&
    ['checker', 'dark', 'light'].includes(value.background as string) &&
    isPositiveInteger(value.width) && value.width <= 2048 &&
    isPositiveInteger(value.height) && value.height <= 2048 &&
    typeof value.padding === 'number' && Number.isFinite(value.padding) && value.padding >= 0 && value.padding <= 256 &&
    typeof value.filterAreaInset === 'number' && Number.isFinite(value.filterAreaInset) && value.filterAreaInset >= 0 && value.filterAreaInset <= 64 &&
    typeof value.resolution === 'number' && [0.5, 1, 2].includes(value.resolution) &&
    ['nearest', 'linear'].includes(value.sampling as string) &&
    typeof value.timeSeconds === 'number' && Number.isFinite(value.timeSeconds) && value.timeSeconds >= 0 &&
    Object.values(value.parameterValues).every(isJsonValue);
}

function isJsonValue(value: unknown): value is JsonValue {
  return value === null || typeof value === 'string' || typeof value === 'boolean' ||
    typeof value === 'number' && Number.isFinite(value) ||
    Array.isArray(value) && value.every(isJsonValue) ||
    isRecord(value) && Object.values(value).every(isJsonValue);
}

export function findAssetIssues(graph: GraphDocument, assets: ProjectAssets, preview: PreviewScene): AssetIssue[] {
  const issues: AssetIssue[] = [];
  if (preview.sourceAssetId && !assets.preview.some((image) => image.id === preview.sourceAssetId)) {
    issues.push({ code: 'MISSING_PREVIEW_ASSET', message: `Preview image ${preview.sourceAssetId} is missing.`, assetId: preview.sourceAssetId });
  }
  for (const node of graph.nodes) {
    const definition = getNodeDefinition(graph.graphKind, node.type);
    for (const property of definition?.properties ?? []) {
      if (property.type !== 'texture') continue;
      const assetId = node.values[property.id];
      if (typeof assetId === 'string' && assetId && !assets.dependencies.some((image) => image.id === assetId)) {
        issues.push({ code: 'MISSING_DEPENDENCY_ASSET', message: `Dependency image ${assetId} is missing.`, assetId, nodeId: node.id });
      }
    }
  }
  return issues;
}
