import {
    auth, db,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    GoogleAuthProvider,
    signInWithPopup,
    RecaptchaVerifier,
    PhoneAuthProvider,
    linkWithCredential,
    doc, setDoc, getDoc
} from './firebase-config.js';

// ---- State ----
let confirmationResultId = null;  // stores verificationId from phone auth
let pendingUser = null;           // stores user after email/password creation, before phone link

document.addEventListener('DOMContentLoaded', () => {
    const loginForm        = document.getElementById('login-form');
    const signupForm       = document.getElementById('signup-form');
    const otpForm          = document.getElementById('otp-form');
    const loginBtn         = document.getElementById('login-btn');
    const signupBtn        = document.getElementById('signup-btn');
    const verifyOtpBtn     = document.getElementById('verify-otp-btn');
    const cancelOtpBtn     = document.getElementById('cancel-otp-btn');
    const googleLoginBtn   = document.getElementById('google-login-btn');
    const googleSignupBtn  = document.getElementById('google-signup-btn');
    const loginError       = document.getElementById('login-error');
    const signupError      = document.getElementById('signup-error');
    const otpError         = document.getElementById('otp-error');

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

    // ---- Helper: show OTP screen ----
    function showOtpScreen(phoneNumber) {
        document.getElementById('signup-form-container').classList.remove('active');
        document.getElementById('otp-form-container').classList.add('active');
        document.getElementById('display-phone-number').textContent = phoneNumber;
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
                phoneNumber: user.phoneNumber || extraData.phoneNumber || '',
                createdAt: new Date().toISOString(),
                role: 'customer',
                ...extraData
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
            'auth/invalid-phone-number': 'Invalid phone number. Use international format (e.g. +919876543210).',
            'auth/invalid-verification-code': 'Invalid OTP code. Please try again.',
            'auth/code-expired': 'OTP has expired. Please restart signup.',
            'auth/popup-closed-by-user': 'Sign-in popup was closed before completing.',
            'auth/popup-blocked': 'Popup was blocked by your browser. Please allow popups for this site.',
            'auth/cancelled-popup-request': 'Another sign-in popup is already open.',
            'auth/operation-not-allowed': 'This sign-in method is not enabled. Please enable it in Firebase Console under Authentication → Sign-in method.',
            'auth/provider-already-linked': 'Phone is already linked to this account.',
            'auth/credential-already-in-use': 'This phone number is already linked to another account.',
            'auth/network-request-failed': 'Network error. Please check your internet connection.',
            'auth/internal-error': 'An internal error occurred. Please try again.',
            'auth/unauthorized-domain': 'This domain is not authorized. Add it in Firebase Console under Authentication → Settings → Authorized domains.',
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

    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', () => handleGoogleAuth(loginError));
    }
    if (googleSignupBtn) {
        googleSignupBtn.addEventListener('click', () => handleGoogleAuth(signupError));
    }

    // ========================================
    // EMAIL/PASSWORD + PHONE SIGNUP FLOW
    // Step 1: Collect details → send OTP
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
                pendingUser = userCredential.user;

                // 2. Update Auth display name
                await updateProfile(pendingUser, { displayName: name });

                // 3. Set up invisible reCAPTCHA
                if (window.recaptchaVerifier) {
                    window.recaptchaVerifier.clear();
                }
                window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                    size: 'invisible',
                    callback: () => {}
                });

                // 4. Send SMS
                const phoneProvider = new PhoneAuthProvider(auth);
                confirmationResultId = await phoneProvider.verifyPhoneNumber(phone, window.recaptchaVerifier);

                // 5. Show OTP input screen
                showOtpScreen(phone);
                setLoading(signupBtn, false);

            } catch (error) {
                console.error('Signup Error:', error);
                // If user was created but OTP failed, delete the user to allow retry
                if (pendingUser) {
                    await pendingUser.delete().catch(() => {});
                    pendingUser = null;
                }
                showError(signupError, getErrorMessage(error.code));
                setLoading(signupBtn, false);
            }
        });
    }

    // ========================================
    // STEP 2: Verify OTP → link phone → save to Firestore
    // ========================================
    if (otpForm) {
        otpForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!pendingUser || !confirmationResultId) {
                showError(otpError, 'Session expired. Please restart signup.');
                return;
            }

            const otpCode = document.getElementById('otp-code').value.trim();
            setLoading(verifyOtpBtn, true);
            hideError(otpError);

            try {
                // Build phone credential from verificationId + entered OTP
                const phoneCredential = PhoneAuthProvider.credential(confirmationResultId, otpCode);

                // Link phone to the email/password user
                await linkWithCredential(pendingUser, phoneCredential);

                // Save full profile to Firestore
                await saveUserToFirestore(pendingUser, {
                    fullName: pendingUser.displayName,
                    phoneNumber: pendingUser.phoneNumber
                });

                pendingUser = null;
                confirmationResultId = null;

                window.location.href = '/';
            } catch (error) {
                console.error('OTP Verification Error:', error);
                showError(otpError, getErrorMessage(error.code));
                setLoading(verifyOtpBtn, false);
            }
        });
    }

    // ---- Cancel OTP → go back to signup form ----
    if (cancelOtpBtn) {
        cancelOtpBtn.addEventListener('click', async () => {
            // Delete the pending user so they can try again cleanly
            if (pendingUser) {
                await pendingUser.delete().catch(() => {});
                pendingUser = null;
            }
            confirmationResultId = null;
            window.cancelOtpFlow();
        });
    }
});
