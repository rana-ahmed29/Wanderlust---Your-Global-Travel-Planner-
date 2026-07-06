
"use strict";

import { getSelection } from "./state.js";
import { wireSaveButtons } from "./plans.js";

const API_BASE = "https://date.nager.at/api/v3";

export async function fetchHolidays(year, countryCode) {
  const response = await fetch(
    `${API_BASE}/PublicHolidays/${year}/${countryCode}`,
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch holidays (status ${response.status})`);
  }

  return await response.json();
}

function parseISODateLocal(isoDateStr) {
  const [year, month, day] = isoDateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function buildHolidayCard(holiday) {
  const date = parseISODateLocal(holiday.date);
  const day = date.getDate();
  const month = date.toLocaleDateString("en-US", { month: "short" });
  const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
  const type = holiday.types?.[0] ?? "Public";

  // Unique, stable id + a JSON payload describing this saved plan
  const planId = `holiday-${holiday.date}-${holiday.name}`.replace(/\s+/g, "_");
  const plan = {
    id: planId,
    type: "holiday",
    title: holiday.name,
    date: `${month} ${day}, ${date.getFullYear()}`,
    subtitle: holiday.localName,
  };
  const planJson = JSON.stringify(plan).replace(/"/g, "&quot;");

  return `
    <div class="holiday-card">
      <div class="holiday-card-header">
        <div class="holiday-date-box"><span class="day">${day}</span><span class="month">${month}</span></div>
   <button class="holiday-action-btn" data-save-id="${planId}" data-save-plan="${planJson}" aria-label="Save holiday">
  <i class="fa-regular fa-heart heart-outline"></i>
  <i class="fa-solid fa-heart heart-filled"></i>
</button>
      </div>
      <h3>${holiday.name}</h3>
      <p class="holiday-name">${holiday.localName}</p>
      <div class="holiday-card-footer">
        <span class="holiday-day-badge"><i class="fa-regular fa-calendar"></i> ${weekday}</span>
        <span class="holiday-type-badge">${type}</span>
      </div>
    </div>
  `;
}

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

export function renderHolidays(holidays) {
  const container = document.getElementById("holidays-content");
  if (!container) return;

  if (!holidays.length) {
    container.innerHTML = buildEmptyState({
      icon: "fa-calendar-xmark",
      title: "No Holidays Found",
      message: "There are no public holidays listed for this selection.",
      showButton: false,
    });
    return;
  }

  const sorted = [...holidays].sort(
    (a, b) => parseISODateLocal(a.date) - parseISODateLocal(b.date),
  );

  container.innerHTML = sorted.map(buildHolidayCard).join("");

  // Activate the heart/save buttons just rendered
  wireSaveButtons(container);

  const statHolidays = document.getElementById("stat-holidays");
  if (statHolidays) statHolidays.textContent = sorted.length;
}

function updateHolidaysHeader(countryCode, countryName, year) {
  const selectionBox = document.getElementById("holidays-selection");
  const flagImg = document.getElementById("holidays-flag");
  const nameSpan = document.getElementById("holidays-country-name");
  const yearSpan = document.getElementById("holidays-year-display");

  if (!selectionBox) return;

  selectionBox.style.display = "flex";

  if (flagImg) {
    flagImg.src = `https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`;
    flagImg.alt = countryName;
    flagImg.style.display = "block";
  }
  if (nameSpan) nameSpan.textContent = countryName;
  if (yearSpan) yearSpan.textContent = year;
}

function hideHolidaysHeader() {
  const selectionBox = document.getElementById("holidays-selection");
  if (selectionBox) selectionBox.style.display = "none";
}

export async function loadHolidays() {
  const { countryCode, countryName, year } = getSelection();
  const container = document.getElementById("holidays-content");

  if (!countryCode) {
    hideHolidaysHeader();
    if (container) {
      container.innerHTML = buildEmptyState({
        icon: "fa-calendar-xmark",
        title: "No Country Selected",
        message:
          "Select a country from the dashboard to explore public holidays",
        showButton: true,
      });
    }
    if (window.FontAwesome && window.FontAwesome.dom) {
      window.FontAwesome.dom.i2svg();
    }
    return;
  }

  if (container) {
    container.innerHTML = `<p class="holidays-loading">Loading holidays...</p>`;
  }

  try {
    const holidays = await fetchHolidays(year, countryCode);
    renderHolidays(holidays);
    updateHolidaysHeader(countryCode, countryName, year);
  } catch (error) {
    console.error(error);
    hideHolidaysHeader();
    if (container) {
      container.innerHTML = buildEmptyState({
        icon: "fa-calendar-xmark",
        title: "Failed to Load Holidays",
        message: "Something went wrong fetching holidays. Please try again.",
        showButton: false,
      });
    }
  }

  if (window.FontAwesome && window.FontAwesome.dom) {
    window.FontAwesome.dom.i2svg();
  }
}