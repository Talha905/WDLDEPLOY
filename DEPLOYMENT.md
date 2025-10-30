# MentorHub Deployment Guide

## System Requirements

### Development Environment
- Node.js 18+ and npm
- MongoDB 5.0+
- Modern web browser with WebRTC support

### Production Environment
- Node.js 18+ runtime
- MongoDB Atlas or self-hosted MongoDB
- HTTPS-enabled domain for WebRTC
- STUN/TURN servers for production WebRTC (not included)

## Local Development Setup

### 1. Clone and Install Dependencies
```bash
cd mentorhub

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure Environment Variables

**Backend (.env):**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/mentorhub
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
UPLOAD_DIR=./src/public/uploads
NODE_ENV=development
```

**Frontend (.env):**
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

### 3. Start MongoDB
```bash
# Using MongoDB locally
mongod --dbpath /path/to/your/db

# Or use MongoDB Atlas connection string
```

### 4. Run Applications
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend  
cd frontend
npm start
```

### 5. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- Health Check: http://localhost:5000/health

## Production Deployment

### Backend Deployment (Node.js)

1. **Prepare Production Build:**
```bash
cd backend
npm install --production
```

2. **Environment Variables:**
```env
NODE_ENV=production
PORT=80
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mentorhub
JWT_SECRET=complex_production_secret
FRONTEND_URL=https://yourdomain.com
UPLOAD_DIR=/var/uploads
```

3. **Process Management:**
```bash
# Using PM2
npm install -g pm2
pm2 start src/server.js --name mentorhub-backend
pm2 startup
pm2 save
```

### Frontend Deployment (React)

1. **Build for Production:**
```bash
cd frontend
npm run build
```

2. **Deploy Static Files:**
- Upload `build/` folder to your web server
- Configure web server (nginx/Apache) to serve static files
- Set up proper routing for React Router

**Example nginx config:**
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        root /path/to/frontend/build;
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Database Schema

### Collections Overview

1. **users** - User accounts with roles and profiles
2. **sessions** - Mentoring sessions with status tracking
3. **goals** - Goals assigned by mentors to mentees
4. **milestones** - Sub-tasks for goals
5. **comments** - Threaded comments on goals
6. **attachments** - File uploads for goals
7. **chatmessages** - Persistent chat messages
8. **disputes** - Dispute reports and resolutions

### Indexes
- `users`: email (unique), role, isMentorApproved
- `sessions`: mentor, mentee, scheduledAt
- `goals`: mentor, mentee, status
- `milestones`: goal, order
- `comments`: goal, createdAt
- `disputes`: status, reportedBy

## Security Considerations

### Production Security
1. **Use HTTPS everywhere**
2. **Set strong JWT secrets**
3. **Enable CORS only for your domain**
4. **Validate all user inputs**
5. **Use helmet.js for security headers**
6. **Regular security updates**

### File Uploads
- Limit file sizes (5MB default)
- Validate file types
- Scan for malware in production
- Store outside web root

## Performance Optimization

### Backend
- Enable gzip compression
- Use database connection pooling
- Implement proper caching
- Monitor memory usage

### Frontend
- Code splitting with React.lazy
- Image optimization
- CDN for static assets
- Service worker for caching

## Monitoring & Logging

### Recommended Tools
- **Application**: PM2, Forever
- **Logging**: Winston, Morgan
- **Monitoring**: DataDog, New Relic
- **Database**: MongoDB Compass, Atlas monitoring

### Health Checks
```bash
# Backend health
curl http://localhost:5000/health

# Should return: {"ok":true,"service":"mentorhub-backend"}
```

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check FRONTEND_URL environment variable
   - Verify allowed origins in backend

2. **WebRTC Not Working**
   - Requires HTTPS in production
   - Need STUN/TURN servers for public internet
   - Check browser permissions for media access

3. **File Upload Failures**
   - Check upload directory permissions
   - Verify file size limits
   - Ensure disk space available

4. **Socket.IO Connection Issues**
   - Check firewall settings
   - Verify WebSocket support
   - Test with polling fallback

### Log Analysis
```bash
# PM2 logs
pm2 logs mentorhub-backend

# Application logs
tail -f logs/app.log
```

## Scaling Considerations

### Database Scaling
- MongoDB replica sets
- Read replicas for analytics
- Sharding for large datasets

### Application Scaling
- Load balancer (nginx/HAProxy)
- Multiple Node.js instances
- Session store (Redis) for Socket.IO
- CDN for static assets

## Backup Strategy

### Database Backups
```bash
# MongoDB dump
mongodump --uri="mongodb://localhost:27017/mentorhub" --out=/backups/$(date +%Y%m%d)

# Automated backup script
0 2 * * * /path/to/backup_script.sh
```

### File Backups
- Regular uploads directory backup
- Version control for code
- Configuration backup

This deployment guide provides a foundation for running MentorHub in production environments. Adjust configurations based on your specific infrastructure and requirements.