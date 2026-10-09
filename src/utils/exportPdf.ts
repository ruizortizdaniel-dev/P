/**
 * Direct file download from server PDF endpoint
 * Guaranteed to work across all platforms, mobile, desktop, and inside iframes
 */
export async function downloadOfficialPdf(
  endpointUrl: string, 
  defaultFilename: string,
  onProgress?: (isGenerating: boolean) => void
): Promise<boolean> {
  if (onProgress) onProgress(true);

  try {
    const res = await fetch(endpointUrl);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    
    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', defaultFilename);
    document.body.appendChild(link);
    link.click();
    
    setTimeout(() => {
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
      window.URL.revokeObjectURL(blobUrl);
    }, 2500);

    if (onProgress) onProgress(false);
    return true;
  } catch (err) {
    console.error('Error in blob download, attempting direct link navigation:', err);
    // Fallback: direct window.location navigation to start browser download
    try {
      window.location.href = endpointUrl;
    } catch (navErr) {
      console.error('Navigation error:', navErr);
    }
    if (onProgress) onProgress(false);
    return false;
  }
}
