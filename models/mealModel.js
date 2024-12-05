const sql = require("mssql");
const axios = require("axios");
const moment = require("moment-timezone");
const got = require("got");
const dbConnectionString = require("../config/dbConfig");

const usdaApiKey = "HNqNjAecPRHVpqTPSiiVmJmw6RP1OEKNigeyGyBc";

//get the foos sugar from USDA
async function getFoodSugarFromUSDA(foodName) {
  const urlA = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${usdaApiKey}&query=${foodName}`;
  console.log("Sending API request to USDA:", urlA);

  try {
    const response = await axios.get(urlA);
    const foods = response.data.foods;

    if (foods.length > 0) {
      const nutrients = foods[0].foodNutrients;

      const sugarNutrient = nutrients.find((nutrient) =>
        nutrient.nutrientName.toLowerCase().includes("sugar")
      );

      if (sugarNutrient) {
        if (sugarNutrient.value > 0) {
          return sugarNutrient.value; // Return sugar content
        } else {
          console.log("Sugar content is 0 for this food item.");
          return 0;
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

//check if the date is saterday or other holidays
async function checkSpecialEvent(meal_date) {
  try {
    const formattedDate = meal_date.split("T")[0];
    const response = await fetch(
      `https://www.hebcal.com/hebcal?cfg=json&start=${formattedDate}&end=${formattedDate}&gv=1`
    );

    if (!response.ok) {
      console.log("notOk");
      throw new Error("Network response was not ok");
    }

    const data = await response.json();
    const events = data.items;

    for (let event of events) {
      if (event.date === formattedDate) {
        console.log(`Found special event: ${event.title}`);
        return {
          isSpecial: "yes",
          eventName: event.title,
        };
      }
    }

    const dateObject = new Date(formattedDate);
    const dayOfWeek = dateObject.getDay();

    if (dayOfWeek === 6) {
      console.log("The date falls on Shabbat");
      return {
        isSpecial: "yes",
        eventName: "Shabbat",
      };
    }

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

//add meal to the db
async function addMealToDatabase(mealData) {
  try {
    await sql.connect(dbConnectionString);

    const insertQuery = `INSERT INTO meals (meal_date, mealType, image, description, bloodSugar, foodSugar, event, UserId) 
      VALUES (@meal_date, @mealType, @image, @description, @bloodSugar, @foodSugar, @event, @UserId)`;

    const insertRequest = new sql.Request();
    insertRequest.input("meal_date", sql.VarChar, mealData.localMealDate);
    insertRequest.input("mealType", sql.VarChar, mealData.mealType);
    insertRequest.input("image", sql.VarChar, mealData.image);
    insertRequest.input("description", sql.VarChar, mealData.description);
    insertRequest.input("bloodSugar", sql.Float, mealData.finalBloodSugar);
    insertRequest.input("foodSugar", sql.Float, mealData.foodSugar);
    insertRequest.input("event", sql.VarChar, mealData.specialEvent.isSpecial);
    insertRequest.input("UserId", sql.VarChar, mealData.UserId);

    await insertRequest.query(insertQuery);
    console.log("Meal added successfully");
  } catch (err) {
    console.error("Database insert error:", err);
    throw new Error("Error adding meal: " + err.message);
  } finally {
    await sql.close();
  }
}

async function getMealHistory(userId, queryParams) {
  try {
    await sql.connect(dbConnectionString);
    console.log("Connected to database");

    let query = `SELECT meal_date, description, image, bloodSugar, foodSugar, event, mealType 
      FROM meals WHERE UserId = @UserId`;

    const mealRequest = new sql.Request();
    mealRequest.input("UserId", sql.VarChar, userId);

    if (queryParams.fromDate) {
      query += ` AND meal_date >= @FromDate`;
      mealRequest.input("FromDate", sql.Date, queryParams.fromDate);
    }
    if (queryParams.toDate) {
      query += ` AND meal_date <= @ToDate`;
      mealRequest.input("ToDate", sql.Date, queryParams.toDate);
    }
    if (queryParams.mealType && queryParams.mealType !== "all") {
      query += ` AND mealType = @MealType`;
      mealRequest.input("MealType", sql.VarChar, queryParams.mealType);
    }

    const result = await mealRequest.query(query);
    return result.recordset;
  } catch (err) {
    console.error("Database fetch error:", err);
    throw new Error("Error fetching meal history: " + err.message);
  } finally {
    await sql.close();
    console.log("Database connection closed");
  }
}

async function isFoodImage(imageFile) {
  const apiKey = "acc_71eedcb15d2dcfb";
  const apiSecret = "3558f7524068505d30a5cace9f414f32";

  // ה-URL של התמונה
  const imageUrl = imageFile;
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
    const tags = await getTags(imageUrl);
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
      "pizza",
      "salad",
      "soup",
      "cake",
      "cookie",
      "bread",
      "rice",
      "sushi",
      "steak",
      "fish",
      "meat",
      "chicken",
      "burger",
      "sandwich",
      "cheese",
      "egg",
      "pancake",
      "waffle",
      "ice cream",
      "chocolate",
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

module.exports = {
  getFoodSugarFromUSDA,
  checkSpecialEvent,
  addMealToDatabase,
  getMealHistory,
  isFoodImage,
};
