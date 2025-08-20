let rawData = [];
let filteredData = [];

function parseCSV(csvText) {
  console.time("parseCSV");
  const lines = csvText.trim().split("\n");
  const headers = lines[0].split(",");
  const result = lines.slice(1).map((line) => {
    const values = line.split(",");
    return Object.fromEntries(
      values.map((v, i) => [headers[i], parseValue(v.trim())])
    );
  });
  console.timeEnd("parseCSV");
  return result;
}

function parseValue(val) {
  const num = parseFloat(val);
  const result = isNaN(num) ? val : num;

  return result;
}

function displayData(data) {
  console.time("displayData");
  console.log("CSV Data loaded:");
  console.log("Number of rows:", data.length);
  console.log("Headers:", data.length > 0 ? Object.keys(data[0]) : "No data");
  console.log("First few rows:", data.slice(0, 3));
  console.timeEnd("displayData");
}

// Get filter values from UI - complete version with SNR
function getFilterValuesFromUI() {
  console.time("getFilterValuesFromUI");
  const filters = {};

  // Environmental filters
  const envFilters = {};

  // Altitude
  const minAlt = parseFloat(document.getElementById("minAltitude").value);
  const maxAlt = parseFloat(document.getElementById("maxAltitude").value);
  if (!isNaN(minAlt) || !isNaN(maxAlt)) {
    envFilters.altitude = {};
    if (!isNaN(minAlt)) envFilters.altitude.min = minAlt;
    if (!isNaN(maxAlt)) envFilters.altitude.max = maxAlt;
  }

  // Temperature
  const minTemp = parseFloat(document.getElementById("minTemperature").value);
  const maxTemp = parseFloat(document.getElementById("maxTemperature").value);
  if (!isNaN(minTemp) || !isNaN(maxTemp)) {
    envFilters.temperature = {};
    if (!isNaN(minTemp)) envFilters.temperature.min = minTemp;
    if (!isNaN(maxTemp)) envFilters.temperature.max = maxTemp;
  }

  // Humidity
  const minHum = parseFloat(document.getElementById("minHumidity").value);
  const maxHum = parseFloat(document.getElementById("maxHumidity").value);
  if (!isNaN(minHum) || !isNaN(maxHum)) {
    envFilters.humidity = {};
    if (!isNaN(minHum)) envFilters.humidity.min = minHum;
    if (!isNaN(maxHum)) envFilters.humidity.max = maxHum;
  }

  // Pressure
  const minPress = parseFloat(document.getElementById("minPressure").value);
  const maxPress = parseFloat(document.getElementById("maxPressure").value);
  if (!isNaN(minPress) || !isNaN(maxPress)) {
    envFilters.pressure = {};
    if (!isNaN(minPress)) envFilters.pressure.min = minPress;
    if (!isNaN(maxPress)) envFilters.pressure.max = maxPress;
  }

  if (Object.keys(envFilters).length > 0) {
    filters.environmental = envFilters;
  }

  // Signal strength filters
  const signalFilters = {};

  // GW1 RSSI
  const minGW1RSSI = parseFloat(document.getElementById("minGW1RSSI").value);
  const maxGW1RSSI = parseFloat(document.getElementById("maxGW1RSSI").value);
  if (!isNaN(minGW1RSSI) || !isNaN(maxGW1RSSI)) {
    signalFilters["tuc-gw1-ige_rssi"] = {};
    if (!isNaN(minGW1RSSI)) signalFilters["tuc-gw1-ige_rssi"].min = minGW1RSSI;
    if (!isNaN(maxGW1RSSI)) signalFilters["tuc-gw1-ige_rssi"].max = maxGW1RSSI;
  }

  // GW2 RSSI
  const minGW2RSSI = parseFloat(document.getElementById("minGW2RSSI").value);
  const maxGW2RSSI = parseFloat(document.getElementById("maxGW2RSSI").value);
  if (!isNaN(minGW2RSSI) || !isNaN(maxGW2RSSI)) {
    signalFilters["tuc-gw2-iei_rssi"] = {};
    if (!isNaN(minGW2RSSI)) signalFilters["tuc-gw2-iei_rssi"].min = minGW2RSSI;
    if (!isNaN(maxGW2RSSI)) signalFilters["tuc-gw2-iei_rssi"].max = maxGW2RSSI;
  }

  // GW3 RSSI
  const minGW3RSSI = parseFloat(document.getElementById("minGW3RSSI").value);
  const maxGW3RSSI = parseFloat(document.getElementById("maxGW3RSSI").value);
  if (!isNaN(minGW3RSSI) || !isNaN(maxGW3RSSI)) {
    signalFilters["tuc-gw3-ifi_rssi"] = {};
    if (!isNaN(minGW3RSSI)) signalFilters["tuc-gw3-ifi_rssi"].min = minGW3RSSI;
    if (!isNaN(maxGW3RSSI)) signalFilters["tuc-gw3-ifi_rssi"].max = maxGW3RSSI;
  }

  // GW1 SNR
  const minGW1SNR = parseFloat(document.getElementById("minGW1SNR").value);
  const maxGW1SNR = parseFloat(document.getElementById("maxGW1SNR").value);
  if (!isNaN(minGW1SNR) || !isNaN(maxGW1SNR)) {
    signalFilters["tuc-gw1-ige_snr"] = {};
    if (!isNaN(minGW1SNR)) signalFilters["tuc-gw1-ige_snr"].min = minGW1SNR;
    if (!isNaN(maxGW1SNR)) signalFilters["tuc-gw1-ige_snr"].max = maxGW1SNR;
  }

  // GW2 SNR
  const minGW2SNR = parseFloat(document.getElementById("minGW2SNR").value);
  const maxGW2SNR = parseFloat(document.getElementById("maxGW2SNR").value);
  if (!isNaN(minGW2SNR) || !isNaN(maxGW2SNR)) {
    signalFilters["tuc-gw2-iei_snr"] = {};
    if (!isNaN(minGW2SNR)) signalFilters["tuc-gw2-iei_snr"].min = minGW2SNR;
    if (!isNaN(maxGW2SNR)) signalFilters["tuc-gw2-iei_snr"].max = maxGW2SNR;
  }

  // GW3 SNR
  const minGW3SNR = parseFloat(document.getElementById("minGW3SNR").value);
  const maxGW3SNR = parseFloat(document.getElementById("maxGW3SNR").value);
  if (!isNaN(minGW3SNR) || !isNaN(maxGW3SNR)) {
    signalFilters["tuc-gw3-ifi_snr"] = {};
    if (!isNaN(minGW3SNR)) signalFilters["tuc-gw3-ifi_snr"].min = minGW3SNR;
    if (!isNaN(maxGW3SNR)) signalFilters["tuc-gw3-ifi_snr"].max = maxGW3SNR;
  }

  if (Object.keys(signalFilters).length > 0) {
    filters.signalStrength = signalFilters;
  }

  console.timeEnd("getFilterValuesFromUI");
  return filters;
}

// Updated filtering function to include SNR in the output
function filterCoordinatesByMetrics(data, filters) {
  console.time("filterCoordinatesByMetrics");
  const filteredCoordinates = data
    .filter((entry) => {
      // Check environmental filters
      if (filters.environmental) {
        for (const [metric, range] of Object.entries(filters.environmental)) {
          if (range.min !== undefined && entry[metric] < range.min)
            return false;
          if (range.max !== undefined && entry[metric] > range.max)
            return false;
        }
      }

      // Check signal strength filters (both RSSI and SNR)
      if (filters.signalStrength) {
        for (const [signal, range] of Object.entries(filters.signalStrength)) {
          if (range.min !== undefined && entry[signal] < range.min)
            return false;
          if (range.max !== undefined && entry[signal] > range.max)
            return false;
        }
      }

      return true;
    })
    .map((entry) => ({
      latitude: entry.latitude,
      longitude: entry.longitude,
      metrics: {
        altitude: entry.altitude,
        temperature: entry.temperature,
        humidity: entry.humidity,
        pressure: entry.pressure,
      },
      signalStrengths: {
        "gw1-ige-rssi": entry["tuc-gw1-ige_rssi"],
        "gw2-iei-rssi": entry["tuc-gw2-iei_rssi"],
        "gw3-ifi-rssi": entry["tuc-gw3-ifi_rssi"],
        "gw1-ige-snr": entry["tuc-gw1-ige_snr"],
        "gw2-iei-snr": entry["tuc-gw2-iei_snr"],
        "gw3-ifi-snr": entry["tuc-gw3-ifi_snr"],
      },
    }));

  console.timeEnd("filterCoordinatesByMetrics");
  return filteredCoordinates;
}

function updateFilterResults(filteredData) {
  console.time("updateFilterResults");
  const resultsDiv = document.getElementById("filterResults");
  if (resultsDiv) {
    resultsDiv.innerHTML = `
      <strong>Filter Results:</strong><br>
      Original points: ${rawData.length}<br>
      Filtered points: ${filteredData.length}<br>
      Reduction: ${((1 - filteredData.length / rawData.length) * 100).toFixed(
        1
      )}%
    `;
  }
  console.timeEnd("updateFilterResults");
}

function clearAllFilters() {
  console.time("clearAllFilters");
  const inputs = document.querySelectorAll("#filterPanel input");
  inputs.forEach((input) => (input.value = ""));
  document.getElementById("filterResults").innerHTML = "";
  console.timeEnd("clearAllFilters");
}

function loadCSV(file) {
  console.time("loadCSV");
  const reader = new FileReader();
  reader.onload = function (event) {
    console.time("loadCSV-processing");
    const text = event.target.result;
    rawData = parseCSV(text);
    displayData(rawData);

    // Show the filter panel when CSV is loaded
    document.getElementById("filterPanel").style.display = "block";
    document.getElementById("toggleFilters").textContent = "Hide Filters";
    console.timeEnd("loadCSV-processing");
    console.timeEnd("loadCSV");
  };
  reader.readAsText(file);
}

// Event listeners
document.addEventListener("DOMContentLoaded", function () {
  const fileInput = document.getElementById("csvFile");
  const applyButton = document.getElementById("applyFilters");
  const clearButton = document.getElementById("clearFilters");
  const useButton = document.getElementById("useFilteredCoords");
  const toggleButton = document.getElementById("toggleFilters");

  if (fileInput) {
    fileInput.addEventListener("change", function (e) {
      let files = e.target.files;
      if (files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          if (files[i].name.endsWith(".csv")) {
            loadCSV(files[i]);
          }
        }
      }
    });
  }

  if (applyButton) {
    applyButton.addEventListener("click", function () {
      if (rawData.length === 0) {
        alert("Please load a CSV file first");
        return;
      }

      const filters = getFilterValuesFromUI();
      filteredData = filterCoordinatesByMetrics(rawData, filters);

      console.log("Applied filters:", filters);
      console.log("Filtered results:", filteredData);

      updateFilterResults(filteredData);
    });
  }

  if (clearButton) {
    clearButton.addEventListener("click", clearAllFilters);
  }

  if (useButton) {
    useButton.addEventListener("click", function () {
      if (filteredData.length === 0) {
        alert("Please apply filters first");
        return;
      }

      console.log(
        "Using filtered coordinates for route planning:",
        filteredData
      );

      // Convert filtered data to the same format as GPX coordinates
      const coordinatesForProcessing = filteredData.map((point) => [
        point.latitude,
        point.longitude,
      ]);

      console.log(
        "Converted coordinates for processing:",
        coordinatesForProcessing
      );

      // Process through the same pipeline as GPX coordinates
      gpxToOverpass(coordinatesForProcessing);

      // Update UI to show we're processing
      alert(
        `Processing ${coordinatesForProcessing.length} filtered coordinates`
      );
    });
  }

  if (toggleButton) {
    toggleButton.addEventListener("click", function () {
      const panel = document.getElementById("filterPanel");
      if (panel.style.display === "none" || panel.style.display === "") {
        panel.style.display = "block";
        toggleButton.textContent = "Hide Filters";
      } else {
        panel.style.display = "none";
        toggleButton.textContent = "Show Filters";
      }
    });
  }
});

// Export functions
window.loadCSV = loadCSV;
window.filterCoordinatesByMetrics = filterCoordinatesByMetrics;
window.getFilteredCoordinates = () => filteredData;
