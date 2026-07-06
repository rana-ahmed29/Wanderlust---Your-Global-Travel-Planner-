"use strict";

const state = {
  countryCode: "",
  countryName: "",
  cityName: "",
  cityLat: null,
  cityLon: null,
  year: "2026",
};

export function setSelection({
  countryCode,
  countryName,
  cityName,
  cityLat,
  cityLon,
  year,
}) {
  if (countryCode !== undefined) state.countryCode = countryCode;
  if (countryName !== undefined) state.countryName = countryName;
  if (cityName !== undefined) state.cityName = cityName;
  if (cityLat !== undefined) state.cityLat = cityLat;
  if (cityLon !== undefined) state.cityLon = cityLon;
  if (year !== undefined) state.year = year;
}

export function getSelection() {
  return { ...state };
}

export function clearSelection() {
  state.countryCode = "";
  state.countryName = "";
  state.cityName = "";
  state.cityLat = null;
  state.cityLon = null;
}
