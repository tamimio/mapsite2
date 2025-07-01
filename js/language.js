// Добавьте объект с переводами
const translations = {
    ru: {
        //title: "  dataviewer",
        logoAlt: "dataviewer - просмотр данных",
        centerLabel: "Центрировать на:",
        coordsPlaceholder: "Широта, Долгота (например: 55.7558, 37.6173)",
        selectCity: "Выберите город",
        currentCenter: "Текущий центр: ",
        undefinedCoords: "не определен",
        copyTooltip: "Копировать координаты",
        firstBtnTitle: "Первый",
        prevBtnTitle: "Предыдущий",
        nextBtnTitle: "Следующий",
        lastBtnTitle: "Последний",
        viewSwitchMap: "Карта",
        viewSwitchSt1: "Статистика1",
        viewSwitchSt2: "Статистика2"
    },
    en: {
        //title: "  dataviewer",
        logoAlt: "dataviewer - data visualization",
        centerLabel: "Center on:",
        coordsPlaceholder: "Latitude, Longitude (e.g.: 55.7558, 37.6173)",
        selectCity: "Select city",
        currentCenter: "Current center: ",
        undefinedCoords: "undefined",
        copyTooltip: "Copy coordinates",
        firstBtnTitle: "First",
        prevBtnTitle: "Previous",
        nextBtnTitle: "Next",
        lastBtnTitle: "Last",
        viewSwitchMap: "Map",
        viewSwitchSt1: "Statistics1",
        viewSwitchSt2: "Statistics2"
    }
};

let currentLang = 'ru'; // По умолчанию русский

// Функция переключения языка
function setLanguage(lang) {
    currentLang = lang;
    const t = translations[lang];
    
    // Обновляем title кнопок
    document.getElementById('lang-ru').title = 
        lang === 'ru' ? "Текущий язык: Русский" : "Переключить на Русский";
    
    document.getElementById('lang-en').title = 
        lang === 'en' ? "Current language: English" : "Switch to English";
    
    // Обновляем текст элементов
    //document.getElementById('page-title').textContent = t.title;
    document.getElementById('site-logo').alt = t.logoAlt;
    // document.getElementById('main-title').textContent = t.title;
    document.getElementById('center-label').textContent = t.centerLabel;
    document.getElementById('coords-input').placeholder = t.coordsPlaceholder;
    document.getElementById('select-city-default').textContent = t.selectCity;
    document.getElementById('current-center-label').textContent = t.currentCenter;
    document.getElementById('copy-coords-btn').title = t.copyTooltip;
	
    document.getElementById('map-btn').textContent = t.viewSwitchMap;
    document.getElementById('stats1-btn').textContent = t.viewSwitchSt1;
    document.getElementById('stats2-btn').textContent = t.viewSwitchSt2;
    
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
    
    // Сохраняем выбор в localStorage
    localStorage.setItem('preferredLang', lang);
    document.documentElement.lang = lang;
}

// Обработчики кнопок переключения языка
document.getElementById('lang-ru').addEventListener('click', () => {
    if (currentLang !== 'ru') setLanguage('ru');
});

document.getElementById('lang-en').addEventListener('click', () => {
    if (currentLang !== 'en') setLanguage('en');
});
