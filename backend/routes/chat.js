const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Message = require('../models/Message');
const User = require('../models/User');

// @route   GET api/chat/:userId
// @desc    Get message history between current user and another user
// @access  Private
router.get('/:userId', auth, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const otherUserId = req.params.userId;

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: otherUserId },
        { sender: otherUserId, receiver: currentUserId }
      ]
    }).sort({ createdAt: 1 });

    // Mark messages from other user as read
    await Message.updateMany(
      { sender: otherUserId, receiver: currentUserId, read: false },
      { $set: { read: true } }
    );

    res.json(messages);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/chat
// @desc    Send a direct message
// @access  Private
router.post('/', auth, async (req, res) => {
  const { receiverId, text } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ msg: 'Message text is required' });
  }

  try {
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ msg: 'Recipient user not found' });
    }

    const newMessage = new Message({
      sender: req.user.id,
      receiver: receiverId,
      text: text.trim()
    });

    const message = await newMessage.save();

    // Broadcast message via Socket.io if the server has io configured
    const io = req.app.get('io');
    if (io) {
      // Emit to receiver
      io.to(receiverId).emit('receive_message', message);
      // Emit to sender's other sockets (in case they have multiple tabs open)
      io.to(req.user.id).emit('sent_message_confirm', message);
    }

    res.json(message);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/chat/inbox/unread
// @desc    Get list of conversations with unread message counts
// @access  Private
router.get('/inbox/summary', auth, async (req, res) => {
  try {
    const currentUserId = req.user.id;

    // Fetch all messages involving the current user
    const messages = await Message.find({
      $or: [{ sender: currentUserId }, { receiver: currentUserId }]
    }).sort({ createdAt: -1 });

    const conversations = {};

    for (const msg of messages) {
      const otherUser = msg.sender.toString() === currentUserId ? msg.receiver : msg.sender;
      const otherUserIdStr = otherUser.toString();

      if (!conversations[otherUserIdStr]) {
        conversations[otherUserIdStr] = {
          lastMessage: msg.text,
          time: msg.createdAt,
          unread: !msg.read && msg.receiver.toString() === currentUserId
        };
      } else if (!msg.read && msg.receiver.toString() === currentUserId) {
        conversations[otherUserIdStr].unread = true;
      }
    }

    // Populate user details for each key
    const result = [];
    for (const userId of Object.keys(conversations)) {
      const user = await User.findById(userId).select('username avatar');
      if (user) {
        result.push({
          user,
          ...conversations[userId]
        });
      }
    }

    res.json(result);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
