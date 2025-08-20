/*
This class contains functions that converts the uploaded gpx file into an
OSM object, which is then parsed to properly fit our use case.
*/
import { createGraph2 } from "../libraries/graphologyConverter.js";

// converts the gpx coordinates to an OSM file.
function gpxToOverpass(gpxCoordinates) {
  console.time("gpxToOverpass");

  // Check if chunking is needed
  if (gpxCoordinates.length > 600) {
    console.log(
      `Large dataset detected: ${gpxCoordinates.length} points. Using chunking mechanism.`
    );
    processGPXWithChunking(gpxCoordinates);
    console.timeEnd("gpxToOverpass");
    return;
  }

  // Process normally for smaller datasets
  processSingleGPXChunk(gpxCoordinates);
  console.timeEnd("gpxToOverpass");
}

// Process large GPX data using chunking
function processGPXWithChunking(gpxCoordinates) {
  console.time("processGPXWithChunking");

  // Simplify coordinates first to reduce total points
  const simplifiedCoords = simplifyGPXCoordinates(gpxCoordinates, 50); // Larger spacing for big datasets
  console.log(
    `Pre-chunking simplification: ${gpxCoordinates.length} → ${simplifiedCoords.length} points`
  );

  // Create chunks with overlap to ensure connectivity
  const chunkSize = 400; // Smaller than 600 to leave room for overlap
  const overlap = 50; // Overlap between chunks to maintain connectivity
  const chunks = createGPXChunks(simplifiedCoords, chunkSize, overlap);

  console.log(`Created ${chunks.length} chunks for processing`);

  // Process chunks sequentially to avoid overwhelming the Overpass API
  processChunksSequentially(chunks, 0);

  console.timeEnd("processGPXWithChunking");
}

// Create overlapping chunks from GPX coordinates
function createGPXChunks(coordinates, chunkSize, overlap) {
  console.time("createGPXChunks");
  const chunks = [];

  for (let i = 0; i < coordinates.length; i += chunkSize - overlap) {
    const end = Math.min(i + chunkSize, coordinates.length);
    const chunk = coordinates.slice(i, end);

    if (chunk.length > 1) {
      // Only add chunks with more than 1 point
      chunks.push({
        id: chunks.length,
        coordinates: chunk,
        startIndex: i,
        endIndex: end - 1,
      });
    }

    // If we've reached the end, break
    if (end >= coordinates.length) break;
  }

  console.timeEnd("createGPXChunks");
  return chunks;
}

// Process chunks one by one to avoid API rate limiting
function processChunksSequentially(chunks, currentIndex) {
  if (currentIndex >= chunks.length) {
    console.log("All chunks processed successfully!");
    console.log("Final results:");
    console.log("nodes: ", nodes);
    console.log("edges: ", edges);
    displayGPXTrack(nodes, edges);
    return;
  }

  const chunk = chunks[currentIndex];
  console.log(
    `Processing chunk ${currentIndex + 1}/${chunks.length} (${
      chunk.coordinates.length
    } points)`
  );

  // Process this chunk
  processSingleGPXChunk(chunk.coordinates, () => {
    // Callback: process next chunk after a short delay
    setTimeout(() => {
      processChunksSequentially(chunks, currentIndex + 1);
    }, 1000); // 1 second delay between chunks to be nice to the API
  });
}

// Process a single chunk (or the entire dataset if small)
function processSingleGPXChunk(gpxCoordinates, callback = null) {
  console.time(`processSingleGPXChunk-${gpxCoordinates.length}pts`);

  let overpassEndpoint = "https://overpass.kumi.systems/api/interpreter?data";
  let data;

  const constructQuery = (gpxCoordinates) => {
    console.time("constructQuery");

    // For chunks, apply lighter simplification since we already pre-simplified
    const simplifiedCoords =
      gpxCoordinates.length <= 600
        ? simplifyGPXCoordinates(gpxCoordinates, 30) // Normal simplification for small datasets
        : gpxCoordinates; // Skip re-simplification for chunks (already simplified)

    if (gpxCoordinates.length <= 600) {
      console.log(
        `Simplified from ${gpxCoordinates.length} to ${simplifiedCoords.length} points`
      );
    }

    // 1. Flatten GPX into a polyline string
    const coordinateStrings = [];
    for (let i = 0; i < simplifiedCoords.length; i++) {
      const [lat, lon] = simplifiedCoords[i];
      coordinateStrings.push(`${lat},${lon}`);
    }
    const lineCoords = coordinateStrings.join(",");
    console.log("lineCoords: ", lineCoords);
    // creates a line between each gpx point, and extracts all nodes along that line
    const query = `
        [out:xml][timeout:120];
  
        (
          node(around:10,${lineCoords});
        );
        out body;
  
        (
          way(bn)["highway"]
            ["highway" !~ "trunk|motorway|motorway_link|raceway|proposed|construction|service|elevator"]
            ["footway" !~ "crossing|sidewalk"]
            ["foot" !~ "no"]
            ["access" !~ "private|no"];
        );
        
        out body;
      `;
    console.timeEnd("constructQuery");
    return query;
  };

  const query = constructQuery(gpxCoordinates);
  async function fetchNodeAndEdges() {
    console.time("fetchNodeAndEdges");
    try {
      console.time("fetch-overpass-api");
      const response = await fetch(overpassEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(query)}`,
      });
      data = await response.text();
      console.timeEnd("fetch-overpass-api");
    } catch (error) {
      console.error("Error fetching data from Overpass API:", error);
      if (callback) callback(); // Continue with next chunk even if this one fails
      return;
    }

    console.time("parse-xml-data");
    var parser = new DOMParser();
    let newData = parser.parseFromString(data, "text/xml");
    console.log("newData: ", newData);
    console.timeEnd("parse-xml-data");

    parseVisitedNodes(newData);
    parseVisitedEdges(newData);
    nodes = removeUnnecessaryNodes(nodes);

    // Only log and display for single chunks or final result
    if (!callback) {
      console.log("nodes: ", nodes);
      console.log("edges: ", edges);
      displayGPXTrack(nodes, edges);
    }

    console.timeEnd("fetchNodeAndEdges");
    console.timeEnd(`processSingleGPXChunk-${gpxCoordinates.length}pts`);

    // Call callback if provided (for chunked processing)
    if (callback) {
      callback();
    }
  }
  fetchNodeAndEdges();
}

// Add this function:
function simplifyGPXCoordinates(coords, maxDistance = 50) {
  console.time("simplify-gpx-coordinates");
  if (coords.length <= 2) return coords;

  const simplified = [coords[0]]; // Always keep first point

  for (let i = 1; i < coords.length - 1; i++) {
    const [lat1, lon1] = simplified[simplified.length - 1];
    const [lat2, lon2] = coords[i];

    // Calculate distance (rough approximation)
    const distance = Math.sqrt(
      Math.pow((lat2 - lat1) * 111000, 2) +
        Math.pow((lon2 - lon1) * 111000 * Math.cos((lat1 * Math.PI) / 180), 2)
    );

    if (distance > maxDistance) {
      // Only keep points >50m apart
      simplified.push(coords[i]);
    }
  }

  simplified.push(coords[coords.length - 1]); // Always keep last point
  console.timeEnd("simplify-gpx-coordinates");
  return simplified;
}

// parses all the visited nodes and adds them to the nodes array
function parseVisitedNodes(data) {
  console.time("parseVisitedNodes");
  var XMLnodes = data.getElementsByTagName("node");
  numnodes = XMLnodes.length;

  // console.time("calculate-bounds");
  // for (let i = 0; i < numnodes; i++) {
  //   var lat = parseFloat(XMLnodes[i].getAttribute("lat"));
  //   var lon = parseFloat(XMLnodes[i].getAttribute("lon"));
  //   minlat = Math.min(minlat, lat);
  //   maxlat = Math.max(maxlat, lat);
  //   minlon = Math.min(minlon, lon);
  //   maxlon = Math.max(maxlon, lon);
  // }
  // console.timeEnd("calculate-bounds");

  // positionMap(minlon, minlat, maxlon, maxlat);

  console.time("create-node-objects");
  for (let i = 0; i < numnodes; i++) {
    var lat = XMLnodes[i].getAttribute("lat");
    var lon = XMLnodes[i].getAttribute("lon");
    var nodeid = XMLnodes[i].getAttribute("id");
    let id = parseInt(nodeid);
    let node = new Node1(id, lat, lon);
    node.visited = false;
    node.visitedOriginal = true;
    checkNodeDuplicate(nodes, node);
  }
  console.timeEnd("create-node-objects");
  console.timeEnd("parseVisitedNodes");
}

function removeUnnecessaryNodes(nodes) {
  console.time("removeUnnecessaryNodes");
  //This function removes nodes that are not connected to any edges
  let newNodes = [];
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].edges.length > 0) {
      newNodes.push(nodes[i]);
    }
  }
  console.timeEnd("removeUnnecessaryNodes");
  return newNodes;
}

// parses visited edges and adds them to the edges array
function parseVisitedEdges(data) {
  console.time("parseVisitedEdges");
  var XMLways = data.getElementsByTagName("way");
  numways = XMLways.length;
  //parse ways into edges
  for (let i = 0; i < numways; i++) {
    let wayid = XMLways[i].getAttribute("id");
    let nodesinsideway = XMLways[i].getElementsByTagName("nd");
    for (let j = 0; j < nodesinsideway.length - 1; j++) {
      let fromnode = getNodebyId(nodesinsideway[j].getAttribute("ref"));
      let tonode = getNodebyId(nodesinsideway[j + 1].getAttribute("ref"));
      if ((fromnode != null) & (tonode != null)) {
        let newEdge = new Edge(fromnode, tonode, wayid);
        newEdge.visited = false;
        newEdge.visitedOriginal = true;
        checkEdgeDuplicate(edges, newEdge);
      }
    }
  }
  console.timeEnd("parseVisitedEdges");
}

// checks for duplicates, then pushes to nodes
function checkNodeDuplicate(nodes, node) {
  let isDuplicateNode = false;
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].nodeId === node.nodeId) {
      isDuplicateNode = true;
      break;
    }
  }
  if (!isDuplicateNode) {
    nodes.push(node);
  }
}

// checks for duplicates, then pushes to edges
function checkEdgeDuplicate(edges, newEdge) {
  let isDuplicateEdge = false;
  for (let i = 0; i < edges.length; i++) {
    if (edges[i].wayid === newEdge.wayid) {
      if (
        (edges[i].from.nodeId === newEdge.from.nodeId &&
          edges[i].to.nodeId === newEdge.to.nodeId) ||
        (edges[i].from.nodeId === newEdge.to.nodeId &&
          edges[i].to.nodeId === newEdge.from.nodeId)
      ) {
        isDuplicateEdge = true;
        break;
      }
    }
  }
  if (!isDuplicateEdge) {
    edges.push(newEdge);
    totalVisitedEdgeDistance += newEdge.distance;
  }
}

// parses all unvisited nodes, and calls a function to check for node duplicates
function parseUnvisitedNodes(data) {
  console.time("parseUnvisitedNodes");
  var XMLnodes = data.getElementsByTagName("node");
  numnodes = XMLnodes.length;
  for (let i = 0; i < numnodes; i++) {
    var lat = XMLnodes[i].getAttribute("lat");
    var lon = XMLnodes[i].getAttribute("lon");
    minlat = min(minlat, lat);
    maxlat = max(maxlat, lat);
    minlon = min(minlon, lon);
    maxlon = max(maxlon, lon);
    var nodeid = XMLnodes[i].getAttribute("id");
    let id = parseInt(nodeid);
    let node = new Node1(id, lat, lon);
    checkNodeDuplicate(nodes, node);
  }
  console.timeEnd("parseUnvisitedNodes");
}

// parses all unvisited edges, and calls a function to check for edge duplicates
function parseUnvisitedEdges(data) {
  console.time("parseUnvisitedEdges");
  var XMLways = data.getElementsByTagName("way");
  numways = XMLways.length;
  //parse ways into edges
  for (let i = 0; i < numways; i++) {
    let wayid = XMLways[i].getAttribute("id");
    let nodesinsideway = XMLways[i].getElementsByTagName("nd");
    for (let j = 0; j < nodesinsideway.length - 1; j++) {
      let fromnode = getNodebyId(nodesinsideway[j].getAttribute("ref"));
      let tonode = getNodebyId(nodesinsideway[j + 1].getAttribute("ref"));
      if ((fromnode != null) & (tonode != null)) {
        let newEdge = new Edge(fromnode, tonode, wayid);
        integrateEdges(newEdge);
      }
    }
  }
  console.timeEnd("parseUnvisitedEdges");
}

// this function integrates each edge and compares whether its already inside the edges array
function integrateEdges(newEdge) {
  let isDuplicateEdge = false;

  const existingEdge = edges.find((obj) => {
    if (obj.wayid === newEdge.wayid) {
      if (
        // checks for edge duplicates in both directions.
        (obj.from.nodeId === newEdge.from.nodeId &&
          obj.to.nodeId === newEdge.to.nodeId) ||
        (obj.from.nodeId === newEdge.to.nodeId &&
          obj.to.nodeId === newEdge.from.nodeId)
      ) {
        isDuplicateEdge = true;
        if (!obj.visited && newEdge.visited) {
          obj.visited = true;
          obj.visitedOriginal = true;
        }
        return true;
      }
    }
    return false;
  });

  if (!isDuplicateEdge) {
    edges.push(newEdge);
    totalEdgeDistance += newEdge.distance;
  }
}

// AI generated code
function checkDuplicates() {
  console.time("checkDuplicates");
  // Check for duplicate nodes
  const nodeIds = new Set();
  const duplicateNodes = [];

  for (let i = 0; i < visitedNodes.length; i++) {
    const nodeId = visitedNodes[i].nodeId;
    if (nodeIds.has(nodeId)) {
      duplicateNodes.push({
        node: visitedNodes[i],
        index: i,
      });
    } else {
      nodeIds.add(nodeId);
    }
  }

  // Check for duplicate edges
  const edgeIds = new Set();
  const duplicateEdges = [];

  for (let i = 0; i < visitedEdges.length; i++) {
    const edgeId = `${visitedEdges[i].from.nodeId}-${visitedEdges[i].to.nodeId}`;
    if (edgeIds.has(edgeId)) {
      duplicateEdges.push({
        edge: visitedEdges[i],
        index: i,
      });
    } else {
      edgeIds.add(edgeId);
    }
  }

  // Log results
  if (duplicateNodes.length > 0) {
    console.log("Duplicate nodes found:", duplicateNodes);
  } else {
    console.log("No duplicate nodes found");
  }

  if (duplicateEdges.length > 0) {
    console.log("Duplicate edges found:", duplicateEdges);
  } else {
    console.log("No duplicate edges found");
  }

  console.timeEnd("checkDuplicates");
  return {
    duplicateNodes,
    duplicateEdges,
  };
}

function callFunctionFromOverpass(Graph) {
  console.time("callFunctionFromOverpass");
  console.log("am i able to call implementAlgorithm from this function?");
  console.log("Call graph from callfunctionfromOverpass", Graph);
  implementAlgorithm(Graph);
  console.timeEnd("callFunctionFromOverpass");
}

// allows functions to be used globally.
window.gpxToOverpass = gpxToOverpass;
window.parseUnvisitedNodes = parseUnvisitedNodes;
window.parseUnvisitedEdges = parseUnvisitedEdges;
window.callFunctionFromOverpass = callFunctionFromOverpass;
window.checkEdgeDuplicate = checkEdgeDuplicate;
