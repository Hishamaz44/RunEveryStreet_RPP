// This will do some tests on the extracted gpx files and will be AI generated
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");
const dom = new JSDOM("");
const DOMParser = new dom.window.DOMParser();

function validateGPXContent(gpxContent) {
  if (!gpxContent || typeof gpxContent !== "string") {
    throw new Error("Invalid GPX content: content must be a non-empty string");
  }
  if (!gpxContent.includes("<gpx")) {
    throw new Error("Invalid GPX content: not a GPX file");
  }
  return gpxContent;
}

/**
 * Analyzes a GPX file to detect repeating nodes, edges, and nodes with same coordinates
 * @param {string} gpxFilePath - Path to the GPX file
 * @returns {Object} Results of the analysis
 */
function analyzeGPXFile(gpxFilePath) {
  console.log(`Reading file from: ${gpxFilePath}`);

  // Check if file exists
  if (!fs.existsSync(gpxFilePath)) {
    throw new Error(`File not found: ${gpxFilePath}`);
  }

  // Read the GPX file
  const gpxContent = validateGPXContent(fs.readFileSync(gpxFilePath, "utf8"));
  console.log(`File loaded, content length: ${gpxContent.length} characters`);

  // Parse the XML content
  const xmlDoc = DOMParser.parseFromString(gpxContent, "text/xml");

  // Extract track points
  const trackPoints = xmlDoc.getElementsByTagName("trkpt");
  console.log(`Found ${trackPoints.length} track points in the GPX file`);

  // Store nodes (points) and edges for comparison
  const nodes = [];
  const edges = [];
  const nodeCoordinates = new Map(); // To store unique coordinates

  // Results
  const results = {
    repeatingNodes: [],
    repeatingEdges: [],
    nodesWithSameCoordinates: [],
  };

  // Process all track points
  for (let i = 0; i < trackPoints.length; i++) {
    const point = trackPoints[i];
    const lat = parseFloat(point.getAttribute("lat"));
    const lon = parseFloat(point.getAttribute("lon"));

    // Create a unique ID for this node
    const nodeId = `${i}`; // Using index as ID
    const coordKey = `${lat.toFixed(7)},${lon.toFixed(7)}`;

    // Check for repeating nodes (same point appears multiple times)
    const nodeInfo = { id: nodeId, lat, lon, index: i };
    const existingNodes = nodes.filter(
      (node) => node.lat === lat && node.lon === lon
    );

    if (existingNodes.length > 0) {
      results.repeatingNodes.push({
        node: nodeInfo,
        repeatsAt: existingNodes.map((n) => n.id),
      });
    }

    // Store node
    nodes.push(nodeInfo);

    // Check for nodes with same coordinates (using Map for efficient lookup)
    if (nodeCoordinates.has(coordKey)) {
      const existingNodeIds = nodeCoordinates.get(coordKey);
      existingNodeIds.push(nodeId);

      // Only add to results if this is the first duplicate (to avoid duplicating results)
      if (existingNodeIds.length === 2) {
        results.nodesWithSameCoordinates.push({
          coordinates: { lat, lon },
          nodeIds: [...existingNodeIds],
        });
      } else if (existingNodeIds.length > 2) {
        // Update existing result with new nodeId
        const existingResult = results.nodesWithSameCoordinates.find(
          (r) => r.coordinates.lat === lat && r.coordinates.lon === lon
        );
        if (existingResult) {
          existingResult.nodeIds.push(nodeId);
        }
      }
    } else {
      nodeCoordinates.set(coordKey, [nodeId]);
    }

    // Check for repeating edges (if not the first point)
    if (i > 0) {
      const prevNode = nodes[i - 1];
      const currentEdge = {
        from: prevNode.id,
        to: nodeId,
        fromLat: prevNode.lat,
        fromLon: prevNode.lon,
        toLat: lat,
        toLon: lon,
      };

      // Check if this edge already exists
      const existingEdgeIndex = edges.findIndex(
        (edge) =>
          (edge.fromLat === currentEdge.fromLat &&
            edge.fromLon === currentEdge.fromLon &&
            edge.toLat === currentEdge.toLat &&
            edge.toLon === currentEdge.toLon) ||
          // Also check the reverse direction
          (edge.fromLat === currentEdge.toLat &&
            edge.fromLon === currentEdge.toLon &&
            edge.toLat === currentEdge.fromLat &&
            edge.toLon === currentEdge.fromLon)
      );

      if (existingEdgeIndex !== -1) {
        results.repeatingEdges.push({
          edge: currentEdge,
          repeatsAt: edges[existingEdgeIndex],
        });
      }

      edges.push(currentEdge);
    }
  }

  console.log(
    `Analysis complete. Found ${results.repeatingNodes.length} repeating nodes, ${results.nodesWithSameCoordinates.length} nodes with same coordinates, and ${results.repeatingEdges.length} repeating edges.`
  );

  return results;
}

/**
 * Formats the analysis results for better readability
 * @param {Object} results - Analysis results
 * @returns {string} Formatted results
 */
function formatResults(results) {
  let output = "GPX File Analysis Results:\n\n";

  // Repeating nodes
  output += `1. Repeating Nodes: ${results.repeatingNodes.length}\n`;
  if (results.repeatingNodes.length > 0) {
    results.repeatingNodes.forEach((item, index) => {
      output += `   ${index + 1}. Node at index ${item.node.index} (${
        item.node.lat
      }, ${item.node.lon}) repeats at indices: ${item.repeatsAt.join(", ")}\n`;
    });
  } else {
    output += "   No repeating nodes found.\n";
  }

  // Nodes with same coordinates
  output += `\n2. Nodes with Same Coordinates: ${results.nodesWithSameCoordinates.length}\n`;
  if (results.nodesWithSameCoordinates.length > 0) {
    results.nodesWithSameCoordinates.forEach((item, index) => {
      output += `   ${index + 1}. Coordinates (${item.coordinates.lat}, ${
        item.coordinates.lon
      }) appear at nodes: ${item.nodeIds.join(", ")}\n`;
    });
  } else {
    output += "   No nodes with same coordinates found.\n";
  }

  // Repeating edges
  output += `\n3. Repeating Edges: ${results.repeatingEdges.length}\n`;
  if (results.repeatingEdges.length > 0) {
    results.repeatingEdges.forEach((item, index) => {
      output += `   ${index + 1}. Edge from (${item.edge.fromLat}, ${
        item.edge.fromLon
      }) to (${item.edge.toLat}, ${item.edge.toLon}) repeats\n`;
    });
  } else {
    output += "   No repeating edges found.\n";
  }

  return output;
}

/**
 * Main function to analyze a GPX file
 * @param {string} gpxFilePath - Path to the GPX file
 */
function analyzeGPX(gpxFilePath) {
  try {
    console.log(`Starting analysis of GPX file: ${gpxFilePath}`);
    const results = analyzeGPXFile(gpxFilePath);
    const formattedResults = formatResults(results);
    console.log(formattedResults);

    // Save the results to a file
    const outputFile = "gpx_analysis_results.txt";
    fs.writeFileSync(outputFile, formattedResults);
    console.log(`Results also saved to: ${outputFile}`);

    return results;
  } catch (error) {
    console.error(`Error analyzing GPX file: ${error.message}`);
    console.error(error.stack);
    throw error; // Re-throw to handle it in the calling code
  }
}

// Export all functions
module.exports = {
  analyzeGPXFile,
  analyzeGPX,
  formatResults,
  validateGPXContent,
};

// Only run the analysis if this file is being run directly
if (require.main === module) {
  console.log("GPX Cleaning Tool Starting");
  try {
    const relativePath = path.resolve(
      __dirname,
      "OpenLayersWebMap/routes/testroute.gpx"
    );
    analyzeGPX(relativePath);
  } catch (error) {
    console.log("Failed with relative path, trying absolute path...");
    try {
      const absolutePath =
        "C:/Users/hisha/Bachelorarbeit/RunEveryStreetTutorial/OpenLayersWebMap/routes/testroute.gpx";
      analyzeGPX(absolutePath);
    } catch (secondError) {
      console.error("Failed to analyze GPX file with both paths:");
      console.error(error);
      console.error(secondError);
    }
  }
}
