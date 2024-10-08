const express = require("express");
const path = require("path");
const sql = require("mssql");
const session = require("express-session");

const app = express();
const PORT = process.env.PORT || 3001;

// MSSQL Connection String
const dbConnectionString =
  "workstation id=lifestyle.mssql.somee.com;packet size=4096;user id=adiitzkovich_SQLLogin_1;pwd=lnc8u82ax8;data source=lifestyle.mssql.somee.com;persist security info=False;initial catalog=lifestyle;TrustServerCertificate=True";
// Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

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
