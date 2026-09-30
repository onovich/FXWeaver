import type { GraphIssue } from '../graph/diagnostics';

interface Props {
  issues: GraphIssue[];
  expanded: boolean;
  onToggle: () => void;
  onFocus: (issue: GraphIssue) => void;
  actionIssue: GraphIssue | null;
  targetLabel: string;
}

export function ProblemsPanel({ issues, expanded, onToggle, onFocus, actionIssue, targetLabel }: Props) {
  return <section className={`problems-panel ${expanded ? 'expanded' : ''}`} aria-label="Graph problems">
    <div className="problem-bar">
      <button type="button" onClick={onToggle} aria-expanded={expanded} aria-controls="problem-list">Problems {issues.length}</button>
      <span>{actionIssue?.message ?? issues[0]?.message ?? 'No graph issues found.'}</span>
      <span className="problem-context">{targetLabel}</span>
    </div>
    {expanded && <div id="problem-list" className="problem-list">
      {issues.length === 0 ? <p>No graph issues found.</p> : issues.map((issue, index) => <button type="button" key={`${issue.code}-${issue.nodeId ?? ''}-${issue.portId ?? ''}-${index}`} onClick={() => onFocus(issue)}><strong>{issue.code.replaceAll('_', ' ')}</strong><span>{issue.message}</span><small>{issue.nodeId ? `Node ${issue.nodeId.slice(0, 8)}${issue.portId ? ` · ${issue.portId}` : ''}` : 'Graph'}</small></button>)}
    </div>}
  </section>;
}
