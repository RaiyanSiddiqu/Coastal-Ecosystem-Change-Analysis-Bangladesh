
// NDVI TIME SERIES (1995-2025)
// Mongla & Rampal Upazila, Bagerhat, Bangladesh

// 1. STUDY AREA
// ---------------------------------------------------------------------------
var aoi = ee.FeatureCollection ('projects/ee-raiyansiddique10/assets/Mongla_Rampal_reserach'');
var roi = aoi.geometry();
Map.centerObject(roi, 11);
Map.addLayer(roi, {color: 'red'}, 'Study Area', true, 0.4);


// 2. SCALE + CLOUD MASK
// ---------------------------------------------------------------------------
function scaleSR(image) {
  var optical = image.select('SR_B.*').multiply(0.0000275).add(-0.2);
  return image.addBands(optical, null, true);
}
function maskClouds(image) {
  var qa = image.select('QA_PIXEL');
  var mask = qa.bitwiseAnd(1 << 1).eq(0)   // not dilated cloud
    .and(qa.bitwiseAnd(1 << 2).eq(0))      // not cirrus
    .and(qa.bitwiseAnd(1 << 3).eq(0))      // not cloud
    .and(qa.bitwiseAnd(1 << 4).eq(0));     // not cloud shadow
  return image.updateMask(mask);
}

// ---------------------------------------------------------------------------
// 3. PER-SENSOR PREP (rename bands to common names)
// ---------------------------------------------------------------------------
function prepTM(image) {   // Landsat 5 & 7: Red=SR_B3, NIR=SR_B4
  return scaleSR(maskClouds(image))
    .select(['SR_B3', 'SR_B4'], ['Red', 'NIR'])
    .copyProperties(image, ['system:time_start']);
}
function prepOLI(image) {  // Landsat 8 & 9: Red=SR_B4, NIR=SR_B5
  return scaleSR(maskClouds(image))
    .select(['SR_B4', 'SR_B5'], ['Red', 'NIR'])
    .copyProperties(image, ['system:time_start']);
}

// ---------------------------------------------------------------------------
// 4. HARMONIZED COLLECTION (all four sensors) + NDVI
// ---------------------------------------------------------------------------
var l5 = ee.ImageCollection('LANDSAT/LT05/C02/T1_L2').filterBounds(roi).map(prepTM);
var l7 = ee.ImageCollection('LANDSAT/LE07/C02/T1_L2').filterBounds(roi).map(prepTM);
var l8 = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2').filterBounds(roi).map(prepOLI);
var l9 = ee.ImageCollection('LANDSAT/LC09/C02/T1_L2').filterBounds(roi).map(prepOLI);

var landsat = l5.merge(l7).merge(l8).merge(l9)
  .map(function (image) {
    return image.addBands(image.normalizedDifference(['NIR', 'Red']).rename('NDVI'));
  });

//Time frame


var startYear = 1995;
var endYear   = 2025;
var years = ee.List.sequence(startYear, endYear);

var NDVI = ee.ImageCollection.fromImages(
  years.map(function (y) {
    y = ee.Number(y);
    var seasonStart = ee.Date.fromYMD(y.subtract(1), 11, 1);  
    var seasonEnd   = ee.Date.fromYMD(y, 3, 1);               

    var composite = landsat
      .filterDate(seasonStart, seasonEnd)
      .select('NDVI')
      .median()
      .clip(roi);

    return composite
      .set('year', y)
      .set('system:time_start', ee.Date.fromYMD(y, 1, 1).millis());
  })
);

// ---------------------------------------------------------------------------
// 6. CHART (preview)
// ---------------------------------------------------------------------------
var chart = ui.Chart.image.seriesByRegion({
  imageCollection: dryNDVI,
  regions: roi,
  reducer: ee.Reducer.mean(),
  band: 'NDVI',
  scale: 30,
  xProperty: 'system:time_start'
}).setOptions({
  title: 'Dry-Season (Nov-Feb) Mean NDVI (1995-2025) — Mongla & Rampal',
  hAxis: {title: 'Year', format: 'yyyy'},
  vAxis: {title: 'NDVI'},
  lineWidth: 2,
  pointSize: 4,
  colors: ['1d9e75']
});
print(chart);

// ---------------------------------------------------------------------------
// 7. EXPORT CSV  (for Mann-Kendall / Sen's slope)
// ---------------------------------------------------------------------------
var stats = dryNDVI.map(function (img) {
  var meanDict = img.reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: roi,
    scale: 30,
    maxPixels: 1e13
  });
  return ee.Feature(null, {
    'year': img.get('year'),
    'NDVI': meanDict.get('NDVI')
  });
});

Export.table.toDrive({
  collection: ee.FeatureCollection(stats),
  description: 'NDVI_DrySeason_1995_2025',
  fileNamePrefix: 'NDVI_DrySeason_1995_2025',
  fileFormat: 'CSV'
});