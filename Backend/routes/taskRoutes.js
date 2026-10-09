import express from "express";
import taskController from "../controllers/task.js";
import { uploadTaskAttachments } from "../middleware/taskUpload.js";

const router = express.Router();

router.get("/", taskController.getAllTasks);
router.get("/:id", taskController.getTaskById);
router.post("/", uploadTaskAttachments, taskController.createTask);
router.put("/:id", uploadTaskAttachments, taskController.updateTask);
router.delete("/:id", taskController.deleteTask);

export default router;
