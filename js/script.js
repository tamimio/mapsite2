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
let currentSelectedFile = null;

// Функция загрузки KML
function loadKmlFile(file) {
    if (currentLayer) {
        map.removeLayer(currentLayer);
    }
    
    document.getElementById('current-kml').textContent = file.name;
    currentSelectedFile = file;
    
    currentLayer = omnivore.kml(file.path)
        .on('ready', () => {
            map.fitBounds(currentLayer.getBounds());
        })
        .addTo(map);
}

// Функция отрисовки кнопок
function renderKmlButtons(files) {
    const container = document.getElementById('kml-files-container');
    container.innerHTML = '';
    
    files.forEach(file => {
        const btn = document.createElement('button');
        btn.className = 'kml-btn';
        btn.textContent = file.name;
        
        if (currentSelectedFile && file.path === currentSelectedFile.path) {
            btn.classList.add('active');
        }
        
        btn.onclick = () => {
            document.querySelectorAll('.kml-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            loadKmlFile(file);
        };
        
        container.appendChild(btn);
    });
}

// Обработчик поиска
document.getElementById('search-input').addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    const filteredFiles = searchTerm ? 
        kmlFiles.filter(file => file.name.toLowerCase().includes(searchTerm)) : 
        kmlFiles;
    renderKmlButtons(filteredFiles);
});

// Кнопки навигации
document.getElementById('prev-btn').addEventListener('click', () => {
    document.getElementById('kml-files-container').scrollBy({ left: -200, behavior: 'smooth' });
});

document.getElementById('next-btn').addEventListener('click', () => {
    document.getElementById('kml-files-container').scrollBy({ left: 200, behavior: 'smooth' });
});

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    renderKmlButtons(kmlFiles); // Показываем все файлы сразу
    
    // Автоматически выбираем первый файл (опционально)
    if (kmlFiles.length > 0) {
        const firstFile = kmlFiles[0];
        loadKmlFile(firstFile);
        document.querySelector('.kml-btn')?.classList.add('active');
    }
});