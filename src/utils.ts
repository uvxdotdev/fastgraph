/**
 * Utility functions for graph data processing and validation
 */

import { GraphNode, GraphEdge, Color, DEFAULT_NODE_COLOR, DEFAULT_NODE_SIZE, DEFAULT_EDGE_COLOR, DEFAULT_EDGE_WIDTH } from './types';

/**
 * Validates a single graph node
 */
export function validateNode(node: GraphNode): string[] {
  const errors: string[] = [];
  
  if (!node.id || typeof node.id !== 'string') {
    errors.push('Node must have a valid string id');
  }
  
  if (typeof node.x !== 'number' || node.x < 0 || node.x > 1) {
    errors.push(`Node ${node.id}: x coordinate must be between 0 and 1`);
  }
  
  if (typeof node.y !== 'number' || node.y < 0 || node.y > 1) {
    errors.push(`Node ${node.id}: y coordinate must be between 0 and 1`);
  }
  
  if (node.size !== undefined && (typeof node.size !== 'number' || node.size <= 0)) {
    errors.push(`Node ${node.id}: size must be a positive number`);
  }
  
  if (node.color !== undefined && !isValidHexColor(node.color)) {
    errors.push(`Node ${node.id}: color must be a valid hex color`);
  }
  
  return errors;
}

/**
 * Validates a single graph edge
 */
export function validateEdge(edge: GraphEdge, nodeIds: Set<string>): string[] {
  const errors: string[] = [];
  
  if (!edge.source || typeof edge.source !== 'string') {
    errors.push('Edge must have a valid string source id');
  } else if (!nodeIds.has(edge.source)) {
    errors.push(`Edge source "${edge.source}" does not exist in nodes`);
  }
  
  if (!edge.target || typeof edge.target !== 'string') {
    errors.push('Edge must have a valid string target id');
  } else if (!nodeIds.has(edge.target)) {
    errors.push(`Edge target "${edge.target}" does not exist in nodes`);
  }
  
  if (edge.width !== undefined && (typeof edge.width !== 'number' || edge.width <= 0)) {
    errors.push(`Edge ${edge.source}->${edge.target}: width must be a positive number`);
  }
  
  if (edge.color !== undefined && !isValidHexColor(edge.color)) {
    errors.push(`Edge ${edge.source}->${edge.target}: color must be a valid hex color`);
  }
  
  return errors;
}

/**
 * Validates an entire graph data structure
 */
export function validateGraph(nodes: GraphNode[], edges: GraphEdge[]): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check for duplicate node IDs
  const nodeIds = new Set<string>();
  const duplicateIds = new Set<string>();
  
  for (const node of nodes) {
    if (nodeIds.has(node.id)) {
      duplicateIds.add(node.id);
    }
    nodeIds.add(node.id);
  }
  
  if (duplicateIds.size > 0) {
    errors.push(`Duplicate node IDs found: ${Array.from(duplicateIds).join(', ')}`);
  }
  
  // Validate individual nodes
  for (const node of nodes) {
    errors.push(...validateNode(node));
  }
  
  // Validate individual edges
  for (const edge of edges) {
    errors.push(...validateEdge(edge, nodeIds));
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Checks if a string is a valid hex color
 */
export function isValidHexColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3}|[A-Fa-f0-9]{8})$/.test(color);
}

/**
 * Converts hex color to RGBA values (0-1 range)
 */
export function hexToRgba(hex: string): Color {
  const cleanHex = hex.replace('#', '');
  
  let r: number, g: number, b: number, a: number = 1;
  
  if (cleanHex.length === 3) {
    // Short format: #RGB
    r = parseInt(cleanHex[0] + cleanHex[0], 16) / 255;
    g = parseInt(cleanHex[1] + cleanHex[1], 16) / 255;
    b = parseInt(cleanHex[2] + cleanHex[2], 16) / 255;
  } else if (cleanHex.length === 6) {
    // Standard format: #RRGGBB
    r = parseInt(cleanHex.substr(0, 2), 16) / 255;
    g = parseInt(cleanHex.substr(2, 2), 16) / 255;
    b = parseInt(cleanHex.substr(4, 2), 16) / 255;
  } else if (cleanHex.length === 8) {
    // RGBA format: #RRGGBBAA
    r = parseInt(cleanHex.substr(0, 2), 16) / 255;
    g = parseInt(cleanHex.substr(2, 2), 16) / 255;
    b = parseInt(cleanHex.substr(4, 2), 16) / 255;
    a = parseInt(cleanHex.substr(6, 2), 16) / 255;
  } else {
    // Invalid format, return white
    return { r: 1, g: 1, b: 1, a: 1 };
  }
  
  return { r, g, b, a };
}

/**
 * Normalizes node data by applying defaults and validating ranges
 */
export function normalizeNode(node: GraphNode): Required<Omit<GraphNode, 'label'>> & Pick<GraphNode, 'label'> {
  return {
    id: node.id,
    x: Math.max(0, Math.min(1, node.x)),
    y: Math.max(0, Math.min(1, node.y)),
    color: node.color && isValidHexColor(node.color) ? node.color : DEFAULT_NODE_COLOR,
    size: Math.max(0.1, node.size || DEFAULT_NODE_SIZE),
    label: node.label
  };
}

/**
 * Normalizes edge data by applying defaults
 */
export function normalizeEdge(edge: GraphEdge): Required<GraphEdge> {
  return {
    source: edge.source,
    target: edge.target,
    color: edge.color && isValidHexColor(edge.color) ? edge.color : DEFAULT_EDGE_COLOR,
    width: Math.max(0.1, edge.width || DEFAULT_EDGE_WIDTH)
  };
}

/**
 * Converts normalized coordinates (0-1) to canvas pixel coordinates
 */
export function normalizedToCanvas(normalizedX: number, normalizedY: number, canvasWidth: number, canvasHeight: number): { x: number; y: number } {
  return {
    x: normalizedX * canvasWidth,
    y: normalizedY * canvasHeight
  };
}

/**
 * Converts canvas pixel coordinates to normalized coordinates (0-1)
 */
export function canvasToNormalized(canvasX: number, canvasY: number, canvasWidth: number, canvasHeight: number): { x: number; y: number } {
  return {
    x: canvasX / canvasWidth,
    y: canvasY / canvasHeight
  };
}

/**
 * Finds a node by its ID
 */
export function findNodeById(nodes: GraphNode[], id: string): GraphNode | undefined {
  return nodes.find(node => node.id === id);
}

/**
 * Gets all edges connected to a specific node
 */
export function getConnectedEdges(edges: GraphEdge[], nodeId: string): GraphEdge[] {
  return edges.filter(edge => edge.source === nodeId || edge.target === nodeId);
}

/**
 * Prepares graph data for efficient GPU rendering
 * Returns flattened arrays suitable for buffer creation
 */
export function prepareGraphDataForGPU(nodes: GraphNode[], edges: GraphEdge[], canvasWidth: number, canvasHeight: number) {
  const normalizedNodes = nodes.map(normalizeNode);
  const normalizedEdges = edges.map(normalizeEdge);
  
  // Prepare node data as flat array: [x, y, r, g, b, a, size, ...]
  const nodeData: number[] = [];
  for (const node of normalizedNodes) {
    const canvasPos = normalizedToCanvas(node.x, node.y, canvasWidth, canvasHeight);
    const color = hexToRgba(node.color);
    
    nodeData.push(
      canvasPos.x,    // x position
      canvasPos.y,    // y position
      color.r,        // red
      color.g,        // green
      color.b,        // blue
      color.a,        // alpha
      node.size,      // size/radius
      0               // padding for alignment
    );
  }
  
  // Prepare edge data as flat array: [x1, y1, x2, y2, r, g, b, a, width, ...]
  const edgeData: number[] = [];
  const nodeMap = new Map(normalizedNodes.map(node => [node.id, node]));
  
  for (const edge of normalizedEdges) {
    const sourceNode = nodeMap.get(edge.source);
    const targetNode = nodeMap.get(edge.target);
    
    if (sourceNode && targetNode) {
      const sourcePos = normalizedToCanvas(sourceNode.x, sourceNode.y, canvasWidth, canvasHeight);
      const targetPos = normalizedToCanvas(targetNode.x, targetNode.y, canvasWidth, canvasHeight);
      const color = hexToRgba(edge.color);
      
      edgeData.push(
        sourcePos.x,    // x1
        sourcePos.y,    // y1
        targetPos.x,    // x2
        targetPos.y,    // y2
        color.r,        // red
        color.g,        // green
        color.b,        // blue
        color.a,        // alpha
        edge.width,     // width
        0, 0, 0         // padding for alignment
      );
    }
  }
  
  return {
    nodeData: new Float32Array(nodeData),
    edgeData: new Float32Array(edgeData),
    nodeCount: normalizedNodes.length,
    edgeCount: normalizedEdges.length,
    nodeStride: 8, // 8 floats per node
    edgeStride: 12 // 12 floats per edge
  };
}

/**
 * Calculates the bounding box of all nodes
 */
export function getGraphBounds(nodes: GraphNode[]): { minX: number; minY: number; maxX: number; maxY: number } {
  if (nodes.length === 0) {
    return { minX: 0, minY: 0, maxX: 1, maxY: 1 };
  }
  
  let minX = nodes[0].x;
  let minY = nodes[0].y;
  let maxX = nodes[0].x;
  let maxY = nodes[0].y;
  
  for (const node of nodes) {
    minX = Math.min(minX, node.x);
    minY = Math.min(minY, node.y);
    maxX = Math.max(maxX, node.x);
    maxY = Math.max(maxY, node.y);
  }
  
  return { minX, minY, maxX, maxY };
}

// Entity count limits (must match Rust constants)
export const MAX_NODES = 100_000;
export const MAX_EDGES = 200_000;

export interface LimitCheckResult {
  nodeCount: number;
  edgeCount: number;
  nodeCountExceeded: boolean;
  edgeCountExceeded: boolean;
  warnings: string[];
  truncatedNodes?: GraphNode[];
  truncatedEdges?: GraphEdge[];
}

/**
 * Checks if graph data exceeds rendering limits and provides warnings
 */
export function checkGraphLimits(nodes: GraphNode[], edges: GraphEdge[], truncate: boolean = false): LimitCheckResult {
  const nodeCountExceeded = nodes.length > MAX_NODES;
  const edgeCountExceeded = edges.length > MAX_EDGES;
  const warnings: string[] = [];
  
  if (nodeCountExceeded) {
    warnings.push(`Node count (${nodes.length}) exceeds maximum (${MAX_NODES}). ${truncate ? `Only first ${MAX_NODES} nodes will be rendered.` : 'Consider reducing the number of nodes.'}`);
  }
  
  if (edgeCountExceeded) {
    warnings.push(`Edge count (${edges.length}) exceeds maximum (${MAX_EDGES}). ${truncate ? `Only first ${MAX_EDGES} edges will be rendered.` : 'Consider reducing the number of edges.'}`);
  }
  
  const result: LimitCheckResult = {
    nodeCount: nodes.length,
    edgeCount: edges.length,
    nodeCountExceeded,
    edgeCountExceeded,
    warnings
  };
  
  if (truncate) {
    result.truncatedNodes = nodeCountExceeded ? nodes.slice(0, MAX_NODES) : nodes;
    result.truncatedEdges = edgeCountExceeded ? edges.slice(0, MAX_EDGES) : edges;
  }
  
  return result;
}

/**
 * Gets performance recommendations based on graph size
 */
export function getPerformanceRecommendations(nodeCount: number, edgeCount: number): string[] {
  const recommendations: string[] = [];
  
  if (nodeCount > 10_000) {
    recommendations.push('Large node count detected. Consider using smaller node sizes for better performance.');
  }
  
  if (edgeCount > 20_000) {
    recommendations.push('Large edge count detected. Consider using thinner edges for better performance.');
  }
  
  if (nodeCount > 50_000 || edgeCount > 100_000) {
    recommendations.push('Very large graph detected. Consider implementing data virtualization or level-of-detail rendering.');
  }
  
  const totalEntities = nodeCount + edgeCount;
  if (totalEntities > 100_000) {
    recommendations.push('Consider clustering or aggregating nodes to improve performance and readability.');
  }
  
  return recommendations;
}