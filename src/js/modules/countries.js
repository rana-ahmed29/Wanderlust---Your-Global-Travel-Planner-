"use strict";

import { setSelection } from "./state.js";

//==============================================================
// Countries Module — countries.dev API (free, no key needed)
const API_BASE = "https://countries.dev";

export async function fetchCountryByCode(code) {
  const response = await fetch(`${API_BASE}/alpha/${code}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch country info (status ${response.status})`);
  }

  return await response.json();
}

export function renderCountryInfo(country) {
  const container = document.getElementById("dashboard-country-info");
  if (!container) return;

  const name = country.name ?? "N/A";
  const region = country.region ?? "N/A";
  const subregion = country.subregion ?? "";
  const alpha2 = country.alpha2Code?.toLowerCase() ?? "";
  const flag = alpha2 ? `https://flagcdn.com/w160/${alpha2}.png` : "";
  const capital = country.capital ?? "N/A";
  const population = country.population?.toLocaleString() ?? "N/A";
  const area = country.area ? `${country.area.toLocaleString()} km²` : "N/A";
  const callingCode = country.callingCodes?.[0]
    ? `+${country.callingCodes[0]}`
    : "N/A";

  const currencies = country.currencies?.length
    ? country.currencies.map((c) => `${c.name} (${c.symbol})`).join(", ")
    : "N/A";

  const languages = country.languages?.length
    ? country.languages.map((l) => l.name).join(", ")
    : "N/A";

  const borders = country.borders?.length
    ? country.borders
        .map((code) => `<span class="extra-tag border-tag">${code}</span>`)
        .join("")
    : `<span class="extra-tag">No land borders</span>`;

  container.innerHTML = `
    <div class="dashboard-country-header">
      <img src="${flag}" alt="${name}" class="dashboard-country-flag">
      <div class="dashboard-country-title">
        <h3>${name}</h3>
        <span class="region"><i class="fa-solid fa-location-dot"></i> ${region} • ${subregion}</span>
      </div>
    </div>

    <div class="dashboard-country-grid">
      <div class="dashboard-country-detail">
        <i class="fa-solid fa-building-columns"></i>
        <span class="label">Capital</span>
        <span class="value">${capital}</span>
      </div>
      <div class="dashboard-country-detail">
        <i class="fa-solid fa-users"></i>
        <span class="label">Population</span>
        <span class="value">${population}</span>
      </div>
      <div class="dashboard-country-detail">
        <i class="fa-solid fa-ruler-combined"></i>
        <span class="label">Area</span>
        <span class="value">${area}</span>
      </div>
      <div class="dashboard-country-detail">
        <i class="fa-solid fa-globe"></i>
        <span class="label">Continent</span>
        <span class="value">${region}</span>
      </div>
      <div class="dashboard-country-detail">
        <i class="fa-solid fa-phone"></i>
        <span class="label">Calling Code</span>
        <span class="value">${callingCode}</span>
      </div>
    </div>

    <div class="dashboard-country-extras">
      <div class="dashboard-country-extra">
        <h4><i class="fa-solid fa-coins"></i> Currency</h4>
        <div class="extra-tags"><span class="extra-tag">${currencies}</span></div>
      </div>
      <div class="dashboard-country-extra">
        <h4><i class="fa-solid fa-language"></i> Languages</h4>
        <div class="extra-tags"><span class="extra-tag">${languages}</span></div>
      </div>
      <div class="dashboard-country-extra">
        <h4><i class="fa-solid fa-map-location-dot"></i> Neighbors</h4>
        <div class="extra-tags">${borders}</div>
      </div>
    </div>

    <div class="dashboard-country-actions">
      <a href="https://www.google.com/maps/place/${name}" target="_blank" class="btn-map-link">
        <i class="fa-solid fa-map"></i> View on Google Maps
      </a>
    </div>
  `;
}

export async function loadCountryInfo(code) {
  const container = document.getElementById("dashboard-country-info");
  if (!container) return;

  container.innerHTML = `<p>Loading country information...</p>`;

  try {
    const country = await fetchCountryByCode(code);
    renderCountryInfo(country);
  } catch (error) {
    console.error(error);
    container.innerHTML = `<p>Failed to load country information. Please try again.</p>`;
  }
}

//==============================================================
// Cities — same API, populates the existing #global-city select

// Reads coordinates defensively — different endpoints/versions of
// countries.dev have been seen returning either lat/lon or
// latitude/longitude, so this checks both instead of assuming one
function extractCoords(city) {
  const lat = city.lat ?? city.latitude ?? null;
  const lon = city.lon ?? city.longitude ?? null;
  return {
    lat: typeof lat === "number" ? lat : null,
    lon: typeof lon === "number" ? lon : null,
  };
}

export async function loadCitiesForCountry(code) {
  const citySelect = document.getElementById("global-city");
  if (!citySelect) return;

  citySelect.innerHTML = `<option>Loading cities...</option>`;

  try {
    const response = await fetch(`${API_BASE}/cities?country=${code}&limit=15`);
    if (!response.ok) throw new Error("Failed to fetch cities");

    const cities = await response.json();

    if (!cities.length) {
      citySelect.innerHTML = `<option value="">No city data available</option>`;
      return;
    }

    // TEMP DEBUG — remove after confirming the real field names in the console
    console.log("CITIES RAW SAMPLE:", cities[0]);

    citySelect.innerHTML = cities
      .map((city, i) => {
        const { lat, lon } = extractCoords(city);
        return `<option value="${city.name}" data-lat="${lat ?? ""}" data-lon="${lon ?? ""}" ${i === 0 ? "selected" : ""}>${city.name}</option>`;
      })
      .join("");

    // Sync the auto-selected first city into shared state,
    // since the browser doesn't fire a "change" event for a default-selected option
    const firstCity = cities[0];
    if (firstCity) {
      const { lat, lon } = extractCoords(firstCity);

      setSelection({
        cityName: firstCity.name,
        cityLat: lat,
        cityLon: lon,
      });

      const selectedCitySpan = document.getElementById("selected-city-name");
      if (selectedCitySpan)
        selectedCitySpan.textContent = `• ${firstCity.name}`;
    }
  } catch (error) {
    console.error(error);
    citySelect.innerHTML = `<option value="">No city data available</option>`;
  }
}
