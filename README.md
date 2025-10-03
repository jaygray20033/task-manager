# Task Manager - Full-Stack Application

<img width="1912" height="966" alt="image" src="https://github.com/user-attachments/assets/5ba4ff1f-be85-4001-be94-f32abf50659c" />



## Introduction

Task Manager is a powerful full-stack application that helps individuals and teams organize, track, and complete their tasks efficiently. Built with modern web technologies, it offers both personal task management and team collaboration features with a beautiful, intuitive interface.

## ✨ Features

### Personal Task Management
- 🔐 **User Authentication** - Secure registration and login with JWT
- ✅ **CRUD Operations** - Create, read, update, and delete tasks
- ⭐ **Important Tasks** - Mark and filter critical tasks
- 📅 **Due Dates** - Set deadlines and get visual reminders
- 📧 **Email Reminders** - Automatic notifications 1 hour before due time
- 🎯 **Categories** - Organize tasks by project or type
- 📊 **Statistics Dashboard** - Track total, active, and completed tasks
- 🔔 **Upcoming Tasks** - See tasks due in the next 24 hours
- 🔍 **Filters & Sorting** - View by status, date, or category

### Team Collaboration
- 👥 **Team Management** - Create and manage multiple teams
- 🔗 **Invite System** - Unique 8-character invite codes
- 📧 **Email Invitations** - Add members directly by email
- 👤 **Role-Based Access** - Owner, Admin, and Member roles
- 📝 **Team Tasks** - Create tasks with multiple assignments
- ⏰ **Individual Deadlines** - Set different due dates per member
- ✓ **Progress Tracking** - Real-time task completion status
- 🎨 **Visual Indicators** - Color-coded badges and status updates

### Security & Recovery
- 🔒 **Password Hashing** - Secure bcrypt encryption
- 🔑 **JWT Authentication** - Token-based session management
- 📧 **Password Reset** - Email-based recovery with time-limited tokens
- 🚪 **Multi-Device Logout** - Sign out from all devices

## Environment Variables

To run this project, you will need to add the following environment variables to your `.env` file:

### Required Variables
- `PORT` - Server port (default: 3000)
- `MONGODB_URL` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT token generation
- `SENDGRID_API_KEY` - SendGrid API key for email functionality
- `SENDER_EMAIL` - Email address for sending notifications

## 🛠 Tech Stack

**Backend:**
- Node.js - JavaScript runtime
- Express.js - Web application framework
- MongoDB - NoSQL database
- Mongoose v8.x - MongoDB object modeling
- JWT - Authentication tokens
- bcryptjs - Password hashing
- SendGrid - Email service 
- validator.js - Data validation

**Frontend:**
- HTML5 - Semantic markup
- CSS3 - Modern styling with gradients and animations
- JavaScript - No framework dependencies
- Responsive Design - Mobile-first approach

### Installation Steps

**1. Clone the repository**
\`\`\`bash
git clone https://github.com/jaygray20033/task-manager.git
cd task-manager
\`\`\`

**2. Install dependencies**
\`\`\`bash
npm install
\`\`\`

**3. Configure environment variables**

Copy the example file and update with your values:
\`\`\`bash
cp .env.example .env
\`\`\`

Edit `.env` with your configuration (see Environment Variables section above)

**4. Start MongoDB**

Local MongoDB:
\`\`\`bash
mongod
\`\`\`

**5. Start the development server**
\`\`\`bash
npm run dev
\`\`\`

**6. Access the application**

Open your browser and navigate to:
\`\`\`
http://localhost:3000
\`\`\`

### Production Build

\`\`\`bash
npm start
\`\`\`
