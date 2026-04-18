import express from "express";
import multer from "multer";
import cors from "cors";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Full path to qpdf — adjust if installed elsewhere
const QPDF = '"C:\\Program Files\\qpdf 12.3.2\\bin\\qpdf.exe"';

const app = express();
app.use(cors());

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({ 
  dest: uploadsDir,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Helper: safely delete files
const cleanup = (...files) => {
  files.forEach((f) => {
    try {
      if (f && fs.existsSync(f)) fs.unlinkSync(f);
    } catch (e) {
      console.error("Cleanup error:", e.message);
    }
  });
};

// 🔒 Add Password (AES-256 encryption via qpdf)
app.post("/protect", upload.single("file"), (req, res) => {
  console.log("📥 /protect request received");

  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  // Validate file type
  const isPdf = req.file.mimetype.includes("pdf") || req.file.originalname.toLowerCase().endsWith(".pdf");
  if (!isPdf) {
    cleanup(req.file.path);
    return res.status(400).json({ error: "Only PDF files are allowed" });
  }

  const inputPath = path.resolve(req.file.path);
  const outputPath = inputPath + "-protected.pdf";
  const password = req.body.password;

  console.log("📄 Input:", inputPath);
  console.log("🔐 Password:", password ? "***" : "(empty)");

  if (!password) {
    cleanup(inputPath);
    return res.status(400).json({ error: "Password is required" });
  }

  // Windows-safe quoting with full qpdf path
  const cmd = `${QPDF} --encrypt "${password}" "${password}" 256 -- "${inputPath}" "${outputPath}"`;
  console.log("⚙️ Running:", cmd);

  exec(cmd, (err, stdout, stderr) => {
    if (err) {
      console.error("❌ QPDF ERROR:", stderr || err.message);
      cleanup(inputPath, outputPath);
      return res.status(500).json({ error: stderr || "QPDF encryption failed" });
    }

    console.log("✅ Encryption successful");

    res.download(outputPath, `protected-${req.file.originalname}`, (dlErr) => {
      if (dlErr) console.error("Download error:", dlErr.message);
      cleanup(inputPath, outputPath);
    });
  });
});

// 🔓 Remove Password (decrypt via qpdf)
app.post("/unlock", upload.single("file"), (req, res) => {
  console.log("📥 /unlock request received");

  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  // Validate file type
  const isPdf = req.file.mimetype.includes("pdf") || req.file.originalname.toLowerCase().endsWith(".pdf");
  if (!isPdf) {
    cleanup(req.file.path);
    return res.status(400).json({ error: "Only PDF files are allowed" });
  }

  const inputPath = path.resolve(req.file.path);
  const outputPath = inputPath + "-unlocked.pdf";
  const password = req.body.password;

  console.log("📄 Input:", inputPath);

  // Windows-safe quoting with full qpdf path
  const cmd = password
    ? `${QPDF} --decrypt --password="${password}" "${inputPath}" "${outputPath}"`
    : `${QPDF} --decrypt "${inputPath}" "${outputPath}"`;

  console.log("⚙️ Running:", cmd);

  exec(cmd, (err, stdout, stderr) => {
    if (err) {
      console.error("❌ QPDF ERROR:", stderr || err.message);
      cleanup(inputPath, outputPath);
      return res.status(400).json({ error: "Wrong password or decryption failed" });
    }

    console.log("✅ Decryption successful");

    res.download(outputPath, `unlocked-${req.file.originalname}`, (dlErr) => {
      if (dlErr) console.error("Download error:", dlErr.message);
      cleanup(inputPath, outputPath);
    });
  });
});

// Health check
app.get("/health", (req, res) => {
  exec(`${QPDF} --version`, (err, stdout) => {
    if (err) return res.status(500).json({ status: "qpdf not found" });
    res.json({ status: "ok", qpdf: stdout.trim() });
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log("");
  console.log("✅ Vanity PDF Server running on http://localhost:" + PORT);
  console.log("   POST /protect  — Add AES-256 password");
  console.log("   POST /unlock   — Remove password");
  console.log("   GET  /health   — Check qpdf status");
  console.log("");
});
