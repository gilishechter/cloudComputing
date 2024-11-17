const User = require("../models/userModel");
const { consumeTestResult } = require("../kafka/testResultsConsumer");

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
    const users = await User.getUserByCredentials(username, password);

    if (users.length > 0) {
      req.session.userId = users[0].UserId; // Adjust 'UserId' to match your column name
      await consumeTestResult();
      res.redirect("/users/dashboard");
    } else {
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
    const userExists = await User.checkUserExists(name);

    if (userExists) {
      req.session.errorMessage = "User already exists";
      return res.redirect("/users/signup");
    }

    await User.createUser(id, name, password);
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
      const user = await User.getUserById(req.session.userId);

      if (user) {
        const notifications = []; // Add logic to retrieve notifications if necessary
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
