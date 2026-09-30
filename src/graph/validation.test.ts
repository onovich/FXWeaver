import { describe, expect, it } from 'vitest';
import { checkConnection } from './connections';
import { applyCommand } from './commands';
import { createProject, parseProject, serializeProject } from './project';
import { FILTER_GRAPH_KIND, FOUNDATION_GRAPH_KIND } from './registry';
import { createEmptyGraph, semanticGraphJson, type GraphDocument } from './schema';
import { validateGraph } from './validation';

const number = { id: 'n', type: 'foundation.number', definitionVersion: 1, values: { value: 2 } };
const root = { id: 'r', type: 'foundation.output', definitionVersion: 1, values: {} };
const passA = { id: 'a', type: 'foundation.pass', definitionVersion: 1, values: {} };
const passB = { id: 'b', type: 'foundation.pass', definitionVersion: 1, values: {} };

function codes(graph: GraphDocument) { return validateGraph(graph).map((issue) => issue.code); }

describe('graph validation', () => {
  it('allows an unfinished graph to remain serializable while reporting its missing root', () => {
    const graph = createEmptyGraph(FOUNDATION_GRAPH_KIND);
    expect(codes(graph)).toEqual(['MISSING_ROOT']);
    expect(JSON.parse(semanticGraphJson(graph))).toMatchObject({ nodes: [], edges: [] });
  });

  it('requires exactly one root and its required input', () => {
    const graph = { ...createEmptyGraph(FOUNDATION_GRAPH_KIND), nodes: [root] };
    expect(codes(graph)).toEqual(['MISSING_REQUIRED_INPUT']);
    expect(codes({ ...graph, nodes: [root, { ...root, id: 'r2' }] })).toContain('MULTIPLE_ROOTS');
  });

  it('accepts a connected test graph', () => {
    const graph: GraphDocument = {
      ...createEmptyGraph(FOUNDATION_GRAPH_KIND), nodes: [root, number],
      edges: [{ id: 'e', from: { nodeId: 'n', portId: 'value' }, to: { nodeId: 'r', portId: 'value' } }],
    };
    expect(validateGraph(graph)).toEqual([]);
  });

  it('rejects a cycle immediately and diagnoses one in imported graph data', () => {
    const graph: GraphDocument = {
      ...createEmptyGraph(FOUNDATION_GRAPH_KIND), nodes: [root, passA, passB],
      edges: [
        { id: 'ab', from: { nodeId: 'a', portId: 'out' }, to: { nodeId: 'b', portId: 'in' } },
        { id: 'br', from: { nodeId: 'b', portId: 'out' }, to: { nodeId: 'r', portId: 'value' } },
      ],
    };
    const from = { nodeId: 'b', portId: 'out' };
    const to = { nodeId: 'a', portId: 'in' };
    expect(checkConnection(graph, from, to)?.code).toBe('CYCLE');
    expect(codes({ ...graph, edges: [...graph.edges, { id: 'ba', from, to }] })).toContain('CYCLE');
  });

  it('diagnoses incompatible node versions, values, and parameter bindings', () => {
    const graph: GraphDocument = {
      ...createEmptyGraph(FOUNDATION_GRAPH_KIND),
      nodes: [root, { ...number, definitionVersion: 2, values: { value: Infinity } }],
      parameters: [{ id: 'p', name: 'Bad', valueType: 'vec2', sourceNodeId: 'n', sourceKey: 'value', defaultValue: [0, 0] }],
    };
    expect(codes(graph)).toEqual(expect.arrayContaining(['UNSUPPORTED_DEFINITION_VERSION', 'INVALID_PROPERTY', 'INVALID_PARAMETER']));
  });

  it('diagnoses a parameter default that diverges from its source property', () => {
    const graph: GraphDocument = {
      ...createEmptyGraph(FOUNDATION_GRAPH_KIND), nodes: [root, number],
      parameters: [{ id: 'p', name: 'Amount', valueType: 'float', sourceNodeId: 'n', sourceKey: 'value', defaultValue: 3 }],
    };
    expect(codes(graph)).toContain('INVALID_PARAMETER');
  });
});

describe('Filter graph validation', () => {
  it('saves an incomplete graph, rejects implicit conversion, and accepts a source to output path', () => {
    const project = createProject('filter', 'Filter', FILTER_GRAPH_KIND, 'root');
    expect(codes(project.graph)).toEqual(['MISSING_REQUIRED_INPUT']);
    expect(parseProject(serializeProject(project))).toMatchObject({ ok: true, issues: [{ code: 'MISSING_REQUIRED_INPUT' }] });
    const uv = applyCommand(project, { type: 'add-node', nodeId: 'uv', nodeType: 'filter.uv', position: { x: 0, y: 0 } });
    expect(uv.ok).toBe(true);
    expect(checkConnection(uv.document.graph, { nodeId: 'uv', portId: 'uv' }, { nodeId: 'root', portId: 'rgba' })?.code).toBe('TYPE_MISMATCH');
    const source = applyCommand(uv.document, { type: 'add-node', nodeId: 'source', nodeType: 'filter.source', position: { x: 0, y: 100 } });
    const connected = applyCommand(source.document, { type: 'connect', edgeId: 'source-out',
      from: { nodeId: 'source', portId: 'rgba' }, to: { nodeId: 'root', portId: 'rgba' } });
    expect(connected.ok).toBe(true);
    expect(validateGraph(connected.document.graph)).toEqual([]);
  });

  it('uses an explicit color conversion and preserves stable exposed value IDs', () => {
    const base = createProject('color', 'Color', FILTER_GRAPH_KIND, 'root');
    const color = applyCommand(base, { type: 'add-node', nodeId: 'color', nodeType: 'filter.color', position: { x: 0, y: 0 } });
    const conversion = applyCommand(color.document, { type: 'add-node', nodeId: 'conversion', nodeType: 'filter.color-rgba', position: { x: 100, y: 0 } });
    expect(checkConnection(conversion.document.graph, { nodeId: 'color', portId: 'color' }, { nodeId: 'root', portId: 'rgba' })?.code).toBe('TYPE_MISMATCH');
    const first = applyCommand(conversion.document, { type: 'connect', edgeId: 'a', from: { nodeId: 'color', portId: 'color' }, to: { nodeId: 'conversion', portId: 'color' } });
    const second = applyCommand(first.document, { type: 'connect', edgeId: 'b', from: { nodeId: 'conversion', portId: 'rgba' }, to: { nodeId: 'root', portId: 'rgba' } });
    const exposed = applyCommand(second.document, { type: 'expose-parameter', parameterId: 'stable-color-id', nodeId: 'color', propertyId: 'value', name: 'Tint' });
    expect(validateGraph(exposed.document.graph)).toEqual([]);
    expect(exposed.document.graph.parameters[0]).toMatchObject({ id: 'stable-color-id', valueType: 'color', defaultValue: '#ffffffff' });
    expect(parseProject(serializeProject({ ...base, ...exposed.document }))).toMatchObject({ ok: true, issues: [] });
  });
});
