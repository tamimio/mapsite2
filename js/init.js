document.addEventListener('DOMContentLoaded', function() {
    /* Инициализация всех компонентов */
    
	// Инициализируем карту
    initMap();    
    // Переключатель видов
    initViewSwitcher();
    // Затем язык
    initLanguage();    
    
    // Дополнительная инициализация
    // initDatePicker();
    loadPermanentKml().then(() => {
        navigateTo(window.kmlFiles.length - 1);
    });
});