import "dotenv/config";
import express from "express";
import multer from "multer";
import cors from "cors";
import { execFile } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configurable QPDF path — defaults to "qpdf" (assumes it's in PATH)
const QPDF_PATH = process.env.QPDF_PATH || "qpdf";

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

const cleanupStaleUploads = (maxAgeMs = 6 * 60 * 60 * 1000) => {
  const now = Date.now();
  try {
    const entries = fs.readdirSync(uploadsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const fullPath = path.join(uploadsDir, entry.name);
      const stats = fs.statSync(fullPath);
      if (now - stats.mtimeMs > maxAgeMs) {
        fs.unlinkSync(fullPath);
      }
    }
  } catch (error) {
    console.error("Startup cleanup error:", error.message);
  }
};

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

cleanupStaleUploads();

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

  // Safe argument array — no shell, no injection
  const args = [
    "--encrypt",
    password,
    password,
    "256",
    "--",
    inputPath,
    outputPath,
  ];

  console.log("⚙️ Running: qpdf", args.join(" "));

  execFile(QPDF_PATH, args, (err, stdout, stderr) => {
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

  // Safe argument array — no shell, no injection
  const args = password
    ? ["--decrypt", `--password=${password}`, inputPath, outputPath]
    : ["--decrypt", inputPath, outputPath];

  console.log("⚙️ Running: qpdf", args.join(" "));

  execFile(QPDF_PATH, args, (err, stdout, stderr) => {
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

// 🌐 Generic Proxy (Handles CORS-restricted APIs)
app.get("/proxy", async (req, res) => {
  const target = req.query.url;
  if (!target) return res.status(400).json({ error: "No URL provided" });

  try {
    const response = await fetch(target);
    const contentType = response.headers.get("content-type");
    const data = await response.text();
    
    if (contentType) res.setHeader("Content-Type", contentType);
    res.send(data);
  } catch (e) {
    console.error("Proxy error:", e.message);
    res.status(500).json({ error: "Failed to proxy request" });
  }
});

app.post("/proxy", upload.any(), async (req, res) => {
  const target = req.query.url;
  if (!target) return res.status(400).json({ error: "No URL provided" });

  try {
    // If it's a file upload, we need to reconstruct the form data
    const formData = new FormData();
    
    // Add fields
    for (const key in req.body) {
      formData.append(key, req.body[key]);
    }
    
    // Add files
    if (req.files) {
      for (const file of req.files) {
        const buffer = fs.readFileSync(file.path);
        const blob = new Blob([buffer], { type: file.mimetype });
        formData.append(file.fieldname, blob, file.originalname);
        cleanup(file.path); // Cleanup temp file
      }
    }

    const response = await fetch(target, {
      method: "POST",
      body: formData
    });
    
    const data = await response.text();
    res.send(data);
  } catch (e) {
    console.error("Proxy POST error:", e.message);
    res.status(500).json({ error: "Failed to proxy POST request" });
  }
});

// Health check
app.get("/health", (req, res) => {
  execFile(QPDF_PATH, ["--version"], (err, stdout) => {
    if (err) return res.status(500).json({ status: "qpdf not found" });
    res.json({ status: "ok", qpdf: stdout.trim() });
  });
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log("");
  console.log("✅ Vanity PDF Server running on http://localhost:" + PORT);
  console.log("   POST /protect  — Add AES-256 password");
  console.log("   POST /unlock   — Remove password");
  console.log("   GET  /health   — Check qpdf status");
  console.log("   QPDF Path:     " + QPDF_PATH);
  console.log("");
});

const shutdown = () => {
  try {
    cleanupStaleUploads(0);
  } finally {
    server.close(() => process.exit(0));
  }
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
