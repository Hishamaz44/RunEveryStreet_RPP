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
  // if (touches.length > 0) {
  //   isTouchScreenDevice = true;
  // }
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
                  totalEdgeDistance / bestroute.distance -
                  efficiencyhistory[efficiencyhistory.length - 1];
              }
              efficiencyhistory.push(totalEdgeDistance / bestroute.distance);
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
  console.log(mode);
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
    nodes.forEach((node) => {
      node.x = map(node.lon, mapminlon, mapmaxlon, 0, mapWidth);
      node.y = map(node.lat, mapminlat, mapmaxlat, mapHeight, 0);
    });
    mode = selectnodemode;
    console.log("code just now went into selectnodemode");
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
    if (!edges[i].visited) {
      edges[i].show();
    }
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
      // clicked on edge to remove it
      trimSelectedEdge();
      console.log("nodes: ", nodes);
      console.log("edges: ", edges);
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
// this is a section to add all the remaining runEveryStreet code
function showNodes() {
  let closestnodetomousedist = Infinity;

  for (let i = 0; i < nodes.length; i++) {
    if (showRoads) {
      nodes[i].show();
    }
    if (mode == selectnodemode) {
      disttoMouse = dist(nodes[i].x, nodes[i].y, mouseX, mouseY);
      // console.log("distancetomouse", disttoMouse);
      if (disttoMouse < closestnodetomousedist) {
        closestnodetomousedist = disttoMouse;
        closestnodetomouse = i;
      }
    }
  }
  if (mode == selectnodemode) {
    startnode = nodes[closestnodetomouse];
    // console.log("closestnodetomousedist: ", closestnodetomousedist);
    // console.log("closestnodetomouse: ", closestnodetomouse);
    // console.log("startnode: ", startnode);
  }
  if (startnode != null && (!isTouchScreenDevice || mode != selectnodemode)) {
    startnode.highlight();
  }
}

function removeOrphans() {
  // remove unreachable nodes and edges
  resetEdges();
  if (startnode) {
    currentnode = startnode;
  }
  floodfill(currentnode, 1); // recursively walk every unwalked route until all connected nodes have been reached at least once, then remove unwalked ones.
  let newedges = [];
  let newnodes = [];
  totalEdgeDistance = 0;
  for (let i = 0; i < edges.length; i++) {
    if (edges[i].travels > 0) {
      newedges.push(edges[i]);
      totalEdgeDistance += edges[i].distance;
      if (!newnodes.includes(edges[i].from)) {
        newnodes.push(edges[i].from);
      }
      if (!newnodes.includes(edges[i].to)) {
        newnodes.push(edges[i].to);
      }
    }
  }
  edges = newedges;
  nodes = newnodes;
  resetEdges();
}

function floodfill(node, stepssofar) {
  for (let i = 0; i < node.edges.length; i++) {
    if (node.edges[i].travels == 0) {
      node.edges[i].travels = stepssofar;
      floodfill(node.edges[i].OtherNodeofEdge(node), stepssofar + 1);
    }
  }
}

function resetEdges() {
  for (let i = 0; i < edges.length; i++) {
    edges[i].travels = 0;
    edges[i].visited = edges[i].visitedOriginal;
  }
}

function trimSelectedEdge() {
  if (closestedgetomouse >= 0) {
    let edgetodelete = edges[closestedgetomouse];
    edges.splice(
      edges.findIndex((element) => element == edgetodelete),
      1
    );
    for (let i = 0; i < nodes.length; i++) {
      // remove references to the deleted edge from within each of the nodes
      if (nodes[i].edges.includes(edgetodelete)) {
        nodes[i].edges.splice(
          nodes[i].edges.findIndex((element) => element == edgetodelete),
          1
        );
      }
    }
    removeOrphans(); // deletes parts of the network that no longer can be reached.
    closestedgetomouse = -1;
  }
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
    // 1. Flatten GPX into a polyline string
    const lineCoords = gpxCoordinates
      .map(([lat, lon]) => `${lat},${lon}`)
      .join(",");

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
    newData = parser.parseFromString(data, "text/xml");
    console.log("newData: ", newData);
    // displayGPXTrack(newData);
    updateVisitedPaths(newData);
  }
  fetchNodeAndEdges();
}

function updateVisitedPaths(data) {
  parseVisitedNodes(data);
  parseVisitedEdges(data);
  nodes = removeUnnecesarryNodes(nodes);
  console.log("nodes: ", nodes);
  console.log("edges: ", edges);
  // AI Generated code
  const vectorSource = new ol.source.Vector();
  const vectorLayer = new ol.layer.Vector({ source: vectorSource });
  openlayersmap.addLayer(vectorLayer);
  displayGPXTrack(nodes, edges);
}

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
    node.visited = true;
    node.visitedOriginal = true;
    checkNodeDuplicate(nodes, node);
  }
}

function removeUnnecesarryNodes(nodes) {
  //This function removes nodes that are not connected to any edges
  let newNodes = [];
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].edges.length > 0) {
      newNodes.push(nodes[i]);
    }
  }
  return newNodes;
}
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
        newEdge.visited = true;
        newEdge.visitedOriginal = true;
        checkEdgeDuplicate(edges, newEdge);
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
      let fromnode = getNodebyId(nodesinsideway[j].getAttribute("ref"));
      let tonode = getNodebyId(nodesinsideway[j + 1].getAttribute("ref"));
      if ((fromnode != null) & (tonode != null)) {
        let newEdge = new Edge(fromnode, tonode, wayid);
        integrateEdges(newEdge);
      }
    }
  }
}

function integrateEdges(newEdge) {
  let isDuplicateEdge = false;

  const existingEdge = edges.find((obj) => {
    if (obj.wayid === newEdge.wayid) {
      if (
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

function checkEdgeDuplicate(edges, newEdge) {
  let isDuplicateEdge = false;
  for (let i = 0; i < edges.length; i++) {
    if (edges[i].wayid === newEdge.wayid) {
      if (
        edges[i].from.nodeId === newEdge.from.nodeId &&
        edges[i].to.nodeId === newEdge.to.nodeId
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

// AI Generated code

function displayGPXTrack(visitedNodes, visitedEdges) {
  const vectorSource = new ol.source.Vector();
  const vectorLayer = new ol.layer.Vector({ source: vectorSource });
  openlayersmap.addLayer(vectorLayer);

  // Only show nodes that are connected to visited edges
  const nodesWithVisitedEdges = new Set();
  visitedEdges.forEach((e) => {
    if (e.visited) {
      nodesWithVisitedEdges.add(e.from.nodeId);
      nodesWithVisitedEdges.add(e.to.nodeId);
    }
  });

  // Only add nodes that are part of visited edges
  visitedNodes.forEach((node) => {
    if (nodesWithVisitedEdges.has(node.nodeId)) {
      const feature = new ol.Feature({
        geometry: new ol.geom.Point(ol.proj.fromLonLat([node.lon, node.lat])),
      });
      vectorSource.addFeature(feature);
    }
  });

  // Only show edges that are marked as visited
  visitedEdges.forEach((e) => {
    if (e.visited) {
      const fromCoord = ol.proj.fromLonLat([e.from.lon, e.from.lat]);
      const toCoord = ol.proj.fromLonLat([e.to.lon, e.to.lat]);
      const feature = new ol.Feature({
        geometry: new ol.geom.LineString([fromCoord, toCoord]),
      });

      // Optional: You can style visited edges differently
      feature.setStyle(
        new ol.style.Style({
          stroke: new ol.style.Stroke({
            color: "blue",
            width: 3,
          }),
        })
      );

      vectorSource.addFeature(feature);
    }
  });
}

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

function positionMap(minlon_, minlat_, maxlon_, maxlat_) {
  extent = [minlon_, minlat_, maxlon_, maxlat_];
  //try to fit the map to these coordinates
  openlayersmap
    .getView()
    .fit(
      ol.proj.transformExtent(extent, "EPSG:4326", "EPSG:3857"),
      openlayersmap.getSize()
    );
  //capture the exact coverage of the map after fitting
  var extent = ol.proj.transformExtent(
    openlayersmap.getView().calculateExtent(openlayersmap.getSize()),
    "EPSG:3857",
    "EPSG:4326"
  );
  mapminlat = extent[1];
  mapminlon = extent[0];
  mapmaxlat = extent[3];
  mapmaxlon = extent[2];
}

function drawProgressGraph() {
  if (efficiencyhistory.length > 0) {
    noStroke();
    fill(0, 0, 0, 0.3);
    let graphHeight = 100;
    rect(0, height - graphHeight, windowWidth, graphHeight);
    fill(0, 5, 225, 255);
    textAlign(LEFT);
    textSize(12);
    text(
      "Routes tried: " +
        iterations.toLocaleString() +
        ", Length of all roads: " +
        nf(totalEdgeDistance, 0, 1) +
        "km, Best route: " +
        nf(bestroute.distance, 0, 1) +
        "km (" +
        round(efficiencyhistory[efficiencyhistory.length - 1] * 100) +
        "%)",
      15,
      height - graphHeight + 18
    );
    textAlign(CENTER);
    textSize(12);
    for (let i = 0; i < efficiencyhistory.length; i++) {
      fill((i * 128) / efficiencyhistory.length, 255, 205, 1);
      let startx = map(i, 0, efficiencyhistory.length, 0, windowWidth);
      let starty = height - graphHeight * efficiencyhistory[i];
      rect(
        startx,
        starty,
        windowWidth / efficiencyhistory.length,
        graphHeight * efficiencyhistory[i]
      );
      fill(0, 5, 0);
      text(
        round(distancehistory[i]) + "km",
        startx + windowWidth / efficiencyhistory.length / 2,
        height - 5
      );
    }
  }
}
