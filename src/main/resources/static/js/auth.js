import {
    auth, db,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    GoogleAuthProvider,
    signInWithPopup,
    doc, setDoc, getDoc
} from './firebase-config.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm       = document.getElementById('login-form');
    const signupForm      = document.getElementById('signup-form');
    const loginBtn        = document.getElementById('login-btn');
    const signupBtn       = document.getElementById('signup-btn');
    const googleLoginBtn  = document.getElementById('google-login-btn');
    const googleSignupBtn = document.getElementById('google-signup-btn');
    const loginError      = document.getElementById('login-error');
    const signupError     = document.getElementById('signup-error');

    // ---- Helper: toggle button loading state ----
    function setLoading(button, isLoading) {
        const btnText = button.querySelector('.btn-text');
        const spinner = button.querySelector('.loader-icon');
        button.disabled = isLoading;
        if (btnText) btnText.style.opacity = isLoading ? '0.5' : '1';
        if (spinner) spinner.style.display = isLoading ? 'inline-block' : 'none';
    }

    function showError(el, msg) {
        el.textContent = msg;
        el.style.display = 'block';
    }

    function hideError(el) {
        el.textContent = '';
        el.style.display = 'none';
    }

    // ---- Helper: save user to Firestore ----
    async function saveUserToFirestore(user, extraData = {}) {
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
            await setDoc(userRef, {
                uid: user.uid,
                fullName: user.displayName || extraData.fullName || '',
                email: user.email || '',
                phoneNumber: extraData.phoneNumber || '',
                createdAt: new Date().toISOString(),
                role: 'customer'
            });
        }
    }

    // ---- Helper: error messages ----
    function getErrorMessage(code) {
        const map = {
            'auth/invalid-credential': 'Invalid email or password.',
            'auth/user-not-found': 'Invalid email or password.',
            'auth/wrong-password': 'Invalid email or password.',
            'auth/email-already-in-use': 'An account with this email already exists.',
            'auth/weak-password': 'Password should be at least 6 characters.',
            'auth/invalid-email': 'Please enter a valid email address.',
            'auth/too-many-requests': 'Too many attempts. Please try again later.',
            'auth/popup-closed-by-user': 'Sign-in popup was closed before completing.',
            'auth/popup-blocked': 'Popup was blocked by your browser. Please allow popups for this site.',
            'auth/cancelled-popup-request': 'Another sign-in popup is already open.',
            'auth/operation-not-allowed': 'This sign-in method is not enabled. Please enable it in Firebase Console.',
            'auth/network-request-failed': 'Network error. Please check your internet connection.',
            'auth/unauthorized-domain': 'This domain is not authorized. Add it in Firebase Console → Authentication → Settings → Authorized domains.',
        };
        return map[code] || `Sign-in failed (${code}). Please check Firebase Console settings.`;
    }

    // ========================================
    // EMAIL/PASSWORD LOGIN
    // ========================================
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email    = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value;

            setLoading(loginBtn, true);
            hideError(loginError);

            try {
                await signInWithEmailAndPassword(auth, email, password);
                window.location.href = '/';
            } catch (error) {
                console.error('Login Error:', error);
                showError(loginError, getErrorMessage(error.code));
                setLoading(loginBtn, false);
            }
        });
    }

    // ========================================
    // GOOGLE SIGN-IN (Login & Signup)
    // ========================================
    async function handleGoogleAuth(errorEl) {
        hideError(errorEl);
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            await saveUserToFirestore(result.user);
            window.location.href = '/';
        } catch (error) {
            console.error('Google Auth Error:', error);
            showError(errorEl, getErrorMessage(error.code));
        }
    }

    if (googleLoginBtn)  googleLoginBtn.addEventListener('click',  () => handleGoogleAuth(loginError));
    if (googleSignupBtn) googleSignupBtn.addEventListener('click', () => handleGoogleAuth(signupError));

    // ========================================
    // EMAIL/PASSWORD + PHONE (no OTP) SIGNUP
    // ========================================
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name     = document.getElementById('signup-name').value.trim();
            const email    = document.getElementById('signup-email').value.trim();
            const password = document.getElementById('signup-password').value;
            const phone    = document.getElementById('signup-phone').value.trim();

            setLoading(signupBtn, true);
            hideError(signupError);

            try {
                // 1. Create Email/Password user
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // 2. Update Auth display name
                await updateProfile(user, { displayName: name });

                // 3. Save profile to Firestore (including phone, unverified)
                await setDoc(doc(db, 'users', user.uid), {
                    uid: user.uid,
                    fullName: name,
                    email: email,
                    phoneNumber: phone,
                    createdAt: new Date().toISOString(),
                    role: 'customer'
                });

                window.location.href = '/';
            } catch (error) {
                console.error('Signup Error:', error);
                showError(signupError, getErrorMessage(error.code));
                setLoading(signupBtn, false);
            }
        });
    }
});
