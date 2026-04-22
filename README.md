Immersive Campus Energy Visualization (VR)
A 3D immersive VR visualization that displays campus building energy consumption using interactive bars. Users can explore energy metrics, sort buildings, and view detailed information inside a virtual environment.

Project Overview
This project visualizes Bangor University 2020 energy dataset in a 3D VR environment.
 Each building is represented as a 3D bar whose height corresponds to an energy metric.
Users can:
Select different energy metrics
View building details
Navigate in 3D space
Interact using mouse or VR controllers

Features
3D interactive bar chart
Multiple energy metrics
Dynamic sorting (ascending/descending)
Hover animations
Click to view building info panel
VR support (WebXR)
Mouse + keyboard navigation
Responsive grid layout
Auto-facing info viewer panel

Technologies Used
HTML5
CSS3
Vanilla JavaScript
A-Frame (WebVR framework)
WebXR
JSON dataset

Project Structure
project/
│
├── index.html
├── styles.css
├── app.js
├── buildings_energy_2020.json
└── README.md

Dataset Format
The JSON file must be an array of objects:
[
 {
   "building_name": "Building A",
   "building_ref": "A01",
   "electricity_kwh_2020": 120000,
   "gas_kwh_2020": 80000,
   "renewable_chp_kwh_2020": 20000,
   "total_kwh": 220000,
   "energy_intensity_kwh_m2": 150,
   "gia_m2": 1400
 }
]

Available Metrics
Electricity kWh 2020
Gas kWh 2020
Renewable/CHP kWh 2020
Total kWh 2020
Energy Intensity kWh/m²
Users can switch metrics using the top control panel.

Controls
Desktop Controls
Mouse drag → Look around
WASD → Move
Click bar → Show building info
Click metric button → Change metric
VR Controls
Controller ray → Select
Trigger → Click
Head movement → Look

How It Works
JSON dataset is loaded
Data is sorted by selected metric
Grid layout is calculated
Bars are generated dynamically
Axes and labels are created
User interactions are attached

Key Components
chartRoot
 Contains all 3D bars
labelsRoot
 Contains building labels
axesRoot
 Contains axis lines and values
viewerRoot
 Floating building info panel
metricButtonsRoot
 Metric selection buttons

Bar Height Calculation
Bar height is normalized based on max value:
height = base + (value / maxValue) * maxHeight
This ensures proportional scaling.

Sorting Logic
ascending → low to high
descending → high to low
Sorting is applied every time a metric changes.

Interaction Flow
User clicks bar
 → viewer opens
 → shows building details
 → viewer rotates toward camera

Author Notes
This project uses:
Vanilla JavaScript (no framework)
A-Frame for 3D rendering
JSON for dataset
Dynamic DOM creation

License
For academic and visualization purposes.
