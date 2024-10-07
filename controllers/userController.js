const users = [{ username: "admin", password: "password", id: 1 }];

exports.getLoginPage = (req, res) => {
  const errorMessage = req.session.errorMessage || null;
  req.session.errorMessage = null;
  res.render("login", { errorMessage });
};

exports.login = (req, res) => {
  const { username, password } = req.body;

  const user = users.find(
    (u) => u.username === username && u.password === password
  );

  if (user) {
    req.session.userId = user.id;
    res.redirect("/users/dashboard"); // נוודא שהנתיב נכון
  } else {
    req.session.errorMessage = "Invalid credentials";
    res.redirect("/users/login");
  }
};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect("/users/login");
  });
};

exports.getDashboard = (req, res) => {
  if (req.session.userId) {
    const user = users.find((u) => u.id === req.session.userId);
    const notifications = []; // כאן תוכל להוסיף לוגיקה כדי לקבל הודעות
    res.render("dashboard", { user, notifications }); // העבר את notifications לתצוגה
  } else {
    res.redirect("/users/login");
  }
};
