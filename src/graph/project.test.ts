import { describe, expect, it } from 'vitest';
import { applyCommand } from './commands';
import { createProject, parseProject, projectSemanticFingerprint, serializeProject, withEditorDocument } from './project';
import { FILTER_GRAPH_KIND, FOUNDATION_GRAPH_KIND } from './registry';

describe('project file', () => {
  it('creates a distinct Filter graph with a WebGL2 target and one undeletable root', () => {
    const filter = createProject('filter-1', 'New Filter', FILTER_GRAPH_KIND, 'output');
    expect(filter).toMatchObject({ projectVersion: 2, rendererTarget: 'pixi.webgl2', graph: { graphKind: FILTER_GRAPH_KIND } });
    expect(filter.graph.nodes.map((node) => node.type)).toEqual(['filter.output']);
    expect(parseProject(serializeProject(filter))).toMatchObject({ ok: true, project: filter });
    expect(applyCommand({ graph: filter.graph, layout: filter.layout }, { type: 'delete-nodes', nodeIds: ['output'] }).ok).toBe(false);
    expect(applyCommand({ graph: filter.graph, layout: filter.layout }, { type: 'add-node', nodeId: 'second', nodeType: 'foundation.number', position: { x: 0, y: 0 } }).ok).toBe(false);
  });

  it('migrates a version 1 foundation file without changing its graph, layout, or identity', () => {
    const current = createProject('legacy', 'Phase 0', FOUNDATION_GRAPH_KIND, 'root');
    const legacy = JSON.stringify({ ...current, projectVersion: 1 });
    const result = parseProject(legacy);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.migratedFromVersion).toBe(1);
    expect(result.project).toEqual(current);
    expect(result.project.rendererTarget).toBeNull();
    expect(parseProject(serializeProject(result.project))).toMatchObject({ ok: true, project: current });
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
    ['future project', '{"projectVersion":3}', 'UNSUPPORTED_PROJECT_VERSION'],
    ['old graph schema', serializeProject(createProject('p', 'Test', FOUNDATION_GRAPH_KIND, 'root')).replace('"schemaVersion": 1', '"schemaVersion": 0'), 'UNSUPPORTED_GRAPH_SCHEMA'],
    ['unknown graph kind', serializeProject(createProject('p', 'Test', FOUNDATION_GRAPH_KIND, 'root')).replace('foundation.test', 'unknown.kind'), 'UNSUPPORTED_GRAPH_KIND'],
    ['unsupported node version', serializeProject(createProject('p', 'Test', FOUNDATION_GRAPH_KIND, 'root')).replace('"definitionVersion": 1', '"definitionVersion": 3'), 'INCOMPATIBLE_GRAPH'],
    ['wrong filter target', serializeProject(createProject('p', 'Filter', FILTER_GRAPH_KIND, 'root')).replace('pixi.webgl2', 'pixi.webgpu'), 'INVALID_PROJECT'],
    ['legacy filter spoof', serializeProject(createProject('p', 'Filter', FILTER_GRAPH_KIND, 'root')).replace('"projectVersion": 2', '"projectVersion": 1'), 'INVALID_PROJECT'],
  ])('rejects %s with %s', (_label, json, code) => {
    const result = parseProject(json);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(code);
  });
});
