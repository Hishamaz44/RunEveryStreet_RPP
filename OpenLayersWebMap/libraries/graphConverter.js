import * as jsgraphs from "js-graph-algorithms";

// Then use:

let overpassToIndex = new Map();
let indexToOverpass = [];

// this created a weighted graph
function createWeightedGraph(nodes, edges) {
  let graph = new jsgraphs.WeightedGraph(nodes.length);

  nodes.forEach((node, index) => {
    overpassToIndex.set(node.nodeId, index);
    indexToOverpass[index] = node.nodeId;
  });

  for (let i = 0; i < edges.length; i++) {
    graph.addEdge(
      new jsgraphs.Edge(
        overpassToIndex.get(edges[i].from.nodeId),
        overpassToIndex.get(edges[i].to.nodeId),
        edges[i].distance
      )
    );
    graph.addEdge(
      new jsgraphs.Edge(
        overpassToIndex.get(edges[i].to.nodeId),
        overpassToIndex.get(edges[i].from.nodeId),
        edges[i].distance
      )
    );
  }
  return { graph };
}

function createWeightedDiGraph(nodes, edges) {
  let graph = new jsgraphs.WeightedDiGraph(nodes.length);

  nodes.forEach((node, index) => {
    overpassToIndex.set(node.nodeId, index);
    indexToOverpass[index] = node.nodeId;
  });

  edges.forEach((element) => {
    graph.addEdge(
      new jsgraphs.Edge(
        overpassToIndex.get(element.from.nodeId),
        overpassToIndex.get(element.to.nodeId),
        element.distance
      )
    );
  });
  return { graph };
}

// this creates an unweighted graph
function createGraph(nodes, edges) {
  let graph = new jsgraphs.Graph(nodes.length);

  nodes.forEach((node, index) => {
    overpassToIndex.set(node.nodeId, index);
    indexToOverpass[index] = node.nodeId;
  });

  edges.forEach((element) => {
    graph.addEdge(
      overpassToIndex.get(element.from.nodeId),
      overpassToIndex.get(element.to.nodeId)
    );
  });
  return { graph };
}

function applyDijkstra(graph, sourceNode) {
  let sourceIndex = overpassToIndex.get(sourceNode.nodeId);
  var dijkstra = new jsgraphs.Dijkstra(graph, sourceIndex);
  console.log(dijkstra);

  // for (var v = 1; v < graph.V; ++v) {
  //   if (dijkstra.hasPathTo(v)) {
  //     var path = dijkstra.pathTo(v);
  //     console.log("=====path from 0 to " + v + " start==========");
  //     for (var i = 0; i < path.length; ++i) {
  //       var e = path[i];
  //       console.log(e.from() + " => " + e.to() + ": " + e.weight);
  //     }
  //     console.log("=====path from 0 to " + v + " end==========");
  //     console.log("=====distance: " + dijkstra.distanceTo(v) + "=========");
  //   }
  // }
}

function testDijkstra() {
  var g = new jsgraphs.WeightedGraph(4);

  g.addEdge(new jsgraphs.Edge(0, 1, 1));

  g.addEdge(new jsgraphs.Edge(1, 2, 1));

  g.addEdge(new jsgraphs.Edge(2, 3, 1));

  var dijkstra = new jsgraphs.Dijkstra(g, 0);
  console.log(dijkstra);
}

function bellmanFord(graph, sourceNode) {
  let sourceIndex = overpassToIndex.get(sourceNode.nodeId);
  const bf = new jsgraphs.BellmanFord(graph, sourceIndex);

  console.log(bf);
}

// only for undirected and unweighted edges
function applyConnectedComponents(graph) {
  // console.log(graph);
  var cc = new jsgraphs.ConnectedComponents(graph);
  console.log(cc);
}

window.createGraph = createGraph;
window.applyDijkstra = applyDijkstra;
window.applyConnectedComponents = applyConnectedComponents;
window.createWeightedGraph = createWeightedGraph;
window.bellmanFord = bellmanFord;
window.testDijkstra = testDijkstra;
window.createWeightedDiGraph = createWeightedDiGraph;
