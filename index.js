const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const app = express();
const morgan = require("morgan");
const ejsmate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError");
const campgroundRoutes = require("./routes/campground");
const Campground = require("./models/campground");
const catchAsync = require("./utils/catchasync");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const flash = require("connect-flash");
const { getQuote } = require("./middlewares/RandomQuoteAPI");
const bcrypt = require("bcrypt");
const passport = require("passport"); 
const LocalStrategy = require("passport-local");
const User = require("./models/user");
const userRoutes = require("./routes/users");




async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/campground");
}
main()
  .then(() => console.log("Connected"))
  .catch((err) => console.log(err));








app.engine("ejs", ejsmate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));
app.use(express.static(path.join(__dirname, "public")));
const sessionConfig = {
  secret: "thisshouldbeabettersecret!",
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7,
    httpOnly: true,
   },
};
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser("Thisismysecret"));
app.use(session(sessionConfig));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use(flash());


// app.use(morgan("dev"));

app.use((req, res, next) => {
  res.locals.originalurl=req.originalUrl;
  res.locals.currentUser = req.user;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  // console.log("locals" + res.locals.originalurl);
  next();
});
app.use("/campgrounds", campgroundRoutes);
app.use("", userRoutes);

// app.get("/fakeUser", async (req, res) => {
//   const user1 = new User({ email: "newrocker2468@gmail.com", username: "newrocker1" });
//   const newuser = await User.register(user1, "F");
//   res.send(newuser);
// })







app.get(
  "/",
  catchAsync(async (req, res) => {
    const campgrounds = await Campground.find({});
    const r = await getQuote();
    console.log(r);

    res.render("campgrounds/index", { campgrounds, r });
  })
);

// const hashpassword = async (pw) => {
//   const salt = await bcrypt.genSalt(12);
//   const hash = await bcrypt.hash(pw, salt);
//   console.log(salt);
//   console.log(hash);
// };

// hashpassword("monkey");

// const login = async (pw, hpw) => {
//   const result = await bcrypt.compare(pw, hpw);
//   if (result) {
//     console.log("Logged in");
//   } else {
//     console.log("Try again");
//   }
// };
// login("monkey", "$2b$12$oiP70d20XKzRR9.2hjg4ROnQP5Xzn9IGgghXeeK3L/XZH/OHWghW.");

app.use((err, req, res, next) => {
  if (err.name === "ValidationError") {
    err.status = 400;
    res.send("Enter a valid Number");
  }
  next(err);
});

app.all("*", (req, res, next) => {
  next(new ExpressError("Page not found", 404));
});

app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  if (!err.statusCode) err.statusCode = 500;
  if (!err.message) err.message = "Oh No, Something went wrong";
  res.status(statusCode).render("error", { err });
});
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
