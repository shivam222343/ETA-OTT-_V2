# Eta Web App - Quick Start Guide

## ✅ Setup Complete!

The Tailwind configuration has been updated to support all custom CSS variables.

## 🚀 Running the App

### 1. Install Dependencies (if not done)
```bash
cd eta-web
npm install
```

### 2. Create Environment File
Create a `.env` file in `eta-web/` directory:

```env
VITE_API_URL=http://localhost:5000/api
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Start Development Server
```bash
npm run dev
```

The app should now be running at `http://localhost:5173`

## 🎨 Features Available

### Pages
- **Landing Page** (`/`) - Beautiful hero section with animations
- **Login** (`/login`) - Email/password authentication
- **Signup** (`/signup`) - Role-based registration (Student/Faculty)
- **Dashboard** (`/dashboard`) - Role-specific dashboards

### Theme
- Light/Dark mode toggle (top right on landing page)
- Persistent theme preference

### Authentication
- Firebase authentication
- JWT token management
- Automatic token refresh
- Protected routes

## 🔧 Known Issues & Solutions

### Issue: CSS `@apply` warnings
**Solution:** These are IDE warnings only. The app will build and run correctly. They'll disappear once Tailwind processes the CSS.

### Issue: Firebase not configured
**Solution:** You need to:
1. Create a Firebase project at https://console.firebase.google.com
2. Enable Email/Password authentication
3. Copy credentials to `.env` file

### Issue: Backend not running
**Solution:** Start the backend server:
```bash
cd ../backend
npm install
npm run dev
```

## 📱 Testing the App

### Test Flow:
1. Visit `http://localhost:5173`
2. Click "Get Started" or "Sign Up"
3. Choose role (Student or Faculty)
4. Fill in details and create account
5. You'll be redirected to the appropriate dashboard

### Test Accounts:
After creating accounts, you can test:
- **Student Dashboard** - View courses, ask doubts
- **Faculty Dashboard** - Manage institutions, review doubts
- **Admin Dashboard** - System overview (create admin via backend)

## 🎯 Next Steps

### For Development:
1. **Backend First:** Ensure backend is running on port 5000
2. **Firebase Setup:** Configure Firebase project
3. **Test Auth:** Create test accounts
4. **Build Features:** Start with institution management

### Priority Features to Build:
1. Institution creation/join pages
2. Branch management with QR codes
3. Course browser
4. Content upload
5. AI doubt panel

## 📚 Tech Stack

- **React 19** - Latest React with hooks
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first styling
- **Firebase** - Authentication
- **Framer Motion** - Smooth animations
- **React Router** - Client-side routing
- **Zustand** - State management
- **Axios** - API client

## 🐛 Debugging

### Check if backend is running:
```bash
curl http://localhost:5000/health
```

### Check Vite dev server:
- Should be on `http://localhost:5173`
- Hot reload should work automatically
- Check browser console for errors

### Common Errors:

**"Network Error"**
- Backend not running
- Wrong API URL in `.env`

**"Firebase: Error (auth/...)"**
- Firebase not configured
- Wrong credentials in `.env`

**"Module not found"**
- Run `npm install` again
- Delete `node_modules` and reinstall

## 💡 Tips

- Use React DevTools for debugging
- Check Network tab for API calls
- Use the theme toggle to test dark mode
- All routes are protected except landing, login, signup

## 🎨 Customization

### Change Theme Colors:
Edit `src/index.css` - modify CSS variables in `:root` and `.dark`

### Add New Routes:
Edit `src/App.jsx` - add routes in `AppRoutes` component

### Create New Pages:
Add to `src/pages/` directory and import in `App.jsx`

---

**Need Help?** Check the console for errors or refer to the main documentation.
