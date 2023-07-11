export function isElectron() {
  return import.meta.env.VITE_IS_ELECTRON === 'true';
}
