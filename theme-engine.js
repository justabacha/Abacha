// THEME ENGINE - The Brain of the Ghost Layer
const ThemeEngine = {
    init() {
        // Run as soon as the file is loaded
        this.applySavedTheme();
        this.applySavedWallpaper();
    },

    setTheme(themeName) {
        // 1. Change the visual attribute
        document.documentElement.setAttribute('data-theme', themeName);
        // 2. Save it to the browser's memory
        localStorage.setItem('phestone-theme', themeName);
        console.log(`Vibe shifted to: ${themeName}`);
    },

    applySavedTheme() {
        const savedTheme = localStorage.getItem('phestone-theme') || 'default';
        document.documentElement.setAttribute('data-theme', savedTheme);
    },

    setWallpaper(imageUrl) {
        document.documentElement.style.setProperty('--user-wallpaper', `url(${imageUrl})`);
        localStorage.setItem('phestone-wallpaper', imageUrl);
    },

    applySavedWallpaper() {
        const savedWall = localStorage.getItem('phestone-wallpaper');
        if (savedWall) {
            document.documentElement.style.setProperty('--user-wallpaper', `url(${savedWall})`);
        }
    }
};

// Initialize the brain
ThemeEngine.init();
  
