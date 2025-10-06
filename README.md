# RunEveryStreet RPP

This is a tweaked fork of Solipsia's RunEveryStreet (RES) that implements the Rural Postman Problem (RPP) in addition to the already implemented Chinese Postman Problem (CPP) solution to RES. The RPP is a generalization of the CPP, where only a subset of the graph is required.

## New Features

RES now supports several additonal functionalities to allow for the RPP.

1. Ability to upload routes that will be classified by the tool as visited.
2. Three new algorithms were implemented, based on the work of Holmberg (2010), namely algorithms CE1, CE2, and ECE. Those are heuristic aimed at solving the RPP.
3. A filter function that filters the uploaded routes by metadata.
4. Graph data export/import functionality. This is done for two reasons: First, to allow for systemic testing across the different algorithms. Secondly, to bypass the loading times of the OpenStreetMap(OSM) API call if one wants to test a large dataset multiple times.

## Setup

This project uses Vite for fast development and modern build tooling.

### Prerequisites

- Node.js >= 16.0.0
- npm >= 8.0.0

### Setup Instructions

1. **Clone the repository:**

   ```bash
   git clone <https://github.com/Hishamaz44/RunEveryStreet_RPP.git>
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

## How to Run the Tool

After loading the main page, you can do the following to execute the CPP for route finding:

1. Pan to the area of choice, click on the button on the top to retrieve the OSM data within the bounding box (These will be marked by the tool as unvisited, or required). Here you can choose the starting point then trim unwanted edges.
2. After doing the steps below, you can either run the original RES algorithm by clicking the button on the top, or run one of the implemented algorithms (CE1, CE2, or ECE) by clicking the buttons on the side.
3. You will get a popup to install the GPX file (the route generate by the algorithm), and will be able to see the metrics by clicking on the "Show Metrics" button (if you chose one of the three new algorithms), or get a popup with the metrics on the main page (if you chose the RES algorithm).

To execute the RPP for route finding:

1. Use one of the buttons on the right to upload either a GPX route or a CSV file. The entirety of the GPX route will be shown on the map in blue, while the CSV data will trigger the filter function. In the "Show Filters" button on the bottom left side, you can choose the filters you want, extract the points that match your chosen filters, and show those only on the map. The data retrieved from the GPX or CSV files will be marked as visited.
2. Pan to your area of choice, retrieve the OSM data (which will be marked as unvisited). Now you can choose the starting node and trim unwanted edges, and execute one of the three implemented algorithms. Make sure to choose a node that is **not** marked as visited, otherwise the algorithms won't work.

Finally, for systemic testing (this was also done to test the speeds and efficiency of the implemented algorithms), do the following:

1. Pan to the area of choice, extract the OSM data, and choose a starting node. Click on export Graph data and save the file (saved as JSON). This will export the graph data as a JSON file (In this case, all the graph data will be labelled as required). on the other hand, if you want to have a mixed graph with required and non-required parts, upload a GPX/CSV file first, then pan to the area and extract the OSM data by clicking on the button on top. Continue to choose a starting node and trim unwanted edges. Click on Export Graph Data to export the required and non-required graph.
2. Import that same data, and run one of the 4 algorithms on the side.
3. In this case, if the RES algorithm is to be executed, you will need to run it by clicking on the button on the side, labelled RES Algorithm.

In all cases, after the algorithm gets executed, you will get a window to save the file as a GPX file.

In order to change how long the RES algorithm works, go to sketch and change the parameters of the implementGreedyAlgorithm function. The first parameter passed is the startnode, and the second is the runtime in milliseconds. It is currently set to 10000 milliseconds or 10 seconds

## Author

**Hisham Abou Zeid**

---
