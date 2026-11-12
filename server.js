
require("dotenv").config();

const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const session = require("express-session");
const bcrypt = require("bcryptjs");
const path = require("path");

const app = express();

if (!process.env.SESSION_SECRET ||
    !process.env.ADMIN_PASSWORD_HASH ||
    !process.env.ADMIN_USERNAME) {
  throw new Error("Missing admin configuration in .env");
}

app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  }
}));

const db = new sqlite3.Database(
  path.join(__dirname, "internships.db"),
  (err) => {
    if (err) console.error(err.message);
    else console.log("Database connected successfully!");
  }
);

db.run(`
  CREATE TABLE IF NOT EXISTS internships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT NOT NULL,
    stipend TEXT,
    description TEXT,
    applyLink TEXT NOT NULL
  )
`);

function requireAdmin(req, res, next) {
  if (req.session.isAdmin) return next();
  res.status(401).json({ error: "Admin login required" });
}

// Check admin login
app.get("/api/admin/status", (req, res) => {
  res.json({ loggedIn: req.session.isAdmin === true });
});

// Admin login
app.post("/api/admin/login", async (req, res) => {
  const { username, password } = req.body || {};

  const validPassword = await bcrypt.compare(
    typeof password === "string" ? password : "",
    process.env.ADMIN_PASSWORD_HASH
  );

  if (username !== process.env.ADMIN_USERNAME ||
      !validPassword) {
    return res.status(401).json({
      error: "Invalid username or password"
    });
  }

  req.session.regenerate((err) => {
    if (err) return res.sendStatus(500);
    req.session.isAdmin = true;
    res.json({ message: "Login successful" });
  });
});

// Logout
app.post("/api/admin/logout", requireAdmin, (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.sendStatus(500);
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out" });
  });
});

// Fetch internships
app.get("/api/internships", (req, res) => {
  db.all(
    "SELECT * FROM internships ORDER BY id DESC",
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

// Add internship (admin only)
app.post("/api/internships", requireAdmin, (req, res) => {
  const {
    title, company, location,
    stipend, description, applyLink
  } = req.body || {};

  if (![title, company, location, applyLink].every(
    v => typeof v === "string" && v.trim()
  )) {
    return res.status(400).json({
      error: "Please complete all required fields"
    });
  }

  try {
    const url = new URL(applyLink);
    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error("Invalid protocol");
    }
  } catch {
    return res.status(400).json({
      error: "Enter a valid application URL"
    });
  }

  db.run(
    `INSERT INTO internships
     (title, company, location, stipend, description, applyLink)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      title.trim(),
      company.trim(),
      location.trim(),
      typeof stipend === "string" ? stipend.trim() : "",
      typeof description === "string" ? description.trim() : "",
      applyLink.trim()
    ],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.status(201).json({
        message: "Internship added successfully",
        id: this.lastID
      });
    }
  );
});

// Delete internship (admin only)
app.delete("/api/internships/:id", requireAdmin, (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid ID" });
  }

  db.run(
    "DELETE FROM internships WHERE id = ?",
    [id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });

      res.json({ deleted: this.changes });
    }
  );
});

// Serve admin page
app.get("/admin.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

// Serve existing website
app.use(express.static(path.join(__dirname, "public")));

app.listen(3000, () => {
  console.log("InternAccess running at http://localhost:3000");
});
