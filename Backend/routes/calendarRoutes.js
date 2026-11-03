
import express from "express";
import calendarController from "../controllers/calendarController.js";

const router = express.Router();

// Get all calendar events
router.get("/", calendarController.getAllCalendarEvents);

// Get one manual calendar event
router.get("/:id", calendarController.getCalendarEventById);

// Create manual calendar event
router.post("/", calendarController.createCalendarEvent);

// Update manual calendar event
router.put("/:id", calendarController.updateCalendarEvent);

// Update manual calendar event status
router.patch("/:id/status", calendarController.updateCalendarStatus);

// Update actual task status
router.patch(
  "/task/:id/status",
  calendarController.updateTaskCalendarStatus
);

// Delete manual calendar event
router.delete("/:id", calendarController.deleteCalendarEvent);

export default router;
