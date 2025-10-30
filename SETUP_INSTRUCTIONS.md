# MentorHub Setup Instructions

## Quick Setup (Development)

### 1. Prerequisites
- **Node.js 18+** and npm
- **MongoDB** running locally or connection string for MongoDB Atlas
- Modern web browser

### 2. Clone & Install
```bash
# Backend
cd mentorhub/backend
npm install

# Frontend  
cd ../frontend
npm install
```

### 3. Environment Configuration

**Backend (.env):**
```bash
cd backend
cp .env.example .env
# Edit .env with your settings (MongoDB URI, JWT secret, etc.)
```

**Frontend (.env):**
```bash
cd frontend  
cp .env.example .env
# Usually the defaults work for local development
```

### 4. Start MongoDB
```bash
# Local MongoDB
mongod

# OR use MongoDB Atlas connection string in backend/.env
```

### 5. Populate Database with Sample Data
```bash
cd backend
npm run seed
```

This will create:
- **11 users** (1 admin, 1 mentee, 9 mentors with different expertise)
- **5 sessions** between mentors and mentees (some completed, some scheduled)
- **4 chat messages** for completed sessions
- **3 goals** with milestones, comments, and file attachments
- **2 disputes** (one open, one resolved)

### 6. Start Applications
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm start
```

### 7. Access MentorHub
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/health

## 🔐 Login Credentials

### Admin Account
- **Email**: `admin@mentorhub.test`
- **Password**: `AdminPass123!`
- **Capabilities**: User management, mentor approvals, dispute resolution, analytics

### Mentor Account (Approved)
- **Email**: `mentor@mentorhub.test`  
- **Password**: `MentorPass123!`
- **Name**: Alicia Mentor
- **Expertise**: React, Node.js, System Design (all approved)
- **Has**: 5 sessions with mentee, 3 goals assigned, 4.7 rating

### Mentee Account
- **Email**: `mentee@mentorhub.test`
- **Password**: `MenteePass123!`
- **Name**: Jordan Mentee
- **Has**: Sessions booked, goals to complete, can search for mentors

### Additional Mentors (All use `MentorPass123!`)
- `samira@mentorhub.test` - React, GraphQL, TypeScript (4.8⭐)
- `lee@mentorhub.test` - Node.js, System Design, Kubernetes (4.6⭐) 
- `priya@mentorhub.test` - React, CSS, Accessibility (4.5⭐)
- `carlos@mentorhub.test` - Node.js, MongoDB, Express (4.3⭐)
- `nina@mentorhub.test` - AWS, Serverless, DevOps (4.9⭐)
- `ben@mentorhub.test` - React Native, Expo, TypeScript (4.4⭐)
- `yuki@mentorhub.test` - Data Engineering, Airflow, DBT (4.2⭐)
- `omar@mentorhub.test` - AppSec, OWASP, Threat Modeling (4.1⭐)

## 🎯 What to Explore

### As Admin (`admin@mentorhub.test`)
1. **Admin Dashboard** → View analytics and manage users
2. **Approve mentors** → Users tab in admin section
3. **Resolve disputes** → Review open disputes
4. **System analytics** → Charts and recent activity

### As Mentee (`mentee@mentorhub.test`) 
1. **Dashboard** → See upcoming sessions and active goals
2. **Find Mentors** → Search and book sessions with various mentors
3. **My Sessions** → View scheduled and completed sessions
4. **Goals** → Track progress on assigned goals
5. **Profile** → Add expertise and request mentor role

### As Mentor (`mentor@mentorhub.test`)
1. **Sessions** → Manage mentoring sessions
2. **Goals** → Create and track mentee goals  
3. **Dashboard** → Monitor your rating and recent activity
4. **Admin features** → If approved, access mentor tools

## 🔄 Re-seeding Database
To reset and repopulate with fresh data:
```bash
cd backend
npm run seed
```

This will clean all existing data and create new sample data.

## 🛠 Troubleshooting

### Common Issues
1. **MongoDB connection error**: Check MongoDB is running and connection string
2. **Port conflicts**: Ensure ports 3000 and 5000 are available
3. **Seed script fails**: Verify MongoDB connection and permissions
4. **WebRTC issues**: Video features work best on HTTPS (production) or localhost

### Reset Everything
```bash
# Stop both applications
# Delete node_modules and reinstall
cd backend && rm -rf node_modules && npm install
cd frontend && rm -rf node_modules && npm install
# Re-seed database
cd backend && npm run seed  
```

Your MentorHub instance is now ready with realistic sample data! You can explore all features using the provided credentials.