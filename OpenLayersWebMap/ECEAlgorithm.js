function implementECEAlgorithm(Graph) {
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

  // 2 add edges to subgraph
  for (let i = 0; i < edges.length; i++) {
    if (edges[i].visitedOriginal == false) {
      SubgraphEdges.push(edges[i]);
    }
  }
  let disconnectedGraphologyGraph = createGraph2(SubgraphNodes, SubgraphEdges);

  // 3 get all odd nodes from our subgraph
  for (let i = 0; i < SubgraphNodes.length; i++) {
    if (SubgraphNodes[i].edges.length % 2 == 1) {
      oddNodes.push(SubgraphNodes[i]);
    }
  }
  console.log("these are the odd nodes", oddNodes);

  // 4 get all odd node pair distances
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

  // 5 Here we find the shortest distances between all odd nodes, and pair them together
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
  console.log(oddNodePairs);

  // 6. Here we create the augmented edges
  createAugmentedEdges(SubgraphEdges, uniquePairs);
  console.log("Subgraph edges after adding augmented Edges: ", SubgraphEdges);
  console.log("Subgraph nodes after adding augmented Edged: ", SubgraphNodes);
  // create Graphology graph after adding the augmented edges that connect all even nodes
  let evenGraph = createGraph3(SubgraphNodes, SubgraphEdges);
  let oldComponents = isConnected(disconnectedGraphologyGraph);
  let components = isConnected(evenGraph);

  console.log("difference between two components: ", {
    oldComponents,
    components,
  });

  if (components.length > 1) {
    // 7 find shortest path between the components
    shortestPathComponents2 = findShortestPairsWithSupernodes(
      components,
      Graph
    );

    // 8 connect the shortest paths between the components using a version of Kruskal
    let connectedResults = connectComponents(shortestPathComponents2);
    console.log(
      "This are the edges that will need to be connected to create a conneceted graph",
      connectedResults
    );

    createConnectingEdges(SubgraphEdges, connectedResults);
  }

  // 9 After connecting the edges, we need to check for odd nodes again and make them even
  // we also need to reset all the previous odd node variables
  console.log("Clearing odd node detection variables before processing");
  let oddNodes2 = []; // Clear array
  let oddNodePairs2 = []; // Clear array
  let uniquePairs2 = []; // Clear array
  // 10 detect odd nodes
  for (let i = 0; i < SubgraphNodes.length; i++) {
    if (SubgraphNodes[i].edges.length % 2 == 1) {
      oddNodes2.push(SubgraphNodes[i]);
    }
  }
  console.log("these are the odd nodes", oddNodes2);

  // 11 get all odd node pair distances
  for (let i = 0; i < oddNodes2.length; i++) {
    for (let j = i + 1; j < oddNodes2.length; j++) {
      if (oddNodes2[i].nodeId !== oddNodes2[j].nodeId) {
        const result = dijkstraGraphology(
          Graph,
          oddNodes2[i].nodeId.toString(),
          oddNodes2[j].nodeId.toString()
        );

        if (result) oddNodePairs2.push(result);
      }
    }
  }

  // 12 Here we find the shortest distances between all odd nodes, and pair them together
  oddNodePairs2.sort((a, b) => a.distance - b.distance);
  let uniqueSet2 = new Set();
  for (let i = 0; i < oddNodePairs2.length; i++) {
    if (
      !uniqueSet2.has(oddNodePairs2[i].source) &&
      !uniqueSet2.has(oddNodePairs2[i].target)
    ) {
      uniqueSet2.add(oddNodePairs2[i].source);
      uniqueSet2.add(oddNodePairs2[i].target);
      uniquePairs2.push(oddNodePairs2[i]);
    }
  }
  console.log(oddNodePairs2);

  // 13. Here we create the augmented edges between the odd nodes
  createAugmentedEdges(SubgraphEdges, uniquePairs2);
  // 14. Run Hierholzer
  const nodeList = hierholzerAlgorithm(SubgraphNodes, SubgraphEdges);
  console.log("Subgraph edges after adding augmented edges", SubgraphEdges);
  console.log(nodeList);

  const gpx = generateGPX(nodeList);
  downloadGPX(gpx, "RPPtest");
}

function hierholzerAlgorithm(nodes, edges) {
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

function createConnectingEdges(edges, connectingEdges) {
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
}

function findShortestPairsWithSupernodes(components, graph) {
  const metagraphResults = [];
  let edgeId = 0;

  // Step 1: Add super-nodes and zero-weight edges
  for (let i = 0; i < components.length; i++) {
    const superId = `super-${i}`;

    graph.addNode(superId);

    for (const nodeId of components[i]) {
      graph.addUndirectedEdge(superId, nodeId, {
        distance: 0,
      });
    }
  }

  // Step 2: Run Dijkstra from each super-node to other super-nodes
  for (let i = 0; i < components.length; i++) {
    for (let j = i + 1; j < components.length; j++) {
      const superFrom = `super-${i}`;
      const superTo = `super-${j}`;

      const result = dijkstraGraphology(graph, superFrom, superTo);
      // remove all super nodes from path so only the normal path remains
      result.path = result.path.slice(1, -1);
      console.log("this is the path of the result", result.path);
      // assign normal nodes to from and to nodes
      let from = result.path[0];
      let to = result.path[result.path.length - 1];
      if (result) {
        console.log("i think the code is not going here");
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

  //remove all supernodes
  graph.forEachNode((nodeId) => {
    if (nodeId.startsWith("super-")) {
      graph.dropNode(nodeId);
    }
  });
  return metagraphResults;
}

function createAugmentedEdges(edges, uniquePairs) {
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
}

function connectComponents(metagraphResults) {
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

  return connectedResults;
}

// generated by AI
function generateGPX(pathNodes) {
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

  return gpxHeader + "\n" + trackPoints + "\n" + gpxFooter;
}

function downloadGPX(gpxString, filename = "route.gpx") {
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
}
window.implementECEAlgorithm = implementECEAlgorithm;
