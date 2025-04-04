// Инициализация карты (центр и масштаб можно настроить)
const map = L.map('map').setView([55.751244, 37.618423], 5); // Центр на Москве, масштаб 5

// Добавляем слой карты (можно использовать OpenStreetMap, Яндекс.Карты и др.)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

let currentLayer = null; // Текущий слой KML

// Обработчик изменения выбора файла
/*
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
*/

const kmlFiles = [
    { name: "Файл 1", path: "kml/file1.kml" },
    { name: "Файл 2", path: "kml/file2.kml" },
	{ name: "Файл 3", path: "kml/file2.kml" },
	{ name: "Файл 4", path: "kml/file2.kml" },
	{ name: "Файл 5", path: "kml/file2.kml" },
	{ name: "Файл 6", path: "kml/file2.kml" },
	{ name: "Файл 7", path: "kml/file2.kml" },
	{ name: "Файл 8", path: "kml/file2.kml" },
	{ name: "Файл 9", path: "kml/file2.kml" },
	{ name: "Файл 10", path: "kml/file2.kml" },
	{ name: "Файл 11", path: "kml/file2.kml" },
	{ name: "Файл 12", path: "kml/file2.kml" },
    // ... добавьте остальные файлы
];

const container = document.querySelector('.kml-files-container');

// Создаём кнопки для каждого KML-файла
kmlFiles.forEach(file => {
    const btn = document.createElement('button');
    btn.className = 'kml-btn';
    btn.textContent = file.name;
    btn.onclick = () => loadKmlFile(file.path);
    container.appendChild(btn);
});

// Прокрутка слайдера
document.getElementById('prev-btn').addEventListener('click', () => {
    container.scrollBy({ left: -200, behavior: 'smooth' });
});

document.getElementById('next-btn').addEventListener('click', () => {
    container.scrollBy({ left: 200, behavior: 'smooth' });
});

// Функция загрузки KML (аналогично предыдущему варианту)
function loadKmlFile(path) {
    if (currentLayer) map.removeLayer(currentLayer);
    currentLayer = omnivore.kml(path)
        .on('ready', () => map.fitBounds(currentLayer.getBounds()))
        .addTo(map);
    
    // Подсветка активной кнопки
    document.querySelectorAll('.kml-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
}