import { eq, asc, desc, sql, isNull, isNotNull, lt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import {
  siteContent,
  imageSlots,
  galleryImages,
  leads,
  adminSettings,
  type InsertLead,
  type Lead,
  type GalleryImage,
  type ImageSlot,
  type SiteContent,
} from "@shared/schema";
import bcrypt from "bcryptjs";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

export interface IStorage {
  getAllContent(): Promise<SiteContent[]>;
  getContent(key: string): Promise<string | null>;
  setContent(key: string, value: string): Promise<void>;

  getAllImageSlots(): Promise<ImageSlot[]>;
  getImageSlot(slotKey: string): Promise<ImageSlot | undefined>;
  upsertImageSlot(slotKey: string, filePath: string | null, alt: string, aspectRatioLabel: string): Promise<ImageSlot>;
  updateImageSlotFile(slotKey: string, filePath: string): Promise<void>;
  updateImageSlotAlt(slotKey: string, alt: string): Promise<void>;
  updateImageSlotPosition(slotKey: string, positionX: number, positionY: number): Promise<void>;

  getAllGalleryImages(): Promise<GalleryImage[]>;
  addGalleryImage(filePath: string, alt: string, sortOrder: number): Promise<GalleryImage>;
  updateGalleryImage(id: number, alt: string): Promise<void>;
  deleteGalleryImage(id: number): Promise<void>;
  reorderGalleryImages(ids: number[]): Promise<void>;

  createLead(lead: InsertLead): Promise<Lead>;
  getAllLeads(): Promise<Lead[]>;
  getUnseenLeadsCount(): Promise<number>;
  markLeadsSeen(ids: number[]): Promise<void>;
  softDeleteLead(id: number): Promise<void>;
  restoreLead(id: number): Promise<void>;
  getTrashedLeads(): Promise<Lead[]>;
  permanentDeleteLead(id: number): Promise<void>;
  permanentDeleteAllTrash(): Promise<number>;
  restoreAllTrash(): Promise<number>;
  autoTrashOldLeads(): Promise<number>;
  cleanupOldTrash(): Promise<number>;

  getAdminPassword(): Promise<string | null>;
  setAdminPassword(hashedPassword: string): Promise<void>;
  verifyAdminPassword(password: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getAllContent(): Promise<SiteContent[]> {
    return db.select().from(siteContent);
  }

  async getContent(key: string): Promise<string | null> {
    const result = await db.select().from(siteContent).where(eq(siteContent.key, key));
    return result[0]?.value ?? null;
  }

  async setContent(key: string, value: string): Promise<void> {
    const existing = await db.select().from(siteContent).where(eq(siteContent.key, key));
    if (existing.length > 0) {
      await db.update(siteContent).set({ value }).where(eq(siteContent.key, key));
    } else {
      await db.insert(siteContent).values({ key, value });
    }
  }

  async getAllImageSlots(): Promise<ImageSlot[]> {
    return db.select().from(imageSlots);
  }

  async getImageSlot(slotKey: string): Promise<ImageSlot | undefined> {
    const result = await db.select().from(imageSlots).where(eq(imageSlots.slotKey, slotKey));
    return result[0];
  }

  async upsertImageSlot(slotKey: string, filePath: string | null, alt: string, aspectRatioLabel: string): Promise<ImageSlot> {
    const existing = await this.getImageSlot(slotKey);
    if (existing) {
      await db.update(imageSlots).set({ filePath, alt, aspectRatioLabel, updatedAt: new Date() }).where(eq(imageSlots.slotKey, slotKey));
      return (await this.getImageSlot(slotKey))!;
    } else {
      const result = await db.insert(imageSlots).values({ slotKey, filePath, alt, aspectRatioLabel }).returning();
      return result[0];
    }
  }

  async updateImageSlotFile(slotKey: string, filePath: string): Promise<void> {
    await db.update(imageSlots).set({ filePath, updatedAt: new Date() }).where(eq(imageSlots.slotKey, slotKey));
  }

  async updateImageSlotAlt(slotKey: string, alt: string): Promise<void> {
    await db.update(imageSlots).set({ alt, updatedAt: new Date() }).where(eq(imageSlots.slotKey, slotKey));
  }

  async updateImageSlotPosition(slotKey: string, positionX: number, positionY: number): Promise<void> {
    await db.update(imageSlots).set({ positionX, positionY, updatedAt: new Date() }).where(eq(imageSlots.slotKey, slotKey));
  }

  async getAllGalleryImages(): Promise<GalleryImage[]> {
    return db.select().from(galleryImages).orderBy(asc(galleryImages.sortOrder));
  }

  async addGalleryImage(filePath: string, alt: string, sortOrder: number): Promise<GalleryImage> {
    const result = await db.insert(galleryImages).values({ filePath, alt, sortOrder }).returning();
    return result[0];
  }

  async updateGalleryImage(id: number, alt: string): Promise<void> {
    await db.update(galleryImages).set({ alt, updatedAt: new Date() }).where(eq(galleryImages.id, id));
  }

  async deleteGalleryImage(id: number): Promise<void> {
    await db.delete(galleryImages).where(eq(galleryImages.id, id));
  }

  async reorderGalleryImages(ids: number[]): Promise<void> {
    for (let i = 0; i < ids.length; i++) {
      await db.update(galleryImages).set({ sortOrder: i }).where(eq(galleryImages.id, ids[i]));
    }
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    const result = await db.insert(leads).values(lead).returning();
    return result[0];
  }

  async getAllLeads(): Promise<Lead[]> {
    return db.select().from(leads).where(isNull(leads.deletedAt)).orderBy(desc(leads.createdAt));
  }

  async getUnseenLeadsCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)::int` }).from(leads).where(sql`${leads.seen} = false AND ${leads.deletedAt} IS NULL`);
    return result[0]?.count ?? 0;
  }

  async markLeadsSeen(ids: number[]): Promise<void> {
    for (const id of ids) {
      await db.update(leads).set({ seen: true }).where(eq(leads.id, id));
    }
  }

  async softDeleteLead(id: number): Promise<void> {
    await db.update(leads).set({ deletedAt: new Date() }).where(eq(leads.id, id));
  }

  async restoreLead(id: number): Promise<void> {
    await db.update(leads).set({ deletedAt: null }).where(eq(leads.id, id));
  }

  async getTrashedLeads(): Promise<Lead[]> {
    return db.select().from(leads).where(isNotNull(leads.deletedAt)).orderBy(desc(leads.deletedAt));
  }

  async permanentDeleteLead(id: number): Promise<void> {
    await db.delete(leads).where(eq(leads.id, id));
  }

  async permanentDeleteAllTrash(): Promise<number> {
    const trashed = await db.select({ id: leads.id }).from(leads).where(isNotNull(leads.deletedAt));
    for (const row of trashed) {
      await db.delete(leads).where(eq(leads.id, row.id));
    }
    return trashed.length;
  }

  async restoreAllTrash(): Promise<number> {
    const trashed = await db.select({ id: leads.id }).from(leads).where(isNotNull(leads.deletedAt));
    for (const row of trashed) {
      await db.update(leads).set({ deletedAt: null }).where(eq(leads.id, row.id));
    }
    return trashed.length;
  }

  async autoTrashOldLeads(): Promise<number> {
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const old = await db.select({ id: leads.id }).from(leads).where(
      sql`${leads.deletedAt} IS NULL AND ${leads.createdAt} < ${fourteenDaysAgo}`
    );
    for (const row of old) {
      await db.update(leads).set({ deletedAt: new Date() }).where(eq(leads.id, row.id));
    }
    return old.length;
  }

  async cleanupOldTrash(): Promise<number> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const old = await db.select({ id: leads.id }).from(leads).where(sql`${leads.deletedAt} IS NOT NULL AND ${leads.deletedAt} < ${thirtyDaysAgo}`);
    for (const row of old) {
      await db.delete(leads).where(eq(leads.id, row.id));
    }
    return old.length;
  }

  async getAdminPassword(): Promise<string | null> {
    const result = await db.select().from(adminSettings).where(eq(adminSettings.key, "admin_password"));
    return result[0]?.value ?? null;
  }

  async setAdminPassword(plainPassword: string): Promise<void> {
    const hashed = await bcrypt.hash(plainPassword, 10);
    const existing = await db.select().from(adminSettings).where(eq(adminSettings.key, "admin_password"));
    if (existing.length > 0) {
      await db.update(adminSettings).set({ value: hashed }).where(eq(adminSettings.key, "admin_password"));
    } else {
      await db.insert(adminSettings).values({ key: "admin_password", value: hashed });
    }
  }

  async verifyAdminPassword(password: string): Promise<boolean> {
    const hashed = await this.getAdminPassword();
    if (!hashed) return false;
    return bcrypt.compare(password, hashed);
  }
}

export const storage = new DatabaseStorage();
