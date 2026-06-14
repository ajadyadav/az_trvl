// ==========================================
// DATE INITIALIZER
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Set default dates
    const today = new Date();
    
    // Tomorrow
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Day after tomorrow
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

    // Format to YYYY-MM-DD
    const formatDate = (date) => {
        const d = new Date(date);
        let month = '' + (d.getMonth() + 1);
        let day = '' + d.getDate();
        const year = d.getFullYear();

        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;

        return [year, month, day].join('-');
    };

    // Set flights dates
    const departureInput = document.getElementById('departure');
    const returnInput = document.getElementById('returnDate');
    
    if (departureInput) {
        departureInput.value = formatDate(tomorrow);
        departureInput.min = formatDate(today);
    }
    
    if (returnInput) {
        returnInput.min = formatDate(tomorrow);
    }

    // Set hotels dates
    const checkInInput = document.getElementById('checkIn');
    const checkOutInput = document.getElementById('checkOut');
    
    if (checkInInput) {
        checkInInput.value = formatDate(tomorrow);
        checkInInput.min = formatDate(today);
    }
    if (checkOutInput) {
        checkOutInput.value = formatDate(dayAfterTomorrow);
        checkOutInput.min = formatDate(tomorrow);
    }

    // Handle checkIn date change to automatically adjust checkOut min and value
    if (checkInInput && checkOutInput) {
        checkInInput.addEventListener('change', () => {
            const selectedInDate = new Date(checkInInput.value);
            const nextDay = new Date(selectedInDate);
            nextDay.setDate(nextDay.getDate() + 1);
            
            checkOutInput.min = formatDate(nextDay);
            if (new Date(checkOutInput.value) <= selectedInDate) {
                checkOutInput.value = formatDate(nextDay);
            }
        });
    }

    // Nav Bar click switches search form tabs
    const navItems = document.querySelectorAll('.main-nav .nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active from all nav items
            navItems.forEach(nav => nav.classList.remove('active'));
            // Add active to clicked nav item
            item.classList.add('active');
            
            const target = item.getAttribute('data-target');
            if (target === 'flights' || target === 'hotels') {
                switchSearchTab(target);
            }
        });
    });
});

// ==========================================
// SEARCH TAB SWITCHER (FLIGHTS vs HOTELS)
// ==========================================
function switchSearchTab(tab) {
    const flightsForm = document.getElementById('flights-form');
    const hotelsForm = document.getElementById('hotels-form');
    const tabButtons = document.querySelectorAll('.search-tabs .tab-btn');
    const navItems = document.querySelectorAll('.main-nav .nav-item');

    // Update active tab buttons
    tabButtons.forEach(btn => {
        if (btn.outerHTML.includes(tab === 'flights' ? 'Flights' : 'Hotels')) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Update active nav items
    navItems.forEach(nav => {
        if (nav.getAttribute('data-target') === tab) {
            nav.classList.add('active');
        } else {
            nav.classList.remove('active');
        }
    });

    // Show/Hide forms
    if (tab === 'flights') {
        flightsForm.classList.add('active');
        hotelsForm.classList.remove('active');
    } else {
        flightsForm.classList.remove('active');
        hotelsForm.classList.add('active');
    }
}

// ==========================================
// TRIP TYPE TOGGLE
// ==========================================
function toggleTripType(type) {
    const returnGroup = document.getElementById('return-date-group');
    const returnInput = document.getElementById('returnDate');
    const returnLabel = document.getElementById('return-label');

    if (type === 'oneway') {
        returnGroup.classList.add('disabled');
        returnInput.disabled = true;
        returnInput.required = false;
        returnInput.value = '';
        returnLabel.textContent = 'Return (Book Round Trip)';
    } else if (type === 'roundtrip') {
        returnGroup.classList.remove('disabled');
        returnInput.disabled = false;
        returnInput.required = true;
        returnLabel.textContent = 'Return';
        
        // Default return date to 3 days after departure
        const depVal = document.getElementById('departure').value;
        if (depVal) {
            const depDate = new Date(depVal);
            const retDate = new Date(depDate);
            retDate.setDate(retDate.getDate() + 3);
            
            const formatDate = (d) => {
                let month = '' + (d.getMonth() + 1);
                let day = '' + d.getDate();
                const year = d.getFullYear();
                if (month.length < 2) month = '0' + month;
                if (day.length < 2) day = '0' + day;
                return [year, month, day].join('-');
            };
            returnInput.min = depVal;
            returnInput.value = formatDate(retDate);
        }
    } else if (type === 'multicity') {
        returnGroup.classList.add('disabled');
        returnInput.disabled = true;
        returnInput.required = false;
        returnInput.value = '';
        returnLabel.textContent = 'Return';
        alert('Multi-City flights search configuration will be supported in upcoming iterations.');
    }
}

// ==========================================
// LOCATION SWAPPER
// ==========================================
function swapLocations() {
    const fromInput = document.getElementById('flight-from');
    const toInput = document.getElementById('flight-to');
    
    // Quick swap values
    const tempVal = fromInput.value;
    fromInput.value = toInput.value;
    toInput.value = tempVal;

    // Swap airport labels if matches pattern "City (CODE)"
    const extractCode = (str) => {
        const matches = str.match(/\(([^)]+)\)/);
        return matches ? matches[1] : '';
    };

    const fromCode = extractCode(fromInput.value);
    const toCode = extractCode(toInput.value);

    // Find sibling code elements and update
    const fromGroup = fromInput.closest('.search-field-group');
    const toGroup = toInput.closest('.search-field-group');

    if (fromGroup && toGroup) {
        const fromCodeSpan = fromGroup.querySelector('.airport-code');
        const toCodeSpan = toGroup.querySelector('.airport-code');
        
        if (fromCodeSpan && fromCode) fromCodeSpan.textContent = fromCode;
        if (toCodeSpan && toCode) toCodeSpan.textContent = toCode;
    }

    // Trigger visual spin feedback
    const swapBtn = document.querySelector('.swap-btn');
    swapBtn.style.transform = 'rotate(360deg)';
    setTimeout(() => {
        swapBtn.style.transform = '';
    }, 400);
}

// ==========================================
// TRAVELER POPUP MANAGER
// ==========================================
let travelerCounts = {
    adults: 1,
    children: 0,
    infants: 0
};
let selectedClass = 'Economy';

function toggleTravelerPopup(event) {
    event.stopPropagation();
    const popup = document.getElementById('traveler-popup');
    popup.classList.toggle('active');
}

// Close popup on click outside
window.addEventListener('click', (e) => {
    const popup = document.getElementById('traveler-popup');
    if (popup && popup.classList.contains('active')) {
        popup.classList.remove('active');
    }
});

function adjustCount(type, amount) {
    const currentVal = travelerCounts[type];
    const newVal = currentVal + amount;

    // Validation rules
    if (type === 'adults' && newVal < 1) return; // Must have at least 1 adult
    if (newVal < 0) return; // Cannot go negative
    if (type === 'infants' && newVal > travelerCounts.adults) {
        alert('Infant count cannot exceed adult count (1 infant per adult maximum).');
        return;
    }

    travelerCounts[type] = newVal;
    document.getElementById(`qty-${type}`).textContent = newVal;

    // Auto adjust infant if adult drops below infant count
    if (type === 'adults' && travelerCounts.infants > newVal) {
        travelerCounts.infants = newVal;
        document.getElementById('qty-infants').textContent = newVal;
    }
}

function selectClass(className) {
    selectedClass = className;
}

function applyTravelerInfo() {
    const totalTravelers = travelerCounts.adults + travelerCounts.children + travelerCounts.infants;
    const travelerText = totalTravelers === 1 ? '1 Traveller' : `${totalTravelers} Travellers`;
    
    // Display updates
    const displayText = `${travelerText}, ${selectedClass}`;
    document.getElementById('travellers-display').textContent = displayText;
    
    // Hidden input updates for backend
    document.getElementById('travellers-count').value = totalTravelers;
    document.getElementById('class-type').value = selectedClass;

    // Close popup
    document.getElementById('traveler-popup').classList.remove('active');
}

// ==========================================
// DEALS FILTERING
// ==========================================
function filterDeals(category) {
    // Update active tab styling
    const tabs = document.querySelectorAll('.deals-tabs .deal-tab');
    tabs.forEach(tab => {
        if (tab.textContent.toLowerCase().includes(category)) {
            tab.classList.add('active');
        } else if (category === 'all' && tab.textContent.toLowerCase().includes('all')) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });

    // Filter cards
    const cards = document.querySelectorAll('.deals-grid .deal-card');
    cards.forEach(card => {
        const cardCategory = card.getAttribute('data-category');
        
        if (category === 'all' || cardCategory === category) {
            card.style.display = 'flex';
            // Trigger animation
            card.style.opacity = '0';
            card.style.transform = 'scale(0.95) translateY(5px)';
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'scale(1) translateY(0)';
                card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            }, 50);
        } else {
            card.style.display = 'none';
        }
    });
}
