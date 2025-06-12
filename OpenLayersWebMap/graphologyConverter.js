// // This is a class to integrate Graphology into the project

// import * as Graph from "graphology";
// import * as shortestpath from "graphology-shortest-path";

// function createGraph2(nodes, edges) {
//   let graph = new Graph.Graph();
//   for (let i = 0; i < nodes.length; i++) {
//     let nodeid = nodes[i].nodeId.toString();
//     graph.addNode(nodeid, {
//       lat: nodes[i].lat,
//       lon: nodes[i].lon,
//       visited: nodes[i].visited,
//       visitedOriginal: nodes[i].visitedOriginal,
//     });
//   }
//   for (let i = 0; i < edges.length; i++) {
//     let fromnodeid = edges[i].from.nodeId.toString();
//     let tonodeid = edges[i].to.nodeId.toString();
//     graph.addEdge(fromnodeid, tonodeid, {
//       distance: edges[i].distance,
//       wayid: edges[i].wayid,
//       visited: edges[i].visited,
//       visitedOriginal: edges[i].visitedOriginal,
//     });
//   }
//   console.log(graph);
//   return graph;
// }

// function dijkstraGraphology(graph, source, target) {
//   let distance = 0;
//   const path = shortestpath.dijkstra.bidirectional(
//     graph,
//     source,
//     target,
//     "distance"
//   );
//   for (let i = 0; i < path.length; i++) {
//     if (path[i + 1]) {
//       let edge = graph.edge(path[i], path[i + 1]);
//       distance = distance + graph.getEdgeAttribute(edge, "distance");
//     }
//   }
//   console.log("this is the path and its distance", { path }, { distance });
// }

// window.createGraph2 = createGraph2;
// window.dijkstraGraphology = dijkstraGraphology;
