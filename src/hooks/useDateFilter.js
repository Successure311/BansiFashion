import { useState } from "react";
import { buildRange } from "../data/dates";

// State for a DateFilter: mode + two dates, and the derived { from, to } (null = all dates).
export function useDateFilter() {
  const [state, setState] = useState(() => ({ mode: "all", d1: new Date(), d2: new Date() }));
  const set = (mode, d1, d2) => setState({ mode, d1, d2 });
  return { ...state, set, range: buildRange(state.mode, state.d1, state.d2) };
}
