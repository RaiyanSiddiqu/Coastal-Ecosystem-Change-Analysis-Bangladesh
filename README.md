# Coastal Ecosystem Change Analysis in Bangladesh (1995-2025)

Google Earth Engine and Python scripts developed for my M.Sc. thesis in Remote Sensing and GIS.

## Overview

This repository contains selected code for analyzing long-term coastal ecosystem change in southwestern Bangladesh from 1995 to 2025. The project uses Landsat satellite imagery, Google Earth Engine, GIS, and Python-based statistical analysis to examine changes in vegetation, surface water, land-surface temperature, and land use/land cover.

The research combines geospatial analysis with community survey findings to understand environmental change and its potential effects on coastal ecosystems and local livelihoods.

## Research Objectives

- Analyze long-term changes in vegetation using NDVI.
- Examine surface-water dynamics using NDWI.
- Assess land-surface-temperature trends.
- Perform Sen’s slope and Mann-Kendall trend analysis.
- Produce Land Use/Land Cover (LULC) maps for 1995, 2000, 2005, 2010, 2015, 2020, and 2025.
- Use the Random Forest machine-learning classifier for LULC classification.
- Identify spatial patterns of ecosystem change in coastal Bangladesh.

## Study Area

The study focuses on coastal Bangladesh, a region affected by land-use change, aquaculture expansion, climate variability, flooding, waterlogging, and other environmental pressures.

## Data Sources

- Landsat satellite imagery
- Google Earth Engine data catalog
- Training and validation data for LULC classification
- Community survey data used in the broader thesis research

## Methods

### 1. Time-Series Analysis

Multi-temporal Landsat imagery was used to calculate:

- Normalized Difference Vegetation Index (NDVI)
- Normalized Difference Water Index (NDWI)
- Land Surface Temperature (LST)

These indicators were analyzed over the 1995-2025 period to identify long-term environmental changes.

### 2. Trend Analysis

Python was used to conduct statistical time-series analysis, including:

- Sen’s slope estimation
- Mann-Kendall trend test
- Correlation analysis among NDVI, NDWI, and LST

### 3. Land Use/Land Cover Classification

LULC maps were produced for seven years using the Random Forest classifier in Google Earth Engine:

- 1995
- 2000
- 2005
- 2010
- 2015
- 2020
- 2025

## Repository Structure

```text
gee-coastal-ecosystem-analysis/
│
├── README.md
├── gee_scripts/
│   ├── ndvi_timeseries.js
│   ├── ndwi_timeseries.js
│   ├── lst_timeseries.js
│   └── lulc/
│       ├── LULC_1995_random_forest.js
│       ├── LULC_2000_random_forest.js
│       ├── LULC_2005_random_forest.js
│       ├── LULC_2010_random_forest.js
│       ├── LULC_2015_random_forest.js
│       ├── LULC_2020_random_forest.js
│       └── LULC_2025_random_forest.js
│
├── python_analysis/
│   ├── sens_slope_timeseries.py
│   └── [optional Jupyter Notebook file]
│
└── figures/
    ├── ndvi_timeseries.png
    ├── ndwi_timeseries.png
    ├── lst_timeseries.png
    ├── lulc_1995.png
    └── lulc_2025.png
```

## Software and Tools

- Google Earth Engine
- JavaScript
- Python
- Anaconda / Jupyter Notebook
-  ArcGIS Pro
- Landsat satellite imagery

## Sample Outputs

The project produces the following outputs:

- Annual or seasonal NDVI, NDWI, and LST time-series charts.
- Trend maps showing areas of increasing or decreasing vegetation, surface water, and land-surface temperature.
- Sen’s slope and Mann-Kendall trend-analysis results.
- Random Forest LULC classification maps for 1995-2025.
- Maps showing land-use change patterns over time.

### Example Figure: NDVI Time Series
<img width="813" height="506" alt="image" src="https://github.com/user-attachments/assets/0c6b923b-f7d3-4d78-9541-b05ada5dc733" />




### Example Figure: LULC Maps
<img width="904" height="1169" alt="image" src="https://github.com/user-attachments/assets/822c20ef-59a9-4c6d-ba9e-9519a73dbe83" />



## How to Use the Code

### Google Earth Engine Scripts

1. Open the [Google Earth Engine Code Editor](https://code.earthengine.google.com/).
2. Create a new script.
3. Copy and paste the code from a `.js` file in the `gee_scripts` folder.
4. Update the study-area boundary, asset paths, training data, or export location as necessary.
5. Run the script.

### Python Trend Analysis

1. Install Python through Anaconda.
2. Open Anaconda Prompt or Jupyter Notebook.
3. Install required packages if necessary.
4. Update the input-file path in `sens_slope_timeseries.py`.
5. Run the script to calculate Sen’s slope, Mann-Kendall trends, and correlations.

## Notes

- This repository contains selected scripts developed for academic and research-portfolio purposes.
- Users should update asset IDs, file paths, study-area boundaries, and training-data locations before running the code.
- Community survey data and other sensitive or unpublished datasets are not included in this repository.

## Author

**Raiyan Siddique**  
M.Sc. in Remote Sensing and GIS  
Research interests: Remote sensing, GIS, environmental time-series analysis, land-use/land-cover change, coastal ecosystems, machine learning, and climate resilience.

