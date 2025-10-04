/**
 * Simple Greedy Algorithm for Run Every Street
 * This algorithm only cares about the number of visits (travels) per edge
 *
 * Key differences from the main greedy algorithm:
 * - Only sorts by travels count (a.travels - b.travels)
 * - No consideration of visited/unvisited status
 * - Simpler logic focused purely on minimizing edge reuse
 */

// Global flag to control algorithm execution
let simpleGreedyAlgorithmRunning = false;
let shouldStopSimpleGreedyAlgorithm = false;

function implementSimpleGreedyAlgorithm(startNode, maxTimeMs = 5000) {
  console.time("implementSimpleGreedyAlgorithm");

  const startTime = Date.now();

  if (!startNode) {
    console.error("No start node provided");
    return null;
  }

  // Set algorithm running state
  simpleGreedyAlgorithmRunning = true;
  shouldStopSimpleGreedyAlgorithm = false;

  // Initialize algorithm state
  let bestDistance = Infinity;
  let bestRoute = null;
  let iterations = 0;
  let efficiencyHistory = [];
  let distanceHistory = [];
  let totalEfficiencyGains = 0;

  // Calculate total edge distance (similar to totaledgedistance in original)
  let totalEdgeDistance = 0;
  for (let i = 0; i < edges.length; i++) {
    totalEdgeDistance += edges[i].distance;
  }

  console.log(
    `Starting simple greedy algorithm with ${maxTimeMs}ms time limit`
  );
  console.log(`Start node: ${startNode.nodeId}`);
  console.log(`Total edges to traverse: ${edges.length}`);

  // Main iteration loop - now time-based
  while (Date.now() - startTime < maxTimeMs) {
    // Check if algorithm should stop
    if (shouldStopSimpleGreedyAlgorithm) {
      console.log(
        `Simple algorithm manually stopped at iteration ${iterations}`
      );
      break;
    }

    iterations++;
    let solutionFound = false;
    let currentNode = startNode;
    let remainingEdges = edges.length; // All edges need to be traversed
    let currentRoute = new Route(currentNode, null);

    // Reset edge state for this iteration
    resetEdgesSimple();

    while (!solutionFound) {
      // Randomly shuffle edges around current node for variation
      shuffle(currentNode.edges, true);

      // Sort edges ONLY by number of times traveled (simpler than main algorithm)
      currentNode.edges.sort((a, b) => a.travels - b.travels);

      if (currentNode.edges.length === 0) {
        console.warn(`Node ${currentNode.nodeId} has no edges available`);
        break;
      }

      let edgeWithLeastTravels = currentNode.edges[0];
      let nextNode = edgeWithLeastTravels.OtherNodeofEdge(currentNode);

      // Update edge state
      edgeWithLeastTravels.travels++;

      // Add waypoint to route
      currentRoute.addWaypoint(nextNode, edgeWithLeastTravels.distance);
      currentNode = nextNode;

      // Check if this is the first time traveling on this edge
      if (edgeWithLeastTravels.travels === 1) {
        remainingEdges--; // Fewer edges that have not been traveled
      }

      // Check if all edges have been traversed at least once
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
              totalEdgeDistance / bestRoute.distance -
              efficiencyHistory[efficiencyHistory.length - 1];
          }
          efficiencyHistory.push(totalEdgeDistance / bestRoute.distance);
          distanceHistory.push(bestRoute.distance);

          const elapsedTime = Date.now() - startTime;
          console.log(
            `New best route found at iteration ${iterations} (${elapsedTime}ms): ${bestDistance.toFixed(
              2
            )}m`
          );
        }

        // Reset for next iteration
        currentNode = startNode;
        remainingEdges = edges.length;
        currentRoute = new Route(currentNode, null);
        resetEdgesSimple();
      }
    }

    // Progress logging every 1000 iterations
    if (iterations % 1000 === 0) {
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
  console.timeEnd("implementSimpleGreedyAlgorithm");

  // Reset running state
  simpleGreedyAlgorithmRunning = false;
  shouldStopSimpleGreedyAlgorithm = false;

  // Generate results summary
  const results = {
    bestRoute: bestRoute,
    bestDistance: bestDistance,
    iterations: iterations,
    efficiencyHistory: efficiencyHistory,
    distanceHistory: distanceHistory,
    totalEfficiencyGains: totalEfficiencyGains,
    efficiency: totalEdgeDistance / bestDistance,
    summary: {
      originalDistance: totalEdgeDistance,
      routeDistance: bestDistance,
      efficiency: (totalEdgeDistance / bestDistance).toFixed(3),
      waypoints: bestRoute ? bestRoute.waypoints.length : 0,
    },
  };

  console.log("=== Simple Greedy Algorithm Results ===");
  console.log(`Best distance: ${bestDistance.toFixed(2)}m`);
  console.log(`Original distance: ${totalEdgeDistance.toFixed(2)}m`);
  console.log(`Efficiency: ${results.summary.efficiency}`);
  console.log(`Waypoints: ${results.summary.waypoints}`);
  console.log("=======================================");

  // Generate and download GPX if route was found
  if (bestRoute && bestRoute.waypoints.length > 0) {
    const gpx = generateSimpleGPX(bestRoute.waypoints);
    downloadGPX(gpx, `simple_greedy_route_${iterations}_iterations`);
  }

  return results;
}

/**
 * Reset edges to their original state for a new iteration (simple version)
 * Only resets travels count, no visited status
 */
function resetEdgesSimple() {
  for (let i = 0; i < edges.length; i++) {
    edges[i].travels = 0;
    // Note: We don't reset visited status in this simple algorithm
  }
}

/**
 * Generate GPX file content from a list of nodes (simple version)
 */
function generateSimpleGPX(pathNodes) {
  console.time("generateSimpleGPX");
  const gpxHeader = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="SimpleGreedyAlgorithm" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>Simple Greedy Route</name>
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
  console.timeEnd("generateSimpleGPX");
  return result;
}

/**
 * Stop the simple greedy algorithm manually
 */
function stopSimpleGreedyAlgorithm() {
  if (simpleGreedyAlgorithmRunning) {
    shouldStopSimpleGreedyAlgorithm = true;
    console.log("Simple greedy algorithm stop requested...");
    return true;
  } else {
    console.log("No simple greedy algorithm currently running");
    return false;
  }
}

/**
 * Check if simple greedy algorithm is currently running
 */
function isSimpleGreedyAlgorithmRunning() {
  return simpleGreedyAlgorithmRunning;
}

// Make functions available globally
window.implementSimpleGreedyAlgorithm = implementSimpleGreedyAlgorithm;
window.stopSimpleGreedyAlgorithm = stopSimpleGreedyAlgorithm;
window.isSimpleGreedyAlgorithmRunning = isSimpleGreedyAlgorithmRunning;
