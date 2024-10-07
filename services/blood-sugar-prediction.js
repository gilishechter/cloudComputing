const data = [
  { sugarContent: 5, bloodSugar: 80 },
  { sugarContent: 10, bloodSugar: 85 },
  { sugarContent: 15, bloodSugar: 90 },
  { sugarContent: 20, bloodSugar: 95 },
  { sugarContent: 25, bloodSugar: 100 },
  // הוסף עוד רשומות לפי הצורך
];

const DecisionTree = require("decision-tree");

// הגדרת תכונות ותוויות
const features = ["sugarContent"]; // תכונה לחיזוי
const className = "bloodSugar"; // תווית לחיזוי

// יצירת עץ החלטה
const dt = new DecisionTree(data, className, features);

// חיזוי רמת הסוכר בדם עבור כמות סוכר חדשה
const newSugarContent = { sugarContent: 30 }; // זה אובייקט חדש
const predictedBloodSugar = dt.predict(newSugarContent);

console.log(
  `Predicted blood sugar for sugar content ${newSugarContent.sugarContent}: ${predictedBloodSugar}`
);
