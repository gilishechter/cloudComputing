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
