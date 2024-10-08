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
      req.session.userId = result.recordset[0].UserId; // Adjust 'UserId' to match your column name
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

// Route to render the sign up form
exports.getSignupPage = (req, res) => {
  const errorMessage = req.session.errorMessage || null;
  req.session.errorMessage = null;
  res.render("signup", { errorMessage });
};

// Route to handle sign up form submission
exports.signup = async (req, res) => {
  const { name, password, id } = req.body;

  try {
    // Connect to the database
    await sql.connect(dbConnectionString);

    // Check if the user already exists
    const checkRequest = new sql.Request();
    checkRequest.input("name", sql.VarChar, name);
    const checkResult = await checkRequest.query(
      `SELECT * FROM Users WHERE Name = @name`
    );

    if (checkResult.recordset.length > 0) {
      // User already exists
      req.session.errorMessage = "User already exists";
      return res.redirect("/users/signup");
    }

    // Insert the new user into the database
    const request = new sql.Request();
    request.input("name", sql.VarChar, name);
    request.input("password", sql.VarChar, password);
    request.input("userId", sql.VarChar, id); // Assuming id is a string; change to sql.Int if needed

    await request.query(
      `INSERT INTO Users (UserId, Name, Password) VALUES (@userId, @name, @password)`
    );

    // After successful sign up, redirect to the dashboard
    req.session.userId = id; // Store the user's ID in the session
    res.redirect("/users/dashboard");
  } catch (err) {
    console.error("SQL error", err);
    res.status(500).send("Error registering the user");
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
      await sql.connect(dbConnectionString);

      // Create a new request
      const request = new sql.Request();
      request.input("userId", sql.Int, req.session.userId);

      // Execute the query to get user data
      const result = await request.query(
        `SELECT * FROM Users WHERE UserId = @userId`
      );

      if (result.recordset.length > 0) {
        const user = result.recordset[0]; // User data

        const notifications = []; // Example: Add logic to fetch notifications if needed

        // Render the dashboard view with user data
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
