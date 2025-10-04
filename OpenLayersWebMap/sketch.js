openlayersmap = new ol.Map({
  target: "map",
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM(),
      opacity: 0.5,
    }),
  ],
  view: new ol.View({
    center: ol.proj.fromLonLat([10.333, 51.81]), // centers on clausthal
    zoom: 15.5,
  }),
});

let graphologyGraph;
var canvas;
var mapHeight;
var windowX, windowY;
let txtoverpassQuery;
var OSMxml;
var numnodes, numways;
var nodes;
var minlat = Infinity,
  maxlat = -Infinity,
  minlon = Infinity,
  maxlon = -Infinity;
var nodes = [],
  edges = [];
var mapminlat, mapminlon, mapmaxlat, mapmaxlon;
var totalEdgeDistance = 0;
var closestnodetomouse = -1;
var closestedgetomouse = -1;
var startnode, currentnode;
var choosemapmode = 1,
  loadMapMode = 2,
  selectnodemode = 3,
  trimmode = 4,
  solveRESmode = 5,
  downloadGPXmode = 6;
var mode;
var remainingedges;
var debugsteps = 0;
var bestdistance;
var bestroute;
var bestarea;
var bestdoublingsup;
var showSteps = false;
var showRoads = true;
var iterations, iterationsperframe;
var msgbckDiv, msgDiv, reportbckDiv, reportmsgDiv;
var margin;
var btnTLx, btnTLy, btnBRx, btnBRy; // button's top left and bottom right x and y coordinates.
var starttime;
var efficiencyhistory = [],
  distancehistory = [];
var totalefficiencygains = 0;
// var isTouchScreenDevice = false;
var isTouchScreenDevice = window.matchMedia("(pointer: coarse)").matches;
var totaluniqueroads;
var visitedEdges = [];
var visitedNodes = [];
var totalVisitedEdgeDistance = 0;
let totalDistanceRevised;
var hoveredNode = null;
function setup() {
  // This code snippet initializes the values
  // check if user has location enabled. If yes, center to their location
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function (position) {
      openlayersmap
        .getView()
        .setCenter(
          ol.proj.fromLonLat([
            position.coords.longitude,
            position.coords.latitude,
          ])
        );
    });
  }
  // initialize window
  mapWidth = windowWidth;
  mapHeight = windowHeight;
  windowX = windowWidth;
  windowY = mapHeight;
  canvas = createCanvas(windowX, windowY - 34);
  colorMode(HSB);
  mode = choosemapmode;
  iterationsperframe = 1;
  margin = 0.17;
  showMessage("Zoom to selected area, then click here");

  document.getElementById("gpxFile").addEventListener("change", function (e) {
    let files = e.target.files;
    if (files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        if (files[i].name.endsWith(".gpx")) {
          loadGPX(files[i]);
        } else {
          alert("please select a gpx file");
        }
      }
    }
  });

  document.getElementById("csvFile").addEventListener("change", function (e) {
    let files = e.target.files;
    if (files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        if (files[i].name.endsWith(".csv")) {
          loadCSV(files[i]);
        } else {
          alert("please select a csv file");
        }
      }
    }
  });

  document
    .getElementById("applyAlgorithm")
    .addEventListener("click", function () {
      applyCE1Algorithm();
    });

  document
    .getElementById("applyECEAlgorithm")
    .addEventListener("click", function () {
      applyECEAlgorithm();
    });
  document
    .getElementById("applyCE2Algorithm")
    .addEventListener("click", function () {
      applyCE2Algorithm();
    });

  document
    .getElementById("applyGreedyAlgorithm")
    .addEventListener("click", function () {
      applyGreedyAlgorithm();
    });

  document
    .getElementById("stopGreedyAlgorithm")
    .addEventListener("click", function () {
      stopGreedyAlgorithmHandler();
    });

  document
    .getElementById("exportGraphData")
    .addEventListener("click", function () {
      exportGraphData();
    });

  // Setup import button
  setupImportButton();
}

let hasRunCE1 = true;
let hasRunECE = true;
let hasRunCE2 = true;
function draw() {
  //main loop that gets run while the website is running
  clear();
  drawMask();

  if (mode != choosemapmode) {
    // choosemapmode is the first mode (choosing a frame from the map)
    if (showRoads) {
      showEdges();
    }
    if (mode == solveRESmode) {
      for (let it = 0; it < iterationsperframe; it++) {
        iterations++;
        let solutionfound = false;
        let totalDistanceRevised = 0;
        for (let i = 0; i < edges.length; i++) {
          if (edges[i].augmentedEdge == false) {
            // console.log(edges[i]);
            totalDistanceRevised = totalDistanceRevised + edges[i].distance;
          }
        }
        while (!solutionfound) {
          //run randomly down least roads until all roads have been run
          shuffle(currentnode.edges, true);
          // sort edges around node by whether its visited or not, and then number of times traveled, and travel down least.
          currentnode.edges.sort((a, b) => {
            if (a.visited !== b.visited) return a.visited - b.visited;
            return a.travels - b.travels;
          });
          let edgewithleasttravels = currentnode.edges[0];
          let nextNode = edgewithleasttravels.OtherNodeofEdge(currentnode);
          edgewithleasttravels.travels++;
          if (
            !edgewithleasttravels.visited &&
            edgewithleasttravels.travels == 1
          ) {
            edgewithleasttravels.visited = true;
            remainingedges--;
          }
          currentroute.addWaypoint(nextNode, edgewithleasttravels.distance);
          currentnode = nextNode;
          if (remainingedges == 0) {
            //once all edges have been traveled, the route is complete. Work out total distance and see if this route is the best so far.
            solutionfound = true;
            currentroute.distance += calcdistance(
              currentnode.lat,
              currentnode.lon,
              startnode.lat,
              startnode.lon
            );
            if (currentroute.distance < bestdistance) {
              // this latest route is now record
              bestroute = new Route(null, currentroute);
              console.log("bestroute: ", bestroute);
              bestdistance = currentroute.distance;
              if (efficiencyhistory.length > 1) {
                totalefficiencygains +=
                  totalDistanceRevised / bestroute.distance -
                  efficiencyhistory[efficiencyhistory.length - 1];
              }
              efficiencyhistory.push(totalDistanceRevised / bestroute.distance);
              distancehistory.push(bestroute.distance);
            }
            currentnode = startnode;
            remainingedges = edges.filter((e) => !e.visitedOriginal).length;
            currentroute = new Route(currentnode, null);
            resetEdges();
          }
        }
      }
    }
    showNodes();
    if (bestroute != null) {
      bestroute.show();
    }
    if (mode == solveRESmode) {
      drawProgressGraph();
    }
    if (mode == downloadGPXmode) {
      showReportOut();
    }
  }
  // showNodes();
  // showEdges();
  // console.log(mode);

  // Removed automatic algorithm execution - algorithms now only run when explicitly requested via buttons
}

function drawMask() {
  // draw the rectangle on the website
  noFill();
  stroke(0, 0o0, 255, 0.4);
  strokeWeight(2);
  rect(
    windowWidth * margin,
    windowHeight * margin,
    windowWidth * (1 - 2 * margin),
    windowHeight * (1 - 2 * margin)
  );
}

function getOverpassData() {
  //load nodes and edge map data in XML format from OpenStreetMap via the Overpass API
  showMessage("Loading map data…");

  canvas.position(0, 34); // start canvas just below logo image
  bestroute = null;
  totaluniqueroads = 0;

  //get the coordinates current view on the map
  var extent = ol.proj.transformExtent(
    openlayersmap.getView().calculateExtent(openlayersmap.getSize()),
    "EPSG:3857",
    "EPSG:4326"
  );
  // save coordinates to extract overpass data within min and max lat and lon
  mapminlat = extent[1];
  mapminlon = extent[0];
  mapmaxlat = extent[3];
  mapmaxlon = extent[2];
  dataminlat = extent[1] + (extent[3] - extent[1]) * margin;
  dataminlon = extent[0] + (extent[2] - extent[0]) * margin;
  datamaxlat = extent[3] - (extent[3] - extent[1]) * margin;
  datamaxlon = extent[2] - (extent[2] - extent[0]) * margin;

  let OverpassURL = "https://overpass-api.de/api/interpreter?data=";
  let overpassquery =
    "(way({{bbox}})['highway']['highway' !~ 'trunk']['highway' !~ 'motorway']['highway' !~ 'motorway_link']['highway' !~ 'raceway']['highway' !~ 'proposed']['highway' !~ 'construction']['highway' !~ 'service']['highway' !~ 'elevator']['footway' !~ 'crossing']['footway' !~ 'sidewalk']['foot' !~ 'no']['access' !~ 'private']['access' !~ 'no'];node(w)({{bbox}}););out;";
  overpassquery = overpassquery.replaceAll(
    "{{bbox}}",
    dataminlat + "," + dataminlon + "," + datamaxlat + "," + datamaxlon
  );

  //Fetch data from overpass URL
  OverpassURL = OverpassURL + encodeURI(overpassquery);

  httpGet(OverpassURL, "text", false, function (response) {
    console.log("code is going to");
    let OverpassResponse = response;

    var parser = new DOMParser();
    OSMxml = parser.parseFromString(OverpassResponse, "text/xml");
    // parse nodes and edges

    parseUnvisitedNodes(OSMxml);
    parseUnvisitedEdges(OSMxml);
    console.log(nodes);
    nodes.forEach((node) => {
      node.x = map(node.lon, mapminlon, mapmaxlon, 0, mapWidth);
      node.y = map(node.lat, mapminlat, mapmaxlat, mapHeight, 0);
    });
    mode = selectnodemode;
    console.log("code just now went into selectnodemode");
  });
}

function showEdges() {
  let closestedgetomousedist = Infinity;
  for (let i = 0; i < edges.length; i++) {
    // if (!edges[i].visited) {
    edges[i].show();
    // }
    if (mode == trimmode) {
      let dist = edges[i].distanceToPoint(mouseX, mouseY);
      if (dist < closestedgetomousedist) {
        closestedgetomousedist = dist;
        closestedgetomouse = i;
      }
    }
  }
  if (closestedgetomouse >= 0 && !isTouchScreenDevice) {
    edges[closestedgetomouse].highlight();
  }
}

function mousePressed() {
  // clicked on map to select a node
  if (
    mode == choosemapmode &&
    mouseY < btnBRy &&
    mouseY > btnTLy &&
    mouseX > btnTLx &&
    mouseX < btnBRx
  ) {
    // Was in Choose map mode and clicked on button
    getOverpassData(); // gets road data from framed area on map
    mode = loadMapMode;
    return;
  }
  if (mode == selectnodemode && mouseY < mapHeight) {
    // Select node mode, and clicked on map
    showNodes();

    showMessage("Click on roads to trim, then click here");
    removeOrphans();
    mode = trimmode;
    return;
  }

  if (mode == trimmode) {
    showEdges(); // find closest edge
    // implement();
    if (
      mouseY < btnBRy &&
      mouseY > btnTLy &&
      mouseX > btnTLx &&
      mouseX < btnBRx
    ) {
      // clicked on button
      mode = solveRESmode;
      showMessage("Calculating… Click to stop when satisfied");
      console.log("mode is equal to: ", mode);
      showNodes(); // recalculate closest node
      solveRES();
      return;
    } else {
      // Only trim the edge if it's close enough to the mouse cursor
      const DISTANCE_THRESHOLD = 20; // Adjust this value as needed (in pixels)

      if (closestedgetomouse >= 0) {
        let dist = edges[closestedgetomouse].distanceToPoint(mouseX, mouseY);
        if (dist < DISTANCE_THRESHOLD) {
          // Only delete if we're close enough
          trimSelectedEdge();
        }
      }
    }
  }
}

function solveRES() {
  removeOrphans();
  showRoads = false;
  remainingedges = edges.filter((e) => !e.visitedOriginal).length;
  currentroute = new Route(currentnode, null);
  bestroute = new Route(currentnode, null);
  bestdistance = Infinity;
  iterations = 0;
  iterationsperframe = 1;
  starttime = millis();
}

function hideMessage() {
  msgbckDiv.remove();
  msgDiv.remove();
}

function getNodebyId(id) {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].nodeId == id) {
      return nodes[i];
    }
  }
  return null;
}

// this is a section to add all the remaining runEveryStreet code
// ... existing code ...
function showNodes() {
  const HOVER_THRESHOLD = 12; // pixels

  hoveredNode = null; // reset each frame
  let closestnodetomousedist = Infinity;
  let closestHoverDist = Infinity;

  for (let i = 0; i < nodes.length; i++) {
    if (showRoads) nodes[i].show();

    // distance from mouse to this node
    const d = dist(nodes[i].x, nodes[i].y, mouseX, mouseY);

    // 1) generic hover detection (works in every mode)
    if (d < closestHoverDist && d < HOVER_THRESHOLD) {
      closestHoverDist = d;
      hoveredNode = nodes[i];
    }

    // 2) logic used only while selecting the start node
    if (mode == selectnodemode && d < closestnodetomousedist) {
      closestnodetomousedist = d;
      closestnodetomouse = i;
    }
  }

  // handle start-node selection & highlighting
  if (mode == selectnodemode) startnode = nodes[closestnodetomouse];
  if (startnode && (!isTouchScreenDevice || mode != selectnodemode)) {
    startnode.highlight();
  }

  // draw the nodeId label if hovering
  if (hoveredNode) {
    push();
    noStroke();
    fill(0); // black text
    textSize(14);
    textAlign(LEFT, BOTTOM);
    text(hoveredNode.nodeId, hoveredNode.x + 8, hoveredNode.y - 8);
    pop();
  }
}

// Uncaught UsageGraphError: Graph.addUndirectedEdge: an edge linking "29691831" to "1932273593" already exists. If you really want to add multiple edges linking those nodes, you should create a multi graph by using the 'multi' option.
// at addEdge (graphology.js?v=b3a0f1e6:2507:11)
// at Graph.<computed> [as addUndirectedEdge] (graphology.js?v=b3a0f1e6:4490:16)
// at createGraph2 (graphologyConverter.js:24:13)
// at draw (sketch.js:252:25)
// at p5.redraw (p5.js:51956:7)
// at p5.<anonymous> (p5.js:46250:12)

function applyCE1Algorithm() {
  if (!startnode) {
    showMessage("Please select a start node first");
    return;
  }

  if (edges.length === 0) {
    showMessage("No edges loaded. Please load map data first");
    return;
  }

  showMessage("Running CE1 Algorithm...");

  hasRunCE1 = false;

  // Clear previous results
  bestroute = null;
  bestdistance = Infinity;
  efficiencyhistory = [];
  distancehistory = [];

  // Run CE1 algorithm with timing
  setTimeout(() => {
    const startTime = Date.now();

    if (nodes.length > 0 && edges.length > 0) {
      showRoads = true;
      graphologyGraph = createGraph3(nodes, edges);
      implementCE1Algorithm(graphologyGraph);
      hasRunCE1 = true;
    }

    const endTime = Date.now();

    // Create results object for metrics
    const results = {
      bestRoute: bestroute,
      bestDistance: bestdistance,
      iterations: 1, // CE1 runs once
      summary: {
        originalDistance: edges
          .filter((e) => !e.augmentedEdge)
          .reduce((sum, e) => sum + e.distance, 0),
        routeDistance: bestdistance,
        efficiency: bestroute
          ? (
              edges
                .filter((e) => !e.augmentedEdge)
                .reduce((sum, e) => sum + e.distance, 0) / bestdistance
            ).toFixed(3)
          : "N/A",
        waypoints: bestroute ? bestroute.waypoints.length : 0,
      },
    };

    // Record metrics
    recordAlgorithmMetrics("CE1 Algorithm", results, {
      endToEndRuntime: endTime - startTime,
    });

    showMessage(`CE1 Algorithm completed! - View metrics for details`);
  }, 10);
}

function applyECEAlgorithm() {
  if (!startnode) {
    showMessage("Please select a start node first");
    return;
  }

  if (edges.length === 0) {
    showMessage("No edges loaded. Please load map data first");
    return;
  }

  showMessage("Running ECE Algorithm...");

  hasRunECE = false;

  // Clear previous results
  bestroute = null;
  bestdistance = Infinity;
  efficiencyhistory = [];
  distancehistory = [];

  // Run ECE algorithm with timing
  setTimeout(() => {
    const startTime = Date.now();

    if (nodes.length > 0 && edges.length > 0) {
      showRoads = true;
      graphologyGraph = createGraph3(nodes, edges);
      implementECEAlgorithm(graphologyGraph);
      hasRunECE = true;
    }

    const endTime = Date.now();

    // Create results object for metrics
    const results = {
      bestRoute: bestroute,
      bestDistance: bestdistance,
      iterations: 1, // ECE runs once
      summary: {
        originalDistance: edges
          .filter((e) => !e.augmentedEdge)
          .reduce((sum, e) => sum + e.distance, 0),
        routeDistance: bestdistance,
        efficiency: bestroute
          ? (
              edges
                .filter((e) => !e.augmentedEdge)
                .reduce((sum, e) => sum + e.distance, 0) / bestdistance
            ).toFixed(3)
          : "N/A",
        waypoints: bestroute ? bestroute.waypoints.length : 0,
      },
    };

    // Record metrics
    recordAlgorithmMetrics("ECE Algorithm", results, {
      endToEndRuntime: endTime - startTime,
    });

    showMessage(`ECE Algorithm completed! - View metrics for details`);
  }, 10);
}

function applyCE2Algorithm() {
  if (!startnode) {
    showMessage("Please select a start node first");
    return;
  }

  if (edges.length === 0) {
    showMessage("No edges loaded. Please load map data first");
    return;
  }

  showMessage("Running CE2 Algorithm...");

  hasRunCE2 = false;

  // Clear previous results
  bestroute = null;
  bestdistance = Infinity;
  efficiencyhistory = [];
  distancehistory = [];

  // Run CE2 algorithm with timing
  setTimeout(() => {
    const startTime = Date.now();

    if (nodes.length > 0 && edges.length > 0) {
      showRoads = true;
      graphologyGraph = createGraph3(nodes, edges);
      implementCE2Algorithm(graphologyGraph);
      hasRunCE2 = true;
    }

    const endTime = Date.now();

    // Create results object for metrics
    const results = {
      bestRoute: bestroute,
      bestDistance: bestdistance,
      iterations: 1, // CE2 runs once
      summary: {
        originalDistance: edges
          .filter((e) => !e.augmentedEdge)
          .reduce((sum, e) => sum + e.distance, 0),
        routeDistance: bestdistance,
        efficiency: bestroute
          ? (
              edges
                .filter((e) => !e.augmentedEdge)
                .reduce((sum, e) => sum + e.distance, 0) / bestdistance
            ).toFixed(3)
          : "N/A",
        waypoints: bestroute ? bestroute.waypoints.length : 0,
      },
    };

    // Record metrics
    recordAlgorithmMetrics("CE2 Algorithm", results, {
      endToEndRuntime: endTime - startTime,
    });

    showMessage(`CE2 Algorithm completed! - View metrics for details`);
  }, 10);
}

function applyGreedyAlgorithm() {
  if (!startnode) {
    showMessage("Please select a start node first");
    return;
  }

  if (edges.length === 0) {
    showMessage("No edges loaded. Please load map data first");
    return;
  }

  // Show stop button and hide start button
  document.getElementById("applyGreedyAlgorithm").style.display = "none";
  document.getElementById("stopGreedyAlgorithm").style.display = "block";

  showMessage("Running Greedy Algorithm... (Click Stop to interrupt)");

  // Clear previous results
  bestroute = null;
  bestdistance = Infinity;
  efficiencyhistory = [];
  distancehistory = [];

  // Run the greedy algorithm with default 1000 iterations
  setTimeout(() => {
    const startTime = Date.now();
    const results = implementGreedyAlgorithm(startnode, 500000);
    const endTime = Date.now();

    // Reset button visibility
    document.getElementById("applyGreedyAlgorithm").style.display = "block";
    document.getElementById("stopGreedyAlgorithm").style.display = "none";

    if (results && results.bestRoute) {
      bestroute = results.bestRoute;
      bestdistance = results.bestDistance;
      efficiencyhistory = results.efficiencyHistory;
      distancehistory = results.distanceHistory;

      // Record metrics
      recordAlgorithmMetrics("Greedy Algorithm", results, {
        endToEndRuntime: endTime - startTime,
      });

      showMessage(
        `Greedy Algorithm completed! Best distance: ${results.bestDistance.toFixed(
          2
        )}m, Efficiency: ${
          results.summary.efficiency
        } - View metrics for details`
      );
    } else {
      showMessage("Greedy Algorithm failed to find a solution");
    }
  }, 10); // Small delay to allow UI update
}

function stopGreedyAlgorithmHandler() {
  const stopped = stopGreedyAlgorithm();
  if (stopped) {
    showMessage("Greedy Algorithm stopping...");
    // Reset button visibility
    document.getElementById("applyGreedyAlgorithm").style.display = "block";
    document.getElementById("stopGreedyAlgorithm").style.display = "none";
  }
}

// Export function - called when export button is clicked
function exportGraphData() {
  if (!startnode) {
    console.log("No start node selected. Cannot export data.");
    showMessage("Please select a start node before exporting graph data.");
    return;
  }

  const graphData = {
    startNode: {
      id: startnode.nodeId,
      lat: startnode.lat,
      lon: startnode.lon,
      edgeCount: startnode.edges.length,
    },
    allNodes: nodes.map((node) => ({
      id: node.nodeId,
      lat: node.lat,
      lon: node.lon,
      edgeCount: node.edges.length,
      visited: node.visited,
      visitedOriginal: node.visitedOriginal,
    })),
    allEdges: edges.map((edge) => ({
      wayid: edge.wayid,
      from: edge.from.nodeId,
      to: edge.to.nodeId,
      distance: edge.distance,
      travels: edge.travels,
      visited: edge.visited,
      visitedOriginal: edge.visitedOriginal,
      augmentedEdge: edge.augmentedEdge,
    })),
    metadata: {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      startNodeId: startnode.nodeId,
      timestamp: new Date().toISOString(),
      exportVersion: "1.0",
    },
  };

  // Log to console
  console.log("Graph Data Exported:", graphData);

  // Store in global variable
  window.extractedGraphData = graphData;

  // Auto-download the file
  const dataStr = JSON.stringify(graphData, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `graph_data_${new Date()
    .toISOString()
    .slice(0, 19)
    .replace(/:/g, "-")}.json`;
  a.click();
  URL.revokeObjectURL(url);

  // Show success message
  showMessage(`Graph data exported successfully! File: ${a.download}`);
}

// Import function - called when import button is clicked
function importGraphData(jsonData) {
  try {
    const data = typeof jsonData === "string" ? JSON.parse(jsonData) : jsonData;

    // Validate the imported data structure
    if (!data.allNodes || !data.allEdges || !data.metadata) {
      throw new Error("Invalid graph data format");
    }

    // Clear existing data
    nodes.length = 0;
    edges.length = 0;

    // Reset global variables
    totalEdgeDistance = 0;
    totalVisitedEdgeDistance = 0;

    // Import nodes
    data.allNodes.forEach((nodeData) => {
      const node = new Node1(nodeData.id, nodeData.lat, nodeData.lon);
      node.visited = nodeData.visited || false;
      node.visitedOriginal = nodeData.visitedOriginal || false;
      nodes.push(node);
    });

    // Import edges and establish proper node-edge connections
    data.allEdges.forEach((edgeData) => {
      const fromNode = nodes.find((n) => n.nodeId === edgeData.from);
      const toNode = nodes.find((n) => n.nodeId === edgeData.to);

      if (fromNode && toNode) {
        const edge = new Edge(fromNode, toNode, edgeData.wayid);
        edge.travels = edgeData.travels || 0;
        edge.visited = edgeData.visited || false;
        edge.visitedOriginal = edgeData.visitedOriginal || false;
        edge.augmentedEdge = edgeData.augmentedEdge || false;

        // Establish bidirectional node-edge connections (critical for algorithms)
        if (!fromNode.edges.includes(edge)) {
          fromNode.edges.push(edge);
        }
        if (!toNode.edges.includes(edge)) {
          toNode.edges.push(edge);
        }

        edges.push(edge);
        totalEdgeDistance += edge.distance;
      }
    });

    // Update global variables
    numnodes = nodes.length;
    numways = edges.length;

    // Update map bounds if needed
    updateMapBounds();

    // Set coordinate mapping for nodes (required for GUI display)
    if (nodes.length > 0) {
      // Calculate bounds from imported nodes
      let minLat = Math.min(...nodes.map((n) => n.lat));
      let maxLat = Math.max(...nodes.map((n) => n.lat));
      let minLon = Math.min(...nodes.map((n) => n.lon));
      let maxLon = Math.max(...nodes.map((n) => n.lon));

      // Map node coordinates to pixel coordinates
      nodes.forEach((node) => {
        node.x = map(node.lon, minLon, maxLon, 0, mapWidth);
        node.y = map(node.lat, minLat, maxLat, mapHeight, 0);
      });
    }

    // Set start node from exported data (if available) or default to first node
    if (data.startNode && data.startNode.id) {
      const savedStartNode = nodes.find((n) => n.nodeId === data.startNode.id);
      startnode = savedStartNode || nodes[0];
      console.log(`Restored original start node: ${startnode.nodeId}`);
    } else {
      startnode = nodes[0];
      console.log(
        `No saved start node found, using first node: ${startnode.nodeId}`
      );
    }

    // Set current node for algorithms
    if (startnode) {
      currentnode = startnode;
    }

    // Reset algorithm state variables
    bestroute = null;
    bestdistance = Infinity;
    iterations = 0;

    // Reset edge states for algorithms
    resetEdges();

    // Switch back to choose map mode
    mode = choosemapmode;

    console.log(
      `Successfully imported graph with ${nodes.length} nodes and ${edges.length} edges`
    );
    console.log(`Total edge distance: ${totalEdgeDistance}`);
    console.log(`Start node set to: ${startnode ? startnode.nodeId : "null"}`);
    console.log(
      `Sample node edges count: ${nodes[0] ? nodes[0].edges.length : "N/A"}`
    );

    showMessage(
      `Graph imported successfully! ${nodes.length} nodes, ${edges.length} edges`
    );

    return true;
  } catch (error) {
    console.error("Error importing graph data:", error);
    showMessage(`Import failed: ${error.message}`);
    return false;
  }
}

// Helper function to update map bounds after import
function updateMapBounds() {
  if (nodes.length > 0) {
    minlat = Math.min(...nodes.map((n) => n.lat));
    maxlat = Math.max(...nodes.map((n) => n.lat));
    minlon = Math.min(...nodes.map((n) => n.lon));
    maxlon = Math.max(...nodes.map((n) => n.lon));

    mapminlat = minlat;
    mapmaxlat = maxlat;
    mapminlon = minlon;
    mapmaxlon = maxlon;
  }
}

// Setup import button functionality
function setupImportButton() {
  const importBtn = document.getElementById("importGraphData");
  if (importBtn) {
    importBtn.addEventListener("click", () => {
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = ".json";
      fileInput.style.display = "none";

      fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            importGraphData(e.target.result);
          };
          reader.readAsText(file);
        }
      };

      document.body.appendChild(fileInput);
      fileInput.click();
      document.body.removeChild(fileInput);
    });
  }
}
