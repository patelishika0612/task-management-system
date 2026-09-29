import express from "express";
import departmentController from "../controllers/departments.js";

const router = express.Router();

// CREATE
router.post(
    "/",
    departmentController.createDepartment
);

// GET ALL
router.get(
    "/",
    departmentController.getAllDepartments
);

// GET BY ID
router.get(
    "/:id",
    departmentController.getDepartmentById
);

// UPDATE
router.put(
    "/:id",
    departmentController.updateDepartment
);

// // DELETE
// router.delete(
//     "/:id",
//     departmentController.deleteDepartment
// );

export default router;