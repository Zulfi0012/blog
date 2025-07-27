import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "./models/User.js";
import Post from "./models/Post.js";
import Video from "./models/Video.js";

const router = express.Router();
const JWT_SECRET = "your_jwt_secret"; // You should replace this with process.env.JWT_SECRET

// Auth Middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// AUTH ROUTES
router.post("/api/register", async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const user = new User({ username, email, password });
    await user.save();
    res.status(201).json({ message: "User created" });
  } catch (err) {
    res.status(400).json({ error: "Registration failed", details: err.message });
  }
});

router.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ token, user: { id: user._id, username: user.username, role: user.role } });
});

// POSTS
router.get("/api/posts", async (req, res) => {
  const posts = await Post.find().populate("author", "username");
  res.json(posts);
});

router.post("/api/posts", authMiddleware, async (req, res) => {
  const post = new Post({ ...req.body, author: req.user.id });
  await post.save();
  res.status(201).json(post);
});

router.put("/api/posts/:id", authMiddleware, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (post.author.toString() !== req.user.id) return res.status(403).json({ error: "Forbidden" });
  Object.assign(post, req.body);
  await post.save();
  res.json(post);
});

router.delete("/api/posts/:id", authMiddleware, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (post.author.toString() !== req.user.id) return res.status(403).json({ error: "Forbidden" });
  await post.remove();
  res.json({ message: "Deleted" });
});

// VIDEOS
router.get("/api/videos", async (req, res) => {
  const videos = await Video.find().populate("author", "username");
  res.json(videos);
});

router.post("/api/videos", authMiddleware, async (req, res) => {
  const video = new Video({ ...req.body, author: req.user.id });
  await video.save();
  res.status(201).json(video);
});

router.put("/api/videos/:id", authMiddleware, async (req, res) => {
  const video = await Video.findById(req.params.id);
  if (video.author.toString() !== req.user.id) return res.status(403).json({ error: "Forbidden" });
  Object.assign(video, req.body);
  await video.save();
  res.json(video);
});

router.delete("/api/videos/:id", authMiddleware, async (req, res) => {
  const video = await Video.findById(req.params.id);
  if (video.author.toString() !== req.user.id) return res.status(403).json({ error: "Forbidden" });
  await video.remove();
  res.json({ message: "Deleted" });
});

export const registerRoutes = (app) => {
  app.use(router);
};
