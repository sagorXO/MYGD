import { SURFACE_DEFAULT_THEME, storageKey, type Surface } from "./theme";

/**
 * Inline script placed as the first child of a SurfaceRoot. It runs while the HTML is parsed,
 * before the surface paints, so a stored theme never flashes the default first.
 * Only uses the globals `document`, `localStorage` and `matchMedia` (injected in tests).
 */
export function themeBootScript(surface: Surface): string {
  const key = JSON.stringify(storageKey(surface));
  const fallback = JSON.stringify(SURFACE_DEFAULT_THEME[surface]);
  return `(function(){var el=document.currentScript&&document.currentScript.parentElement;if(!el)return;var p=null;try{p=localStorage.getItem(${key});}catch(e){}if(p!=="light"&&p!=="dark"&&p!=="system")p=${fallback};var dark=false;try{dark=matchMedia("(prefers-color-scheme: dark)").matches;}catch(e){}el.dataset.theme=p==="system"?(dark?"dark":"light"):p;})();`;
}
