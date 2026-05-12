# 🚀 Quick Start Guide - LingoLearn Mobile

## Prerequisites
- Node.js installed
- Expo CLI installed (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Emulator installed
- Backend API running on port 8081

## Getting Started

### 1. Install Dependencies (Already Done ✅)
```bash
cd /home/aziz/Documents/startup/eng/eng_mob
npm install
```

### 2. Configure Environment
The `.env` file is already created with:
```
EXPO_PUBLIC_API_URL=http://localhost:8081/api/v1
```

**For physical device testing**, update to your machine's IP:
```
EXPO_PUBLIC_API_URL=http://192.168.1.XXX:8081/api/v1
```

### 3. Start the App
```bash
npm start
```

Then:
- Press `i` for iOS Simulator
- Press `a` for Android Emulator  
- Scan QR code with Expo Go app on your phone

## 📱 App Flow

### First Time User
1. **Landing Page** → Shows app features
2. **Sign Up** → Create account (username, email, password)
3. **Courses Tab** → Browse and search courses
4. **Course Detail** → View course info and enroll
5. **Lesson Player** → Complete video, text, and quiz steps
6. **Profile** → View stats and logout

### Returning User
1. **Landing Page** → Click "Sign In"
2. **Login** → Enter email and password
3. **Courses Tab** → Continue learning

## 🎨 Features Overview

### Authentication
- ✅ Login with email/password
- ✅ Register new account
- ✅ JWT token management with AsyncStorage
- ✅ Auto-redirect after login

### Courses
- ✅ Browse all courses
- ✅ Search by title/description
- ✅ Filter by level (A1-A2, B1, B2, C1-C2)
- ✅ View course details
- ✅ Enroll in courses

### Lesson Player
- ✅ **Video Steps**: Watch videos with progress tracking
- ✅ **Text Steps**: Read content with HTML rendering
- ✅ **Quiz Steps**: Answer multiple choice questions
- ✅ Step navigation (previous/next)
- ✅ Progress bar showing completion
- ✅ Auto-save progress to backend

### Profile
- ✅ View user info
- ✅ Stats display (placeholder)
- ✅ Logout functionality

## 🎯 Testing Checklist

### Authentication Flow
- [ ] Register new account
- [ ] Login with credentials
- [ ] Logout and login again
- [ ] Invalid credentials show error

### Course Browsing
- [ ] View course list
- [ ] Search for courses
- [ ] Filter by level
- [ ] View course details
- [ ] Enroll in a course

### Lesson Player
- [ ] Open a lesson
- [ ] Watch video step (progress bar updates)
- [ ] Read text step
- [ ] Complete quiz step
- [ ] Navigate between steps
- [ ] Complete lesson

### UI/UX
- [ ] All screens load without errors
- [ ] Buttons respond to touch
- [ ] Forms validate input
- [ ] Toast notifications appear
- [ ] Loading states show
- [ ] Error states display properly

## 🐛 Troubleshooting

### App won't start
```bash
# Clear cache and restart
npm start -- --clear
```

### Can't connect to API
1. Check backend is running: `curl http://localhost:8081/api/v1/courses`
2. For physical device, use your machine's IP in `.env`
3. Ensure firewall allows connections

### NativeWind styles not working
```bash
# Rebuild with cache clear
rm -rf node_modules/.cache
npm start -- --clear
```

### TypeScript errors
```bash
# Restart TypeScript server in your editor
# Or run: npx tsc --noEmit
```

## 📂 Key Files

- `src/app/_layout.tsx` - Root layout with providers
- `src/lib/api-client.ts` - API configuration
- `src/hooks/use-auth.ts` - Authentication logic
- `tailwind.config.js` - Styling configuration
- `.env` - Environment variables

## 🎨 Customization

### Change Colors
Edit `tailwind.config.js`:
```js
colors: {
  primary: "#58cc02", // Change this
  secondary: "#1cb0f6", // And this
}
```

### Change API URL
Edit `.env`:
```
EXPO_PUBLIC_API_URL=https://your-api.com/api/v1
```

### Add New Screens
1. Create file in `src/app/`
2. Use Expo Router conventions
3. Add to navigation if needed

## 📚 Documentation

- **Expo Router**: https://docs.expo.dev/router/introduction/
- **NativeWind**: https://www.nativewind.dev/
- **React Query**: https://tanstack.com/query/latest
- **Expo AV**: https://docs.expo.dev/versions/latest/sdk/av/

## 🎉 You're Ready!

The app is fully functional and ready for testing. Start the backend API, run `npm start`, and begin exploring!

**Happy Learning! 🌍📚**
