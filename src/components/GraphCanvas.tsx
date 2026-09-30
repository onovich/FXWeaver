import { useRef, useState, type PointerEvent, type WheelEvent } from 'react';
import { checkConnection } from '../graph/connections';
import type { EditorDocument } from '../graph/commands';
import { getNodeDefinition } from '../graph/registry';
import type { GraphNode, GraphPortRef } from '../graph/schema';

const NODE_WIDTH = 188;
const ROW_HEIGHT = 28;
const PORT_TOP = 48;

interface Props {
  document: EditorDocument;
  pendingFrom: GraphPortRef | null;
  onPendingFrom: (port: GraphPortRef | null) => void;
  onSelect: (ids: string[]) => void;
  onMove: (positions: Record<string, { x: number; y: number }>) => void;
  onConnect: (from: GraphPortRef, to: GraphPortRef) => void;
  onDisconnect: (edgeId: string) => void;
  onViewport: (viewport: { x: number; y: number; zoom: number }) => void;
  onSearch: () => void;
}

function portPoint(document: EditorDocument, node: GraphNode, portId: string, direction: 'in' | 'out', previewPositions?: Record<string, { x: number; y: number }> | null) {
  const definition = getNodeDefinition(document.graph.graphKind, node.type);
  const inputs = definition?.inputs ?? [];
  const row = direction === 'in' ? inputs.findIndex((port) => port.id === portId) : inputs.length + (definition?.outputs.findIndex((port) => port.id === portId) ?? 0);
  const position = previewPositions?.[node.id] ?? document.layout.nodePositions[node.id] ?? { x: 0, y: 0 };
  return { x: position.x + (direction === 'out' ? NODE_WIDTH : 0), y: position.y + PORT_TOP + row * ROW_HEIGHT + ROW_HEIGHT / 2 };
}

function wirePath(a: { x: number; y: number }, b: { x: number; y: number }) {
  const bend = Math.max(54, Math.abs(b.x - a.x) * .45);
  return `M ${a.x} ${a.y} C ${a.x + bend} ${a.y}, ${b.x - bend} ${b.y}, ${b.x} ${b.y}`;
}

export function GraphCanvas({ document, pendingFrom, onPendingFrom, onSelect, onMove, onConnect, onDisconnect, onViewport, onSearch }: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; positions: Record<string, { x: number; y: number }> } | null>(null);
  const panRef = useRef<{ pointerId: number; startX: number; startY: number; viewport: { x: number; y: number; zoom: number } } | null>(null);
  const [dragPositions, setDragPositions] = useState<Record<string, { x: number; y: number }> | null>(null);
  const { graph, layout } = document;

  function startDrag(event: PointerEvent<HTMLButtonElement>, nodeId: string) {
    if (event.button !== 0) return;
    event.stopPropagation();
    const selected = layout.selectedNodeIds.includes(nodeId) ? layout.selectedNodeIds : [nodeId];
    const nextSelection = event.shiftKey ? [...new Set([...layout.selectedNodeIds, nodeId])] : selected;
    onSelect(nextSelection);
    const positions = Object.fromEntries(nextSelection.map((id) => [id, layout.nodePositions[id] ?? { x: 0, y: 0 }]));
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, positions };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function dragNode(event: PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = (event.clientX - drag.startX) / layout.viewport.zoom;
    const dy = (event.clientY - drag.startY) / layout.viewport.zoom;
    setDragPositions(Object.fromEntries(Object.entries(drag.positions).map(([id, position]) => [id, { x: Math.round(position.x + dx), y: Math.round(position.y + dy) }])));
  }

  function endDrag(event: PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = (event.clientX - drag.startX) / layout.viewport.zoom;
    const dy = (event.clientY - drag.startY) / layout.viewport.zoom;
    if (Math.abs(dx) + Math.abs(dy) > 3) {
      onMove(Object.fromEntries(Object.entries(drag.positions).map(([id, position]) => [id, { x: Math.round(position.x + dx), y: Math.round(position.y + dy) }])));
    }
    setDragPositions(null);
    dragRef.current = null;
  }

  function startPan(event: PointerEvent<HTMLDivElement>) {
    const target = event.target;
    if (event.button !== 0 || !(target instanceof HTMLElement) || !['graph-canvas', 'canvas-world'].some((name) => target.classList.contains(name))) return;
    onSelect([]);
    panRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, viewport: layout.viewport };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function movePan(event: PointerEvent<HTMLDivElement>) {
    const pan = panRef.current;
    if (!pan || pan.pointerId !== event.pointerId) return;
    onViewport({ ...pan.viewport, x: pan.viewport.x + event.clientX - pan.startX, y: pan.viewport.y + event.clientY - pan.startY });
  }

  function wheelZoom(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = event.clientX - rect.left;
    const py = event.clientY - rect.top;
    const zoom = Math.min(2, Math.max(.5, layout.viewport.zoom * (event.deltaY < 0 ? 1.1 : .9)));
    const ratio = zoom / layout.viewport.zoom;
    onViewport({ x: px - (px - layout.viewport.x) * ratio, y: py - (py - layout.viewport.y) * ratio, zoom });
  }

  return (
    <div ref={canvasRef} className="graph-canvas" aria-label="Node graph canvas" onPointerDown={startPan} onPointerMove={movePan} onPointerUp={() => { panRef.current = null; }} onWheel={wheelZoom} onDoubleClick={onSearch}>
      <div className="canvas-world" style={{ transform: `translate(${layout.viewport.x}px, ${layout.viewport.y}px) scale(${layout.viewport.zoom})` }}>
        <svg className="connection-layer" width="2400" height="1600" aria-hidden="true">
          {graph.edges.map((edge) => {
            const source = graph.nodes.find((node) => node.id === edge.from.nodeId);
            const target = graph.nodes.find((node) => node.id === edge.to.nodeId);
            if (!source || !target) return null;
            const sourcePoint = portPoint(document, source, edge.from.portId, 'out', dragPositions);
            const targetPoint = portPoint(document, target, edge.to.portId, 'in', dragPositions);
            return <path key={edge.id} d={wirePath(sourcePoint, targetPoint)} className="connection-path" />;
          })}
        </svg>
        {graph.nodes.map((node) => {
          const definition = getNodeDefinition(graph.graphKind, node.type);
          const position = dragPositions?.[node.id] ?? layout.nodePositions[node.id] ?? { x: 0, y: 0 };
          return (
            <article className={`canvas-node ${layout.selectedNodeIds.includes(node.id) ? 'selected' : ''}`} key={node.id} style={{ left: position.x, top: position.y }} data-node-id={node.id}>
              <button className="canvas-node-title" type="button" onPointerDown={(event) => startDrag(event, node.id)} onPointerMove={dragNode} onPointerUp={endDrag} onClick={(event) => { if (event.detail === 0) onSelect([node.id]); }} aria-label={`Select ${definition?.label ?? node.type} node`}>{definition?.label ?? node.type}</button>
              <div className="canvas-node-body">
                {definition?.inputs.map((port) => {
                  const ref = { nodeId: node.id, portId: port.id };
                  const occupied = graph.edges.find((edge) => edge.to.nodeId === node.id && edge.to.portId === port.id);
                  const check = pendingFrom && checkConnection(graph, pendingFrom, ref, { ignoreEdgeIds: occupied ? [occupied.id] : [] });
                  return <div className="port-row" key={`in-${port.id}`}>
                    <button className={`port-button input-port ${pendingFrom ? check ? 'port-reject' : 'port-accept' : ''}`} type="button" onClick={() => pendingFrom && onConnect(pendingFrom, ref)} aria-label={`${definition.label} ${port.label} input, ${port.type}`}>
                      <i className={`port-dot port-${port.type}`} />{port.label}<small>{port.type}</small>
                    </button>
                    {occupied && <button className="disconnect-button" type="button" onClick={() => onDisconnect(occupied.id)} aria-label={`Disconnect ${definition.label} ${port.label}`}>×</button>}
                  </div>;
                })}
                {definition?.outputs.map((port) => <div className="port-row" key={`out-${port.id}`}><button className={`port-button output-port ${pendingFrom?.nodeId === node.id && pendingFrom.portId === port.id ? 'port-active' : ''}`} type="button" onClick={() => onPendingFrom({ nodeId: node.id, portId: port.id })} aria-label={`${definition.label} ${port.label} output, ${port.type}`}>{port.label}<small>{port.type}</small><i className={`port-dot port-${port.type}`} /></button></div>)}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
