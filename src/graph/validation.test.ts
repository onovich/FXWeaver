import { describe, expect, it } from 'vitest';
import { checkConnection } from './connections';
import { FOUNDATION_GRAPH_KIND } from './registry';
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
});
