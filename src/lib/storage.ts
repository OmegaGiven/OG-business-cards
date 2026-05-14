import { Design } from "../shared/design";

const STORAGE_KEY = "og-3dmodeler-design";
const LEGACY_MODELER_STORAGE_KEY = "og-modeler-design";
const LEGACY_STORAGE_KEY = "og-business-cards-design";

export function saveLocalDesign(design: Design) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(design));
}

export function loadLocalDesign(): Design | null {
  const value = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_MODELER_STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!value) {
    return null;
  }
  return JSON.parse(value) as Design;
}
