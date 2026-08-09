let count = 0;
let currentLabel = "";
const listeners = new Set();

function notify() {
  listeners.forEach((fn) => fn({ count, label: currentLabel }));
}

export function showGlobalLoading(label = "") {
  count += 1;
  if (label) currentLabel = label;
  notify();
}

export function hideGlobalLoading() {
  count = Math.max(0, count - 1);
  if (count === 0) currentLabel = "";
  notify();
}

export function subscribeGlobalLoading(fn) {
  listeners.add(fn);
  fn({ count, label: currentLabel }); // sync initial state
  return () => listeners.delete(fn);
}