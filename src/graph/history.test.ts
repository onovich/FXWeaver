import { describe, expect, it } from 'vitest';
import { createEditorDocument } from './commands';
import { applyHistoryCommand, createHistory, redo, undo, type EditorHistory } from './history';
import { FOUNDATION_GRAPH_KIND } from './registry';
import { graphFingerprint } from './schema';

function add(history: EditorHistory, nodeId: string, nodeType: string) {
  const result = applyHistoryCommand(history, { type: 'add-node', nodeId, nodeType, position: { x: 0, y: 0 } });
  expect(result.issue).toBeUndefined();
  return result.history;
}

describe('editor history and atomic operations', () => {
  it('undoes and redoes a multi-node move as one operation', () => {
    let history = createHistory(createEditorDocument(FOUNDATION_GRAPH_KIND));
    history = add(history, 'root', 'foundation.output');
    history = add(history, 'a', 'foundation.number');
    history = add(history, 'b', 'foundation.number');
    const fingerprint = graphFingerprint(history.present.graph);
    const beforeMove = history.present;
    const move = applyHistoryCommand(history, { type: 'move-nodes', positions: { a: { x: 20, y: 30 }, b: { x: 40, y: 50 } } });
    history = move.history;
    expect(history.present.layout.nodePositions.b).toEqual({ x: 40, y: 50 });
    history = undo(history);
    expect(history.present).toBe(beforeMove);
    expect(history.present.layout.nodePositions.a).toEqual({ x: 0, y: 0 });
    history = redo(history);
    expect(history.present.layout.nodePositions.b).toEqual({ x: 40, y: 50 });
    expect(graphFingerprint(history.present.graph)).toBe(fingerprint);
  });

  it('replaces a connection atomically and restores it with one undo', () => {
    let history = createHistory(createEditorDocument(FOUNDATION_GRAPH_KIND));
    history = add(history, 'root', 'foundation.output');
    history = add(history, 'first', 'foundation.number');
    history = add(history, 'second', 'foundation.number');
    history = applyHistoryCommand(history, {
      type: 'connect', edgeId: 'old', from: { nodeId: 'first', portId: 'value' }, to: { nodeId: 'root', portId: 'value' },
    }).history;
    const beforeReplacement = history.present;
    const result = applyHistoryCommand(history, {
      type: 'connect', edgeId: 'new', from: { nodeId: 'second', portId: 'value' }, to: { nodeId: 'root', portId: 'value' }, replaceExisting: true,
    });
    expect(result.issue).toBeUndefined();
    history = result.history;
    expect(history.present.graph.edges.map((edge) => edge.id)).toEqual(['new']);
    history = undo(history);
    expect(history.present).toBe(beforeReplacement);
    expect(history.present.graph.edges.map((edge) => edge.id)).toEqual(['old']);
    expect(redo(history).present.graph.edges.map((edge) => edge.id)).toEqual(['new']);
  });

  it('keeps the old connection and history when replacement is invalid', () => {
    let history = createHistory(createEditorDocument(FOUNDATION_GRAPH_KIND));
    history = add(history, 'root', 'foundation.output');
    history = add(history, 'number', 'foundation.number');
    history = add(history, 'vector', 'foundation.vector2');
    history = applyHistoryCommand(history, {
      type: 'connect', edgeId: 'old', from: { nodeId: 'number', portId: 'value' }, to: { nodeId: 'root', portId: 'value' },
    }).history;
    const result = applyHistoryCommand(history, {
      type: 'connect', edgeId: 'new', from: { nodeId: 'vector', portId: 'value' }, to: { nodeId: 'root', portId: 'value' }, replaceExisting: true,
    });
    expect(result.issue?.code).toBe('TYPE_MISMATCH');
    expect(result.history).toBe(history);
    expect(history.present.graph.edges.map((edge) => edge.id)).toEqual(['old']);
  });
});
