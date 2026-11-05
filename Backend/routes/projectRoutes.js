import express from "express";
import projectController from "../controllers/project.js";

const router = express.Router();

router.get("/", projectController.getAllProjects);
router.get("/:id", projectController.getProjectById);
router.post("/", projectController.createProject);
router.put("/:id", projectController.updateProject);
router.patch("/:id/status", projectController.updateProjectStatus);
router.delete("/:id", projectController.deleteProject);

export default router;