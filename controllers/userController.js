const sql = require("mssql");

// MSSQL Connection String
const dbConnectionString =
  "workstation id=lifestyle.mssql.somee.com;packet size=4096;user id=adiitzkovich_SQLLogin_1;pwd=lnc8u82ax8;data source=lifestyle.mssql.somee.com;persist security info=False;initial catalog=lifestyle;TrustServerCertificate=True";
// Route to render the login form
exports.getLoginPage = (req, res) => {
  const errorMessage = req.session.errorMessage || null;
  req.session.errorMessage = null;
  res.render("login", { errorMessage });
};

// Route to handle login form submission
exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    // Connect to the database
    await sql.connect(dbConnectionString);

    // Create a new request and input the parameters
    const request = new sql.Request();
    request.input("username", sql.VarChar, username);
    request.input("password", sql.VarChar, password);

    // Execute the query with parameters
    const result = await request.query(
      `SELECT * FROM Users WHERE Name = @username AND Password = @password`
    );

    // Check if a user was found
    if (result.recordset.length > 0) {
      // User found, set session and redirect
      req.session.userId = result.recordset[0].ID; // Adjust 'ID' to match your column name
      res.redirect("/users/dashboard");
    } else {
      // No user found, render login page with error message
      req.session.errorMessage = "Invalid username or password";
      res.redirect("/users/login");
    }
  } catch (err) {
    console.error("SQL error", err);
    res.status(500).send("Error querying the database");
  }
};

// Logout function
exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect("/users/login");
  });
};

// Dashboard function
exports.getDashboard = async (req, res) => {
  if (req.session.userId) {
    try {
      // Connect to the database
      await sql.connect(dbConnectionString); // Replace 'dbConnectionString' with your actual DB connection string

      // Create a prepared statement to avoid SQL injection and properly declare the parameter
      const request = new sql.Request();

      // Add the userId as a parameter
      request.input("userId", sql.Int, req.session.userId);

      // Execute the query with the parameter passed correctly
      const result = await request.query(
        `SELECT * FROM Users WHERE id = @userId`
      );

      if (result.recordset.length > 0) {
        const user = result.recordset[0]; // Assuming 'user' includes fields like 'username'

        const notifications = []; // You can add logic to retrieve notifications if necessary

        // Render the dashboard view and pass the user and notifications
        res.render("dashboard", { user, notifications });
      } else {
        res.redirect("/users/login"); // Redirect if no user found
      }
    } catch (err) {
      console.error("SQL error", err);
      res.status(500).send("Error querying the database");
    }
  } else {
    res.redirect("/users/login"); // Redirect if user is not logged in
  }
};
