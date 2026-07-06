"use strict";

import { getSelection } from "./state.js";

const API_BASE = "https://api.sunrise-sunset.org/json";

export async function fetchSunTimes(lat, lon, date) {
  const params = new URLSearchParams({
    lat,
    lng: lon,
    date,
    formatted: "0",
  });

  const response = await fetch(`${API_BASE}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch sun times (status ${response.status})`);
  }

  const data = await response.json();
  if (data.status !== "OK") {
    throw new Error(`Sunrise-Sunset API returned status: ${data.status}`);
  }

  return data.results;
}

function formatTime(isoString) {
  return new Date(isoString).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDuration(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.round((totalSeconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

function buildMainCard(results, cityName, dateObj) {
  const dateLabel = dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const dayLabel = dateObj.toLocaleDateString("en-US", { weekday: "long" });
  const dayLengthLabel = formatDuration(results.day_length);

  return `
    <div class="sun-main-card">
      <div class="sun-main-header">
        <div class="sun-location">
          <h2><i class="fa-solid fa-location-dot"></i> ${cityName}</h2>
          <p>Sun times for your selected location</p>
        </div>
        <div class="sun-date-display">
          <div class="date">${dateLabel}</div>
          <div class="day">${dayLabel}</div>
        </div>
      </div>

      <div class="sun-times-grid">
        <div class="sun-time-card dawn">
          <div class="icon"><i class="fa-solid fa-moon"></i></div>
          <div class="label">Dawn</div>
          <div class="time">${formatTime(results.civil_twilight_begin)}</div>
          <div class="sub-label">Civil Twilight</div>
        </div>
        <div class="sun-time-card sunrise">
          <div class="icon"><i class="fa-solid fa-sun"></i></div>
          <div class="label">Sunrise</div>
          <div class="time">${formatTime(results.sunrise)}</div>
          <div class="sub-label">Golden Hour Start</div>
        </div>
        <div class="sun-time-card noon">
          <div class="icon"><i class="fa-solid fa-sun"></i></div>
          <div class="label">Solar Noon</div>
          <div class="time">${formatTime(results.solar_noon)}</div>
          <div class="sub-label">Sun at Highest</div>
        </div>
        <div class="sun-time-card sunset">
          <div class="icon"><i class="fa-solid fa-sun"></i></div>
          <div class="label">Sunset</div>
          <div class="time">${formatTime(results.sunset)}</div>
          <div class="sub-label">Golden Hour End</div>
        </div>
        <div class="sun-time-card dusk">
          <div class="icon"><i class="fa-solid fa-moon"></i></div>
          <div class="label">Dusk</div>
          <div class="time">${formatTime(results.civil_twilight_end)}</div>
          <div class="sub-label">Civil Twilight</div>
        </div>
        <div class="sun-time-card daylight">
          <div class="icon"><i class="fa-solid fa-hourglass-half"></i></div>
          <div class="label">Day Length</div>
          <div class="time">${dayLengthLabel}</div>
          <div class="sub-label">Total Daylight</div>
        </div>
      </div>
    </div>
  `;
}

function buildDayLengthCard(results) {
  const totalSecondsInDay = 24 * 60 * 60;
  const daylightSeconds = results.day_length;
  const darknessSeconds = totalSecondsInDay - daylightSeconds;
  const daylightPercent = ((daylightSeconds / totalSecondsInDay) * 100).toFixed(
    1,
  );

  return `
    <div class="day-length-card">
      <h3><i class="fa-solid fa-chart-pie"></i> Daylight Distribution</h3>
      <div class="day-progress">
        <div class="day-progress-bar">
          <div class="day-progress-fill" style="width: ${daylightPercent}%"></div>
        </div>
      </div>
      <div class="day-length-stats">
        <div class="day-stat">
          <div class="value">${formatDuration(daylightSeconds)}</div>
          <div class="label">Daylight</div>
        </div>
        <div class="day-stat">
          <div class="value">${daylightPercent}%</div>
          <div class="label">of 24 Hours</div>
        </div>
        <div class="day-stat">
          <div class="value">${formatDuration(darknessSeconds)}</div>
          <div class="label">Darkness</div>
        </div>
      </div>
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

export function renderSunTimes(results, cityName, dateObj) {
  const container = document.getElementById("sun-times-content");
  if (!container) return;

  container.innerHTML =
    buildMainCard(results, cityName, dateObj) + buildDayLengthCard(results);
}

function updateSunTimesHeader(countryCode, countryName, cityName) {
  const selectionBox = document.getElementById("sun-times-selection");
  const flagImg = document.getElementById("sun-times-flag");
  const nameSpan = document.getElementById("sun-times-country-name");
  const citySpan = document.getElementById("sun-times-city-display");

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

function hideSunTimesHeader() {
  const selectionBox = document.getElementById("sun-times-selection");
  if (selectionBox) selectionBox.style.display = "none";
}

export async function loadSunTimes() {
  const { countryCode, countryName, cityName, cityLat, cityLon } =
    getSelection();
  const container = document.getElementById("sun-times-content");

  if (!countryCode || !cityName || cityLat == null || cityLon == null) {
    hideSunTimesHeader();
    if (container) {
      container.innerHTML = buildEmptyState({
        icon: "fa-sun",
        title: "No City Selected",
        message:
          "Select a country and city from the dashboard to see sunrise and sunset times",
        showButton: true,
      });
    }
    if (window.FontAwesome && window.FontAwesome.dom) {
      window.FontAwesome.dom.i2svg();
    }
    return;
  }

  if (container) {
    container.innerHTML = `<p class="holidays-loading">Loading sun times...</p>`;
  }

  try {
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0]; // "YYYY-MM-DD"

    const results = await fetchSunTimes(cityLat, cityLon, dateStr);
    renderSunTimes(results, cityName, today);
    updateSunTimesHeader(countryCode, countryName, cityName);
  } catch (error) {
    console.error(error);
    hideSunTimesHeader();
    if (container) {
      container.innerHTML = buildEmptyState({
        icon: "fa-sun",
        title: "Failed to Load Sun Times",
        message:
          "Something went wrong fetching sunrise and sunset times. Please try again.",
        showButton: false,
      });
    }
  }

  if (window.FontAwesome && window.FontAwesome.dom) {
    window.FontAwesome.dom.i2svg();
  }
}
