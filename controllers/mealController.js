const sql = require("mssql");
const multer = require("multer");
const path = require("path");
const axios = require("axios");
const got = require("got");

const usdaApiKey = "HNqNjAecPRHVpqTPSiiVmJmw6RP1OEKNigeyGyBc";

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

async function getFoodSugarFromUSDA(foodName) {
  const urlA = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${usdaApiKey}&query=${foodName}`;
  console.log("Sending API request to USDA:", urlA); // הדפסה לבדיקת ה-URL

  try {
    const response = await axios.get(urlA);
    const foods = response.data.foods;

    if (foods.length > 0) {
      const nutrients = foods[0].foodNutrients; // יש לשים לב שלפעמים יהיו מספר תוצאות לאותו שם אוכל

      const sugarNutrient = nutrients.find((nutrient) =>
        nutrient.nutrientName.toLowerCase().includes("sugar")
      );

      if (sugarNutrient) {
        if (sugarNutrient.value > 0) {
          return sugarNutrient.value; // כמות הסוכר
        } else {
          console.log("Sugar content is 0 for this food item."); // טיפולי במקרה סוכר אפס
          return 0; // או ערך אחר שנראה לך מתאים
        }
      } else {
        console.log("No sugar data found for this food item.");
        return null;
      }
    } else {
      console.log("No food items found.");
      return null;
    }
  } catch (error) {
    console.error("Error fetching data from USDA API:", error);
    return null;
  }
}

const upload = multer({ storage: storage });

// הוספת ארוחה חדשה
const { predictBloodSugar } = require("../services/blood-sugar-prediction");

const moment = require("moment-timezone");

exports.addMeal = async (req, res) => {
  const { meal_date, mealType, image, description, bloodSugar } = req.body;

  const specialEvent = await checkSpecialEvent(meal_date);
  console.log(specialEvent.isSpecial);
  console.log(image);

  const isFood = await isFoodImage(image);
  console.log(isFood);

  if (!isFood) {
    return res.status(400).send("The uploaded image is not food.");
  }

  if (!req.session.userId) {
    return res.status(401).send("You must be logged in to add a meal.");
  }

  const foodSugar = await getFoodSugarFromUSDA(description);
  if (!foodSugar) {
    return res
      .status(400)
      .send("Unable to retrieve sugar information for the food.");
  }

  const UserId = req.session.userId;
  let finalBloodSugar;

  if (!bloodSugar) {
    newSugarContent = { sugarContent: foodSugar };
    finalBloodSugar = await predictBloodSugar(
      newSugarContent,
      UserId,
      specialEvent.isSpecial
    );
    console.log(newSugarContent);
  } else finalBloodSugar = bloodSugar;

  try {
    await sql.connect(dbConnectionString);

    // המרת התאריך לאזור זמן ירושלים
    const localMealDate = moment(meal_date)
      .tz("Asia/Jerusalem")
      .format("YYYY-MM-DDTHH:mm:ss");
    console.log("Local date to be inserted:", localMealDate);

    const insertQuery = `
      INSERT INTO meals (meal_date, mealType, image, description, bloodSugar, foodSugar, event, UserId)
      VALUES (@meal_date, @mealType, @image, @description, @bloodSugar, @foodSugar, @event, @UserId)
    `;

    const insertRequest = new sql.Request();
    insertRequest.input("meal_date", sql.VarChar, localMealDate); // שלח כ-string
    insertRequest.input("mealType", sql.VarChar, mealType);
    insertRequest.input("image", sql.VarChar, image);
    insertRequest.input("description", sql.VarChar, description);
    insertRequest.input("bloodSugar", sql.Float, finalBloodSugar);
    insertRequest.input("foodSugar", sql.Float, foodSugar);
    insertRequest.input("event", sql.VarChar, specialEvent.isSpecial);
    insertRequest.input("UserId", sql.VarChar, UserId);

    await insertRequest.query(insertQuery);
    console.log("Meal added successfully");

    res.json({ success: true, predictedBloodSugar: finalBloodSugar });
  } catch (err) {
    console.error("Database insert error:", err);
    res.status(500).send("Error adding meal: " + err.message);
  } finally {
    await sql.close();
  }
};

// Route for rendering the update meal page
exports.getMealUpdatePage = (req, res) => {
  if (req.session.userId) {
    res.render("meal_update"); // Show update meal page
  } else {
    res.redirect("/login");
  }
};

// פונקציה לבדוק אם התאריך הוא יום מיוחד
async function checkSpecialEvent(meal_date) {
  try {
    // המרת התאריך לפורמט YYYY-MM-DD
    const formattedDate = meal_date.split("T")[0]; // לוקח את החלק של התאריך לפני ה-T
    const response = await fetch(
      `https://www.hebcal.com/hebcal?cfg=json&start=${formattedDate}&end=${formattedDate}&gv=1`
    );

    if (!response.ok) {
      console.log("notOk");
      throw new Error("Network response was not ok");
    }

    const data = await response.json();
    const events = data.items; // assuming `data.items` is the list of events

    // בדיקת האם יש אירוע עם תאריך שתואם ל-meal_date
    for (let event of events) {
      if (event.date === formattedDate) {
        console.log(`Found special event: ${event.title}`);
        return {
          isSpecial: "yes",
          eventName: event.title, // שם האירוע
        };
      }
    }

    const dateObject = new Date(formattedDate);
    const dayOfWeek = dateObject.getDay(); // יום בשבוע (0 = ראשון, 6 = שבת)

    if (dayOfWeek === 6) {
      console.log("The date falls on Shabbat");
      return {
        isSpecial: "yes",
        eventName: "Shabbat", // ציון שבת כאירוע
      };
    }

    // אם לא נמצא אירוע מיוחד
    console.log("No special event found");
    return {
      isSpecial: "no",
      eventName: "",
    };
  } catch (error) {
    console.error("Error checking special event:", error);
    return {
      isSpecial: "no",
      eventName: "",
    };
  }
}
// Display meal history page
// Display meal history page
exports.getMealHistoryPage = async (req, res) => {
  if (req.session.userId) {
    try {
      await sql.connect(dbConnectionString);
      console.log("Connected to database");

      // Retrieve the filter parameters from the request
      const { fromDate, toDate, mealType } = req.query;

      // Build the SQL query with conditions for filtering
      let query = `
        SELECT meal_date, description, image, bloodSugar, foodSugar, event, mealType 
        FROM meals 
        WHERE UserId = @UserId
      `;

      // Add date filtering if provided
      if (fromDate) {
        query += ` AND meal_date >= @FromDate`;
      }
      if (toDate) {
        query += ` AND meal_date <= @ToDate`;
      }

      // Add mealType filtering if provided and not 'all'
      if (mealType && mealType !== "all") {
        query += ` AND mealType = @MealType`;
      }

      const mealRequest = new sql.Request();
      mealRequest.input("UserId", sql.VarChar, req.session.userId);

      // Add date inputs to the query if they are provided
      if (fromDate) {
        mealRequest.input("FromDate", sql.Date, fromDate);
      }
      if (toDate) {
        mealRequest.input("ToDate", sql.Date, toDate);
      }

      // Add mealType input if selected
      if (mealType && mealType !== "all") {
        mealRequest.input("MealType", sql.VarChar, mealType);
      }

      const result = await mealRequest.query(query);
      const meals = result.recordset;
      const dates = meals.map((meal) => meal.meal_date);
      const bloodSugarLevels = meals.map((meal) => meal.bloodSugar);

      // Pass the query params along with the meals data
      res.render("meal_history", {
        meals,
        query: req.query,
        dates,
        bloodSugarLevels,
        formatDate: formatDate,
      });
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
    try {
      const response = await got(url, {
        username: apiKey,
        password: apiSecret,
      });

      return JSON.parse(response.body);
    } catch (error) {}
  };

  try {
    const tags = await getTags(imageUrl); // השתמש ב-await כאן

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

function formatDate(dateString) {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0"); // חודשים מתחילים מ-0
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

exports.isFoodImage = isFoodImage;
