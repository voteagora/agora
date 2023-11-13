export function extractWebsiteName(urlString: string): string {
  try {
    const url = new URL(urlString);
    return url.hostname;
  } catch (error) {
    console.error("Invalid URL:", error);
    return "Unknown";
  }
}
