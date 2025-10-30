# Meeting System Integration Documentation

## Overview

This document provides complete instructions for integrating the MongoDB-backed WebRTC meeting system with SimplePeer into your MentorHub application.

<citations>
  <document>
      <document_type>WEB_PAGE</document_type>
      <document_id>https://socket.io</document_id>
  </document>
</citations>

## Backend Implementation

### 1. MongoDB Schema

The Meeting model is located at `backend/src/models/Meeting.js` and includes:
- Meeting code tracking
- Participant management with join/leave timestamps
- Persistent chat message storage
- Whiteboard data support
- Active/inactive status tracking

### 2. Socket.IO Meeting Handler

The meeting handler (`backend/src/sockets/meetingHandler.js`) implements:
- **Room Management**: Join/leave room with 10-user capacity limit
- **WebRTC Signaling**: Handles offers, answers, and ICE candidates
- **Chat Functionality**: Persistent message storage in MongoDB
- **Participant Tracking**: Real-time updates when users join/leave
- **Whiteboard Support**: Broadcasting drawing data to all participants

### 3. Backend Integration

The meeting handler is integrated into the socket initialization in `backend/src/utils/socket.js`.

## Frontend Implementation

### Components Created

1. **Room Component** (`frontend/src/pages/sessions/Room.js`)
   - Main video conference room with SimplePeer WebRTC
   - Video grid layout supporting up to 10 participants
   - Control bar with mute/unmute, video toggle, chat, participants, whiteboard, and share
   - Automatic media stream management

2. **ChatPanel** (`frontend/src/components/meeting/ChatPanel.js`)
   - Real-time chat with MongoDB persistence
   - PDF export functionality using jsPDF
   - Auto-scrolling message list
   - Timestamp display

3. **ParticipantsPanel** (`frontend/src/components/meeting/ParticipantsPanel.js`)
   - Live participant list with avatars
   - Join time tracking
   - Active/inactive status indicators

4. **ShareDialog** (`frontend/src/components/meeting/ShareDialog.js`)
   - Copy meeting URL or meeting code
   - Toast notifications for successful copy

## Usage Instructions

### Starting a Meeting

1. **Create or Join a Meeting Room**:
   ```javascript
   // Navigate to a meeting room
   navigate('/room/MEETING_CODE');
   ```

2. **Meeting Code Format**:
   - Can be any unique string (e.g., 'team-standup-2024')
   - Stored in MongoDB for persistence
   - Supports rejoining after disconnection

### Socket.IO Events

#### Client → Server Events:
```javascript
// Join a room
socket.emit('join room', {
  roomID: 'meeting-code',
  userEmail: 'user@example.com',
  userUid: 'user-id',
  userName: 'User Name'
});

// WebRTC signaling
socket.emit('sending signal', { userToSignal, callerID, signal });
socket.emit('returning signal', { signal, callerID });

// Chat
socket.emit('send message', {
  meetingCode: 'meeting-code',
  message: 'Hello!',
  senderEmail: 'user@example.com',
  senderUid: 'user-id',
  senderName: 'User Name'
});

// Get data
socket.emit('get chat history', 'meeting-code');
socket.emit('get participants', 'meeting-code');

// Leave room
socket.emit('leave room', { roomID: 'meeting-code' });
```

#### Server → Client Events:
```javascript
// Room events
socket.on('room full', () => {});
socket.on('all users', (users) => {});
socket.on('user joined', (payload) => {});
socket.on('user left', (socketId) => {});

// WebRTC signaling
socket.on('receiving returned signal', (payload) => {});

// Data updates
socket.on('chat history', (messages) => {});
socket.on('new message', (message) => {});
socket.on('participants update', (participants) => {});
```

## Testing Checklist

### Basic Functionality
- [x] MongoDB Meeting model created and indexed
- [x] Socket.IO meeting handler integrated
- [x] Room component with SimplePeer WebRTC
- [x] Audio mute/unmute works correctly (using !audioMuted)
- [x] Video enable/disable works correctly (using !videoMuted)
- [x] Chat messages persist in MongoDB
- [x] Participants list updates in real-time
- [x] Room capacity limit (10 users) enforced

### Multi-User Testing
1. Open multiple browser tabs
2. Join same meeting room with different accounts
3. Verify all users can see each other's video
4. Test chat functionality between users
5. Verify participant list updates
6. Test user leaving and rejoining

### Data Persistence
1. Send chat messages
2. Refresh the page
3. Verify chat history loads from MongoDB
4. Check participant history is maintained

## Troubleshooting

### Common Issues

1. **"Room is full" error**
   - Meeting rooms have a 10-participant limit
   - Check MongoDB for active participants

2. **Video not showing**
   - Ensure camera permissions are granted
   - Check browser console for WebRTC errors
   - Verify SimplePeer connections are established

3. **Chat not persisting**
   - Verify MongoDB connection
   - Check Meeting model is properly saving
   - Ensure socket events are being emitted

4. **Audio/Video toggle not working**
   - Verify using `!audioMuted` and `!videoMuted` pattern
   - Check media stream track availability

### Debug Commands

```javascript
// Check active rooms (server-side)
console.log(users); // In-memory room tracking

// Check MongoDB meetings
const meetings = await Meeting.find({ isActive: true });

// Client-side peer connections
console.log(peersRef.current);
```

## Performance Optimization

1. **Indexes**: Meeting collection indexed on `meetingCode` for fast lookups
2. **Cleanup**: Proper cleanup of peer connections on unmount
3. **Memory Management**: In-memory tracking cleared when rooms empty
4. **Stream Management**: Local streams stopped when leaving room

## Security Considerations

1. **Room Capacity**: Limited to 10 users to prevent resource exhaustion
2. **MongoDB Validation**: Schema validation on Meeting model
3. **User Authentication**: All endpoints require authenticated users
4. **Data Cleanup**: Participant data marked inactive on disconnect

## Future Enhancements

1. **Screen Sharing**: Add screen share functionality
2. **Recording**: Implement meeting recording
3. **Breakout Rooms**: Support for smaller group discussions
4. **Virtual Backgrounds**: Add background blur/replacement
5. **Meeting Analytics**: Track meeting duration, participation
6. **Scheduled Meetings**: Calendar integration
7. **Meeting Transcription**: Real-time transcription service

## Migration from Old VideoRoom

If migrating from the old VideoRoom component:

1. The new Room component uses SimplePeer instead of native WebRTC
2. Socket events are different (follow the new event names)
3. MongoDB integration provides persistence
4. Chat and participants are now separate components

## Summary

The meeting system provides:
- ✅ WebRTC video calls with SimplePeer
- ✅ MongoDB persistence for meetings and chats
- ✅ Real-time participant tracking
- ✅ Chat with PDF export
- ✅ Meeting sharing functionality
- ✅ 10-user room capacity
- ✅ Proper cleanup and error handling

To use: Navigate to `/room/YOUR_MEETING_CODE` to start or join a meeting.