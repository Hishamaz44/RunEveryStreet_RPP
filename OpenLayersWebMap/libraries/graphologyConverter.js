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

function dijkstraGraphology(graph, source, target) {
  let distance = 0;
  const path = dijkstra.bidirectional(graph, source, target, "distance");

  if (!path) {
    console.warn(`⚠️ No path found between ${source} and ${target}`);
    return null;
  }

  for (let i = 0; i < path.length - 1; i++) {
    const edge = graph.edge(path[i], path[i + 1]);
    distance += graph.getEdgeAttribute(edge, "distance");
  }

  return { source, target, distance, path };
}

function isConnected(Graph) {
  const components = connectedComponents(Graph);
  return components;
}

window.createGraph2 = createGraph2;
window.dijkstraGraphology = dijkstraGraphology;
window.isConnected = isConnected;
