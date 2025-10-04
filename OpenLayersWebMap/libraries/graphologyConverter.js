// This is a class to integrate Graphology into the project

import * as Graph from "graphology";
// import * as shortestpath from "graphology-shortest-path";
import { dijkstra } from "graphology-shortest-path";
import { connectedComponents } from "graphology-components";

let resultArray = [];
export function createGraph2(nodes, edges) {
  let graph = new Graph.Graph();
  for (let i = 0; i < nodes.length; i++) {
    let nodeid = nodes[i].nodeId.toString();
    graph.addNode(nodeid, {
      lat: nodes[i].lat,
      lon: nodes[i].lon,
      visited: nodes[i].visited,
      visitedOriginal: nodes[i].visitedOriginal,
    });
  }
  for (let i = 0; i < edges.length; i++) {
    let fromnodeid = edges[i].from.nodeId.toString();
    let tonodeid = edges[i].to.nodeId.toString();
    if (graph.hasNode(fromnodeid) && graph.hasNode(tonodeid)) {
      graph.addUndirectedEdge(fromnodeid, tonodeid, {
        distance: edges[i].distance,
        wayid: edges[i].wayid,
        visited: edges[i].visited,
        visitedOriginal: edges[i].visitedOriginal,
      });
    }
  }
  // console.log(graph);
  return graph;
}

export function createGraph3(nodes, edges) {
  // Enable multi-graph to allow duplicate edges
  let graph = new Graph.Graph({ multi: true });

  for (let i = 0; i < nodes.length; i++) {
    let nodeid = nodes[i].nodeId.toString();
    graph.addNode(nodeid, {
      lat: nodes[i].lat,
      lon: nodes[i].lon,
      visited: nodes[i].visited,
      visitedOriginal: nodes[i].visitedOriginal,
    });
  }

  for (let i = 0; i < edges.length; i++) {
    let fromnodeid = edges[i].from.nodeId.toString();
    let tonodeid = edges[i].to.nodeId.toString();
    if (graph.hasNode(fromnodeid) && graph.hasNode(tonodeid)) {
      graph.addUndirectedEdge(fromnodeid, tonodeid, {
        distance: edges[i].distance,
        wayid: edges[i].wayid,
        visited: edges[i].visited,
        visitedOriginal: edges[i].visitedOriginal,
      });
    }
  }

  return graph;
}

function dijkstraGraphology(graph, source, target) {
  let distance = 0;
  const path = dijkstra.bidirectional(graph, source, target, "distance");

  if (!path) {
    return null;
  }

  for (let i = 0; i < path.length - 1; i++) {
    const edge = graph.edges(path[i], path[i + 1]);
    distance += graph.getEdgeAttribute(edge[0], "distance");
  }

  return { source, target, distance, path };
}

function isConnected(Graph) {
  const components = connectedComponents(Graph);
  return components;
}

function dijkstraGraphologySingleSource(graph, oddNodes) {
  console.time("calculateOddNodePairsOptimized");
  const oddNodePairs = [];
  const oddNodeIds = oddNodes.map((n) => n.nodeId.toString());
  const oddNodeSet = new Set(oddNodeIds); // For fast lookup

  for (let i = 0; i < oddNodes.length; i++) {
    const sourceId = oddNodeIds[i];

    // Get paths from this odd node to ALL nodes
    const allPaths = dijkstra.singleSource(graph, sourceId, "distance");

    // Filter to only include paths to OTHER odd nodes
    for (let j = i + 1; j < oddNodes.length; j++) {
      const targetId = oddNodeIds[j];

      // Only add if path exists to this odd node
      if (allPaths[targetId]) {
        const path = allPaths[targetId];

        // Calculate distance from the path
        let distance = 0;
        for (let k = 0; k < path.length - 1; k++) {
          const edge = graph.edges(path[k], path[k + 1]);
          // console.log(edge);
          distance += graph.getEdgeAttribute(edge[0], "distance");
        }

        oddNodePairs.push({
          source: sourceId,
          target: targetId,
          distance: distance,
          path: path,
        });
      }
    }
  }

  console.timeEnd("calculateOddNodePairsOptimized");
  return oddNodePairs;
}

function dijkstraSupernodeSingleSource(
  graph,
  components,
  oddNodeIdsForComponents = null
) {
  console.time("calculateSupernodePairsOptimized");
  const supernodeResults = [];
  let edgeId = 0;
  const usedOddNodes = new Set(); // Track which odd nodes have been used

  // Step 1: Add super-nodes and zero-weight edges
  console.time("add-supernodes");
  for (let i = 0; i < components.length; i++) {
    const superId = `super-${i}`;
    graph.addNode(superId);

    if (oddNodeIdsForComponents && oddNodeIdsForComponents.size > 0) {
      // CE2 approach: Connect supernode only to odd nodes within this component
      const oddNodesInComponent = components[i].filter((nodeId) =>
        oddNodeIdsForComponents.has(nodeId)
      );

      // Connect supernode only to odd nodes within this component
      for (const nodeId of oddNodesInComponent) {
        try {
          graph.addUndirectedEdge(superId, nodeId, {
            distance: 0,
          });
        } catch (error) {
          // Handle potential duplicate edge errors
        }
      }

      // If no odd nodes in this component, connect to the first node for pathfinding
      if (oddNodesInComponent.length === 0) {
        try {
          graph.addUndirectedEdge(superId, components[i][0], {
            distance: 0,
          });
        } catch (error) {
          // Handle potential errors
        }
      }
    } else {
      // CE1 approach: Connect supernode to all nodes in component
      for (const nodeId of components[i]) {
        graph.addUndirectedEdge(superId, nodeId, {
          distance: 0,
        });
      }
    }
  }
  console.timeEnd("add-supernodes");

  // Step 2: Run single source Dijkstra from each super-node
  console.time("dijkstra-between-supernodes");
  for (let i = 0; i < components.length; i++) {
    const sourceSuperId = `super-${i}`;

    // Get paths from this supernode to ALL nodes (single Dijkstra call)
    const allPaths = dijkstra.singleSource(graph, sourceSuperId, "distance");

    // Filter to only include paths to OTHER supernodes
    for (let j = i + 1; j < components.length; j++) {
      const targetSuperId = `super-${j}`;

      // Only add if path exists to this supernode
      if (allPaths[targetSuperId]) {
        const path = allPaths[targetSuperId];

        // Calculate distance from the path
        let distance = 0;
        for (let k = 0; k < path.length - 1; k++) {
          const edges = graph.edges(path[k], path[k + 1]);
          if (edges && edges.length > 0) {
            distance += graph.getEdgeAttribute(edges[0], "distance");
          } else {
            // Skip this path if we can't calculate the distance properly
            distance = Infinity;
            break;
          }
        }

        // Skip this path if distance calculation failed
        if (distance === Infinity) {
          continue;
        }

        // Remove supernodes from path (keep only normal nodes)
        const normalPath = path.slice(1, -1);

        // Validate that we have a valid path with at least 2 nodes
        if (normalPath.length < 2) {
          console.warn(`Invalid path length: ${normalPath.length} nodes`);
          continue;
        }

        const from = normalPath[0];
        const to = normalPath[normalPath.length - 1];

        // Validate that from and to nodes exist
        if (!from || !to) {
          console.warn(`Invalid path endpoints: from=${from}, to=${to}`);
          continue;
        }

        // For CE2: Validate that path endpoints are odd nodes and ensure they haven't been used
        if (oddNodeIdsForComponents && oddNodeIdsForComponents.size > 0) {
          const firstRealNode = normalPath[0];
          const lastRealNode = normalPath[normalPath.length - 1];

          // Only add path if both endpoints are odd nodes AND haven't been used yet
          if (
            oddNodeIdsForComponents.has(firstRealNode) &&
            oddNodeIdsForComponents.has(lastRealNode) &&
            !usedOddNodes.has(firstRealNode) &&
            !usedOddNodes.has(lastRealNode)
          ) {
            // Mark these odd nodes as used
            usedOddNodes.add(firstRealNode);
            usedOddNodes.add(lastRealNode);

            // Remove the specific supernode edges that were used in this path
            try {
              // Remove the supernode edge that was used from component i
              if (graph.hasEdge(sourceSuperId, firstRealNode)) {
                graph.dropEdge(sourceSuperId, firstRealNode);
              }

              // Remove the supernode edge that was used from component j
              if (graph.hasEdge(targetSuperId, lastRealNode)) {
                graph.dropEdge(targetSuperId, lastRealNode);
              }
            } catch (error) {
              console.warn(`Could not remove used supernode edges:`, error);
            }

            supernodeResults.push({
              id: edgeId++,
              distance: distance,
              from: from,
              to: to,
              path: normalPath,
              componentFrom: i, // Add component info for CE2
              componentTo: j, // Add component info for CE2
            });
          }
        } else {
          // CE1: Add all valid paths
          supernodeResults.push({
            id: edgeId++,
            distance: distance,
            from: from,
            to: to,
            path: normalPath,
          });
        }
      }
    }
  }
  console.timeEnd("dijkstra-between-supernodes");

  // Step 3: Remove all supernodes
  console.time("remove-supernodes");
  graph.forEachNode((nodeId) => {
    if (nodeId.startsWith("super-")) {
      graph.dropNode(nodeId);
    }
  });
  console.timeEnd("remove-supernodes");

  console.timeEnd("calculateSupernodePairsOptimized");
  return supernodeResults;
}

window.createGraph2 = createGraph2;
window.dijkstraGraphology = dijkstraGraphology;
window.isConnected = isConnected;
window.createGraph3 = createGraph3;
window.dijkstraGraphologySingleSource = dijkstraGraphologySingleSource;
window.dijkstraSupernodeSingleSource = dijkstraSupernodeSingleSource;
