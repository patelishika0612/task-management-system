import express from "express";
import employeeController from "../controllers/employe.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.get("/", employeeController.getAllEmployees);
router.get("/:id", employeeController.getEmployeeById);
router.post("/", upload.single("image"), employeeController.createEmployee);
router.put("/:id", upload.single("image"), employeeController.updateEmployee);
router.delete("/:id", employeeController.deleteEmployee);

export default router;