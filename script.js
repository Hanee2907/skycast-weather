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

  // Change the sound to match the new weather
  currentTheme = theme;
  if (soundOn) {
    startSound(theme);
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
// 🔊 Weather sounds (made with the Web Audio API, no sound files!)
// ================================

const soundBtn = document.getElementById('sound-btn');
let soundOn = false;
let currentTheme = 'clear-day';
let audioCtx = null;
let masterVolume = null;
let soundSources = [];
let soundTimers = [];

// 2 seconds of random noise. Filtered, it sounds like rain or wind.
function makeNoiseSource() {
  const length = audioCtx.sampleRate * 2;
  const buffer = audioCtx.createBuffer(1, length, audioCtx.sampleRate);
  const samples = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    samples[i] = Math.random() * 2 - 1;
  }
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  return source;
}

// Play looping noise through a filter (rain = high hiss, wind = low whoosh)
function playNoise(filterType, frequency, volume) {
  const noise = makeNoiseSource();
  const filter = audioCtx.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.value = frequency;

  const gain = audioCtx.createGain();
  gain.gain.value = volume;

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(masterVolume);
  noise.start();
  soundSources.push(noise);
  return gain;
}

// A short beep that slides in pitch (used for birds and crickets)
function chirp(startFreq, endFreq, duration, volume) {
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.frequency.setValueAtTime(startFreq, now);
  osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(gain);
  gain.connect(masterVolume);
  osc.start(now);
  osc.stop(now + duration + 0.05);
}

// A deep rumble that fades in and out
function thunder() {
  const now = audioCtx.currentTime;
  const noise = makeNoiseSource();
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 150;

  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(1.2, now + 0.2);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 3);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(masterVolume);
  noise.start(now);
  noise.stop(now + 3);
}

function stopSound() {
  soundSources.forEach(function (source) {
    source.stop();
  });
  soundTimers.forEach(function (timer) {
    clearInterval(timer);
  });
  soundSources = [];
  soundTimers = [];
  if (masterVolume) masterVolume.disconnect();
}

function startSound(theme) {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  stopSound();

  masterVolume = audioCtx.createGain();
  masterVolume.gain.value = 0.5;
  masterVolume.connect(audioCtx.destination);

  if (theme === 'rain') {
    playNoise('highpass', 1200, 0.35);
    playNoise('lowpass', 500, 0.15);
  } else if (theme === 'storm') {
    playNoise('highpass', 1000, 0.45);
    playNoise('lowpass', 400, 0.25);
    soundTimers.push(setInterval(thunder, 7000)); // same speed as the lightning flash
  } else if (theme === 'clear-day') {
    playNoise('lowpass', 300, 0.05); // soft breeze
    soundTimers.push(setInterval(function () {
      if (Math.random() < 0.6) {
        chirp(3000, 4500, 0.12, 0.08);
        setTimeout(function () { chirp(3500, 5000, 0.1, 0.07); }, 150);
      }
    }, 1200));
  } else if (theme === 'clear-night') {
    soundTimers.push(setInterval(function () {
      for (let i = 0; i < 3; i++) {
        setTimeout(function () { chirp(4400, 4200, 0.04, 0.04); }, i * 70);
      }
    }, 900));
  } else {
    // cloudy, fog, snow = wind
    const wind = playNoise('lowpass', 400, 0.2);
    soundTimers.push(setInterval(function () {
      wind.gain.linearRampToValueAtTime(0.1 + Math.random() * 0.3, audioCtx.currentTime + 1.5);
    }, 1500));
  }
}

soundBtn.addEventListener('click', function () {
  soundOn = !soundOn;
  soundBtn.textContent = soundOn ? '🔊' : '🔇';
  soundBtn.setAttribute('aria-pressed', soundOn);
  soundBtn.title = soundOn ? 'Mute weather sounds' : 'Play weather sounds';

  if (soundOn) {
    startSound(currentTheme);
  } else {
    stopSound();
  }
});


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
    '&hourly=temperature_2m,weather_code,is_day,precipitation_probability,apparent_temperature,wind_speed_10m' +
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

    // These load in the background, so the main weather shows fast
    loadAirQuality(place);
    loadWeatherTwin(place, data);
    loadTimeMachine(place, data);
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
  document.getElementById('rain-today').textContent = (daily.precipitation_probability_max[0] || 0) + '%';

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

  // Smart tips
  showOutfit(data);
  showBestTime(data, startIndex);

  // Reset the extra cards while they load
  document.getElementById('aqi').textContent = '--';
  document.getElementById('aqi-text').textContent = '';
  document.getElementById('twin').innerHTML = '<p class="muted">Searching the planet...</p>';
  document.getElementById('past').innerHTML = '<p class="muted">Travelling back in time...</p>';

  // Change background to match the weather
  setTheme(current.weather_code, isDay);

  dashboard.classList.remove('hidden');
}


// ================================
// Unit helpers (all our "smart" maths works in °C and km/h)
// ================================

function toCelsius(temp) {
  return unit === 'F' ? (temp - 32) * 5 / 9 : temp;
}

function toKmh(speed) {
  return unit === 'F' ? speed * 1.609 : speed;
}


// ================================
// 👗 What should I wear?
// ================================

function showOutfit(data) {
  const feels = toCelsius(data.current.apparent_temperature);
  const wind = toKmh(data.current.wind_speed_10m);
  const rainChance = data.daily.precipitation_probability_max[0] || 0;
  const uv = data.daily.uv_index_max[0] || 0;
  const theme = getWeatherInfo(data.current.weather_code).theme;

  const items = [];
  let feeling = '';

  // Clothes based on how warm it feels
  if (feels < 0) {
    feeling = 'Freezing';
    items.push('🧥 Heavy coat', '🧤 Gloves', '🧣 Scarf', '🧶 Warm hat');
  } else if (feels < 10) {
    feeling = 'Cold';
    items.push('🧥 Warm jacket', '🧣 Scarf', '👖 Long pants');
  } else if (feels < 18) {
    feeling = 'Chilly';
    items.push('🧥 Light jacket or hoodie', '👖 Jeans');
  } else if (feels < 26) {
    feeling = 'Nice and mild';
    items.push('👕 T-shirt', '👖 Jeans or skirt');
  } else {
    feeling = 'Hot';
    items.push('🩳 Shorts', '👕 Light, loose clothes', '💧 Water bottle');
  }

  // Extras for rain, snow, wind and sun
  let extra = '';
  if (theme === 'rain' || theme === 'storm' || rainChance >= 50) {
    items.push('☂️ Umbrella', '👟 Waterproof shoes');
    extra = ' with rain on the way';
  } else if (rainChance >= 25) {
    items.push('☂️ Small umbrella, just in case');
    extra = ' with a small chance of rain';
  }

  if (theme === 'snow') {
    items.push('🥾 Snow boots');
    extra = ' and snowy';
  }

  if (wind > 30) {
    items.push('🌬️ Windproof layer');
    extra += ', and windy';
  }

  if (uv >= 6) {
    items.push('🧴 Sunscreen', '🕶️ Sunglasses');
  } else if (uv >= 3 && theme === 'clear') {
    items.push('🕶️ Sunglasses');
  }

  document.getElementById('outfit-summary').textContent = feeling + extra + '.';

  const outfitBox = document.getElementById('outfit');
  outfitBox.innerHTML = '';
  items.forEach(function (item) {
    const tag = document.createElement('span');
    tag.className = 'outfit-item';
    tag.textContent = item;
    outfitBox.appendChild(tag);
  });
}


// ================================
// 🚶 Best time to go outside
// ================================

// Give one hour a score from 0 (awful) to 100 (perfect)
function comfortScore(hourly, i) {
  const feels = toCelsius(hourly.apparent_temperature[i]);
  const rain = hourly.precipitation_probability[i] || 0;
  const wind = toKmh(hourly.wind_speed_10m[i]);

  let score = 100;
  score -= Math.abs(feels - 21) * 4;          // 21°C feels perfect
  score -= rain * 0.6;                        // rain is not fun
  score -= Math.max(0, wind - 15) * 1.5;      // a little wind is okay
  if (hourly.is_day[i] === 0) score -= 25;    // it's dark

  return Math.max(0, Math.min(100, Math.round(score)));
}

function showBestTime(data, startIndex) {
  const hourly = data.hourly;
  const barsBox = document.getElementById('comfort-bars');
  barsBox.innerHTML = '';

  const scores = [];
  for (let i = startIndex; i < startIndex + 12 && i < hourly.time.length; i++) {
    scores.push({ index: i, score: comfortScore(hourly, i) });
  }

  // Find the best 2-hour window
  let best = 0;
  for (let k = 1; k < scores.length - 1; k++) {
    const avg = (scores[k].score + scores[k + 1].score) / 2;
    const bestAvg = (scores[best].score + scores[best + 1].score) / 2;
    if (avg > bestAvg) best = k;
  }

  // Draw the little bar chart
  scores.forEach(function (item, k) {
    const bar = document.createElement('div');
    bar.className = 'bar';
    if (k === best || k === best + 1) bar.classList.add('best');
    bar.style.height = Math.max(6, item.score) + '%';
    bar.title = formatHour(hourly.time[item.index]) + ': ' + item.score + '/100';
    barsBox.appendChild(bar);
  });

  const first = scores[best].index;
  const bestScore = Math.round((scores[best].score + scores[best + 1].score) / 2);
  const endTime = hourly.time[first + 2] || hourly.time[first + 1];

  const timeText = document.getElementById('best-time');
  const whyText = document.getElementById('best-time-why');

  if (bestScore < 30) {
    timeText.textContent = 'Stay cozy indoors ☕';
    whyText.textContent = 'No great hours in the next 12. Maybe watch a movie?';
  } else {
    timeText.textContent = formatHour(hourly.time[first]) + ' – ' + formatHour(endTime);
    whyText.textContent =
      'Feels like ' + round(hourly.apparent_temperature[first]) + '° · ' +
      (hourly.precipitation_probability[first] || 0) + '% rain · ' +
      'comfort ' + bestScore + '/100';
  }
}


// ================================
// 🍃 Air quality
// ================================

async function loadAirQuality(place) {
  const aqiValue = document.getElementById('aqi');
  const aqiText = document.getElementById('aqi-text');

  try {
    const url = 'https://air-quality-api.open-meteo.com/v1/air-quality' +
      '?latitude=' + place.lat + '&longitude=' + place.lon + '&current=us_aqi';
    const response = await fetch(url);
    const data = await response.json();
    if (place !== lastPlace) return; // user already searched another city

    const aqi = Math.round(data.current.us_aqi);
    let level = '';
    let color = '';

    if (aqi <= 50)       { level = 'Good';           color = '#4ade80'; }
    else if (aqi <= 100) { level = 'Moderate';       color = '#facc15'; }
    else if (aqi <= 150) { level = 'Sensitive risk'; color = '#fb923c'; }
    else if (aqi <= 200) { level = 'Unhealthy';      color = '#f87171'; }
    else if (aqi <= 300) { level = 'Very unhealthy'; color = '#c084fc'; }
    else                 { level = 'Hazardous';      color = '#9f1239'; }

    aqiValue.textContent = aqi;
    aqiText.innerHTML = '<span class="dot" style="background:' + color + '"></span>' + level;
  } catch (error) {
    aqiValue.textContent = 'N/A';
  }
}


// ================================
// 🌍 Weather twin: a far-away city with the same weather right now
// ================================

const twinCities = [
  { name: 'Tokyo',          flag: 'jp', lat: 35.68,  lon: 139.69 },
  { name: 'New York',       flag: 'us', lat: 40.71,  lon: -74.01 },
  { name: 'Paris',          flag: 'fr', lat: 48.85,  lon: 2.35 },
  { name: 'London',         flag: 'gb', lat: 51.51,  lon: -0.13 },
  { name: 'Sydney',         flag: 'au', lat: -33.87, lon: 151.21 },
  { name: 'Rio de Janeiro', flag: 'br', lat: -22.91, lon: -43.17 },
  { name: 'Cairo',          flag: 'eg', lat: 30.04,  lon: 31.24 },
  { name: 'Mumbai',         flag: 'in', lat: 19.08,  lon: 72.88 },
  { name: 'Delhi',          flag: 'in', lat: 28.61,  lon: 77.21 },
  { name: 'Dubai',          flag: 'ae', lat: 25.20,  lon: 55.27 },
  { name: 'Moscow',         flag: 'ru', lat: 55.76,  lon: 37.62 },
  { name: 'Reykjavik',      flag: 'is', lat: 64.15,  lon: -21.94 },
  { name: 'Cape Town',      flag: 'za', lat: -33.92, lon: 18.42 },
  { name: 'Nairobi',        flag: 'ke', lat: -1.29,  lon: 36.82 },
  { name: 'Bangkok',        flag: 'th', lat: 13.76,  lon: 100.50 },
  { name: 'Singapore',      flag: 'sg', lat: 1.35,   lon: 103.82 },
  { name: 'Seoul',          flag: 'kr', lat: 37.57,  lon: 126.98 },
  { name: 'Beijing',        flag: 'cn', lat: 39.90,  lon: 116.40 },
  { name: 'Mexico City',    flag: 'mx', lat: 19.43,  lon: -99.13 },
  { name: 'Los Angeles',    flag: 'us', lat: 34.05,  lon: -118.24 },
  { name: 'Toronto',        flag: 'ca', lat: 43.65,  lon: -79.38 },
  { name: 'Buenos Aires',   flag: 'ar', lat: -34.60, lon: -58.38 },
  { name: 'Lima',           flag: 'pe', lat: -12.05, lon: -77.04 },
  { name: 'Istanbul',       flag: 'tr', lat: 41.01,  lon: 28.98 },
  { name: 'Rome',           flag: 'it', lat: 41.90,  lon: 12.50 },
  { name: 'Berlin',         flag: 'de', lat: 52.52,  lon: 13.41 },
  { name: 'Madrid',         flag: 'es', lat: 40.42,  lon: -3.70 },
  { name: 'Oslo',           flag: 'no', lat: 59.91,  lon: 10.75 },
  { name: 'Honolulu',       flag: 'us', lat: 21.31,  lon: -157.86 },
  { name: 'Anchorage',      flag: 'us', lat: 61.22,  lon: -149.90 },
  { name: 'Auckland',       flag: 'nz', lat: -36.85, lon: 174.76 },
  { name: 'Bali',           flag: 'id', lat: -8.65,  lon: 115.22 },
  { name: 'Marrakech',      flag: 'ma', lat: 31.63,  lon: -7.99 },
  { name: 'Lagos',          flag: 'ng', lat: 6.52,   lon: 3.38 },
  { name: 'Kathmandu',      flag: 'np', lat: 27.72,  lon: 85.32 },
  { name: 'Vancouver',      flag: 'ca', lat: 49.28,  lon: -123.12 }
];

async function loadWeatherTwin(place, data) {
  const twinBox = document.getElementById('twin');

  // Skip cities that are too close to the one we're looking at
  const farCities = twinCities.filter(function (city) {
    return Math.abs(city.lat - place.lat) + Math.abs(city.lon - place.lon) > 5;
  });

  try {
    // Open-Meteo lets us ask for many places in ONE request
    let url = 'https://api.open-meteo.com/v1/forecast' +
      '?latitude=' + farCities.map(function (c) { return c.lat; }).join(',') +
      '&longitude=' + farCities.map(function (c) { return c.lon; }).join(',') +
      '&current=temperature_2m,weather_code,is_day';
    if (unit === 'F') url += '&temperature_unit=fahrenheit';

    const response = await fetch(url);
    const results = await response.json();
    if (place !== lastPlace) return;

    const myTemp = data.current.temperature_2m;
    const myTheme = getWeatherInfo(data.current.weather_code).theme;

    // Score each city: smaller = more similar
    const matches = farCities.map(function (city, i) {
      const now = results[i].current;
      const sameSky = getWeatherInfo(now.weather_code).theme === myTheme;
      return {
        city: city,
        temp: now.temperature_2m,
        code: now.weather_code,
        isDay: now.is_day === 1,
        diff: Math.abs(now.temperature_2m - myTemp) + (sameSky ? 0 : 6)
      };
    });

    matches.sort(function (a, b) { return a.diff - b.diff; });

    const twin = matches[0];
    const runnerUp = matches[1];
    const info = getWeatherInfo(twin.code);
    const tempGap = round(Math.abs(twin.temp - myTemp));

    twinBox.innerHTML =
      '<div class="twin-main">' +
        '<img class="twin-flag" src="https://flagcdn.com/w80/' + twin.city.flag + '.png" alt="' + twin.city.name + ' flag">' +
        '<div>' +
          '<p class="twin-name">' + twin.city.name + '</p>' +
          '<p>' + (twin.isDay ? info.icon : info.night) + ' ' + round(twin.temp) + '° · ' + info.text + '</p>' +
        '</div>' +
      '</div>' +
      '<p class="muted">' +
        (tempGap === 0 ? 'Exactly the same temperature!' : 'Only ' + tempGap + '° different.') +
        ' Runner-up: ' + runnerUp.city.name + ' (' + round(runnerUp.temp) + '°)' +
      '</p>';
  } catch (error) {
    twinBox.innerHTML = '<p class="muted">Could not search the planet right now.</p>';
  }
}


// ================================
// ⏳ Time machine: this day last year
// ================================

async function loadTimeMachine(place, data) {
  const pastBox = document.getElementById('past');

  // Same date, one year ago (29 Feb becomes 28 Feb)
  const today = data.current.time.slice(0, 10);
  let lastYear = (Number(today.slice(0, 4)) - 1) + today.slice(4);
  if (lastYear.endsWith('02-29')) lastYear = lastYear.replace('02-29', '02-28');

  const date = new Date(lastYear + 'T12:00');
  document.getElementById('past-date').textContent =
    'On ' + date.getDate() + ' ' + monthNames[date.getMonth()] + ' ' + date.getFullYear() + ' it was...';

  try {
    let url = 'https://archive-api.open-meteo.com/v1/archive' +
      '?latitude=' + place.lat + '&longitude=' + place.lon +
      '&start_date=' + lastYear + '&end_date=' + lastYear +
      '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto';
    if (unit === 'F') url += '&temperature_unit=fahrenheit&precipitation_unit=inch';

    const response = await fetch(url);
    const past = await response.json();
    if (place !== lastPlace) return;

    const pastHigh = past.daily.temperature_2m_max[0];
    const pastLow = past.daily.temperature_2m_min[0];
    const pastRain = past.daily.precipitation_sum[0];
    const info = getWeatherInfo(past.daily.weather_code[0]);
    const diff = round(data.daily.temperature_2m_max[0] - pastHigh);

    let compare = '';
    if (diff > 0) {
      compare = '🔥 Today is <strong>' + diff + '° warmer</strong> than last year.';
    } else if (diff < 0) {
      compare = '🧊 Today is <strong>' + Math.abs(diff) + '° colder</strong> than last year.';
    } else {
      compare = '🤝 Today has the <strong>same high</strong> as last year!';
    }

    pastBox.innerHTML =
      '<div class="past-main">' +
        '<span class="past-icon">' + info.icon + '</span>' +
        '<div>' +
          '<p class="twin-name">' + round(pastHigh) + '° / ' + round(pastLow) + '°</p>' +
          '<p>' + info.text + (pastRain > 0 ? ' · ' + pastRain + (unit === 'F' ? ' in' : ' mm') + ' of rain' : '') + '</p>' +
        '</div>' +
      '</div>' +
      '<p>' + compare + '</p>';
  } catch (error) {
    pastBox.innerHTML = '<p class="muted">The time machine is broken right now. Try again later.</p>';
  }
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
