const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// ---------------------------------------
// 1. CONNECT TO MONGODB
// ---------------------------------------
mongoose
  .connect(
    "mongodb+srv://admin:naomi655@admin.kxlq3fd.mongodb.net/productify?retryWrites=true&w=majority"
  )
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log("❌ MongoDB error:", err));

// ---------------------------------------
// 2. USER MODEL
// ---------------------------------------
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model("User", userSchema);

// ---------------------------------------
// 3. TASK MODEL (FIXED)
// ---------------------------------------
const taskSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },

  text: {
    type: String,
    required: true,
  },

  description: {
    type: String,
    default: "",
  },

  dueDate: {
    type: String,
    default: "",
  },

  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium",
  },

  status: {
    type: String,
    enum: ["todo", "inprogress", "done"],
    default: "todo",
  },

  completed: {
    type: Boolean,
    default: false,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Task = mongoose.model("Task", taskSchema);

// ---------------------------------------
// 4. SIGNUP
// ---------------------------------------
app.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const exists = await User.findOne({ email });
    if (exists) {
      return res.json({ success: false, message: "Email already exists" });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
    });

    await user.save();

    res.json({ success: true });
  } catch (err) {
    console.log(err);
    res.json({ success: false, message: "Signup failed" });
  }
});

// ---------------------------------------
// 5. LOGIN
// ---------------------------------------
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    const match = bcrypt.compareSync(password, user.password);
    if (!match) {
      return res.json({ success: false, message: "Incorrect password" });
    }

    res.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.log(err);
    res.json({ success: false, message: "Login failed" });
  }
});

// ---------------------------------------
// 6. CREATE TASK (FIXED)
// ---------------------------------------
app.post("/tasks", async (req, res) => {
  try {
    const { userId, text, description, dueDate, priority, status } = req.body;

    const task = new Task({
      userId,
      text,
      description,
      dueDate,
      priority,
      status,
    });

    await task.save();

    res.json(task);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Task creation failed" });
  }
});

// ---------------------------------------
// 7. GET TASKS FOR USER
// ---------------------------------------
app.get("/tasks/:userId", async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.params.userId });
    res.json(tasks);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to fetch tasks" });
  }
});

// ---------------------------------------
// 8. UPDATE TASK
// ---------------------------------------
app.put("/tasks/:taskId", async (req, res) => {
  try {
    const updated = await Task.findByIdAndUpdate(
      req.params.taskId,
      req.body,
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to update task" });
  }
});

// ---------------------------------------
// 9. DELETE TASK
// ---------------------------------------
app.delete("/tasks/:taskId", async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.taskId);
    res.json({ success: true });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to delete task" });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
