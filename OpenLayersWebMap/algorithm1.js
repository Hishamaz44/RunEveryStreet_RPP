//testing to see where the changes get updated
// test2

function implementAlgorithm() {
  let oddNodes = [];
  let oddNodePairs = [];
  let uniquePairs = [];
  // console.log("This is nodes run from implementAlgorithm: ", nodes);
  // console.log("This is edges run from implementAlgorithm: ", edges);
  // console.log("This is a created graph in Graphology: ", graphologyGraph);

  // 1. identify all odd nodes and save them in oddNodes
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].edges.length % 2 == 1) {
      oddNodes.push(nodes[i]);
    }
  }
  console.log("these are the odd nodes in the graph: ", oddNodes);
  // 2. find the distances between all unique odd node pairs
  for (let i = 0; i < oddNodes.length; i++) {
    for (let j = i + 1; j < oddNodes.length; j++) {
      if (oddNodes[i].nodeId !== oddNodes[j].nodeId) {
        oddNodePairs = dijkstraGraphology(
          graphologyGraph,
          oddNodes[i].nodeId.toString(),
          oddNodes[j].nodeId.toString()
        );
      }
    }
  }
  // 3. rank them from descending order, and then follow a naive greedy approach to choose shortest distances
  oddNodePairs.sort((a, b) => a.distance - b.distance);
  console.log("these are the sorted odd node pairs: ", oddNodePairs);
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
  console.log("these are the unique matched pairs: ", uniquePairs);
  // 4. Augment paths into the original graph
  for (let i = 0; i < uniquePairs.length; i++) {
    let path = uniquePairs[i].path;
    let distanceOfPath = uniquePairs[i].distance;
    for (let j = 0; j < path.length - 1; j++) {
      let edge = new Edge(
        getNodebyId(path[j]),
        getNodebyId(path[j + 1]),
        "wayid" + j
      );
      edge.augmentedEdge = true;
      edges.push(edge);
    }
  }
  console.log(edges);
  console.log(nodes);
}

window.implementAlgorithm = implementAlgorithm;
