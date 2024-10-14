const express = require("express");
const path = require("path");
const sql = require("mssql");
const session = require("express-session");

const app = express();
const PORT = process.env.PORT || 3000;

// MSSQL Connection String
const dbConnectionString =
  "workstation id=lifestyle.mssql.somee.com;packet size=4096;user id=adiitzkovich_SQLLogin_1;pwd=lnc8u82ax8;data source=lifestyle.mssql.somee.com;persist security info=False;initial catalog=lifestyle;TrustServerCertificate=True";

// Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Enable JSON parsing for requests

// Session Configuration
app.use(
  session({
    secret: "your_secret_key", // Change this to something unique
    resave: false,
    saveUninitialized: true,
  })
);

// Set EJS as template engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Routes
const userRoutes = require("./routes/userRoutes");
const mealRoutes = require("./routes/mealRoutes");
app.use("/users", userRoutes);
app.use("/meals", mealRoutes);

// Question and Answer Store
const qa_pairs = {
  "מהם המזונות המומלצים לסוכרתיים?":
    "מומלץ לאכול ירקות, פירות, דגנים מלאים וחלבונים רזים.",
  "איך אני יכול לעקוב אחרי רמות הסוכר שלי?":
    "תוכל להשתמש במכשירים כמו גלוקומטר או אפליקציות לניהול סוכרת.",
};

// API Endpoint for the Q&A bot
app.post("/ask", (req, res) => {
  const userQuestion = req.body.question;
  const answer =
    qa_pairs[userQuestion] || "סליחה, אני לא יודע את התשובה לשאלה הזו.";
  res.json({ answer });
});

// Error Handling Middleware
app.use((req, res) => {
  res.status(404).render("error", { message: "Page not found" });
});

// Error Handling for Internal Server Errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render("error", { message: "Internal Server Error" });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}/users/login`);
});
