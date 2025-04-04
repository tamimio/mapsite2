// Инициализация карты (центр и масштаб можно настроить)
const map = L.map('map').setView([55.751244, 37.618423], 5); // Центр на Москве, масштаб 5

// Добавляем слой карты (можно использовать OpenStreetMap, Яндекс.Карты и др.)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

/////////////////

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

let currentLayer = null; // Текущий загруженный KML

// Загрузка KML-файла
function loadKmlFile(path) {
    if (currentLayer) map.removeLayer(currentLayer);
    currentLayer = omnivore.kml(path)
        .on('ready', () => map.fitBounds(currentLayer.getBounds()))
        .addTo(map);
}

// Рендер кнопок в карусели
function renderKmlButtons(files) {
    const container = document.getElementById('kml-files-container');
    container.innerHTML = '';
    
    files.forEach(file => {
        const btn = document.createElement('button');
        btn.className = 'kml-btn';
        btn.textContent = file.name;
        btn.onclick = () => {
            loadKmlFile(file.path);
            // Подсвечиваем активную кнопку
            document.querySelectorAll('.kml-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        };
        container.appendChild(btn);
    });
}

// Поиск по KML-файлам
document.getElementById('search-input').addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    const filteredFiles = kmlFiles.filter(file => 
        file.name.toLowerCase().includes(searchTerm)
    );
    renderKmlButtons(filteredFiles);
});

// Кнопки "Вперед/Назад" для карусели
document.getElementById('prev-btn').addEventListener('click', () => {
    document.getElementById('kml-files-container').scrollBy({ left: -200, behavior: 'smooth' });
});

document.getElementById('next-btn').addEventListener('click', () => {
    document.getElementById('kml-files-container').scrollBy({ left: 200, behavior: 'smooth' });
});

// Инициализация (показываем все файлы при загрузке)
renderKmlButtons(kmlFiles);