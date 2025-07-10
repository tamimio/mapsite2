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
citiesDropdown = document.getElementById('cities-dropdown');
coordsInput = document.getElementById('coords-input');
currentCenterCoordsElement = document.getElementById('current-center-coords');
copyCoordsBtn = document.getElementById('copy-coords-btn');

let selectedDate = null; // Глобальная переменная для хранения текущей даты

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
    // Используем сохраненную дату или последнюю доступную
    const defaultDate = selectedDate || kmlFiles[kmlFiles.length - 1].name;
    
    datePicker = flatpickr("#date-picker", {
        locale: currentLang === 'ru' ? 'ru' : 'default',
        dateFormat: "d.m.y",
        allowInput: true,
        defaultDate: defaultDate, // Используем сохраненную дату
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
    // Проверка на доступность карты
    if (!map || !map.getCenter || !currentCenterCoordsElement) return;
    
    const center = map.getCenter();
    if (center.lat === 0 && center.lng === 0) return; // Игнорируем нулевые координаты
    
	// обновление лейбла
    currentCenterCoordsElement.textContent =
        `${center.lat.toFixed(6)}, ${center.lng.toFixed(6)}`;
		
    // Обновляем клон лейбла для дартс-меню
    const cloneCoords = document.getElementById('current-center-coords-clone');
    if (cloneCoords) {
        cloneCoords.textContent = `${center.lat.toFixed(6)}, ${center.lng.toFixed(6)}`;
    }
}

// функция заполнения списка городов
function populateCitiesDropdown() {
    // Проверяем, что элемент существует
    if (!citiesDropdown) {
        console.error("Элемент cities-dropdown не найден");
        return;
    }
    
    // Очищаем список, кроме первого элемента
    while (citiesDropdown.options.length > 1) {
        citiesDropdown.remove(1);
    }
    
    // Проверяем наличие данных о городах
    if (!cities || !cities.length) {
        console.error("Данные о городах отсутствуют");
        return;
    }
    
    // Добавляем города на текущем языке
    cities.forEach(city => {
        const option = document.createElement('option');
        option.value = city.name.ru; // Сохраняем русское название как значение
        option.textContent = city.name[currentLang] || city.name.ru;
        citiesDropdown.appendChild(option);
    });
}

// Функция центрирования карты по координатам
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
	
	
	// Явно обновляем лейблы текущих координат
    document.getElementById('current-center-coords').textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    
    const cloneCoords = document.getElementById('current-center-coords-clone');
    if (cloneCoords) {
        cloneCoords.textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
		
    // Обновляем поля ввода координат
    const coordValue = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    
    // Основное поле ввода
    const coordsInput = document.getElementById('coords-input');
    if (coordsInput) coordsInput.value = coordValue;
    
    // Клон поля ввода для дартс-меню
    const coordsClone = document.getElementById('coords-input-clone');
    if (coordsClone) coordsClone.value = coordValue;
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
        console.log("Начало загрузки постоянных слоев");
        
        if (!window.permanentLayers || !Array.isArray(window.permanentLayers)) {
            console.error("window.permanentLayers не определен или не является массивом");
            return;
        }
        
        console.log("Найдено постоянных слоев:", window.permanentLayers.length);

        // Удаляем старые постоянные слои
        if (window.permanentLayerGroups && window.permanentLayerGroups.length) {
            window.permanentLayerGroups.forEach(layer => map.removeLayer(layer));
            window.permanentLayerGroups = [];
        }

        for (const layerData of window.permanentLayers) {
            if (!layerData.path) {
                console.error("Отсутствует путь для постоянного слоя:", layerData);
                continue;
            }
            
            console.log("Загрузка постоянного слоя:", layerData.path);
            
            try {
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
                
                console.groupCollapsed(`Permanent layer loaded: ${layerData.path}`);
                let elementCount = 0;
                let bounds = L.latLngBounds(); // Инициализация границ для этого слоя

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
                            const polyline = L.polyline(coords, {
                                color: style.line.color || '#3388ff',
                                weight: style.line.weight || 3,
                                opacity: style.line.opacity || 1
                            }).addTo(layerGroup);
                            
                            // Обновляем границы СРАЗУ ПОСЛЕ СОЗДАНИЯ
                            if (polyline.getBounds && polyline.getBounds().isValid()) {
                                bounds.extend(polyline.getBounds());
                            }
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
                            const poly = L.polygon(coords, {
                                color: style.line.color || '#3388ff',
                                weight: style.line.weight || 0,
                                fillColor: style.poly.fillColor || '#3388ff',
                                fillOpacity: style.poly.fillOpacity || 0.5
                            }).addTo(layerGroup);
                            
                            // Обновляем границы СРАЗУ ПОСЛЕ СОЗДАНИЯ
                            if (poly.getBounds && poly.getBounds().isValid()) {
                                bounds.extend(poly.getBounds());
                            }
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
                
                // Применяем границы только если они валидны
                if (bounds.isValid()) {
                    map.fitBounds(bounds);
                }
            } catch (error) {
                console.error(`Ошибка обработки слоя ${layerData.path}:`, error);
            }
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
    
    try {
        currentIndex = index;
        const file = kmlFiles[currentIndex];
        selectedDate = file.name; // Сохраняем выбранную дату
        
        if (datePicker) {
            // Обновляем дату без триггера события onChange
            datePicker.setDate(selectedDate, false);
        }
        
        await loadKmlFile(file);
    } catch (error) {
        console.error("Ошибка навигации:", error);
    } finally {
        // Гарантированно обновляем кнопки даже при ошибках
        updateButtons();
    }
}

// Обновление состояния кнопок
function updateButtons() {
    console.log(`Updating buttons for index: ${currentIndex} of ${kmlFiles.length - 1}`);
    const firstBtn = document.getElementById('first-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const lastBtn = document.getElementById('last-btn');
    
    if (!firstBtn || !prevBtn || !nextBtn || !lastBtn) return;
    
    const isFirst = currentIndex === 0;
    const isLast = currentIndex === kmlFiles.length - 1;
    
    firstBtn.disabled = isFirst;
    prevBtn.disabled = isFirst;
    nextBtn.disabled = isLast;
    lastBtn.disabled = isLast;
    
    firstBtn.classList.toggle('disabled', isFirst);
    prevBtn.classList.toggle('disabled', isFirst);
    nextBtn.classList.toggle('disabled', isLast);
    lastBtn.classList.toggle('disabled', isLast);
    
    console.log(`First: ${firstBtn.disabled}, Prev: ${prevBtn.disabled}, Next: ${nextBtn.disabled}, Last: ${lastBtn.disabled}`);
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






// Заполнение выпадающего списка городов
// Обработчик выбора города
document.getElementById('cities-dropdown').addEventListener('change', async function() {
    const selectedCityName = this.value;
    if (!selectedCityName) return;
    
    const city = cities.find(c => c.name.ru === selectedCityName);
    if (city) {
        // Обновляем все поля ввода
        const coordsInput = document.getElementById('coords-input');
        const coordsClone = document.getElementById('coords-input-clone');
        
        if (coordsInput) coordsInput.value = `${city.lat}, ${city.lng}`;
        if (coordsClone) coordsClone.value = `${city.lat}, ${city.lng}`;
        
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

// обработчик перемещения карты
map.on('moveend', function() {
    updateCurrentCenterDisplay();
});

// Функция для установки обработчика копирования
function setupCopyCoordsButton() {
    function copyHandler(event) {
        // Определяем, из какого контекста вызвано копирование
        const isClone = event.target.id === 'copy-coords-btn-clone';
        
        let coordsElement;
        if (isClone) {
            coordsElement = document.getElementById('current-center-coords-clone');
        } else {
            coordsElement = document.getElementById('current-center-coords');
        }
        
        if (!coordsElement) return;
        
        const coords = coordsElement.textContent;
        if (!coords || coords.includes('не определен') || coords.includes('undefined')) {
            return;
        }
        
        const button = event.target;
        const t = translations[currentLang];
        
        try {
            // Создаем временный элемент для копирования
            const textArea = document.createElement('textarea');
            textArea.value = coords;
            textArea.style.position = 'fixed';
            textArea.style.opacity = 0;
            document.body.appendChild(textArea);
            textArea.select();
            
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            
            // Визуальная обратная связь
            button.textContent = t ? t.copiedText : '✓ Скопировано!';
            button.classList.add('copied');
            
            setTimeout(() => {
                if (button.dataset.originalText) {
                    button.textContent = button.dataset.originalText;
                }
                button.classList.remove('copied');
            }, 2000);
            
            if (!successful) {
                throw new Error('Copy command failed');
            }
        } catch (err) {
            console.error('Ошибка копирования:', err);
            button.textContent = t ? t.copyError : 'Ошибка!';
            setTimeout(() => {
                if (button.dataset.originalText) {
                    button.textContent = button.dataset.originalText;
                }
                button.classList.remove('copied');
            }, 2000);
        }
    }

    // Для основной кнопки
    const mainCopyBtn = document.getElementById('copy-coords-btn');
    if (mainCopyBtn) {
        // Сохраняем исходный текст
        mainCopyBtn.dataset.originalText = mainCopyBtn.textContent;
        mainCopyBtn.removeEventListener('click', copyHandler);
        mainCopyBtn.addEventListener('click', copyHandler);
    }
    
    // Для кнопки в дартс-меню
    const cloneCopyBtn = document.getElementById('copy-coords-btn-clone');
    if (cloneCopyBtn) {
        // Сохраняем исходный текст
        cloneCopyBtn.dataset.originalText = cloneCopyBtn.textContent;
        cloneCopyBtn.removeEventListener('click', copyHandler);
        cloneCopyBtn.addEventListener('click', copyHandler);
    }
}


async function init() {
  try {
    // Шаг 1: Загружаем постоянные слои
    await loadPermanentKmlLayers();
    
    // Шаг 2: Инициализируем основные компоненты UI
    initDatePicker();    
    selectedDate = kmlFiles[kmlFiles.length - 1].name; // Инициализируем selectedDate последней доступной датой
    populateCitiesDropdown();
    document.querySelector('.date-navigator-wrapper').style.display = 'block';
        
    // Шаг 3: Ждем когда все элементы интерфейса будут доступны
    await waitForUIElements();
    
    // Шаг 4: Загружаем данные карты
    preserveZoom = false;
    currentIndex = kmlFiles.length - 1;
    await navigateTo(currentIndex);
    
    // Шаг 5: Финализируем инициализацию карты
    setTimeout(() => {
      if (map) map.invalidateSize();
      updateCurrentCenterDisplay();
    }, 50);
	
	//
	// Настройка кнопки после инициализации элементов
    setTimeout(() => {
        setupCopyCoordsButton();
    }, 500);
    
    // Инициализация дартс-меню
    initDartMenu(); 
    
  } catch (error) {
    console.error('Ошибка инициализации:', error);
  }
}

// Новая функция для ожидания готовности UI элементов
function waitForUIElements() {
  return new Promise(resolve => {
    const checkElements = () => {
      // Проверяем наличие всех необходимых элементов
      const elementsReady = 
        document.getElementById('first-btn') &&
        document.getElementById('prev-btn') &&
        document.getElementById('next-btn') &&
        document.getElementById('last-btn') &&
        document.querySelector('.date-navigator-wrapper');
        
      if (elementsReady) {
        resolve();
      } else {
        setTimeout(checkElements, 50);
      }
    };
    
    checkElements();
  });
}


document.addEventListener('DOMContentLoaded', init);

function switchMapStatViewByBtn(mapBtn, stats1Btn, stats2Btn)
{
    const mapContainer = document.getElementById('map-container');
    const stats1Container = document.getElementById('stats1-container');
    const stats2Container = document.getElementById('stats2-container');
    
    function switchView(activeBtn, activeContainer) {
        // Сбрасываем активное состояние у всех кнопок и контейнеров
        [mapBtn, stats1Btn, stats2Btn].forEach(btn => btn.classList.remove('active'));
        [mapContainer, stats1Container, stats2Container].forEach(container => {
            container.classList.remove('active');
            container.style.display = 'none';
        });
        
        // Устанавливаем активное состояние
        activeBtn.classList.add('active');
        activeContainer.classList.add('active');
        activeContainer.style.display = 'block';
        
        // Для контейнера карты используем flex-раскладку
        if (activeContainer === mapContainer) {
            activeContainer.style.display = 'flex';
        }
        
        // Показываем/скрываем date-navigator в зависимости от активной вкладки
        const dateNavigatorWrapper = document.querySelector('.date-navigator-wrapper');
        if (activeContainer === mapContainer) {
            dateNavigatorWrapper.style.display = 'block';
        } else {
            dateNavigatorWrapper.style.display = 'none';
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
}

document.addEventListener('DOMContentLoaded', function() {
    const mapBtn = document.getElementById('map-btn');
    const stats1Btn = document.getElementById('stats1-btn');
    const stats2Btn = document.getElementById('stats2-btn');
    
    switchMapStatViewByBtn(mapBtn, stats1Btn, stats2Btn);
    
});
document.addEventListener('DOMContentLoaded', function() {
    const mapBtn = document.getElementById('map-btn-desktop');
    const stats1Btn = document.getElementById('stats1-btn-desktop');
    const stats2Btn = document.getElementById('stats2-btn-desktop');
    
    switchMapStatViewByBtn(mapBtn, stats1Btn, stats2Btn);
    
});

// Обработчик изменения языка
document.addEventListener('languageChanged', function(event) {
    currentLang = event.detail;
    if (datePicker) {
        datePicker.destroy();
    }
        initDatePicker();
	
    populateCitiesDropdown(); // Обновляем основной список
    initDartMenu(); // Перестраиваем дартс-меню
});

// Закрываем меню при клике на карту
document.getElementById('map').addEventListener('click', function() {
    if (window.innerWidth <= 768) {
        document.querySelector('.nav-wrapper').classList.remove('active');
    }
});

// Добавляем обработчик изменения размера окна
window.addEventListener('resize', function() {
  if (map) {
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }
});

// При инициализации карты добавляем обработчик для перерисовки
map.whenReady(function() {
  setTimeout(() => {
    map.invalidateSize();
  }, 100);
});

// обработчик для обновления координат при полной загрузке карты
map.whenReady(function() {
    // Обновляем координаты центра после полной загрузки карты
    updateCurrentCenterDisplay();
    
    // Добавляем периодическую проверку на случай, 
    // если карта полностью инициализируется с небольшой задержкой
    const checkInterval = setInterval(() => {
        if (map.getCenter().lat !== 0) {
            updateCurrentCenterDisplay();
            clearInterval(checkInterval);
        }
    }, 100);
});


// Обработчик для поля ввода координат
coordsInput.addEventListener('change', function() {
    const coords = this.value.split(',').map(coord => coord.trim());
    if (coords.length === 2) {
        const lat = parseFloat(coords[0]);
        const lng = parseFloat(coords[1]);
        if (!isNaN(lat) && !isNaN(lng)) {
            centerMap(lat, lng);
            
            // Синхронизируем значение во всех клонах
            document.querySelectorAll('#coords-input').forEach(input => {
                if (input !== this) {
                    input.value = this.value;
                }
            });
        }
    }
});

// обработчик для нажатия Enter в поле ввода
coordsInput.addEventListener('keypress', function(e) {
  // if (e.key === 'Enter') {
    // const coords = this.value.split(',').map(coord => coord.trim());
    // if (coords.length === 2) {
      // const lat = parseFloat(coords[0]);
      // const lng = parseFloat(coords[1]);
      // if (!isNaN(lat) && !isNaN(lng)) {
        // centerMap(lat, lng);
      // }
    // }
  // }
	if (e.key === 'Enter') {
		this.dispatchEvent(new Event('change'));
    }
});

// Гамбургер переключатель видов

//document.addEventListener('DOMContentLoaded', function() {
    //const viewMenuBtn = document.querySelector('.view-menu-btn');
    //const viewMenuContainer = document.querySelector('.view-menu-container');
    
    //if (viewMenuBtn && viewMenuContainer) {
        //// Обработчик открытия/закрытия меню видов
        //viewMenuBtn.addEventListener('click', function(e) {
            //e.stopPropagation();
            //viewMenuContainer.classList.toggle('active');
        //});
        
        //// Закрытие меню при клике вне его
        //document.addEventListener('click', function(e) {
            //if (!viewMenuContainer.contains(e.target)) {
                //viewMenuContainer.classList.remove('active');
            //}
        //});
        
        //// Закрытие меню при выборе вида
        //document.querySelectorAll('.view-dropdown .view-btn').forEach(btn => {
            //btn.addEventListener('click', function() {
                //viewMenuContainer.classList.remove('active');
                
                //// Перерисовываем карту при необходимости
                //if (map && this.id === 'map-btn') {
                    //setTimeout(() => map.invalidateSize(), 100);
                //}
            //});
        //});
    //}
//});
document.querySelectorAll('.view-menu-container').forEach(container => {
    const viewMenuBtn = container.querySelector('.view-menu-btn');
    
    viewMenuBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        container.classList.toggle('active');
    });

    document.addEventListener('click', function(e) {
        if (!container.contains(e.target)) {
            container.classList.remove('active');
        }
    });

    container.querySelectorAll('.view-dropdown .view-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            container.classList.remove('active');
            if (map && this.id.includes('map-btn')) {
                setTimeout(() => map.invalidateSize(), 100);
            }
        });
    });
});


//////////////////////////////////////////////////////////////////////

const navDropdown = document.getElementById('nav-dropdown');
const navMenuToggle = document.getElementById('nav-menu-toggle');
const hideableItems = document.querySelectorAll('.hideable-nav-item');
clonedItems = [];
// Дартс (Лупа)
function initDartMenu() {
    console.log("[initDartMenu] Инициализация дартс-меню...");
    
    if (!navMenuToggle || !navDropdown) return;

    navMenuToggle.style.display = 'flex';
    console.log(`[initDartMenu] Найдено ${hideableItems.length} элементов с классом 'hideable-nav-item'`);
    
    // Очищаем предыдущие клоны
    navDropdown.innerHTML = '';
    clonedItems = [];
    
    // Клонируем только необходимые элементы
    const elementsToClone = [
        'centerOn-label',
        'coords-input',
        'cities-dropdown',
        'currentCenter-label',
        'current-center-coords',
        'copy-coords-btn'
    ];
    
    // Создаем контейнер для элементов меню
    const container = document.createElement('div');
    container.className = 'dropdown-items-container';
    
    elementsToClone.forEach(id => {
        const original = document.getElementById(id);
        if (!original) return;
        
        const clone = original.cloneNode(true);
        clone.id = `${id}-clone`;
        clone.classList.add('dropdown-item');
        
        // Удаляем классы, которые могут конфликтовать
        clone.classList.remove('hideable-nav-item');
        
        // Очищаем инлайновые стили
        clone.style.cssText = '';
        
        container.appendChild(clone);
        clonedItems.push(clone);
    });
    
    navDropdown.appendChild(container);
    console.log(`[initDartMenu] В nav-dropdown добавлено ${clonedItems.length} элементов`);

	setupCopyCoordsButton(); // Повторная инициализация обработчиков копирования

    // Добавляем обработчики для клонированных элементов
    setupDropdownListeners();
    
    // Обработчик изменения размера окна
    function handleResize() {
        if (window.innerWidth < 1800) {
            hideableItems.forEach(item => item.style.display = 'none');
            navMenuToggle.style.display = 'flex';
        } else {
            hideableItems.forEach(item => item.style.display = 'flex');
            navMenuToggle.style.display = 'none';
            navDropdown.classList.remove('active');
        }
    }
    
    window.addEventListener('resize', handleResize);
    handleResize();
	
    // Синхронизируем состояние при инициализации
    syncDropdownState();
}

    // Синхронизация состояния
function syncDropdownState() {
    // Координаты
    const originalCoords = document.getElementById('current-center-coords');
    const cloneCoords = document.getElementById('current-center-coords-clone');
    if (originalCoords && cloneCoords) {
        cloneCoords.textContent = originalCoords.textContent;
    }

    // Поле ввода координат
    const originalInput = document.getElementById('coords-input');
    const cloneInput = document.getElementById('coords-input-clone');
    if (originalInput && cloneInput) {
        cloneInput.value = originalInput.value;
    }

    // Выпадающий список городов
    const originalDropdown = document.getElementById('cities-dropdown');
    const cloneDropdown = document.getElementById('cities-dropdown-clone');
    if (originalDropdown && cloneDropdown) {
        cloneDropdown.value = originalDropdown.value;
    }
}
    

// Обработчики для клонов в выпадающем меню
navDropdown.querySelectorAll('input, select').forEach(clone => {
	clone.addEventListener('change', function() {
		// Находим соответствующий оригинальный элемент по индексу
		const index = Array.from(navDropdown.children).indexOf(this.parentElement);
		if (index === -1) return;
		
		const original = hideableItems[index];
		if (!original) return;
		
		// Обновляем оригинальный элемент
		if (this.tagName === 'INPUT') {
			const origInput = original.querySelector('input');
			if (origInput) {
				origInput.value = this.value;
				
				// Для координат - центрируем карту
				if (origInput.id === 'coords-input') {
					const coords = this.value.split(',').map(coord => parseFloat(coord.trim()));
					if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
						centerMap(coords[0], coords[1]);
					}
				}
			}
		}
		else if (this.tagName === 'SELECT') {
			const origSelect = original.querySelector('select');
			if (origSelect) {
				origSelect.value = this.value;
				
				// Для выпадающего списка городов
				const city = cities.find(c => c.name[currentLang] === this.value);
				if (city) {
					centerMap(city.lat, city.lng);
				}
			}
		}
	});
});

// Обработчик для кнопки копирования в меню
navDropdown.querySelectorAll('.copy-coords-btn').forEach(btn => {
	btn.addEventListener('click', function() {
		const coordsElement = this.closest('.current-center')?.querySelector('.current-coords-display');
		if (coordsElement) {
			const coords = coordsElement.textContent;
			copyToClipboard(coords, this);
		}
	});
});

// Закрытие меню при клике вне его
document.addEventListener('click', function(e) {
	if (!navDropdown.contains(e.target) && e.target !== navMenuToggle) {
		navDropdown.classList.remove('active');
	}
});


// Обработчик для кнопки меню
navMenuToggle.addEventListener('click', function(e) {
	e.stopPropagation();
	console.log("[navMenuToggle] Кнопка меню нажата");
    // Синхронизируем состояние перед открытием
    syncDropdownState();
    // Открываем/закрываем меню
    navDropdown.classList.toggle('active');
});


function copyToClipboard(text, button) {
    if (!text || text.includes('не определен') || text.includes('undefined')) {
        return;
    }
    
    try {
        // Fallback метод копирования
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = 0;
        document.body.appendChild(textArea);
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        // Показываем обратную связь
        const t = translations[currentLang];
        button.textContent = t ? t.copiedText : '✓';
        button.classList.add('copied');
        
        setTimeout(() => {
            if (button.dataset.originalText) {
                button.textContent = button.dataset.originalText;
            }
            button.classList.remove('copied');
        }, 2000);
        
        if (!successful) {
            console.warn('Копирование не удалось, показываем координаты');
            alert(`${translations[currentLang]?.copyFallback || "Скопируйте координаты"}: ${text}`);
        }
    } catch (err) {
        console.error('Ошибка копирования:', err);
        button.textContent = translations[currentLang]?.copyError || "Ошибка";
        setTimeout(() => {
            if (button.dataset.originalText) {
                button.textContent = button.dataset.originalText;
            }
            button.classList.remove('copied');
        }, 2000);
    }
}

function setupDropdownListeners() {
    // Обработчик для поля ввода координат в меню
    const coordsClone = document.getElementById('coords-input-clone');
    if (coordsClone) {
        coordsClone.addEventListener('change', function() {
            const coords = this.value.split(',').map(coord => coord.trim());
            if (coords.length === 2) {
                const lat = parseFloat(coords[0]);
                const lng = parseFloat(coords[1]);
                if (!isNaN(lat) && !isNaN(lng)) {
                    centerMap(lat, lng);
                }
            }
        });
        
        coordsClone.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                this.dispatchEvent(new Event('change'));
            }
        });
    }

    // Обработчик для выпадающего списка городов в меню
    const citiesClone = document.getElementById('cities-dropdown-clone');
    if (citiesClone) {
        citiesClone.addEventListener('change', function() {
            const selectedCityName = this.value;
            if (!selectedCityName) return;
            
            const city = cities.find(c => 
                c.name.ru === selectedCityName || 
                c.name.en === selectedCityName
            );
            
            if (city) {
                // Обновляем поле ввода координат
                const coordsInput = document.getElementById('coords-input');
                const coordsClone = document.getElementById('coords-input-clone');
                
                if (coordsInput) coordsInput.value = `${city.lat}, ${city.lng}`;
                if (coordsClone) coordsClone.value = `${city.lat}, ${city.lng}`;
                
                centerMap(city.lat, city.lng);
                this.value = "";
            }
        });
    }

    // Обработчик для кнопки копирования в меню
    const copyBtnClone = document.getElementById('copy-coords-btn-clone');
    if (copyBtnClone) {
        copyBtnClone.addEventListener('click', function() {
            const coordsElement = document.getElementById('current-center-coords-clone');
            if (coordsElement) {
                const coords = coordsElement.textContent;
                copyToClipboard(coords, this);
            }
        });
    }
}


// Обработчик кнопки tlg-btn

document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.tlg-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // Закрываем меню
            this.closest('.view-menu-container').classList.remove('active');
            
            // Открываем ссылку в новом окне
            window.open('https://ru.wikipedia.org/wiki/Telegram', '_blank');
        });
    });
});

// Обработчик кнопки Поддержать donate-btn

document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.donate-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // Закрываем меню
            this.closest('.view-menu-container').classList.remove('active');
            
            // Открываем ссылку в новом окне
            window.open('https://ru.wikipedia.org/wiki/%D0%94%D0%BE%D0%BD%D0%B0%D1%82%D0%B5%D0%BB%D0%BB%D0%BE', '_blank');
        });
    });
});

// Обработчик кнопки Инфо info-btn

// Функция загрузки контента для модального окна
function loadInfoContent() {
    const infoFile = currentLang === 'ru' ? 'info_ru.html' : 'info_en.html';
    fetch(infoFile)
        .then(response => response.text())
        .then(html => {
            document.getElementById('info-content').innerHTML = html;
        })
        .catch(error => {
            console.error('Ошибка загрузки контента:', error);
            const errorText = currentLang === 'ru' ? 
                '<p>Не удалось загрузить информацию</p>' : 
                '<p>Failed to load information</p>';
            document.getElementById('info-content').innerHTML = errorText;
        });
}

document.addEventListener('DOMContentLoaded', function() {
  const modal = document.getElementById('info-modal');
  const closeBtn = modal.querySelector('.close-modal');
  
  // Обработчик для кнопки закрытия
  closeBtn.addEventListener('click', function() {
    modal.style.display = 'none';
  });

  // Обработчики для кнопок "Инфо"
  document.querySelectorAll('.info-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      this.closest('.view-menu-container')?.classList.remove('active');
      modal.style.display = 'block';
      loadInfoContent(); // Загружаем контент при открытии
    });
  });

  // Закрытие при клике вне окна
  document.addEventListener('click', function(event) {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  });

  // Закрытие по клавише Esc
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && modal.style.display === 'block') {
      modal.style.display = 'none';
    }
  });
});

