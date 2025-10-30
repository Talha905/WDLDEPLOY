/*
  Seed script for MentorHub
  - Creates Admin, Mentor (approved), Mentee accounts
  - Generates additional mentors for search
  - Populates sessions, chat messages, goals, milestones, comments, disputes
  - Creates a couple of sample attachment files and records

  Run:  node src/scripts/seed.js
*/

const path = require('path');
const fs = require('fs');
const { loadEnv } = require('../config/env');
const { connectDB } = require('../config/db');
const { ROLES } = require('../config/roles');

const User = require('../models/User');
const Session = require('../models/Session');
const ChatMessage = require('../models/ChatMessage');
const Goal = require('../models/Goal');
const Milestone = require('../models/Milestone');
const Comment = require('../models/Comment');
const Attachment = require('../models/Attachment');
const Dispute = require('../models/Dispute');

async function main() {
  loadEnv();
  await connectDB();

  console.log('Seeding database...');

  // Clean existing data
  await Promise.all([
    User.deleteMany({}),
    Session.deleteMany({}),
    ChatMessage.deleteMany({}),
    Goal.deleteMany({}),
    Milestone.deleteMany({}),
    Comment.deleteMany({}),
    Attachment.deleteMany({}),
    Dispute.deleteMany({})
  ]);

  // Ensure uploads directory exists
  const uploadDir = path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, '..', 'public', 'uploads'));
  fs.mkdirSync(uploadDir, { recursive: true });

  // Create a couple of sample files for attachments
  const files = [
    { name: 'sample-notes.txt', content: 'These are example notes for a goal attachment in MentorHub.' },
    { name: 'resources.txt', content: 'Resource links:\n- https://developer.mozilla.org\n- https://react.dev\n- https://nodejs.org' }
  ];
  for (const f of files) {
    try {
      fs.writeFileSync(path.join(uploadDir, f.name), f.content, 'utf-8');
    } catch (e) {
      console.warn('Failed to create sample file', f.name, e.message);
    }
  }

  // Create core users
  const admin = await User.create({
    email: 'admin@mentorhub.test',
    name: 'MentorHub Admin',
    role: ROLES.ADMIN,
    passwordHash: await User.hashPassword('AdminPass123!'),
    status: 'Active'
  });

  const mentor = await User.create({
    email: 'mentor@mentorhub.test',
    name: 'Alicia Mentor',
    role: ROLES.MENTOR,
    passwordHash: await User.hashPassword('MentorPass123!'),
    bio: 'Senior Software Engineer and Mentor with 10+ years in full-stack development. Passionate about React, Node.js, and clean architecture.',
    avatarUrl: '',
    isMentorApproved: true,
    status: 'Active',
    rating: 4.7,
    ratingsCount: 34,
    expertise: [
      { name: 'React', status: 'Approved' },
      { name: 'Node.js', status: 'Approved' },
      { name: 'System Design', status: 'Approved' }
    ],
    availability: [
      { day: 'Monday', slots: [{ start: '09:00', end: '11:00' }, { start: '14:00', end: '16:00' }] },
      { day: 'Wednesday', slots: [{ start: '10:00', end: '12:00' }] },
      { day: 'Friday', slots: [{ start: '13:00', end: '15:00' }] }
    ]
  });

  const mentee = await User.create({
    email: 'mentee@mentorhub.test',
    name: 'Jordan Mentee',
    role: ROLES.MENTEE,
    passwordHash: await User.hashPassword('MenteePass123!'),
    bio: 'Aspiring developer focusing on JavaScript and front-end engineering.',
    status: 'Active'
  });

  // Create additional mentors for search/booking showcase
  const extraMentorsSpec = [
    { name: 'Samira Dev', email: 'samira@mentorhub.test', rating: 4.8, expertise: ['React', 'GraphQL', 'TypeScript'] },
    { name: 'Lee Architect', email: 'lee@mentorhub.test', rating: 4.6, expertise: ['Node.js', 'System Design', 'Kubernetes'] },
    { name: 'Priya Frontend', email: 'priya@mentorhub.test', rating: 4.5, expertise: ['React', 'CSS', 'Accessibility'] },
    { name: 'Carlos Backend', email: 'carlos@mentorhub.test', rating: 4.3, expertise: ['Node.js', 'MongoDB', 'Express'] },
    { name: 'Nina Cloud', email: 'nina@mentorhub.test', rating: 4.9, expertise: ['AWS', 'Serverless', 'DevOps'] },
    { name: 'Ben Mobile', email: 'ben@mentorhub.test', rating: 4.4, expertise: ['React Native', 'Expo', 'TypeScript'] },
    { name: 'Yuki Data', email: 'yuki@mentorhub.test', rating: 4.2, expertise: ['Data Engineering', 'Airflow', 'DBT'] },
    { name: 'Omar Security', email: 'omar@mentorhub.test', rating: 4.1, expertise: ['AppSec', 'OWASP', 'Threat Modeling'] }
  ];
  const extraMentors = [];
  for (const spec of extraMentorsSpec) {
    const m = await User.create({
      email: spec.email,
      name: spec.name,
      role: ROLES.MENTOR,
      passwordHash: await User.hashPassword('MentorPass123!'),
      isMentorApproved: true,
      status: 'Active',
      rating: spec.rating,
      ratingsCount: Math.floor(20 + Math.random() * 80),
      expertise: spec.expertise.map((e) => ({ name: e, status: 'Approved' })),
      availability: [
        { day: 'Tuesday', slots: [{ start: '09:00', end: '11:00' }] },
        { day: 'Thursday', slots: [{ start: '15:00', end: '17:00' }] }
      ]
    });
    extraMentors.push(m);
  }

  // Create sessions between Alicia (mentor) and Jordan (mentee)
  const now = Date.now();
  const sessions = await Session.insertMany([
    {
      title: 'React State Management',
      description: 'Deep dive into Context vs Redux and best practices.',
      mentor: mentor._id,
      mentee: mentee._id,
      scheduledAt: new Date(now + 1000 * 60 * 60 * 24 * 2), // 2 days later
      duration: 60,
      status: 'Scheduled'
    },
    {
      title: 'Node.js API Design',
      description: 'RESTful patterns, validation, and error handling.',
      mentor: mentor._id,
      mentee: mentee._id,
      scheduledAt: new Date(now - 1000 * 60 * 60 * 24 * 1), // 1 day ago
      duration: 60,
      status: 'Completed',
      rating: 5,
      feedback: 'Great insights and practical examples!'
    },
    {
      title: 'System Design Intro',
      description: 'Scalability basics: caching, queues, and databases.',
      mentor: mentor._id,
      mentee: mentee._id,
      scheduledAt: new Date(now + 1000 * 60 * 60 * 24 * 5), // 5 days later
      duration: 90,
      status: 'Scheduled'
    },
    {
      title: 'Debugging Workshop',
      description: 'Chrome DevTools and Node.js debugging techniques.',
      mentor: mentor._id,
      mentee: mentee._id,
      scheduledAt: new Date(now - 1000 * 60 * 60 * 24 * 7), // 7 days ago
      duration: 60,
      status: 'Completed',
      rating: 4,
      feedback: 'Helpful session with actionable tips.'
    },
    {
      title: 'Career Planning',
      description: 'Roadmap to becoming a Frontend Engineer.',
      mentor: mentor._id,
      mentee: mentee._id,
      scheduledAt: new Date(now + 1000 * 60 * 60 * 24 * 1), // tomorrow
      duration: 45,
      status: 'Scheduled'
    }
  ]);

  // Add some chat messages for the completed session
  const completedSession = sessions.find(s => s.status === 'Completed');
  if (completedSession) {
    const messages = [
      { sender: mentee._id, message: 'Thanks for the session today!' },
      { sender: mentor._id, message: "You're welcome! Keep practicing the patterns we discussed." },
      { sender: mentee._id, message: 'Will do. Any recommended resources?' },
      { sender: mentor._id, message: 'Check out the official docs and the Node Best Practices repo.' }
    ].map(m => ({ session: completedSession._id, ...m, messageType: 'text', timestamp: new Date() }));
    await ChatMessage.insertMany(messages);
  }

  // Create goals with milestones, comments, and attachments
  const goals = await Goal.insertMany([
    {
      title: 'Build a React Portfolio',
      description: 'Create a personal portfolio with React and deploy it.',
      mentor: mentor._id,
      mentee: mentee._id,
      status: 'Active',
      priority: 'High',
      targetDate: new Date(now + 1000 * 60 * 60 * 24 * 30),
      progress: 35,
      tags: ['React', 'Deployment', 'Portfolio']
    },
    {
      title: 'Master Async Patterns in JS',
      description: 'Understand async/await, promises, and error handling.',
      mentor: mentor._id,
      mentee: mentee._id,
      status: 'Active',
      priority: 'Medium',
      targetDate: new Date(now + 1000 * 60 * 60 * 24 * 21),
      progress: 50,
      tags: ['JavaScript', 'Async']
    },
    {
      title: 'Prepare for System Design Interviews',
      description: 'Learn to reason about scalable systems and tradeoffs.',
      mentor: mentor._id,
      mentee: mentee._id,
      status: 'Paused',
      priority: 'Low',
      targetDate: new Date(now + 1000 * 60 * 60 * 24 * 60),
      progress: 15,
      tags: ['System Design']
    }
  ]);

  // Milestones for first goal
  const goal1 = goals[0];
  const ms = await Milestone.insertMany([
    { goal: goal1._id, title: 'Set up React app with routing', status: 'Completed', createdBy: mentee._id, order: 1, completedAt: new Date() },
    { goal: goal1._id, title: 'Create projects section', status: 'InProgress', createdBy: mentee._id, order: 2 },
    { goal: goal1._id, title: 'Deploy to hosting', status: 'Pending', createdBy: mentor._id, order: 3 }
  ]);

  // Comments (threaded)
  const c1 = await Comment.create({
    goal: goal1._id,
    author: mentor._id,
    content: 'Great start! Consider adding lazy-loading for images.'
  });
  await Comment.create({
    goal: goal1._id,
    author: mentee._id,
    content: 'Thanks! I will optimize the images next.',
    parent: c1._id
  });

  // Attachments
  const a1 = await Attachment.create({
    filename: 'sample-notes.txt',
    originalName: 'sample-notes.txt',
    mimetype: 'text/plain',
    size: 64,
    uploadedBy: mentee._id,
    goal: goal1._id,
    filePath: '/uploads/sample-notes.txt'
  });
  await Attachment.create({
    filename: 'resources.txt',
    originalName: 'resources.txt',
    mimetype: 'text/plain',
    size: 128,
    uploadedBy: mentor._id,
    goal: goal1._id,
    filePath: '/uploads/resources.txt'
  });

  // Disputes
  await Dispute.insertMany([
    {
      title: 'Scheduling Conflict',
      description: 'The mentor and mentee could not align on a session time.',
      reportedBy: mentee._id,
      reportedAgainst: mentor._id,
      type: 'Session',
      status: 'Open',
      priority: 'Low'
    },
    {
      title: 'Inappropriate Message',
      description: 'Reported a message that seemed unprofessional (test data).',
      reportedBy: mentor._id,
      reportedAgainst: mentee._id,
      type: 'Conduct',
      status: 'Resolved',
      priority: 'Medium',
      resolution: 'Reviewed conversation; provided guidance to keep discussions professional.',
      resolvedAt: new Date(),
      resolvedBy: admin._id
    }
  ]);

  // Summary
  const counts = await Promise.all([
    User.countDocuments(),
    Session.countDocuments(),
    ChatMessage.countDocuments(),
    Goal.countDocuments(),
    Milestone.countDocuments(),
    Comment.countDocuments(),
    Attachment.countDocuments(),
    Dispute.countDocuments()
  ]);

  console.log('Seed complete!');
  console.log({
    users: counts[0],
    sessions: counts[1],
    messages: counts[2],
    goals: counts[3],
    milestones: counts[4],
    comments: counts[5],
    attachments: counts[6],
    disputes: counts[7]
  });

  console.log('\nLogin credentials:');
  console.log('Admin  -> admin@mentorhub.test / AdminPass123!');
  console.log('Mentor -> mentor@mentorhub.test / MentorPass123!');
  console.log('Mentee -> mentee@mentorhub.test / MenteePass123!');

  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
