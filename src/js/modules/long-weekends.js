
"use strict";

import { getSelection } from "./state.js";
import { wireSaveButtons } from "./plans.js";

const API_BASE = "https://date.nager.at/api/v3";

export async function fetchLongWeekends(year, countryCode) {
  const response = await fetch(
    `${API_BASE}/LongWeekend/${year}/${countryCode}`,
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch long weekends (status ${response.status})`,
    );
  }

  return await response.json();
}

function parseISODateLocal(isoDateStr) {
  const [year, month, day] = isoDateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDateRange(startDate, endDate) {
  const start = parseISODateLocal(startDate);
  const end = parseISODateLocal(endDate);

  const startMonth = start.toLocaleDateString("en-US", { month: "short" });
  const endMonth = end.toLocaleDateString("en-US", { month: "short" });
  const year = end.getFullYear();

  if (startMonth === endMonth) {
    return `${startMonth} ${start.getDate()} - ${end.getDate()}, ${year}`;
  }
  return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${year}`;
}

function buildDaysVisual(startDate, endDate) {
  const start = parseISODateLocal(startDate);
  const end = parseISODateLocal(endDate);

  let html = "";
  const cursor = new Date(start);

  while (cursor <= end) {
    const dayNum = cursor.getDate();
    const dayName = cursor.toLocaleDateString("en-US", { weekday: "short" });
    const isWeekend = cursor.getDay() === 0 || cursor.getDay() === 6;

    html += `
      <div class="lw-day${isWeekend ? " weekend" : ""}">
        <span class="name">${dayName}</span><span class="num">${dayNum}</span>
      </div>
    `;

    cursor.setDate(cursor.getDate() + 1);
  }

  return html;
}

function buildLwCard(lw, index) {
  const dateRange = formatDateRange(lw.startDate, lw.endDate);
  const daysVisual = buildDaysVisual(lw.startDate, lw.endDate);

  const infoBox = lw.needBridgeDay
    ? `<div class="lw-info-box warning"><i class="fa-solid fa-info-circle"></i> Requires taking a bridge day off</div>`
    : `<div class="lw-info-box success"><i class="fa-solid fa-check-circle"></i> No extra days off needed!</div>`;

  const planId = `longweekend-${lw.startDate}-${lw.endDate}`.replace(
    /\s+/g,
    "_",
  );
  const plan = {
    id: planId,
    type: "longweekend",
    title: `Long Weekend #${index + 1}`,
    date: dateRange,
    subtitle: `${lw.dayCount} days off${lw.needBridgeDay ? " (bridge day needed)" : ""}`,
  };
  const planJson = JSON.stringify(plan).replace(/"/g, "&quot;");

  return `
    <div class="lw-card">
      <div class="lw-card-header">
        <span class="lw-badge"><i class="fa-solid fa-calendar-days"></i> ${lw.dayCount} Days</span>
<button class="holiday-action-btn" data-save-id="${planId}" data-save-plan="${planJson}" aria-label="Save long weekend">
  <i class="fa-regular fa-heart heart-outline"></i>
  <i class="fa-solid fa-heart heart-filled"></i>
</button>
      </div>
      <h3>Long Weekend #${index + 1}</h3>
      <div class="lw-dates"><i class="fa-regular fa-calendar"></i> ${dateRange}</div>
      ${infoBox}
      <div class="lw-days-visual">${daysVisual}</div>
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

export function renderLongWeekends(longWeekends) {
  const container = document.getElementById("lw-content");
  if (!container) return;

  if (!longWeekends.length) {
    container.innerHTML = buildEmptyState({
      icon: "fa-umbrella-beach",
      title: "No Long Weekends Found",
      message: "There are no long weekend opportunities for this selection.",
      showButton: false,
    });
    return;
  }

  container.innerHTML = longWeekends.map(buildLwCard).join("");

  // Activate the heart/save buttons just rendered
  wireSaveButtons(container);
}

function updateLwHeader(countryCode, countryName, year) {
  const selectionBox = document.getElementById("lw-selection");
  const flagImg = document.getElementById("lw-flag");
  const nameSpan = document.getElementById("lw-country-name");
  const yearSpan = document.getElementById("lw-year-display");

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

function hideLwHeader() {
  const selectionBox = document.getElementById("lw-selection");
  if (selectionBox) selectionBox.style.display = "none";
}

export async function loadLongWeekends() {
  const { countryCode, countryName, year } = getSelection();
  const container = document.getElementById("lw-content");

  if (!countryCode) {
    hideLwHeader();
    if (container) {
      container.innerHTML = buildEmptyState({
        icon: "fa-umbrella-beach",
        title: "No Country Selected",
        message:
          "Select a country from the dashboard to discover long weekend opportunities",
        showButton: true,
      });
    }
    if (window.FontAwesome && window.FontAwesome.dom) {
      window.FontAwesome.dom.i2svg();
    }
    return;
  }

  if (container) {
    container.innerHTML = `<p class="holidays-loading">Loading long weekends...</p>`;
  }

  try {
    const longWeekends = await fetchLongWeekends(year, countryCode);
    renderLongWeekends(longWeekends);
    updateLwHeader(countryCode, countryName, year);
  } catch (error) {
    console.error(error);
    hideLwHeader();
    if (container) {
      container.innerHTML = buildEmptyState({
        icon: "fa-umbrella-beach",
        title: "Failed to Load Long Weekends",
        message:
          "Something went wrong fetching long weekends. Please try again.",
        showButton: false,
      });
    }
  }

  if (window.FontAwesome && window.FontAwesome.dom) {
    window.FontAwesome.dom.i2svg();
  }
}