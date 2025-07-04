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
    // Проверка на доступность карты
    if (!map || !map.getCenter || !currentCenterCoordsElement) return;
    
    const center = map.getCenter();
    if (center.lat === 0 && center.lng === 0) return; // Игнорируем нулевые координаты
    
    currentCenterCoordsElement.textContent =
        `${center.lat.toFixed(6)}, ${center.lng.toFixed(6)}`;
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
        
        if (datePicker) {
            datePicker.setDate(file.name, false);
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

// обработчик перемещения карты
map.on('moveend', function() {
    updateCurrentCenterDisplay();
});

// Функция для установки обработчика копирования
function setupCopyCoordsButton() {
    const btn = document.getElementById('copy-coords-btn');
    const coordsElement = document.getElementById('current-center-coords');
    
    if (!btn || !coordsElement) return;
    
    // Удаляем все предыдущие обработчики
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    const finalBtn = newBtn;
    
    finalBtn.addEventListener('click', function() {
        // Получаем координаты из элемента
        const coords = coordsElement.textContent;
        
        // Проверяем наличие координат
        if (!coords || coords.includes('не определен') || coords.includes('undefined')) {
            return;
        }
        
        try {
            // Fallback метод копирования
            const textArea = document.createElement('textarea');
            textArea.value = coords;
            textArea.style.position = 'fixed';
            textArea.style.opacity = 0;
            document.body.appendChild(textArea);
            textArea.select();
            
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            
            // Показываем обратную связь в любом случае
            const originalText = finalBtn.textContent;
            const t = translations[currentLang];
            finalBtn.textContent = t ? t.copiedText : '✓';
            
            setTimeout(() => {
                finalBtn.textContent = originalText;
            }, 2000);
            
            if (!successful) {
                console.warn('Копирование не удалось, показываем координаты');
                alert(`${translations[currentLang]?.copyFallback || "Скопируйте координаты"}: ${coords}`);
            }
        } catch (err) {
            console.error('Ошибка копирования:', err);
            alert(`${translations[currentLang]?.copyError || "Ошибка копирования"}: ${coords}`);
        }
    });
}


async function init() {
  try {
    // Шаг 1: Загружаем постоянные слои
    await loadPermanentKmlLayers();
    
    // Шаг 2: Инициализируем основные компоненты UI
    initDatePicker();
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
    setupCopyCoordsButton();
    
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
});

// Обработчик изменения языка
document.addEventListener('languageChanged', function(event) {
    currentLang = event.detail;
    if (datePicker) {
        datePicker.destroy();
        initDatePicker();
    }
});

// Закрываем меню при клике на карту
document.getElementById('map').addEventListener('click', function() {
    if (window.innerWidth <= 768) {
        document.querySelector('.nav-bar').classList.remove('active');
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
  if (e.key === 'Enter') {
    const coords = this.value.split(',').map(coord => coord.trim());
    if (coords.length === 2) {
      const lat = parseFloat(coords[0]);
      const lng = parseFloat(coords[1]);
      if (!isNaN(lat) && !isNaN(lng)) {
        centerMap(lat, lng);
      }
    }
  }
});

// Гамбургер переключатель видов

document.addEventListener('DOMContentLoaded', function() {
    const viewMenuBtn = document.querySelector('.view-menu-btn');
    const viewMenuContainer = document.querySelector('.view-menu-container');
    
    if (viewMenuBtn && viewMenuContainer) {
        // Обработчик открытия/закрытия меню видов
        viewMenuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            viewMenuContainer.classList.toggle('active');
        });
        
        // Закрытие меню при клике вне его
        document.addEventListener('click', function(e) {
            if (!viewMenuContainer.contains(e.target)) {
                viewMenuContainer.classList.remove('active');
            }
        });
        
        // Закрытие меню при выборе вида
        document.querySelectorAll('.view-dropdown .view-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                viewMenuContainer.classList.remove('active');
                
                // Перерисовываем карту при необходимости
                if (map && this.id === 'map-btn') {
                    setTimeout(() => map.invalidateSize(), 100);
                }
            });
        });
    }
});

// Дартс (Лупа)
function initDartMenu() {
        console.log("[initDartMenu] Инициализация дартс-меню...");
    const navMenuToggle = document.getElementById('nav-menu-toggle');
    const navDropdown = document.getElementById('nav-dropdown');
    
    if (!navMenuToggle || !navDropdown) return;

    const hideableItems = document.querySelectorAll('.hideable-nav-item');
    console.log(`[initDartMenu] Найдено ${hideableItems.length} элементов с классом 'hideable-nav-item'`);
    
    const clonedItems = [];
    navDropdown.innerHTML = '';

    // Клонируем элементы с очисткой классов и стилей
    hideableItems.forEach((item, index) => {
        console.log(`[initDartMenu] Клонирование элемента #${index}:`, item);
        
        try {
            const clone = item.cloneNode(true);
            
            // Удаляем проблемные классы
            clone.classList.remove('hideable-nav-item');
            clone.classList.add('dropdown-item');
            
            // Очищаем инлайновые стили
            clone.style.cssText = '';
            
            // Для вложенных элементов очищаем классы и стили
            if (clone.id === 'coords-input' || clone.id === 'cities-dropdown') {
                clone.classList.remove('coord-input');
            }
            
            // Для группы элементов
            if (clone.classList.contains('city-coord-group')) {
                clone.querySelectorAll('*').forEach(child => {
                    child.classList.remove('hideable-nav-item');
                    child.style.cssText = '';
                });
            }
            
            navDropdown.appendChild(clone);
            clonedItems.push(clone);
            
        } catch (error) {
            console.error(`[initDartMenu] Ошибка при клонировании:`, error);
        }
    });
    
    console.log(`[initDartMenu] В nav-dropdown добавлено ${clonedItems.length} элементов`);

    // Функции управления видимостью
    function showOriginalItems() {
        console.log("[showOriginalItems] Показываем оригинальные элементы");
        hideableItems.forEach(item => {
            item.style.display = 'flex';
            console.log(`[showOriginalItems] Показан элемент:`, item);
        });
    }
    
    function showDropdownItems() {
        console.log("[showDropdownItems] Скрываем оригинальные элементы");
        hideableItems.forEach(item => {
            item.style.display = 'none';
            console.log(`[showDropdownItems] Скрыт элемент:`, item);
        });
    }
    
    // Синхронизация состояния
    function syncDropdownState() {
        console.log("[syncDropdownState] Синхронизация состояний");
        hideableItems.forEach((original, index) => {
            const clone = clonedItems[index];
            if (!clone) {
                console.warn(`[syncDropdownState] Нет клона для элемента #${index}`);
                return;
            }
            
            // Синхронизация полей ввода
            if (original.querySelector('input')) {
                const origInput = original.querySelector('input');
                const cloneInput = clone.querySelector('input');
                if (cloneInput) {
                    cloneInput.value = origInput.value;
                    console.log(`[syncDropdownState] Синхронизировано поле ввода: ${origInput.value}`);
                } else {
                    console.warn(`[syncDropdownState] Не найден клон поля ввода для:`, original);
                }
            }
            
            // Синхронизация выпадающих списков
            if (original.querySelector('select')) {
                const origSelect = original.querySelector('select');
                const cloneSelect = clone.querySelector('select');
                if (cloneSelect) {
                    cloneSelect.value = origSelect.value;
                    console.log(`[syncDropdownState] Синхронизирован выпадающий список: ${origSelect.value}`);
                } else {
                    console.warn(`[syncDropdownState] Не найден клон выпадающего списка для:`, original);
                }
            }
        });
    }
    
    // Обработчик для кнопки меню
    navMenuToggle.addEventListener('click', function(e) {
        e.stopPropagation();
        console.log("[navMenuToggle] Нажата кнопка дартс-меню");
        syncDropdownState();
        navDropdown.classList.toggle('active');
        console.log(`[navMenuToggle] Состояние меню: ${navDropdown.classList.contains('active') ? 'открыто' : 'закрыто'}`);
    });
    
    // Обработчики для клонов в выпадающем меню
    navDropdown.querySelectorAll('input, select').forEach((clone, index) => {
        clone.addEventListener('change', function() {
            console.log(`[cloneChange] Изменение в клоне #${index}:`, this.value);
            const original = hideableItems[index];
            if (!original) {
                console.warn(`[cloneChange] Нет оригинала для клона #${index}`);
                return;
            }
            
            // Обновляем оригинальный элемент
            if (this.tagName === 'INPUT') {
                const origInput = original.querySelector('input');
                if (origInput) {
                    origInput.value = this.value;
                    console.log(`[cloneChange] Обновлено оригинальное поле: ${this.value}`);
                    
                    // Триггерим события для координат
                    if (origInput.id === 'coords-input') {
                        const event = new Event('change');
                        origInput.dispatchEvent(event);
                        console.log("[cloneChange] Отправлено событие change для coords-input");
                    }
                }
            }
            else if (this.tagName === 'SELECT') {
                const origSelect = original.querySelector('select');
                if (origSelect) {
                    origSelect.value = this.value;
                    console.log(`[cloneChange] Обновлен оригинальный список: ${this.value}`);
                    
                    // Триггерим события для выпадающих списков
                    if (origSelect.id === 'cities-dropdown') {
                        const event = new Event('change');
                        origSelect.dispatchEvent(event);
                        console.log("[cloneChange] Отправлено событие change для cities-dropdown");
                    }
                }
            }
        });
    });
    
    // Закрытие меню при клике вне его
    document.addEventListener('click', function(e) {
        if (!navDropdown.contains(e.target) && e.target !== navMenuToggle) {
            console.log("[documentClick] Клик вне меню, закрываем");
            navDropdown.classList.remove('active');
        }
    });
    
    // Обработчик изменения размера окна
    function handleResize() {
        console.log(`[handleResize] Размер окна: ${window.innerWidth}px`);
        if (window.innerWidth < 1800) {
            console.log("[handleResize] Ширина < 1800px - показываем меню");
            showDropdownItems();
            navMenuToggle.style.display = 'block';
        } else {
            console.log("[handleResize] Ширина >= 1800px - скрываем меню");
            showOriginalItems();
            navMenuToggle.style.display = 'none';
            navDropdown.classList.remove('active');
        }
    }
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Инициализация
    console.log("[initDartMenu] Инициализация завершена");
}