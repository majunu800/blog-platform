const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Story = require('../models/Story');
const User = require('../models/User');

// @route   GET api/stories
// @desc    Get active stories of followed users + own stories
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Stories from current user and anyone they follow
    const allowedUserIds = [...currentUser.following, req.user.id];

    // Find stories created in the last 24 hours (TTL is handled by MongoDB index, but we query explicitly as a safeguard too)
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const stories = await Story.find({
      user: { $in: allowedUserIds },
      createdAt: { $gte: cutoff }
    })
      .populate('user', 'username avatar')
      .sort({ createdAt: -1 });

    // Group stories by user so the UI gets a list of users with their corresponding active stories
    const storiesByUser = {};

    stories.forEach(story => {
      const userId = story.user._id.toString();
      if (!storiesByUser[userId]) {
        storiesByUser[userId] = {
          user: story.user,
          stories: []
        };
      }
      storiesByUser[userId].stories.push({
        id: story._id,
        mediaUrl: story.mediaUrl,
        mediaType: story.mediaType,
        createdAt: story.createdAt
      });
    });

    // Make sure current user's stories are at the front, followed by others
    const list = Object.values(storiesByUser);
    list.sort((a, b) => {
      if (a.user._id.toString() === req.user.id) return -1;
      if (b.user._id.toString() === req.user.id) return 1;
      return 0;
    });

    res.json(list);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/stories
// @desc    Add a story
// @access  Private
router.post('/', auth, async (req, res) => {
  const { mediaUrl, mediaType } = req.body;

  if (!mediaUrl) {
    return res.status(400).json({ msg: 'Media URL is required' });
  }

  try {
    const newStory = new Story({
      user: req.user.id,
      mediaUrl,
      mediaType: mediaType || 'image'
    });

    const story = await newStory.save();
    const populatedStory = await Story.findById(story._id).populate('user', 'username avatar');

    res.json(populatedStory);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
