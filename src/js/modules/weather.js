"use strict";

import { getSelection } from "./state.js";

const API_BASE = "https://api.open-meteo.com/v1/forecast";

// Maps Open-Meteo's numeric weather codes to a FontAwesome icon + label
const WEATHER_CODE_MAP = {
  0: { icon: "fa-sun", label: "Clear sky" },
  1: { icon: "fa-sun", label: "Mainly clear" },
  2: { icon: "fa-cloud-sun", label: "Partly cloudy" },
  3: { icon: "fa-cloud", label: "Overcast" },
  45: { icon: "fa-smog", label: "Fog" },
  48: { icon: "fa-smog", label: "Depositing rime fog" },
  51: { icon: "fa-cloud-rain", label: "Light drizzle" },
  53: { icon: "fa-cloud-rain", label: "Moderate drizzle" },
  55: { icon: "fa-cloud-rain", label: "Dense drizzle" },
  61: { icon: "fa-cloud-showers-heavy", label: "Slight rain" },
  63: { icon: "fa-cloud-showers-heavy", label: "Moderate rain" },
  65: { icon: "fa-cloud-showers-heavy", label: "Heavy rain" },
  71: { icon: "fa-snowflake", label: "Slight snow fall" },
  73: { icon: "fa-snowflake", label: "Moderate snow fall" },
  75: { icon: "fa-snowflake", label: "Heavy snow fall" },
  80: { icon: "fa-cloud-showers-heavy", label: "Slight rain showers" },
  81: { icon: "fa-cloud-showers-heavy", label: "Moderate rain showers" },
  82: { icon: "fa-cloud-showers-heavy", label: "Violent rain showers" },
  95: { icon: "fa-bolt", label: "Thunderstorm" },
  96: { icon: "fa-bolt", label: "Thunderstorm with hail" },
  99: { icon: "fa-bolt", label: "Thunderstorm with heavy hail" },
};

function getWeatherInfo(code) {
  return WEATHER_CODE_MAP[code] ?? { icon: "fa-cloud", label: "Unknown" };
}

//=============================================================
// API call
export async function fetchWeather(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current:
      "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,uv_index",
    hourly: "temperature_2m,weather_code,precipitation_probability",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_direction_10m_dominant",
    timezone: "auto",
  });

  const response = await fetch(`${API_BASE}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch weather (status ${response.status})`);
  }
  return await response.json();
}

//=============================================================
// Rendering helpers
function buildHeroCard(data, cityName) {
  const current = data.current;
  const daily = data.daily;
  const info = getWeatherInfo(current.weather_code);

  const date = new Date(current.time);
  const dateLabel = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return `
    <div class="weather-hero-card weather-sunny">
      <div class="weather-location">
        <i class="fa-solid fa-location-dot"></i>
        <span>${cityName}</span>
        <span class="weather-time">${dateLabel}</span>
      </div>
      <div class="weather-hero-main">
        <div class="weather-hero-left">
          <div class="weather-hero-icon">
            <i class="fa-solid ${info.icon}"></i>
          </div>
          <div class="weather-hero-temp">
            <span class="temp-value">${Math.round(current.temperature_2m)}</span>
            <span class="temp-unit">°C</span>
          </div>
        </div>
        <div class="weather-hero-right">
          <div class="weather-condition">${info.label}</div>
          <div class="weather-feels">Feels like ${Math.round(current.apparent_temperature)}°C</div>
          <div class="weather-high-low">
            <span class="high"><i class="fa-solid fa-arrow-up"></i> ${Math.round(daily.temperature_2m_max[0])}°</span>
            <span class="low"><i class="fa-solid fa-arrow-down"></i> ${Math.round(daily.temperature_2m_min[0])}°</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

function buildDetailsGrid(data) {
  const current = data.current;
  const daily = data.daily;

  return `
    <div class="weather-details-grid">
      <div class="weather-detail-card">
        <div class="detail-icon humidity"><i class="fa-solid fa-droplet"></i></div>
        <div class="detail-info">
          <span class="detail-label">Humidity</span>
          <span class="detail-value">${current.relative_humidity_2m}%</span>
        </div>
      </div>
      <div class="weather-detail-card">
        <div class="detail-icon wind"><i class="fa-solid fa-wind"></i></div>
        <div class="detail-info">
          <span class="detail-label">Wind</span>
          <span class="detail-value">${Math.round(current.wind_speed_10m)} km/h</span>
        </div>
      </div>
      <div class="weather-detail-card">
        <div class="detail-icon uv"><i class="fa-solid fa-sun"></i></div>
        <div class="detail-info">
          <span class="detail-label">UV Index</span>
          <span class="detail-value">${Math.round(current.uv_index)}</span>
        </div>
      </div>
      <div class="weather-detail-card">
        <div class="detail-icon precip"><i class="fa-solid fa-cloud-rain"></i></div>
        <div class="detail-info">
          <span class="detail-label">Precipitation</span>
          <span class="detail-value">${daily.precipitation_probability_max[0]}%</span>
        </div>
      </div>
    </div>
  `;
}

// Builds the scrollable hourly strip, starting from the current hour and
// showing the next 8 hours
function buildHourlyForecast(data) {
  const hourly = data.hourly;
  const now = new Date(data.current.time);

  // Find the index in the hourly array matching the current hour
  let startIndex = hourly.time.findIndex((t) => new Date(t) >= now);
  if (startIndex === -1) startIndex = 0;

  const slice = Math.min(startIndex + 8, hourly.time.length);
  let html = "";

  for (let i = startIndex; i < slice; i++) {
    const time = new Date(hourly.time[i]);
    const isNow = i === startIndex;
    const timeLabel = isNow
      ? "Now"
      : time.toLocaleTimeString("en-US", { hour: "numeric" });
    const info = getWeatherInfo(hourly.weather_code[i]);
    const temp = Math.round(hourly.temperature_2m[i]);

    html += `
      <div class="hourly-item${isNow ? " now" : ""}">
        <span class="hourly-time">${timeLabel}</span>
        <div class="hourly-icon"><i class="fa-solid ${info.icon}"></i></div>
        <span class="hourly-temp">${temp}°</span>
      </div>
    `;
  }

  return `
    <div class="weather-section">
      <h3 class="weather-section-title"><i class="fa-solid fa-clock"></i> Hourly Forecast</h3>
      <div class="hourly-scroll">${html}</div>
    </div>
  `;
}

// Builds the 7-day forecast list
function buildDailyForecast(data) {
  const daily = data.daily;
  let html = "";

  for (let i = 0; i < daily.time.length; i++) {
    const [year, month, day] = daily.time[i].split("-").map(Number);
    const date = new Date(year, month - 1, day);
    const isToday = i === 0;

    const dayLabel = isToday
      ? "Today"
      : date.toLocaleDateString("en-US", { weekday: "short" });
    const dateLabel = date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
    });
    const info = getWeatherInfo(daily.weather_code[i]);
    const max = Math.round(daily.temperature_2m_max[i]);
    const min = Math.round(daily.temperature_2m_min[i]);
    const precip = daily.precipitation_probability_max[i];

    html += `
      <div class="forecast-day${isToday ? " today" : ""}">
        <div class="forecast-day-name">
          <span class="day-label">${dayLabel}</span><span class="day-date">${dateLabel}</span>
        </div>
        <div class="forecast-icon"><i class="fa-solid ${info.icon}"></i></div>
        <div class="forecast-temps">
          <span class="temp-max">${max}°</span><span class="temp-min">${min}°</span>
        </div>
        <div class="forecast-precip">
          ${precip > 0 ? `<i class="fa-solid fa-droplet"></i><span>${precip}%</span>` : ""}
        </div>
      </div>
    `;
  }

  return `
    <div class="weather-section">
      <h3 class="weather-section-title"><i class="fa-solid fa-calendar-week"></i> 7-Day Forecast</h3>
      <div class="forecast-list">${html}</div>
    </div>
  `;
}

// Shared empty/error state builder — same pattern as other modules
function buildEmptyState({ icon, title, message, showButton }) {
  return `
    <div class="empty-state">
      <div class="empty-icon"><i class="fa-solid ${icon}"></i></div>
      <h3>${title}</h3>
      <p>${message}</p>
      ${
        showButton
          ? `<button class="btn btn-primary" onclick="navigateTo('dashboard')">
              <i class="fa-solid fa-globe"></i>
              Go to Dashboard
            </button>`
          : ""
      }
    </div>
  `;
}

export function renderWeather(data, cityName) {
  const container = document.getElementById("weather-content");
  if (!container) return;

  container.innerHTML =
    buildHeroCard(data, cityName) +
    buildDetailsGrid(data) +
    buildHourlyForecast(data) +
    buildDailyForecast(data);
}

function updateWeatherHeader(countryCode, countryName, cityName) {
  const selectionBox = document.getElementById("weather-selection");
  const flagImg = document.getElementById("weather-flag");
  const nameSpan = document.getElementById("weather-country-name");
  const citySpan = document.getElementById("weather-city-display");

  if (!selectionBox) return;

  selectionBox.style.display = "flex";

  if (flagImg) {
    flagImg.src = `https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`;
    flagImg.alt = countryName;
    flagImg.style.display = "block";
  }
  if (nameSpan) nameSpan.textContent = countryName;
  if (citySpan) citySpan.textContent = cityName ? `• ${cityName}` : "";
}

function hideWeatherHeader() {
  const selectionBox = document.getElementById("weather-selection");
  if (selectionBox) selectionBox.style.display = "none";
}

export async function loadWeather() {
  const { countryCode, countryName, cityName, cityLat, cityLon } =
    getSelection();

  // TEMP DEBUG — remove this line once the issue is confirmed/fixed
  console.log("WEATHER DEBUG:", {
    countryCode,
    countryName,
    cityName,
    cityLat,
    cityLon,
  });

  const container = document.getElementById("weather-content");

  if (!countryCode || !cityName || cityLat == null || cityLon == null) {
    hideWeatherHeader();
    if (container) {
      container.innerHTML = buildEmptyState({
        icon: "fa-cloud-sun",
        title: "No City Selected",
        message:
          "Select a country and city from the dashboard to see the weather forecast",
        showButton: true,
      });
    }
    if (window.FontAwesome && window.FontAwesome.dom) {
      window.FontAwesome.dom.i2svg();
    }
    return;
  }

  if (container) {
    container.innerHTML = `<p class="holidays-loading">Loading weather...</p>`;
  }

  try {
    const data = await fetchWeather(cityLat, cityLon);
    renderWeather(data, cityName);
    updateWeatherHeader(countryCode, countryName, cityName);
  } catch (error) {
    console.error(error);
    hideWeatherHeader();
    if (container) {
      container.innerHTML = buildEmptyState({
        icon: "fa-cloud-sun",
        title: "Failed to Load Weather",
        message:
          "Something went wrong fetching the weather forecast. Please try again.",
        showButton: false,
      });
    }
  }

  if (window.FontAwesome && window.FontAwesome.dom) {
    window.FontAwesome.dom.i2svg();
  }
}
