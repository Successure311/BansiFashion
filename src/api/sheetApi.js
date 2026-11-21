import { WEBAPP_URL } from "../config";

async function readJson(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Unexpected response from server. Check WEBAPP_URL in src/config.js.");
  }
}

export async function sheetRead(tab) {
  const res = await fetch(`${WEBAPP_URL}?sheet=${encodeURIComponent(tab)}`);
  const data = await readJson(res);
  if (data && data.error) throw new Error(data.error);
  return data;
}

export async function sheetReadMany(tabs) {
  const res = await fetch(`${WEBAPP_URL}?sheets=${tabs.map(encodeURIComponent).join(",")}`);
  const data = await readJson(res);
  if (data && data.error) throw new Error(data.error);
  return data;
}

// Pre-added totals per quality+colour (needs the updated Apps Script).
// `fresh` skips the server-side cache.
export async function sheetSummary(fresh = false) {
  const res = await fetch(`${WEBAPP_URL}?summary=1${fresh ? "&fresh=1" : ""}`);
  const data = await readJson(res);
  if (data && data.error) throw new Error(data.error);
  if (!Array.isArray(data)) throw new Error("Summary not supported by server");
  return data;
}

// Per-day totals (Date, quality, colour) so the app can filter by date in memory.
export async function sheetDaily() {
  const res = await fetch(`${WEBAPP_URL}?daily=1`);
  const data = await readJson(res);
  if (data && data.error) throw new Error(data.error);
  if (!Array.isArray(data)) throw new Error("Summary not supported by server");
  return data;
}

export async function sheetPost(payload) {
  const res = await fetch(WEBAPP_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
  });
  const out = await readJson(res);
  if (out && out.error) throw new Error(out.error);
  return out;
}

export const appendEntry = (sheet, row) => sheetPost({ sheet, row });

// One QualityMaster row per colour range (a quality with several ranges has several rows).
export const appendQualityRow = (row) => sheetPost({ sheet: "QualityMaster", row });

// Replace every colour range of a quality (needs the updated Apps Script).
export const replaceQualityRanges = (name, ranges) =>
  sheetPost({ action: "replace_quality", name, ranges }).catch((err) => {
    if (/Unknown sheet/i.test(err.message)) {
      throw new Error("Update the Apps Script (Code.gs) and redeploy it, then try again.");
    }
    throw err;
  });
