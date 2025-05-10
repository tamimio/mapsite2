// Инициализация карты
const map = L.map('map').setView([55.751244, 37.618423], 5);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
}).addTo(map);

// Основные KML-файлы
window.kmlFiles = [
    { name: "01.10.24", path: "kml/Line_24_10_01.kml" },
    { name: "01.11.24", path: "kml/Line_24_11_01.kml" },
    { name: "01.12.24", path: "kml/Line_24_12_01.kml" },
    { name: "01.01.25", path: "kml/Line_25_01_01.kml" }, 
    { name: "01.02.25", path: "kml/Line_25_02_01.kml" },
    { name: "01.03.25", path: "kml/Line_25_03_01.kml" },
    { name: "03.04.25", path: "kml/Line_25_04_03.kml" }
    
];

// Постоянный слой
const permanentLayerData = {
    name: "24.02.22", path: "kml/Line_start_LDNR.kml"
};

// Список городов с координатами
const cities = [
    { name: { ru: "Суджа",     en: "Sudzha"     }, lat: 51.19055,  lng: 35.27082   },
    { name: { ru: "Волчанск",  en: "Volchansk"  }, lat: 50.288107, lng: 36.946217  },
    { name: { ru: "Купянск",   en: "Kupyansk"   }, lat: 49.706396, lng: 37.616586  },
    { name: { ru: "Боровая",   en: "Borovaya"   }, lat: 49.38417,  lng: 37.62086   },
    { name: { ru: "Северск",   en: "Seversk"    }, lat: 48.868709, lng: 38.106425  },
    { name: { ru: "Часов Яр",  en: "Chasov Yar" }, lat: 48.591656, lng: 37.820354  },
    { name: { ru: "Дзержинск", en: "Dzerzhinsk" }, lat: 48.398329, lng:  37.836634 }
];

let currentLayer = null;
let permanentLayer = null;
let currentIndex = kmlFiles.length - 1;
let preserveZoom = false;

let lastSelectedCity = null;
const citiesDropdown = document.getElementById('cities-dropdown');
const coordsInput = document.getElementById('coords-input');
let currentCenterCoordsElement = document.getElementById('current-center-coords');
let copyCoordsBtn = document.getElementById('copy-coords-btn');

// Получаем массив доступных дат из kmlFiles
const availableDates = kmlFiles.map(file => file.name);

// Функция для преобразования даты из формата DD.MM.YY в объект Date
function parseCustomDate(dateStr) {
    const [day, month, year] = dateStr.split('.').map(Number);
    return new Date(2000 + year, month - 1, day);
}

// Инициализация календаря с ограничением доступных дат
let datePicker;
function initDatePicker() {
    datePicker = flatpickr("#date-picker", {
		locale: currentLang === 'ru' ? 'ru' : 'default',
        dateFormat: "d.m.y",
        allowInput: true,
        locale: currentLang, // Используем текущий язык
        defaultDate: kmlFiles[kmlFiles.length - 1].name,
        enable: [
            function(date) {
                const dateStr = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth()+1).toString().padStart(2, '0')}.${date.getFullYear().toString().slice(-2)}`;
                return availableDates.includes(dateStr);
            }
        ],
        onChange: function(selectedDates, dateStr) {
            const index = kmlFiles.findIndex(file => file.name === dateStr);
            if (index !== -1) {
                navigateTo(index);
            }
        },
        onDayCreate: function(dObj, dStr, fp, dayElem) {
            const today = new Date();
            const isToday = dayElem.dateObj.getDate() === today.getDate() && 
                           dayElem.dateObj.getMonth() === today.getMonth() && 
                           dayElem.dateObj.getFullYear() === today.getFullYear();
            
            if (isToday) {
                dayElem.classList.add('today');
            }
            
            const dateStr = `${dayElem.dateObj.getDate().toString().padStart(2, '0')}.${(dayElem.dateObj.getMonth()+1).toString().padStart(2, '0')}.${dayElem.dateObj.getFullYear().toString().slice(-2)}`;
            
            if (availableDates.includes(dateStr)) {
                dayElem.classList.add('available');
                
                if (dateStr === kmlFiles[currentIndex].name) {
                    dayElem.classList.add('selected');
                }
            }
        }
    });
}

// Функция для проверки валидности координат
function isValidCoordinate(value, isLatitude) {
    const num = parseFloat(value);
    if (isNaN(num)) return false;
    if (isLatitude) return num >= -90 && num <= 90;
    return num >= -180 && num <= 180;
}

// Функция обновления отображения текущего центра
function updateCurrentCenterDisplay() {
    const center = map.getCenter();
    currentCenterCoordsElement.textContent = `${center.lat.toFixed(6)}, ${center.lng.toFixed(6)}`;
}

// Обработчик кнопки копирования координат
copyCoordsBtn.addEventListener('click', function() {
    const coords = currentCenterCoordsElement.textContent;
    if (coords && coords !== 'не определен') {
        navigator.clipboard.writeText(coords)
            .then(() => {
                const originalText = this.textContent;
                this.textContent = 'Скопировано!';
                setTimeout(() => {
                    this.textContent = originalText;
                }, 2000);
            })
            .catch(err => {
                console.error('Ошибка копирования: ', err);
            });
    }
});

// функция заполнения списка городов
function populateCitiesDropdown() {
    // Очищаем список, кроме первого элемента
    while (citiesDropdown.options.length > 1) {
        citiesDropdown.remove(1);
    }
    
    // Добавляем города на текущем языке
    cities.forEach(city => {
        const option = document.createElement('option');
        option.value = city.name.ru; // Сохраняем русское название как значение
        option.textContent = city.name[currentLang];
        citiesDropdown.appendChild(option);
    });
}

// Функция центрирования карты по координатам
// async function centerMap(lat, lng) {
    // const currentZoom = map.getZoom();
    // map.setView([lat, lng], currentZoom);
    
    // // Обновляем поле ввода, если координаты изменились
    // if (document.getElementById('coords-input').value !== `${lat}, ${lng}`) {
        // document.getElementById('coords-input').value = `${lat}, ${lng}`;
    // }
// }

let highlightMarker = null;
let highlightTimeout = null;
let highlightAnimationInterval = null;

function centerMap(lat, lng) {
    const currentZoom = map.getZoom();
    map.setView([lat, lng], currentZoom);
    document.getElementById('coords-input').value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

    // Очищаем предыдущие элементы анимации
    if (highlightMarker) {
        map.removeLayer(highlightMarker);
        highlightMarker = null;
    }
    if (highlightAnimationInterval) {
        clearInterval(highlightAnimationInterval);
    }
    if (highlightTimeout) {
        clearTimeout(highlightTimeout);
    }

    // Параметры анимации
    const startRadius = 10000; // Начальный радиус 2 км
    const endRadius = 200;    // Конечный радиус 200 м
    const duration = 2500;    // Длительность анимации 2 секунды
    const steps = 100;         // Количество шагов анимации

    // Создаем временный маркер
    highlightMarker = L.circle([lat, lng], {
        color: '#ff4444',
        fillColor: '#ff7777',
        fillOpacity: 0.3,
        radius: startRadius
    }).addTo(map);

    // Анимация уменьшения
    let currentStep = 0;
    highlightAnimationInterval = setInterval(() => {
        currentStep++;
        const progress = currentStep / steps;
        const currentRadius = startRadius - (startRadius - endRadius) * progress;
        
        highlightMarker.setRadius(currentRadius);
        
        if (currentStep >= steps) {
            clearInterval(highlightAnimationInterval);
        }
    }, duration / steps);

    // Удаление через 5 секунд
    highlightTimeout = setTimeout(() => {
        map.removeLayer(highlightMarker);
        highlightMarker = null;
    }, 5000);
}

// Загрузка постоянного KML-слоя
async function loadPermanentKml() {
    try {
        const layer = await omnivore.kml(permanentLayerData.path);
        layer.eachLayer(function(featureLayer) {
            if (featureLayer.setStyle) {
                featureLayer.setStyle(window.permanentLayerStyle);
            }
        });
        
        permanentLayer = layer;
        permanentLayer.addTo(map);
    } catch (error) {
        console.error("Ошибка загрузки постоянного KML:", error);
    }
}

// Функция загрузки основного KML (с сохранением оригинальных стилей)
async function loadKmlFile(file) {
    if (currentLayer) {
        map.removeLayer(currentLayer);
    }

    const currentCenter = map.getCenter();
    const currentZoom = map.getZoom();

    try {
        const response = await fetch(file.path);
        const kmlText = await response.text();
        const parser = new DOMParser();
        const kmlDoc = parser.parseFromString(kmlText, "text/xml");

        const layerGroup = L.layerGroup().addTo(map);
        currentLayer = layerGroup;

        // Парсим все стили (включая StyleMap)
        const styles = {};
        const styleMaps = {};

        // Обрабатываем обычные стили
        kmlDoc.querySelectorAll('Style').forEach(style => {
            const id = style.getAttribute('id');
            styles[id] = {
                line: parseLineStyle(style),
                poly: parsePolyStyle(style)
            };
        });

        // Обрабатываем StyleMap
        kmlDoc.querySelectorAll('StyleMap').forEach(styleMap => {
            const id = styleMap.getAttribute('id');
            const pairs = {};
            styleMap.querySelectorAll('Pair').forEach(pair => {
                const key = pair.querySelector('key').textContent;
                const styleUrl = pair.querySelector('styleUrl').textContent.replace('#', '');
                pairs[key] = styleUrl;
            });
            styleMaps[id] = pairs;
        });

        let bounds = L.latLngBounds(); // Инициализация пустыми границами
		// let bounds = null;

		kmlDoc.querySelectorAll('Placemark').forEach(placemark => {
			// Получаем стиль для Placemark
			const styleUrl = placemark.querySelector('styleUrl')?.textContent.replace('#', '');
			let style = { line: {}, poly: {} };
			
			if (styleUrl) {
				// Проверяем StyleMap
				if (styleMaps[styleUrl]) {
					const normalStyleId = styleMaps[styleUrl].normal;
					style = Object.assign(
						{}, 
						styles[normalStyleId]?.line || {},
						styles[normalStyleId]?.poly || {}
					);
				} 
				// Проверяем обычный стиль
				else if (styles[styleUrl]) {
					style = Object.assign(
						{}, 
						styles[styleUrl].line || {},
						styles[styleUrl].poly || {}
					);
				}
			}

			// Обработка LineString
			const lineString = placemark.querySelector('LineString');
			if (lineString) {
				const coords = parseCoordinates(lineString);
				if (coords.length < 2) return;

				const polyline = L.polyline(coords, {
					color: style.color || '#3388ff',
					weight: style.weight || 3,
					opacity: style.opacity || 1
				}).addTo(layerGroup);

				if (polyline.getBounds().isValid()) {
					bounds.extend(polyline.getBounds());
				}
			}

			// Обработка Polygon
			const polygon = placemark.querySelector('Polygon');
			if (polygon) {
				const coords = parseCoordinates(polygon.querySelector('LinearRing'));
				if (coords.length < 3) return;

				const poly = L.polygon(coords, {
					color: style.color || '#3388ff',
					weight: style.weight || 3,
					fillColor: style.fillColor || '#3388ff',
					fillOpacity: style.fillOpacity || 0.5
				}).addTo(layerGroup);

				if (poly.getBounds().isValid()) {
					bounds.extend(poly.getBounds());
				}
			}
		});

		if (bounds.isValid()) {
			const sw = bounds.getSouthWest();
			const ne = bounds.getNorthEast();
			const isNotPoint = sw.lat !== ne.lat || sw.lng !== ne.lng;
			
			if (!preserveZoom && isNotPoint) {
				map.fitBounds(bounds);
			} else {
				map.setView(currentCenter, currentZoom);
			}
		} else {
			map.setView(currentCenter, currentZoom);
		}
		preserveZoom = true;
    } catch (error) {
        console.error("Ошибка загрузки KML:", error);
    }

    // Вспомогательные функции
    function parseLineStyle(style) {
        const lineStyle = style.querySelector('LineStyle');
        if (!lineStyle) return null;
        
        return {
            color: parseColor(lineStyle.querySelector('color')?.textContent || '#3388ff'),
            weight: parseFloat(lineStyle.querySelector('width')?.textContent || '3'),
            opacity: parseOpacity(lineStyle.querySelector('color')?.textContent)
        };
    }

    function parsePolyStyle(style) {
        const polyStyle = style.querySelector('PolyStyle');
        if (!polyStyle) return null;

        return {
            fillColor: parseColor(polyStyle.querySelector('color')?.textContent || '#3388ff'),
            fillOpacity: parseOpacity(polyStyle.querySelector('color')?.textContent)
        };
    }

    function parseCoordinates(element) {
        const coordinates = element?.querySelector('coordinates')?.textContent;
        if (!coordinates) return [];
        
        return coordinates
            .trim()
            .split(/\s+/)
            .map(coord => {
                const [lng, lat] = coord.split(',').map(Number);
                return [lat, lng];
            });
    }

    function parseColor(kmlColor) {
        if (!kmlColor) return '#3388ff';
        // Конвертация ABGR в RGBA (пример: ff0000ff -> #ff0000)
        const a = kmlColor.substr(0, 2);
        const b = kmlColor.substr(2, 2);
        const g = kmlColor.substr(4, 2);
        const r = kmlColor.substr(6, 2);
        return `#${r}${g}${b}`;
    }

    function parseOpacity(kmlColor) {
        if (!kmlColor) return 1;
        const alpha = parseInt(kmlColor.substr(0, 2), 16) / 255;
        return alpha.toFixed(2);
    }

    function updateBounds(layer) {
        if (layer.getBounds) {
            bounds = bounds ? bounds.extend(layer.getBounds()) : layer.getBounds();
        }
    }
}

// Навигация к определенному индексу
async function navigateTo(index) {
    if (index < 0 || index >= kmlFiles.length) return;
    
    currentIndex = index;
    const file = kmlFiles[currentIndex];
    
    // Обновляем календарь
    datePicker.setDate(file.name, false);
    
    // Загружаем файл
    await loadKmlFile(file);
    
    // Обновляем состояние кнопок
    updateButtons();
}

// Обновление состояния кнопок
function updateButtons() {
    document.getElementById('first-btn').disabled = currentIndex === 0;
    document.getElementById('prev-btn').disabled = currentIndex === 0;
    document.getElementById('next-btn').disabled = currentIndex === kmlFiles.length - 1;
    document.getElementById('last-btn').disabled = currentIndex === kmlFiles.length - 1;
}

// Обработчики кнопок навигации
document.getElementById('first-btn').addEventListener('click', async () => {
    await navigateTo(0).catch(console.error);
});

document.getElementById('prev-btn').addEventListener('click', async () => {
    await navigateTo(currentIndex - 1).catch(console.error);
});

document.getElementById('next-btn').addEventListener('click', async () => {
    await navigateTo(currentIndex + 1).catch(console.error);
});

document.getElementById('last-btn').addEventListener('click', async () => {
    await navigateTo(kmlFiles.length - 1).catch(console.error);
});


// Обработчик ввода координат
coordsInput.addEventListener('change', function() {
    const coords = this.value.split(',').map(coord => coord.trim());
    
    if (coords.length === 2) {
        const lat = parseFloat(coords[0]);
        const lng = parseFloat(coords[1]);
        
        if (!isNaN(lat) && !isNaN(lng)) {
            centerMap(lat, lng);
        }
    }
});





// Заполнение выпадающего списка городов
// Обработчик выбора города
document.getElementById('cities-dropdown').addEventListener('change', async function() {
    const selectedCityName = this.value;
    if (!selectedCityName) return;
    
    const city = cities.find(c => c.name.ru === selectedCityName);
    if (city) {
        document.getElementById('coords-input').value = `${city.lat}, ${city.lng}`;
        centerMap(city.lat, city.lng);
        this.value = "";
    }
});

// Обработчик выбора города

citiesDropdown.addEventListener('change', function() {
    const selectedCityName = this.value;
    if (!selectedCityName) return;
    
    const city = cities.find(c => c.name === selectedCityName);
    if (city) {
        // Заполняем поле координат
        coordsInput.value = `${city.lat}, ${city.lng}`;
        centerMap(city.lat, city.lng);
        
        // Сбрасываем выбор
        this.value = "";
    }
});

// Обработчик кнопки копирования координат
copyCoordsBtn.addEventListener('click', function() {
    const coords = currentCenterCoordsElement.textContent;
    if (coords && coords !== 'не определен') {
        navigator.clipboard.writeText(coords)
            .then(() => {
                const originalText = this.textContent;
                this.textContent = 'Скопировано!';
                setTimeout(() => {
                    this.textContent = originalText;
                }, 2000);
            })
            .catch(err => {
                console.error('Ошибка копирования: ', err);
            });
    }
});

// обработчик перемещения карты
map.on('moveend', function() {
    updateCurrentCenterDisplay();
});


//////////////////////// язык

// Добавьте объект с переводами
const translations = {
    ru: {
        title: "  dataviewer",
        centerLabel: "Центрировать на:",
        coordsPlaceholder: "Широта, Долгота (например: 55.7558, 37.6173)",
        selectCity: "Выберите город",
        currentCenter: "Текущий центр: ",
        undefinedCoords: "не определен",
        copyTooltip: "Копировать координаты",
        firstBtnTitle: "Первый",
        prevBtnTitle: "Предыдущий",
        nextBtnTitle: "Следующий",
        lastBtnTitle: "Последний"
    },
    en: {
        title: "  dataviewer",
        centerLabel: "Center on:",
        coordsPlaceholder: "Latitude, Longitude (e.g.: 55.7558, 37.6173)",
        selectCity: "Select city",
        currentCenter: "Current center: ",
        undefinedCoords: "undefined",
        copyTooltip: "Copy coordinates",
        firstBtnTitle: "First",
        prevBtnTitle: "Previous",
        nextBtnTitle: "Next",
        lastBtnTitle: "Last"
    }
};

let currentLang = 'ru'; // По умолчанию русский

// Функция переключения языка
function setLanguage(lang) {
    currentLang = lang;
    const t = translations[lang];
    
    // Обновляем текст элементов
    document.getElementById('page-title').textContent = t.title;
    // document.getElementById('main-title').textContent = t.title;
    document.getElementById('center-label').textContent = t.centerLabel;
    document.getElementById('coords-input').placeholder = t.coordsPlaceholder;
    document.getElementById('select-city-default').textContent = t.selectCity;
    document.getElementById('current-center-label').textContent = t.currentCenter;
    document.getElementById('copy-coords-btn').title = t.copyTooltip;
    
    // Обновляем кнопки навигации
    document.getElementById('first-btn').title = t.firstBtnTitle;
    document.getElementById('prev-btn').title = t.prevBtnTitle;
    document.getElementById('next-btn').title = t.nextBtnTitle;
    document.getElementById('last-btn').title = t.lastBtnTitle;
    
    // Обновляем кнопки языка
    document.getElementById('lang-ru').title = lang === 'ru' ? "Уже Русский" : "Переключить на Русский";
    document.getElementById('lang-en').title = lang === 'en' ? "Already English" : "Switch to English";
    
    // Обновляем классы активности
    document.getElementById('lang-ru').classList.toggle('active', lang === 'ru');
    document.getElementById('lang-en').classList.toggle('active', lang === 'en');
    
    // Обновляем список городов
    populateCitiesDropdown();
	    
    // Пересоздаем календарь с новым языком
    if (datePicker) {
        datePicker.destroy();
    }
    initDatePicker();
    
    // Если координаты не определены, обновляем текст
    if (document.getElementById('current-center-coords').textContent === 'не определен' || 
        document.getElementById('current-center-coords').textContent === 'undefined') {
        document.getElementById('current-center-coords').textContent = t.undefinedCoords;
    }
}

// Обработчики кнопок переключения языка
document.getElementById('lang-ru').addEventListener('click', () => {
    if (currentLang !== 'ru') setLanguage('ru');
});

document.getElementById('lang-en').addEventListener('click', () => {
    if (currentLang !== 'en') setLanguage('en');
});

async function init() {
    try {
        // Инициализируем календарь
        initDatePicker();
		
        // Загружаем постоянный слой
        await loadPermanentKml();
        
        // Загружаем последний файл по умолчанию
        preserveZoom = false;
        await navigateTo(kmlFiles.length - 1);        
        
        // Устанавливаем русский язык по умолчанию
        setLanguage('ru');
    } catch (error) {
        console.error("Ошибка инициализации:", error);
    }
}

// Инициализация при загрузке
// document.addEventListener('DOMContentLoaded', () => {
    // init();
// });
document.addEventListener('DOMContentLoaded', init);