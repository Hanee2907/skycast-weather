// ================================
// SkyCast - Weather Dashboard
// Uses the free Open-Meteo API (no API key needed)
// ================================

// ----- Get elements from the page -----
const searchForm = document.getElementById('search-form');
const cityInput = document.getElementById('city-input');
const locationBtn = document.getElementById('location-btn');
const unitBtn = document.getElementById('unit-btn');
const message = document.getElementById('message');
const loader = document.getElementById('loader');
const dashboard = document.getElementById('dashboard');
const recentBox = document.getElementById('recent');

// ----- App settings -----
let unit = localStorage.getItem('unit') || 'C'; // 'C' or 'F'
let lastPlace = null; // the last city we showed

// Weather codes from Open-Meteo -> description, icon and theme
const weatherCodes = {
  0:  { text: 'Clear sky',          icon: '☀️', night: '🌙', theme: 'clear' },
  1:  { text: 'Mainly clear',       icon: '🌤️', night: '🌙', theme: 'clear' },
  2:  { text: 'Partly cloudy',      icon: '⛅', night: '☁️', theme: 'cloudy' },
  3:  { text: 'Overcast',           icon: '☁️', night: '☁️', theme: 'cloudy' },
  45: { text: 'Foggy',              icon: '🌫️', night: '🌫️', theme: 'fog' },
  48: { text: 'Icy fog',            icon: '🌫️', night: '🌫️', theme: 'fog' },
  51: { text: 'Light drizzle',      icon: '🌦️', night: '🌧️', theme: 'rain' },
  53: { text: 'Drizzle',            icon: '🌦️', night: '🌧️', theme: 'rain' },
  55: { text: 'Heavy drizzle',      icon: '🌧️', night: '🌧️', theme: 'rain' },
  56: { text: 'Freezing drizzle',   icon: '🌧️', night: '🌧️', theme: 'rain' },
  57: { text: 'Freezing drizzle',   icon: '🌧️', night: '🌧️', theme: 'rain' },
  61: { text: 'Light rain',         icon: '🌦️', night: '🌧️', theme: 'rain' },
  63: { text: 'Rain',               icon: '🌧️', night: '🌧️', theme: 'rain' },
  65: { text: 'Heavy rain',         icon: '🌧️', night: '🌧️', theme: 'rain' },
  66: { text: 'Freezing rain',      icon: '🌧️', night: '🌧️', theme: 'rain' },
  67: { text: 'Freezing rain',      icon: '🌧️', night: '🌧️', theme: 'rain' },
  71: { text: 'Light snow',         icon: '🌨️', night: '🌨️', theme: 'snow' },
  73: { text: 'Snow',               icon: '❄️', night: '❄️', theme: 'snow' },
  75: { text: 'Heavy snow',         icon: '❄️', night: '❄️', theme: 'snow' },
  77: { text: 'Snow grains',        icon: '🌨️', night: '🌨️', theme: 'snow' },
  80: { text: 'Rain showers',       icon: '🌦️', night: '🌧️', theme: 'rain' },
  81: { text: 'Rain showers',       icon: '🌧️', night: '🌧️', theme: 'rain' },
  82: { text: 'Violent showers',    icon: '⛈️', night: '⛈️', theme: 'storm' },
  85: { text: 'Snow showers',       icon: '🌨️', night: '🌨️', theme: 'snow' },
  86: { text: 'Heavy snow showers', icon: '❄️', night: '❄️', theme: 'snow' },
  95: { text: 'Thunderstorm',       icon: '⛈️', night: '⛈️', theme: 'storm' },
  96: { text: 'Thunderstorm, hail', icon: '⛈️', night: '⛈️', theme: 'storm' },
  99: { text: 'Thunderstorm, hail', icon: '⛈️', night: '⛈️', theme: 'storm' }
};

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];


// ================================
// Helper functions
// ================================

function getWeatherInfo(code) {
  return weatherCodes[code] || { text: 'Unknown', icon: '🌡️', night: '🌡️', theme: 'cloudy' };
}

function showMessage(text) {
  message.textContent = text;
}

function showLoader(show) {
  if (show) {
    loader.classList.remove('hidden');
  } else {
    loader.classList.add('hidden');
  }
}

// The API gives times like "2026-10-28T14:00" (already in the city's local time)
function formatHour(timeString) {
  let hour = Number(timeString.slice(11, 13));
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  if (hour === 0) hour = 12;
  return hour + ' ' + ampm;
}

function formatClock(timeString) {
  let hour = Number(timeString.slice(11, 13));
  const minutes = timeString.slice(14, 16);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  if (hour === 0) hour = 12;
  return hour + ':' + minutes + ' ' + ampm;
}

function formatDay(dateString) {
  // Add T12:00 so the date does not shift because of time zones
  const date = new Date(dateString + 'T12:00');
  return dayNames[date.getDay()];
}

function formatFullDate(timeString) {
  const date = new Date(timeString.slice(0, 10) + 'T12:00');
  return dayNames[date.getDay()] + ', ' + date.getDate() + ' ' + monthNames[date.getMonth()] +
         ' · ' + formatClock(timeString);
}

function round(number) {
  return Math.round(number);
}


// ================================
// Background + animations
// ================================

function setTheme(code, isDay) {
  let theme = getWeatherInfo(code).theme;

  if (theme === 'clear') {
    theme = isDay ? 'clear-day' : 'clear-night';
  }

  document.body.className = theme;
  if (!isDay) {
    document.body.classList.add('night');
  }

  // Make rain or snow only when needed
  if (theme === 'rain' || theme === 'storm') {
    makeRain(theme === 'storm' ? 140 : 90);
  } else {
    document.getElementById('rain').innerHTML = '';
  }

  if (theme === 'snow') {
    makeSnow(60);
  } else {
    document.getElementById('snow').innerHTML = '';
  }
}

function makeRain(amount) {
  const rain = document.getElementById('rain');
  rain.innerHTML = '';

  for (let i = 0; i < amount; i++) {
    const drop = document.createElement('div');
    drop.className = 'drop';
    drop.style.left = Math.random() * 100 + '%';
    drop.style.animationDuration = (0.5 + Math.random() * 0.5) + 's';
    drop.style.animationDelay = (Math.random() * 2) + 's';
    drop.style.opacity = 0.3 + Math.random() * 0.7;
    rain.appendChild(drop);
  }
}

function makeSnow(amount) {
  const snow = document.getElementById('snow');
  snow.innerHTML = '';

  for (let i = 0; i < amount; i++) {
    const flake = document.createElement('div');
    flake.className = 'flake';
    flake.textContent = '❄';
    flake.style.left = Math.random() * 100 + '%';
    flake.style.fontSize = (8 + Math.random() * 16) + 'px';
    flake.style.animationDuration = (6 + Math.random() * 8) + 's';
    flake.style.animationDelay = (Math.random() * -14) + 's';
    flake.style.opacity = 0.5 + Math.random() * 0.5;
    snow.appendChild(flake);
  }
}


// ================================
// Getting data from the API
// ================================

// Step 1: turn a city name into latitude / longitude
async function searchCity(cityName) {
  const url = 'https://geocoding-api.open-meteo.com/v1/search?count=1&language=en&name=' +
              encodeURIComponent(cityName);

  const response = await fetch(url);
  const data = await response.json();

  if (!data.results || data.results.length === 0) {
    throw new Error('City not found. Check the spelling and try again.');
  }

  const city = data.results[0];
  return {
    name: city.name,
    country: city.country || '',
    lat: city.latitude,
    lon: city.longitude
  };
}

// Step 2: get the weather for latitude / longitude
async function getWeather(lat, lon) {
  let url = 'https://api.open-meteo.com/v1/forecast' +
    '?latitude=' + lat +
    '&longitude=' + lon +
    '&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m' +
    '&hourly=temperature_2m,weather_code,is_day' +
    '&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max' +
    '&timezone=auto&forecast_days=7';

  if (unit === 'F') {
    url += '&temperature_unit=fahrenheit&wind_speed_unit=mph';
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Could not load the weather. Please try again.');
  }
  return await response.json();
}

// Load and show weather for a place
async function loadWeather(place) {
  showMessage('');
  showLoader(true);
  dashboard.classList.add('hidden');

  try {
    const data = await getWeather(place.lat, place.lon);
    lastPlace = place;
    localStorage.setItem('lastPlace', JSON.stringify(place));
    showWeather(place, data);
    saveRecent(place);
  } catch (error) {
    showMessage('⚠️ ' + error.message);
  }

  showLoader(false);
}


// ================================
// Show the data on the page
// ================================

function showWeather(place, data) {
  const current = data.current;
  const daily = data.daily;
  const hourly = data.hourly;
  const info = getWeatherInfo(current.weather_code);
  const isDay = current.is_day === 1;
  const windUnit = unit === 'F' ? 'mph' : 'km/h';

  // Current weather
  document.getElementById('city-name').textContent =
    place.name + (place.country ? ', ' + place.country : '');
  document.getElementById('date-time').textContent = formatFullDate(current.time);
  document.getElementById('current-icon').textContent = isDay ? info.icon : info.night;
  document.getElementById('current-temp').textContent = round(current.temperature_2m) + '°';
  document.getElementById('current-desc').textContent = info.text;
  document.getElementById('temp-max').textContent = round(daily.temperature_2m_max[0]) + '°';
  document.getElementById('temp-min').textContent = round(daily.temperature_2m_min[0]) + '°';

  // Details
  document.getElementById('feels-like').textContent = round(current.apparent_temperature) + '°';
  document.getElementById('humidity').textContent = current.relative_humidity_2m + '%';
  document.getElementById('wind').textContent = round(current.wind_speed_10m) + ' ' + windUnit;
  document.getElementById('uv').textContent = round(daily.uv_index_max[0]);
  document.getElementById('sunrise').textContent = formatClock(daily.sunrise[0]);
  document.getElementById('sunset').textContent = formatClock(daily.sunset[0]);

  // Hourly forecast: start from the current hour and show 24 hours
  const hourlyBox = document.getElementById('hourly');
  hourlyBox.innerHTML = '';

  let startIndex = hourly.time.findIndex(function (t) {
    return t.slice(0, 13) === current.time.slice(0, 13);
  });
  if (startIndex === -1) startIndex = 0;

  for (let i = startIndex; i < startIndex + 24 && i < hourly.time.length; i++) {
    const hourInfo = getWeatherInfo(hourly.weather_code[i]);
    const icon = hourly.is_day[i] === 1 ? hourInfo.icon : hourInfo.night;
    const label = i === startIndex ? 'Now' : formatHour(hourly.time[i]);

    const div = document.createElement('div');
    div.className = i === startIndex ? 'hour now' : 'hour';
    div.innerHTML =
      '<p>' + label + '</p>' +
      '<p class="icon">' + icon + '</p>' +
      '<p><strong>' + round(hourly.temperature_2m[i]) + '°</strong></p>';
    hourlyBox.appendChild(div);
  }

  // 7 day forecast
  const dailyBox = document.getElementById('daily');
  dailyBox.innerHTML = '';

  // Find the coldest and hottest temps of the week (for the range bars)
  const weekLow = Math.min(...daily.temperature_2m_min);
  const weekHigh = Math.max(...daily.temperature_2m_max);
  const weekSpread = (weekHigh - weekLow) || 1;

  for (let i = 0; i < daily.time.length; i++) {
    const dayInfo = getWeatherInfo(daily.weather_code[i]);
    const dayLabel = i === 0 ? 'Today' : formatDay(daily.time[i]);
    const rainChance = daily.precipitation_probability_max[i];
    const low = daily.temperature_2m_min[i];
    const high = daily.temperature_2m_max[i];

    // Where the coloured bar starts and how wide it is (in %)
    const barStart = ((low - weekLow) / weekSpread) * 100;
    const barWidth = ((high - low) / weekSpread) * 100;

    const row = document.createElement('div');
    row.className = 'day';
    row.innerHTML =
      '<span class="name">' + dayLabel + '</span>' +
      '<span class="icon">' + dayInfo.icon + '</span>' +
      '<span class="rain-chance">' + dayInfo.text +
        (rainChance ? ' · 💧' + rainChance + '%' : '') + '</span>' +
      '<span class="low">' + round(low) + '°</span>' +
      '<div class="range"><div class="range-fill" style="left:' + barStart +
        '%; width:' + barWidth + '%"></div></div>' +
      '<span class="high">' + round(high) + '°</span>';
    dailyBox.appendChild(row);
  }

  // Change background to match the weather
  setTheme(current.weather_code, isDay);

  dashboard.classList.remove('hidden');
}


// ================================
// Recent searches (saved in the browser)
// ================================

function getRecent() {
  return JSON.parse(localStorage.getItem('recent') || '[]');
}

function saveRecent(place) {
  let recent = getRecent();

  // Remove it if already there, then put it first
  recent = recent.filter(function (p) {
    return p.name !== place.name;
  });
  recent.unshift(place);
  recent = recent.slice(0, 5);

  localStorage.setItem('recent', JSON.stringify(recent));
  showRecent();
}

function showRecent() {
  const recent = getRecent();
  recentBox.innerHTML = '';

  recent.forEach(function (place) {
    const chip = document.createElement('button');
    chip.className = 'chip';
    chip.textContent = place.name;
    chip.addEventListener('click', function () {
      loadWeather(place);
    });
    recentBox.appendChild(chip);
  });
}


// ================================
// Events (what happens when user clicks)
// ================================

// Search form
searchForm.addEventListener('submit', async function (event) {
  event.preventDefault();
  const cityName = cityInput.value.trim();

  if (cityName === '') {
    showMessage('Please type a city name.');
    return;
  }

  showLoader(true);
  dashboard.classList.add('hidden');

  try {
    const place = await searchCity(cityName);
    cityInput.value = '';
    await loadWeather(place);
  } catch (error) {
    showLoader(false);
    showMessage('⚠️ ' + error.message);
    if (lastPlace) dashboard.classList.remove('hidden');
  }
});

// "Use my location" button
locationBtn.addEventListener('click', function () {
  if (!navigator.geolocation) {
    showMessage('Your browser does not support location.');
    return;
  }

  showMessage('Finding your location...');

  navigator.geolocation.getCurrentPosition(
    async function (position) {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      let name = 'My location';
      let country = '';

      // Try to get the city name from the coordinates
      try {
        const res = await fetch(
          'https://api.bigdatacloud.net/data/reverse-geocode-client?localityLanguage=en' +
          '&latitude=' + lat + '&longitude=' + lon
        );
        const data = await res.json();
        name = data.city || data.locality || name;
        country = data.countryName || '';
      } catch (error) {
        // If it fails, we just keep "My location"
      }

      loadWeather({ name: name, country: country, lat: lat, lon: lon });
    },
    function () {
      showMessage('⚠️ Location permission was denied. Please search for a city instead.');
    }
  );
});

// °C / °F button
function updateUnitButton() {
  unitBtn.textContent = unit === 'C' ? '°C' : '°F';
}

unitBtn.addEventListener('click', function () {
  unit = unit === 'C' ? 'F' : 'C';
  localStorage.setItem('unit', unit);
  updateUnitButton();

  if (lastPlace) {
    loadWeather(lastPlace);
  }
});


// ================================
// Start the app
// ================================

updateUnitButton();
showRecent();

const savedPlace = JSON.parse(localStorage.getItem('lastPlace') || 'null');
if (savedPlace) {
  loadWeather(savedPlace);
} else {
  loadWeather({ name: 'London', country: 'United Kingdom', lat: 51.5085, lon: -0.1257 });
}
