import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database("study.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS study_sets (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    source_type TEXT NOT NULL,
    source_content TEXT,
    notes TEXT,
    flashcards TEXT,
    quiz TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API Routes
  app.get("/api/study-sets", (req, res) => {
    const rows = db.prepare("SELECT * FROM study_sets ORDER BY created_at DESC").all();
    res.json(rows);
  });

  app.get("/api/study-sets/:id", (req, res) => {
    const row = db.prepare("SELECT * FROM study_sets WHERE id = ?").get(req.params.id);
    if (row) {
      res.json(row);
    } else {
      res.status(404).json({ error: "Not found" });
    }
  });

  app.post("/api/study-sets", (req, res) => {
    const { id, title, source_type, source_content, notes, flashcards, quiz } = req.body;
    const stmt = db.prepare(`
      INSERT INTO study_sets (id, title, source_type, source_content, notes, flashcards, quiz)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, title, source_type, source_content, notes, JSON.stringify(flashcards), JSON.stringify(quiz));
    res.json({ success: true });
  });

  app.delete("/api/study-sets/:id", (req, res) => {
    db.prepare("DELETE FROM study_sets WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
