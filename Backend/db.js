import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config();

const connection = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  connectTimeout: 10000,
});

connection.getConnection((error, conn) => {
  if (error) {
    console.error("MySQL connection failed:", {
      code: error.code,
      message: error.message,
    });
    return;
  }

  console.log("MySQL connection successful");
  conn.release();
});

export default connection;