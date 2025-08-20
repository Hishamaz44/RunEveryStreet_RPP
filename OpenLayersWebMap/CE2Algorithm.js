function implementCE2Algorithm(Graph) {
  console.time("implementCE2Algorithm");
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
  let disconnectedGraphologyGraph = createGraph2(SubgraphNodes, SubgraphEdges);
  console.timeEnd("create-disconnected-graph");

  // 3 find whether the Graph is connected or not using Graphology
  console.time("check-connectivity");
  let components = isConnected(disconnectedGraphologyGraph);
  console.timeEnd("check-connectivity");

  // 3.5 FIRST odd node detection - for component connection via supernodes
  console.time("first-odd-node-detection");
  let oddNodesForComponents = []; // First set of odd nodes
  let oddNodeIdsForComponents = new Set(); // Set of odd node IDs for quick lookup

  for (let i = 0; i < SubgraphNodes.length; i++) {
    if (SubgraphNodes[i].edges.length % 2 == 1) {
      oddNodesForComponents.push(SubgraphNodes[i]);
      oddNodeIdsForComponents.add(SubgraphNodes[i].nodeId.toString());
    }
  }
  console.log("Odd nodes for component connection:", oddNodesForComponents);
  console.log(
    "Odd node IDs for component connection:",
    Array.from(oddNodeIdsForComponents)
  );
  console.timeEnd("first-odd-node-detection");

  if (components.length > 1) {
    // 4 find shortest path between the components using supernodes connected only to odd nodes
    shortestPathComponents2 = findShortestPairsWithSupernodes(
      components,
      Graph,
      oddNodeIdsForComponents // Pass the first set of odd node IDs
    );

    // 5 connect the shortest paths between the components using a version of Kruskal
    let connectedResults = connectComponents(shortestPathComponents2);
    console.log(
      "This are the edges that will need to be connected to create a conneceted graph",
      connectedResults
    );

    createConnectingEdges(SubgraphEdges, connectedResults);
  }

  // 6 SECOND odd node detection - recheck after components are connected
  console.time("second-odd-node-detection");
  // Clear the original oddNodes array and recalculate
  oddNodes = []; // Reset the main oddNodes array

  for (let i = 0; i < SubgraphNodes.length; i++) {
    if (SubgraphNodes[i].edges.length % 2 == 1) {
      oddNodes.push(SubgraphNodes[i]);
    }
  }
  console.log(
    "Odd nodes AFTER component connection (for main matching):",
    oddNodes
  );
  console.log(
    "First detection found:",
    oddNodesForComponents.length,
    "odd nodes"
  );
  console.log("Second detection found:", oddNodes.length, "odd nodes");
  console.timeEnd("second-odd-node-detection");

  // 7 get all odd node pair distances (using the recalculated oddNodes)
  console.time("calculate-odd-node-pairs");
  for (let i = 0; i < oddNodes.length; i++) {
    for (let j = i + 1; j < oddNodes.length; j++) {
      if (oddNodes[i].nodeId !== oddNodes[j].nodeId) {
        const result = dijkstraGraphology(
          Graph,
          oddNodes[i].nodeId.toString(),
          oddNodes[j].nodeId.toString()
        );

        if (result) oddNodePairs.push(result);
      }
    }
  }
  console.timeEnd("calculate-odd-node-pairs");

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
  console.log("These are the unique pairs of the odd nodes", uniquePairs);
  console.timeEnd("find-unique-pairs");

  // 9. Here we create the augmented edges
  createAugmentedEdges(SubgraphEdges, uniquePairs);
  // 10. find the Eulerian tour.
  const nodeList = hierholzerAlgorithm(SubgraphNodes, SubgraphEdges);
  console.log("Subgraph edges after adding augmented edges", SubgraphEdges);
  console.log(nodeList);
  const gpx = generateGPX(nodeList);
  downloadGPX(gpx, "RPPtest");
  console.timeEnd("implementCE2Algorithm");
}

// find shortest pairs between components using supernodes that connect only to odd nodes within each component
function findShortestPairsWithSupernodes(
  components,
  graph,
  oddNodeIdsForComponents
) {
  console.time("findShortestPairsWithSupernodes");
  const metagraphResults = [];
  let edgeId = 0;

  console.log("=== COMPONENT CONNECTION VIA ODD NODES ===");
  console.log("Components:", components);
  console.log(
    "Odd node IDs for component connection:",
    Array.from(oddNodeIdsForComponents)
  );

  // Step 1: Add super-nodes and zero-weight edges to odd nodes only
  console.time("add-supernodes");
  for (let i = 0; i < components.length; i++) {
    const superId = `super-${i}`;
    graph.addNode(superId);

    // Filter component nodes to only include odd nodes
    const oddNodesInComponent = components[i].filter((nodeId) =>
      oddNodeIdsForComponents.has(nodeId)
    );

    console.log(`Component ${i}:`);
    console.log(`  Total nodes: ${components[i].length}`);
    console.log(`  Odd nodes: ${oddNodesInComponent.length}`);
    console.log(`  Odd node IDs in component: ${oddNodesInComponent}`);

    // Connect supernode only to odd nodes within this component
    for (const nodeId of oddNodesInComponent) {
      try {
        graph.addUndirectedEdge(superId, nodeId, {
          distance: 0,
        });
        console.log(`  ✓ Connected super-${i} to odd node ${nodeId}`);
      } catch (error) {
        console.warn(
          `  ✗ Could not connect super-${i} to node ${nodeId}:`,
          error
        );
      }
    }

    // If no odd nodes in this component, connect to the first node for pathfinding
    if (oddNodesInComponent.length === 0) {
      console.warn(
        `⚠️ Component ${i} has no odd nodes, connecting to first node for pathfinding`
      );
      if (components[i].length > 0) {
        try {
          graph.addUndirectedEdge(superId, components[i][0], {
            distance: 0,
          });
          console.log(
            `  ✓ Connected super-${i} to first node ${components[i][0]} (fallback)`
          );
        } catch (error) {
          console.warn(
            `  ✗ Could not connect super-${i} to fallback node:`,
            error
          );
        }
      }
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

      if (result && result.path) {
        // remove all super nodes from path so only the normal path remains
        result.path = result.path.slice(1, -1);
        console.log(`Path between super-${i} and super-${j}:`, result.path);

        // assign normal nodes to from and to nodes
        let from = result.path[0];
        let to = result.path[result.path.length - 1];

        if (result && from && to) {
          console.log(
            `✓ Shortest path between components ${i} and ${j} found via odd nodes`
          );
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

  console.log("=== COMPONENT CONNECTION COMPLETE ===");
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
  console.log(metagraphResults);

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
      console.log("This is the path", path);
      console.timeEnd("hierholzerAlgorithm");
      return path;
      // console.log("this is the total distance", totalDistance);

      break;
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
window.implementCE2Algorithm = implementCE2Algorithm;
// window.implementAlgorithm2 = implementAlgorithm2;
