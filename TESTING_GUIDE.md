# Multi-User Video Call & Chat Testing Guide

## Prerequisites

1. **Backend Running**: Server should be running on `http://localhost:5000`
2. **Frontend Running**: React app should be running on `http://localhost:3000`
3. **Multiple Browser Instances**: For testing multi-user functionality

## Test 1: Multi-User Video Display Fix

### Objective
Verify that multiple users joining the same session can see each other's video streams simultaneously in a grid layout.

### Steps

1. **Open Multiple Browser Windows/Tabs**
   ```
   - Tab 1: http://localhost:3000
   - Tab 2: http://localhost:3000 (private/incognito mode recommended)
   - Tab 3: http://localhost:3000 (different browser or private window)
   ```

2. **Login with Different Accounts**
   - Tab 1: Login as User A
   - Tab 2: Login as User B
   - Tab 3: Login as User C

3. **Navigate to Video Session**
   - In each tab, go to Sessions page
   - Click "Join Session" on the same video session
   - Allow camera/microphone permissions when prompted

4. **Verify Multi-User Video**
   - ✅ **User A should see**: Their own video + User B's video + User C's video
   - ✅ **User B should see**: Their own video + User A's video + User C's video
   - ✅ **User C should see**: Their own video + User A's video + User B's video

### Expected Behavior
- **Grid Layout**: Videos automatically arrange in a responsive grid
- **Real-time Streams**: All video streams display simultaneously without delay
- **Connection Status**: Green "Connected" status for all users
- **Participant Count**: Shows correct number (e.g., "3 participants")

### Debugging
Check browser console for logs like:
```
Joined room successfully!
Total users in room: 3
Creating connection to existing user: [Username]
Received remote track from [socketId]: video
```

---

## Test 2: Real-Time Chat Functionality Fix

### Objective  
Verify that all users in the session can send and receive messages instantly with sender names and timestamps.

### Steps

1. **With Multiple Users in Same Video Session** (from Test 1)

2. **Test Chat Interface**
   - Ensure chat panel is visible (click "Show Chat" if hidden)
   - Chat panel should show "Session Chat" header
   - Should display "No messages yet. Start the conversation!" initially

3. **Send Messages from Different Users**
   
   **User A sends**: "Hello everyone!"
   - ✅ **User A sees**: Message appears immediately as "sent" (right side)
   - ✅ **User B sees**: Message appears as "received" (left side) with User A's name
   - ✅ **User C sees**: Message appears as "received" (left side) with User A's name

   **User B sends**: "Hi User A!"
   - ✅ **All users**: See message immediately with User B as sender

   **User C sends**: "Great to see you both!"
   - ✅ **All users**: See message immediately with User C as sender

4. **Test Typing Indicators**
   - Start typing in one tab
   - ✅ **Other users see**: "User X is typing..." indicator
   - ✅ **Indicator disappears**: After 2 seconds of no typing

5. **Verify Message Structure**
   - ✅ **Sender Names**: Clearly displayed for each message
   - ✅ **Timestamps**: Show time in format "HH:MM AM/PM"
   - ✅ **Auto-scroll**: Chat scrolls to newest messages automatically
   - ✅ **Message Count**: Header shows correct message count

### Expected Chat Behavior
- **Instant Delivery**: Messages appear immediately (no refresh needed)
- **Proper Attribution**: Each message shows correct sender name
- **Timestamps**: Messages show when they were sent
- **Scrolling**: Chat automatically scrolls to newest messages
- **Typing Indicators**: Real-time typing status updates

### Debugging
Check browser console for logs like:
```
Sending chat message: {sessionId: "...", message: "Hello everyone!"}
New chat message: {content: "Hello everyone!", senderName: "User A"}
```

---

## Test 3: Connection Stability & Error Handling

### Objective
Verify that the application handles connection issues gracefully without crashes.

### Steps

1. **Test Socket Disconnection**
   - With video session running, temporarily disable network
   - ✅ **Status should show**: "Disconnected" or "Error"
   - ✅ **No crashes**: Application should remain functional
   - Re-enable network
   - ✅ **Auto-reconnect**: Should attempt to reconnect automatically

2. **Test Permission Denial**
   - Block camera/microphone permissions in browser
   - Try to join video session
   - ✅ **Error message**: Should show user-friendly error about permissions
   - ✅ **Graceful handling**: No application crash

3. **Test Browser Refresh**
   - Refresh one browser tab during active session
   - ✅ **Other users**: Should see user leave notification
   - ✅ **Rejoining**: Refreshed user should be able to rejoin

### Expected Stability
- **No Runtime Errors**: No "Cannot read properties of null" errors
- **Error Messages**: User-friendly error messages for common issues
- **Graceful Degradation**: App continues working when features fail
- **Recovery**: Ability to recover from temporary connection issues

---

## Test 4: Audio/Video Controls

### Objective
Verify that media controls work correctly and sync across all users.

### Steps

1. **Test Mute/Unmute Audio**
   - Click "Mute" button in User A's session
   - ✅ **User A**: Button shows "Unmute" and red state
   - ✅ **Other Users**: Should not hear User A's audio
   - Click "Unmute"
   - ✅ **All Users**: Audio resumes

2. **Test Enable/Disable Video**
   - Click "Disable Camera" in User B's session
   - ✅ **User B**: Video shows black/placeholder
   - ✅ **Other Users**: See User B's video disappear or show placeholder
   - Click "Enable Camera"
   - ✅ **All Users**: Video resumes

3. **Test Leave Call**
   - Click "End Call" in one user's session
   - ✅ **User leaving**: Redirected to Sessions page
   - ✅ **Other Users**: See participant count decrease
   - ✅ **No crashes**: Remaining users continue normally

---

## Success Criteria

### ✅ Multi-User Video Display
- [ ] All participants see each other's video streams simultaneously
- [ ] Videos display in responsive grid layout
- [ ] New users joining are immediately visible to existing users
- [ ] Existing users are immediately visible to new users

### ✅ Real-Time Chat
- [ ] Messages send and receive instantly without page refresh
- [ ] All participants see all messages from all users
- [ ] Sender names and timestamps display correctly
- [ ] Typing indicators work in real-time
- [ ] Chat history persists during session

### ✅ Stability & Error Handling
- [ ] No "Cannot read properties of null" errors
- [ ] Graceful handling of connection failures
- [ ] User-friendly error messages
- [ ] No application crashes under normal usage

### ✅ Local Execution
- [ ] Fully functional on localhost
- [ ] No external API dependencies
- [ ] Works across multiple browser instances
- [ ] Backend logs show proper room management

---

## Troubleshooting Common Issues

### "No camera/microphone permissions"
- Grant permissions in browser settings
- Refresh page after granting permissions
- Try different browser if permissions are stuck

### "Users can't see each other"
- Check browser console for WebRTC connection logs
- Verify both users are in the same sessionId
- Ensure backend is running and accessible

### "Chat messages not appearing"
- Check network tab for Socket.IO connection
- Verify backend logs show message broadcasting
- Try refreshing browser and rejoining session

### "Socket connection errors"
- Restart backend server
- Clear browser cache and localStorage
- Check for firewall blocking localhost:5000

---

## Performance Notes

- **Recommended**: Test with 2-4 users for optimal performance
- **Browser Support**: Chrome, Firefox, Edge (modern versions)
- **Network**: Works best on local network or localhost
- **Resources**: Each additional user increases CPU/bandwidth usage

The fixes ensure reliable multi-user video calling with integrated real-time chat, all running locally without external dependencies.