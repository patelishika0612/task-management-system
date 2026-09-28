import db from "../db.js";
import {
    body,
    param,
    validationResult
} from "express-validator";

// =====================================================
// VALIDATION
// =====================================================

// Department ID validation
const departmentIdValidation = [
    param("id")
        .isInt({ min: 1 })
        .withMessage("Department ID must be a valid positive number")
];

// Department name validation
const departmentNameValidation = [
    body("department_name")
        .trim()
        .notEmpty()
        .withMessage("Department name is required")

        .isLength({ min: 2, max: 100 })
        .withMessage(
            "Department name must be between 2 and 100 characters"
        )

        .matches(/^[a-zA-Z0-9 &()._-]+$/)
        .withMessage(
            "Department name contains invalid characters"
        )
];


// =====================================================
// CREATE DEPARTMENT
// POST /api/departments
// =====================================================

const createDepartment = [
    ...departmentNameValidation,

    async (req, res) => {

        try {

            // Check validation errors
            const errors = validationResult(req);

            if (!errors.isEmpty()) {

                return res.status(400).json({
                    success: false,
                    message: "Validation failed",
                    errors: errors.array().map(error => ({
                        field: error.path,
                        message: error.msg
                    }))
                });

            }

            const departmentName =
                req.body.department_name.trim();


            // =================================================
            // CHECK DUPLICATE DEPARTMENT
            // =================================================

            const checkSql = `
                SELECT department_id
                FROM departments
                WHERE LOWER(department_name) = LOWER(?)
                LIMIT 1
            `;

            db.query(
                checkSql,
                [departmentName],
                (checkError, results) => {

                    if (checkError) {

                        console.error(
                            "Department duplicate check error:",
                            checkError
                        );

                        return res.status(500).json({
                            success: false,
                            message: "Unable to create department"
                        });
                    }


                    // Department already exists
                    if (results.length > 0) {

                        return res.status(409).json({
                            success: false,
                            message: "Department already exists"
                        });
                    }


                    // =================================================
                    // INSERT DEPARTMENT
                    // =================================================

                    const insertSql = `
                        INSERT INTO departments
                        (department_name)
                        VALUES (?)
                    `;

                    db.query(
                        insertSql,
                        [departmentName],
                        (insertError, result) => {

                            if (insertError) {

                                console.error(
                                    "Create department error:",
                                    insertError
                                );


                                // Duplicate protection
                                if (
                                    insertError.code ===
                                    "ER_DUP_ENTRY"
                                ) {

                                    return res.status(409).json({
                                        success: false,
                                        message:
                                            "Department already exists"
                                    });
                                }


                                return res.status(500).json({
                                    success: false,
                                    message:
                                        "Unable to create department"
                                });
                            }


                            // Success
                            return res.status(201).json({

                                success: true,

                                message:
                                    "Department created successfully",

                                data: {

                                    department_id:
                                        result.insertId,

                                    department_name:
                                        departmentName
                                }
                            });
                        }
                    );
                }
            );

        } catch (error) {

            console.error(
                "Create department unexpected error:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    }
];


// =====================================================
// GET ALL DEPARTMENTS
// GET /api/departments
// =====================================================

const getAllDepartments = async (req, res) => {

    try {

        const sql = `
            SELECT
                department_id,
                department_name
            FROM departments
            ORDER BY department_id DESC
        `;


        db.query(
            sql,
            (error, results) => {

                if (error) {

                    console.error(
                        "Get departments error:",
                        error
                    );

                    return res.status(500).json({
                        success: false,
                        message:
                            "Unable to fetch departments"
                    });
                }


                return res.status(200).json({

                    success: true,

                    count: results.length,

                    data: results
                });
            }
        );

    } catch (error) {

        console.error(
            "Get departments unexpected error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


// =====================================================
// GET DEPARTMENT BY ID
// GET /api/departments/:id
// =====================================================

const getDepartmentById = [

    ...departmentIdValidation,

    async (req, res) => {

        try {

            // Check validation
            const errors = validationResult(req);

            if (!errors.isEmpty()) {

                return res.status(400).json({

                    success: false,

                    message: "Validation failed",

                    errors: errors.array().map(error => ({
                        field: error.path,
                        message: error.msg
                    }))
                });
            }


            const departmentId =
                Number(req.params.id);


            const sql = `
                SELECT
                    department_id,
                    department_name
                FROM departments
                WHERE department_id = ?
                LIMIT 1
            `;


            db.query(
                sql,
                [departmentId],
                (error, results) => {

                    if (error) {

                        console.error(
                            "Get department error:",
                            error
                        );

                        return res.status(500).json({
                            success: false,
                            message:
                                "Unable to fetch department"
                        });
                    }


                    // Department not found
                    if (results.length === 0) {

                        return res.status(404).json({
                            success: false,
                            message:
                                "Department not found"
                        });
                    }


                    return res.status(200).json({

                        success: true,

                        data: results[0]
                    });
                }
            );

        } catch (error) {

            console.error(
                "Get department unexpected error:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    }
];


// =====================================================
// UPDATE DEPARTMENT
// PUT /api/departments/:id
// =====================================================

const updateDepartment = [

    ...departmentIdValidation,

    ...departmentNameValidation,

    async (req, res) => {

        try {

            // =================================================
            // VALIDATION
            // =================================================

            const errors = validationResult(req);

            if (!errors.isEmpty()) {

                return res.status(400).json({

                    success: false,

                    message: "Validation failed",

                    errors: errors.array().map(error => ({
                        field: error.path,
                        message: error.msg
                    }))
                });
            }


            const departmentId =
                Number(req.params.id);

            const departmentName =
                req.body.department_name.trim();


            // =================================================
            // CHECK DEPARTMENT EXISTS
            // =================================================

            const checkIdSql = `
                SELECT department_id
                FROM departments
                WHERE department_id = ?
                LIMIT 1
            `;


            db.query(
                checkIdSql,
                [departmentId],
                (idError, idResults) => {

                    if (idError) {

                        console.error(
                            "Check department error:",
                            idError
                        );

                        return res.status(500).json({
                            success: false,
                            message:
                                "Unable to update department"
                        });
                    }


                    // Department not found
                    if (idResults.length === 0) {

                        return res.status(404).json({
                            success: false,
                            message:
                                "Department not found"
                        });
                    }


                    // =================================================
                    // CHECK DUPLICATE NAME
                    // =================================================

                    const duplicateSql = `
                        SELECT department_id
                        FROM departments
                        WHERE LOWER(department_name) = LOWER(?)
                        AND department_id != ?
                        LIMIT 1
                    `;


                    db.query(
                        duplicateSql,
                        [
                            departmentName,
                            departmentId
                        ],
                        (duplicateError, duplicateResults) => {

                            if (duplicateError) {

                                console.error(
                                    "Duplicate department check error:",
                                    duplicateError
                                );

                                return res.status(500).json({
                                    success: false,
                                    message:
                                        "Unable to update department"
                                });
                            }


                            // Duplicate name
                            if (
                                duplicateResults.length > 0
                            ) {

                                return res.status(409).json({
                                    success: false,
                                    message:
                                        "Another department with this name already exists"
                                });
                            }


                            // =================================================
                            // UPDATE
                            // =================================================

                            const updateSql = `
                                UPDATE departments
                                SET department_name = ?
                                WHERE department_id = ?
                            `;


                            db.query(
                                updateSql,
                                [
                                    departmentName,
                                    departmentId
                                ],
                                (updateError, result) => {

                                    if (updateError) {

                                        console.error(
                                            "Update department error:",
                                            updateError
                                        );

                                        return res.status(500).json({
                                            success: false,
                                            message:
                                                "Unable to update department"
                                        });
                                    }


                                    return res.status(200).json({

                                        success: true,

                                        message:
                                            "Department updated successfully",

                                        data: {

                                            department_id:
                                                departmentId,

                                            department_name:
                                                departmentName
                                        }
                                    });
                                }
                            );
                        }
                    );
                }
            );

        } catch (error) {

            console.error(
                "Update department unexpected error:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    }
];


// =====================================================
// DELETE DEPARTMENT
// DELETE /api/departments/:id
// =====================================================

const deleteDepartment = [

    ...departmentIdValidation,

    async (req, res) => {

        try {

            // =================================================
            // VALIDATION
            // =================================================

            const errors = validationResult(req);

            if (!errors.isEmpty()) {

                return res.status(400).json({

                    success: false,

                    message: "Validation failed",

                    errors: errors.array().map(error => ({
                        field: error.path,
                        message: error.msg
                    }))
                });
            }


            const departmentId =
                Number(req.params.id);


            // =================================================
            // CHECK DEPARTMENT EXISTS
            // =================================================

            const checkSql = `
                SELECT department_id
                FROM departments
                WHERE department_id = ?
                LIMIT 1
            `;


            db.query(
                checkSql,
                [departmentId],
                (checkError, checkResults) => {

                    if (checkError) {

                        console.error(
                            "Check delete department error:",
                            checkError
                        );

                        return res.status(500).json({
                            success: false,
                            message:
                                "Unable to delete department"
                        });
                    }


                    // Department not found
                    if (checkResults.length === 0) {

                        return res.status(404).json({
                            success: false,
                            message:
                                "Department not found"
                        });
                    }


                    // =================================================
                    // DELETE
                    // =================================================

                    const deleteSql = `
                        DELETE FROM departments
                        WHERE department_id = ?
                    `;


                    db.query(
                        deleteSql,
                        [departmentId],
                        (deleteError, result) => {

                            if (deleteError) {

                                console.error(
                                    "Delete department error:",
                                    deleteError
                                );


                                // Department is being used
                                // by another table
                                if (
                                    deleteError.code ===
                                        "ER_ROW_IS_REFERENCED_2" ||
                                    deleteError.code ===
                                        "ER_ROW_IS_REFERENCED"
                                ) {

                                    return res.status(409).json({

                                        success: false,

                                        message:
                                            "Department cannot be deleted because it is being used by other records"
                                    });
                                }


                                return res.status(500).json({

                                    success: false,

                                    message:
                                        "Unable to delete department"
                                });
                            }


                            return res.status(200).json({

                                success: true,

                                message:
                                    "Department deleted successfully"
                            });
                        }
                    );
                }
            );

        } catch (error) {

            console.error(
                "Delete department unexpected error:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    }
];


// =====================================================
// EXPORT
// =====================================================

export default {
    createDepartment,
    getAllDepartments,
    getDepartmentById,
    updateDepartment,
    deleteDepartment
};