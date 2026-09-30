import { PropertyControl } from './PropertyControl';
import { ParameterNameControl } from './ParameterNameControl';
import type { GraphCommand } from '../graph/commands';
import { getGraphKind, getNodeDefinition } from '../graph/registry';
import type { GraphDocument } from '../graph/schema';

interface Props {
  graph: GraphDocument;
  selectedNodeId?: string;
  dispatch: (command: GraphCommand) => boolean;
  onDelete: () => void;
}

export function Inspector({ graph, selectedNodeId, dispatch, onDelete }: Props) {
  const node = graph.nodes.find((item) => item.id === selectedNodeId);
  const definition = node && getNodeDefinition(graph.graphKind, node.type);

  return <section className="inspector-panel" aria-labelledby="inspector-heading">
    <div className="panel-heading"><p className="section-kicker">SELECTION</p><h2 id="inspector-heading">Inspector</h2></div>
    {node && definition ? <div className="inspector-content">
      <strong>{definition.label}</strong>
      <p>{definition.description}</p>
      {definition.properties.map((property) => {
        const linked = graph.parameters.find((parameter) => parameter.sourceNodeId === node.id && parameter.sourceKey === property.id);
        return <div key={property.id}>
          {linked ? <p className="linked-property">{property.label}: Linked to {linked.name} · {linked.id.slice(0, 8)}</p> : <>
            <PropertyControl id={`inspector-${node.id}-${property.id}`} property={property} value={node.values[property.id]} onCommit={(value) => dispatch({ type: 'set-property', nodeId: node.id, propertyId: property.id, value })} />
            {property.type !== 'texture' && <button className="text-button" type="button" onClick={() => dispatch({ type: 'expose-parameter', parameterId: crypto.randomUUID(), nodeId: node.id, propertyId: property.id, name: property.label })}>Expose as parameter</button>}
          </>}
        </div>;
      })}
      <p className="node-signature">{definition.inputs.length} inputs · {definition.outputs.length} outputs</p>
      <button className="secondary-button" type="button" disabled={node.type === getGraphKind(graph.graphKind)?.rootNodeType} onClick={onDelete}>Delete selected</button>
    </div> : <p className="panel-note">Select a node to inspect its properties.</p>}

    <div className="parameter-section" aria-labelledby="parameter-heading">
      <h3 id="parameter-heading">Effect Parameters</h3>
      {graph.parameters.length === 0 && <p className="panel-note">No exposed parameters yet.</p>}
      {graph.parameters.map((parameter) => {
        const source = graph.nodes.find((item) => item.id === parameter.sourceNodeId);
        const property = source && getNodeDefinition(graph.graphKind, source.type)?.properties.find((item) => item.id === parameter.sourceKey);
        if (!source || !property) return <p key={parameter.id} className="field-error">{parameter.name}: source property unavailable.</p>;
        return <div className="parameter-item" key={parameter.id}>
          <div className="parameter-title"><strong>{parameter.name}</strong><div className="parameter-title-actions"><ParameterNameControl id={`parameter-name-${parameter.id}`} name={parameter.name} onCommit={(name) => dispatch({ type: 'rename-parameter', parameterId: parameter.id, name })} /><button type="button" className="text-button" onClick={() => dispatch({ type: 'remove-parameter', parameterId: parameter.id })}>Remove</button></div></div>
          <PropertyControl id={`parameter-${parameter.id}`} property={{ ...property, label: parameter.name }} value={source.values[property.id]} onCommit={(value) => dispatch({ type: 'set-property', nodeId: source.id, propertyId: property.id, value })} />
        </div>;
      })}
    </div>
  </section>;
}
