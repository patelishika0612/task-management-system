import express from "express";
import employeeAuth from "../middleware/employeeAuth.js";

import {
  getPublicKey,
  subscribeEmployee,
  unsubscribeEmployee,
} from "../controllers/pushController.js";

const router = express.Router();

router.get("/public-key", getPublicKey);

router.post("/subscribe", employeeAuth, subscribeEmployee);

router.post("/unsubscribe", employeeAuth, unsubscribeEmployee);

export default router;