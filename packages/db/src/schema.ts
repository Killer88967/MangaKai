import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import type { BannerVariant } from "@mangakai/shared";

/**
 * Everything in here is data MangaKai owns. Manga, chapters, covers and
 * authors belong to MangaDex and are fetched live — where we need to point at
 * one, we store its MangaDex UUID and nothing else.
 */

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

export type BannerRow = typeof banners.$inferSelect;
export type NewBannerRow = typeof banners.$inferInsert;
export type StaffPickRow = typeof staffPicks.$inferSelect;
export type NewStaffPickRow = typeof staffPicks.$inferInsert;
