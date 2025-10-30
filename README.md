# MentorHub

MentorHub is a full-stack mentorship platform built with React, Node.js/Express, MongoDB, Socket.IO, and WebRTC.

## Features
- JWT auth with Admin, Mentor, Mentee roles
- Mentor approval workflow and expertise moderation
- Session management with statuses, in-session chat, and WebRTC video
- Goals & milestones with comments and file attachments
- Dispute resolution with admin dashboard
- Community: forums, Q&A with voting, group rooms, knowledge base
- Advanced mentor search & direct booking
- Admin dashboard with analytics (custom SVG charts)

## Monorepo Structure
- `backend/` Node.js + Express + Mongoose + Socket.IO
- `frontend/` React + React Router + Axios + WebRTC

## Quickstart

1. Clone or copy this directory.
2. Configure environment variables.
   - Backend: copy `backend/.env.example` to `backend/.env` and adjust
   - Frontend: copy `frontend/.env.example` to `frontend/.env` and adjust
3. Install dependencies
   - Backend: `npm install` inside `backend`
   - Frontend: `npm install` inside `frontend`
4. Run services
   - Backend: `npm run dev` (http://localhost:5000)
   - Frontend: `npm start` (http://localhost:3000)

## WebRTC Video Call & Chat - FRONTEND FIXED ✅

**Frontend completely rewritten - multi-user video and chat now fully functional:**

### 🎥 Multi-User Video Display - WORKING:
- **✅ Problem Solved**: Multiple users (2-6) joining the same session now see each other's video streams simultaneously
- **✅ Technical Solution**: 
  - Enhanced WebRTC signaling in `backend/src/sockets/signaling.js` with proper room state management
  - New users initiate peer connections to existing users (eliminates "offer glare")
  - Proper WebRTC offer/answer/ICE candidate exchange handling
- **✅ Result**: Real-time video grid layout with all participants visible

### 💬 Real-Time Chat - WORKING:
- **✅ Problem Solved**: Chat messages now send/receive instantly across all session participants
- **✅ Technical Solution**:
  - Fixed `ReferenceError: userId is not defined` in `backend/src/sockets/chatEnhanced.js`
  - Proper user identification from socket authentication data
  - Consistent message structure with both `content` and `message` fields for compatibility
  - Messages broadcast to all room participants AND sender
- **✅ Result**: Instant messaging with sender names, timestamps, and typing indicators

### 🔧 Core Infrastructure Fixes:
- **Socket Stability**: Fixed null reference errors with comprehensive connection state management
- **Error Handling**: Graceful degradation when connections fail with detailed logging
- **Performance**: Optimized peer connection management for 2-6 simultaneous users
- **Compatibility**: Works across Chrome, Firefox, Edge on localhost and local networks

### 🧪 Testing Completed:
- ✅ Multiple browser tabs/windows joining same session
- ✅ Simultaneous video streams displaying correctly
- ✅ Real-time chat messaging between all participants  
- ✅ Audio/video controls working across all users
- ✅ Proper cleanup when users leave sessions

## WebRTC Technical Notes
This project uses Socket.IO for signaling with Google's public STUN servers for NAT traversal. The system works reliably on localhost and local networks. For production deployment across the internet, additional TURN servers may be needed depending on network configurations.

## Security
- Passwords are hashed with bcrypt
- JWTs for auth
- Helmet + CORS configured
- Never commit real secrets to version control

## License
MIT
