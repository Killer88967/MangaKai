import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import type { BannerVariant, UserRole } from "@mangakai/shared";

/**
 * Everything in here is data MangaKai owns. Manga, chapters, covers and
 * authors belong to MangaDex and are fetched live — where we need to point at
 * one, we store its MangaDex UUID and nothing else.
 */

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  /**
   * Stored already lowercased and trimmed. The unique index applies to what is
   * stored, so normalising has to happen before the insert or `A@b.com` and
   * `a@b.com` become two accounts.
   */
  email: text("email").notNull().unique(),
  /** scrypt, with its parameters embedded — see `apps/api/src/lib/password.ts`. */
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name").notNull(),
  /**
   * Public profile handle
   *
   * Stored already lowercased and trimmed. Nullable for existing accounts so
   * the profile system can be introduced without forcing a migration-time
   * username onto everyone.
   */
  username: text("username").unique(),
  /** Short public profile biography. */
  bio: text("bio"),
  /** Public avatar URL. Upload storage can replace this later */
  avatarUrl: text("avatar_url"),

  /**
   * Application permissions.
   *
   * Stored as text instead of Postgres enum so adding a new role later does
   * not require altering a database enum type.
   */
  role: text("role").$type<UserRole>().notNull().default("user"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * One row per logged-in device.
 *
 * We store a SHA-256 of the session token, never the token itself, so a leaked
 * database dump does not hand over live sessions. Deleting a row logs that
 * device out immediately — the reason for keeping sessions here rather than
 * signing stateless tokens.
 */
export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // The unique index on token_hash covers request authentication. This one
    // covers the other direction: "sign out everywhere" and pruning a user's
    // expired rows, which look up by user instead.
    index("sessions_user_id_idx").on(table.userId),
  ],
);

export const banners = pgTable("banners", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  body: text("body"),
  imageUrl: text("image_url"),
  linkUrl: text("link_url"),
  linkLabel: text("link_label"),
  variant: text("variant").$type<BannerVariant>().notNull().default("info"),
  /** Lets an admin retire a banner without deleting the record. */
  active: boolean("active").notNull().default(true),
  /** Optional scheduling window; null on either side means "unbounded". */
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const staffPicks = pgTable("staff_picks", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** MangaDex manga UUID. The manga itself is fetched from MangaDex. */
  mangaId: text("manga_id").notNull().unique(),
  /** Why the staff picked it — MangaKai's own editorial voice. */
  note: text("note"),
  position: integer("position").notNull().default(0),
  /** Draft picks stay out of the homepage until published. */
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;
export type SessionRow = typeof sessions.$inferSelect;
export type NewSessionRow = typeof sessions.$inferInsert;
export type BannerRow = typeof banners.$inferSelect;
export type NewBannerRow = typeof banners.$inferInsert;
export type StaffPickRow = typeof staffPicks.$inferSelect;
export type NewStaffPickRow = typeof staffPicks.$inferInsert;
