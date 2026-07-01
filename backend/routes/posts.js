const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const User = require('../models/User');

// @route   GET api/posts
// @desc    Get all posts or reels (optionally filtered by feed type or username)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { type, username, feed } = req.query;
    let query = {};

    if (type) {
      query.type = type; // 'post' or 'reel'
    }

    if (username) {
      const user = await User.findOne({ username });
      if (user) {
        query.author = user._id;
      } else {
        return res.json([]); // Return empty if user does not exist
      }
    } else if (feed === 'following') {
      // Get posts from users the current user follows
      const currentUser = await User.findById(req.user.id);
      query.author = { $in: [...currentUser.following, req.user.id] };
    }

    const posts = await Post.find(query)
      .populate('author', 'username avatar')
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/posts/:id
// @desc    Get post by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('author', 'username avatar');
    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }
    res.json(post);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Post not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST api/posts
// @desc    Create a post or reel
// @access  Private
router.post('/', auth, async (req, res) => {
  const { type, mediaUrl, mediaType, caption } = req.body;

  if (!mediaUrl) {
    return res.status(400).json({ msg: 'Media URL is required' });
  }

  try {
    const newPost = new Post({
      author: req.user.id,
      type: type || 'post',
      mediaUrl,
      mediaType: mediaType || 'image',
      caption: caption || ''
    });

    const post = await newPost.save();
    const populatedPost = await Post.findById(post._id).populate('author', 'username avatar');
    res.json(populatedPost);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/posts/:id
// @desc    Delete a post
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }

    // Check user match
    if (post.author.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized to delete this post' });
    }

    // Delete post comments
    await Comment.deleteMany({ post: req.params.id });

    // Delete post itself
    await post.deleteOne();

    res.json({ msg: 'Post removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Post not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST api/posts/:id/like
// @desc    Like / unlike a post
// @access  Private
router.post('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }

    // Check if post already liked by user
    const likeIndex = post.likes.indexOf(req.user.id);

    if (likeIndex > -1) {
      // Already liked, unlike it
      post.likes.splice(likeIndex, 1);
    } else {
      // Like it
      post.likes.push(req.user.id);
    }

    await post.save();
    res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
