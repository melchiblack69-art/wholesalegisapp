export default async function ShareApp() {
  const appUrl = window.location.origin;

  const shareData = {
    title: "Geo-based Wholesale Locator",
    text: "Check out our Geo wholesale company locator system.",
    url: appUrl,
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      await navigator.clipboard.writeText(appUrl);
      alert("App link copied to clipboard!");
    }
  } catch (error) {
    if (error.name !== "AbortError") {
      console.error("Share failed:", error);
    }
  }
}