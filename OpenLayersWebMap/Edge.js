class Edge {
  //section of road that connects nodes
  constructor(from_, to_, wayid_) {
    this.wayid = wayid_;
    this.from = from_;
    this.to = to_;
    this.travels = 0;
    this.distance = calcdistance(
      this.from.lat,
      this.from.lon,
      this.to.lat,
      this.to.lon
    );
    if (!this.from.edges.includes(this)) {
      this.from.edges.push(this);
    }
    if (!this.to.edges.includes(this)) {
      this.to.edges.push(this);
    }
  }

  // show() {
  // 	strokeWeight(min(10, (this.travels + 1) * 2));
  // 	stroke(55, 255, 255, 0.8);
  // 	line(this.from.x, this.from.y, this.to.x, this.to.y);
  // 	fill(0);
  // 	// noStroke();
  // 	if (this.hovered){
  // 		strokeWeight(4); // Thicker line when hovered
  // 		stroke(0, 255, 255, 0.8);
  // 	}
  // 	else if(this.selected){
  // 		strokeWeight(5);
  // 		stroke(100, 255, 255, 0.8);
  // 	}
  // }

  show() {
    // Map the coordinates from lat/lon to screen coordinates
    let x1 = map(this.from.lon, mapminlon, mapmaxlon, 0, mapWidth);
    let y1 = map(this.from.lat, mapminlat, mapmaxlat, mapHeight, 0);
    let x2 = map(this.to.lon, mapminlon, mapmaxlon, 0, mapWidth);
    let y2 = map(this.to.lat, mapminlat, mapmaxlat, mapHeight, 0);

    strokeWeight(min(10, (this.travels + 1) * 2));
    stroke(60, 255, 255, 0.8);
    line(x1, y1, x2, y2); // Use mapped coordinates
    fill(0);
    noStroke();

    if (this.hovered) {
      strokeWeight(4);
      stroke(0, 255, 255, 0.8);
    } else if (this.selected) {
      strokeWeight(5);
      stroke(100, 255, 255, 0.8);
    }
  }

  highlight() {
    strokeWeight(4);
    stroke(20, 255, 255, 1);
    line(this.from.x, this.from.y, this.to.x, this.to.y);
    fill(0);
    noStroke();
  }

  OtherNodeofEdge(node) {
    if (node == this.from) {
      return this.to;
    } else {
      return this.from;
    }
  }

  distanceToPoint(x, y) {
    //distance from middle of this edge to give point
    return dist(
      x,
      y,
      (this.to.x + this.from.x) / 2,
      (this.to.y + this.from.y) / 2
    );
  }
}
