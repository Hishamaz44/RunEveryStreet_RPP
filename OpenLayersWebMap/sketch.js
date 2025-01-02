var openlayersmap = new ol.Map({
	target: 'map',
	layers: [
		new ol.layer.Tile({
			source: new ol.source.OSM(),
			opacity: 0.5
		})
	],
	view: new ol.View({
		center: ol.proj.fromLonLat([10.333,51.81]), // centers on clausthal
		zoom: 14
	})
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
var totaledgedistance = 0;
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
var msgbckDiv, msgDiv, reportbckDiv,reportmsgDiv;
var margin;
var btnTLx, btnTLy, btnBRx, btnBRy; // button's top left and bottom right x and y coordinates.
var starttime;
var efficiencyhistory = [],
	distancehistory = [];
var totalefficiencygains = 0;
var isTouchScreenDevice = false;
var totaluniqueroads;



function setup() { // This code snippet initializes the values
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            openlayersmap.getView().setCenter(ol.proj.fromLonLat([position.coords.longitude, position.coords.latitude]))
        })
    }
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
    

    loadgpx()
}

function draw(){ //main loop that gets run while the website is running
    if (touches.length > 0) {
        isTouchScreenDevice = true;
    }
    clear();
    drawMask();         
    if (mode != choosemapmode) { // choosemapmode is the first mode (choosing a frame from the map)
        if (showRoads) {
            showEdges();
        }
    }
}

function drawMask(){  // draw the rectangle on the website
    noFill();
    stroke(0, 0o0, 255, 0.4);
    strokeWeight(2);
    rect(windowWidth * margin, windowHeight * margin, windowWidth * (1 - 2 * margin), windowHeight * (1 - 2 * margin));
}

subsetEdges = [];

function getOverpassData() { //load nodes and edge map data in XML format from OpenStreetMap via the Overpass API
	showMessage("Loading map data…");
	canvas.position(0, 34); // start canvas just below logo image
	bestroute = null;
	totaluniqueroads=0;
	var extent = ol.proj.transformExtent(openlayersmap.getView().calculateExtent(openlayersmap.getSize()), 'EPSG:3857', 'EPSG:4326'); //get the coordinates current view on the map
	mapminlat = extent[1];
	mapminlon = extent[0];
	mapmaxlat = extent[3];
	mapmaxlon = extent[2]; //51.62354589659512,0.3054885475158691,51.635853268644496,0.33291145248413084
	dataminlat = extent[1] + (extent[3] - extent[1]) * margin; //51.62662273960746,0.31234427375793455,51.63277642563215,0.3260557262420654
	dataminlon = extent[0] + (extent[2] - extent[0]) * margin;
	datamaxlat = extent[3] - (extent[3] - extent[1]) * margin;
	datamaxlon = extent[2] - (extent[2] - extent[0]) * margin;
	let OverpassURL = "https://overpass-api.de/api/interpreter?data=";
	let overpassquery = "(way({{bbox}})['highway']['highway' !~ 'trunk']['highway' !~ 'motorway']['highway' !~ 'motorway_link']['highway' !~ 'raceway']['highway' !~ 'proposed']['highway' !~ 'construction']['highway' !~ 'service']['highway' !~ 'elevator']['footway' !~ 'crossing']['footway' !~ 'sidewalk']['foot' !~ 'no']['access' !~ 'private']['access' !~ 'no'];node(w)({{bbox}}););out;";

	overpassquery = overpassquery.replace("{{bbox}}", dataminlat + "," + dataminlon + "," + datamaxlat + "," + datamaxlon);
	overpassquery = overpassquery.replace("{{bbox}}", dataminlat + "," + dataminlon + "," + datamaxlat + "," + datamaxlon);
	OverpassURL = OverpassURL + encodeURI(overpassquery);
	httpGet(OverpassURL, 'text', false, function (response) {
		let OverpassResponse = response;
		var parser = new DOMParser();
		OSMxml = parser.parseFromString(OverpassResponse, "text/xml");
		console.log(OSMxml);

		var XMLnodes = OSMxml.getElementsByTagName("node")
		var XMLways = OSMxml.getElementsByTagName("way")
        console.log(XMLways);
		numnodes = XMLnodes.length;
		numways = XMLways.length;
		for (let i = 0; i < numnodes; i++) {
			var lat = XMLnodes[i].getAttribute('lat');
			var lon = XMLnodes[i].getAttribute('lon');
			minlat = min(minlat, lat);
			maxlat = max(maxlat, lat);
			minlon = min(minlon, lon);
			maxlon = max(maxlon, lon);
		}
		nodes = [];
		edges = [];
		for (let i = 0; i < numnodes; i++) {
			var lat = XMLnodes[i].getAttribute('lat');
			var lon = XMLnodes[i].getAttribute('lon');
			var nodeid = XMLnodes[i].getAttribute('id');
			let node = new Node1(nodeid, lat, lon);
			nodes.push(node);
		}
		//parse ways into edges
		for (let i = 0; i < numways; i++) {
			let wayid = XMLways[i].getAttribute('id');
			let nodesinsideway = XMLways[i].getElementsByTagName('nd');
			for (let j = 0; j < nodesinsideway.length - 1; j++) {
				fromnode = getNodebyId(nodesinsideway[j].getAttribute("ref"));
				tonode = getNodebyId(nodesinsideway[j + 1].getAttribute("ref"));
				if (fromnode != null & tonode != null) {
					let newEdge = new Edge(fromnode, tonode, wayid);
					edges.push(newEdge);
					totaledgedistance += newEdge.distance;
				}
			}
		}
		mode = selectnodemode;
		extractEdges();
		showMessage("mode is selectnodemode");
	});
}

function extractEdges() {
	for (let i = 0; i < numways/2; i++){
		subsetEdges.push(edges[i])
	}
	// console.log(subsetEdges)
}

function showMessage(msg) {
	if (msgDiv) {
		hideMessage();
	}
	let ypos = 20;
	let btnwidth = 320;
	msgbckDiv = createDiv('');
	msgbckDiv.style('position', 'fixed');
	msgbckDiv.style('width', btnwidth + 'px');
	msgbckDiv.style('top', ypos + 45 + 'px');
	msgbckDiv.style('left', '50%');
	msgbckDiv.style('background', 'black');
	msgbckDiv.style('opacity', '0.3');
	msgbckDiv.style('-webkit-transform', 'translate(-50%, -50%)');
	msgbckDiv.style('transform', 'translate(-50%, -50%)');
	msgbckDiv.style('height', '30px');
	msgbckDiv.style('border-radius', '7px');
	msgDiv = createDiv('');
	msgDiv.style('position', 'fixed');
	msgDiv.style('width', btnwidth + 'px');
	msgDiv.style('top', ypos + 57 + 'px');
	msgDiv.style('left', '50%');
	msgDiv.style('color', 'white');
	msgDiv.style('background', 'none');
	msgDiv.style('opacity', '1');
	msgDiv.style('-webkit-transform', 'translate(-50%, -50%)');
	msgDiv.style('transform', 'translate(-50%, -50%)');
	msgDiv.style('font-family', '"Lucida Sans Unicode", "Lucida Grande", sans-serif');
	msgDiv.style('font-size', '16px');
	msgDiv.style('text-align', 'center');
	msgDiv.style('vertical-align', 'middle');
	msgDiv.style('height', '50px');
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
			let dist = edges[i].distanceToPoint(mouseX, mouseY)
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

function mousePressed() { // clicked on map to select a node
	if (mode == choosemapmode && mouseY < btnBRy && mouseY > btnTLy && mouseX > btnTLx && mouseX < btnBRx) { // Was in Choose map mode and clicked on button
		getOverpassData(); // gets road data from framed area on map
        mode = selectnodemode 
        console.log(mode)
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

function calcdistance(lat1, long1, lat2, long2) {
	lat1 = radians(lat1);
	long1 = radians(long1);
	lat2 = radians(lat2);
	long2 = radians(long2);
	return 2 * asin(sqrt(pow(sin((lat2 - lat1) / 2), 2) + cos(lat1) * cos(lat2) * pow(sin((long2 - long1) / 2), 2))) * 6371.0;
}

function loadGPXFile(file){
    let reader = new FileReader();
    reader.onload = function(e) {
        let parser = new DOMParser();
        let gpxData = parser.parseFromString(e.target.result, "text/xml");
        displayGPX(gpxData);
        console.log()
    };
    reader.readAsText(file)
}


// AI generated code


function loadgpx(){
    fetch("routes/testroute.gpx")
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(data => {
            let parser = new DOMParser();
            let gpxData = parser.parseFromString(data, "text/xml");
            let gpxPoints = gpxData.getElementsByTagName("trkpt");
            displayGPXTrack(gpxData)
            // console.log(gpxPoints);
            let gpxLat = []
            let gpxLon = []
            for (let i = 0; i < gpxPoints.length; i++){
                let lat = gpxPoints[i].getAttribute("lat");
                let lon = gpxPoints[i].getAttribute("lon");
                gpxLat.push(lat);
                gpxLon.push(lon);
            } 
            
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        });
}

function displayGPXTrack(gpxData) {
    let vectorSource = new ol.source.Vector({
        features: new ol.format.GPX().readFeatures(gpxData, {
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857'
        })
    });

    // Create a vector layer with blue style
    let vectorLayer = new ol.layer.Vector({
        source: vectorSource,
        style: new ol.style.Style({
            stroke: new ol.style.Stroke({
                color: 'blue',
                width: 4
            })
        })
    });

    // Add the layer to the map
    openlayersmap.addLayer(vectorLayer);
    const toggleButton = document.getElementById('toggle-layer');
    toggleButton.addEventListener('click', () => {
        if (vectorLayer.getVisible()){
            vectorLayer.setVisible(false);
        }
        else {
            vectorLayer.setVisible(true);
        }
    })

}
