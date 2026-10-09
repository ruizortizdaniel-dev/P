/**
 * Print utility for Cuadrante ADIF
 * Ensures clean landscape print without modal overlay interference
 */
export function triggerPrintReport() {
  // Briefly remove focus from any button to prevent outline in print
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }

  // Ensure DOM is ready, then trigger native browser print
  setTimeout(() => {
    window.print();
  }, 100);
}
