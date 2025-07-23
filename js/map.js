// OSM tile
const osmUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const osmAttrib =
'&copy; <a href="https://openstreetmap.org/copyright">' +
"OpenStreetMap</a> contributors";
window.osm = L.tileLayer(osmUrl, {
    attribution: osmAttrib,
    maxZoom: 18,
    noWrap: true,
    name: 'osm'
});

// CyclOSM
const cyclosmUrl = "https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png";
const cyclosmAttrib =
'<a href="https://github.com/cyclosm/cyclosm-cartocss-style/releases" title="CyclOSM - Open Bicycle render">CyclOSM</a> | Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors"';
window.cyclosm = L.tileLayer(cyclosmUrl, {
    attribution: cyclosmAttrib,
    maxZoom: 18,
    noWrap: true,
    name: 'cyclosm'
});

// OpenTopoMap
const topoUrl = "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png";
const topoAttrib =
"Kartendaten: © OpenStreetMap-Mitwirkende, SRTM | Kartendarstellung: © OpenTopoMap (CC-BY-SA) ";
window.topo = L.tileLayer(topoUrl, {
  maxZoom: 18,
  attribution: topoAttrib,
  noWrap: true,
  name: 'topo'
});

// ESRI
const esriUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const esriAttrib = 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
window.esri = L.tileLayer(esriUrl, {
  maxZoom: 18,
  attribution: esriAttrib,
  noWrap: true,
  name: 'esri'
});

// Carto tile Layer
const cartoUrl = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"; 
window.carto = L.tileLayer(cartoUrl, {
  maxZoom: 18,
  noWrap: true,
  name: 'carto'
}); 

// RU tile Layer - https://qms.nextgis.com/geoservices/563/
const ruUrl = "http://88.99.52.155/cgi-bin/tapp/tilecache.py/1.0.0/topomapper_v2/{z}/{x}/{y}.jpg"; 
const ruAttriib = 'Tiles &copy; ATLOGIS Geoinformatics oHG';
window.ru = L.tileLayer(ruUrl, {
    minZoom: 10,
    maxZoom: 13,
    noWrap: true,
    name: 'ruarmy',
    attribution: ruAttriib,
});
