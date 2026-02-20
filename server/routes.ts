import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import nodemailer from "nodemailer";
import { insertLeadSchema } from "@shared/schema";

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const multerStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const upload = multer({
  storage: multerStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

async function sendLeadEmail(lead: { name: string; phone: string; email: string; status: string; goals: string }) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"אתר גל פרידמן מלכה" <${process.env.GMAIL_USER}>`,
      to: "galfridman21@gmail.com",
      subject: `פנייה חדשה מ-${lead.name}`,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2 style="color: #c9a4a0;">פנייה חדשה מהאתר</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">שם:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${lead.name}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">טלפון:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${lead.phone}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">אימייל:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${lead.email}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">סטטוס זוגי:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${lead.status}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">מה רוצה לשפר:</td><td style="padding: 8px;">${lead.goals}</td></tr>
          </table>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("Email sending failed:", error);
    return false;
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.use("/uploads", (req, res, next) => {
    const filePath = path.join(uploadDir, req.path);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ message: "File not found" });
    }
  });

  app.get("/api/content", async (_req, res) => {
    try {
      const allContent = await storage.getAllContent();
      const contentMap: Record<string, string> = {};
      for (const item of allContent) {
        contentMap[item.key] = item.value;
      }
      res.json(contentMap);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch content" });
    }
  });

  app.put("/api/content", async (req, res) => {
    try {
      const entries = req.body as Record<string, string>;
      for (const [key, value] of Object.entries(entries)) {
        await storage.setContent(key, value);
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update content" });
    }
  });

  app.get("/api/image-slots", async (_req, res) => {
    try {
      const slots = await storage.getAllImageSlots();
      res.json(slots);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch image slots" });
    }
  });

  app.post("/api/image-slots/:slotKey/upload", upload.single("image"), async (req, res) => {
    try {
      const { slotKey } = req.params;
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const filePath = `/uploads/${req.file.filename}`;
      await storage.updateImageSlotFile(slotKey as string, filePath);
      const slot = await storage.getImageSlot(slotKey as string);
      if (!slot) {
        await storage.upsertImageSlot(slotKey as string, filePath, "", "");
      }
      res.json({ filePath, slot: await storage.getImageSlot(slotKey as string) });
    } catch (error) {
      res.status(500).json({ message: "Failed to upload image" });
    }
  });

  app.put("/api/image-slots/:slotKey", async (req, res) => {
    try {
      const { slotKey } = req.params;
      const { alt, aspectRatioLabel } = req.body;
      const existing = await storage.getImageSlot(slotKey);
      if (existing) {
        if (alt !== undefined) await storage.updateImageSlotAlt(slotKey, alt);
      } else {
        await storage.upsertImageSlot(slotKey, null, alt || "", aspectRatioLabel || "");
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update image slot" });
    }
  });

  app.get("/api/gallery", async (_req, res) => {
    try {
      const images = await storage.getAllGalleryImages();
      res.json(images);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch gallery" });
    }
  });

  app.post("/api/gallery/upload", upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const filePath = `/uploads/${req.file.filename}`;
      const alt = req.body.alt || "";
      const sortOrder = parseInt(req.body.sortOrder) || 0;
      const image = await storage.addGalleryImage(filePath, alt, sortOrder);
      res.json(image);
    } catch (error) {
      res.status(500).json({ message: "Failed to upload gallery image" });
    }
  });

  app.put("/api/gallery/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { alt } = req.body;
      await storage.updateGalleryImage(id, alt);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update gallery image" });
    }
  });

  app.delete("/api/gallery/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteGalleryImage(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete gallery image" });
    }
  });

  app.post("/api/gallery/:id/replace", upload.single("image"), async (req, res) => {
    try {
      const id = parseInt(req.params.id as string);
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const filePath = `/uploads/${req.file.filename}`;
      const oldImage = (await storage.getAllGalleryImages()).find(g => g.id === id);
      const preservedOrder = oldImage?.sortOrder ?? 0;
      await storage.deleteGalleryImage(id);
      const altText = typeof req.body.alt === "string" ? req.body.alt : "";
      const image = await storage.addGalleryImage(filePath, altText, preservedOrder);
      res.json(image);
    } catch (error) {
      res.status(500).json({ message: "Failed to replace gallery image" });
    }
  });

  app.post("/api/gallery/reorder", async (req, res) => {
    try {
      const { ids } = req.body;
      await storage.reorderGalleryImages(ids);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to reorder gallery" });
    }
  });

  app.post("/api/leads", async (req, res) => {
    try {
      const parsed = insertLeadSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
      }
      const lead = await storage.createLead(parsed.data);
      try {
        await sendLeadEmail(parsed.data);
      } catch (emailErr) {
        console.error("Email sending failed (lead was saved):", emailErr);
      }
      res.json({ success: true, lead });
    } catch (error) {
      res.status(500).json({ message: "Failed to submit lead" });
    }
  });

  app.get("/api/leads", async (_req, res) => {
    try {
      const leads = await storage.getAllLeads();
      res.json(leads);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });

  app.post("/api/admin/login", async (req, res) => {
    try {
      const { password } = req.body;
      const valid = await storage.verifyAdminPassword(password);
      if (valid) {
        res.json({ success: true });
      } else {
        res.status(401).json({ message: "Incorrect password" });
      }
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/admin/change-password", async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const valid = await storage.verifyAdminPassword(currentPassword);
      if (!valid) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters" });
      }
      await storage.setAdminPassword(newPassword);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  app.post("/api/admin/init", async (_req, res) => {
    try {
      const existingPassword = await storage.getAdminPassword();
      if (!existingPassword) {
        await storage.setAdminPassword("admin123");
      }

      const existingGallery = await storage.getAllGalleryImages();
      if (existingGallery.length === 0) {
        const defaultImages = [
          { src: "gallery-1.jpg", alt: "קליניקה" },
          { src: "gallery-2.jpg", alt: "אווירה" },
          { src: "hero.jpg", alt: "זוגיות" },
        ];
        const assetsDir = path.join(process.cwd(), "client", "src", "assets", "images");
        for (let i = 0; i < defaultImages.length; i++) {
          const srcFile = path.join(assetsDir, defaultImages[i].src);
          if (fs.existsSync(srcFile)) {
            const destName = `default-${Date.now()}-${i}${path.extname(defaultImages[i].src)}`;
            const destFile = path.join(uploadDir, destName);
            fs.copyFileSync(srcFile, destFile);
            await storage.addGalleryImage(`/uploads/${destName}`, defaultImages[i].alt, i);
          }
        }
      }

      const existingSlots = await storage.getAllImageSlots();
      if (existingSlots.length === 0) {
        const assetsDir = path.join(process.cwd(), "client", "src", "assets", "images");
        const heroSrc = path.join(assetsDir, "hero.jpg");
        const benefitsSrc = path.join(assetsDir, "gallery-1.jpg");
        if (fs.existsSync(heroSrc)) {
          const heroName = `default-hero-${Date.now()}.jpg`;
          fs.copyFileSync(heroSrc, path.join(uploadDir, heroName));
          await storage.upsertImageSlot("HERO_BACKGROUND", `/uploads/${heroName}`, "רקע קליניקה נומרולוגיה", "16:9 (מומלץ 1920x1080)");
        }
        if (fs.existsSync(benefitsSrc)) {
          const benefitsName = `default-benefits-${Date.now()}.jpg`;
          fs.copyFileSync(benefitsSrc, path.join(uploadDir, benefitsName));
          await storage.upsertImageSlot("BENEFITS_IMAGE", `/uploads/${benefitsName}`, "קליניקה ואווירה", "3:4 אופקי (מומלץ 800x1000)");
        }
      }

      res.json({ initialized: true });
    } catch (error) {
      console.error("Init error:", error);
      res.status(500).json({ message: "Failed to initialize" });
    }
  });

  return httpServer;
}
