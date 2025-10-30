# MentorHub API Documentation

## Overview
MentorHub is a full-stack mentorship platform with JWT authentication, role-based access control, real-time chat, video conferencing, goal tracking, and dispute resolution.

## Base URL
```
http://localhost:5000/api
```

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## API Endpoints

### Authentication (`/auth`)
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user profile
- `PUT /auth/profile` - Update user profile
- `POST /auth/expertise` - Add expertise area
- `POST /auth/request-mentor` - Request mentor role

### Sessions (`/sessions`)
- `POST /sessions` - Create new session
- `GET /sessions` - List user sessions (supports filters: `status`, `upcoming`, `past`)
- `GET /sessions/:id` - Get session details
- `PUT /sessions/:id` - Update session
- `DELETE /sessions/:id` - Cancel session
- `POST /sessions/:id/join` - Join session
- `GET /sessions/:id/messages` - Get session chat messages

### Goals (`/goals`)
- `POST /goals` - Create new goal (mentor only)
- `GET /goals` - List user goals (supports `status` filter)
- `GET /goals/:id` - Get goal details with milestones
- `PUT /goals/:id` - Update goal
- `DELETE /goals/:id` - Delete goal
- `POST /goals/:goalId/milestones` - Create milestone
- `PUT /goals/milestones/:milestoneId` - Update milestone
- `POST /goals/:goalId/comments` - Add comment
- `GET /goals/:goalId/comments` - Get comments
- `POST /goals/:goalId/attachments` - Upload attachment

### Disputes (`/disputes`)
- `POST /disputes` - Create dispute
- `GET /disputes` - List disputes (supports `status`, `type` filters)
- `GET /disputes/:id` - Get dispute details
- `PUT /disputes/:id` - Update dispute (admin only)
- `POST /disputes/:id/resolve` - Resolve dispute (admin only)

### Search (`/search`)
- `GET /search/mentors` - Search mentors (supports `q`, `expertise`, `rating` filters)
- `GET /search/mentors/:id` - Get mentor profile

### Admin (`/admin`)
- `GET /admin/users` - List all users (admin only)
- `PUT /admin/users/:id` - Update user (admin only)
- `PUT /admin/users/:userId/expertise/:expertiseName` - Approve/reject expertise
- `GET /admin/analytics` - Get platform analytics

## Real-time Events (Socket.IO)

### Chat Events
- `chat:join` - Join session chat room
- `chat:message` - Send/receive chat message
- `chat:leave` - Leave chat room

### WebRTC Signaling
- `webrtc:join` - Join video room
- `webrtc:offer` - Send WebRTC offer
- `webrtc:answer` - Send WebRTC answer
- `webrtc:ice-candidate` - Exchange ICE candidates

## Data Models

### User
```javascript
{
  _id: ObjectId,
  email: String,
  name: String,
  role: "Admin" | "Mentor" | "Mentee",
  bio: String,
  avatarUrl: String,
  expertise: [{name: String, status: "Pending" | "Approved" | "Rejected"}],
  isMentorApproved: Boolean,
  status: "Active" | "Blocked",
  rating: Number,
  ratingsCount: Number,
  availability: [{day: String, slots: [{start: String, end: String}]}]
}
```

### Session
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  mentor: ObjectId,
  mentee: ObjectId,
  scheduledAt: Date,
  duration: Number,
  status: "Scheduled" | "InProgress" | "Completed" | "Cancelled",
  sessionUrl: String,
  notes: String,
  rating: Number,
  feedback: String
}
```

### Goal
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  mentor: ObjectId,
  mentee: ObjectId,
  session: ObjectId,
  status: "Active" | "Completed" | "Paused",
  priority: "Low" | "Medium" | "High",
  targetDate: Date,
  progress: Number,
  tags: [String]
}
```

## Error Handling
All endpoints return consistent error responses:
```javascript
{
  success: false,
  error: "Error message"
}
```

## Success Responses
All successful endpoints return:
```javascript
{
  success: true,
  data: { /* response data */ },
  meta: { /* pagination, etc. */ }
}
```