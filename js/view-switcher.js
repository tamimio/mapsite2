function initViewSwitcher() {
    const mapBtn = document.getElementById('map-btn');
    const stats1Btn = document.getElementById('stats1-btn');
    const stats2Btn = document.getElementById('stats2-btn');
    
    const mapContainer = document.getElementById('map-container');
    const stats1Container = document.getElementById('stats1-container');
    const stats2Container = document.getElementById('stats2-container');
    
    // Сначала скроем все контейнеры
    [mapContainer, stats1Container, stats2Container].forEach(container => {
        container.classList.remove('active');
    });
    
    // Затем покажем только активный контейнер
    mapContainer.classList.add('active');
    
    function switchView(activeBtn, activeContainer) {
        [mapBtn, stats1Btn, stats2Btn].forEach(btn => btn.classList.remove('active'));
        [mapContainer, stats1Container, stats2Container].forEach(container => {
            container.classList.remove('active');
        });
        
        activeBtn.classList.add('active');
        activeContainer.classList.add('active');
        
        if (activeContainer === mapContainer && window.map) {
            setTimeout(() => {
                window.map.invalidateSize();
            }, 100);
        }
    }
    
    mapBtn.addEventListener('click', () => switchView(mapBtn, mapContainer));
    stats1Btn.addEventListener('click', () => switchView(stats1Btn, stats1Container));
    stats2Btn.addEventListener('click', () => switchView(stats2Btn, stats2Container));
}