import { Design } from "../shared/design";

const STORAGE_KEY = "og-modeler-design";
const EMAIL_KEY = "og-modeler-email";
const LEGACY_STORAGE_KEY = "og-business-cards-design";
const LEGACY_EMAIL_KEY = "og-business-cards-email";

export function saveLocalDesign(design: Design) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(design));
}

export function loadLocalDesign(): Design | null {
  const value = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!value) {
    return null;
  }
  return JSON.parse(value) as Design;
}

export function saveUserEmail(email: string) {
  localStorage.setItem(EMAIL_KEY, email);
}

export function loadUserEmail() {
  return localStorage.getItem(EMAIL_KEY) ?? localStorage.getItem(LEGACY_EMAIL_KEY) ?? "";
}
