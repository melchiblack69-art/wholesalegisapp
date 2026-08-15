// Frontend URLs and non-image API paths should use public identifiers.
// The fallback keeps older API records usable during migration.
export const publicId = (entity) => entity?.public_id || entity?.publicId || entity?.id;
