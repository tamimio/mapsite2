// Инициализация карты
const map = L.map('map').setView([55.751244, 37.618423], 5);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
}).addTo(map);

// Основные KML-файлы
const kmlFiles = [
    { name: "15.03.25", path: "kml/file1.kml" },
    { name: "20.03.25", path: "kml/file2.kml" },
    { name: "01.04.25", path: "kml/file4.kml" },
    { name: "05.04.25", path: "kml/file5.kml" },
    { name: "10.04.25", path: "kml/file6.kml" }
];

// Постоянный слой
const permanentLayerData = {
    name: "25.03.25",
    path: "kml/file3.kml"
};

// Список городов с координатами
const cities = [
    { name: "Москва", lat: 55.7558, lng: 37.6173 },
    { name: "Санкт-Петербург", lat: 59.9343, lng: 30.3351 },
    { name: "Новосибирск", lat: 55.0084, lng: 82.9357 },
    { name: "Екатеринбург", lat: 56.8389, lng: 60.6057 },
    { name: "Казань", lat: 55.7961, lng: 49.1064 },
    { name: "Нижний Новгород", lat: 56.3269, lng: 44.0256 },
    { name: "Сочи", lat: 43.5855, lng: 39.7231 }
];

let currentLayer = null;
let permanentLayer = null;
let currentIndex = kmlFiles.length - 1;
let preserveZoom = false;

let lastSelectedCity = null;
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
const datePicker = flatpickr("#date-picker", {
    dateFormat: "d.m.y",
    allowInput: true,
    locale: "ru",
    defaultDate: kmlFiles[kmlFiles.length - 1].name,
    enable: [
        // Разрешаем только даты, которые есть в kmlFiles
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
        // Подсвечиваем доступные даты
        const dateStr = `${dayElem.dateObj.getDate().toString().padStart(2, '0')}.${(dayElem.dateObj.getMonth()+1).toString().padStart(2, '0')}.${dayElem.dateObj.getFullYear().toString().slice(-2)}`;
        
        if (availableDates.includes(dateStr)) {
            dayElem.style.backgroundColor = '#e6f7ff';
            dayElem.style.fontWeight = 'bold';
        }
    }
});

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


// Функция центрирования карты по координатам
function centerMap(lat, lng) {
    const currentZoom = map.getZoom();
    map.setView([lat, lng], currentZoom);
    
    // Обновляем поле ввода, если координаты изменились
    if (coordsInput.value !== `${lat}, ${lng}`) {
        coordsInput.value = `${lat}, ${lng}`;
    }
}

// Загрузка постоянного KML-слоя
function loadPermanentKml() {
    permanentLayer = omnivore.kml(permanentLayerData.path)
        .on('ready', function() {
            permanentLayer.eachLayer(function(layer) {
                if (layer.setStyle) {
                    layer.setStyle(window.permanentLayerStyle);
                }
            });
        })
        .addTo(map);
}

// Функция загрузки KML (сохраняет текущий масштаб)
function loadKmlFile(file) {
    if (currentLayer) {
        map.removeLayer(currentLayer);
    }
    
    // Сохраняем текущий центр и зум перед загрузкой
    const currentCenter = map.getCenter();
    const currentZoom = map.getZoom();
    
    currentLayer = omnivore.kml(file.path)
        .on('ready', () => {
            if (!preserveZoom) {
                map.fitBounds(currentLayer.getBounds());
            } else {
                // Восстанавливаем предыдущий центр и зум
                map.setView(currentCenter, currentZoom);
            }
            preserveZoom = true; // После первой загрузки сохраняем масштаб
        })
        .addTo(map);
}

// Навигация к определенному индексу
function navigateTo(index) {
    if (index < 0 || index >= kmlFiles.length) return;
    
    currentIndex = index;
    const file = kmlFiles[currentIndex];
    
    // Обновляем календарь
    datePicker.setDate(file.name, false);
    
    // Загружаем файл
    loadKmlFile(file);
    
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

// Обработчики кнопок
document.getElementById('first-btn').addEventListener('click', () => {
    navigateTo(0);
});

document.getElementById('prev-btn').addEventListener('click', () => {
    navigateTo(currentIndex - 1);
});

document.getElementById('next-btn').addEventListener('click', () => {
    navigateTo(currentIndex + 1);
});

document.getElementById('last-btn').addEventListener('click', () => {
    navigateTo(kmlFiles.length - 1);
});


const coordsInput = document.getElementById('coords-input');

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
const citiesDropdown = document.getElementById('cities-dropdown');
cities.forEach(city => {
    const option = document.createElement('option');
    option.value = city.name;
    option.textContent = city.name;
    citiesDropdown.appendChild(option);
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
        title: "Просмотр KML по дате",
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
        title: "KML Viewer by Date",
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
    document.getElementById('main-title').textContent = t.title;
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


// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    // Загружаем постоянный слой
    loadPermanentKml();
    
    // Загружаем последний файл по умолчанию
    preserveZoom = false; // true - Всегда сохранять масштаб (если нужно полностью отключить автоматическое масштабирование)
    navigateTo(kmlFiles.length - 1);
	
    // Инициализируем отображение центра
    updateCurrentCenterDisplay();    
	
	// Устанавливаем русский язык по умолчанию
    setLanguage('ru');
});