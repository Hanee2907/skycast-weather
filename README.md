# ☁️ SkyCast – Weather Dashboard

**🌐 Live demo: https://hanee2907.github.io/skycast-weather/**

A weather and city dashboard made with plain **HTML, CSS and JavaScript**. No frameworks.

The background colour and animations change with the weather:

- ☀️ **Sunny**: blue sky with a glowing, spinning sun
- 🌙 **Clear night**: dark sky with a moon and twinkling stars
- ☁️ **Cloudy / fog**: grey sky with floating clouds
- 🌧️ **Rain**: dark sky with animated, slanted rain
- ⛈️ **Storm**: rain plus lightning flashes
- ❄️ **Snow**: light sky with falling snowflakes

## ✨ What makes it different

- 🌍 **Weather twin**: finds a city on the other side of the world with almost the same weather as yours right now
- ⏳ **Time machine**: shows the weather on this exact day last year and tells you if today is warmer or colder
- 👗 **What should I wear?**: outfit tips based on how warm it feels, rain, wind and UV
- 🚶 **Best time to go outside**: scores the next 12 hours for comfort and picks the nicest 2-hour window
- 🔊 **Weather sounds**: rain, thunder, wind, birds by day and crickets at night, all generated in the browser with the Web Audio API (no sound files)
- 🍃 **Air quality** with a colour-coded level

## Features

- Search any city in the world
- 📍 Use your current location
- Current temperature, feels like, humidity, wind, UV index, sunrise and sunset
- 24-hour forecast you can scroll sideways
- 7-day forecast with temperature range bars
- Switch between °C and °F
- Remembers your recent searches and the last city you viewed
- Works on phones, tablets and desktops

## How to run

Download or clone this repo and open `index.html` in your browser. You don't need to install anything.

## Built with

- HTML5
- CSS3 (glassmorphism cards, CSS animations, CSS variables)
- JavaScript (`fetch`, `async/await`, `localStorage`, Web Audio API)
- [Open-Meteo API](https://open-meteo.com/): free weather, air quality and historical data, no API key needed
- [flagcdn.com](https://flagcdn.com/): country flag images
