// Reliable seeded placeholder images — deterministic per company, always resolves.
// Swap `companyImageUrl` for a real Cloudinary/S3 URL builder once the backend exists;
// every call site already passes width/height so the signature won't need to change.
export function companyImageUrl(company) {
  return company?.cover_image || company?.cover_url || company?.image_url || null;
}

// Multiple photos per company (storefront, products, interior, etc.) for the
// detail-page carousel. Swap for `company.images` from the API once available —
// this just returns an array of seeded URLs in the meantime.
export function companyGalleryUrls(company) {
  return (company?.images || []).map((image) => image.url).filter(Boolean);
}
