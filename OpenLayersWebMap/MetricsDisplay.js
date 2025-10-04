/**
 * Metrics Collection and Display System
 * Tracks and displays performance metrics for all algorithms
 */

class AlgorithmMetrics {
  constructor() {
    this.metrics = new Map();
    this.createMetricsPanel();
  }

  /**
   * Record metrics for an algorithm run
   */
  recordMetrics(algorithmName, results, runtimeData = {}) {
    console.log("Recording metrics for:", algorithmName);
    console.log("Results:", results);
    console.log("Runtime data:", runtimeData);

    const metrics = {
      algorithmName: algorithmName,
      timestamp: new Date().toISOString(),
      routeQuality: this.calculateRouteQuality(results),
      performance: {
        endToEndRuntime: runtimeData.endToEndRuntime || 0,
        stageRuntimes: runtimeData.stageRuntimes || {},
        iterations: results.iterations || 1,
        avgIterationTime: runtimeData.endToEndRuntime
          ? runtimeData.endToEndRuntime / (results.iterations || 1)
          : 0,
      },
      efficiency: results.summary ? results.summary.efficiency : "N/A",
      waypoints: results.summary ? results.summary.waypoints : 0,
    };

    console.log("Calculated metrics:", metrics);
    console.log("Final route quality object:", metrics.routeQuality);
    console.log(
      "totalLengthKm in final metrics:",
      metrics.routeQuality.totalLengthKm
    );
    this.metrics.set(algorithmName, metrics);
    console.log("Total metrics stored:", this.metrics.size);
    this.updateMetricsDisplay();
    return metrics;
  }

  /**
   * Calculate route quality metrics
   */
  calculateRouteQuality(results) {
    const quality = {
      totalLength: 0,
      totalLengthKm: 0,
      repeatedEdgeDistance: 0,
      repeatedEdgeDistanceKm: 0,
      originalDistance: 0,
      originalDistanceKm: 0,
      efficiency: 0,
      repeatedEdgePercentage: 0,
      isValid: false,
    };

    // Handle invalid results (null route, infinite distance, etc.)
    if (
      !results.bestRoute ||
      results.bestDistance === Infinity ||
      results.bestDistance <= 0
    ) {
      console.log("Invalid route results detected");
      if (results.summary && results.summary.originalDistance) {
        quality.originalDistance = results.summary.originalDistance;
        quality.originalDistanceKm = quality.originalDistance / 1000;
      }
      return quality;
    }

    quality.isValid = true;

    // Calculate total route length - prefer bestRoute.distance if available
    quality.totalLength =
      results.bestRoute.distance || results.bestDistance || 0;
    quality.totalLengthKm = quality.totalLength; // Distance is already in km from calcdistance function

    console.log("Route quality calculation:");
    console.log("  bestRoute.distance:", results.bestRoute.distance);
    console.log("  bestDistance:", results.bestDistance);
    console.log("  final totalLength:", quality.totalLength);
    console.log("  totalLengthKm:", quality.totalLengthKm);

    // Calculate original distance (sum of all unique edges)
    if (results.summary) {
      quality.originalDistance = results.summary.originalDistance || 0;
      quality.originalDistanceKm = quality.originalDistance; // Distance is already in km
      quality.efficiency = parseFloat(results.summary.efficiency) || 0;
    }

    // Calculate repeated edge distance
    quality.repeatedEdgeDistance =
      quality.totalLength - quality.originalDistance;
    quality.repeatedEdgeDistanceKm = quality.repeatedEdgeDistance; // Distance is already in km

    // Calculate percentage of distance on repeated edges
    if (quality.totalLength > 0) {
      quality.repeatedEdgePercentage =
        (quality.repeatedEdgeDistance / quality.totalLength) * 100;
    }

    return quality;
  }

  /**
   * Create the metrics display panel
   */
  createMetricsPanel() {
    // Remove existing panel if it exists
    const existingPanel = document.getElementById("metricsPanel");
    if (existingPanel) {
      existingPanel.remove();
    }

    const panel = document.createElement("div");
    panel.id = "metricsPanel";
    panel.style.cssText = `
      position: fixed;
      top: 100px;
      left: 10px;
      width: 450px;
      max-height: 500px;
      background: rgba(56, 7, 2, 0.98);
      color: white;
      padding: 15px;
      border-radius: 8px;
      font-family: 'Lucida Sans Unicode', 'Lucida Grande', sans-serif;
      font-size: 12px;
      border: 2px solid #ffcc00;
      overflow-y: auto;
      z-index: 9999;
      display: none;
      box-shadow: 0 8px 16px rgba(0,0,0,0.5);
    `;

    panel.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <h3 style="margin: 0; color: #ffcc00; font-size: 16px;">Algorithm Metrics</h3>
        <button id="clearMetrics" style="background: #cc0000; color: white; border: none; padding: 3px 8px; border-radius: 3px; cursor: pointer; font-size: 10px;">Clear</button>
      </div>
      <div id="metricsContent">
        <p style="color: #cccccc; text-align: center; margin: 20px 0;">No metrics recorded yet. Run an algorithm to see results.</p>
      </div>
    `;

    document.body.appendChild(panel);

    // Add clear metrics functionality
    document.getElementById("clearMetrics").addEventListener("click", () => {
      this.clearMetrics();
    });

    // Create toggle button
    this.createToggleButton();
  }

  /**
   * Create toggle button for metrics panel
   */
  createToggleButton() {
    const existingButton = document.getElementById("toggleMetrics");
    if (existingButton) {
      existingButton.remove();
    }

    const toggleButton = document.createElement("button");
    toggleButton.id = "toggleMetrics";
    toggleButton.textContent = "Show Metrics";
    toggleButton.style.cssText = `
      position: fixed;
      top: 60px;
      left: 10px;
      z-index: 10000;
      background-color: #380702;
      color: white;
      border: 2px solid #ffcc00;
      padding: 8px 12px;
      border-radius: 5px;
      cursor: pointer;
      font-family: 'Lucida Sans Unicode', 'Lucida Grande', sans-serif;
      font-size: 11px;
      font-weight: bold;
    `;

    toggleButton.addEventListener("click", () => {
      this.toggleMetricsPanel();
    });

    document.body.appendChild(toggleButton);
  }

  /**
   * Toggle metrics panel visibility
   */
  toggleMetricsPanel() {
    console.log("Toggling metrics panel...");
    const panel = document.getElementById("metricsPanel");
    const button = document.getElementById("toggleMetrics");

    if (!panel) {
      console.error("metricsPanel element not found!");
      return;
    }
    if (!button) {
      console.error("toggleMetrics button not found!");
      return;
    }

    console.log("Panel current display:", panel.style.display);

    if (panel.style.display === "none" || panel.style.display === "") {
      panel.style.display = "block";
      button.textContent = "Hide Metrics";
      button.style.backgroundColor = "#cc0000";
      console.log("Panel shown");
    } else {
      panel.style.display = "none";
      button.textContent = "Show Metrics";
      button.style.backgroundColor = "#380702";
      console.log("Panel hidden");
    }
  }

  /**
   * Update the metrics display
   */
  updateMetricsDisplay() {
    console.log("Updating metrics display...");
    const content = document.getElementById("metricsContent");
    if (!content) {
      console.error("metricsContent element not found!");
      return;
    }

    console.log("Metrics size:", this.metrics.size);
    if (this.metrics.size === 0) {
      content.innerHTML =
        '<p style="color: #cccccc; text-align: center; margin: 20px 0;">No metrics recorded yet. Run an algorithm to see results.</p>';
      return;
    }

    let html = "";

    // Sort metrics by timestamp (most recent first)
    const sortedMetrics = Array.from(this.metrics.values()).sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );

    console.log("Sorted metrics:", sortedMetrics);

    sortedMetrics.forEach((metric, index) => {
      const isLatest = index === 0;
      html += this.generateMetricCard(metric, isLatest);
    });

    console.log("Generated HTML length:", html.length);
    content.innerHTML = html;
    console.log("Display updated successfully");
  }

  /**
   * Generate HTML for a single metric card
   */
  generateMetricCard(metric, isLatest = false) {
    const borderColor = isLatest ? "#00ff00" : "#666";
    const headerColor = isLatest ? "#00ff00" : "#ffcc00";
    const isValidRoute = metric.routeQuality.isValid;

    // If route is invalid, show error state
    if (!isValidRoute) {
      return `
        <div style="border: 1px solid #ff6666; border-radius: 5px; padding: 10px; margin-bottom: 10px; background: rgba(64,0,0,0.3);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <h4 style="margin: 0; color: #ff6666; font-size: 14px;">${
              metric.algorithmName
            }</h4>
            <span style="color: #ff6666; font-size: 10px; font-weight: bold;">FAILED</span>
          </div>
          
          <div style="color: #ff9999; font-size: 11px; text-align: center; padding: 10px;">
            <div>❌ Algorithm failed to find a valid route</div>
            <div style="margin-top: 5px; font-size: 10px; color: #ffcccc;">
              Runtime: ${(metric.performance.endToEndRuntime / 1000).toFixed(
                2
              )} s | 
              Original Distance: ${metric.routeQuality.originalDistanceKm.toFixed(
                3
              )} km
            </div>
          </div>
          
          <div style="margin-top: 8px; font-size: 10px; color: #999;">
            Run at: ${new Date(metric.timestamp).toLocaleString()}
          </div>
        </div>
      `;
    }

    return `
      <div style="border: 1px solid ${borderColor}; border-radius: 5px; padding: 10px; margin-bottom: 10px; background: rgba(0,0,0,0.2);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <h4 style="margin: 0; color: ${headerColor}; font-size: 14px;">${
      metric.algorithmName
    }</h4>
          ${
            isLatest
              ? '<span style="color: #00ff00; font-size: 10px; font-weight: bold;">LATEST</span>'
              : ""
          }
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 11px;">
          <!-- Route Quality -->
          <div>
            <h5 style="margin: 0 0 5px 0; color: #ffcc00; font-size: 12px;">Route Quality</h5>
            <div style="color: #cccccc;">
              <div>Total Length: <span style="color: white; font-weight: bold;">${metric.routeQuality.totalLengthKm.toFixed(
                2
              )} km</span></div>
              <div>Original Length: <span style="color: white;">${metric.routeQuality.originalDistanceKm.toFixed(
                2
              )} km</span></div>
              <div>Repeated Edges: <span style="color: #ff9999;">${metric.routeQuality.repeatedEdgeDistanceKm.toFixed(
                2
              )} km</span></div>
              <div>Efficiency: <span style="color: #99ff99;">${
                metric.efficiency
              }</span></div>
              <div>Repeated %: <span style="color: #ff9999;">${metric.routeQuality.repeatedEdgePercentage.toFixed(
                1
              )}%</span></div>
            </div>
          </div>
          
          <!-- Performance -->
          <div>
            <h5 style="margin: 0 0 5px 0; color: #ffcc00; font-size: 12px;">Performance</h5>
            <div style="color: #cccccc;">
              <div>Runtime: <span style="color: white; font-weight: bold;">${(
                metric.performance.endToEndRuntime / 1000
              ).toFixed(2)} s</span></div>
              <div>Iterations: <span style="color: white;">${metric.performance.iterations.toLocaleString()}</span></div>
              <div>Avg/Iteration: <span style="color: #99ccff;">${metric.performance.avgIterationTime.toFixed(
                2
              )} ms</span></div>
              <div>Waypoints: <span style="color: white;">${metric.waypoints.toLocaleString()}</span></div>
            </div>
          </div>
        </div>
        
        ${
          Object.keys(metric.performance.stageRuntimes).length > 0
            ? this.generateStageRuntimes(metric.performance.stageRuntimes)
            : ""
        }
        
        <div style="margin-top: 8px; font-size: 10px; color: #999;">
          Run at: ${new Date(metric.timestamp).toLocaleString()}
        </div>
      </div>
    `;
  }

  /**
   * Generate stage runtime display
   */
  generateStageRuntimes(stageRuntimes) {
    if (Object.keys(stageRuntimes).length === 0) return "";

    let html =
      '<div style="margin-top: 8px;"><h6 style="margin: 0 0 3px 0; color: #ffcc00; font-size: 11px;">Stage Runtimes</h6>';
    html += '<div style="font-size: 10px; color: #cccccc;">';

    Object.entries(stageRuntimes).forEach(([stage, time]) => {
      html += `<div>${stage}: <span style="color: white;">${(
        time / 1000
      ).toFixed(3)} s</span></div>`;
    });

    html += "</div></div>";
    return html;
  }

  /**
   * Clear all metrics
   */
  clearMetrics() {
    this.metrics.clear();
    this.updateMetricsDisplay();
  }

  /**
   * Get metrics for comparison
   */
  getMetrics(algorithmName = null) {
    if (algorithmName) {
      return this.metrics.get(algorithmName);
    }
    return Object.fromEntries(this.metrics);
  }

  /**
   * Export metrics as JSON
   */
  exportMetrics() {
    const data = Object.fromEntries(this.metrics);
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `algorithm_metrics_${new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/:/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

// Create global metrics instance
window.algorithmMetrics = new AlgorithmMetrics();

// Make functions available globally with safety checks
window.recordAlgorithmMetrics = (name, results, runtime) => {
  console.log("recordAlgorithmMetrics called with:", name);
  if (!window.algorithmMetrics) {
    console.error("algorithmMetrics not initialized!");
    window.algorithmMetrics = new AlgorithmMetrics();
  }
  return window.algorithmMetrics.recordMetrics(name, results, runtime);
};

window.exportAlgorithmMetrics = () => {
  if (!window.algorithmMetrics) {
    console.error("algorithmMetrics not initialized!");
    return;
  }
  return window.algorithmMetrics.exportMetrics();
};

// Add a test function
window.testMetrics = () => {
  console.log("Testing metrics system...");
  const testResults = {
    bestRoute: { waypoints: [{}, {}] },
    bestDistance: 1000,
    iterations: 5,
    summary: {
      originalDistance: 800,
      routeDistance: 1000,
      efficiency: "0.800",
      waypoints: 2,
    },
  };
  recordAlgorithmMetrics("Test Algorithm", testResults, {
    endToEndRuntime: 1000,
  });
};
