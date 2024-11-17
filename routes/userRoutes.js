const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

// Route for getting login page
router.get("/login", userController.getLoginPage);

router.get("/about", userController.getAboutPages);

// Route for handling login
router.post("/login", userController.login);

// Route for logout
router.get("/logout", userController.logout);

// Route for dashboard
router.get("/dashboard", userController.getDashboard);

// router.get("/about", userController.getAboutPage);

// Sign Up Routes
router.get("/signup", userController.getSignupPage);
router.post("/signup", userController.signup);

module.exports = router;
