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
// const cyclosmUrl = "https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png";
// const cyclosmAttrib =
// '<a href="https://github.com/cyclosm/cyclosm-cartocss-style/releases" title="CyclOSM - Open Bicycle render">CyclOSM</a> | Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors"';
// window.cyclosm = L.tileLayer(cyclosmUrl, {
    // attribution: cyclosmAttrib,
    // noWrap: true,
    // name: 'cyclosm'
// });

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
// const cartoUrl = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"; 
// window.carto = L.tileLayer(cartoUrl, {
  // noWrap: true,
  // name: 'carto',
  // attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
// }); 

// RU tile Layer - https://qms.nextgis.com/geoservices/563/
// const ruUrl = "http://88.99.52.155/cgi-bin/tapp/tilecache.py/1.0.0/topomapper_v2/{z}/{x}/{y}.jpg"; 
// const ruAttriib = 'Tiles &copy; ATLOGIS Geoinformatics oHG';
// window.ru = L.tileLayer(ruUrl, {
    // minZoom: 10,
    // maxZoom: 13,
    // noWrap: true,
    // name: 'ruarmy',
    // attribution: ruAttriib,
// });

// Google maps layer
window.goo = L.tileLayer('http://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
      // maxZoom: 20,
      subdomains:['mt0','mt1','mt2','mt3'],
      name: 'google',
      attribution: 'Map data &copy; Google'
});
 // lyrs =
    // s: Спутник (Satellite)
    // y: Гибрид (не h)
    // m: Схема (Map)
    // p: Террейн (Terrain)
    // r: Некоторый тип схемы (Altered roadmap)





/////////////////////////////////////////////


// Инициализация карты
const map = L.map('map').setView([48.257381, 37.134785], 11);
// L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    // attribution: '© OpenStreetMap'
// }).addTo(map);
window.osm.addTo(map);


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

map.whenReady(replaceAttributionFlag);
map.on('baselayerchange', replaceAttributionFlag);

// Управление слоями карты
const baseLayers = {
    "OpenStreetMap": osm,
    // "CyclOSM": cyclosm,
    "OpenTopoMap": topo,
    "ESRI World Imagery": esri,
    // "CartoDB Voyager": carto,
    // "RU Army": ru,
    "Google Maps": goo
};

// Создаем кастомный контрол слоев
const customLayerControl = L.control.layers(baseLayers, null, {
    collapsed: true,
    position: 'topright'
}).addTo(map);

// setTimeout(() => {
    ////////Находим радио-кнопку для активного слоя
    // const activeLayerName = Object.keys(baseLayers).find(name => 
        // map.hasLayer(baseLayers[name])
    // );
    
    // if (activeLayerName) {
        // const inputId = `leaflet-base-layers-${activeLayerName.replace(/\s+/g, '-').toLowerCase()}`;
        // const radioInput = document.querySelector(`#${inputId}`);
        // if (radioInput) {
            // radioInput.checked = true;
        // }
    // }
// }, 100);


// Скрываем стандартный контрол
const layerControlContainer = customLayerControl.getContainer();
layerControlContainer.style.display = 'none';

// Создаем кнопку-иконку
const layersToggle = L.control({position: 'topright'});
layersToggle.onAdd = function(map) {
    this._div = L.DomUtil.create('div', 'leaflet-control-layers-toggle');
    const t = translations[currentLang];
    this._div.innerHTML = `<a href="#" title="${t.layersToggleTitle}"></a>`;
    return this._div;
};
layersToggle.addTo(map);




const layersToggleContainer = layersToggle.getContainer();

// Добавим логирование событий
console.log("Инициализация панели слоев...");

// Флаг для отслеживания нахождения курсора над панелью
let isHoveringPanel = false;

// Флаг для отслеживания состояния панели
let isPanelOpen = false;
let panelHovered = false;
// Флаг для отслеживания открытого состояния панели
let isLayerPanelOpen = false;
// Предотвращаем закрытие при взаимодействии с панелью
// Обработчики для отслеживания состояния наведения
// layerControlContainer.addEventListener('mouseenter', function() {
    // console.log("Курсор вошел в панель слоев");
    // isHoveringPanel = true;
// });

// layerControlContainer.addEventListener('mouseleave', function() {
    // console.log("Курсор вышел из панели слоев");
    // isHoveringPanel = false;
// });

layerControlContainer.addEventListener('mouseenter', () => {
    console.log("Курсор вошел в панель слоев");
    // panelHovered = true;
});

layerControlContainer.addEventListener('mouseleave', () => {
    console.log("Курсор вышел из панели слоев");
    // panelHovered = false;
    
    // Закрываем панель только если она была открыта и курсор ушел
    // setTimeout(() => {
        // if (isPanelOpen && !panelHovered) {
            // console.log("НЕ Автозакрытие панели после задержки");
            // closeLayerPanel();
			openLayerPanel();
        // }
    // }, 300); // Задержка перед закрытием
});

// function toggleLayerPanel() {
    // const isVisible = layerControlContainer.style.display === 'block';
    
    // if (isVisible) {
        // closeLayerPanel();
    // } else {
        // openLayerPanel();
    // }
// }

function openLayerPanel() {
    console.log("Открытие панели слоев");
    layerControlContainer.style.display = 'block';
    layerControlContainer.classList.add('leaflet-control-layers-expanded');
    layersToggleContainer.classList.add('active');
    isLayerPanelOpen = true;
}

function closeLayerPanel() {
    console.log("Закрытие панели слоев");
    layerControlContainer.style.display = 'none';
    layerControlContainer.classList.remove('leaflet-control-layers-expanded');
    layersToggleContainer.classList.remove('active');
    isLayerPanelOpen = false;
}


// Предотвращаем закрытие при клике внутри панели
layerControlContainer.addEventListener('click', function(e) {
    console.log("Клик внутри панели слоев");
    e.stopPropagation();
});

// Обработчик клика
// layersToggle.getContainer().addEventListener('click', function(e) {
    // e.preventDefault();
    // e.stopPropagation();
    
    // const isVisible = layerControlContainer.style.display === 'block';
    // layerControlContainer.style.display = isVisible ? 'none' : 'block';
    // layerControlContainer.classList.toggle('leaflet-control-layers-expanded', !isVisible);
    
    // /////Добавляем/убираем класс активности
    // this.classList.toggle('active', !isVisible);
// });
// Обработчик клика по кнопке переключения
layersToggleContainer.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    console.log("Клик по кнопке слоев");
    
    if (isLayerPanelOpen) {
        closeLayerPanel();
    } else {
        openLayerPanel();
    }
});

// Обработчик закрытия при клике вне панели
document.addEventListener('click', function(e) {
    // Пропускаем события, если панель не видима
    if (layerControlContainer.style.display !== 'block') return;
    
    const isClickOnPanel = layerControlContainer.contains(e.target);
    const isClickOnToggle = layersToggleContainer.contains(e.target);
    
    console.log(`Клик вне панели: panel=${isClickOnPanel}, toggle=${isClickOnToggle}, hover=${isHoveringPanel}`);
    
    if (!isClickOnPanel && !isClickOnToggle && !isHoveringPanel) {
        console.log("Закрытие панели слоев");
        layerControlContainer.style.display = 'none';
        layersToggleContainer.classList.remove('active');
    }
});

// обработчик для закрытия панели при выборе слоя
// layerControlContainer.addEventListener('click', function(e) {
    // e.stopPropagation();
    
    ///////////Закрываем панель при выборе слоя
    // if (e.target.tagName === 'INPUT' && e.target.type === 'radio') {
        // layerControlContainer.style.display = 'none';
        // layersToggle.getContainer().classList.remove('active');
    // }
// });

////// Закрытие при клике вне области
// map.on('click', function() {
    // if (layerControlContainer.style.display === 'block') {
        // layerControlContainer.style.display = 'none';
    // }
// });
// Обработчик клика по документу
document.addEventListener('click', function(e) {
    // Если панель не открыта, ничего не делаем
    if (!isLayerPanelOpen) return;
    
    // Проверяем, был ли клик внутри панели или по кнопке переключения
    const isClickInsidePanel = layerControlContainer.contains(e.target);
    const isClickOnToggle = layersToggleContainer.contains(e.target);
    
    console.log(`Клик вне панели: panel=${isClickInsidePanel}, toggle=${isClickOnToggle}`);
    
    // Если клик был вне панели и не по кнопке, закрываем панель
    if (!isClickInsidePanel && !isClickOnToggle) {
        closeLayerPanel();
    }
});
// Для RU слоя ограничиваем зум
map.on('baselayerchange', function(e) {
    if (e.name === "RU Army") {
        if (map.getZoom() < 10) map.setZoom(10);
        if (map.getZoom() > 13) map.setZoom(13);
    }
});

// Обработчик для выбора слоя (радио-кнопки)
layerControlContainer.addEventListener('click', function(e) {
    if (e.target.tagName === 'INPUT' && e.target.type === 'radio') {
        console.log("Выбран слой, закрываем панель через 500 мс");
        setTimeout(closeLayerPanel, 500);
    }
});
// customLayerControl.addTo(map);

//////Явно выбрать активный слой
// map.on('baselayerchange', function(e) {
//////Убедитесь, что при инициализации выбран правильный слой
// if (!window.initialLayerSet) {
	// window.osm.addTo(map); // Выберите OSM по умолчанию
	// window.initialLayerSet = true;
// }
// });








//////////////////////////////////////////////////////
// Линейка
let rulerToggle;
function initRulerControl() {
  // Создаем кнопку переключения как стандартный контрол Leaflet
  rulerToggle = L.control({ position: 'topleft' });
  
  rulerToggle.onAdd = function(map) {
    this._div = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-ruler-toggle');
    const link = L.DomUtil.create('a', 'leaflet-control-ruler-toggle-btn', this._div);
    link.href = '#';
    link.title = translations[currentLang].rulerToggleTitle;
    link.innerHTML = '📏'; // Или использовать SVG
    return this._div;
  };
  
  rulerToggle.addTo(map);

  // Обработчик клика по кнопке
  rulerToggle.getContainer().querySelector('a').addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    toggleRulerPanel();
  });
}

function toggleRulerPanel() {
  const isActive = rulerToggle.getContainer().classList.contains('active');
  
  if (isActive) {
    hideRulerPanel();
  } else {
    showRulerPanel();
  }
}

function showRulerPanel() {
    if (rulerToggle && rulerToggle.getContainer) {
        rulerToggle.getContainer().classList.add('active');
    }
    
    const measureContainer = window.measureControl && window.measureControl.getContainer();
    if (measureContainer) {
        measureContainer.style.display = 'block';
    }
}

function hideRulerPanel() {
    if (rulerToggle && rulerToggle.getContainer) {
        rulerToggle.getContainer().classList.remove('active');
    }
    
    const measureContainer = window.measureControl && window.measureControl.getContainer();
    if (measureContainer) {
        measureContainer.style.display = 'none';
    }
}



// функция для инициализации контрола измерения
function initMeasureControl() {
    const currentLang = localStorage.getItem('preferredLang') || 'ru';
    const t = translations[currentLang];
    
    const options = {
        position: 'topleft',
        unit: 'kilometres',
        clearMeasurementsOnStop: false,
        showUnitControl: true,
        backgroundColor: '#f8f8f8',
        cursor: 'crosshair',
        showClearControl: true,
        clearControlLabel: '&times;',
        popupFormat: { number: 2 },
        measureControlTitleOn: t.measureControlTitleOn,
        measureControlTitleOff: t.measureControlTitleOff,
        clearControlTitle: t.clearControlTitle,
        unitControlTitle: t.unitControlTitle,
        bearingText: currentLang === 'ru' ? 'Азимут' : 'Bearing',
        units: t.units
    };


    // Удаляем старый контрол если существует
    //if (window.measureControl) {
        //window.measureControl.remove();
        //window.measureControl = null;
    //}

    // Создаем контрол только если его еще нет
    if (!window.measureControl) {
        window.measureControl = L.control.polylineMeasure(options);
        window.measureControl.addTo(map);
    }
}

// Инициализация после создания карты
document.addEventListener('DOMContentLoaded', function() {
    initRulerControl();
    initMeasureControl(); // Инициализация линейки
    hideRulerPanel();
});

