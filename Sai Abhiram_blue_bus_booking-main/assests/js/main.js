(function () {

  // API Configuration
  const API_URL = 'https://bus-booking-ory6.onrender.com/api';

  // Helper function to get current user
  function getCurrentUser() {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
  }

  // Handle navbar user display and logout
  function updateNavbarUser() {
    const user = getCurrentUser();
    const userNav = document.getElementById('userNav');
    const authNav = document.getElementById('authNav');
    const signupNav = document.getElementById('signupNav');
    const logoutNav = document.getElementById('logoutNav');
    const userName = document.getElementById('userName');
    const logoutBtn = document.getElementById('logoutBtn');

    if (user) {
      // Show user info, hide login/signup
      if (userNav) userNav.style.display = 'flex';
      if (authNav) authNav.style.display = 'none';
      if (signupNav) signupNav.style.display = 'none';
      if (logoutNav) logoutNav.style.display = 'flex';
      if (userName) userName.textContent = '👤 ' + (user.name || user.email);
      
      if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
          e.preventDefault();
          localStorage.removeItem('currentUser');
          localStorage.removeItem('authToken');
          localStorage.removeItem('currentBooking');
          sessionStorage.clear();
          window.location.href = 'index.html';
        });
      }
    } else {
      // Show login/signup, hide user info
      if (userNav) userNav.style.display = 'none';
      if (authNav) authNav.style.display = 'flex';
      if (signupNav) signupNav.style.display = 'flex';
      if (logoutNav) logoutNav.style.display = 'none';
    }
  }

  // Update navbar on page load
  document.addEventListener('DOMContentLoaded', updateNavbarUser);

  // SEARCH HELPERS
  function saveSearch(from, to, date) {
    sessionStorage.setItem('search', JSON.stringify({ from, to, date }));
  }

  function getSearch() {
    return JSON.parse(sessionStorage.getItem('search') || 'null');
  }

  // Clear old localStorage data on page load
  if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
    // Clear old booking system data
    const keysToKeep = ['authToken', 'currentUser'];
    Object.keys(localStorage).forEach(key => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    });
    sessionStorage.clear();
  }

  // HOME PAGE – SEARCH
  const searchForm = document.getElementById('searchForm');
  if (searchForm) {
    searchForm.addEventListener('submit', async e => {
      e.preventDefault();
      
      // Get the actual values from inputs
      let from = document.getElementById('from').value.trim();
      let to = document.getElementById('to').value.trim();
      const date = document.getElementById('date').value.trim();
      
      if (!from || !to || !date) {
        alert('Please fill all fields');
        return;
      }
      
      saveSearch(from, to, date);
      
      // Log what we're searching
      console.log(`Searching for: ${from} → ${to} on ${date}`);
      
      // Fetch buses from backend
      try {
        const response = await fetch(`${API_URL}/buses/search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ from, to, date })
        });
        
        if (!response.ok) throw new Error('Failed to search buses');
        
        const data = await response.json();
        console.log(`Found ${data.buses.length} buses`);
        localStorage.setItem('searchResults', JSON.stringify(data.buses));
        window.location.href = 'bus_list.html';
      } catch (error) {
        console.error('Search error:', error);
        alert('Failed to search buses. Make sure you enter correct city names.');
      }
    });

    const s = getSearch();
    if (s) {
      document.getElementById('from').value = s.from;
      document.getElementById('to').value = s.to;
      document.getElementById('date').value = s.date;
    }
  }

  // BUS LIST PAGE
  const busContainer = document.getElementById('busContainer');
  if (busContainer) {
    const searchResults = JSON.parse(localStorage.getItem('searchResults') || '[]');
    const search = getSearch();
    
    // Display search info
    if (search) {
      const searchInfo = document.createElement('div');
      searchInfo.className = 'alert alert-info mb-3';
      searchInfo.innerHTML = `<strong>Search Results:</strong> ${search.from} → ${search.to} on ${search.date}`;
      busContainer.parentElement.insertBefore(searchInfo, busContainer);
    }
    
    if (searchResults.length === 0) {
      busContainer.innerHTML = '<p class="text-center">No buses found for your search.</p>';
    } else {
      busContainer.innerHTML = '';
      searchResults.forEach(bus => {
        const div = document.createElement('div');
        div.className = 'mb-3 p-3 border rounded';
        div.innerHTML = `
          <h5>${bus.name}</h5>
          <p>${bus.type} • Fare: ₹${bus.price}/seat</p>
          <p><strong>${bus.departure}</strong> → <strong>${bus.arrival}</strong></p>
          <p>Available Seats: ${bus.totalSeats}</p>
          <button class="btn btn-primary">Select Seats</button>
        `;
        div.querySelector('button').addEventListener('click', () => {
          localStorage.setItem('selectedBus', JSON.stringify(bus));
          window.location.href = 'seat_selection.html';
        });
        busContainer.appendChild(div);
      });
    }
  }

  // SEAT SELECTION PAGE
  const seatsDiv = document.getElementById('seats');
  if (seatsDiv) {
    const bus = JSON.parse(localStorage.getItem('selectedBus') || 'null');
    const search = getSearch();
    
    if (!bus || !search) {
      alert('No bus selected');
      window.location.href = 'index.html';
      return;
    }

    document.getElementById('busInfo').innerHTML =
      `<h5>${bus.name} — ${bus.type} • ₹${bus.price}/seat</h5>`;

    let booked = [];
    const selected = new Set(JSON.parse(localStorage.getItem('selectedSeats') || '[]'));

    // Fetch booked seats from backend
    fetch(`${API_URL}/buses/${bus.id}/seats?date=${search.date}`)
      .then(res => res.json())
      .then(data => {
        booked = data.bookedSeats || [];
        renderSeats();
      })
      .catch(err => {
        console.error('Error fetching seats:', err);
        renderSeats();
      });

    function renderSeats() {
      seatsDiv.innerHTML = '';
      const isSleeper = bus.type.toLowerCase().includes('sleeper');
      let seatNum = 1;

      if (isSleeper) {
        // Sleeper Layout
        const upperDiv = document.createElement('div');
        upperDiv.className = 'bus-section';
        upperDiv.innerHTML = '<div class="section-title">🛏️ Upper Berths</div>';
        const upperGrid = document.createElement('div');
        upperGrid.className = 'seats-grid';
        upperGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';

        const lowerDiv = document.createElement('div');
        lowerDiv.className = 'bus-section';
        lowerDiv.innerHTML = '<div class="section-title">🛏️ Lower Berths</div>';
        const lowerGrid = document.createElement('div');
        lowerGrid.className = 'seats-grid';
        lowerGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';

        for (let i = 0; i < 20; i++) upperGrid.appendChild(createSeatBtn(seatNum++));
        for (let i = 0; i < 20; i++) lowerGrid.appendChild(createSeatBtn(seatNum++));

        upperDiv.appendChild(upperGrid);
        lowerDiv.appendChild(lowerGrid);
        seatsDiv.appendChild(upperDiv);
        seatsDiv.appendChild(lowerDiv);
      } else {
        // Seater Layout
        const rows = 10;
        const cols = 4;
        const sectionDiv = document.createElement('div');
        sectionDiv.className = 'bus-section';
        sectionDiv.innerHTML = '<div class="section-title">💺 Seating Layout</div>';

        const grid = document.createElement('div');
        grid.className = 'seats-grid';
        grid.style.gridTemplateColumns = 'repeat(4, 1fr)';

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const btn = createSeatBtn(seatNum++);
            if (c === 1) btn.style.marginRight = '20px';
            grid.appendChild(btn);
          }
        }
        sectionDiv.appendChild(grid);
        seatsDiv.appendChild(sectionDiv);
      }

      // LEGEND
      const legend = document.createElement('div');
      legend.className = 'legend mt-4 d-flex justify-content-center gap-4';

      const items = [
        { colorClass: 'btn-outline-secondary', text: 'Available' },
        { colorClass: 'btn-success', text: 'Selected' },
        { colorClass: 'btn-danger', text: 'Booked' }
      ];

      items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'd-flex align-items-center gap-2';
        div.innerHTML = `<button class="btn ${item.colorClass}" style="width:30px; height:30px;" disabled></button> <span>${item.text}</span>`;
        legend.appendChild(div);
      });

      seatsDiv.appendChild(legend);
      updateProceedButton();
    }

    function createSeatBtn(num) {
      const btn = document.createElement('button');
      btn.className = 'btn seat btn-sm m-1';
      btn.textContent = num;

      if (booked.includes(num)) {
        btn.classList.add('btn-danger');
        btn.disabled = true;
      } else if (selected.has(String(num))) {
        btn.classList.add('btn-success');
      } else {
        btn.classList.add('btn-outline-secondary');
      }

      btn.addEventListener('click', () => {
        if (selected.has(String(num))) {
          selected.delete(String(num));
          btn.classList.remove('btn-success');
          btn.classList.add('btn-outline-secondary');
        } else {
          selected.add(String(num));
          btn.classList.remove('btn-outline-secondary');
          btn.classList.add('btn-success');
        }
        localStorage.setItem('selectedSeats', JSON.stringify([...selected]));
        updateProceedButton();
      });

      return btn;
    }

    function updateProceedButton() {
      const proceedBtn = document.getElementById('proceedBtn');
      if (proceedBtn) {
        proceedBtn.disabled = selected.size === 0;
        if (selected.size > 0) {
          const total = selected.size * bus.price;
          proceedBtn.textContent = `Proceed (${selected.size} seats - ₹${total})`;
        } else {
          proceedBtn.textContent = 'Select Seats';
        }
      }
    }

    const proceedBtn = document.getElementById('proceedBtn');
    if (proceedBtn) {
      proceedBtn.addEventListener('click', () => {
        if (selected.size === 0) {
          alert('Please select at least one seat');
          return;
        }
        window.location.href = 'passenger_details.html';
      });
    }
  }

  // PASSENGER DETAILS PAGE
  const passengerList = document.getElementById('passengerList');
  if (passengerList) {
    const seats = JSON.parse(localStorage.getItem('selectedSeats') || '[]');
    const bus = JSON.parse(localStorage.getItem('selectedBus') || 'null');

    if (seats.length === 0 || !bus) {
      alert('No seats selected');
      window.location.href = 'seat_selection.html';
      return;
    }

    seats.forEach(seat => {
      const div = document.createElement('div');
      div.className = 'mb-3 p-3 border rounded';
      div.innerHTML = `
        <h5>Seat ${seat}</h5>
        <input class="form-control mb-2" name="name_${seat}" placeholder="Passenger Name" required>
        <input class="form-control mb-2" name="age_${seat}" type="number" placeholder="Age" required>
        <select class="form-control" name="gender_${seat}" required>
          <option value="">Select Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
      `;
      passengerList.appendChild(div);
    });

    const passengerForm = document.getElementById('passengerForm');
    if (passengerForm) {
      passengerForm.addEventListener('submit', async e => {
        e.preventDefault();
        const search = getSearch();
        const user = getCurrentUser();

        if (!user) {
          alert('Please login first');
          window.location.href = 'login.html';
          return;
        }

        // Collect passenger details
        const passengers = seats.map(seat => ({
          seat: seat,
          name: document.querySelector(`[name="name_${seat}"]`).value,
          age: document.querySelector(`[name="age_${seat}"]`).value,
          gender: document.querySelector(`[name="gender_${seat}"]`).value
        }));

        const totalAmount = bus.price * seats.length;

        // Create booking via backend
        try {
          const response = await fetch(`${API_URL}/bookings/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              busId: bus.id,
              userId: user.id,
              date: search.date,
              seats: seats.map(Number),
              passengers: passengers,
              totalAmount: totalAmount
            })
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Booking failed');
          }

          const data = await response.json();
          console.log('Booking created:', data.booking);
          
          // Save the booking data
          localStorage.setItem('currentBooking', JSON.stringify(data.booking));
          localStorage.removeItem('paymentStatus');
          localStorage.removeItem('selectedSeats');
          localStorage.removeItem('selectedBus');

          // Redirect to payment page
          window.location.href = 'payment.html';
        } catch (error) {
          console.error('Booking error:', error);
          alert('Booking failed: ' + error.message);
        }
      });
    }
  }

  // CONFIRMATION PAGE
  const bookingSummary = document.getElementById('bookingSummary');
  if (bookingSummary) {
    console.log('Confirmation page - checking localStorage keys:', Object.keys(localStorage));
    
    let booking = JSON.parse(localStorage.getItem('currentBooking') || 'null');
    
    if (!booking) {
      // Try to get from different locations
      booking = JSON.parse(localStorage.getItem('booking') || 'null');
    }
    
    if (!booking) {
      console.error('No booking found in localStorage');
      bookingSummary.innerHTML = `
        <div class="alert alert-danger">
          <p><strong>Error:</strong> No booking found.</p>
          <p>Please start a new booking from the <a href="index.html">home page</a>.</p>
        </div>
      `;
      return;
    }

    const paymentStatus = localStorage.getItem('paymentStatus');
    const paymentStatusBookingId = localStorage.getItem('paymentStatusBookingId');
    const currentBookingId = booking.bookingId || booking.id;
    const isPaid = paymentStatus === 'paid' && String(paymentStatusBookingId) === String(currentBookingId);
    if (!isPaid) {
      window.location.href = 'payment.html';
      return;
    }
    
    console.log('Booking found:', booking);
    
    bookingSummary.innerHTML = `
      <h4 class="text-success mb-3">✅ Booking Confirmed!</h4>
      <div class="row">
        <div class="col-md-6">
          <p><strong>Booking ID:</strong> ${booking.bookingId}</p>
          <p><strong>Bus:</strong> ${booking.busName}</p>
          <p><strong>Route:</strong> ${booking.from} → ${booking.to}</p>
        </div>
        <div class="col-md-6">
          <p><strong>Date:</strong> ${booking.date}</p>
          <p><strong>Seats:</strong> ${booking.seats.join(', ')}</p>
          <p><strong>Total Amount:</strong> ₹${booking.totalAmount}</p>
          <p><strong>Status:</strong> <span class="badge bg-${booking.status === 'confirmed' ? 'success' : 'warning'}">${booking.status}</span></p>
        </div>
      </div>
      <div class="mt-3">
        <h6>Passengers:</h6>
        <ul>
          ${booking.passengers.map(p => `<li>Seat ${p.seat}: ${p.name} (${p.age}yrs, ${p.gender})</li>`).join('')}
        </ul>
      </div>
    `;

    // Hide payment button since we already paid
    const paymentBtn = document.getElementById('paymentBtn');
    if (paymentBtn) {
      paymentBtn.style.display = 'none';
    }
  }

  // PAYMENT GATEWAY
  window.initPayment = async function() {
    const booking = JSON.parse(localStorage.getItem('currentBooking') || 'null');
    
    if (!booking) {
      alert('No booking found');
      return;
    }

    // Confirm payment via backend
    try {
      const response = await fetch(`${API_URL}/bookings/${booking.id}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) throw new Error('Payment confirmation failed');

      const data = await response.json();
      localStorage.setItem('currentBooking', JSON.stringify(data.booking));
      window.location.href = 'payment_success.html';
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
    }
  };

  // LOGIN PAGE
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async e => {
      e.preventDefault();
      
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      try {
        const response = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        if (!response.ok) throw new Error('Login failed');

        const data = await response.json();
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        
        alert('Login successful!');
        window.location.href = 'index.html';
      } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please check your credentials.');
      }
    });
  }

  // SIGNUP PAGE
  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', async e => {
      e.preventDefault();
      
      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const phone = document.getElementById('phone').value;
      const password = document.getElementById('password').value;

      try {
        const response = await fetch(`${API_URL}/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, phone, password })
        });

        if (!response.ok) throw new Error('Signup failed');

        const data = await response.json();
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        
        alert('Signup successful!');
        window.location.href = 'index.html';
      } catch (error) {
        console.error('Signup error:', error);
        alert('Signup failed. User may already exist.');
      }
    });
  }

})();
