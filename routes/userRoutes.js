const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

// Route for getting login page
router.get("/login", userController.getLoginPage);

// Route for handling login
router.post("/login", userController.login);

// Route for logout
router.get("/logout", userController.logout);

// Route for dashboard
router.get("/dashboard", userController.getDashboard);

// Sign Up Routes
router.get("/signup", userController.getSignupPage);
router.post("/signup", userController.signup);

// נתיבים
router.get("/users/login", userController.getLoginPage);
router.post("/users/login", userController.login);

router.get("/users/signup", userController.getSignupPage);
router.post("/users/signup", userController.signup);

router.get("/users/dashboard", userController.getDashboard);
router.get("/users/logout", userController.logout);

module.exports = router;
