# Quick Video Call Testing Instructions

I've created a simplified test page to debug the video call and chat issues without authentication complications.

## How to Test

### 1. Make sure both backend and frontend are running:

**Backend** (should already be running):
```bash
cd C:\Users\thele\OneDrive\Desktop\warp\mentorhub\backend
npm start
```
You should see:
```
MentorHub backend listening on port 5000
MongoDB connected
```

**Frontend** (should already be running):
```bash
cd C:\Users\thele\OneDrive\Desktop\warp\mentorhub\frontend  
npm start
```

### 2. Open the test page:

Navigate to: **http://localhost:3000/test-video**

### 3. Test multi-user video:

1. **Open multiple browser tabs/windows** pointing to `http://localhost:3000/test-video`
2. **In each tab**:
   - You should see "🟢 Connected" status
   - Click the "Start Video Call" button
   - Allow camera/microphone permissions when prompted
3. **Check the results**:
   - Each tab should show its own video (green border) 
   - Each tab should show other users' videos (blue borders)
   - Participant count should increase as more users join

### 4. Test real-time chat:

1. **In any tab**, type a message in the chat box and press Enter or click Send
2. **Check all tabs** - the message should appear immediately in all tabs
3. **Send messages from different tabs** - they should all appear with the correct sender names

## What to Look For

### ✅ **Success Indicators:**
- **Multi-user video**: All participants see each other's video streams simultaneously
- **Real-time chat**: Messages appear instantly in all tabs with sender names
- **Participant count**: Shows correct number (e.g., "3" if 3 tabs are open)
- **No errors**: No red error messages or console errors

### ❌ **Failure Indicators:**
- **Only 1 participant shown** even with multiple tabs open
- **Chat messages not appearing** or appearing only in sender's tab
- **"🔴 Disconnected" status**
- **Console errors** about WebRTC or socket connections

## Debugging Information

### Check Browser Console:
Open browser developer tools (F12) and look in the Console tab for logs like:

**Working video connection:**
```
Socket connected: [socketId]
Joining WebRTC room: test-session-123
Joined room successfully!
Total users in room: 2
Creating connection to existing user: TestUser-XXXX
Received remote track from [socketId]: video
```

**Working chat:**
```
Sending chat message: {sessionId: "test-session-123", message: "hello"}
New chat message: {content: "hello", senderName: "TestUser-XXXX"}
```

### Check Backend Console:
The backend should show logs like:
```
Join room request - roomId: test-session-123, userData: {userId: "...", name: "TestUser-XXXX"}
User TestUser-XXXX joined room test-session-123
Room test-session-123 now has 2 users: ["TestUser-AAAA", "TestUser-BBBB"]
```

## If Issues Persist

1. **Refresh all browser tabs** and try again
2. **Check backend is running** on port 5000
3. **Try different browsers** (Chrome, Firefox, Edge)
4. **Restart backend server** if socket connections seem stuck
5. **Check browser permissions** for camera/microphone access

This simplified test bypasses authentication and database issues to focus purely on the WebRTC and Socket.IO functionality.

## Expected Working Behavior

When working correctly:
- Opening 3 browser tabs should show "3 participants" in each tab
- Each tab shows 3 video streams: 1 green (self) + 2 blue (others) 
- Sending "hello" in tab 1 should immediately show "TestUser-XXXX: hello" in all tabs
- Backend console shows room membership and message broadcasting

If this test works, the core WebRTC/chat functionality is fine and the issue is in the authentication/routing layer of the main application.