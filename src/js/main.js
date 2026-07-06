"use strict";

import { initCountryDropdown } from "./modules/country-select.js";
import { loadCountryInfo, loadCitiesForCountry } from "./modules/countries.js";
import { setSelection, clearSelection, getSelection } from "./modules/state.js";
import { loadHolidays } from "./modules/holidays.js";
import { loadLongWeekends } from "./modules/long-weekends.js";
import { initCurrency } from "./modules/currency.js";
import { loadEvents } from "./modules/events.js";
import { loadWeather } from "./modules/weather.js";
import { loadSunTimes } from "./modules/sun-times.js";
import {
  loadMyPlans,
  initPlanFilters,
  updateSavedCounters,
} from "./modules/plans.js";

//=============================================================
// HTML ELEMENTS
const pageTitle = document.getElementById("page-title");
const pageSubtitle = document.getElementById("page-subtitle");
const currentDatetime = document.getElementById("current-datetime");

const mobileMenuBtn = document.getElementById("mobile-menu-btn");
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebar-overlay");

const globalSearchBtn = document.getElementById("global-search-btn");
const clearSelectionBtn = document.getElementById("clear-selection-btn");
const globalCitySelect = document.getElementById("global-city");
const globalYearSelect = document.getElementById("global-year");

//==============================================================
// Variables
let selectedCountryCode = "";
let selectedCountryName = "";

const navItems = [
  {
    btn: document.querySelector('[data-view="dashboard"]'),
    view: document.getElementById("dashboard-view"),
  },
  {
    btn: document.querySelector('[data-view="holidays"]'),
    view: document.getElementById("holidays-view"),
    onShow: loadHolidays,
  },
  {
    btn: document.querySelector('[data-view="events"]'),
    view: document.getElementById("events-view"),
    onShow: loadEvents,
  },
  {
    btn: document.querySelector('[data-view="weather"]'),
    view: document.getElementById("weather-view"),
    onShow: loadWeather,
  },
  {
    btn: document.querySelector('[data-view="long-weekends"]'),
    view: document.getElementById("long-weekends-view"),
    onShow: loadLongWeekends,
  },
  {
    btn: document.querySelector('[data-view="currency"]'),
    view: document.getElementById("currency-view"),
  },
  {
    btn: document.querySelector('[data-view="sun-times"]'),
    view: document.getElementById("sun-times-view"),
    onShow: loadSunTimes,
  },
  {
    btn: document.querySelector('[data-view="my-plans"]'),
    view: document.getElementById("my-plans-view"),
    onShow: loadMyPlans,
  },
];

const viewInfo = {
  dashboard: {
    title: "Dashboard",
    subtitle: "Welcome back! Ready to plan your next adventure?",
  },
  holidays: {
    title: "Holidays",
    subtitle: "Explore public holidays around the world",
  },
  events: {
    title: "Events",
    subtitle: "Find concerts, sports, and entertainment",
  },
  weather: {
    title: "Weather",
    subtitle: "Check forecasts for any destination",
  },
  "long-weekends": {
    title: "Long Weekends",
    subtitle: "Find the perfect mini-trip opportunities",
  },
  currency: {
    title: "Currency",
    subtitle: "Convert currencies with live exchange rates",
  },
  "sun-times": {
    title: "Sun Times",
    subtitle: "Check sunrise and sunset times worldwide",
  },
  "my-plans": { title: "My Plans", subtitle: "Your saved holidays and events" },
};

//==============================================================
// function
function openSidebar() {
  if (!sidebar || !sidebarOverlay) return;
  sidebar.classList.add("open");
  sidebarOverlay.classList.remove("hidden");
  sidebarOverlay.classList.add("active");
}

function closeSidebar() {
  if (!sidebar || !sidebarOverlay) return;
  sidebar.classList.remove("open");
  sidebarOverlay.classList.add("hidden");
  sidebarOverlay.classList.remove("active");
}

function activateView(clickedItem) {
  for (let i = 0; i < navItems.length; i++) {
    const item = navItems[i];
    if (!item.btn || !item.view) continue;

    const isClicked = item.btn === clickedItem.btn;

    if (isClicked) {
      item.btn.classList.add("active");
      item.view.classList.add("active");
    } else {
      item.btn.classList.remove("active");
      item.view.classList.remove("active");
    }
  }
}

function updateHeader(viewKey) {
  const info = viewInfo[viewKey];
  if (!info || !pageTitle || !pageSubtitle) return;

  pageTitle.textContent = info.title;
  pageSubtitle.textContent = info.subtitle;

  // Keep the browser tab title in sync with the current view
  document.title = `Wanderlust - ${info.title}`;
}

function updateDatetime() {
  if (!currentDatetime) return;

  const now = new Date();
  const options = {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  };

  currentDatetime.textContent = now.toLocaleString("en-US", options);
}

function refreshActiveDataViews() {
  const holidaysView = document.getElementById("holidays-view");
  if (holidaysView && holidaysView.classList.contains("active")) {
    loadHolidays();
  }

  const longWeekendsView = document.getElementById("long-weekends-view");
  if (longWeekendsView && longWeekendsView.classList.contains("active")) {
    loadLongWeekends();
  }

  const eventsView = document.getElementById("events-view");
  if (eventsView && eventsView.classList.contains("active")) {
    loadEvents();
  }

  const weatherView = document.getElementById("weather-view");
  if (weatherView && weatherView.classList.contains("active")) {
    loadWeather();
  }

  const sunTimesView = document.getElementById("sun-times-view");
  if (sunTimesView && sunTimesView.classList.contains("active")) {
    loadSunTimes();
  }
}

//==============================================================
// Events
for (let i = 0; i < navItems.length; i++) {
  const item = navItems[i];
  if (item.btn) {
    item.btn.addEventListener("click", () => {
      activateView(item);
      closeSidebar();
      updateHeader(item.btn.dataset.view);

      if (typeof item.onShow === "function") {
        item.onShow();
      }
    });
  }
}

window.navigateTo = function (viewKey) {
  const target = navItems.find((item) => item.btn?.dataset.view === viewKey);
  if (!target) return;

  activateView(target);
  updateHeader(viewKey);
  if (typeof target.onShow === "function") {
    target.onShow();
  }
};

if (mobileMenuBtn) {
  mobileMenuBtn.addEventListener("click", () => {
    if (sidebar.classList.contains("open")) {
      closeSidebar();
    } else {
      openSidebar();
    }
  });
}

if (sidebarOverlay) {
  sidebarOverlay.addEventListener("click", closeSidebar);
}

initCountryDropdown((code, name) => {
  selectedCountryCode = code;
  selectedCountryName = name;
  loadCitiesForCountry(code);

  setSelection({ countryCode: code, countryName: name, cityName: "" });

  const countryFlag = document.querySelector(".country-dropdown-flag");
  if (countryFlag) countryFlag.style.display = "inline";

  const selectedBox = document.getElementById("selected-destination");
  const selectedFlagImg = document.getElementById("selected-country-flag");
  const selectedNameSpan = document.getElementById("selected-country-name");
  const selectedCitySpan = document.getElementById("selected-city-name");

  if (selectedBox) selectedBox.classList.remove("hidden");
  if (selectedFlagImg)
    selectedFlagImg.src = `https://flagcdn.com/w80/${code.toLowerCase()}.png`;
  if (selectedNameSpan) selectedNameSpan.textContent = name;
  if (selectedCitySpan) selectedCitySpan.textContent = "";

  refreshActiveDataViews();
});

if (globalCitySelect) {
  globalCitySelect.addEventListener("change", () => {
    const selectedOption = globalCitySelect.selectedOptions[0];
    const lat = selectedOption?.dataset.lat;
    const lon = selectedOption?.dataset.lon;

    setSelection({
      cityName: globalCitySelect.value,
      cityLat: lat ? parseFloat(lat) : null,
      cityLon: lon ? parseFloat(lon) : null,
    });

    const selectedCitySpan = document.getElementById("selected-city-name");
    if (selectedCitySpan)
      selectedCitySpan.textContent = `• ${globalCitySelect.value}`;

    refreshActiveDataViews();
  });
}

if (globalYearSelect) {
  globalYearSelect.addEventListener("change", () => {
    setSelection({ year: globalYearSelect.value });
    refreshActiveDataViews();
  });
}

if (globalSearchBtn) {
  globalSearchBtn.addEventListener("click", () => {
    if (!selectedCountryCode) {
      Swal.fire({
        toast: true,
        position: "bottom-end",
        icon: "info",
        title: "Please select a country first",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });
      return;
    }

    loadCountryInfo(selectedCountryCode);

    Swal.fire({
      toast: true,
      position: "bottom-end",
      icon: "success",
      title: `Exploring ${selectedCountryName}!`,
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
    });
  });
}

if (clearSelectionBtn) {
  clearSelectionBtn.addEventListener("click", () => {
    selectedCountryCode = "";
    selectedCountryName = "";
    clearSelection();

    const countryLabel = document.querySelector(".country-dropdown-label");
    const countryFlag = document.querySelector(".country-dropdown-flag");
    const citySelect = document.getElementById("global-city");
    const selectedBox = document.getElementById("selected-destination");
    const countryInfoContainer = document.getElementById(
      "dashboard-country-info",
    );

    if (countryLabel) countryLabel.textContent = "Select Country";
    if (countryFlag) countryFlag.style.display = "none";
    if (citySelect)
      citySelect.innerHTML = `<option value="" selected>Select City</option>`;
    if (selectedBox) selectedBox.classList.add("hidden");
    if (globalYearSelect) globalYearSelect.value = "2026";

    if (countryInfoContainer) {
      countryInfoContainer.innerHTML = `
        <div class="country-info-placeholder" style="text-align: center; padding: 40px 0;">
          <div class="placeholder-icon" style="font-size: 48px; color: #ccc; margin-bottom: 16px;">
            <i class="fa-solid fa-globe"></i>
          </div>
          <p style="color: #999; margin: 0;">Select a country to view detailed information</p>
        </div>
      `;
    }

    if (window.FontAwesome && window.FontAwesome.dom) {
      window.FontAwesome.dom.i2svg();
    }

    refreshActiveDataViews();

    Swal.fire({
      toast: true,
      position: "bottom-end",
      icon: "info",
      title: "Selection cleared",
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
    });
  });
}

initCurrency();
initPlanFilters();
updateSavedCounters();

updateDatetime();
setInterval(updateDatetime, 1000);

// Set the initial tab title to match the Dashboard view on page load
updateHeader("dashboard");
