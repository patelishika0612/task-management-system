import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Backend/uploads/tasks
export const taskUploadDir = path.join(__dirname, "..", "uploads", "tasks");

if (!fs.existsSync(taskUploadDir)) {
    fs.mkdirSync(taskUploadDir, { recursive: true });
}

export const MAX_TASK_FILES = 10;

// PDF, DOC, XLS, JPG, PNG, ZIP
const ALLOWED_EXTENSIONS = [
    ".pdf",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".jpg",
    ".jpeg",
    ".png",
    ".zip"
];

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, taskUploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const uniqueName = `task-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        cb(null, uniqueName);
    }
});

const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    if (ALLOWED_EXTENSIONS.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error("Only PDF, DOC, XLS, JPG, PNG and ZIP files are allowed"), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: MAX_TASK_FILES
    }
});

// Wrap multer so upload errors return a clean 400 JSON response
export const uploadTaskAttachments = (req, res, next) => {
    upload.array("attachments", MAX_TASK_FILES)(req, res, (err) => {
        if (!err) return next();

        let message = err.message || "File upload failed";

        if (err.code === "LIMIT_FILE_SIZE") {
            message = "Each file must be 10 MB or smaller";
        } else if (err.code === "LIMIT_FILE_COUNT" || err.code === "LIMIT_UNEXPECTED_FILE") {
            message = `You can upload up to ${MAX_TASK_FILES} files`;
        }

        return res.status(400).json({
            success: false,
            message
        });
    });
};

export const removeTaskFile = (fileName) => {
    if (!fileName) return;

    // basename guards against path traversal
    const filePath = path.join(taskUploadDir, path.basename(fileName));

    fs.unlink(filePath, () => {});
};
