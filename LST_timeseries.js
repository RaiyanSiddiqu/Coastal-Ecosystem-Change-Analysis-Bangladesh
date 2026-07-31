// LST TIME SERIES (1995-2025) 

// ------------------------- 1. STUDY AREA -----------------------------------
var aoi = ee.FeatureCollection ('projects/ee-raiyansiddique10/assets/Mongla_Rampal_reserach'');
var roi = aoi.geometry();
Map.centerObject(roi, 11);

// ------------------------- 2. SEASON TOGGLE --------------------------------
// 'dry'  = Nov(year-1) -> Mar(year)  
// 'warm' = 1 Mar -> 1 Jun (year)      
var SEASON = 'dry';

// ------------------------- 3. SCALE + CLOUD MASK ---------------------------
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

// ------------------------- 4. PREP: LST + MNDWI ----------------------------
// Need Green & SWIR1 for the water mask, plus the thermal band for LST.
function prep(greenB, swir1B, thermalB){
  return function(image){
    var masked=maskClouds(image);
    var scaled=scaleSR(masked);
    var mndwi=scaled.normalizedDifference([greenB, swir1B]).rename('MNDWI');
    var lst=masked.select(thermalB)
      .multiply(0.00341802).add(149.0).subtract(273.15).rename('LST');
    return lst.addBands(mndwi).copyProperties(image,['system:time_start']);
  };
}
// L5/7: Green=SR_B2, SWIR1=SR_B5, thermal=ST_B6
// L8/9: Green=SR_B3, SWIR1=SR_B6, thermal=ST_B10
var landsat=ee.ImageCollection('LANDSAT/LT05/C02/T1_L2').filterBounds(roi).map(prep('SR_B2','SR_B5','ST_B6'))
  .merge(ee.ImageCollection('LANDSAT/LE07/C02/T1_L2').filterBounds(roi).map(prep('SR_B2','SR_B5','ST_B6')))
  .merge(ee.ImageCollection('LANDSAT/LC08/C02/T1_L2').filterBounds(roi).map(prep('SR_B3','SR_B6','ST_B10')))
  .merge(ee.ImageCollection('LANDSAT/LC09/C02/T1_L2').filterBounds(roi).map(prep('SR_B3','SR_B6','ST_B10')));

// ------------------------- 5. LAND-ONLY COMPOSITES -------------------------
var years=ee.List.sequence(1995,2025);

function lstForYear(y){
  y=ee.Number(y);
  var s, e;
  if(SEASON==='warm'){ s=ee.Date.fromYMD(y,3,1);            e=ee.Date.fromYMD(y,6,1); }
  else               { s=ee.Date.fromYMD(y.subtract(1),11,1); e=ee.Date.fromYMD(y,3,1); }

  var comp=landsat.filterDate(s,e).median().clip(roi);
  var water=comp.select('MNDWI').gt(0);
  var lstLand=comp.select('LST').updateMask(water.not());   // keep LAND only
  return lstLand.rename('LST')
    .set('year',y).set('system:time_start',ee.Date.fromYMD(y,1,1).millis());
}
var series=ee.ImageCollection.fromImages(years.map(lstForYear));

// ------------------------- 6. CHART + EXPORT -------------------------------
print(ui.Chart.image.seriesByRegion({
  imageCollection:series, regions:roi, reducer:ee.Reducer.mean(),
  band:'LST', scale:30, xProperty:'system:time_start'
}).setOptions({title:'LAND-ONLY LST ('+SEASON+' season, degC, 1995-2025) — Mongla & Rampal',
  hAxis:{title:'Year',format:'yyyy'}, vAxis:{title:'LST (degC)'},
  lineWidth:2, pointSize:4, colors:['c0392b']}));

var stats=series.map(function(img){
  var m=img.reduceRegion({reducer:ee.Reducer.mean(),geometry:roi,scale:30,maxPixels:1e13});
  return ee.Feature(null,{year:img.get('year'), LST_land:m.get('LST')});
});

Export.table.toDrive({
  collection:ee.FeatureCollection(stats),
  description:'LST_LandOnly_'+SEASON+'_1995_2025',
  fileNamePrefix:'LST_LandOnly_'+SEASON+'_1995_2025',
  fileFormat:'CSV'
});