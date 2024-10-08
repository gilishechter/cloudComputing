const sql = require("mssql");
const multer = require("multer");
const path = require("path");

// MSSQL Connection String
const dbConnectionString =
  "workstation id=lifestyle.mssql.somee.com;packet size=4096;user id=adiitzkovich_SQLLogin_1;pwd=lnc8u82ax8;data source=lifestyle.mssql.somee.com;persist security info=False;initial catalog=lifestyle;TrustServerCertificate=True"; // Replace with your connection string

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

// Route for rendering the update meal page
exports.getMealUpdatePage = (req, res) => {
  if (req.session.userId) {
    res.render("meal_update"); // Show update meal page
  } else {
    res.redirect("/login");
  }
};

// הוספת ארוחה חדשה
exports.addMeal = async (req, res) => {
  const {
    meal_date,
    mealType,
    image,
    description,
    bloodSugar,
    foodSugar,
    event,
    UserId,
    // מקבל את כתובת התמונה מהשדה החדש
  } = req.body;

  console.log(image);
  const isFood = await isFoodImage(image); // שליחת ה-buffer של התמונה לבדיקה
  console.log(isFood);
  if (!isFood) {
    return res.status(400).send("The uploaded image is not food.");
  }

  console.log("Request received at /meals/add");
  console.log("Received meal data:", req.body);

  // Print each parameter individually to check their values
  console.log("meal_date:", meal_date);
  console.log("mealType:", mealType);
  console.log("image:", image);
  console.log("description:", description);
  console.log("bloodSugar:", bloodSugar);
  console.log("foodSugar:", foodSugar);
  console.log("event:", event);
  console.log("UserId:", UserId);

  try {
    await sql.connect(dbConnectionString);
    console.log("Connected to database");

    const insertQuery = `
      INSERT INTO meals (meal_date, mealType, image, description, bloodSugar, foodSugar, event, UserId)
      VALUES (@meal_date, @mealType, @image, @description, @bloodSugar, @foodSugar, @event, @UserId)
    `;

    const insertRequest = new sql.Request();
    insertRequest.input("meal_date", sql.Date, meal_date);
    insertRequest.input("mealType", sql.VarChar, mealType);
    insertRequest.input("image", sql.VarChar, image); // כאן התמונה היא URL
    insertRequest.input("description", sql.VarChar, description);
    insertRequest.input("bloodSugar", sql.Float, bloodSugar);
    insertRequest.input("foodSugar", sql.Float, foodSugar);
    insertRequest.input("event", sql.VarChar, event);
    insertRequest.input("UserId", sql.VarChar, UserId);

    await insertRequest.query(insertQuery);
    console.log("Meal added successfully");

    res.redirect("/meals/history");
  } catch (err) {
    console.error("Database insert error:", err);
    res.status(500).send("Error adding meal: " + err.message);
  } finally {
    await sql.close();
    console.log("Database connection closed");
  }
};

// Display meal history page
exports.getMealHistoryPage = async (req, res) => {
  if (req.session.userId) {
    try {
      await sql.connect(dbConnectionString);
      console.log("Connected to database");

      const query = `SELECT * FROM meals WHERE UserId = @UserId`;
      const mealRequest = new sql.Request();
      mealRequest.input("UserId", sql.Int, req.session.userId);
      const result = await mealRequest.query(query);

      const meals = result.recordset;
      res.render("meal_history", { meals });
    } catch (err) {
      console.error("Database fetch error:", err);
      res.status(500).send("Error fetching meal history: " + err.message);
    } finally {
      await sql.close();
      console.log("Database connection closed");
    }
  } else {
    res.redirect("/login");
  }
};

// Get notification page
exports.getNotificationPage = (req, res) => {
  if (req.session.userId) {
    const notificationMessage =
      "Your recent test results show an elevated sugar level.";
    res.render("notification", { notificationMessage });
  } else {
    res.redirect("/login");
  }
};

const axios = require("axios");
const got = require("got");

// פונקציה לבדיקת האם התמונה היא של מאכל
async function isFoodImage(imageFile) {
  const apiKey = "acc_71eedcb15d2dcfb";
  const apiSecret = "3558f7524068505d30a5cace9f414f32";

  // ה-URL של התמונה
  const imageUrl = imageFile;
  //const imageUrl = encodeURIComponent(imageFile);

  // נקודת הקצה של Imagga ליצירת תגים
  //const endpoint = "https://api.imagga.com";

  const url =
    "https://api.imagga.com/v2/tags?image_url=" + encodeURIComponent(imageUrl);

  const getTags = async (imageUrl) => {
    console.log(imageUrl + "aaaaaa");
    try {
      const response = await got(url, {
        username: apiKey,
        password: apiSecret,
      });
      console.log(response.body + "yes");
      return JSON.parse(response.body);
    } catch (error) {
      console.log(error.response.body + "no");
    }
  };

  try {
    const tags = await getTags(imageUrl); // השתמש ב-await כאן
    console.log("Tags returned:", tags); // הדפס את התגים שהתקבלו

    const foodTags = [
      "food",
      "meal",
      "dish",
      "fruit",
      "vegetable",
      "dessert",
      "snack",
      "breakfast",
      "lunch",
      "dinner",
      "pasta",
      "hamburger",
    ];

    if (tags && tags.result && Array.isArray(tags.result.tags)) {
      // Iterate over each tag
      for (let tag of tags.result.tags) {
        console.log(tag);
        if (tag.confidence >= 70) {
          console.log(tag.tag.en);
          if (
            foodTags.some((foodTag) =>
              tag.tag.en.toLowerCase().includes(foodTag)
            )
          ) {
            return true; // The image is of food
          }
        }
      }
    } else {
      console.error("Tags structure is invalid:", tags);
      return false; // Handle invalid structure
    }

    return false; // The image is not of food
  } catch (error) {
    console.error("Failed to get tags:", error);
    return false; // In case of an error, return false
  }
}

exports.isFoodImage = isFoodImage;
