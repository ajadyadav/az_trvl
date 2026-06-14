import { auth, db, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, doc, setDoc } from './firebase-config.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const loginBtn = document.getElementById('login-btn');
    const signupBtn = document.getElementById('signup-btn');
    const loginError = document.getElementById('login-error');
    const signupError = document.getElementById('signup-error');

    // Handle Login
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            
            setLoading(loginBtn, true);
            loginError.style.display = 'none';

            try {
                await signInWithEmailAndPassword(auth, email, password);
                // Redirect to home page on successful login
                window.location.href = '/';
            } catch (error) {
                console.error("Login Error:", error);
                loginError.textContent = getErrorMessage(error.code);
                loginError.style.display = 'block';
                setLoading(loginBtn, false);
            }
        });
    }

    // Handle Signup
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('signup-name').value;
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;

            setLoading(signupBtn, true);
            signupError.style.display = 'none';

            try {
                // 1. Create user in Firebase Auth
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // 2. Update Auth Profile with Name
                await updateProfile(user, { displayName: name });

                // 3. Save user data to Firestore
                await setDoc(doc(db, "users", user.uid), {
                    uid: user.uid,
                    fullName: name,
                    email: email,
                    createdAt: new Date().toISOString(),
                    role: "customer"
                });

                // Redirect to home page on successful signup
                window.location.href = '/';
            } catch (error) {
                console.error("Signup Error:", error);
                signupError.textContent = getErrorMessage(error.code);
                signupError.style.display = 'block';
                setLoading(signupBtn, false);
            }
        });
    }

    // Helper functions
    function setLoading(button, isLoading) {
        const btnText = button.querySelector('.btn-text');
        const spinner = button.querySelector('.loader-icon');
        
        if (isLoading) {
            button.disabled = true;
            btnText.style.opacity = '0.5';
            spinner.style.display = 'inline-block';
        } else {
            button.disabled = false;
            btnText.style.opacity = '1';
            spinner.style.display = 'none';
        }
    }

    function getErrorMessage(errorCode) {
        switch (errorCode) {
            case 'auth/invalid-credential':
            case 'auth/user-not-found':
            case 'auth/wrong-password':
                return 'Invalid email or password.';
            case 'auth/email-already-in-use':
                return 'An account with this email already exists.';
            case 'auth/weak-password':
                return 'Password should be at least 6 characters.';
            case 'auth/invalid-email':
                return 'Please enter a valid email address.';
            default:
                return 'An error occurred. Please try again later.';
        }
    }
});
