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
let graphologyGraph;
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

let hasRun = false;
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
  // console.log(mode);
  if (nodes.length > 0 && edges.length > 0) {
    if (!hasRun) {
      implementAlgorithm();
      hasRun = true;
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
    let graphologyGraph = createGraph2(nodes, edges);
    console.log(
      "This is the graphology graph from the unvisited edges: ",
      graphologyGraph
    );
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
  }
  if (startnode != null && (!isTouchScreenDevice || mode != selectnodemode)) {
    startnode.highlight();
  }
}

function runtests() {
  console.log("this is a test");
}
runtests();
