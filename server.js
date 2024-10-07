const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

const session = require("express-session");

// הגדרת סשן
app.use(
  session({
    secret: "your_secret_key", // שנה את המפתח הזה למשהו ייחודי
    resave: false,
    saveUninitialized: true,
  })
);

// Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

// Set EJS as template engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Routes
const userRoutes = require("./routes/userRoutes");
const mealRoutes = require("./routes/mealRoutes");
app.use("/users", userRoutes);
app.use("/meals", mealRoutes);

// Error handling
app.use((req, res) => {
  res.status(404).render("error", { message: "Page not found" });
});

// Middleware for handling errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render("error", { message: "Internal Server Error" }); // הצגת דף שגיאה מותאם אישית
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}/users/login`);
});
