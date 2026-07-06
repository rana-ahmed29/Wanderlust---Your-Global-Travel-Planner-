"use strict";

const COUNTRIES_LIST_API =
  "https://countries.dev/countries?fields=name,alpha2Code&sort=name";

let allCountries = [];

function injectCountryDropdownStyles() {
  const style = document.createElement("style");
  style.textContent = `
    .country-dropdown { position: relative; width: 100%; }
    .country-dropdown-toggle {
      display: flex; align-items: center; gap: 8px;
      width: 100%; cursor: pointer; background: #fff;
    }
    .country-dropdown-flag { width: 20px; height: auto; }
    .country-dropdown-panel {
      position: absolute; top: 100%; left: 0; width: 100%;
      background: #fff; border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 50; margin-top: 4px; max-height: 260px; overflow-y: auto;
    }
    .country-dropdown-panel.hidden { display: none; }
    .country-search-input {
      width: 100%; padding: 10px 12px; border: none;
      border-bottom: 1px solid #eee; outline: none; box-sizing: border-box;
    }
    .country-list { list-style: none; margin: 0; padding: 0; }
    .country-list-item {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 12px; cursor: pointer;
    }
    .country-list-item:hover { background: #f5f7fa; }
    .country-list-flag { width: 20px; height: auto; }
    .country-list-code { margin-left: auto; color: #999; font-size: 0.85em; }
  `;
  document.head.appendChild(style);
}

// Removes the inline background icon on the City select so it matches the reference design
function removeCitySelectIcon() {
  const style = document.createElement("style");
  style.textContent = `
    #global-city.form-select {
      background-image: none !important;
      padding-left: 12px !important;
    }
  `;
  document.head.appendChild(style);
}

export async function initCountryDropdown(onSelect) {
  const originalSelect = document.getElementById("global-country");
  if (!originalSelect) return;

  injectCountryDropdownStyles();
  removeCitySelectIcon();

  originalSelect.style.display = "none";

  const wrapper = document.createElement("div");
  wrapper.className = "country-dropdown";
  wrapper.id = "country-dropdown";

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "form-select country-dropdown-toggle";
  toggle.innerHTML = `
    <img class="country-dropdown-flag" src="" alt="" style="display:none;">
    <span class="country-dropdown-label">Select Country</span>
  `;

  const panel = document.createElement("div");
  panel.className = "country-dropdown-panel hidden";

  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.className = "country-search-input";
  searchInput.placeholder = "Search countries...";

  const list = document.createElement("ul");
  list.className = "country-list";

  panel.appendChild(searchInput);
  panel.appendChild(list);
  wrapper.appendChild(toggle);
  wrapper.appendChild(panel);

  originalSelect.insertAdjacentElement("afterend", wrapper);

  const flagImg = toggle.querySelector(".country-dropdown-flag");
  const labelSpan = toggle.querySelector(".country-dropdown-label");

  try {
    const response = await fetch(COUNTRIES_LIST_API);
    if (!response.ok) throw new Error("Failed to load country list");
    const data = await response.json();

    allCountries = data
      .filter((c) => c.alpha2Code)
      .map((c) => ({
        name: c.name,
        code: c.alpha2Code,
        flag: `https://flagcdn.com/w40/${c.alpha2Code.toLowerCase()}.png`,
      }));

    renderCountryList(allCountries);
  } catch (error) {
    console.error(error);
    list.innerHTML = `<li>Failed to load countries</li>`;
  }

  function renderCountryList(countries) {
    let html = "";
    for (let i = 0; i < countries.length; i++) {
      const country = countries[i];
      html += `
        <li class="country-list-item" data-code="${country.code}" data-name="${country.name}" data-flag="${country.flag}">
          <img src="${country.flag}" alt="${country.name}" class="country-list-flag">
          <span>${country.name}</span>
          <span class="country-list-code">${country.code}</span>
        </li>
      `;
    }
    list.innerHTML = html;
  }

  toggle.addEventListener("click", () => {
    panel.classList.toggle("hidden");
    if (!panel.classList.contains("hidden")) {
      searchInput.value = "";
      renderCountryList(allCountries);
      searchInput.focus();
    }
  });

  searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase();
    const filtered = allCountries.filter((c) =>
      c.name.toLowerCase().includes(query),
    );
    renderCountryList(filtered);
  });

  list.addEventListener("click", (event) => {
    const item = event.target.closest(".country-list-item");
    if (!item) return;

    const code = item.dataset.code;
    const name = item.dataset.name;
    const flag = item.dataset.flag;

    originalSelect.value = code;
    labelSpan.textContent = name;
    flagImg.src = flag;
    flagImg.style.display = "inline";
    panel.classList.add("hidden");

    if (typeof onSelect === "function") {
      onSelect(code, name);
    }
  });

  document.addEventListener("click", (event) => {
    if (!wrapper.contains(event.target)) {
      panel.classList.add("hidden");
    }
  });
}
