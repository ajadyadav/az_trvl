import { auth, db, onAuthStateChanged, doc, getDoc, setDoc, updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from './firebase-config.js';

// Mock Bookings Data
const MOCK_FLIGHTS = [
    {
        id: "FL-902847",
        airline: "AeroIndia",
        airlineLogo: "fa-solid fa-plane-departure",
        from: "Mumbai (BOM)",
        to: "New Delhi (DEL)",
        departureDate: "Jun 28, 2026",
        departureTime: "07:30 AM",
        arrivalDate: "Jun 28, 2026",
        arrivalTime: "09:45 AM",
        duration: "2h 15m (Non-stop)",
        passenger: "User",
        seat: "12A (Window)",
        price: "₹5,499",
        status: "upcoming",
        airlineCode: "AI-304"
    },
    {
        id: "FL-873910",
        airline: "IndigoFly",
        airlineLogo: "fa-solid fa-plane-up",
        from: "New Delhi (DEL)",
        to: "Goa (GOI)",
        departureDate: "Jan 12, 2026",
        departureTime: "02:15 PM",
        arrivalDate: "Jan 12, 2026",
        arrivalTime: "04:50 PM",
        duration: "2h 35m (Non-stop)",
        passenger: "User",
        seat: "15C (Aisle)",
        price: "₹6,850",
        status: "completed",
        airlineCode: "6E-502"
    },
    {
        id: "FL-582910",
        airline: "SkyLux Air",
        airlineLogo: "fa-solid fa-plane-up",
        from: "Mumbai (BOM)",
        to: "Dubai (DXB)",
        departureDate: "Mar 10, 2026",
        departureTime: "10:00 PM",
        arrivalDate: "Mar 11, 2026",
        arrivalTime: "01:30 AM",
        duration: "4h 00m (Non-stop)",
        passenger: "User",
        seat: "02B (Business)",
        price: "₹28,900",
        status: "completed",
        airlineCode: "EK-506"
    }
];

const MOCK_HOTELS = [
    {
        id: "HT-204859",
        hotelName: "The Taj Mahal Palace",
        stars: 5,
        location: "Mumbai, India",
        checkIn: "Jun 30, 2026",
        checkOut: "Jul 03, 2026",
        nights: 3,
        roomType: "Luxury Sea View Suite",
        guests: "2 Guests, 1 Room",
        price: "₹74,999",
        status: "upcoming"
    },
    {
        id: "HT-183049",
        hotelName: "Marriott Goa Resort & Spa",
        stars: 5,
        location: "Goa, India",
        checkIn: "Jan 12, 2026",
        checkOut: "Jan 16, 2026",
        nights: 4,
        roomType: "Deluxe Garden View Room",
        guests: "2 Guests, 1 Room",
        price: "₹38,200",
        status: "completed"
    }
];

let currentCategory = 'flights'; // 'flights' or 'hotels'
let currentTimeFilter = 'upcoming'; // 'upcoming' or 'completed'

document.addEventListener('DOMContentLoaded', () => {
    // Auth Listener
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // Load User Info
            await loadUserProfile(user);
            
            // Set passenger name in mock bookings to matching display name
            const userName = user.displayName || 'Guest';
            MOCK_FLIGHTS.forEach(f => f.passenger = userName);
            
            // Render default view
            renderBookings();
            checkUrlTab();
        } else {
            // Re-route to authentication
            window.location.href = '/auth';
        }
    });

    // Form Event Listeners
    const profileForm = document.getElementById('profile-details-form');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileUpdate);
    }

    const passwordForm = document.getElementById('change-password-form');
    if (passwordForm) {
        passwordForm.addEventListener('submit', handlePasswordChange);
    }
});

// Load Profile Info from Auth / Firestore
async function loadUserProfile(user) {
    const sidebarName = document.getElementById('sidebar-name');
    const sidebarEmail = document.getElementById('sidebar-email');
    const nameInput = document.getElementById('profile-name-input');
    const emailInput = document.getElementById('profile-email-input');
    const phoneInput = document.getElementById('profile-phone-input');

    // Fallbacks
    sidebarName.textContent = user.displayName || 'Customer';
    sidebarEmail.textContent = user.email;
    nameInput.value = user.displayName || '';
    emailInput.value = user.email;

    try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.fullName) {
                sidebarName.textContent = data.fullName;
                nameInput.value = data.fullName;
            }
            if (data.phone) {
                phoneInput.value = data.phone;
            }
        }
    } catch (error) {
        console.error("Error fetching Firestore profile data: ", error);
    }
}

// Handle Profile Updates
async function handleProfileUpdate(e) {
    e.preventDefault();
    const saveBtn = document.getElementById('save-profile-btn');
    const alertDiv = document.getElementById('profile-alert');
    const nameInput = document.getElementById('profile-name-input');
    const phoneInput = document.getElementById('profile-phone-input');

    setLoading(saveBtn, true);
    alertDiv.style.display = 'none';

    try {
        const user = auth.currentUser;
        if (user) {
            const nameVal = nameInput.value;
            const phoneVal = phoneInput.value;

            // 1. Update Auth Display Name
            await updateProfile(user, { displayName: nameVal });

            // 2. Save user details to Firestore
            const docRef = doc(db, "users", user.uid);
            await setDoc(docRef, {
                uid: user.uid,
                fullName: nameVal,
                email: user.email,
                phone: phoneVal,
                updatedAt: new Date().toISOString()
            }, { merge: true });

            // 3. Update Header & Sidebar UI
            document.getElementById('sidebar-name').textContent = nameVal;
            document.getElementById('user-name-display').textContent = nameVal;
            const userInitial = document.getElementById('user-initial');
            const sidebarAvatar = document.getElementById('sidebar-avatar');
            if (userInitial) userInitial.textContent = nameVal.charAt(0).toUpperCase();
            if (sidebarAvatar) sidebarAvatar.textContent = nameVal.charAt(0).toUpperCase();

            // 4. Update internal passenger name for mock bookings
            MOCK_FLIGHTS.forEach(f => f.passenger = nameVal);
            if (currentCategory === 'flights') renderBookings();

            showAlert(alertDiv, 'success', 'Profile settings updated successfully.');
        }
    } catch (error) {
        console.error("Error updating profile details:", error);
        showAlert(alertDiv, 'danger', 'Failed to update profile settings: ' + error.message);
    } finally {
        setLoading(saveBtn, false);
    }
}

// Handle Password Changing
async function handlePasswordChange(e) {
    e.preventDefault();
    const changeBtn = document.getElementById('change-password-btn');
    const alertDiv = document.getElementById('password-alert');
    const currentPass = document.getElementById('current-password').value;
    const newPass = document.getElementById('new-password').value;
    const confirmPass = document.getElementById('confirm-new-password').value;

    alertDiv.style.display = 'none';

    if (newPass !== confirmPass) {
        showAlert(alertDiv, 'danger', 'Confirm password does not match the new password.');
        return;
    }

    setLoading(changeBtn, true);

    try {
        const user = auth.currentUser;
        if (user) {
            // 1. Re-authenticate user for safety
            const credential = EmailAuthProvider.credential(user.email, currentPass);
            await reauthenticateWithCredential(user, credential);

            // 2. Perform password update
            await updatePassword(user, newPass);
            showAlert(alertDiv, 'success', 'Your password has been changed successfully.');
            document.getElementById('change-password-form').reset();
        }
    } catch (error) {
        console.error("Password Update Error:", error);
        if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            showAlert(alertDiv, 'danger', 'Current password entered is incorrect.');
        } else if (error.code === 'auth/weak-password') {
            showAlert(alertDiv, 'danger', 'New password should be at least 6 characters.');
        } else {
            showAlert(alertDiv, 'danger', 'Failed to change password: ' + error.message);
        }
    } finally {
        setLoading(changeBtn, false);
    }
}

// TAB NAVIGATION: Sidebar Navigation Switching
window.switchProfileTab = function(tabName) {
    // Hide all panels
    document.querySelectorAll('.profile-tab-panel').forEach(panel => {
        panel.classList.remove('active');
    });

    // Show active panel
    const targetPanel = document.getElementById(`panel-${tabName}`);
    if (targetPanel) targetPanel.classList.add('active');

    // Update active class on navigation sidebar
    document.querySelectorAll('.sidebar-menu-btn').forEach(btn => {
        if (btn.getAttribute('data-tab') === tabName) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Set URL tab query
    const url = new URL(window.location);
    url.searchParams.set('tab', tabName);
    window.history.pushState({}, '', url);

    if (tabName === 'bookings') {
        renderBookings();
    }
};

// Switch Booking Category (Flights vs Hotels)
window.switchBookingCategory = function(category) {
    currentCategory = category;

    document.querySelectorAll('.cat-btn').forEach(btn => {
        if (btn.getAttribute('data-booking-type') === category) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    if (category === 'flights') {
        document.getElementById('list-flights').classList.add('active');
        document.getElementById('list-hotels').classList.remove('active');
    } else {
        document.getElementById('list-flights').classList.remove('active');
        document.getElementById('list-hotels').classList.add('active');
    }

    renderBookings();
};

// Switch Booking Time Filter (Upcoming vs Completed)
window.filterBookingsTime = function(timeFilter) {
    currentTimeFilter = timeFilter;

    document.querySelectorAll('.time-btn').forEach(btn => {
        if (btn.getAttribute('data-booking-time') === timeFilter) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    renderBookings();
};

// Render Bookings Markup
function renderBookings() {
    const listFlights = document.getElementById('list-flights');
    const listHotels = document.getElementById('list-hotels');

    // Helper to clear existing dynamic cards
    const clearList = (parentEl) => {
        const cards = parentEl.querySelectorAll('.booking-card');
        cards.forEach(card => card.remove());
    };

    if (currentCategory === 'flights') {
        clearList(listFlights);
        const filtered = MOCK_FLIGHTS.filter(f => f.status === currentTimeFilter);
        const emptyState = listFlights.querySelector('.empty-state');

        if (filtered.length === 0) {
            emptyState.style.display = 'flex';
        } else {
            emptyState.style.display = 'none';
            filtered.forEach(flight => {
                const card = document.createElement('div');
                card.className = 'booking-card flight-card';
                card.innerHTML = `
                    <div class="booking-card-header">
                        <div class="airline-info">
                            <div class="airline-logo-box"><i class="${flight.airlineLogo}"></i></div>
                            <div>
                                <h4>${flight.airline}</h4>
                                <span class="booking-code">${flight.airlineCode}</span>
                            </div>
                        </div>
                        <div class="booking-meta">
                            <span class="booking-id">ID: <strong>${flight.id}</strong></span>
                            <span class="status-badge badge-${flight.status}">${flight.status.toUpperCase()}</span>
                        </div>
                    </div>
                    
                    <div class="flight-route-details">
                        <div class="route-point">
                            <h3>${flight.from.substring(0, flight.from.indexOf(' '))}</h3>
                            <p class="airport">${flight.from.substring(flight.from.indexOf('('))}</p>
                            <p class="date-time">${flight.departureDate} | ${flight.departureTime}</p>
                        </div>
                        <div class="route-path">
                            <span class="duration-label">${flight.duration}</span>
                            <div class="path-line">
                                <span class="dot"></span>
                                <i class="fa-solid fa-plane"></i>
                                <span class="dot"></span>
                            </div>
                        </div>
                        <div class="route-point text-right">
                            <h3>${flight.to.substring(0, flight.to.indexOf(' '))}</h3>
                            <p class="airport">${flight.to.substring(flight.to.indexOf('('))}</p>
                            <p class="date-time">${flight.arrivalDate} | ${flight.arrivalTime}</p>
                        </div>
                    </div>

                    <div class="card-footer-info">
                        <div class="info-block">
                            <span>Passenger</span>
                            <p>${flight.passenger}</p>
                        </div>
                        <div class="info-block">
                            <span>Seat Assignment</span>
                            <p>${flight.seat}</p>
                        </div>
                        <div class="info-block text-right">
                            <span>Total Paid</span>
                            <p class="price-val">${flight.price}</p>
                        </div>
                    </div>
                `;
                listFlights.appendChild(card);
            });
        }
    } else {
        clearList(listHotels);
        const filtered = MOCK_HOTELS.filter(h => h.status === currentTimeFilter);
        const emptyState = listHotels.querySelector('.empty-state');

        if (filtered.length === 0) {
            emptyState.style.display = 'flex';
        } else {
            emptyState.style.display = 'none';
            filtered.forEach(hotel => {
                const card = document.createElement('div');
                card.className = 'booking-card hotel-card';
                
                let starsHtml = '';
                for (let i = 0; i < hotel.stars; i++) {
                    starsHtml += '<i class="fa-solid fa-star"></i>';
                }

                card.innerHTML = `
                    <div class="booking-card-header">
                        <div class="hotel-info">
                            <div class="hotel-icon-box"><i class="fa-solid fa-hotel"></i></div>
                            <div>
                                <h4>${hotel.hotelName}</h4>
                                <div class="hotel-stars">${starsHtml}</div>
                            </div>
                        </div>
                        <div class="booking-meta">
                            <span class="booking-id">ID: <strong>${hotel.id}</strong></span>
                            <span class="status-badge badge-${hotel.status}">${hotel.status.toUpperCase()}</span>
                        </div>
                    </div>
                    
                    <div class="hotel-stay-details">
                        <div class="stay-point">
                            <span>Check-in</span>
                            <h3>${hotel.checkIn}</h3>
                            <p class="location-label"><i class="fa-solid fa-location-dot"></i> ${hotel.location}</p>
                        </div>
                        <div class="stay-duration">
                            <span class="duration-nights">${hotel.nights} Nights</span>
                            <div class="path-line">
                                <span class="dot"></span>
                                <i class="fa-solid fa-moon"></i>
                                <span class="dot"></span>
                            </div>
                        </div>
                        <div class="stay-point text-right">
                            <span>Check-out</span>
                            <h3>${hotel.checkOut}</h3>
                            <p class="room-spec">${hotel.roomType}</p>
                        </div>
                    </div>

                    <div class="card-footer-info">
                        <div class="info-block">
                            <span>Guests</span>
                            <p>${hotel.guests}</p>
                        </div>
                        <div class="info-block">
                            <span>Status Details</span>
                            <p>${hotel.status === 'upcoming' ? 'Confirmed & Guaranteed' : 'Stay Completed'}</p>
                        </div>
                        <div class="info-block text-right">
                            <span>Total Paid</span>
                            <p class="price-val">${hotel.price}</p>
                        </div>
                    </div>
                `;
                listHotels.appendChild(card);
            });
        }
    }
}

// Check URL param tab
function checkUrlTab() {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab && ['profile', 'bookings', 'password'].includes(tab)) {
        switchProfileTab(tab);
    }
}

// Alert styling triggers
function showAlert(alertDiv, type, message) {
    alertDiv.className = `dashboard-alert alert-${type}`;
    alertDiv.innerHTML = `<i class="fa-solid ${type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}"></i> ${message}`;
    alertDiv.style.display = 'block';
    
    // Auto-scroll to alert
    alertDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Submit button loading animation helper
function setLoading(button, isLoading) {
    const btnText = button.querySelector('.btn-text');
    const spinner = button.querySelector('.loader-icon');
    
    if (isLoading) {
        button.disabled = true;
        if (btnText) btnText.style.opacity = '0.5';
        if (spinner) spinner.style.display = 'inline-block';
    } else {
        button.disabled = false;
        if (btnText) btnText.style.opacity = '1';
        if (spinner) spinner.style.display = 'none';
    }
}
