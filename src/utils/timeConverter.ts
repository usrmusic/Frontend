/**
 * Parse various human-friendly time inputs into 24h `HH:mm` format.
 * Supports: 7am, 7:30pm, 19:30, 7, 730, 1430, etc.
 */


export const parseTimeTo24 = (input?: string): string => {
  if (!input) return "";
  let v = String(input).trim().toLowerCase();
  // Normalize common separators
  v = v.replace(/\s+/g, "");

  // am/pm formats like 7am, 7:30pm
  const ampmMatch = v.match(/^(\d{1,2})(?::(\d{2}))?(am|pm)$/i);
  if (ampmMatch) {
    let hh = Number(ampmMatch[1]);
    const mm = ampmMatch[2] ? Number(ampmMatch[2]) : 0;
    const ampm = ampmMatch[3].toLowerCase();
    if (ampm === "pm" && hh < 12) hh += 12;
    if (ampm === "am" && hh === 12) hh = 0;
    if (hh >= 0 && hh < 24 && mm >= 0 && mm < 60) {
      return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
    }
  }

  // 24-hour formats like 14:30 or 7:30
  const hmMatch = v.match(/^(\d{1,2}):(\d{2})$/);
  if (hmMatch) {
    const hh = Number(hmMatch[1]);
    const mm = Number(hmMatch[2]);
    if (hh >= 0 && hh < 24 && mm >= 0 && mm < 60) {
      return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
    }
  }

  // Numeric shorthand: 7 -> 07:00, 730 or 0730 -> 07:30, 1430 -> 14:30
  if (/^\d{1,4}$/.test(v)) {
    if (v.length <= 2) {
      const hh = Number(v);
      if (hh >= 0 && hh < 24) return `${String(hh).padStart(2, "0")}:00`;
    } else {
      // split last two digits as minutes
      const mm = Number(v.slice(-2));
      const hh = Number(v.slice(0, v.length - 2));
      if (hh >= 0 && hh < 24 && mm >= 0 && mm < 60) {
        return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
      }
    }
  }

  // If nothing matched, return original trimmed value
  return input;
};
