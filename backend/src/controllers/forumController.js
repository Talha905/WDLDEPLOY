const { ok, created, error: errorResponse } = require('../utils/response');
const { ForumCategory, ForumThread, ForumPost } = require('../models/Forum');

// Get forum categories
exports.getCategories = async (req, res, next) => {
  try {
    let categories = await ForumCategory.find({ isActive: true }).sort({ order: 1 });
    
    // If no categories exist, create default ones
    if (categories.length === 0) {
      const defaultCategories = [
        {
          name: 'General Discussion',
          description: 'General mentorship topics and discussions',
          order: 1
        },
        {
          name: 'Technical Skills',
          description: 'Programming, technology, and technical skill development',
          order: 2
        },
        {
          name: 'Career Advice',
          description: 'Career guidance, job hunting, and professional development',
          order: 3
        }
      ];
      
      categories = await ForumCategory.insertMany(defaultCategories);
    }
    
    // Add thread counts
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const threadCount = await ForumThread.countDocuments({ category: category._id });
        return { ...category.toObject(), threadCount };
      })
    );
    
    return ok(res, { categories: categoriesWithCounts });
  } catch (err) {
    next(err);
  }
};

// Get forum threads
exports.getThreads = async (req, res, next) => {
  try {
    const { category, limit = 20, page = 1 } = req.query;
    
    let filter = {};
    if (category) filter.category = category;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const threads = await ForumThread.find(filter)
      .populate('author', 'name email avatarUrl role')
      .populate('category', 'name description')
      .populate('lastReplyBy', 'name')
      .sort({ isPinned: -1, lastReplyAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await ForumThread.countDocuments(filter);
    
    return ok(res, { 
      threads,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    next(err);
  }
};

// Create forum thread
exports.createThread = async (req, res, next) => {
  try {
    const { title, content, category } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }
    
    // If no category provided, use the first available category
    let categoryId = category;
    if (!categoryId) {
      const defaultCategory = await ForumCategory.findOne({ isActive: true }).sort({ order: 1 });
      if (defaultCategory) {
        categoryId = defaultCategory._id;
      }
    }
    
    // Verify category exists
    if (categoryId) {
      const categoryExists = await ForumCategory.findById(categoryId);
      if (!categoryExists) {
        return res.status(400).json({ error: 'Category not found' });
      }
    }
    
    const thread = await ForumThread.create({
      title,
      content,
      author: req.user._id,
      category: categoryId
    });
    
    const populatedThread = await ForumThread.findById(thread._id)
      .populate('author', 'name email avatarUrl role')
      .populate('category', 'name description');
    
    return created(res, { thread: populatedThread });
  } catch (err) {
    next(err);
  }
};

// Get single thread with details
exports.getThread = async (req, res, next) => {
  try {
    const { threadId } = req.params;
    
    const thread = await ForumThread.findById(threadId)
      .populate('author', 'name email avatarUrl role')
      .populate('category', 'name description')
      .populate('lastReplyBy', 'name');
    
    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }
    
    // Increment view count
    await ForumThread.findByIdAndUpdate(threadId, { $inc: { views: 1 } });
    
    return ok(res, { thread });
  } catch (err) {
    next(err);
  }
};

// Get thread replies
exports.getReplies = async (req, res, next) => {
  try {
    const { threadId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const replies = await ForumPost.find({ thread: threadId, parent: null })
      .populate('author', 'name email avatarUrl role')
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await ForumPost.countDocuments({ thread: threadId, parent: null });
    
    return ok(res, { 
      replies,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    next(err);
  }
};

// Create thread reply
exports.createReply = async (req, res, next) => {
  try {
    const { threadId } = req.params;
    const { content, parent } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    // Verify thread exists
    const thread = await ForumThread.findById(threadId);
    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }
    
    // Verify parent reply exists if provided
    if (parent) {
      const parentReply = await ForumPost.findById(parent);
      if (!parentReply || parentReply.thread.toString() !== threadId) {
        return res.status(400).json({ error: 'Parent reply not found' });
      }
    }
    
    const reply = await ForumPost.create({
      content,
      author: req.user._id,
      thread: threadId,
      parent: parent || null
    });
    
    // Update thread reply count and last reply info
    await ForumThread.findByIdAndUpdate(threadId, {
      $inc: { replyCount: 1 },
      lastReplyAt: new Date(),
      lastReplyBy: req.user._id
    });
    
    const populatedReply = await ForumPost.findById(reply._id)
      .populate('author', 'name email avatarUrl role');
    
    return created(res, { reply: populatedReply });
  } catch (err) {
    next(err);
  }
};

// Export functions
module.exports = {
  getCategories: exports.getCategories,
  getThreads: exports.getThreads,
  createThread: exports.createThread,
  getThread: exports.getThread,
  getReplies: exports.getReplies,
  createReply: exports.createReply
};
