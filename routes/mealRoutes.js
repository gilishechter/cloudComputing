const express = require("express");
const router = express.Router();
const mealController = require("../controllers/mealController");

router.get("/update", mealController.getMealUpdatePage);
// router.post("/add", mealController.addMeal);

router.get("/history", mealController.getMealHistoryPage);
const multer = require("multer");
const upload = multer();

router.post("/add", mealController.addMeal);
router.use(express.urlencoded({ extended: true })); // זה מעבד את הנתונים מהטופס
router.use(express.json()); // זה מעבד JSON, אם יש צורך

module.exports = router;
