// functions/src/common/validate.js
export function isValidDateString(s) {
    return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
  }
  
  export function mustString(v) {
    return String(v ?? "").trim();
  }
