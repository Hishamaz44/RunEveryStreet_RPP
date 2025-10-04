//js-graph-alg

function displayGPXTrack(nodes, edges) {
  const vectorSource = new ol.source.Vector();
  const vectorLayer = new ol.layer.Vector({ source: vectorSource });
  openlayersmap.addLayer(vectorLayer);

  // Only show nodes that are connected to visited edges
  const nodesWithedges = new Set();
  edges.forEach((e) => {
    if (e.visitedOriginal) {
      nodesWithedges.add(e.from.nodeId);
      nodesWithedges.add(e.to.nodeId);
    }
  });

  // Only add nodes that are part of visited edges
  // Only add nodes that are part of visited edges
  nodes.forEach((node) => {
    if (nodesWithedges.has(node.nodeId)) {
      const feature = new ol.Feature({
        geometry: new ol.geom.Point(ol.proj.fromLonLat([node.lon, node.lat])),
      });

      // Add styling for the nodes
      feature.setStyle(
        new ol.style.Style({
          image: new ol.style.Circle({
            radius: 4, // Adjust this value to change node size
            fill: new ol.style.Fill({
              color: "blue", // You can change the color too
            }),
            stroke: new ol.style.Stroke({
              color: "white",
              width: 2,
            }),
          }),
        })
      );

      vectorSource.addFeature(feature);
    }
  });

  // Only show edges that are marked as visited
  edges.forEach((e) => {
    if (e.visitedOriginal) {
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
            width: 5,
          }),
        })
      );

      vectorSource.addFeature(feature);
    }
  });
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

function drawProgressGraph() {
  let totalDistanceRevised = 0;
  for (let i = 0; i < edges.length; i++) {
    if (edges[i].augmentedEdge == false) {
      // console.log(edges[i]);
      totalDistanceRevised = totalDistanceRevised + edges[i].distance;
    }
  }
  if (efficiencyhistory.length > 0) {
    noStroke();
    fill(0, 0, 0, 0.3);
    let graphHeight = 100;
    rect(0, height - graphHeight, windowWidth, graphHeight);
    fill(0, 5, 225, 255);
    textAlign(LEFT);
    textSize(12);
    // let totalDistanceRevised;
    console.log("this is totalEdgeDistance: ", totalEdgeDistance);
    text(
      "Routes tried: " +
        iterations.toLocaleString() +
        ", Length of all roads: " +
        nf(totalDistanceRevised, 0, 1) +
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

window.displayGPXTrack = displayGPXTrack;
window.showMessage = showMessage;
window.resetEdges = resetEdges;
window.floodfill = floodfill;
window.removeOrphans = removeOrphans;
window.trimSelectedEdge = trimSelectedEdge;
window.drawProgressGraph = drawProgressGraph;
window.calcdistance = calcdistance;
