"use strict";

import { getSelection } from "./state.js";
import { wireSaveButtons } from "./plans.js";

const API_KEY = "VwECw2OiAzxVzIqnwmKJUG41FbeXJk1y";
const API_BASE = "https://app.ticketmaster.com/discovery/v2";

export async function fetchEventsByCity(city, countryCode) {
  const url = `${API_BASE}/events.json?apikey=${API_KEY}&city=${encodeURIComponent(city)}&countryCode=${countryCode}&size=20`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch events (status ${response.status})`);
  }

  return await response.json();
}

function formatEventDateTime(dateInfo) {
  if (!dateInfo?.localDate) return "Date TBA";

  const [year, month, day] = dateInfo.localDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const dateLabel = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  if (dateInfo.localTime) {
    const time = dateInfo.localTime.slice(0, 5);
    return `${dateLabel} at ${time}`;
  }

  return dateLabel;
}

function pickEventImage(images) {
  if (!images?.length) {
    return "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=200&fit=crop";
  }

  const wide = images.find((img) => img.ratio === "16_9" && img.width >= 400);
  return (wide || images[0]).url;
}

function truncateText(text, maxLength = 35) {
  if (!text) return "";

  return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
}

function buildEventCard(event) {
  const image = pickEventImage(event.images);
  const category = event.classifications?.[0]?.segment?.name ?? "Event";
  const venue = event._embedded?.venues?.[0];
  const venueName = venue?.name ?? "Venue TBA";
  const cityName = venue?.city?.name ?? "";
  const dateTime = formatEventDateTime(event.dates?.start);
  const ticketUrl = event.url ?? "#";

  const planId = `event-${event.id}`;
  const plan = {
    id: planId,
    type: "event",
    title: event.name,
    date: dateTime,
    subtitle: `${venueName}${cityName ? `, ${cityName}` : ""}`,
  };

  const planJson = JSON.stringify(plan).replace(/"/g, "&quot;");

  return `
    <div class="event-card">
      <div class="event-card-image">
        <img src="${image}" alt="${event.name}">
        <span class="event-card-category">${category}</span>

        <button
          class="event-card-save"
          data-save-id="${planId}"
          data-save-plan="${planJson}"
          aria-label="Save event"
        >
          <i class="fa-regular fa-heart heart-outline"></i>
          <i class="fa-solid fa-heart heart-filled"></i>
        </button>
      </div>

      <div class="event-card-body">
        <h3>${truncateText(event.name)}</h3>

        <div class="event-card-info">
          <div>
            <i class="fa-regular fa-calendar"></i>
            ${dateTime}
          </div>

          <div>
            <i class="fa-solid fa-location-dot"></i>
            ${venueName}${cityName ? `, ${cityName}` : ""}
          </div>
        </div>

        <div class="event-card-footer">
          <button
            class="btn-event"
            data-save-id="${planId}"
            data-save-plan="${planJson}"
          >
            <i class="fa-regular fa-heart heart-outline"></i>
            <i class="fa-solid fa-heart heart-filled"></i>
            Save
          </button>

          <a
            href="${ticketUrl}"
            target="_blank"
            rel="noopener"
            class="btn-buy-ticket"
          >
            <i class="fa-solid fa-ticket"></i>
            Buy Tickets
          </a>
        </div>
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

export function renderEvents(events) {
  const container = document.getElementById("events-content");
  if (!container) return;

  if (!events.length) {
    container.innerHTML = buildEmptyState({
      icon: "fa-ticket",
      title: "No Events Found",
      message: "There are no upcoming events listed for this city.",
      showButton: false,
    });
    return;
  }

  container.innerHTML = events.map(buildEventCard).join("");

  // Activate the heart/save buttons just rendered (both the corner heart
  // and the footer "Save" button share the same data-save-id, so clicking
  // either one saves/reflects the same plan)
  wireSaveButtons(container);
}

function updateEventsHeader(countryCode, countryName, cityName) {
  const selectionBox = document.getElementById("events-selection");
  const flagImg = document.getElementById("events-flag");
  const nameSpan = document.getElementById("events-country-name");
  const citySpan = document.getElementById("events-city-display");

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

function hideEventsHeader() {
  const selectionBox = document.getElementById("events-selection");
  if (selectionBox) selectionBox.style.display = "none";
}

export async function loadEvents() {
  const { countryCode, countryName, cityName } = getSelection();
  const container = document.getElementById("events-content");

  if (!countryCode || !cityName) {
    hideEventsHeader();
    if (container) {
      container.innerHTML = buildEmptyState({
        icon: "fa-ticket",
        title: "No City Selected",
        message:
          "Select a country and city from the dashboard to discover events",
        showButton: true,
      });
    }
    if (window.FontAwesome && window.FontAwesome.dom) {
      window.FontAwesome.dom.i2svg();
    }
    return;
  }

  if (container) {
    container.innerHTML = `<p class="holidays-loading">Loading events...</p>`;
  }

  try {
    const data = await fetchEventsByCity(cityName, countryCode);
    const events = data._embedded?.events ?? [];
    renderEvents(events);
    updateEventsHeader(countryCode, countryName, cityName);
  } catch (error) {
    console.error(error);
    hideEventsHeader();
    if (container) {
      container.innerHTML = buildEmptyState({
        icon: "fa-ticket",
        title: "Failed to Load Events",
        message: "Something went wrong fetching events. Please try again.",
        showButton: false,
      });
    }
  }

  if (window.FontAwesome && window.FontAwesome.dom) {
    window.FontAwesome.dom.i2svg();
  }
}
