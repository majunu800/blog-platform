const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Comment = require('../models/Comment');
const Post = require('../models/Post');

// @route   GET api/comments/:postId
// @desc    Get comments for a post
// @access  Private
router.get('/:postId', auth, async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .populate('author', 'username avatar')
      .sort({ createdAt: 1 });
    res.json(comments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/comments/:postId
// @desc    Comment on a post
// @access  Private
router.post('/:postId', auth, async (req, res) => {
  if (!req.body.content || !req.body.content.trim()) {
    return res.status(400).json({ msg: 'Comment content cannot be empty' });
  }

  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }

    const newComment = new Comment({
      post: req.params.postId,
      author: req.user.id,
      content: req.body.content.trim()
    });

    const comment = await newComment.save();
    const populatedComment = await Comment.findById(comment._id).populate('author', 'username avatar');
    
    res.json(populatedComment);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/comments/:commentId
// @desc    Delete a comment
// @access  Private
router.delete('/:commentId', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId).populate('post');
    if (!comment) {
      return res.status(404).json({ msg: 'Comment not found' });
    }

    // Check user: comment author or post author can delete comments
    const isCommentAuthor = comment.author.toString() === req.user.id;
    const isPostAuthor = comment.post && comment.post.author.toString() === req.user.id;

    if (!isCommentAuthor && !isPostAuthor) {
      return res.status(401).json({ msg: 'User not authorized to delete this comment' });
    }

    await comment.deleteOne();
    res.json({ msg: 'Comment removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
