# RunEveryStreet RPP

A comprehensive web-based application for solving the Rural Postman Problem (RPP) using OpenLayers and advanced graph algorithms.

## ✨ Features

🗺️ **Interactive Mapping** - OpenLayers-based map interface with geolocation support  
📁 **Multi-format Data Support** - GPX, CSV, and JSON file upload capabilities  
🔍 **Advanced Data Filtering** - Environmental metrics, signal strength (RSSI/SNR), and coordinate filtering  
🛣️ **Multiple Route Optimization Algorithms**:
<<<<<<< HEAD

- **CE1 Algorithm**
- **CE2 Algorithm**
- **ECE Algorithm**
- **Original Algorithm**

📊 **Comprehensive Analytics**:

- Real-time algorithm performance metrics
- Route quality analysis and efficiency calculations
- Exportable metrics in JSON format
- Graph data export/import functionality

🎯 **Advanced Visualization**:

- Vector layer controls with toggle visibility
- Route visualization with waypoint tracking
- Unvisited area overlay support
- # Interactive node selection and highlighting

  > > > > > > > a00fb3d14994f9bcfce766e8e36144262fbbe866

- **CE1 Algorithm**
- **CE2 Algorithm**
- **ECE Algorithm**
- **Original Algorithm**

# <<<<<<< HEAD

📊 **Comprehensive Analytics**:

- Real-time algorithm performance metrics
- Route quality analysis and efficiency calculations
- Exportable metrics in JSON format
- Graph data export/import functionality

## 🛠️ Running The Tool

> > > > > > > a00fb3d14994f9bcfce766e8e36144262fbbe866
> > > > > > > This project uses Vite for fast development and modern build tooling.

### Prerequisites

- Node.js >= 16.0.0
- npm >= 8.0.0

### Setup Instructions

1. **Clone the repository:**

   ```bash
   git clone https://github.com/Hishamaz44/RunEveryStreet_RPP.git
   cd RunEveryStreet_RPP
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Start development server:**

   ```bash
   npm run dev
   ```

4. **Open your browser to:** `http://localhost:3000`

## 🎮 How to Use

<<<<<<< HEAD

### Data Upload

- **GPX Files**: Upload route data using the top-right file input
- **CSV Files**: Upload sensor data with environmental metrics
- **Unvisited GPX**: Upload additional area data for comprehensive coverage
- **Graph Data**: Import/export graph structures in JSON format

### Map Interaction

- **Layer Control**: Toggle vector layer visibility using the "Vector Layer Visibility" button
- **Node Selection**: Click on map nodes to set start points for algorithms
- **Zoom & Pan**: Navigate the map to explore your route data

=======

### Data Upload

- **GPX Files**: Upload route data using the top-right file input
- **CSV Files**: Upload sensor data with environmental metrics
- **Unvisited GPX**: Upload additional area data for comprehensive coverage
- **Graph Data**: Import/export graph structures in JSON format

### Map Interaction

- **Layer Control**: Toggle vector layer visibility using the "Vector Layer Visibility" button
- **Node Selection**: Click on map nodes to set start points for algorithms
- **Zoom & Pan**: Navigate the map to explore your route data

> > > > > > > a00fb3d14994f9bcfce766e8e36144262fbbe866

### Data Filtering

- **Access Filters**: Click "Show Filters" in the bottom-left corner
- **Environmental Metrics**: Filter by altitude, temperature, humidity, pressure
- **Signal Strength**: Filter by RSSI values for multiple gateways (GW1-IGE, GW2-IEI, GW3-IFI)
- **Signal Quality**: Filter by SNR (Signal-to-Noise Ratio) metrics
- **Apply Filters**: Use filtered data for algorithm processing

### Algorithm Execution

1. **Select Start Node**: Click on a map node to set the starting point
2. **Choose Algorithm**: Click any algorithm button (CE1, CE2, ECE, Greedy, Simple Greedy)
3. **Monitor Progress**: View real-time algorithm status and completion messages
4. **Analyze Results**: Export metrics for detailed performance analysis

## 📄 Project Structure

```
RunEveryStreet_RPP/
├── OpenLayersWebMap/          # Main application directory
│   ├── index.html            # Main HTML interface
│   ├── sketch.js             # Core application logic & map setup
│   ├── CE1Algorithm.js       # Chinese Postman variant 1
│   ├── CE2Algorithm.js       # Chinese Postman variant 2
│   ├── ECEAlgorithm.js       # Efficient Chinese Postman
│   ├── GreedyAlgorithm.js    # Iterative greedy solver
│   ├── SimpleGreedyAlgorithm.js # Lightweight greedy
│   ├── MetricsDisplay.js     # Performance analytics
│   ├── graphConverter.js     # Graph data structures
│   ├── graphologyConverter.js # Graphology integration
│   ├── Edge.js              # Edge data structure
│   ├── Node1.js             # Node data structure
│   ├── Route.js             # Route data structure
│   ├── services/            # Data processing services
│   │   ├── filterFunction.js # Data filtering logic
│   │   ├── GpxServices.js   # GPX file processing
│   │   └── OverpassServices.js # OSM data integration
│   ├── utils/               # Utility functions
│   │   └── GraphFunctions.js # Graph operations
│   ├── libraries/           # External libraries (P5.js, etc.)
│   ├── routes/             # Sample GPX test files
│   └── assets/             # Images and static resources
├── dist/                   # Production build output
├── package.json           # Dependencies and scripts
├── vite.config.js        # Vite build configuration
└── README.md             # This file
```

## 🔧 Technologies Used

- **[Vite](https://vitejs.dev/)** - Modern build tool and development server
- **[OpenLayers](https://openlayers.org/)** - Interactive web mapping library
- **[P5.js](https://p5js.org/)** - Creative coding and visualization framework
- **[Graphology](https://graphology.github.io/)** - Robust graph data structures and algorithms
- **[Graphlib](https://github.com/dagrejs/graphlib)** - Additional graph algorithms
- **JavaScript ES6+** - Modern JavaScript with module support
- **Overpass API** - OpenStreetMap data integration

## 📊 Data Processing Capabilities

- **GPX Parsing**: Route coordinate extraction and simplification
- **CSV Processing**: Sensor data with environmental metrics
- **OSM Integration**: Automatic street network extraction via Overpass API
- **Graph Construction**: Node/edge network generation from geographic data
- **Data Filtering**: Multi-criteria filtering with real-time preview
- **Export Formats**: GPX route export, JSON graph data, metrics reports

## 🚀 Performance Features

- **Chunked Processing**: Handles large datasets (>600 points) efficiently
- **Time-bounded Execution**: Algorithms with configurable time limits
- **Memory Optimization**: Efficient graph data structures
- **Real-time Metrics**: Live performance monitoring and analysis
- **Caching**: Graph data persistence for repeated analysis

## 📝 License

MIT License - Feel free to use this project for learning and development!

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📚 Academic Context

This project was developed as part of a Bachelor's thesis on the Rural Postman Problem and its applications in urban route optimization.

## 👨‍💻 Author

**Hisham Abou Zeid**

---
