
import express from "express";
import calendarController from "../controllers/calendarController.js";

const router = express.Router();

router.get("/", calendarController.getAllCalendarEvents);
router.get("/:id", calendarController.getCalendarEventById);
router.post("/", calendarController.createCalendarEvent);
router.put("/:id", calendarController.updateCalendarEvent);
router.patch("/:id/status", calendarController.updateCalendarStatus);
router.delete("/:id", calendarController.deleteCalendarEvent);

export default router;
