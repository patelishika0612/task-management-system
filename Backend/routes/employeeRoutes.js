import express from "express";
import employeeController from "../controllers/employe.js";

const router = express.Router();

router.get("/", employeeController.getAllEmployees);
router.get("/:id", employeeController.getEmployeeById);
router.post("/", employeeController.createEmployee);
router.put("/:id", employeeController.updateEmployee);
router.delete("/:id", employeeController.deleteEmployee);

export default router;