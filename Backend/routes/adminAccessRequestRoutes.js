import express from "express";
import adminAccessRequestController from "../controllers/adminAccessRequestController.js";

const router = express.Router();

router.get("/", adminAccessRequestController.getAllRequests);
router.get("/:id", adminAccessRequestController.getRequestById);
router.post("/", adminAccessRequestController.createRequest);
router.put("/:id", adminAccessRequestController.updateRequest);
router.delete("/:id", adminAccessRequestController.deleteRequest);

export default router;