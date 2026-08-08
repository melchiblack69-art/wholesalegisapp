export async function shareCompany(company) {
  const url = `${window.location.origin}/companies/${company.id}`;

  const shareData = {
    title: company.company_name,
    text: `Check out ${company.company_name}.`,
    url,
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      await navigator.clipboard.writeText(url);
      alert("Company link copied to clipboard!");
    }
  } catch (error) {
    if (error.name !== "AbortError") {
      console.error("Company share failed:", error);
    }
  }
}