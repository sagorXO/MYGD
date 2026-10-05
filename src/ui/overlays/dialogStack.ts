// [ADR] Context: each open dialog listened on `document`, so one Escape closed every stacked dialog
// and the last one to close restored a stale `overflow` value, leaving the page scroll-locked.
// Decision: a module-level stack decides which dialog owns keyboard input, and the scroll lock is
// reference-counted. Keys already handled by a nested widget (defaultPrevented) are ignored.
// Consequence: only the top-most dialog reacts to Escape/Tab; scroll unlocks when the last one closes.
const stack: symbol[] = [];
let lockCount = 0;
let savedOverflow = "";

export function pushDialog(id: symbol): void {
  stack.push(id);
}

export function popDialog(id: symbol): void {
  const i = stack.lastIndexOf(id);
  if (i >= 0) stack.splice(i, 1);
}

export function isTopDialog(id: symbol): boolean {
  return stack[stack.length - 1] === id;
}

export function shouldHandleKey(event: { defaultPrevented: boolean }, id: symbol): boolean {
  return !event.defaultPrevented && isTopDialog(id);
}

export function lockScroll(style: { overflow: string }): void {
  if (lockCount === 0) {
    savedOverflow = style.overflow;
    style.overflow = "hidden";
  }
  lockCount += 1;
}

export function unlockScroll(style: { overflow: string }): void {
  if (lockCount === 0) return;
  lockCount -= 1;
  if (lockCount === 0) style.overflow = savedOverflow;
}
