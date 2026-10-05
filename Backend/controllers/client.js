import connection from "../db.js";

const db = connection.promise();

// =====================================================
// GET ALL CLIENTS
// =====================================================

const getAllClients = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                c.Client_ID,
                c.Client_Name,
                c.Company_Name,
                c.Email,
                c.Phone,
                c.Alternate_Phone,
                c.Address,
                c.City,
                c.State,
                c.Country,
                c.Pincode,
                c.Industry,
                c.Client_Type,
                c.Website,
                c.Assigned_Employee_ID,
                e.emp_name AS Assigned_Employee_Name,
                c.Status,
                c.Notes,
                c.Created_Date,
                c.Updated_Date
            FROM clients c
            LEFT JOIN employe e
                ON c.Assigned_Employee_ID = e.emp_id
            ORDER BY c.Client_ID DESC
        `);

        res.status(200).json({
            success: true,
            count: rows.length,
            data: rows
        });

    } catch (error) {
        console.error("Get clients error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch clients"
        });
    }
};


// =====================================================
// GET CLIENT BY ID
// =====================================================

const getClientById = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(`
            SELECT
                c.Client_ID,
                c.Client_Name,
                c.Company_Name,
                c.Email,
                c.Phone,
                c.Alternate_Phone,
                c.Address,
                c.City,
                c.State,
                c.Country,
                c.Pincode,
                c.Industry,
                c.Client_Type,
                c.Website,
                c.Assigned_Employee_ID,
                e.emp_name AS Assigned_Employee_Name,
                c.Status,
                c.Notes,
                c.Created_Date,
                c.Updated_Date
            FROM clients c
            LEFT JOIN employe e
                ON c.Assigned_Employee_ID = e.emp_id
            WHERE c.Client_ID = ?
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Client not found"
            });
        }

        res.status(200).json({
            success: true,
            data: rows[0]
        });

    } catch (error) {
        console.error("Get client error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch client"
        });
    }
};


// =====================================================
// CREATE CLIENT
// =====================================================

const createClient = async (req, res) => {
    try {
        const {
            Client_Name,
            Company_Name,
            Email,
            Phone,
            Alternate_Phone,
            Address,
            City,
            State,
            Country,
            Pincode,
            Industry,
            Client_Type,
            Website,
            Assigned_Employee_ID,
            Status,
            Notes
        } = req.body;

        // Required fields
        if (!Client_Name || !Company_Name) {
            return res.status(400).json({
                success: false,
                message: "Client_Name and Company_Name are required"
            });
        }

        // Check assigned employee
        if (Assigned_Employee_ID) {
            const [employee] = await db.query(
                "SELECT emp_id FROM employe WHERE emp_id = ?",
                [Assigned_Employee_ID]
            );

            if (employee.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Assigned employee not found"
                });
            }
        }

        const [result] = await db.query(`
            INSERT INTO clients
            (
                Client_Name,
                Company_Name,
                Email,
                Phone,
                Alternate_Phone,
                Address,
                City,
                State,
                Country,
                Pincode,
                Industry,
                Client_Type,
                Website,
                Assigned_Employee_ID,
                Status,
                Notes
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            Client_Name,
            Company_Name,
            Email || null,
            Phone || null,
            Alternate_Phone || null,
            Address || null,
            City || null,
            State || null,
            Country || "India",
            Pincode || null,
            Industry || null,
            Client_Type || null,
            Website || null,
            Assigned_Employee_ID || null,
            Status || "Active",
            Notes || null
        ]);

        res.status(201).json({
            success: true,
            message: "Client created successfully",
            Client_ID: result.insertId
        });

    } catch (error) {
        console.error("Create client error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create client"
        });
    }
};


// =====================================================
// UPDATE CLIENT
// =====================================================

const updateClient = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            Client_Name,
            Company_Name,
            Email,
            Phone,
            Alternate_Phone,
            Address,
            City,
            State,
            Country,
            Pincode,
            Industry,
            Client_Type,
            Website,
            Assigned_Employee_ID,
            Status,
            Notes
        } = req.body;

        if (!Client_Name || !Company_Name) {
            return res.status(400).json({
                success: false,
                message: "Client_Name and Company_Name are required"
            });
        }

        // Check assigned employee
        if (Assigned_Employee_ID) {
            const [employee] = await db.query(
                "SELECT emp_id FROM employe WHERE emp_id = ?",
                [Assigned_Employee_ID]
            );

            if (employee.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Assigned employee not found"
                });
            }
        }

        const [result] = await db.query(`
            UPDATE clients
            SET
                Client_Name = ?,
                Company_Name = ?,
                Email = ?,
                Phone = ?,
                Alternate_Phone = ?,
                Address = ?,
                City = ?,
                State = ?,
                Country = ?,
                Pincode = ?,
                Industry = ?,
                Client_Type = ?,
                Website = ?,
                Assigned_Employee_ID = ?,
                Status = ?,
                Notes = ?
            WHERE Client_ID = ?
        `, [
            Client_Name,
            Company_Name,
            Email || null,
            Phone || null,
            Alternate_Phone || null,
            Address || null,
            City || null,
            State || null,
            Country || "India",
            Pincode || null,
            Industry || null,
            Client_Type || null,
            Website || null,
            Assigned_Employee_ID || null,
            Status || "Active",
            Notes || null,
            id
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Client not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Client updated successfully"
        });

    } catch (error) {
        console.error("Update client error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update client"
        });
    }
};


// =====================================================
// DELETE CLIENT
// =====================================================

const deleteClient = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.query(
            "DELETE FROM clients WHERE Client_ID = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Client not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Client deleted successfully"
        });

    } catch (error) {
        console.error("Delete client error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete client"
        });
    }
};


export default {
    getAllClients,
    getClientById,
    createClient,
    updateClient,
    deleteClient
};