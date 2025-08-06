# RunEveryStreet RPP

A web-based application for route planning and GPX analysis using OpenLayers and various graph algorithms.

## 🚀 Live Demo

**Try it now:** [https://Hishamaz44.github.io/RunEveryStreet_RPP/](https://Hishamaz44.github.io/RunEveryStreet_RPP/)

## ✨ Features

- 🗺️ Interactive map using OpenLayers
- 📁 GPX and CSV file upload support
- 🔍 Advanced data filtering (environmental metrics, signal strength)
- 🛣️ Route optimization algorithms (Hierholzer algorithm)
- 📊 Graph-based route calculations
- 🎯 Vector layer visualization controls

## 🛠️ Local Development

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

4. **Open your browser to:** `http://localhost:3000/RunEveryStreet_RPP/`

## 📦 Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## 🎮 How to Use

1. **Upload GPX files** using the file input in the top-right
2. **Toggle layers** using the "Vector Layer Visibility" button
3. **Apply filters** using the "Show Filters" panel (bottom-left)
4. **Run algorithms** using the "Apply Hierholzer Algorithm" button
5. **Navigate** the map to explore your route data

## 🧠 Algorithms Included

- **Hierholzer Algorithm** - For finding Eulerian paths/circuits
- **Graph-based routing** - Using graphology library
- **Route optimization** - Various pathfinding algorithms

## 📄 File Structure

```
RunEveryStreet_RPP/
├── OpenLayersWebMap/          # Main application directory
│   ├── index.html            # Main HTML file
│   ├── sketch.js             # Main application logic
│   ├── algorithm1.js         # Algorithm implementations
│   ├── services/             # Data processing services
│   ├── utils/                # Utility functions
│   ├── assets/               # Images and static assets
│   └── routes/               # Sample GPX files
└── dist/                     # Built application (auto-generated)
```

## 🔧 Technologies Used

- **Vite** - Build tool and dev server
- **OpenLayers** - Interactive maps
- **P5.js** - Graphics and visualization
- **Graphology** - Graph data structures and algorithms
- **JavaScript ES6+** - Modern JavaScript features

## 📝 License

MIT License - feel free to use this project for learning and development!

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

**Note:** This project was created as part of a Bachelor's thesis tutorial on route planning algorithms.

**Author:** Hisham Abou Zeid
