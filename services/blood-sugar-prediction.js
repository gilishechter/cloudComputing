const sql = require("mssql");
const DecisionTree = require("decision-tree");

// הגדרת פרטי החיבור למסד הנתונים
const config = {
  user: "adiitzkovich_SQLLogin_1",
  password: "lnc8u82ax8",
  server: "lifestyle.mssql.somee.com",
  database: "lifestyle",
  options: {
    trustServerCertificate: true,
  },
};

// פונקציה לחלץ נתונים מהמסד נתונים
async function getData(userId, event) {
  try {
    await sql.connect(config);

    // חיבור למסד הנתונים ושאילתת נתונים רק עבור ה-userId הנתון
    const result = await sql.query`
      SELECT foodSugar AS sugarContent, bloodSugar 
      FROM meals 
      WHERE UserId = ${userId} AND event = ${event}`;

    // המרת התוצאות למערך
    const data = result.recordset.map((row) => ({
      sugarContent: row.sugarContent,
      bloodSugar: row.bloodSugar,
    }));

    return data;
  } catch (err) {
    console.error("Error retrieving data:", err);
  } finally {
    await sql.close();
  }
}

// פונקציה לחזוי סוכר בדם
async function predictBloodSugar(newSugarContent, userId, event) {
  const data = await getData(userId, event);

  if (data.length === 0) {
    console.error("No data retrieved from the database.");
    return null;
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

  return predictedBloodSugar;
}

async function sendQuestion() {
  const question = document.getElementById("user-question").value;
  const responseDiv = document.getElementById("response");

  if (question) {
    const response = await fetch("/ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question: question }),
    });
    const data = await response.json();
    responseDiv.innerText = data.answer;
  } else {
    responseDiv.innerText = "אנא הקלד שאלה.";
  }
}

module.exports = { predictBloodSugar, sendQuestion };
