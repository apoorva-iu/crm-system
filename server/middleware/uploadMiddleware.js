const multer = require("multer");
const fs = require("fs");
const path = require("path");

// Resolve to an absolute path at the project root so it doesn't matter which
// directory the process is started from. This must match the folder you serve
// statically in server.js (see server-static-serving.md).
const UPLOAD_DIR = path.join(__dirname, "..", "uploads");

// This is the actual fix for ENOENT: "no such file or directory, open 'uploads/...'"
// Multer will NOT create the destination folder for you — it must already exist.
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        // Unique, collision-safe filename that preserves the original extension
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(file.originalname);
        const safeBase = path
            .basename(file.originalname, ext)
            .replace(/[^a-zA-Z0-9_-]/g, "_")
            .slice(0, 60);
        cb(null, `${safeBase}-${uniqueSuffix}${ext}`);
    },
});

const fileFilter = (req, file, cb) => {
    // Adjust/expand as needed for your use case
    const allowed = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|txt|csv/;
    const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
    if (extOk) {
        cb(null, true);
    } else {
        cb(new Error("Unsupported file type."));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
});

module.exports = upload;