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

// Функция центрирования карты по координатам
function centerMap(lat, lng) {
    const currentZoom = map.getZoom();
    map.setView([lat, lng], currentZoom);
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

// Обработчики событий для полей ввода координат
document.getElementById('latitude-input').addEventListener('change', function() {
    const latInput = this.value;
    const lngInput = document.getElementById('longitude-input').value;
    
    if (isValidCoordinate(latInput, true)) {
        if (isValidCoordinate(lngInput, false)) {
            centerMap(parseFloat(latInput), parseFloat(lngInput));
        }
    }
});

document.getElementById('longitude-input').addEventListener('change', function() {
    const lngInput = this.value;
    const latInput = document.getElementById('latitude-input').value;
    
    if (isValidCoordinate(lngInput, false)) {
        if (isValidCoordinate(latInput, true)) {
            centerMap(parseFloat(latInput), parseFloat(lngInput));
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
        // Всегда обновляем значения полей ввода
        document.getElementById('latitude-input').value = city.lat;
        document.getElementById('longitude-input').value = city.lng;
        
        // Центрируем карту независимо от того, был ли город уже выбран
        centerMap(city.lat, city.lng);
        
        // Если это повторный выбор того же города - сбрасываем выбор в dropdown
        if (lastSelectedCity === selectedCityName) {
            this.value = "";
        }
        
        // Запоминаем последний выбранный город
        lastSelectedCity = selectedCityName;
    }
});


// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    // Загружаем постоянный слой
    loadPermanentKml();
    
    // Загружаем последний файл по умолчанию
    preserveZoom = false; // true - Всегда сохранять масштаб (если нужно полностью отключить автоматическое масштабирование)
    navigateTo(kmlFiles.length - 1);
	 
    // Заполняем список городов, но не выбираем ничего по умолчанию
    cities.forEach(city => {
        const option = document.createElement('option');
        option.value = city.name;
        option.textContent = city.name;
        citiesDropdown.appendChild(option);
    });
});