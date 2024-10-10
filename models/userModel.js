const sql = require("mssql");

// MSSQL Connection String
const dbConnectionString =
  "workstation id=lifestyle.mssql.somee.com;packet size=4096;user id=adiitzkovich_SQLLogin_1;pwd=lnc8u82ax8;data source=lifestyle.mssql.somee.com;persist security info=False;initial catalog=lifestyle;TrustServerCertificate=True";

// פונקציה שמתחברת למסד הנתונים
const connectToDatabase = async () => {
  await sql.connect(dbConnectionString);
};

// פונקציה לקבלת משתמש על פי שם וסיסמה
exports.getUserByCredentials = async (username, password) => {
  await connectToDatabase();
  const request = new sql.Request();
  request.input("username", sql.VarChar, username);
  request.input("password", sql.VarChar, password);

  const result = await request.query(
    "SELECT * FROM Users WHERE Name = @username AND Password = @password"
  );

  return result.recordset;
};

// פונקציה לבדוק אם משתמש קיים
exports.checkUserExists = async (name) => {
  await connectToDatabase();
  const checkRequest = new sql.Request();
  checkRequest.input("name", sql.VarChar, name);

  const checkResult = await checkRequest.query(
    "SELECT * FROM Users WHERE Name = @name"
  );

  return checkResult.recordset.length > 0;
};

// פונקציה להוספת משתמש חדש
exports.createUser = async (userId, name, password) => {
  await connectToDatabase();
  const request = new sql.Request();
  request.input("userId", sql.VarChar, userId);
  request.input("name", sql.VarChar, name);
  request.input("password", sql.VarChar, password);

  await request.query(
    "INSERT INTO Users (UserId, Name, Password) VALUES (@userId, @name, @password)"
  );
};

// פונקציה לקבלת משתמש על פי ID
exports.getUserById = async (userId) => {
  await connectToDatabase();
  const request = new sql.Request();
  request.input("userId", sql.VarChar, userId);

  const result = await request.query(
    "SELECT * FROM Users WHERE UserId = @userId"
  );

  return result.recordset.length > 0 ? result.recordset[0] : null;
};
