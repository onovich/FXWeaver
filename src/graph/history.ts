import { applyCommand, type EditorDocument, type GraphCommand } from './commands';
import type { GraphIssue } from './diagnostics';

export interface EditorHistory {
  past: EditorDocument[];
  present: EditorDocument;
  future: EditorDocument[];
}

export interface HistoryResult {
  history: EditorHistory;
  issue?: GraphIssue;
}

const HISTORY_LIMIT = 100;

export function createHistory(document: EditorDocument): EditorHistory {
  return { past: [], present: document, future: [] };
}

export function applyHistoryCommand(history: EditorHistory, command: GraphCommand): HistoryResult {
  const result = applyCommand(history.present, command);
  if (!result.ok) return { history, issue: result.issue };
  return {
    history: {
      past: [...history.past, history.present].slice(-HISTORY_LIMIT),
      present: result.document,
      future: [],
    },
  };
}

export function undo(history: EditorHistory): EditorHistory {
  if (history.past.length === 0) return history;
  return {
    past: history.past.slice(0, -1),
    present: history.past[history.past.length - 1],
    future: [history.present, ...history.future],
  };
}

export function redo(history: EditorHistory): EditorHistory {
  if (history.future.length === 0) return history;
  return {
    past: [...history.past, history.present].slice(-HISTORY_LIMIT),
    present: history.future[0],
    future: history.future.slice(1),
  };
}
