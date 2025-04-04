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
let currentSelectedDate = null;

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

// Создание кнопки даты
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

// Кнопки навигации
document.getElementById('prev-btn').addEventListener('click', () => {
    document.getElementById('kml-files-container').scrollBy({ left: -200, behavior: 'smooth' });
});

document.getElementById('next-btn').addEventListener('click', () => {
    document.getElementById('kml-files-container').scrollBy({ left: 200, behavior: 'smooth' });
});

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    renderAllKmlButtons();
});