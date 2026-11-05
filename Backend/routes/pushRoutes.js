
import express from "express";
import employeeAuth from "../middleware/employeeAuth.js";
import adminAuth from "../middleware/adminAuth.js";

import {
  getPublicKey,
  subscribeEmployee,
  unsubscribeEmployee,
  subscribeAdmin,
  unsubscribeAdmin,
} from "../controllers/pushController.js";

const router = express.Router();

// Public VAPID key
router.get("/public-key", getPublicKey);

// Employee push notifications
router.post("/subscribe", employeeAuth, subscribeEmployee);
router.post("/unsubscribe", employeeAuth, unsubscribeEmployee);

// Admin push notifications
router.post("/admin/subscribe", adminAuth, subscribeAdmin);
router.post("/admin/unsubscribe", adminAuth, unsubscribeAdmin);

export default router;
