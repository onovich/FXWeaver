import { describe, expect, it } from 'vitest';
import { applyCommand } from './commands';
import { createProject, parseProject, projectSemanticFingerprint, serializeProject, withEditorDocument } from './project';
import { FOUNDATION_GRAPH_KIND } from './registry';

describe('project file', () => {
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
    ['old graph schema', serializeProject(createProject('p', 'Test', FOUNDATION_GRAPH_KIND, 'root')).replace('"schemaVersion": 1', '"schemaVersion": 0'), 'UNSUPPORTED_GRAPH_SCHEMA'],
    ['unknown graph kind', serializeProject(createProject('p', 'Test', FOUNDATION_GRAPH_KIND, 'root')).replace('foundation.test', 'unknown.kind'), 'UNSUPPORTED_GRAPH_KIND'],
    ['unsupported node version', serializeProject(createProject('p', 'Test', FOUNDATION_GRAPH_KIND, 'root')).replace('"definitionVersion": 1', '"definitionVersion": 3'), 'INCOMPATIBLE_GRAPH'],
  ])('rejects %s with %s', (_label, json, code) => {
    const result = parseProject(json);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe(code);
  });
});
