"use strict";

const API_KEY = "cf7a991d835b2dad276ea8e4";
const API_BASE = `https://v6.exchangerate-api.com/v6/${API_KEY}`;

// Currencies shown in the "Quick Convert" grid, with matching flag codes
const POPULAR_CURRENCIES = [
  { code: "EUR", name: "Euro", flag: "eu" },
  { code: "GBP", name: "British Pound", flag: "gb" },
  { code: "EGP", name: "Egyptian Pound", flag: "eg" },
  { code: "AED", name: "UAE Dirham", flag: "ae" },
  { code: "SAR", name: "Saudi Riyal", flag: "sa" },
  { code: "JPY", name: "Japanese Yen", flag: "jp" },
  { code: "CAD", name: "Canadian Dollar", flag: "ca" },
  { code: "INR", name: "Indian Rupee", flag: "in" },
];

//=============================================================
// HTML ELEMENTS
const amountInput = document.getElementById("currency-amount");
const fromSelect = document.getElementById("currency-from");
const toSelect = document.getElementById("currency-to");
const convertBtn = document.getElementById("convert-btn");
const swapBtn = document.getElementById("swap-currencies-btn");
const resultBox = document.getElementById("currency-result");
const popularGrid = document.getElementById("popular-currencies");

//=============================================================
// API calls
async function fetchLatestRates(baseCode) {
  const response = await fetch(`${API_BASE}/latest/${baseCode}`);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch exchange rates (status ${response.status})`,
    );
  }
  return await response.json();
}

async function fetchPairConversion(fromCode, toCode, amount) {
  const response = await fetch(
    `${API_BASE}/pair/${fromCode}/${toCode}/${amount}`,
  );
  if (!response.ok) {
    throw new Error(`Failed to convert currency (status ${response.status})`);
  }
  return await response.json();
}

//=============================================================
// Rendering
function formatNumber(value) {
  return Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}

function formatUpdateDate(utcString) {
  // API gives e.g. "Sat, 25 Jan 2026 00:00:01 +0000"
  const date = new Date(utcString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function renderConversionResult(data, amount) {
  if (!resultBox) return;

  resultBox.innerHTML = `
    <div class="conversion-display">
      <div class="conversion-from">
        <span class="amount">${formatNumber(amount)}</span>
        <span class="currency-code">${data.base_code}</span>
      </div>
      <div class="conversion-equals">
        <i class="fa-solid fa-equals"></i>
      </div>
      <div class="conversion-to">
        <span class="amount">${formatNumber(data.conversion_result)}</span>
        <span class="currency-code">${data.target_code}</span>
      </div>
    </div>
    <div class="exchange-rate-info">
      <p>1 ${data.base_code} = ${formatNumber(data.conversion_rate)} ${data.target_code}</p>
      <small>Live rate</small>
    </div>
  `;
}

function renderConversionError() {
  if (!resultBox) return;
  resultBox.innerHTML = `<p class="holidays-loading">Failed to convert. Please try again.</p>`;
}

function renderPopularCurrencies(latestData) {
  if (!popularGrid) return;

  const rates = latestData.conversion_rates;

  let html = "";
  for (const { code, name, flag } of POPULAR_CURRENCIES) {
    const rate = rates[code];
    if (rate === undefined) continue;

    html += `
      <div class="popular-currency-card" data-code="${code}">
        <img src="https://flagcdn.com/w40/${flag}.png" alt="${code}" class="flag">
        <div class="info">
          <div class="code">${code}</div>
          <div class="name">${name}</div>
        </div>
        <div class="rate">${formatNumber(rate)}</div>
      </div>
    `;
  }
  popularGrid.innerHTML = html;
}

//=============================================================
// Actions
async function handleConvert() {
  const amount = parseFloat(amountInput?.value) || 0;
  const from = fromSelect?.value;
  const to = toSelect?.value;

  if (!from || !to || amount <= 0) return;

  if (resultBox) {
    resultBox.innerHTML = `<p class="holidays-loading">Converting...</p>`;
  }

  try {
    const data = await fetchPairConversion(from, to, amount);
    renderConversionResult(data, amount);
  } catch (error) {
    console.error(error);
    renderConversionError();
  }
}

function handleSwap() {
  if (!fromSelect || !toSelect) return;

  const temp = fromSelect.value;
  fromSelect.value = toSelect.value;
  toSelect.value = temp;

  handleConvert();
}

//=============================================================
// Init — loads the popular currencies grid and runs an initial conversion
export async function initCurrency() {
  if (convertBtn) convertBtn.addEventListener("click", handleConvert);
  if (swapBtn) swapBtn.addEventListener("click", handleSwap);

  if (popularGrid) {
    popularGrid.innerHTML = `<p class="holidays-loading">Loading rates...</p>`;
  }

  try {
    const latestData = await fetchLatestRates("USD");
    renderPopularCurrencies(latestData);
  } catch (error) {
    console.error(error);
    if (popularGrid) {
      popularGrid.innerHTML = `<p class="holidays-loading">Failed to load rates.</p>`;
    }
  }

  // Run an initial conversion using the default form values (100 USD → EGP)
  handleConvert();
}
