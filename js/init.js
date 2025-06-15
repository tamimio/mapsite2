document.addEventListener('DOMContentLoaded', function() {
    // Инициализация всех компонентов
    // Переключатель видов
    initViewSwitcher();
	// Инициализируем карту
    initMap();    
    // Затем язык
    initLanguage();    
    
    // Дополнительная инициализация
    // initDatePicker();
    loadPermanentKml().then(() => {
        navigateTo(window.kmlFiles.length - 1);
    });
});