// controllers/mealController.js

// ייבוא מסד נתונים (אם יש)
const meals = []; // מערך מדומה של ארוחות, ניתן להחליף במסד נתונים אמיתי

// דף עדכון ארוחות
exports.getMealUpdatePage = (req, res) => {
  if (req.session.userId) {
    res.render("meal_update"); // הצגת דף עדכון ארוחה
  } else {
    res.redirect("/login");
  }
};

// עדכון ארוחה חדשה
exports.updateMeal = (req, res) => {
  const { date, mealType, description, sugarLevel, holiday } = req.body;

  // הוספת הארוחה למערך או למסד נתונים
  meals.push({ date, mealType, description, sugarLevel, holiday });

  // חזרה למסך עדכון או הצגת הודעת הצלחה
  res.redirect("/meals/history"); // הצגה של היסטוריית ארוחות לאחר עדכון מוצלח
};

// הצגת היסטוריית הארוחות
exports.getMealHistoryPage = (req, res) => {
  if (req.session.userId) {
    res.render("meal_history", { meals }); // הצגת ההיסטוריה עם כל הארוחות
  } else {
    res.redirect("/login");
  }
};

// קבלת הודעה מרופא (התראה דחופה)
exports.getNotificationPage = (req, res) => {
  if (req.session.userId) {
    const notificationMessage =
      "Your recent test results show an elevated sugar level."; // הודעה מדומה מרופא
    res.render("notification", { notificationMessage });
  } else {
    res.redirect("/login");
  }
};
