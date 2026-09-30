import { describe, expect, it } from 'vitest';
import { checkConnection } from './connections';
import { FOUNDATION_GRAPH_KIND } from './registry';
import { createEmptyGraph, type GraphDocument, type GraphPortRef } from './schema';

const from: GraphPortRef = { nodeId: 'number', portId: 'value' };
const to: GraphPortRef = { nodeId: 'root', portId: 'value' };
const graph: GraphDocument = {
  ...createEmptyGraph(FOUNDATION_GRAPH_KIND),
  nodes: [
    { id: 'root', type: 'foundation.output', definitionVersion: 1, values: {} },
    { id: 'number', type: 'foundation.number', definitionVersion: 1, values: { value: 1 } },
    { id: 'vector', type: 'foundation.vector2', definitionVersion: 1, values: { value: [0, 0] } },
    { id: 'pass', type: 'foundation.pass', definitionVersion: 1, values: {} },
  ],
  edges: [],
};

describe('connection checks', () => {
  it('accepts a typed output-to-input connection', () => {
    expect(checkConnection(graph, from, to)).toBeNull();
  });

  it.each([
    ['missing source', { nodeId: 'gone', portId: 'value' }, to, 'MISSING_NODE'],
    ['missing target', from, { nodeId: 'gone', portId: 'value' }, 'MISSING_NODE'],
    ['missing output', { nodeId: 'number', portId: 'gone' }, to, 'MISSING_PORT'],
    ['missing input', from, { nodeId: 'root', portId: 'gone' }, 'MISSING_PORT'],
    ['input as source', { nodeId: 'pass', portId: 'in' }, to, 'WRONG_DIRECTION'],
    ['output as target', from, { nodeId: 'pass', portId: 'out' }, 'WRONG_DIRECTION'],
    ['type mismatch', { nodeId: 'vector', portId: 'value' }, to, 'TYPE_MISMATCH'],
  ] as const)('%s: %s', (_name, source, target, code) => {
    expect(checkConnection(graph, source, target)?.code).toBe(code);
  });

  it('rejects occupied inputs unless the existing edge is atomically replaced', () => {
    const occupied: GraphDocument = { ...graph, edges: [{ id: 'edge-1', from, to }] };
    expect(checkConnection(occupied, from, to)?.code).toBe('INPUT_OCCUPIED');
    expect(checkConnection(occupied, from, to, { ignoreEdgeIds: ['edge-1'] })).toBeNull();
  });
});
