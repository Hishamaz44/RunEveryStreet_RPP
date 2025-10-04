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

// Add these variables for unvisited area processing
let unvisitedGpxCoordinates = [];
let unvisitedFilesToProcess = 0;
let unvisitedFilesProcessed = 0;

// Add this function after the existing loadGPX function:
function loadUnvisitedAreaGPX(file) {
  unvisitedFilesToProcess++;

  let reader = new FileReader();
  reader.onload = function (e) {
    let parser = new DOMParser();
    let gpxData = parser.parseFromString(e.target.result, "text/xml");
    let gpxPoints = gpxData.getElementsByTagName("trkpt");

    // Parse GPX coordinates
    for (let i = 0; i < gpxPoints.length; i++) {
      let lat = gpxPoints[i].getAttribute("lat");
      let lon = gpxPoints[i].getAttribute("lon");
      unvisitedGpxCoordinates.push([lat, lon]);
    }

    unvisitedFilesProcessed++;

    // Process when all files are loaded
    if (unvisitedFilesProcessed === unvisitedFilesToProcess) {
      processUnvisitedArea(unvisitedGpxCoordinates);

      // Reset for next batch
      unvisitedGpxCoordinates = [];
      unvisitedFilesToProcess = 0;
      unvisitedFilesProcessed = 0;
    }
  };

  reader.readAsText(file);
}

// Make it globally available
window.loadUnvisitedAreaGPX = loadUnvisitedAreaGPX;
