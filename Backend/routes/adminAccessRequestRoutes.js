import express from "express";

import adminAccessRequestController
    from "../controllers/adminAccessRequestController.js";

const router = express.Router();


// =====================================================
// GET DEPARTMENTS
// =====================================================

router.get(
    "/departments",
    adminAccessRequestController.getDepartments
);


// =====================================================
// GET ALL REQUESTS
// =====================================================

router.get(
    "/",
    adminAccessRequestController.getAllRequests
);


// =====================================================
// GET REQUEST BY ID
// =====================================================

router.get(
    "/:id",
    adminAccessRequestController.getRequestById
);


// =====================================================
// CREATE REQUEST
// =====================================================

router.post(
    "/",
    adminAccessRequestController.createRequest
);


// =====================================================
// UPDATE REQUEST
// =====================================================

router.put(
    "/:id",
    adminAccessRequestController.updateRequest
);


// =====================================================
// DELETE REQUEST
// =====================================================

router.delete(
    "/:id",
    adminAccessRequestController.deleteRequest
);


export default router;