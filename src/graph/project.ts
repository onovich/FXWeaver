import { applyCommand, createEditorDocument, type EditorDocument } from './commands';
import type { GraphIssue } from './diagnostics';
import { FILTER_GRAPH_KIND, FOUNDATION_GRAPH_KIND, getGraphKind } from './registry';
import { GRAPH_SCHEMA_VERSION, graphFingerprint, semanticGraphJson, type GraphDocument, type GraphLayout, type ValueType } from './schema';
import { validateGraph } from './validation';

export const PROJECT_FILE_VERSION = 2 as const;
export const PROJECT_EXTENSION = '.fxweave.json';
export const FILTER_RENDERER_TARGET = 'pixi.webgl2' as const;
export type RendererTarget = null | typeof FILTER_RENDERER_TARGET;

export interface ProjectFile {
  projectVersion: typeof PROJECT_FILE_VERSION;
  id: string;
  name: string;
  rendererTarget: RendererTarget;
  graph: GraphDocument;
  layout: GraphLayout;
}

export type ProjectImportErrorCode =
  | 'INVALID_JSON'
  | 'INVALID_PROJECT'
  | 'UNSUPPORTED_PROJECT_VERSION'
  | 'UNSUPPORTED_GRAPH_SCHEMA'
  | 'UNSUPPORTED_GRAPH_KIND'
  | 'INCOMPATIBLE_GRAPH';

export type ProjectImportResult =
  | { ok: true; project: ProjectFile; issues: GraphIssue[]; migratedFromVersion?: 1 }
  | { ok: false; code: ProjectImportErrorCode; message: string };

export function createProject(id: string, name: string, graphKind: string, rootNodeId: string): ProjectFile {
  const kind = getGraphKind(graphKind);
  if (!kind) throw new Error(`Graph kind ${graphKind} is not supported.`);
  const initial = createEditorDocument(graphKind);
  const result = applyCommand(initial, { type: 'add-node', nodeId: rootNodeId, nodeType: kind.rootNodeType, position: { x: 520, y: 260 } });
  if (!result.ok) throw new Error(result.issue.message);
  return { projectVersion: PROJECT_FILE_VERSION, id, name,
    rendererTarget: graphKind === FILTER_GRAPH_KIND ? FILTER_RENDERER_TARGET : null, ...result.document };
}

export function withEditorDocument(project: ProjectFile, document: EditorDocument): ProjectFile {
  return { ...project, graph: document.graph, layout: document.layout };
}

/** Stable, readable project file. Canvas layout remains separate from graph semantics. */
export function serializeProject(project: ProjectFile): string {
  const nodePositions = Object.fromEntries(Object.entries(project.layout.nodePositions).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0));
  return `${JSON.stringify({
    projectVersion: project.projectVersion,
    id: project.id,
    name: project.name,
    rendererTarget: project.rendererTarget,
    graph: JSON.parse(semanticGraphJson(project.graph)) as GraphDocument,
    layout: {
      nodePositions,
      viewport: { x: project.layout.viewport.x, y: project.layout.viewport.y, zoom: project.layout.viewport.zoom },
      selectedNodeIds: [...project.layout.selectedNodeIds].sort(),
    },
  }, null, 2)}\n`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isString(value: unknown): value is string { return typeof value === 'string' && value.length > 0; }
function isFiniteNumber(value: unknown): value is number { return typeof value === 'number' && Number.isFinite(value); }
function isPortRef(value: unknown): boolean { return isRecord(value) && isString(value.nodeId) && isString(value.portId); }

function isGraphShape(value: unknown): value is GraphDocument {
  if (!isRecord(value) || !Array.isArray(value.nodes) || !Array.isArray(value.edges) || !Array.isArray(value.parameters)) return false;
  return value.nodes.every((node) => isRecord(node) && isString(node.id) && isString(node.type) && isFiniteNumber(node.definitionVersion) && isRecord(node.values)) &&
    value.edges.every((edge) => isRecord(edge) && isString(edge.id) && isPortRef(edge.from) && isPortRef(edge.to)) &&
    value.parameters.every((parameter) => isRecord(parameter) && isString(parameter.id) && isString(parameter.name) &&
      isString(parameter.valueType) && isString(parameter.sourceNodeId) && isString(parameter.sourceKey) && 'defaultValue' in parameter &&
      (parameter.min === undefined || isFiniteNumber(parameter.min)) && (parameter.max === undefined || isFiniteNumber(parameter.max)));
}

function isLayoutShape(value: unknown): value is GraphLayout {
  if (!isRecord(value) || !isRecord(value.nodePositions) || !isRecord(value.viewport) || !Array.isArray(value.selectedNodeIds)) return false;
  return Object.values(value.nodePositions).every((position) => isRecord(position) && isFiniteNumber(position.x) && isFiniteNumber(position.y)) &&
    isFiniteNumber(value.viewport.x) && isFiniteNumber(value.viewport.y) && isFiniteNumber(value.viewport.zoom) && value.viewport.zoom > 0 &&
    value.selectedNodeIds.every(isString);
}

const valueTypes = new Set<ValueType>(['float', 'vec2', 'vec3', 'vec4', 'color', 'texture']);

export function parseProject(json: string): ProjectImportResult {
  let value: unknown;
  try { value = JSON.parse(json); }
  catch { return { ok: false, code: 'INVALID_JSON', message: 'The file is not valid JSON.' }; }
  if (!isRecord(value)) return { ok: false, code: 'INVALID_PROJECT', message: 'The file is not an FXWeave project object.' };
  if (value.projectVersion !== 1 && value.projectVersion !== PROJECT_FILE_VERSION) {
    return { ok: false, code: 'UNSUPPORTED_PROJECT_VERSION', message: `Project version ${String(value.projectVersion)} is not supported.` };
  }
  if (!isRecord(value.graph) || value.graph.schemaVersion !== GRAPH_SCHEMA_VERSION) {
    return { ok: false, code: 'UNSUPPORTED_GRAPH_SCHEMA', message: `Graph schema ${String(isRecord(value.graph) ? value.graph.schemaVersion : 'missing')} is not supported.` };
  }
  if (!isString(value.graph.graphKind) || !getGraphKind(value.graph.graphKind)) {
    return { ok: false, code: 'UNSUPPORTED_GRAPH_KIND', message: `Graph kind ${String(value.graph.graphKind)} is not supported.` };
  }
  if (!isString(value.id) || !isString(value.name) || !isGraphShape(value.graph) || !isLayoutShape(value.layout) ||
    value.graph.parameters.some((parameter) => !valueTypes.has(parameter.valueType))) {
    return { ok: false, code: 'INVALID_PROJECT', message: 'The project has missing or malformed fields.' };
  }
  const legacy = value.projectVersion === 1;
  if (legacy && (value.graph.graphKind !== FOUNDATION_GRAPH_KIND || value.rendererTarget !== null)) {
    return { ok: false, code: 'INVALID_PROJECT', message: 'Version 1 can only contain a foundation.test graph without a renderer.' };
  }
  if (!legacy && ((value.graph.graphKind === FOUNDATION_GRAPH_KIND && value.rendererTarget !== null) ||
    (value.graph.graphKind === FILTER_GRAPH_KIND && value.rendererTarget !== FILTER_RENDERER_TARGET))) {
    return { ok: false, code: 'INVALID_PROJECT', message: 'Renderer target does not match the graph kind.' };
  }
  // A V1 file becomes a V2 in-memory project. Its graph, layout, and identity are left intact.
  const project = { ...value, projectVersion: PROJECT_FILE_VERSION } as unknown as ProjectFile;
  const issues = validateGraph(project.graph);
  const incompatible = issues.find((issue) => ['UNKNOWN_NODE_TYPE', 'UNSUPPORTED_DEFINITION_VERSION', 'DUPLICATE_NODE_ID', 'DUPLICATE_EDGE_ID'].includes(issue.code));
  if (incompatible) return { ok: false, code: 'INCOMPATIBLE_GRAPH', message: incompatible.message };
  return { ok: true, project, issues, ...(legacy ? { migratedFromVersion: 1 as const } : {}) };
}

export function projectSemanticFingerprint(project: ProjectFile): string {
  return graphFingerprint(project.graph);
}
