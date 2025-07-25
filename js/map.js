// OSM tile
const osmUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const osmAttrib =
'&copy; <a href="https://openstreetmap.org/copyright">' +
"OpenStreetMap</a> contributors";
window.osm = L.tileLayer(osmUrl, {
    attribution: osmAttrib,
    // maxZoom: 18,
    noWrap: true,
    name: 'osm'
});

// CyclOSM
const cyclosmUrl = "https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png";
const cyclosmAttrib =
'<a href="https://github.com/cyclosm/cyclosm-cartocss-style/releases" title="CyclOSM - Open Bicycle render">CyclOSM</a> | Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors"';
window.cyclosm = L.tileLayer(cyclosmUrl, {
    attribution: cyclosmAttrib,
    // maxZoom: 18,
    noWrap: true,
    name: 'cyclosm'
});

// OpenTopoMap
const topoUrl = "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png";
const topoAttrib =
"Kartendaten: © OpenStreetMap-Mitwirkende, SRTM | Kartendarstellung: © OpenTopoMap (CC-BY-SA) ";
window.topo = L.tileLayer(topoUrl, {
  // maxZoom: 18,
  attribution: topoAttrib,
  noWrap: true,
  name: 'topo'
});

// ESRI
const esriUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const esriAttrib = 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
window.esri = L.tileLayer(esriUrl, {
  // maxZoom: 18,
  attribution: esriAttrib,
  noWrap: true,
  name: 'esri'
});

// Carto tile Layer
const cartoUrl = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"; 
window.carto = L.tileLayer(cartoUrl, {
  // maxZoom: 18,
  noWrap: true,
  name: 'carto',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
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

// ??? Google layer
window.goo = L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',{
      // maxZoom: 20,
      subdomains:['mt0','mt1','mt2','mt3'],
      name: 'goo'
});





/////////////////////////////////////////////




function replaceAttributionFlag() {
    const newSvgString = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 9 6" width="12" height="8"><rect fill="#fff" width="9" height="3"/><rect fill="#d52b1e" y="3" width="9" height="3"/><rect fill="#0039a6" y="2" width="9" height="2"/></svg>';

    // Находим контейнер атрибуции
    const attributionContainer = document.querySelector('.leaflet-control-attribution');
    if (!attributionContainer) {
        setTimeout(replaceAttributionFlag, 100);
        return;
    }

    // Сохраняем оригинальный текст атрибуции (без флагов)
    const originalText = attributionContainer.textContent;
    
    // Удаляем все существующие флаги
    const existingFlags = attributionContainer.querySelectorAll('svg, .leaflet-attribution-flag');
    existingFlags.forEach(flag => flag.remove());
    
    // Создаем контейнер для российского флага
    const flagContainer = document.createElement('span');
    flagContainer.className = 'russian-flag';
    flagContainer.innerHTML = newSvgString;
    
    // Вставляем флаг в начало контейнера
    attributionContainer.insertBefore(flagContainer, attributionContainer.firstChild);
    
    // Восстанавливаем оригинальный текст
    attributionContainer.textContent = originalText;
    attributionContainer.prepend(flagContainer);
}

// Перехват создания элементов атрибуции
const originalAddTo = L.Control.Attribution.prototype.addTo;
L.Control.Attribution.prototype.addTo = function(map) {
    const result = originalAddTo.call(this, map);
    replaceAttributionFlag();
    return result;
};

// Перехват обновления атрибуции
const originalSetPrefix = L.Control.Attribution.prototype.setPrefix;
L.Control.Attribution.prototype.setPrefix = function(prefix) {
    const result = originalSetPrefix.call(this, prefix);
    replaceAttributionFlag();
    return result;
};

const originalAddAttribution = L.Control.Attribution.prototype.addAttribution;
L.Control.Attribution.prototype.addAttribution = function(text) {
    const result = originalAddAttribution.call(this, text);
    replaceAttributionFlag();
    return result;
};