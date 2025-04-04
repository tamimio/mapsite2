// Инициализация карты
const map = L.map('map').setView([55.751244, 37.618423], 5);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
}).addTo(map);

// Данные KML-файлов в формате DD.MM.YY
const kmlFiles = [
    { name: "15.03.25", path: "kml/file1.kml" },
    { name: "20.03.25", path: "kml/file2.kml" },
    { name: "25.03.25", path: "kml/file3.kml" },
    { name: "01.04.25", path: "kml/file4.kml" },
    { name: "05.04.25", path: "kml/file5.kml" },
    { name: "10.04.25", path: "kml/file6.kml" }
];

let currentLayer = null;
let currentIndex = kmlFiles.length - 1; // По умолчанию последний элемент
let preserveZoom = false; // Флаг для сохранения масштаба

// Инициализация календаря
const datePicker = flatpickr("#date-picker", {
    dateFormat: "d.m.y",
    allowInput: true,
    locale: "ru",
    defaultDate: kmlFiles[kmlFiles.length - 1].name,
    onChange: function(selectedDates, dateStr) {
        const index = kmlFiles.findIndex(file => file.name === dateStr);
        if (index !== -1) {
            navigateTo(index);
        }
    }
});

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

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    // Первая загрузка - масштабируем под данные
    preserveZoom = false; // true - Всегда сохранять масштаб (если нужно полностью отключить автоматическое масштабирование)
    navigateTo(kmlFiles.length - 1);
});