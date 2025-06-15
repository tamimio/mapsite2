document.addEventListener('DOMContentLoaded', function() {
    // Инициализация всех компонентов
	// Сначала инициализируем карту
    initMap();    
    // Затем язык
    initLanguage();    
    // Затем переключатель видов
    initViewSwitcher();
    
    // Дополнительная инициализация
    // initDatePicker();
    loadPermanentKml().then(() => {
        navigateTo(window.kmlFiles.length - 1);
    });
});