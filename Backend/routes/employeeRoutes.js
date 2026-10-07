import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

import employeeController from "../controllers/employeeController.js";

const router = express.Router();

// =====================================================
// UPLOAD FOLDER
// =====================================================

const uploadDir = "uploads";

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}


// =====================================================
// MULTER STORAGE
// =====================================================

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },

    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname);

        const fileName =
            `employee-${Date.now()}-${Math.round(Math.random() * 1E9)}${extension}`;

        cb(null, fileName);
    }
});


// =====================================================
// FILE FILTER
// =====================================================

const fileFilter = (req, file, cb) => {

    if (file.mimetype.startsWith("image/")) {
        cb(null, true);
    } else {
        cb(new Error("Only image files are allowed"), false);
    }
};


// =====================================================
// MULTER
// =====================================================

const upload = multer({
    storage,
    fileFilter,

    limits: {
        fileSize: 5 * 1024 * 1024
    }
});


// =====================================================
// GET ALL EMPLOYEES
// =====================================================

router.get(
    "/",
    employeeController.getAllEmployees
);


// =====================================================
// GET EMPLOYEE BY ID
// =====================================================
router.get(
    "/profile",
    employeeController.getEmployeeProfile
);

router.get(
    "/:id",
    employeeController.getEmployeeById
);


// =====================================================
// CREATE EMPLOYEE
// =====================================================

router.post(
    "/",
    upload.single("image"),
    employeeController.createEmployee
);

router.put(
    "/create-profile/:empId",
     upload.single("image"),
    employeeController.createEmployeeProfile
);


// =====================================================
// UPDATE EMPLOYEE
// =====================================================

router.put(
    "/:id",
    upload.single("image"),
    employeeController.updateEmployee
);


// =====================================================
// DELETE EMPLOYEE
// =====================================================

router.delete(
    "/:id",
    employeeController.deleteEmployee
);


export default router;