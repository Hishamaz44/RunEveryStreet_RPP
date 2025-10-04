// Load GPX files
let gpxCoordinates = [];
let filesToProcess = 0;
let filesProcessed = 0;

function loadGPX(file) {
  filesToProcess++;

  let reader = new FileReader();
  reader.onload = function (e) {
    let parser = new DOMParser();
    let gpxData = parser.parseFromString(e.target.result, "text/xml");
    let gpxPoints = gpxData.getElementsByTagName("trkpt");

    // Parse GPX nodes
    for (let i = 0; i < gpxPoints.length; i++) {
      let lat = gpxPoints[i].getAttribute("lat");
      let lon = gpxPoints[i].getAttribute("lon");
      gpxCoordinates.push([lat, lon]);
    }

    filesProcessed++;

    // Only call gpxToOverpass when all files have been processed
    if (filesProcessed === filesToProcess) {
      gpxToOverpass(gpxCoordinates);

      // Reset for next batch of files
      gpxCoordinates = [];
      filesToProcess = 0;
      filesProcessed = 0;
    }
  };

  reader.readAsText(file);
}

window.loadGPX = loadGPX;
