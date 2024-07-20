const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const authenticateToken = require("../middleware/authMiddleware");

// Send a new message
router.post("/:conversationId", authenticateToken, async (req, res) => {
  console.log("hello");

  const { text, sender } = req.body;
  /*
   * textin yanında sender da ekle ona göre mesaj tipini belirle
   */
  const { conversationId } = req.params;

  try {
    const newMessage = new Message({
      conversation: conversationId,
      sender: sender, // Asssume 'user' for now, could be dynamic
      text,
    });
    const savedMessage = await newMessage.save();
    console.log("Saved message:", savedMessage);

    const updatedConversation = await Conversation.findByIdAndUpdate(
      conversationId,
      { $push: { messages: savedMessage._id } },
      { new: true, upsert: false }
    );
    console.log("Updated conversation:", updatedConversation);

    if (!updatedConversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error sending message:", error);
    res
      .status(500)
      .json({ message: "Error sending message", error: error.message });
  }
});

module.exports = router;
