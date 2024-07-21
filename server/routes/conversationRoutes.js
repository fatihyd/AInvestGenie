const express = require("express");
const router = express.Router();
const Conversation = require("../models/Conversation");
const User = require("../models/User");
const authenticateToken = require("../middleware/authMiddleware");

// Get all conversations for a user
router.get("/", authenticateToken, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      user: req.user.userId,
    }).populate("messages");
    res.json(conversations);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching conversations", error: error.message });
  }
});

// Get a specific conversation
router.get("/:conversationId", authenticateToken, async (req, res) => {
  const { conversationId } = req.params;
  try {
    const conversation = await Conversation.findOne({
      _id: conversationId,
      user: req.user.userId,
    }).populate("messages");
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }
    res.json(conversation);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching conversation", error: error.message });
  }
});

// Create a new conversation
router.post("/", authenticateToken, async (req, res) => {
  try {
    const newConversation = new Conversation({ user: req.user.userId });
    await newConversation.save();
    res.status(201).json(newConversation);

    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      { $push: { conversations: newConversation._id } },
      { new: true, upsert: false }
    );
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating conversation", error: error.message });
  }
});

module.exports = router;
