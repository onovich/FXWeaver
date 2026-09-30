import { describe, expect, it } from 'vitest';
import { MAX_IMAGE_BYTES } from './assets';
import { applyCommand } from './commands';
import { createProject, parseProject, projectSemanticFingerprint, serializeProject, withEditorDocument } from './project';
import { FILTER_GRAPH_KIND, FOUNDATION_GRAPH_KIND } from './registry';

describe('project file', () => {
  it('creates a distinct Filter graph with a WebGL2 target and one undeletable root', () => {
    const filter = createProject('filter-1', 'New Filter', FILTER_GRAPH_KIND, 'output');
    expect(filter).toMatchObject({ projectVersion: 3, rendererTarget: 'pixi.webgl2', graph: { graphKind: FILTER_GRAPH_KIND } });
    expect(filter.graph.nodes.map((node) => node.type)).toEqual(['filter.output']);
    expect(parseProject(serializeProject(filter))).toMatchObject({ ok: true, project: filter });
    expect(applyCommand({ graph: filter.graph, layout: filter.layout }, { type: 'delete-nodes', nodeIds: ['output'] }).ok).toBe(false);
    expect(applyCommand({ graph: filter.graph, layout: filter.layout }, { type: 'add-node', nodeId: 'second', nodeType: 'foundation.number', position: { x: 0, y: 0 } }).ok).toBe(false);
  });

  it('migrates a version 1 foundation file without changing its graph, layout, or identity', () => {
    const current = createProject('legacy', 'Phase 0', FOUNDATION_GRAPH_KIND, 'root');
    const { assets: _assets, preview: _preview, ...previous } = current;
    const legacy = JSON.stringify({ ...previous, projectVersion: 1 });
    const result = parseProject(legacy);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.migratedFromVersion).toBe(1);
    expect(result.project).toEqual(current);
    expect(result.project.rendererTarget).toBeNull();
    expect(parseProject(serializeProject(result.project))).toMatchObject({ ok: true, project: current });
  });

  it('migrates a version 2 Filter file without changing its graph, layout, or target', () => {
    const current = createProject('previous-filter', 'Filter', FILTER_GRAPH_KIND, 'root');
    const { assets: _assets, preview: _preview, ...previous } = current;
    const result = parseProject(JSON.stringify({ ...previous, projectVersion: 2 }));
    expect(result).toMatchObject({ ok: true, migratedFromVersion: 2, project: current });
  });

  it('round-trips dependency and preview images in separate lists with stable IDs and scene settings', () => {
    const base = createProject('images', 'With images', FILTER_GRAPH_KIND, 'root');
    const image = (id: string) => ({ id, name: `${id}.png`, mimeType: 'image/png' as const, dataUrl: 'data:image/png;base64,AA==', width: 1, height: 1 });
    const project = { ...base, assets: { dependencies: [image('z'), image('a')], preview: [image('host')] },
      preview: { ...base.preview, sourceAssetId: 'host', host: 'container' as const, padding: 12,
        timeSeconds: 2.5 } };
    const json = serializeProject(project);
    expect(json.indexOf('"id": "a"')).toBeLessThan(json.indexOf('"id": "z"'));
    const reordered = { ...project, assets: { ...project.assets,
      dependencies: [...project.assets.dependencies].reverse().map((entry) => ({ height: entry.height, width: entry.width,
        dataUrl: entry.dataUrl, mimeType: entry.mimeType, name: entry.name, id: entry.id })) } };
    expect(serializeProject(reordered)).toBe(json);
    const result = parseProject(json);
    expect(result).toMatchObject({ ok: true, assetIssues: [] });
    if (result.ok) expect(serializeProject(result.project)).toBe(json);
  });

  it('reports a missing preview image without discarding the editable graph', () => {
    const base = createProject('missing', 'Missing image', FILTER_GRAPH_KIND, 'root');
    const result = parseProject(serializeProject({ ...base, preview: { ...base.preview, sourceAssetId: 'gone' } }));
    expect(result).toMatchObject({ ok: true, assetIssues: [{ code: 'MISSING_PREVIEW_ASSET', assetId: 'gone' }] });
  });

  it('binds image sampling only to formal dependency assets', () => {
    const base = createProject('sample', 'Sample image', FILTER_GRAPH_KIND, 'root');
    const added = applyCommand(base, { type: 'add-node', nodeId: 'sampler', nodeType: 'filter.sample-image', position: { x: 0, y: 0 } });
    const project = { ...base, ...added.document };
    const image = { id: 'unbound', name: 'noise.png', mimeType: 'image/png' as const,
      dataUrl: 'data:image/png;base64,AA==', width: 1, height: 1 };
    expect(parseProject(serializeProject(project))).toMatchObject({ ok: true,
      assetIssues: [{ code: 'MISSING_DEPENDENCY_ASSET', nodeId: 'sampler', assetId: 'unbound' }] });
    expect(parseProject(serializeProject({ ...project, assets: { dependencies: [], preview: [image] } })))
      .toMatchObject({ ok: true, assetIssues: [{ code: 'MISSING_DEPENDENCY_ASSET' }] });
    expect(parseProject(serializeProject({ ...project, assets: { dependencies: [image], preview: [] } })))
      .toMatchObject({ ok: true, assetIssues: [] });
  });

  it('keeps preview parameter values tied to stable graph parameter IDs and types', () => {
    const base = createProject('parameters', 'Parameters', FOUNDATION_GRAPH_KIND, 'root');
    const added = applyCommand({ graph: base.graph, layout: base.layout }, { type: 'add-node', nodeId: 'amount-node', nodeType: 'foundation.number', position: { x: 1, y: 2 } });
    const exposed = applyCommand(added.document, { type: 'expose-parameter', parameterId: 'amount-id', nodeId: 'amount-node', propertyId: 'value', name: 'Amount' });
    expect(exposed.ok).toBe(true);
    const project = { ...base, ...exposed.document, preview: { ...base.preview, parameterValues: { 'amount-id': 4 } } };
    expect(parseProject(serializeProject(project))).toMatchObject({ ok: true });
    expect(parseProject(serializeProject({ ...project, preview: { ...project.preview, parameterValues: { renamed: 4 } } })))
      .toMatchObject({ ok: false, code: 'INVALID_PROJECT' });
    expect(parseProject(serializeProject({ ...project, preview: { ...project.preview, parameterValues: { 'amount-id': '#ffffff' } } })))
      .toMatchObject({ ok: false, code: 'INVALID_PROJECT' });
  });

  it('rejects oversized embedded images and duplicate IDs before opening the file', () => {
    const base = createProject('large', 'Large', FILTER_GRAPH_KIND, 'root');
    const image = { id: 'image', name: 'image.png', mimeType: 'image/png' as const,
      dataUrl: `data:image/png;base64,${Buffer.alloc(MAX_IMAGE_BYTES + 1).toString('base64')}`, width: 1, height: 1 };
    expect(parseProject(serializeProject({ ...base, assets: { dependencies: [image], preview: [] } })))
      .toMatchObject({ ok: false, code: 'ASSET_TOO_LARGE' });
    const small = { ...image, dataUrl: 'data:image/png;base64,AA==' };
    expect(parseProject(serializeProject({ ...base, assets: { dependencies: [small], preview: [small] } })))
      .toMatchObject({ ok: false, code: 'INVALID_ASSET' });
  });

  it('reopens a connected graph, parameter, and layout with deterministic JSON', () => {
    let project = createProject('project-1', 'Test work', FOUNDATION_GRAPH_KIND, 'root');
    const added = applyCommand({ graph: project.graph, layout: project.layout }, { type: 'add-node', nodeId: 'number', nodeType: 'foundation.number', position: { x: 24, y: 52 } });
    expect(added.ok).toBe(true);
    project = withEditorDocument(project, added.document);
    const connected = applyCommand(added.document, {
      type: 'connect', edgeId: 'edge', from: { nodeId: 'number', portId: 'value' }, to: { nodeId: 'root', portId: 'value' },
    });
    expect(connected.ok).toBe(true);
    project = withEditorDocument(project, connected.document);
    project = { ...project, graph: { ...project.graph, parameters: [{ id: 'p', name: 'Amount', valueType: 'float', sourceNodeId: 'number', sourceKey: 'value', defaultValue: 0 }] } };
    const json = serializeProject(project);
    const reversedLayout = { ...project, layout: { ...project.layout, nodePositions: Object.fromEntries(Object.entries(project.layout.nodePositions).reverse()) } };
    expect(serializeProject(reversedLayout)).toBe(json);
    const opened = parseProject(json);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;
    expect(opened.issues).toEqual([]);
    expect(serializeProject(opened.project)).toBe(json);
    expect(projectSemanticFingerprint(opened.project)).toBe(projectSemanticFingerprint(project));
    expect(opened.project.layout.nodePositions.number).toEqual({ x: 24, y: 52 });
    expect(opened.project.graph.parameters).toEqual(project.graph.parameters);
  });

  it('opens an unfinished graph with diagnostics', () => {
    const project = createProject('p', 'Unfinished', FOUNDATION_GRAPH_KIND, 'root');
    const opened = parseProject(serializeProject(project));
    expect(opened.ok).toBe(true);
    if (opened.ok) expect(opened.issues.map((issue) => issue.code)).toContain('MISSING_REQUIRED_INPUT');
  });

  it.each([
    ['not JSON', '{', 'INVALID_JSON'],
    ['old project', '{"projectVersion":0}', 'UNSUPPORTED_PROJECT_VERSION'],
    ['future project', '{"projectVersion":4}', 'UNSUPPORTED_PROJECT_VERSION'],
    ['old graph schema', serializeProject(createProject('p', 'Test', FOUNDATION_GRAPH_KIND, 'root')).replace('"schemaVersion": 1', '"schemaVersion": 0'), 'UNSUPPORTED_GRAPH_SCHEMA'],
    ['unknown graph kind', serializeProject(createProject('p', 'Test', FOUNDATION_GRAPH_KIND, 'root')).replace('foundation.test', 'unknown.kind'), 'UNSUPPORTED_GRAPH_KIND'],
    ['unsupported node version', serializeProject(createProject('p', 'Test', FOUNDATION_GRAPH_KIND, 'root')).replace('"definitionVersion": 1', '"definitionVersion": 3'), 'INCOMPATIBLE_GRAPH'],
    ['wrong filter target', serializeProject(createProject('p', 'Filter', FILTER_GRAPH_KIND, 'root')).replace('pixi.webgl2', 'pixi.webgpu'), 'INVALID_PROJECT'],
    ['legacy filter spoof', serializeProject(createProject('p', 'Filter', FILTER_GRAPH_KIND, 'root')).replace('"projectVersion": 3', '"projectVersion": 1'), 'INVALID_PROJECT'],
  ])('rejects %s with %s', (_label, json, code) => {
    const result = parseProject(json);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(code);
  });
});
