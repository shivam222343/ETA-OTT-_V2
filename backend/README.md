# Eta Backend

Backend server for Eta Educational Platform with AI-powered doubt resolution.

## Features

- Multi-database architecture (MongoDB, Neo4j, Qdrant, Redis)
- Firebase + JWT authentication
- Real-time WebSocket communication
- AI doubt resolution with confidence-based escalation
- File upload to Cloudinary
- Role-based access control

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file in root directory (already exists in parent folder)

3. Run development server:
```bash
npm run dev
```

4. Server will start on port 5000

## API Endpoints

### Authentication
- POST `/api/auth/signup` - User registration
- POST `/api/auth/login` - User login
- POST `/api/auth/verify-token` - Verify JWT token
- GET `/api/auth/profile` - Get user profile

### Institutions
- POST `/api/institutions` - Create institution
- POST `/api/institutions/join` - Join via access key
- GET `/api/institutions/:id` - Get institution details
- PUT `/api/institutions/:id` - Update institution

### Branches
- POST `/api/branches` - Create branch with QR
- POST `/api/branches/join` - Join branch
- GET `/api/branches/:id` - Get branch details

### Courses
- POST `/api/courses` - Create course
- GET `/api/courses/:id` - Get course details
- GET `/api/courses/branch/:branchId` - Get branch courses

### Content
- POST `/api/content/upload` - Upload content
- GET `/api/content/:id` - Get content
- GET `/api/content/course/:courseId` - Get course content

### Doubts (AI Resolution)
- POST `/api/doubts/ask` - Ask doubt (triggers AI workflow)
- GET `/api/doubts/my-doubts` - Get student doubts
- GET `/api/doubts/escalated` - Get escalated doubts (faculty)
- POST `/api/doubts/:id/answer` - Faculty answer

### Analytics
- GET `/api/analytics/student/:id` - Student analytics
- GET `/api/analytics/faculty/:id` - Faculty analytics
- GET `/api/analytics/admin` - System analytics

## WebSocket Events

- `doubt:escalated` - Notify faculty of escalated doubt
- `doubt:answered` - Notify student of answer
- `content:uploaded` - Notify branch of new content
- `notification:new` - General notifications

## Tech Stack

- Node.js + Express.js
- MongoDB (Mongoose)
- Redis
- Neo4j
- Qdrant (Vector DB)
- Socket.io
- Firebase Admin SDK
- Cloudinary
