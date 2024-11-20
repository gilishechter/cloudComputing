const sql = require("mssql");
const DecisionTree = require("decision-tree");
const config = require("../config/dbConfig");

//get the data from db
async function getData(userId, event) {
  try {
    await sql.connect(config);
    const result = await sql.query`
      SELECT foodSugar AS sugarContent, bloodSugar 
      FROM meals 
      WHERE UserId = ${userId} AND event = ${event}`;

    //convert to array
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

//blood prediction function
async function predictBloodSugar(newSugarContent, userId, event) {
  const data = await getData(userId, event);

  if (data.length === 0) {
    console.error("No data retrieved from the database.");
    return null;
  }

  const features = ["sugarContent"];
  const className = "bloodSugar";

  //create the decision tree
  const dt = new DecisionTree(data, className, features);

  //the prediction for new food sugar
  const predictedBloodSugar = dt.predict(newSugarContent);

  console.log(
    `Predicted blood sugar for sugar content ${newSugarContent.sugarContent}: ${predictedBloodSugar}`
  );

  return predictedBloodSugar;
}

module.exports = { predictBloodSugar };
