export type GraphIssueCode =
  | 'UNKNOWN_GRAPH_KIND'
  | 'UNSUPPORTED_SCHEMA_VERSION'
  | 'UNKNOWN_NODE_TYPE'
  | 'UNSUPPORTED_DEFINITION_VERSION'
  | 'DUPLICATE_NODE_ID'
  | 'DUPLICATE_EDGE_ID'
  | 'DUPLICATE_PARAMETER_ID'
  | 'ID_CONFLICT'
  | 'COMMAND_REJECTED'
  | 'MISSING_NODE'
  | 'MISSING_PORT'
  | 'WRONG_DIRECTION'
  | 'TYPE_MISMATCH'
  | 'INPUT_OCCUPIED'
  | 'MISSING_ROOT'
  | 'MULTIPLE_ROOTS'
  | 'MISSING_REQUIRED_INPUT'
  | 'CYCLE'
  | 'INVALID_PROPERTY'
  | 'INVALID_PARAMETER';

export interface GraphIssue {
  code: GraphIssueCode;
  message: string;
  nodeId?: string;
  portId?: string;
  edgeId?: string;
}
