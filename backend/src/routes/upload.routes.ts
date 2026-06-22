import fs from "fs";
import path from "path";
import multer from "multer";
import { Router } from "express";
import { Role } from "@prisma/client";
import { env } from "../config/env";
import { prisma } from "../config/prisma";
import { authenticate, requireRoles } from "../middlewares/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { created } from "../utils/http";

export const uploadRoutes = Router();

fs.mkdirSync(env.UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, env.UPLOAD_DIR),
  filename: (_req, file, callback) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, "-");
    callback(null, `${Date.now()}-${safeName}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }
});

uploadRoutes.post(
  "/upload",
  authenticate,
  requireRoles(Role.SUPER_ADMIN, Role.SALES_ADMIN, Role.YOGA_TRAINER, Role.DIETICIAN, Role.SUPPORT_ADMIN),
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new Error("File is required");
    const relative = path.posix.join("uploads", req.file.filename);
    const asset = await prisma.fileAsset.create({
      data: {
        uploadedBy: req.auth!.id,
        relatedType: req.body.relatedType,
        relatedId: req.body.relatedId,
        fileName: req.file.originalname,
        fileUrl: `${env.PUBLIC_API_BASE_URL}/${relative}`,
        mimeType: req.file.mimetype,
        fileSize: req.file.size
      }
    });
    created(res, asset, "File uploaded");
  })
);
