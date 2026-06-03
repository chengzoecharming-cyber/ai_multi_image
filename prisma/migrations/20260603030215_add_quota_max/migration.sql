-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "image_quota" INTEGER NOT NULL DEFAULT 9999,
    "image_quota_max" INTEGER NOT NULL DEFAULT 9999,
    "quota_reset_at" DATETIME,
    "quota_reset_hours" INTEGER NOT NULL DEFAULT 24
);
INSERT INTO "new_users" ("created_at", "email", "email_verified", "id", "image", "image_quota", "name", "quota_reset_at", "quota_reset_hours", "role", "updated_at") SELECT "created_at", "email", "email_verified", "id", "image", "image_quota", "name", "quota_reset_at", "quota_reset_hours", "role", "updated_at" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
