// Инициализация карты (центр и масштаб можно настроить)
const map = L.map('map').setView([55.751244, 37.618423], 5); // Центр на Москве, масштаб 5

// Добавляем слой карты (можно использовать OpenStreetMap, Яндекс.Карты и др.)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

let currentLayer = null; // Текущий слой KML

// Обработчик изменения выбора файла
document.getElementById('kml-files').addEventListener('change', function(e) {
    const kmlFile = e.target.value;
    
    // Удаляем предыдущий слой, если он есть
    if (currentLayer) {
        map.removeLayer(currentLayer);
    }
    
    // Если файл выбран, загружаем его
    if (kmlFile) {
        currentLayer = omnivore.kml(kmlFile)
            .on('ready', function() {
                map.fitBounds(currentLayer.getBounds()); // Автоматически масштабируем карту
            })
            .addTo(map);
    }
});