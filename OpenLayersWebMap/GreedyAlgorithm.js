/**
 * Greedy Algorithm for Run Every Street
 * Extracted from sketch.js solveRESmode logic
 *
 * This algorithm uses a greedy approach to find routes by:
 * 1. Starting from a given node
 * 2. Always choosing the edge with least travels that hasn't been visited
 * 3. Randomly shuffling edges with same priority to add variation
 * 4. Running multiple iterations to find the best route
 */

// Global flag to control algorithm execution
let greedyAlgorithmRunning = false;
let shouldStopGreedyAlgorithm = false;

function implementGreedyAlgorithm(startNode, maxTimeMs = 5000) {
  console.time("implementGreedyAlgorithm");

  const startTime = Date.now();

  if (!startNode) {
    console.error("No start node provided");
    return null;
  }

  // Set algorithm running state
  greedyAlgorithmRunning = true;
  shouldStopGreedyAlgorithm = false;

  // Initialize algorithm state
  let bestDistance = Infinity;
  let bestRoute = null;
  let iterations = 0;
  let efficiencyHistory = [];
  let distanceHistory = [];
  let totalEfficiencyGains = 0;

  // Calculate total distance of original (non-augmented) edges
  let totalDistanceRevised = 0;
  for (let i = 0; i < edges.length; i++) {
    if (!edges[i].augmentedEdge) {
      totalDistanceRevised += edges[i].distance;
    }
  }

  console.log(`Starting greedy algorithm with ${maxTimeMs}ms time limit`);
  console.log(`Start node: ${startNode.nodeId}`);
  console.log(
    `Total edges to traverse: ${edges.filter((e) => !e.visitedOriginal).length}`
  );

  // Main iteration loop - now time-based
  while (Date.now() - startTime < maxTimeMs) {
    // Check if algorithm should stop
    if (shouldStopGreedyAlgorithm) {
      console.log(`Algorithm manually stopped at iteration ${iterations}`);
      break;
    }

    iterations++;
    let solutionFound = false;
    let currentNode = startNode;
    let remainingEdges = edges.filter((e) => !e.visitedOriginal).length;
    let currentRoute = new Route(currentNode, null);

    // Reset edge state for this iteration
    resetEdges();

    while (!solutionFound) {
      // Randomly shuffle edges around current node for variation
      shuffle(currentNode.edges, true);

      // Sort edges by priority: unvisited first, then by number of travels
      currentNode.edges.sort((a, b) => {
        if (a.visited !== b.visited) return a.visited - b.visited;
        return a.travels - b.travels;
      });

      if (currentNode.edges.length === 0) {
        console.warn(`Node ${currentNode.nodeId} has no edges available`);
        break;
      }

      let edgeWithLeastTravels = currentNode.edges[0];
      let nextNode = edgeWithLeastTravels.OtherNodeofEdge(currentNode);

      // Update edge state
      edgeWithLeastTravels.travels++;
      if (!edgeWithLeastTravels.visited && edgeWithLeastTravels.travels === 1) {
        edgeWithLeastTravels.visited = true;
        remainingEdges--;
      }

      // Add waypoint to route
      currentRoute.addWaypoint(nextNode, edgeWithLeastTravels.distance);
      currentNode = nextNode;

      // Check if all edges have been traversed
      if (remainingEdges === 0) {
        solutionFound = true;

        // Add return distance to start node
        currentRoute.distance += calcdistance(
          currentNode.lat,
          currentNode.lon,
          startNode.lat,
          startNode.lon
        );

        // Check if this is the best route so far
        if (currentRoute.distance < bestDistance) {
          bestRoute = new Route(null, currentRoute);
          bestDistance = currentRoute.distance;

          // Calculate efficiency metrics
          if (efficiencyHistory.length > 1) {
            totalEfficiencyGains +=
              totalDistanceRevised / bestRoute.distance -
              efficiencyHistory[efficiencyHistory.length - 1];
          }
          efficiencyHistory.push(totalDistanceRevised / bestRoute.distance);
          distanceHistory.push(bestRoute.distance);

          const elapsedTime = Date.now() - startTime;
          console.log(
            `New best route found at iteration ${iterations} (${elapsedTime}ms): ${bestDistance.toFixed(
              2
            )}m`
          );
        }
      }
    }

    // Progress logging every 100 iterations
    if (iterations % 100 === 0) {
      const elapsedTime = Date.now() - startTime;
      const remainingTime = maxTimeMs - elapsedTime;
      console.log(
        `Iteration ${iterations}, Time: ${elapsedTime}ms/${maxTimeMs}ms (${remainingTime}ms remaining), Best distance: ${bestDistance.toFixed(
          2
        )}m`
      );
    }
  }

  const totalTime = Date.now() - startTime;
  console.log(
    `Algorithm completed in ${totalTime}ms with ${iterations} iterations`
  );
  console.timeEnd("implementGreedyAlgorithm");

  // Reset running state
  greedyAlgorithmRunning = false;
  shouldStopGreedyAlgorithm = false;

  // Generate results summary
  const results = {
    bestRoute: bestRoute,
    bestDistance: bestDistance,
    iterations: iterations,
    efficiencyHistory: efficiencyHistory,
    distanceHistory: distanceHistory,
    totalEfficiencyGains: totalEfficiencyGains,
    efficiency: totalDistanceRevised / bestDistance,
    summary: {
      originalDistance: totalDistanceRevised,
      routeDistance: bestDistance,
      efficiency: (totalDistanceRevised / bestDistance).toFixed(3),
      waypoints: bestRoute ? bestRoute.waypoints.length : 0,
    },
  };

  console.log("=== Greedy Algorithm Results ===");
  console.log(`Best distance: ${bestDistance.toFixed(2)}m`);
  console.log(`Original distance: ${totalDistanceRevised.toFixed(2)}m`);
  console.log(`Efficiency: ${results.summary.efficiency}`);
  console.log(`Waypoints: ${results.summary.waypoints}`);
  console.log("================================");

  // Generate and download GPX if route was found
  if (bestRoute && bestRoute.waypoints.length > 0) {
    const gpx = generateGPX(bestRoute.waypoints);
    downloadGPX(gpx, `greedy_route_${iterations}_iterations`);
  }

  return results;
}

/**
 * Reset edges to their original state for a new iteration
 */
function resetEdges() {
  for (let i = 0; i < edges.length; i++) {
    edges[i].travels = 0;
    edges[i].visited = edges[i].visitedOriginal;
  }
}

/**
 * Generate GPX file content from a list of nodes
 */
function generateGPX(pathNodes) {
  console.time("generateGPX");
  const gpxHeader = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="GreedyAlgorithm" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>Greedy Route</name>
    <trkseg>`;

  const gpxFooter = `
    </trkseg>
  </trk>
</gpx>`;

  const trackPoints = pathNodes
    .map((node) => {
      return `      <trkpt lat="${node.lat}" lon="${node.lon}">
        <ele>${node.ele || 0}</ele>
      </trkpt>`;
    })
    .join("\n");

  const result = gpxHeader + "\n" + trackPoints + "\n" + gpxFooter;
  console.timeEnd("generateGPX");
  return result;
}

/**
 * Download GPX content as a file
 */
function downloadGPX(gpxString, filename = "greedy_route.gpx") {
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

/**
 * Stop the greedy algorithm manually
 */
function stopGreedyAlgorithm() {
  if (greedyAlgorithmRunning) {
    shouldStopGreedyAlgorithm = true;
    console.log("Greedy algorithm stop requested...");
    return true;
  } else {
    console.log("No greedy algorithm currently running");
    return false;
  }
}

/**
 * Check if greedy algorithm is currently running
 */
function isGreedyAlgorithmRunning() {
  return greedyAlgorithmRunning;
}

// Make functions available globally
window.implementGreedyAlgorithm = implementGreedyAlgorithm;
window.stopGreedyAlgorithm = stopGreedyAlgorithm;
window.isGreedyAlgorithmRunning = isGreedyAlgorithmRunning;
