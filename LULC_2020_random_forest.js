
var aoi = ee.FeatureCollection('projects/ee-raiyansiddique10/assets/Mongla_Rampal_reserach'');
var roi = aoi.geometry();
Map.centerObject(roi, 11);

function scaleSR(image){ var o=image.select('SR_B.*').multiply(0.0000275).add(-0.2); return image.addBands(o,null,true); }
function maskClouds(image){
  var qa=image.select('QA_PIXEL');
  var m=qa.bitwiseAnd(1<<1).eq(0).and(qa.bitwiseAnd(1<<2).eq(0))
    .and(qa.bitwiseAnd(1<<3).eq(0)).and(qa.bitwiseAnd(1<<4).eq(0));
  return image.updateMask(m);
}
// 2020 uses Landsat 8 OLI (L9 not launched yet)
function prepOLI(image){
  var s=scaleSR(maskClouds(image));
  return s.select(['SR_B2','SR_B3','SR_B4','SR_B5','SR_B6','SR_B7'],
                  ['Blue','Green','Red','NIR','SWIR1','SWIR2'])
    .copyProperties(image,['system:time_start']);
}
var col = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2').filterBounds(roi)
   .filterDate('2019-11-01','2020-03-01')
   .map(prepOLI);

var base = col.median().clip(roi);

var ndvi = base.normalizedDifference(['NIR','Red']).rename('NDVI');
var ndwi = base.normalizedDifference(['Green','NIR']).rename('NDWI');
var mndwi= base.normalizedDifference(['Green','SWIR1']).rename('MNDWI');
var ndbi = base.normalizedDifference(['SWIR1','NIR']).rename('NDBI');
var bsi  = base.expression(
  '((SWIR1+Red)-(NIR+Blue))/((SWIR1+Red)+(NIR+Blue))',
  {SWIR1:base.select('SWIR1'),Red:base.select('Red'),NIR:base.select('NIR'),Blue:base.select('Blue')}
).rename('BSI');

var img = base.addBands([ndvi,ndwi,mndwi,ndbi,bsi]);
var bands = ['Blue','Green','Red','NIR','SWIR1','SWIR2','NDVI','NDWI','MNDWI','NDBI','BSI'];

Map.addLayer(base, {bands:['Red','Green','Blue'], min:0, max:0.3}, '2020 True colour');
Map.addLayer(base, {bands:['NIR','Red','Green'], min:0, max:0.4}, '2020 False colour (veg=red)');
Map.addLayer(mndwi, {min:-0.5,max:0.5,palette:['white','blue']}, 'MNDWI (water bright)');

// >>> DRAW SIX imports: builtup, agri, water, aqua, veg, bare (FeatureCollections)
//     Then uncomment. Class is forced in code below (no need to set property).

var training = builtup.map(function(f){return f.set('class',0);})
  .merge(agri.map(function(f){return f.set('class',1);}))
  .merge(water.map(function(f){return f.set('class',2);}))
  .merge(aqua.map(function(f){return f.set('class',3);}))
  .merge(veg.map(function(f){return f.set('class',4);}))
  .merge(bare.map(function(f){return f.set('class',5);}));

var samples = img.select(bands).sampleRegions({
  collection: training, properties: ['class'], scale: 30, tileScale: 4
});
samples = samples.randomColumn('rnd', 42);
var train = samples.filter(ee.Filter.lt('rnd', 0.7));
var valid = samples.filter(ee.Filter.gte('rnd', 0.7));

var rf = ee.Classifier.smileRandomForest(100).train({
  features: train, classProperty: 'class', inputProperties: bands
});
var classified = img.select(bands).classify(rf);

var palette = ['e31a1c','ffff99','1f78b4','6a3d9a','33a02c','b15928'];
Map.addLayer(classified, {min:0,max:5,palette:palette}, 'LULC 2020');

var vc = valid.classify(rf);
var cm = vc.errorMatrix('class','classification');
print('Confusion matrix (2020):', cm);
print('Overall accuracy:', cm.accuracy());
print('Kappa:', cm.kappa());
print('Producers accuracy:', cm.producersAccuracy());
print('Users accuracy:', cm.consumersAccuracy());

// AREA (ha + km2)
var areaImg = ee.Image.pixelArea().divide(10000).addBands(classified);
var areas = areaImg.reduceRegion({
  reducer: ee.Reducer.sum().group({groupField:1, groupName:'class'}),
  geometry: roi, scale: 30, maxPixels: 1e13, tileScale: 4
});
var classNames = ee.Dictionary({'0':'Built-up','1':'Agriculture','2':'Waterbody','3':'Aquaculture','4':'Vegetation','5':'Bareland'});
var rows = ee.List(areas.get('groups')).map(function(g){
  g=ee.Dictionary(g); var cls=ee.Number(g.get('class')).format('%d'); var ha=ee.Number(g.get('sum'));
  return ee.Feature(null,{class_id:cls,class_name:classNames.get(cls),area_ha:ha.round(),area_km2:ha.divide(100).round()});
});
var areaFC=ee.FeatureCollection(rows);
print('LULC 2020 area by class (ha & km2):', areaFC);

Export.image.toDrive({image:classified.toByte(), description:'LULC_2020', fileNamePrefix:'LULC_2020',
  region:roi, scale:30, maxPixels:1e13, crs:'EPSG:4326'});
Export.table.toDrive({collection:areaFC, description:'LULC_2020_area_by_class',
  fileNamePrefix:'LULC_2020_area_by_class', fileFormat:'CSV'});
