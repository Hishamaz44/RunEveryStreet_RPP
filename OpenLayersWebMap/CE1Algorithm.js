function implementCE1Algorithm(Graph) {
  console.time("implementCE1Algorithm");
  // the function takes graph as a graphology instance

  /* 
  full graph with both visited and unvisited edges should be saved, and used in point 4. 
  */

  let oddNodes = [];
  let oddNodePairs = [];
  let uniquePairs = [];
  let SubgraphNodes = [];
  let SubgraphEdges = [];
  // let tempNodes = [];
  // let tempEdges = [];
  // let shortestPathComponents = [];
  let shortestPathComponents2 = [];

  // 1 add nodes to subgraph
  console.time("add-nodes-to-subgraph");
  for (let i = 0; i < nodes.length; i++) {
    let addNode = false;
    for (let j = 0; j < nodes[i].edges.length; j++) {
      if (nodes[i].edges[j].visitedOriginal === false) {
        addNode = true;
        break;
      }
    }
    if (addNode) {
      SubgraphNodes.push(nodes[i]);
    }
  }
  for (const node of SubgraphNodes) {
    node.edges = node.edges.filter((edge) => edge.visited === false);
  }
  console.timeEnd("add-nodes-to-subgraph");

  // 2 add edges to subgraph
  console.time("add-edges-to-subgraph");
  for (let i = 0; i < edges.length; i++) {
    if (edges[i].visitedOriginal == false) {
      SubgraphEdges.push(edges[i]);
    }
  }
  console.timeEnd("add-edges-to-subgraph");

  console.time("create-disconnected-graph");
  let disconnectedGraphologyGraph = createGraph3(SubgraphNodes, SubgraphEdges);
  console.timeEnd("create-disconnected-graph");

  // 3 find whether the Graph is connected or not using Graphology
  console.time("check-connectivity");
  let components = isConnected(disconnectedGraphologyGraph);
  console.log(components);
  console.timeEnd("check-connectivity");

  if (components.length > 1) {
    // 4 find shortest path between the components
    // shortestPathComponents2 = findShortestPairsWithSupernodes(
    //   components,
    //   Graph
    // );

    // 4
    shortestPathComponents2 = dijkstraSupernodeSingleSource(Graph, components);
    // 5 connect the shortest paths between the components using a version of Kruskal
    let connectedResults = connectComponents(shortestPathComponents2);
    // console.log(
    //   "This are the edges that will need to be connected to create a conneceted graph",
    //   connectedResults
    // );

    createConnectingEdges(SubgraphEdges, connectedResults);
  }

  // // 7 get all odd node pair distances
  // console.time("calculate-odd-node-pairs");
  // for (let i = 0; i < oddNodes.length; i++) {
  //   for (let j = i + 1; j < oddNodes.length; j++) {
  //     if (oddNodes[i].nodeId !== oddNodes[j].nodeId) {
  //       const result = dijkstraGraphology(
  //         Graph,
  //         oddNodes[i].nodeId.toString(),
  //         oddNodes[j].nodeId.toString()
  //       );

  //       if (result) oddNodePairs.push(result);
  //     }
  //   }
  // }
  // console.timeEnd("calculate-odd-node-pairs");

  console.time("find-odd-nodes");
  for (let i = 0; i < SubgraphNodes.length; i++) {
    if (SubgraphNodes[i].edges.length % 2 == 1) {
      oddNodes.push(SubgraphNodes[i]);
    }
  }
  // console.log("these are the odd nodes", oddNodes);
  // console.log(Graph);
  console.timeEnd("find-odd-nodes");

  // 7 get all odd node pair distance using single source dijkstra. This is done to test which is faster.
  console.time("calculate-odd-node-distance-singleSource");
  oddNodePairs = dijkstraGraphologySingleSource(Graph, oddNodes);
  console.timeEnd("calculate-odd-node-distance-singleSource");

  //8 Here we find the shortest distances between all odd nodes, and pair them together
  console.time("find-unique-pairs");
  oddNodePairs.sort((a, b) => a.distance - b.distance);
  let uniqueSet = new Set();
  for (let i = 0; i < oddNodePairs.length; i++) {
    if (
      !uniqueSet.has(oddNodePairs[i].source) &&
      !uniqueSet.has(oddNodePairs[i].target)
    ) {
      uniqueSet.add(oddNodePairs[i].source);
      uniqueSet.add(oddNodePairs[i].target);
      uniquePairs.push(oddNodePairs[i]);
    }
  }
  // console.log("These are the unique pairs of the odd nodes", uniquePairs);
  console.timeEnd("find-unique-pairs");

  // 9. Here we create the augmented edges
  createAugmentedEdges(SubgraphEdges, uniquePairs);
  // 10. find the Eulerian tour.
  const { nodeList, totalDistance } = hierholzerAlgorithm(
    SubgraphNodes,
    SubgraphEdges
  );
  console.log("Subgraph edges after adding augmented edges", SubgraphEdges);
  // console.log("Node list:", nodeList);
  // console.log("Total distance:", totalDistance);

  // Set global variables for metrics system
  if (nodeList && nodeList.length > 0) {
    bestroute = new Route(nodeList[0], null);
    // Add all waypoints to the route
    for (let i = 1; i < nodeList.length; i++) {
      const prevNode = nodeList[i - 1];
      const currentNode = nodeList[i];
      const distance = calcdistance(
        prevNode.lat,
        prevNode.lon,
        currentNode.lat,
        currentNode.lon
      );
      bestroute.addWaypoint(currentNode, distance);
    }

    // Use the calculated totalDistance from Hierholzer algorithm
    bestdistance = totalDistance;
    bestroute.distance = totalDistance; // Also set the route's distance property

    // console.log("CE1 - Set bestdistance to:", bestdistance);
    // console.log("CE1 - Set bestroute.distance to:", bestroute.distance);
    // console.log(
    //   "CE1 - Set bestroute with waypoints:",
    //   bestroute.waypoints.length
    // );
  }

  const gpx = generateGPX(nodeList);
  downloadGPX(gpx, "RPP_CE1");
  console.timeEnd("implementCE1Algorithm");
}

// function dijkstraSupernodeSingleSource(graph, components) {
//   console.time("findShortestPairsWithSupernodes");
//   const metagraphResults = [];
//   let edgeId = 0;

//   // Step 1: Add super-nodes and zero-weight edges (exactly like your current code)
//   console.time("add-supernodes");
//   for (let i = 0; i < components.length; i++) {
//     const superId = `super-${i}`;
//     graph.addNode(superId);

//     for (const nodeId of components[i]) {
//       graph.addUndirectedEdge(superId, nodeId, {
//         distance: 0,
//       });
//     }
//   }
//   console.timeEnd("add-supernodes");

//   // Step 2: Run single source Dijkstra from each super-node (OPTIMIZED PART)
//   console.time("dijkstra-between-supernodes");
//   for (let i = 0; i < components.length; i++) {
//     const sourceSuperId = `super-${i}`;

//     // Get paths from this supernode to ALL nodes (single Dijkstra call)
//     const allPaths = dijkstra.singleSource(graph, sourceSuperId, "distance");

//     // Process paths to other supernodes only
//     for (let j = i + 1; j < components.length; j++) {
//       const targetSuperId = `super-${j}`;

//       // Check if path exists to this supernode
//       if (allPaths[targetSuperId]) {
//         const path = allPaths[targetSuperId];

//         // Calculate distance from the path
//         let distance = 0;
//         for (let k = 0; k < path.length - 1; k++) {
//           const edge = graph.edges(path[k], path[k + 1]);
//           distance += graph.getEdgeAttribute(edge[0], "distance");
//         }

//         // Remove supernodes from path (exactly like your current code)
//         const normalPath = path.slice(1, -1);
//         const from = normalPath[0];
//         const to = normalPath[normalPath.length - 1];

//         // Push result in same format as your current code
//         metagraphResults.push({
//           id: edgeId++,
//           distance: distance,
//           from: from,
//           to: to,
//           path: normalPath,
//         });
//       }
//     }
//   }
//   console.timeEnd("dijkstra-between-supernodes");

//   // Step 3: Remove all supernodes (exactly like your current code)
//   console.time("remove-supernodes");
//   graph.forEachNode((nodeId) => {
//     if (nodeId.startsWith("super-")) {
//       graph.dropNode(nodeId);
//     }
//   });
//   console.timeEnd("remove-supernodes");

//   console.timeEnd("findShortestPairsWithSupernodes");
//   return metagraphResults;
// }

// find shortest pairs between components using supernodes (1 node that connects all nodes with 0 costs, within its component)
function findShortestPairsWithSupernodes(components, graph) {
  console.time("findShortestPairsWithSupernodes");
  const metagraphResults = [];
  let edgeId = 0;

  // Step 1: Add super-nodes and zero-weight edges
  console.time("add-supernodes");
  for (let i = 0; i < components.length; i++) {
    const superId = `super-${i}`;

    graph.addNode(superId);

    for (const nodeId of components[i]) {
      graph.addUndirectedEdge(superId, nodeId, {
        distance: 0,
      });
    }
  }
  console.timeEnd("add-supernodes");

  // Step 2: Run Dijkstra from each super-node to other super-nodes
  console.time("dijkstra-between-supernodes");
  for (let i = 0; i < components.length; i++) {
    for (let j = i + 1; j < components.length; j++) {
      const superFrom = `super-${i}`;
      const superTo = `super-${j}`;

      const result = dijkstraGraphology(graph, superFrom, superTo);
      // remove all super nodes from path so only the normal path remains
      result.path = result.path.slice(1, -1);
      // console.log("this is the path of the result", result.path);
      // assign normal nodes to from and to nodes
      let from = result.path[0];
      let to = result.path[result.path.length - 1];
      if (result) {
        // console.log("i think the code is not going here");
        metagraphResults.push({
          id: edgeId++,
          distance: result.distance,
          from: from,
          to: to,
          path: result.path,
        });
      }
    }
  }
  console.timeEnd("dijkstra-between-supernodes");

  //remove all supernodes
  console.time("remove-supernodes");
  graph.forEachNode((nodeId) => {
    if (nodeId.startsWith("super-")) {
      graph.dropNode(nodeId);
    }
  });
  console.timeEnd("remove-supernodes");

  console.timeEnd("findShortestPairsWithSupernodes");
  return metagraphResults;
}

// connect the components into the graph.
// this function is AI written. Write it again to learn what it does.
function connectComponents(metagraphResults) {
  console.time("connectComponents");
  let connectedResults = [];

  // Sort by distance
  metagraphResults.sort((a, b) => a.distance - b.distance);
  // console.log(metagraphResults);

  // Map string IDs to integer indices
  const idToIndex = new Map();
  let index = 0;

  for (const edge of metagraphResults) {
    if (!idToIndex.has(edge.from)) {
      idToIndex.set(edge.from, index++);
    }
    if (!idToIndex.has(edge.to)) {
      idToIndex.set(edge.to, index++);
    }
  }

  // Union-Find setup
  // initializes all disconnected components as their own parent
  const parent = new Array(index).fill(0).map((_, i) => i);

  // finds the parent of x recursively
  function find(x) {
    if (parent[x] !== x) {
      parent[x] = find(parent[x]);
    }
    return parent[x];
  }
  // merges the sets that x and y belong to (to avoid duplicates)
  function union(x, y) {
    const rootX = find(x);
    const rootY = find(y);
    if (rootX === rootY) return false;
    parent[rootY] = rootX;
    return true;
  }

  // Kruskal loop
  for (let i = 0; i < metagraphResults.length; i++) {
    const edge = metagraphResults[i];
    const fromIndex = idToIndex.get(edge.from);
    const toIndex = idToIndex.get(edge.to);

    if (union(fromIndex, toIndex)) {
      connectedResults.push(edge);
    }
  }

  console.timeEnd("connectComponents");
  return connectedResults;
}

function createConnectingEdges(edges, connectingEdges) {
  console.time("createConnectingEdges");
  // this function will connect all the component connecting edges
  // to the original graph and append them to the original edges array

  for (let i = 0; i < connectingEdges.length; i++) {
    let path = connectingEdges[i].path;
    let totalDistance = connectingEdges[i].distance;

    // Create edges for each step in the connecting path
    for (let j = 0; j < path.length - 1; j++) {
      let fromNodeId = path[j];
      let toNodeId = path[j + 1];

      // Get the actual node objects
      let fromNode = getNodebyId(fromNodeId);
      let toNode = getNodebyId(toNodeId);

      if (fromNode && toNode) {
        // Calculate individual edge distance
        let edgeDistance = calcdistance(
          fromNode.lat,
          fromNode.lon,
          toNode.lat,
          toNode.lon
        );

        // Create unique edge ID for this segment
        let edgeId = `connecting-${fromNodeId}-${toNodeId}-${i}-${j}`;

        // Always create the edge (duplicates needed for connectivity)
        let edge = new Edge(fromNode, toNode, edgeId);
        edge.augmentedEdge = true;
        edge.distance = edgeDistance;
        edge.augmentedPath = path; // Store the full path for reference
        edges.push(edge);
      }
    }
  }
  console.timeEnd("createConnectingEdges");
}

function createAugmentedEdges(edges, uniquePairs) {
  console.time("createAugmentedEdges");
  // here we can start implementing our hierholzer's algorithm.
  // first, we get the respective paths of the unique pairs
  for (let i = 0; i < uniquePairs.length; i++) {
    let path = uniquePairs[i].path;
    let totalDistance = uniquePairs[i].distance;

    // Create edges for each step in the augmented path
    for (let j = 0; j < path.length - 1; j++) {
      let fromNodeId = path[j];
      let toNodeId = path[j + 1];

      // Get the actual node objects
      let fromNode = getNodebyId(fromNodeId);
      let toNode = getNodebyId(toNodeId);

      if (fromNode && toNode) {
        // Calculate individual edge distance
        let edgeDistance = calcdistance(
          fromNode.lat,
          fromNode.lon,
          toNode.lat,
          toNode.lon
        );

        // Create unique edge ID for this segment
        let edgeId = `augmented-${fromNodeId}-${toNodeId}-${i}-${j}`;

        // Always create the edge (duplicates are needed for Eulerian tour)
        let edge = new Edge(fromNode, toNode, edgeId);
        edge.augmentedEdge = true;
        edge.distance = edgeDistance;
        edge.augmentedPath = path; // Store the full path for reference
        edges.push(edge);
      }
    }
  }
  console.timeEnd("createAugmentedEdges");
}

function hierholzerAlgorithm(nodes, edges) {
  console.time("hierholzerAlgorithm");
  // This is where we write our Euler circuit algorithm.
  let stack = [];
  let path = [];
  let done = false;
  let totalDistance = 0;

  stack.push(startnode);

  while (!done) {
    if (stack.length == 0) {
      done = true;
      // console.log("This is the path", path);
      // console.log("Total distance calculated:", totalDistance);
      console.timeEnd("hierholzerAlgorithm");
      return { nodeList: path, totalDistance: totalDistance };
    }
    let currentNode = stack[stack.length - 1];
    let unvisitedEdge;
    let foundUnvisited = false;
    for (let i = 0; i < currentNode.edges.length; i++) {
      if (currentNode.edges[i].visited === false) {
        foundUnvisited = true;
        unvisitedEdge = currentNode.edges[i];
        let nodeToVisit = unvisitedEdge.OtherNodeofEdge(currentNode);
        stack.push(nodeToVisit);
        totalDistance = totalDistance + unvisitedEdge.distance;
        unvisitedEdge.visited = true;
        break;
      }
    }
    if (!foundUnvisited) {
      let temp = stack.pop();
      path.push(temp);
    }
  }

  // Fallback return (shouldn't reach here normally)
  return { nodeList: path, totalDistance: totalDistance };
}

// generated by AI
function generateGPX(pathNodes) {
  console.time("generateGPX");
  const gpxHeader = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="YourApp" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>Route</name>
    <trkseg>`;

  const gpxFooter = `
    </trkseg>
  </trk>
</gpx>`;

  const trackPoints = pathNodes
    .map((node) => {
      return `      <trkpt lat="${node.lat}" lon="${node.lon}">\n        <ele>${
        node.ele || 0
      }</ele>\n      </trkpt>`;
    })
    .join("\n");

  const result = gpxHeader + "\n" + trackPoints + "\n" + gpxFooter;
  console.timeEnd("generateGPX");
  return result;
}

function downloadGPX(gpxString, filename = "route.gpx") {
  console.time("downloadGPX");

  // Automatically add .gpx extension if not present
  if (!filename.toLowerCase().endsWith(".gpx")) {
    filename += ".gpx";
  }

  const blob = new Blob([gpxString], { type: "application/gpx+xml" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";

  document.body.appendChild(a);
  a.click();

  // Cleanup
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
  console.timeEnd("downloadGPX");
}

function expandAugmentedEdges() {
  console.time("expandAugmentedEdges");
  console.timeEnd("expandAugmentedEdges");
}
// implement a filter function that sorts by several factors including temp, etc.
window.implementCE1Algorithm = implementCE1Algorithm;
// window.implementAlgorithm2 = implementAlgorithm2;
