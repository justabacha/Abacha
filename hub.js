document.addEventListener('DOMContentLoaded', async () => {
    
    // --- 1. GHOST SPEED: INSTANT LOAD CACHE ---
    const cachedCity = localStorage.getItem('ghost_last_city') || "Nairobi";
    const cachedTemp = localStorage.getItem('ghost_last_temp') || "--";
    const cachedCond = localStorage.getItem('ghost_last_cond') || "Synchronizing...";
    
    if(document.getElementById('temp')) document.getElementById('temp').innerText = `${cachedTemp}°C`;
    if(document.getElementById('condition')) document.getElementById('condition').innerText = cachedCond;

    // --- 2. IDENTITY & CITY FETCH ---
    const getGhostCity = async () => {
        try {
            const { data: { user } } = await supabaseClient.auth.getUser();
            if (!user) return cachedCity;

            const { data: profile } = await supabaseClient
                .from('profiles')
                .select('city')
                .eq('id', user.id)
                .single();

            const city = profile?.city || "Nairobi";
            localStorage.setItem('ghost_last_city', city);
            return city;
        } catch (e) { return cachedCity; }
    };

    // --- 3. VIBE SUGGESTION LOGIC ---
  const getVibeSuggestion = (t) => {
    if (t >13 && t <= 18) return "🧊 Chilly vibe. Perfect for a dark roast coffee.";
    if (t > 19 && t <= 22) return "☁️ Smooth atmosphere. Ideal for a long walk.";
    if (t > 22 && t <= 28) return "☀️ Peak conditions. Stay hydrated, stay ghost.";
    if (t > 28) return "🔥 Heatwave. Stay in the shadows.";
    return "🎭 The vibe is neutral. Do you.";
};

    // --- 4. WEATHER ENGINE (With Suggestions & Caching) ---
    const fetchWeather = async (cityName) => {
        try {
            const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${cityName}&count=1&language=en&format=json`);
            const geoData = await geoRes.json();
            if (!geoData.results) throw new Error("City not found");
            
            const { latitude, longitude } = geoData.results[0];
            const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
            const weatherData = await weatherRes.json();
            
            const temp = Math.round(weatherData.current_weather.temperature);
            const code = weatherData.current_weather.weathercode;
            const desc = getWeatherDesc(code);
            const suggestion = getVibeSuggestion(temp);

            // Update UI
            document.getElementById('temp').innerText = `${temp}°C`;
            document.getElementById('condition').innerHTML = `${cityName}: ${desc}<br><span style="font-size:0.8em; opacity:0.6;">${suggestion}</span>`;
            
            // Cache for next fast load
            localStorage.setItem('ghost_last_temp', temp);
            localStorage.setItem('ghost_last_cond', `${cityName}: ${desc}`);
        } catch (e) {
            console.error("Weather Sync Error:", e);
        }
    };

    function getWeatherDesc(code) {
        const mapping = { 0: "Clear", 1: "Mainly Clear", 2: "Partly Cloudy", 3: "Overcast", 45: "Foggy", 51: "Drizzle", 61: "Rainy", 71: "Snowy", 95: "Stormy" };
        return mapping[code] || "Cloudy";
    }

    // --- 5. DAY/NIGHT DIMMER ---
    const applyGhostDimmer = () => {
        const hour = new Date().getHours();
        const isNight = hour >= 19 || hour <= 6;
        document.body.style.transition = "filter 2s ease";
        document.body.style.filter = isNight ? "brightness(0.8) contrast(1.1)" : "brightness(1)";
    };

    // --- 6. LIVE CLOCK ---
    const updateTime = () => {
        const timeEl = document.getElementById('time');
        if (timeEl) {
            timeEl.innerText = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        }
    };

    // INITIALIZE EVERYTHING
    updateTime();
    setInterval(updateTime, 1000);
    applyGhostDimmer();

    const userCity = await getGhostCity();
    fetchWeather(userCity);

    // DAILY QUOTE
    const quotes = [
        "Design is how it works in the shadows.",
        "Privacy is the ultimate luxury.",
        "Move in silence, let the Ghost speak.",
        "Your circle should be a sanctuary."
    ];
    document.getElementById('daily-quote').innerText = quotes[Math.floor(Math.random() * quotes.length)];
});