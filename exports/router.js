import express from 'express';
import User from './User';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = express.Router();
const SECRET_KEY = "deeceexxx";

// Register
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = new User({ username, password });
    await user.save();
    res.status(201).send({ message: "User registered successfully" });
  } catch (error) {
    res.status(400).send({ error: "Registration failed" });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).send({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ id: user._id }, SECRET_KEY);
    res.send({ token });
  } catch (error) {
    res.status(500).send({ error: "Login failed" });
  }
});


