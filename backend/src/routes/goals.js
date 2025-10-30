const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const {
  createGoal,
  getGoals,
  getGoal,
  updateGoal,
  deleteGoal,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  addComment,
  getComments,
  deleteComment,
  uploadAttachment,
  getAttachments
} = require('../controllers/goalController');
const { authRequired } = require('../middleware/auth');

// Configure multer for file uploads
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'public', 'uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Goal routes
router.post('/', authRequired, createGoal);
router.get('/', authRequired, getGoals);
router.get('/:id', authRequired, getGoal);
router.put('/:id', authRequired, updateGoal);
router.delete('/:id', authRequired, deleteGoal);

// Milestone routes
router.post('/:goalId/milestones', authRequired, createMilestone);
router.put('/milestones/:milestoneId', authRequired, updateMilestone);
router.delete('/milestones/:milestoneId', authRequired, deleteMilestone);

// Comment routes
router.post('/:goalId/comments', authRequired, addComment);
router.get('/:goalId/comments', authRequired, getComments);
router.delete('/comments/:commentId', authRequired, deleteComment);

// Attachment routes
router.post('/:goalId/attachments', authRequired, upload.single('file'), uploadAttachment);
router.get('/:goalId/attachments', authRequired, getAttachments);

module.exports = router;