-- Public identifiers for URLs and API contracts.
-- Keep numeric primary keys for internal joins and foreign keys.
-- company_images.public_id already exists and is the Cloudinary public ID;
-- preserve it and do not replace it with a database UUID.
ALTER TABLE users
  ADD COLUMN public_id CHAR(36) NULL UNIQUE;

ALTER TABLE companies
  ADD COLUMN public_id CHAR(36) NULL UNIQUE;

ALTER TABLE categories
  ADD COLUMN public_id CHAR(36) NULL UNIQUE;

ALTER TABLE products
  ADD COLUMN public_id CHAR(36) NULL UNIQUE;

UPDATE users SET public_id = UUID() WHERE public_id IS NULL;
UPDATE companies SET public_id = UUID() WHERE public_id IS NULL;
UPDATE categories SET public_id = UUID() WHERE public_id IS NULL;
UPDATE products SET public_id = UUID() WHERE public_id IS NULL;

ALTER TABLE users MODIFY public_id CHAR(36) NOT NULL;
ALTER TABLE companies MODIFY public_id CHAR(36) NOT NULL;
ALTER TABLE categories MODIFY public_id CHAR(36) NOT NULL;
ALTER TABLE products MODIFY public_id CHAR(36) NOT NULL;

-- Generate IDs automatically for records created after this migration.
ALTER TABLE users ALTER COLUMN public_id SET DEFAULT (UUID());
ALTER TABLE companies ALTER COLUMN public_id SET DEFAULT (UUID());
ALTER TABLE categories ALTER COLUMN public_id SET DEFAULT (UUID());
ALTER TABLE products ALTER COLUMN public_id SET DEFAULT (UUID());
