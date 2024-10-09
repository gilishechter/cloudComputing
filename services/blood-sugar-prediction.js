const sql = require("mssql");
const DecisionTree = require("decision-tree");

// הגדרת פרטי החיבור למסד הנתונים
const config = {
  user: "adiitzkovich_SQLLogin_1",
  password: "lnc8u82ax8",
  server: "lifestyle.mssql.somee.com",
  database: "lifestyle",
  options: {
    trustServerCertificate: true, // מתקן בעיות עם תעודות SSL
  },
};

// פונקציה לחלץ נתונים מהמסד נתונים
async function getData() {
  try {
    // התחברות למסד הנתונים
    await sql.connect(config);

    // חיבור למסד הנתונים ושאילתת נתונים
    const result =
      await sql.query`SELECT foodSugar AS sugarContent, bloodSugar FROM meals`;

    // המרת התוצאות למערך
    const data = result.recordset.map((row) => ({
      sugarContent: row.sugarContent,
      bloodSugar: row.bloodSugar,
    }));

    return data;
  } catch (err) {
    console.error("Error retrieving data:", err);
  } finally {
    await sql.close(); // סגירת החיבור למסד הנתונים
  }
}

// פונקציה לחזוי סוכר בדם
async function predictBloodSugar(newSugarContent) {
  const data = await getData(); // קבלת הנתונים מהמסד נתונים

  if (data.length === 0) {
    console.error("No data retrieved from the database.");
    return null; // במקרה ואין נתונים, החזר null
  }

  // הגדרת תכונות ותוויות
  const features = ["sugarContent"]; // תכונה לחיזוי
  const className = "bloodSugar"; // תווית לחיזוי

  // יצירת עץ החלטה
  const dt = new DecisionTree(data, className, features);

  // חיזוי רמת הסוכר בדם עבור כמות סוכר חדשה
  const predictedBloodSugar = dt.predict(newSugarContent);

  console.log(
    `Predicted blood sugar for sugar content ${newSugarContent.sugarContent}: ${predictedBloodSugar}`
  );

  return predictedBloodSugar; // החזר את ערך החיזוי
}

module.exports = { predictBloodSugar };
