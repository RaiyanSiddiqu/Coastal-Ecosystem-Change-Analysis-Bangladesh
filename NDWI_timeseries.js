// NDWI TIME SERIES (1995-2025) 
// Mongla & Rampal, Bangladesh.  
// Sensor: Landsat 5/7/8/9 Collection 2 Level 2 SR.

// ------------------------- 1. STUDY AREA -----------------------------------
var aoi = ee.FeatureCollection ('projects/ee-raiyansiddique10/assets/Mongla_Rampal_reserach'');
var roi = aoi.geometry();
Map.centerObject(roi, 11);

// ------------------------- 2. SCALE + CLOUD MASK ---------------------------
function scaleSR(image){
  var o=image.select('SR_B.*').multiply(0.0000275).add(-0.2);
  return image.addBands(o,null,true);
}
function maskClouds(image){
  var qa=image.select('QA_PIXEL');
  var m=qa.bitwiseAnd(1<<1).eq(0).and(qa.bitwiseAnd(1<<2).eq(0))
    .and(qa.bitwiseAnd(1<<3).eq(0)).and(qa.bitwiseAnd(1<<4).eq(0));
  return image.updateMask(m);
}

// ------------------------- 3. PREP (Green, NIR, SWIR1) ----------------------
function prepTM(image){    // L5/7: Green=SR_B2, NIR=SR_B4, SWIR1=SR_B5
  return scaleSR(maskClouds(image))
    .select(['SR_B2','SR_B4','SR_B5'],['Green','NIR','SWIR1'])
    .copyProperties(image,['system:time_start']);
}
function prepOLI(image){   // L8/9: Green=SR_B3, NIR=SR_B5, SWIR1=SR_B6
  return scaleSR(maskClouds(image))
    .select(['SR_B3','SR_B5','SR_B6'],['Green','NIR','SWIR1'])
    .copyProperties(image,['system:time_start']);
}

// ------------------------- 4. NDWI CHOICE ----------------------------------
var USE_MCFEETERS = true;  // true = (Green-NIR)/(Green+NIR); false = Gao (NIR-SWIR1)

var landsat=ee.ImageCollection('LANDSAT/LT05/C02/T1_L2').filterBounds(roi).map(prepTM)
  .merge(ee.ImageCollection('LANDSAT/LE07/C02/T1_L2').filterBounds(roi).map(prepTM))
  .merge(ee.ImageCollection('LANDSAT/LC08/C02/T1_L2').filterBounds(roi).map(prepOLI))
  .merge(ee.ImageCollection('LANDSAT/LC09/C02/T1_L2').filterBounds(roi).map(prepOLI))
  .map(function(im){
    var ndwi = USE_MCFEETERS
      ? im.normalizedDifference(['Green','NIR']).rename('NDWI')   // McFeeters
      : im.normalizedDifference(['NIR','SWIR1']).rename('NDWI');  // Gao
    return im.addBands(ndwi);
  });


var years=ee.List.sequence(1995,2025);
var dryNDWI=ee.ImageCollection.fromImages(
  years.map(function(y){
    y=ee.Number(y);
    var s=ee.Date.fromYMD(y.subtract(1),11,1);
    var e=ee.Date.fromYMD(y,3,1);
    var comp=landsat.filterDate(s,e).select('NDWI').median().clip(roi);
    return comp.set('year',y).set('system:time_start',ee.Date.fromYMD(y,1,1).millis());
  })
);

// ------------------------- 6. CHART + EXPORT -------------------------------
print(ui.Chart.image.seriesByRegion({
  imageCollection:dryNDWI, regions:roi, reducer:ee.Reducer.mean(),
  band:'NDWI', scale:30, xProperty:'system:time_start'
}).setOptions({title:'Dry-season NDWI (1995-2025) — Mongla & Rampal',
  hAxis:{title:'Year',format:'yyyy'}, vAxis:{title:'NDWI'},
  lineWidth:2, pointSize:4, colors:['1f5fb0']}));

var stats=dryNDWI.map(function(img){
  var m=img.reduceRegion({reducer:ee.Reducer.mean(),geometry:roi,
    scale:30,maxPixels:1e13});
  return ee.Feature(null,{year:img.get('year'), NDWI:m.get('NDWI')});
});

Export.table.toDrive({
  collection:ee.FeatureCollection(stats),
  description:'NDWI_DrySeason_1995_2025',
  fileNamePrefix:'NDWI_DrySeason_1995_2025',
  fileFormat:'CSV'
});