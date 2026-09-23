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

export const upsertQuality = (row) =>
  sheetPost({ sheet: "QualityMaster", row, action: "upsert", key_column: "QualityName" });
