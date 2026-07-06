"use strict";

const STORAGE_KEY = "wanderlust_plans";

function injectSavedHeartStyle() {
  if (document.getElementById("saved-heart-style")) return;

  const style = document.createElement("style");
  style.id = "saved-heart-style";
  style.textContent = `
    button.holiday-action-btn .heart-filled,
    button.event-card-save .heart-filled,
    button.btn-event .heart-filled {
      display: none;
    }
    button.holiday-action-btn.plan-saved-btn .heart-outline,
    button.event-card-save.plan-saved-btn .heart-outline,
    button.btn-event.plan-saved-btn .heart-outline {
      display: none;
    }
    button.holiday-action-btn.plan-saved-btn .heart-filled,
    button.event-card-save.plan-saved-btn .heart-filled,
    button.btn-event.plan-saved-btn .heart-filled {
      display: inline-block;
      color: #e63946 !important;
    }
    button.holiday-action-btn.plan-saved-btn,
    button.event-card-save.plan-saved-btn {
      background-color: #fde2e4 !important;
    }
  `;
  document.head.appendChild(style);
}


export function getPlans() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error("Failed to read plans from storage", error);
    return [];
  }
}

function savePlansToStorage(plans) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
}

export function isSaved(id) {
  return getPlans().some((plan) => plan.id === id);
}

export function savePlan(plan) {
  const plans = getPlans();
  if (plans.some((p) => p.id === plan.id)) return;

  plans.push(plan);
  savePlansToStorage(plans);
  updateSavedCounters();
}

export function removePlan(id) {
  const plans = getPlans().filter((p) => p.id !== id);
  savePlansToStorage(plans);
  updateSavedCounters();
}

export function toggleSavePlan(plan) {
  if (isSaved(plan.id)) {
    removePlan(plan.id);
    return false;
  } else {
    savePlan(plan);
    return true;
  }
}

export function clearAllPlans() {
  savePlansToStorage([]);
  updateSavedCounters();
}

export function updateSavedCounters() {
  const count = getPlans().length;

  const statSaved = document.getElementById("stat-saved");
  if (statSaved) statSaved.textContent = count;

  const navBadge = document.getElementById("plans-count");
  if (navBadge) {
    navBadge.textContent = count;
    navBadge.classList.toggle("hidden", count === 0);
  }
}

// Just toggles a class on the button — CSS handles which heart icon shows,
// so there's no need to touch Font Awesome's already-converted SVGs
function applySavedLook(id) {
  document.querySelectorAll(`[data-save-id="${id}"]`).forEach((btn) => {
    btn.classList.add("plan-saved-btn");
  });
}

export function wireSaveButtons(container) {
  if (!container) return;

  injectSavedHeartStyle();

  const saveButtons = container.querySelectorAll("[data-save-id]");

  saveButtons.forEach((btn) => {
    const id = btn.dataset.saveId;

    if (isSaved(id)) {
      applySavedLook(id);
    }

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();

      const plan = JSON.parse(btn.dataset.savePlan);

      if (isSaved(plan.id)) {
        if (typeof Swal !== "undefined") {
          Swal.fire({
            toast: true,
            position: "bottom-end",
            icon: "info",
            title: "Already saved!",
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true,
          });
        }
        return;
      }

      savePlan(plan);
      applySavedLook(plan.id);

      if (typeof Swal !== "undefined") {
        Swal.fire({
          toast: true,
          position: "bottom-end",
          icon: "success",
          title: "Saved to My Plans!",
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
        });
      }
    });
  });
}

function buildPlanCard(plan) {
  const typeLabels = {
    holiday: "Holiday",
    event: "Event",
    longweekend: "Long Weekend",
  };

  const label = typeLabels[plan.type] ?? "Saved";

  const title =
    plan.title.length > 35 ? plan.title.substring(0, 35) : plan.title;

  return `
   <div class="plan-card" data-plan-id="${plan.id}">
      <span class="plan-card-type ${plan.type}">${label}</span>

      <div class="plan-card-content">

        <h4>${title}</h4>

        <div class="plan-card-details">
          <div>
            <i class="fa-regular fa-calendar"></i>
            ${plan.date ?? ""}
          </div>

          <div>
            <i class="fa-solid fa-circle-info"></i>
            ${plan.subtitle ?? ""}
          </div>
        </div>

        <div class="plan-card-actions">
          <button class="btn-plan-remove" data-remove-plan-id="${plan.id}">
            <i class="fa-solid fa-trash"></i> Remove
          </button>
        </div>

      </div>
   </div>
  `;
}

function renderEmptyState() {
  const container = document.getElementById("plans-content");
  if (!container) return;

  container.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon"><i class="fa-solid fa-heart-crack"></i></div>
      <h3>No Saved Plans Yet</h3>
      <p>Start exploring and save holidays, events, or long weekends you like!</p>
      <button class="btn-primary" id="start-exploring-btn">
        <i class="fa-solid fa-compass"></i> Start Exploring
      </button>
    </div>
  `;

  const startBtn = document.getElementById("start-exploring-btn");
  if (startBtn) {
    startBtn.addEventListener("click", () => {
      document.querySelector('[data-view="dashboard"]')?.click();
    });
  }
}

let currentFilter = "all";

export function loadMyPlans() {
  
  const container = document.getElementById("plans-content");
  if (!container) return;

  const allPlans = getPlans();

  const counts = { holiday: 0, event: 0, longweekend: 0 };
  allPlans.forEach((p) => {
    if (counts[p.type] !== undefined) counts[p.type]++;
  });

  const allCountEl = document.getElementById("filter-all-count");
  const holidayCountEl = document.getElementById("filter-holiday-count");
  const eventCountEl = document.getElementById("filter-event-count");
  const lwCountEl = document.getElementById("filter-lw-count");

  if (allCountEl) allCountEl.textContent = allPlans.length;
  if (holidayCountEl) holidayCountEl.textContent = counts.holiday;
  if (eventCountEl) eventCountEl.textContent = counts.event;
  if (lwCountEl) lwCountEl.textContent = counts.longweekend;

  const filteredPlans =
    currentFilter === "all"
      ? allPlans
      : allPlans.filter((p) => p.type === currentFilter);

  if (!filteredPlans.length) {
    renderEmptyState();
    return;
  }

  container.innerHTML = filteredPlans.map(buildPlanCard).join("");

  container.querySelectorAll("[data-remove-plan-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      removePlan(btn.dataset.removePlanId);
      loadMyPlans();
    });
  });

  updateSavedCounters();
}

export function initPlanFilters() {
  const filterButtons = document.querySelectorAll(".plan-filter");

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.dataset.filter;
      loadMyPlans();
    });
  });

  const clearAllBtn = document.getElementById("clear-all-plans-btn");
  if (clearAllBtn) {
    clearAllBtn.addEventListener("click", () => {
      Swal.fire({
        title: "Clear all saved plans?",
        text: "This cannot be undone.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, clear all",
        confirmButtonColor: "#d33",
      }).then((result) => {
        if (result.isConfirmed) {
          clearAllPlans();
          loadMyPlans();
        }
      });
    });
  }
}
