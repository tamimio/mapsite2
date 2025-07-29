const translations = {
    ru: {
        title: "  dataviewer",
        //logoAlt: "dataviewer - просмотр данных",
        centerLabel: "Центрировать на:",
        coordsPlaceholder: "Координаты",
        selectCity: "Выберите город",
        currentCenter: "Текущий центр: ",
        undefinedCoords: "не определен",
        copyTooltip: "Копировать координаты",
        copiedText: "✓",
        copyFallback: "Скопируйте координаты вручную",
        copyError: "Ошибка копирования",
        
        firstBtnTitle: "Первый",
        prevBtnTitle: "Предыдущий",
        nextBtnTitle: "Следующий",
        lastBtnTitle: "Последний",
        
        ruBtnTitle: "Текущий язык: Русский",
        enBtnTitle: "Переключить на Английский",
        
        layersToggleTitle: "Слои карты",
        
        rulerToggleTitle: "Измерить расстояние",
        measureControlTitleOn: "Включить линейку",
        measureControlTitleOff: "Выключить линейку",
        clearControlTitle: "Очистить измерения",
        unitControlTitle: "Изменить единицы",
        units: {
            meters: "Метры",
            kilometers: "Километры",
            miles: "Мили",
            nauticalmiles: "Морские мили",
            feet: "Футы"
        },
        
        viewSwitchMap: "Карта",
        viewSwitchSt1: "Статистика1",
        viewSwitchSt2: "Статистика2",
        
        viewSwitchTlg:  "Ссылка",
        viewSwitchDon:  "Поддержать",
        viewSwitchInfo: "Инфо"
    },
    en: {
        title: "  dataviewer",
        //logoAlt: "dataviewer - data visualization",
        centerLabel: "Center on:",
        coordsPlaceholder: "Coordinates",
        selectCity: "Select city",
        currentCenter: "Current center: ",
        undefinedCoords: "undefined",
        copyTooltip: "Copy coordinates",
        copiedText: "✓",
        copyFallback: "Copy coordinates manually",
        copyError: "Copy error",
        
        firstBtnTitle: "First",
        prevBtnTitle: "Previous",
        nextBtnTitle: "Next",
        lastBtnTitle: "Last",
        
        ruBtnTitle: "Switch to Russian",
        enBtnTitle: "Current language: English",
        
        layersToggleTitle: "Map layers",
        
        rulerToggleTitle: "Measure distance",
        measureControlTitleOn: "Turn on measuring tool",
        measureControlTitleOff: "Turn off measuring tool",
        clearControlTitle: "Clear measurements",
        unitControlTitle: "Change units",
        units: {
            meters: "Meters",
            kilometers: "Kilometres",
            miles: "Miles",
            nauticalmiles: "Nautical miles",
            feet: "Feet"
        },
        
        viewSwitchMap: "Map",
        viewSwitchSt1: "Statistics1",
        viewSwitchSt2: "Statistics2",
        
        viewSwitchTlg:  "Link",
        viewSwitchDon:  "Donate",
        viewSwitchInfo: "Info"
    }
};

let currentLang = localStorage.getItem('preferredLang') || 'ru'; // По умолчанию русский

// Функция переключения языка
function setLanguage(lang) {
    currentLang = lang;
    const t = translations[lang];
    
    // Сохраняем текущие координаты перед обновлением текста
    const coordsElement = document.getElementById('current-center-coords');
    const currentText = coordsElement.textContent;
    const coordsRegex = /[-]?\d+\.\d+,\s*[-]?\d+\.\d+/;
    const match = currentText.match(coordsRegex);
    const savedCoords = match ? match[0] : null;
    
    // Обновляем title кнопок
    document.getElementById('lang-ru').title = 
        lang === 'ru' ? "Текущий язык: Русский" : "Переключить на Русский";
    
    document.getElementById('lang-en').title = 
        lang === 'en' ? "Current language: English" : "Switch to English";
    
    // Обновляем текст элементов
    document.getElementById('page-title').textContent = t.title;
    //document.getElementById('site-logo').alt = t.logoAlt;
    // document.getElementById('main-title').textContent = t.title;
    document.getElementById('centerOn-label').textContent = t.centerLabel;
    document.getElementById('coords-input').placeholder = t.coordsPlaceholder;
    document.getElementById('select-city-default').textContent = t.selectCity;
    
    document.getElementById('currentCenter-label').textContent = t.currentCenter;
    // Восстанавливаем координаты после обновления префикса
    if (savedCoords) {
        coordsElement.textContent = savedCoords;
    } else {
        coordsElement.textContent = t.undefinedCoords;
    }
    
    document.getElementById('copy-coords-btn').title = t.copyTooltip;
	
    document.getElementById('map-btn'   ).textContent = t.viewSwitchMap;
    document.getElementById('stats1-btn').textContent = t.viewSwitchSt1;
    document.getElementById('stats2-btn').textContent = t.viewSwitchSt2;
    document.getElementById('tlg-btn'   ).textContent = t.viewSwitchTlg;
    document.getElementById('donate-btn').textContent = t.viewSwitchDon;
    document.getElementById('info-btn'  ).textContent = t.viewSwitchInfo;
    document.getElementById('map-btn-desktop'   ).textContent = t.viewSwitchMap;
    document.getElementById('stats1-btn-desktop').textContent = t.viewSwitchSt1;
    document.getElementById('stats2-btn-desktop').textContent = t.viewSwitchSt2;
    document.getElementById('tlg-btn-desktop'   ).textContent = t.viewSwitchTlg;
    document.getElementById('donate-btn-desktop').textContent = t.viewSwitchDon;
    document.getElementById('info-btn-desktop'  ).textContent = t.viewSwitchInfo;
    
    // Обновляем кнопки навигации
    document.getElementById('first-btn').title = t.firstBtnTitle;
    document.getElementById('prev-btn').title = t.prevBtnTitle;
    document.getElementById('next-btn').title = t.nextBtnTitle;
    document.getElementById('last-btn').title = t.lastBtnTitle;
    
    // Обновляем title кнопки переключения слоев
    const layersToggleLink = document.querySelector('.leaflet-control-layers-toggle a');
    if (layersToggleLink) {
        layersToggleLink.title = t.layersToggleTitle;
    }
    
    // Обновляем кнопки языка
    document.getElementById('lang-ru').title = lang === 'ru' ? "Уже Русский" : "Переключить на Русский";
    document.getElementById('lang-en').title = lang === 'en' ? "Already English" : "Switch to English";
    document.getElementById('lang-ru-desktop').title = lang === 'ru' ? "Уже Русский" : "Переключить на Русский";
    document.getElementById('lang-en-desktop').title = lang === 'en' ? "Already English" : "Switch to English";
        
    // Обновляем классы активности
    document.getElementById('lang-ru').classList.toggle('active', lang === 'ru');
    document.getElementById('lang-en').classList.toggle('active', lang === 'en');
    document.getElementById('lang-ru-desktop').classList.toggle('active', lang === 'ru');
    document.getElementById('lang-en-desktop').classList.toggle('active', lang === 'en');
    
    // Обновляем список городов
    populateCitiesDropdown();
    
    // Пересоздаем календарь с новым языком
    if (datePicker) {
        datePicker.destroy();
    }
    initDatePicker(); // Передаем сохраненную дату
    
    // Если координаты не определены, обновляем текст
    if (document.getElementById('current-center-coords').textContent === 'не определен' || 
        document.getElementById('current-center-coords').textContent === 'undefined') {
        document.getElementById('current-center-coords').textContent = t.undefinedCoords;
    }
    
    // Сохраняем выбор в localStorage
    localStorage.setItem('preferredLang', lang);
    document.documentElement.lang = lang;
    
    // Инициируем событие, что язык изменён
    const event = new CustomEvent('languageChanged', { detail: lang });
    document.dispatchEvent(event);
    
    // Обновляем состояние кнопок
    // updateButtons();
}

// Обработчики кнопок переключения языка
// мобильный
document.getElementById('lang-ru').addEventListener('click', () => {
    if (currentLang !== 'ru') setLanguage('ru');
});

document.getElementById('lang-en').addEventListener('click', () => {
    if (currentLang !== 'en') setLanguage('en');
});

document.getElementById('lang-ru').addEventListener('click', function() {
    if (currentLang !== 'ru') {
        setLanguage('ru');
    } else {
        // Обновляем title для текущего языка
        const t = translations[currentLang];
        this.title = t.ruBtnTitle;
    }
});

document.getElementById('lang-en').addEventListener('click', function() {
    if (currentLang !== 'en') {
        setLanguage('en');
    } else {
        // Обновляем title для текущего языка
        const t = translations[currentLang];
        this.title = t.enBtnTitle;
    }
});
// десктопный
document.getElementById('lang-ru-desktop').addEventListener('click', () => {
    if (currentLang !== 'ru') setLanguage('ru');
});

document.getElementById('lang-en-desktop').addEventListener('click', () => {
    if (currentLang !== 'en') setLanguage('en');
});

document.getElementById('lang-ru-desktop').addEventListener('click', function() {
    if (currentLang !== 'ru') {
        setLanguage('ru');
    } else {
        // Обновляем title для текущего языка
        const t = translations[currentLang];
        this.title = t.ruBtnTitle;
    }
});

document.getElementById('lang-en-desktop').addEventListener('click', function() {
    if (currentLang !== 'en') {
        setLanguage('en');
    } else {
        // Обновляем title для текущего языка
        const t = translations[currentLang];
        this.title = t.enBtnTitle;
    }
});

// Инициализация языка при загрузке
document.addEventListener('DOMContentLoaded', function() {
    setLanguage(currentLang);
    
    // Обработчики кнопок переключения языка
    document.getElementById('lang-ru').addEventListener('click', () => {
        if (currentLang !== 'ru') setLanguage('ru');
    });

    document.getElementById('lang-en').addEventListener('click', () => {
        if (currentLang !== 'en') setLanguage('en');
    });
});

