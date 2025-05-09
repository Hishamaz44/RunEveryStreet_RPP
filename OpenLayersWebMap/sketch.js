var openlayersmap = new ol.Map({
  target: "map",
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM(),
      opacity: 0.5,
    }),
  ],
  view: new ol.View({
    center: ol.proj.fromLonLat([10.333, 51.81]), // centers on clausthal
    zoom: 14,
  }),
});

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
var selectnodemode = 1,
  // solveRESmode = 2,
  choosemapmode = 3,
  trimmode = 4;
// downloadGPXmode = 5;
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
var isTouchScreenDevice = false;
var totaluniqueroads;
var visitedEdges = [];
var visitedNodes = [];
var totalVisitedEdgeDistance = 0;

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
  margin = 0.1;
  showMessage("Zoom to selected area, then click here");

  // Load GPX files (AI Generated code)
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
}

function draw() {
  //main loop that gets run while the website is running
  if (touches.length > 0) {
    isTouchScreenDevice = true;
  }
  clear();
  drawMask();
  if (mode != choosemapmode) {
    // choosemapmode is the first mode (choosing a frame from the map)
    if (showRoads) {
      showEdges();
    }
  }
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
    let OverpassResponse = response;
    var parser = new DOMParser();
    OSMxml = parser.parseFromString(OverpassResponse, "text/xml");
    // parse nodes and edges
    parseUnvisitedNodes(OSMxml);
    parseUnvisitedEdges(OSMxml);
    console.log("nodes: ", nodes);
    console.log("edges: ", edges);
    mode = selectnodemode;
    showMessage("mode is selectnodemode");
  });
}

function showMessage(msg) {
  if (msgDiv) {
    hideMessage();
  }
  let ypos = 20;
  let btnwidth = 320;
  msgbckDiv = createDiv("");
  msgbckDiv.style("position", "fixed");
  msgbckDiv.style("width", btnwidth + "px");
  msgbckDiv.style("top", ypos + 45 + "px");
  msgbckDiv.style("left", "50%");
  msgbckDiv.style("background", "black");
  msgbckDiv.style("opacity", "0.3");
  msgbckDiv.style("-webkit-transform", "translate(-50%, -50%)");
  msgbckDiv.style("transform", "translate(-50%, -50%)");
  msgbckDiv.style("height", "30px");
  msgbckDiv.style("border-radius", "7px");
  msgDiv = createDiv("");
  msgDiv.style("position", "fixed");
  msgDiv.style("width", btnwidth + "px");
  msgDiv.style("top", ypos + 57 + "px");
  msgDiv.style("left", "50%");
  msgDiv.style("color", "white");
  msgDiv.style("background", "none");
  msgDiv.style("opacity", "1");
  msgDiv.style("-webkit-transform", "translate(-50%, -50%)");
  msgDiv.style("transform", "translate(-50%, -50%)");
  msgDiv.style(
    "font-family",
    '"Lucida Sans Unicode", "Lucida Grande", sans-serif'
  );
  msgDiv.style("font-size", "16px");
  msgDiv.style("text-align", "center");
  msgDiv.style("vertical-align", "middle");
  msgDiv.style("height", "50px");
  msgDiv.html(msg);
  btnTLx = windowWidth / 2 - 200; // area that is touch/click sensitive
  btnTLy = ypos - 4;
  btnBRx = btnTLx + 400;
  btnBRy = btnTLy + 32;
}

function showEdges() {
  let closestedgetomousedist = Infinity;
  for (let i = 0; i < edges.length; i++) {
    edges[i].show();
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
    mode = selectnodemode;
    return;
  }
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

function getVisitedNodebyId(id) {
  for (let i = 0; i < visitedNodes.length; i++) {
    if (visitedNodes[i].nodeId == id) {
      return visitedNodes[i];
    }
  }
  return null;
}

function getNodebyIdFromBoth(id) {
  // First check in visited nodes
  for (let i = 0; i < visitedNodes.length; i++) {
    if (visitedNodes[i].nodeId == id) {
      return visitedNodes[i];
    }
  }
  // Then check in unvisited nodes
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].nodeId == id) {
      return nodes[i];
    }
  }
  return null;
}

function calcdistance(lat1, long1, lat2, long2) {
  lat1 = radians(lat1);
  long1 = radians(long1);
  lat2 = radians(lat2);
  long2 = radians(long2);
  return (
    2 *
    asin(
      sqrt(
        pow(sin((lat2 - lat1) / 2), 2) +
          cos(lat1) * cos(lat2) * pow(sin((long2 - long1) / 2), 2)
      )
    ) *
    6371.0
  );
}

// AI generated code

function loadGPX(file) {
  let reader = new FileReader();
  reader.onload = function (e) {
    let parser = new DOMParser();
    let gpxData = parser.parseFromString(e.target.result, "text/xml");
    let gpxPoints = gpxData.getElementsByTagName("trkpt");
    let gpxCoordinates = [];
    // Parse GPX nodes
    for (let i = 0; i < gpxPoints.length; i++) {
      let lat = gpxPoints[i].getAttribute("lat");
      let lon = gpxPoints[i].getAttribute("lon");
      gpxCoordinates.push([lat, lon]);
    }
    gpxToOverpass(gpxCoordinates);
  };
  reader.readAsText(file);
}

function gpxToOverpass(gpxCoordinates) {
  let overpassEndpoint = "https://overpass-api.de/api/interpreter?data=";
  let data;
  const constructQuery = (gpxCoordinates) => {
    let nodeQueries = gpxCoordinates.map(
      ([lat, lon]) => `node(around:0.1,${lat},${lon});`
    );
    return `
		[out:xml];
		(${nodeQueries.join("\n")});
		out body;
		(
      way(bn)['highway']
        ['highway' !~ 'trunk|motorway|motorway_link|raceway|proposed|construction|service|elevator']
        ['footway' !~ 'crossing|sidewalk']
        ['foot' !~ 'no']
        ['access' !~ 'private|no'];
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
    newData = parser.parseFromString(data, "text/xml");
    // displayGPXTrack(newData);
    updateVisitedPaths(newData);
  }
  fetchNodeAndEdges();
}

function updateVisitedPaths(data) {
  parseVisitedNodes(data);
  parseVisitedEdges(data);
  console.log("visited_nodes: ", visitedNodes);
  console.log("visited_edges: ", visitedEdges);

  // AI Generated code
  const vectorSource = new ol.source.Vector();
  const vectorLayer = new ol.layer.Vector({ source: vectorSource });
  openlayersmap.addLayer(vectorLayer);
  displayGPXTrack(visitedNodes, visitedEdges);
}

function parseVisitedNodes(data) {
  var XMLnodes = data.getElementsByTagName("node");
  numnodes = XMLnodes.length;
  for (let i = 0; i < numnodes; i++) {
    var lat = XMLnodes[i].getAttribute("lat");
    var lon = XMLnodes[i].getAttribute("lon");
    var nodeid = XMLnodes[i].getAttribute("id");
    let id = parseInt(nodeid);
    let node = new Node1(id, lat, lon);
    checkNodeDuplicate(visitedNodes, node);
  }
}
function parseUnvisitedNodes(data) {
  var XMLnodes = data.getElementsByTagName("node");
  numnodes = XMLnodes.length;
  let idSet;
  if (visitedNodes.length > 0) {
    idSet = buildNodeSet(visitedNodes);
  }
  for (let i = 0; i < numnodes; i++) {
    var lat = XMLnodes[i].getAttribute("lat");
    var lon = XMLnodes[i].getAttribute("lon");
    var nodeid = XMLnodes[i].getAttribute("id");
    let id = parseInt(nodeid);
    let node = new Node1(id, lat, lon);
    if (visitedNodes.length > 0) {
      integrateNodes(node, idSet);
    } else {
      nodes.push(node);
    }
  }
}

function integrateNodes(node, idSetNodes) {
  const exists = idSetNodes.has(node.nodeId);
  if (!exists) {
    nodes.push(node);
  }
}

function buildNodeSet(array) {
  const idSet = new Set(array.map((o) => o.nodeId));
  console.log("this is build node set: ", idSet);
  return idSet;
}

function parseVisitedEdges(data) {
  var XMLways = data.getElementsByTagName("way");
  numways = XMLways.length;
  //parse ways into edges
  for (let i = 0; i < numways; i++) {
    let wayid = XMLways[i].getAttribute("id");
    let nodesinsideway = XMLways[i].getElementsByTagName("nd");
    for (let j = 0; j < nodesinsideway.length - 1; j++) {
      let fromnode = getVisitedNodebyId(nodesinsideway[j].getAttribute("ref"));
      let tonode = getVisitedNodebyId(
        nodesinsideway[j + 1].getAttribute("ref")
      );
      if ((fromnode != null) & (tonode != null)) {
        let newEdge = new Edge(fromnode, tonode, wayid);
        checkEdgeDuplicate(visitedEdges, newEdge);
      }
    }
  }
}
function parseUnvisitedEdges(data) {
  var XMLways = data.getElementsByTagName("way");
  numways = XMLways.length;
  //parse ways into edges
  for (let i = 0; i < numways; i++) {
    let wayid = XMLways[i].getAttribute("id");
    let nodesinsideway = XMLways[i].getElementsByTagName("nd");
    for (let j = 0; j < nodesinsideway.length - 1; j++) {
      let fromnode = getNodebyIdFromBoth(nodesinsideway[j].getAttribute("ref"));
      let tonode = getNodebyIdFromBoth(
        nodesinsideway[j + 1].getAttribute("ref")
      );
      if ((fromnode != null) & (tonode != null)) {
        let newEdge = new Edge(fromnode, tonode, wayid);
        if (visitedEdges.length > 0) {
          integrateEdges(newEdge, visitedEdges);
        } else {
          edges.push(newEdge);
          totalEdgeDistance += newEdge.distance;
        }
      }
    }
  }
}

function integrateEdges(newEdge, visitedEdges) {
  let isDuplicateEdge = false;
  const exists = visitedEdges.find((obj) => {
    if (obj.wayid === newEdge.wayid) {
      if (
        (obj.from.nodeId === newEdge.from.nodeId &&
          obj.to.nodeId === newEdge.to.nodeId) ||
        (obj.from.nodeId === newEdge.to.nodeId &&
          obj.to.nodeId === newEdge.from.nodeId)
      ) {
        isDuplicateEdge = true;
      }
    }
  });
  const existsInUnvisited = edges.find((obj) => {
    if (obj.wayid === newEdge.wayid) {
      if (
        (obj.from.nodeId === newEdge.from.nodeId &&
          obj.to.nodeId === newEdge.to.nodeId) ||
        (obj.from.nodeId === newEdge.to.nodeId &&
          obj.to.nodeId === newEdge.from.nodeId)
      ) {
        isDuplicateEdge = true;
      }
    }
  });

  if (!isDuplicateEdge) {
    edges.push(newEdge);
    totalEdgeDistance += newEdge.distance;
  }
}

function checkNodeDuplicate(visitedNodes, node) {
  let isDuplicateNode = false;
  for (let i = 0; i < visitedNodes.length; i++) {
    if (visitedNodes[i].nodeId === node.nodeId) {
      isDuplicateNode = true;
      break;
    }
  }
  if (!isDuplicateNode) {
    visitedNodes.push(node);
  }
}

function checkEdgeDuplicate(visitedEdges, newEdge) {
  let isDuplicateEdge = false;
  for (let i = 0; i < visitedEdges.length; i++) {
    if (visitedEdges[i].wayid === newEdge.wayid) {
      if (
        visitedEdges[i].from.nodeId === newEdge.from.nodeId &&
        visitedEdges[i].to.nodeId === newEdge.to.nodeId
      ) {
        isDuplicateEdge = true;
        break;
      }
    }
  }
  if (!isDuplicateEdge) {
    visitedEdges.push(newEdge);
    totalVisitedEdgeDistance += newEdge.distance;
  }
}

// AI Generated code
function displayGPXTrack(visitedNodes, visitedEdges) {
  const vectorSource = new ol.source.Vector();
  const vectorLayer = new ol.layer.Vector({ source: vectorSource });
  openlayersmap.addLayer(vectorLayer);

  visitedNodes.forEach((element) => {
    const feature = new ol.Feature({
      geometry: new ol.geom.Point(
        ol.proj.fromLonLat([element.lon, element.lat])
      ),
    });
    vectorSource.addFeature(feature);
  });

  visitedEdges.forEach((e) => {
    const fromCoord = ol.proj.fromLonLat([e.from.lon, e.from.lat]);
    const toCoord = ol.proj.fromLonLat([e.to.lon, e.to.lat]);
    const feature = new ol.Feature({
      geometry: new ol.geom.LineString([fromCoord, toCoord]),
    });
    vectorSource.addFeature(feature);
  });
}

// function connectVisitedToUnvisited(){
//   for (let i = 0; i < visitedEdges.length; i++) {
//     wayid = visitedEdges[i].wayid
//     if(visitedEdges[i].fromnode)
//   }
// }

//This is an AI generated code to check for duplicates

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

// End of AI Generated code
