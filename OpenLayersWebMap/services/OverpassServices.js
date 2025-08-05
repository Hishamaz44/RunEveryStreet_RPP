/*
This class contains functions that converts the uploaded gpx file into an
OSM object, which is then parsed to properly fit our use case.
*/
import { createGraph2 } from "../libraries/graphologyConverter.js";

// converts the gpx coordinates to an OSM file.
function gpxToOverpass(gpxCoordinates) {
  let overpassEndpoint = "https://overpass-api.de/api/interpreter?data=";
  let data;
  const constructQuery = (gpxCoordinates) => {
    // 1. Flatten GPX into a polyline string
    const coordinateStrings = [];
    for (let i = 0; i < gpxCoordinates.length; i++) {
      const [lat, lon] = gpxCoordinates[i];
      coordinateStrings.push(`${lat},${lon}`);
    }
    const lineCoords = coordinateStrings.join(",");

    // creates a line between each gpx point, and extracts all nodes along that line
    return `
        [out:xml][timeout:25];
  
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
  };

  const query = constructQuery(gpxCoordinates);
  async function fetchNodeAndEdges() {
    try {
      const response = await fetch(overpassEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(query)}`,
      });
      data = await response.text();
    } catch (error) {
      console.error("Error fetching data from Overpass API:", error);
    }
    var parser = new DOMParser();
    let newData = parser.parseFromString(data, "text/xml");
    console.log("newData: ", newData);
    parseVisitedNodes(newData);
    parseVisitedEdges(newData);
    nodes = removeUnnecessaryNodes(nodes);
    console.log("nodes: ", nodes);
    console.log("edges: ", edges);
    displayGPXTrack(nodes, edges);
    // graphologyGraph = createGraph2(nodes, edges);
    // implementAlgorithm(graphologyGraph);
  }
  fetchNodeAndEdges();
}

// parses all the visited nodes and adds them to the nodes array
function parseVisitedNodes(data) {
  var XMLnodes = data.getElementsByTagName("node");
  numnodes = XMLnodes.length;

  for (let i = 0; i < numnodes; i++) {
    var lat = parseFloat(XMLnodes[i].getAttribute("lat"));
    var lon = parseFloat(XMLnodes[i].getAttribute("lon"));
    minlat = Math.min(minlat, lat);
    maxlat = Math.max(maxlat, lat);
    minlon = Math.min(minlon, lon);
    maxlon = Math.max(maxlon, lon);
  }

  // positionMap(minlon, minlat, maxlon, maxlat);

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
}

function removeUnnecessaryNodes(nodes) {
  //This function removes nodes that are not connected to any edges
  let newNodes = [];
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].edges.length > 0) {
      newNodes.push(nodes[i]);
    }
  }
  return newNodes;
}

// parses visited edges and adds them to the edges array
function parseVisitedEdges(data) {
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
}

// parses all unvisited edges, and calls a function to check for edge duplicates
function parseUnvisitedEdges(data) {
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

  return {
    duplicateNodes,
    duplicateEdges,
  };
}

function callFunctionFromOverpass(Graph) {
  console.log("am i able to call implementAlgorithm from this function?");
  console.log("Call graph from callfunctionfromOverpass", Graph);
  implementAlgorithm(Graph);
}

// allows functions to be used globally.
window.gpxToOverpass = gpxToOverpass;
window.parseUnvisitedNodes = parseUnvisitedNodes;
window.parseUnvisitedEdges = parseUnvisitedEdges;
window.callFunctionFromOverpass = callFunctionFromOverpass;
window.checkEdgeDuplicate = checkEdgeDuplicate;
