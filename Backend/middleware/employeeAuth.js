import jwt from "jsonwebtoken";
import connection from "../db.js";

const employeeAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication token required.",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.employeeId || decoded.role !== "employee") {
      return res.status(401).json({
        success: false,
        message: "Invalid employee token.",
      });
    }

    const [employees] = await connection.promise().query(
      `SELECT emp_id, emp_name, email, status
       FROM employe
       WHERE emp_id = ?
       LIMIT 1`,
      [decoded.employeeId]
    );

    if (!employees.length || employees[0].status !== "active") {
      return res.status(401).json({
        success: false,
        message: "Employee not found or inactive.",
      });
    }

    req.employee = employees[0];
    next();
  } catch (error) {
    console.error("EMPLOYEE AUTH ERROR:", error.message);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};

export default employeeAuth;