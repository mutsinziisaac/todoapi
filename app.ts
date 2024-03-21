import express, { Request, Response, NextFunction } from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import mongoose, { Schema, Document } from "mongoose";
import bcryptjs from "bcryptjs";

const mongoDb =
  "mongodb+srv://admin:dudu@cluster0.3wz8lmy.mongodb.net/users?retryWrites=true&w=majority&appName=Cluster0";
mongoose.connect(mongoDb);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "mongo connection error"));

const User = mongoose.model(
  "User",
  new Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
  })
);

const Todo = mongoose.model(
  "Todo",
  new Schema({
    todo: { type: String, required: true },
  })
);

const app = express();
app.set("views", __dirname);
app.set("view engine", "ejs");

app.use(session({ secret: "cats", resave: false, saveUninitialized: true }));
app.use(passport.session());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));

app.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const allTodos = await Todo.find().exec();
    res.render("index", {
      user: req.user,
      allTodos: allTodos,
    });
  } catch (error) {
    console.error("Error fetching todos:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(3000, () => console.log("app listening on port 3000!"));

app.get("/sign-up", (req, res) => res.render("sign-up-form"));

app.post("/sign-up", async (req, res, next) => {
  try {
    const hashedPassword = await bcryptjs.hash(req.body.password, 10);

    const user = new User({
      username: req.body.username,
      password: hashedPassword,
    });
    const result = await user.save();
    res.redirect("/");
  } catch (err) {
    return next(err);
  }
});

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await User.findOne({ username: username });
      if (!user) {
        return done(null, false, { message: "Incorrect username" });
      }
      const match = await bcryptjs.compare(password, user.password);
      if (!match) {
        // passwords do not match!
        return done(null, false, { message: "Incorrect password" });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

app.post(
  "/log-in",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/",
  })
);
app.post("/api/log-in", (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate("local", (err: any, user: any) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      // Authentication failed
      return res.status(401).json({ message: "Authentication failed" });
    }
    // Authentication succeeded
    req.login(user, (err) => {
      if (err) {
        return next(err);
      }
      // Redirect the user or send a success response
      res.status(200).json({ message: "Authentication successful", user });
    });
  })(req, res, next);
});

app.get("/log-out", (req: Request, res: Response, next: NextFunction) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

app.post("/save", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const todo = new Todo({
      todo: req.body.todo,
    });
    await todo.save();
    res.redirect("/");
  } catch (err) {
    return next(err);
  }
});

app.get("/api/todos", async (req: Request, res: Response) => {
  const allTodos = await Todo.find().exec();
  res.status(200).json(allTodos);
});

app.post("/api/todos", async (req: Request, res: Response) => {
  const todo = new Todo({
    todo: req.body.todo,
  });

  await todo.save();
  res.status(200).json({ message: "todo saved successfully" });
});

app.put("/api/todos/:id", async (req: Request, res: Response) => {
  const id = req.params.id;
  const updated = req.body;
  await Todo.findByIdAndUpdate(id, updated).exec();
  res.status(200).json({ message: "todo updated" });
});

app.delete("/api/todos/:id", async (req: Request, res: Response) => {
  const todo = await Todo.findByIdAndDelete(req.params.id).exec();
  res.status(200).json({ message: "todo deleted" });
});

app.get("/api/todos/:id", async (req: Request, res: Response) => {
  const todo = await Todo.findById(req.params.id).exec();
  res.status(200).json(todo);
});

app.get("/api/users", async (req: Request, res: Response) => {
  const allUsers = await User.find().exec();
  res.status(200).json(allUsers);
});
app.get("/api/users/:id", async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id).exec();
  res.status(200).json(user);
});

app.post(
  "/api/sign-up",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const hashedPassword = await bcryptjs.hash(req.body.password, 10);

      const user = new User({
        username: req.body.username,
        password: hashedPassword,
      });

      const result = await user.save();

      res.json({ message: "user created successfully" });
    } catch (err) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

export default app;
