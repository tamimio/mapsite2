const translations = {
    ru: {
        title: "  dataviewer",
        centerLabel: "Центрировать на:",
        coordsPlaceholder: "Широта, Долгота (например: 55.7558, 37.6173)",
        selectCity: "Выберите город",
        currentCenter: "Текущий центр: ",
        undefinedCoords: "не определен",
        copyTooltip: "Копировать координаты",
		copySuccess: "Скопировано!",
        firstBtnTitle: "Первый",
        prevBtnTitle: "Предыдущий",
        nextBtnTitle: "Следующий",
        lastBtnTitle: "Последний"
    },
    en: {
        title: "  dataviewer",
        centerLabel: "Center on:",
        coordsPlaceholder: "Latitude, Longitude (e.g.: 55.7558, 37.6173)",
        selectCity: "Select city",
        currentCenter: "Current center: ",
        undefinedCoords: "undefined",
        copyTooltip: "Copy coordinates",
        copySuccess: "Copied!",
        firstBtnTitle: "First",
        prevBtnTitle: "Previous",
        nextBtnTitle: "Next",
        lastBtnTitle: "Last"
    }
};

let currentLang = 'ru';

// Функция переключения языка
function setLanguage(lang) {
    currentLang = lang;
    const t = translations[lang];
    
    // Обновляем текст элементов
    document.getElementById('page-title').textContent = t.title;
    // document.getElementById('main-title').textContent = t.title;
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
    
    // Обновляем список городов
    populateCitiesDropdown();
	    
    // Пересоздаем календарь с новым языком
    if (datePicker) {
        datePicker.destroy();
    }
    initDatePicker();
    
    // Если координаты не определены, обновляем текст
    if (document.getElementById('current-center-coords').textContent === 'не определен' || 
        document.getElementById('current-center-coords').textContent === 'undefined') {
        document.getElementById('current-center-coords').textContent = t.undefinedCoords;
    }
}


function initLanguage() {
    document.getElementById('lang-ru').addEventListener('click', () => {
        if (currentLang !== 'ru') setLanguage('ru');
    });
    
    document.getElementById('lang-en').addEventListener('click', () => {
        if (currentLang !== 'en') setLanguage('en');
    });
    
    setLanguage('ru');
	
	// Пересоздаем календарь с новым языком
    if (!datePicker) { // Добавить проверку
        initDatePicker();
    } else {
        datePicker.destroy();
        initDatePicker();
    }
}