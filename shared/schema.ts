import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const siteContent = pgTable("site_content", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
});

export const imageSlots = pgTable("image_slots", {
  id: serial("id").primaryKey(),
  slotKey: text("slot_key").notNull().unique(),
  filePath: text("file_path"),
  alt: text("alt").notNull().default(""),
  aspectRatioLabel: text("aspect_ratio_label").notNull().default(""),
  positionX: integer("position_x").notNull().default(50),
  positionY: integer("position_y").notNull().default(50),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const galleryImages = pgTable("gallery_images", {
  id: serial("id").primaryKey(),
  filePath: text("file_path").notNull(),
  alt: text("alt").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  positionX: integer("position_x").notNull().default(50),
  positionY: integer("position_y").notNull().default(50),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  status: text("status").notNull(),
  goals: text("goals").notNull(),
  contactMethod: text("contact_method").notNull().default("phone"),
  seen: boolean("seen").notNull().default(false),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const adminSettings = pgTable("admin_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
});

export const insertLeadSchema = createInsertSchema(leads, {
  phone: z.string().regex(/^\d{10}$/, { message: "מספר טלפון חייב להכיל 10 ספרות" }),
  name: z.string().min(2, { message: "שם חייב להכיל לפחות 2 תווים" }),
  email: z.string().min(1).email({ message: "כתובת אימייל לא תקינה" }),
  status: z.string().min(1, { message: "נא לבחור סטטוס זוגי" }),
  goals: z.string().min(5, { message: "נא לפרט מה תרצו לשפר" }),
  contactMethod: z.enum(["phone", "whatsapp"], { required_error: "נא לבחור אופן יצירת קשר" }),
}).omit({ id: true, seen: true, deletedAt: true, createdAt: true });
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;

export const insertGalleryImageSchema = createInsertSchema(galleryImages).omit({ id: true, updatedAt: true });
export type InsertGalleryImage = z.infer<typeof insertGalleryImageSchema>;
export type GalleryImage = typeof galleryImages.$inferSelect;

export type ImageSlot = typeof imageSlots.$inferSelect;
export type SiteContent = typeof siteContent.$inferSelect;
