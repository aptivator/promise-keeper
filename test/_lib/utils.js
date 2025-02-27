export function pause() {
  return new Promise((resolve) => queueMicrotask(resolve));
}

export function pauseMs(ms = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
