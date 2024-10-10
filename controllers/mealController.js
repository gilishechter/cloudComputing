const multer = require("multer");
const moment = require("moment-timezone");
const mealModel = require("../models/mealModel");
const { predictBloodSugar } = require("../services/blood-sugar-prediction");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Change to your uploads folder
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`); // Unique file name
  },
});

const upload = multer({ storage: storage });

exports.addMeal = async (req, res) => {
  const { meal_date, mealType, image, description, bloodSugar } = req.body;

  if (!req.session.userId) {
    return res.status(401).send("You must be logged in to add a meal.");
  }

  const foodSugar = await mealModel.getFoodSugarFromUSDA(description);
  if (!foodSugar) {
    return res
      .status(400)
      .send("Unable to retrieve sugar information for the food.");
  }

  const UserId = req.session.userId;
  let finalBloodSugar;

  const specialEvent = await mealModel.checkSpecialEvent(meal_date);
  console.log(specialEvent.isSpecial);

  if (!bloodSugar) {
    const newSugarContent = { sugarContent: foodSugar };
    finalBloodSugar = await predictBloodSugar(
      newSugarContent,
      UserId,
      specialEvent.isSpecial
    );
    console.log(newSugarContent);
  } else {
    finalBloodSugar = bloodSugar;
  }

  const localMealDate = moment(meal_date)
    .tz("Asia/Jerusalem")
    .format("YYYY-MM-DDTHH:mm:ss");
  console.log("Local date to be inserted:", localMealDate);

  const isFood = await mealModel.isFoodImage(image);
  console.log(isFood);

  if (!isFood) {
    return res.status(400).send("The uploaded image is not food.");
  }

  const mealData = {
    localMealDate,
    mealType,
    image,
    description,
    finalBloodSugar,
    foodSugar,
    specialEvent,
    UserId,
  };

  try {
    await mealModel.addMealToDatabase(mealData);
    res.json({ success: true, predictedBloodSugar: finalBloodSugar });
  } catch (err) {
    res.status(500).send("Error adding meal: " + err.message);
  }
};

exports.getMealUpdatePage = (req, res) => {
  if (req.session.userId) {
    res.render("meal_update"); // Show update meal page
  } else {
    res.redirect("/login");
  }
};

exports.getMealHistoryPage = async (req, res) => {
  if (req.session.userId) {
    try {
      const meals = await mealModel.getMealHistory(
        req.session.userId,
        req.query
      );
      const dates = meals.map((meal) => meal.meal_date);
      const bloodSugarLevels = meals.map((meal) => meal.bloodSugar);

      res.render("meal_history", {
        meals,
        query: req.query,
        dates,
        bloodSugarLevels,
        formatDate,
      });
    } catch (err) {
      console.error("Error fetching meal history:", err);
      res.status(500).send("Error fetching meal history: " + err.message);
    }
  } else {
    res.redirect("/login");
  }
};

function formatDate(dateString) {
  const options = { year: "numeric", month: "long", day: "numeric" };
  return new Date(dateString).toLocaleDateString("en-US", options);
}
