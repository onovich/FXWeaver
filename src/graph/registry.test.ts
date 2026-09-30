import { describe, expect, it } from 'vitest';
import {
  FOUNDATION_GRAPH_KIND,
  getGraphKind,
  getNodeDefinition,
  listNodeDefinitions,
  registryIssues,
} from './registry';

describe('foundation registry', () => {
  it('has one explicit test-only graph kind with a unique output root', () => {
    const kind = getGraphKind(FOUNDATION_GRAPH_KIND);
    expect(kind).toMatchObject({ rootNodeType: 'foundation.output', isTestOnly: true });
    expect(listNodeDefinitions(FOUNDATION_GRAPH_KIND).filter((node) => node.type === kind?.rootNodeType)).toHaveLength(1);
    expect(registryIssues()).toEqual([]);
  });

  it('exposes exact typed port signatures and rejects unknown definitions', () => {
    expect(getNodeDefinition(FOUNDATION_GRAPH_KIND, 'foundation.add')?.inputs)
      .toMatchObject([{ id: 'a', type: 'float' }, { id: 'b', type: 'float' }]);
    expect(getNodeDefinition(FOUNDATION_GRAPH_KIND, 'foundation.vector2')?.outputs[0].type).toBe('vec2');
    expect(getNodeDefinition(FOUNDATION_GRAPH_KIND, 'missing')).toBeUndefined();
    expect(getNodeDefinition('missing-kind', 'foundation.add')).toBeUndefined();
  });
});
