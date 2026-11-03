import express from "express";
import {
    getEmployeeCalendar,
} from "../controllers/employeeCalendarController.js";

const router = express.Router();

router.get("/:employeeId", getEmployeeCalendar);

export default router;