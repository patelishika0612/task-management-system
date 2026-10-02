import express from "express";
 
import projectMemberController from "../controllers/projectMember.js";
 
const router = express.Router();
 
router.get("/", projectMemberController.getAllProjectMembers);
router.get("/:id", projectMemberController.getProjectMemberById);
router.post("/", projectMemberController.createProjectMember);
router.put("/:id", projectMemberController.updateProjectMember);
router.delete("/:id", projectMemberController.deleteProjectMember);
 
export default router;