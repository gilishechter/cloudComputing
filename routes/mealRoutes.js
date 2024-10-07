const express = require("express");
const router = express.Router();
const mealController = require("../controllers/mealController");

router.get("/update", mealController.getMealUpdatePage);
router.post("/update", mealController.updateMeal);

router.get("/history", mealController.getMealHistoryPage);

module.exports = router;
