// Инициализация карты (центр и масштаб можно настроить)
const map = L.map('map').setView([55.751244, 37.618423], 5); // Центр на Москве, масштаб 5

// Добавляем слой карты (можно использовать OpenStreetMap, Яндекс.Карты и др.)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

/////////////////

const kmlFiles = [
    { name: "04.04.25", path: "kml/file1.kml" },
    { name: "03.04.25", path: "kml/file2.kml" },
	{ name: "02.04.25", path: "kml/file2.kml" },
	{ name: "01.04.25", path: "kml/file2.kml" },
	{ name: "31.03.25", path: "kml/file2.kml" },
	{ name: "30.03.25", path: "kml/file2.kml" },
	{ name: "29.03.25", path: "kml/file2.kml" },
	{ name: "28.03.25", path: "kml/file2.kml" },
	{ name: "27.03.25", path: "kml/file2.kml" },
	{ name: "26.03.25", path: "kml/file2.kml" },
	{ name: "25.03.25", path: "kml/file2.kml" },
	{ name: "24.03.25", path: "kml/file2.kml" },
    // ... добавьте остальные файлы
];

let currentLayer = null; // Текущий загруженный KML
let currentSelectedFile = null;

// Инициализация календаря
const datePicker = flatpickr("#date-picker", {
    dateFormat: "d.m.y",
    allowInput: true,
    onChange: function(selectedDates, dateStr) {
        filterByDate(dateStr);
    }
});

// Функция загрузки KML
function loadKmlFile(file) {
    if (currentLayer) {
        map.removeLayer(currentLayer);
    }
    
    document.getElementById('current-date').textContent = file.name;
    currentSelectedDate = file;
    
    currentLayer = omnivore.kml(file.path)
        .on('ready', () => {
            map.fitBounds(currentLayer.getBounds());
        })
        .addTo(map);
}

// Функция фильтрации по дате
function filterByDate(dateStr) {
    const container = document.getElementById('kml-files-container');
    container.innerHTML = '';
    
    // Если дата не выбрана - показываем все
    if (!dateStr) {
        renderAllKmlButtons();
        document.getElementById('current-date').textContent = "не выбрана";
        return;
    }
    
    // Ищем точное совпадение даты
    const foundFile = kmlFiles.find(file => file.name === dateStr);
    
    if (foundFile) {
        const btn = createDateButton(foundFile);
        container.appendChild(btn);
        loadKmlFile(foundFile);
        btn.classList.add('active');
    } else {
        document.getElementById('current-date').textContent = "данные не найдены";
    }
}
/ Создание кнопки даты
function createDateButton(file) {
    const btn = document.createElement('button');
    btn.className = 'kml-btn';
    btn.textContent = file.name;
    
    btn.onclick = () => {
        document.querySelectorAll('.kml-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        loadKmlFile(file);
    };
    
    return btn;
}

// Показ всех дат
function renderAllKmlButtons() {
    const container = document.getElementById('kml-files-container');
    container.innerHTML = '';
    
    kmlFiles.forEach(file => {
        const btn = createDateButton(file);
        if (currentSelectedDate && file.path === currentSelectedDate.path) {
            btn.classList.add('active');
        }
        container.appendChild(btn);
    });
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