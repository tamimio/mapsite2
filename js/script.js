// Инициализация карты
const map = L.map('map').setView([55.751244, 37.618423], 5);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
}).addTo(map);

let currentLayer = null;
let permanentLayer = null;
let currentIndex = kmlFiles.length - 1;
let preserveZoom = false;

let lastSelectedCity = null;
const citiesDropdown = document.getElementById('cities-dropdown');
const coordsInput = document.getElementById('coords-input');
let currentCenterCoordsElement = document.getElementById('current-center-coords');
let copyCoordsBtn = document.getElementById('copy-coords-btn');

// Глобальный флаг для логгирования стилей временных файлов
const LOG_TEMPORARY_STYLES = true; // Можно менять на false для отключения

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



// Вспомогательные функции для парсинга (должны быть доступны для постоянных и временных слоев)
function parseLineStyle(style) {
    const lineStyle = style.querySelector('LineStyle');
    if (!lineStyle) return null;
    
    const colorElement = lineStyle.querySelector('color');
    const rawColor = colorElement ? colorElement.textContent : null;
    const width = parseFloat(lineStyle.querySelector('width')?.textContent || '0');
    
    return {
        rawColor: rawColor,
        color: rawColor ? parseColor(rawColor) : '#3388ff',
        weight: width,
        opacity: rawColor ? parseOpacity(rawColor) : 1
    };
}

function parsePolyStyle(style) {
    const polyStyle = style.querySelector('PolyStyle');
    if (!polyStyle) return null;

    const colorElement = polyStyle.querySelector('color');
    const rawColor = colorElement ? colorElement.textContent : null;

    return {
        rawColor: rawColor,
        fillColor: rawColor ? parseColor(rawColor) : '#3388ff',
        fillOpacity: rawColor ? parseOpacity(rawColor) : 0.5
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
    const a = kmlColor.substr(0, 2);
    const b = kmlColor.substr(2, 2);
    const g = kmlColor.substr(4, 2);
    const r = kmlColor.substr(6, 2);
    return `#${r}${g}${b}`;
}

function parseOpacity(kmlColor) {
    if (!kmlColor) return 1;
    const alpha = parseInt(kmlColor.substr(0, 2), 16) / 255;
    return Number(alpha.toFixed(2));
}


window.permanentLayerGroups = []; // Храним группы слоёв

// Функция загрузки постоянных KML-слоев
async function loadPermanentKmlLayers() {
    try {
        // Проверяем наличие данных
        if (!window.permanentLayers || !Array.isArray(window.permanentLayers)) {
            console.error("window.permanentLayers не определен или не является массивом");
            return;
        }

        // Загружаем все постоянные слои
        for (const layerData of window.permanentLayers) {
            // Проверяем наличие пути
            if (!layerData.path) {
                console.error("Отсутствует путь для постоянного слоя:", layerData);
                continue;
            }
            
            const response = await fetch(layerData.path);
            if (!response.ok) {
                console.error(`Ошибка загрузки KML (${layerData.path}): ${response.status}`);
                continue;
            }
            
            const kmlText = await response.text();
            const parser = new DOMParser();
            const kmlDoc = parser.parseFromString(kmlText, "text/xml");
            
            const layerGroup = L.layerGroup();
            const styles = {};
            const styleMaps = {};
            
            // Логирование информации о слое
            console.groupCollapsed(`Permanent layer loaded: ${layerData.path}`);
            let elementCount = 0;

            // Парсинг стилей
            kmlDoc.querySelectorAll('Style').forEach(style => {
                const id = style.getAttribute('id');
                styles[id] = {
                    line: parseLineStyle(style),
                    poly: parsePolyStyle(style)
                };
            });

            // Парсинг StyleMap
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

            // Обработка Placemarks
            kmlDoc.querySelectorAll('Placemark').forEach(placemark => {
                const styleUrl = placemark.querySelector('styleUrl')?.textContent.replace('#', '');
                let style = { line: {}, poly: {} };
                
                if (styleUrl) {
                    if (styleMaps[styleUrl]) {
                        const normalStyleId = styleMaps[styleUrl].normal;
                        if (styles[normalStyleId]) {
                            style.line = styles[normalStyleId].line || {};
                            style.poly = styles[normalStyleId].poly || {};
                        }
                    } else if (styles[styleUrl]) {
                        style.line = styles[styleUrl].line || {};
                        style.poly = styles[styleUrl].poly || {};
                    }
                }

				console.groupCollapsed(`Placemark styles: ${placemark.querySelector('name')?.textContent || 'unnamed'}`);
				console.log('Style URL:', styleUrl);
				console.log('Line Style:', style.line ? {
					rawColor: style.line.rawColor, 
					parsedColor: style.line.color,
					weight: style.line.weight,
					opacity: style.line.opacity
				} : null);
				console.log('Poly Style:', style.poly ? {
					rawColor: style.poly.rawColor, 
					parsedFillColor: style.poly.fillColor,
					fillOpacity: style.poly.fillOpacity
				} : null);

                // Обработка LineString
                const lineString = placemark.querySelector('LineString');
                if (lineString) {
                    const coords = parseCoordinates(lineString);
                    if (coords.length >= 2) {
                        L.polyline(coords, {
                            color: style.line.color || '#3388ff',
                            weight: style.line.weight || 3,
                            opacity: style.line.opacity || 1
                        }).addTo(layerGroup);
                    }
                    // Логирование информации о линии
                    console.log(`LineString #${++elementCount}:`);
                    console.log(`- Raw color: ${style.line?.rawColor || 'not set'}`);
                    console.log(`- Parsed color: ${style.line?.color || 'default'}`);
                    console.log(`- Weight: ${style.line?.weight || 'default'}`);
                    console.log(`- Opacity: ${style.line?.opacity || 'default'}`);
                }

                // Обработка Polygon
                const polygon = placemark.querySelector('Polygon');
                if (polygon) {
                    const coords = parseCoordinates(polygon.querySelector('LinearRing'));
                    if (coords.length >= 3) {
                        L.polygon(coords, {
                            color: style.line.color || '#3388ff',
                            weight: style.line.weight || 0,
                            fillColor: style.poly.fillColor || '#3388ff',
                            fillOpacity: style.poly.fillOpacity || 0.5
                        }).addTo(layerGroup);
                    }
                    // Логирование информации о полигоне
                    console.log(`Polygon #${++elementCount}:`);
                    console.log(`- Raw fill color: ${style.poly?.rawColor || 'not set'}`); 
                    console.log(`- Parsed fill color: ${style.poly?.fillColor || 'default'}`);
                    console.log(`- Fill opacity: ${style.poly?.fillOpacity || 'default'}`);
                    console.log(`- Raw border color: ${style.line?.rawColor || 'not set'}`);
                    console.log(`- Parsed border color: ${style.line?.color || 'default'}`);
                    console.log(`- Border weight: ${style.line?.weight || 'default'}`);
                    console.log(`- Border opacity: ${style.line?.opacity || 'default'}`);
                }
				
                // Закрываем группу для этого Placemark
                console.groupEnd();
            });
                        
            console.log(`Total elements: ${elementCount}`);
            console.groupEnd();

            layerGroup.addTo(map);
            window.permanentLayerGroups = window.permanentLayerGroups || [];
            window.permanentLayerGroups.push(layerGroup);
        }
    } catch (error) {
        console.error("Ошибка загрузки постоянных KML:", error);
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
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
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
        
        // Добавляем логирование для временных файлов
        let elementCount = 0;
        if (LOG_TEMPORARY_STYLES) {
            console.groupCollapsed(`Temporary layer loaded: ${file.path}`);
        }

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

            // Логирование для временных файлов
            if (LOG_TEMPORARY_STYLES) {
                console.groupCollapsed(`Placemark styles: ${placemark.querySelector('name')?.textContent || 'unnamed'}`);
                console.log('Style URL:', styleUrl);
                console.log('Line Style:', style.line ? {
                    rawColor: style.line.rawColor, 
                    parsedColor: style.line.color,
                    weight: style.line.weight,
                    opacity: style.line.opacity
                } : null);
                console.log('Poly Style:', style.poly ? {
                    rawColor: style.poly.rawColor, 
                    parsedFillColor: style.poly.fillColor,
                    fillOpacity: style.poly.fillOpacity
                } : null);
            }

            // Обработка LineString
            const lineString = placemark.querySelector('LineString');
            if (lineString) {
                const coords = parseCoordinates(lineString);
                if (coords.length < 2) {
                    if (LOG_TEMPORARY_STYLES) console.groupEnd(); // Закрываем группу Placemark
                    return;
                }

                const polyline = L.polyline(coords, {
                    color: style.color || '#3388ff',
                    weight: style.weight || 3,
                    opacity: style.opacity || 1
                }).addTo(layerGroup);

                // Логирование информации о линии
                if (LOG_TEMPORARY_STYLES) {
                    console.log(`LineString #${++elementCount}:`);
                    console.log(`- Raw color: ${style.line?.rawColor || 'not set'}`);
                    console.log(`- Parsed color: ${style.line?.color || 'default'}`);
                    console.log(`- Weight: ${style.line?.weight || 'default'}`);
                    console.log(`- Opacity: ${style.line?.opacity || 'default'}`);
                }

                if (polyline.getBounds().isValid()) {
                    bounds.extend(polyline.getBounds());
                }
            }

            // Обработка Polygon
            const polygon = placemark.querySelector('Polygon');
            if (polygon) {
                const coords = parseCoordinates(polygon.querySelector('LinearRing'));
                if (coords.length < 3) {
                    if (LOG_TEMPORARY_STYLES) console.groupEnd(); // Закрываем группу Placemark
                    return;
                }

                const poly = L.polygon(coords, {
                    color: style.color || '#3388ff',
                    weight: style.weight || 3,
                    fillColor: style.fillColor || '#3388ff',
                    fillOpacity: style.fillOpacity || 0.5
                }).addTo(layerGroup);

                // Логирование информации о полигоне
                if (LOG_TEMPORARY_STYLES) {
                    console.log(`Polygon #${++elementCount}:`);
                    console.log(`- Raw fill color: ${style.poly?.rawColor || 'not set'}`); 
                    console.log(`- Parsed fill color: ${style.poly?.fillColor || 'default'}`);
                    console.log(`- Fill opacity: ${style.poly?.fillOpacity || 'default'}`);
                    console.log(`- Raw border color: ${style.line?.rawColor || 'not set'}`);
                    console.log(`- Parsed border color: ${style.line?.color || 'default'}`);
                    console.log(`- Border weight: ${style.line?.weight || 'default'}`);
                    console.log(`- Border opacity: ${style.line?.opacity || 'default'}`);
                }

                if (poly.getBounds().isValid()) {
                    bounds.extend(poly.getBounds());
                }
            }
            
            if (LOG_TEMPORARY_STYLES) console.groupEnd(); // Закрываем группу Placemark
        });

        if (LOG_TEMPORARY_STYLES) {
            console.log(`Total elements: ${elementCount}`);
            console.groupEnd(); // Закрываем группу временного слоя
        }

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
        alert(`Ошибка загрузки файла: ${file.path}\n${error.message}`);
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


async function init() {
    try {
        // Инициализируем календарь
        initDatePicker();
        
        // Загружаем постоянные слои
        await loadPermanentKmlLayers();
        
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

document.addEventListener('DOMContentLoaded', function() {
    const mapBtn = document.getElementById('map-btn');
    const stats1Btn = document.getElementById('stats1-btn');
    const stats2Btn = document.getElementById('stats2-btn');
    
    const mapContainer = document.getElementById('map-container');
    const stats1Container = document.getElementById('stats1-container');
    const stats2Container = document.getElementById('stats2-container');
    
    function switchView(activeBtn, activeContainer) {
        // Сбрасываем активное состояние у всех кнопок и контейнеров
        [mapBtn, stats1Btn, stats2Btn].forEach(btn => btn.classList.remove('active'));
        [mapContainer, stats1Container, stats2Container].forEach(container => {
            container.classList.remove('active');
            container.style.display = 'none'; // Явное скрытие
        });
        
        // Устанавливаем активное состояние
        activeBtn.classList.add('active');
        activeContainer.classList.add('active');
        activeContainer.style.display = 'block';
        
        // Для контейнера карты используем flex-раскладку
        if (activeContainer === mapContainer) {
            activeContainer.style.display = 'flex';
        }
        
        // Перерисовываем карту при возвращении на вкладку
        if (activeContainer === mapContainer && map) {
            setTimeout(() => {
                map.invalidateSize();
            }, 100);
        }
    }
    
    // Обработчики кнопок
    mapBtn.addEventListener('click', () => switchView(mapBtn, mapContainer));
    stats1Btn.addEventListener('click', () => switchView(stats1Btn, stats1Container));
    stats2Btn.addEventListener('click', () => switchView(stats2Btn, stats2Container));
});
