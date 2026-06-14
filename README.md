# AZ Travel Portal

A modern, full-featured travel booking portal built using **Spring Boot**, **Thymeleaf**, and **Firebase** (Authentication & Firestore). This web application provides a responsive and visually stunning interface for searching travel details, managing user accounts, and tracking bookings.

## 🚀 Features

- **Dynamic Homepage**: Clean landing page focusing on flights and hotels search fields and recommendations.
- **Firebase Authentication**: Integrated secure signup, login, and logout flows.
- **User Dashboard & Profile Management**:
  - **Manage Profile**: Update personal details (Full Name, Phone Number) with changes synced directly to Firestore.
  - **My Bookings**: Interactive panels separated into Flights (Upcoming/Completed) and Hotels (Upcoming/Completed) bookings.
  - **Change Password**: In-app password updates using secure Firebase authentication mechanisms.
- **Responsive Premium UI**: Glassmorphic elements, modern gradients, harmonious color palettes, and micro-interactions optimized for all device sizes.

## 🛠️ Tech Stack

- **Backend**: Java 17, Spring Boot 4.x
- **Frontend**: HTML5, Vanilla CSS3 (custom responsive styling), Javascript (ES6+)
- **Template Engine**: Thymeleaf
- **Database & Auth**: Firebase Authentication & Cloud Firestore
- **Build Tool**: Maven

## 📁 Project Structure

```text
az_trvl/
├── src/
│   ├── main/
│   │   ├── java/com/example/aztrvl/
│   │   │   ├── AztrvlApplication.java     # Spring Boot application entry point
│   │   │   └── controller/
│   │   │       └── HomeController.java    # Spring MVC endpoints (/login, /profile, etc.)
│   │   └── resources/
│   │       ├── static/
│   │       │   ├── css/
│   │       │   │   └── styles.css         # Main application styles & design tokens
│   │       │   └── js/
│   │       │       ├── firebase-config.js # Firebase initialization & exports
│   │       │       ├── auth.js            # Sign in, Sign up, and state checking
│   │       │       └── profile.js         # Profile actions & bookings dashboard logic
│   │       └── templates/
│   │           ├── index.html             # Main home search page
│   │           ├── auth.html              # Authentication (Login/Signup) page
│   │           └── profile.html           # User dashboard (bookings, profile, password)
├── pom.xml                                # Maven configuration
└── README.md                              # Project documentation
```

## ⚙️ Setup Instructions

### Prerequisites
- **Java Development Kit (JDK) 17** or higher installed.
- **Maven** installed (or use the included Maven wrapper `mvnw`).
- A **Firebase Project** set up on the [Firebase Console](https://console.firebase.google.com/).

### Firebase Configuration
1. Create a Web App within your Firebase project.
2. In the Firebase console, enable **Email/Password** sign-in under Authentication.
3. Enable **Cloud Firestore** database.
4. Locate your Web App configuration script snippet and copy the config details:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_AUTH_DOMAIN",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_STORAGE_BUCKET",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```
5. Update `src/main/resources/static/js/firebase-config.js` with your exact config parameters.

### Running Locally
To launch the Spring Boot dev server locally:

1. Clone or download this project to your local workspace.
2. Open a terminal in the project directory.
3. Run the following command:
   ```bash
   # On Windows
   ./mvnw spring-boot:run

   # On macOS/Linux
   ./mvnw spring-boot:run
   ```
4. Access the portal by navigating to: `http://localhost:8080` in your web browser.
