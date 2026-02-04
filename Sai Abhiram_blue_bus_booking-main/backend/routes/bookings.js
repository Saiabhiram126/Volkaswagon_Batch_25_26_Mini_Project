const express = require('express');
const router = express.Router();
const { readData, writeData } = require('../utils/database');

// Create booking
router.post('/create', (req, res) => {
  try {
    const { busId, userId, date, seats, passengers, totalAmount } = req.body;
    
    console.log('Creating booking:', { busId, userId, date, seats: seats.length });
    
    const bookings = readData('bookings');
    const buses = readData('buses');
    
    // Find bus
    const bus = buses.find(b => b.id === busId);
    if (!bus) {
      console.error('Bus not found:', busId);
      return res.status(404).json({ error: 'Bus not found' });
    }
    
    // Check if seats are available
    const bookedSeats = bookings
      .filter(b => b.busId === busId && b.date === date && b.status !== 'cancelled')
      .flatMap(b => b.seats);
    
    const unavailableSeats = seats.filter(seat => bookedSeats.includes(seat));
    if (unavailableSeats.length > 0) {
      console.error('Seats unavailable:', unavailableSeats);
      return res.status(400).json({ error: 'Some seats are already booked', unavailableSeats });
    }
    
    // Create booking
    const newBooking = {
      id: bookings.length + 1,
      bookingId: `BK${Date.now()}`,
      busId,
      userId,
      busName: bus.name,
      from: bus.from,
      to: bus.to,
      date,
      seats,
      passengers,
      totalAmount,
      status: 'confirmed',
      createdAt: new Date().toISOString()
    };
    
    bookings.push(newBooking);
    writeData('bookings', bookings);
    
    console.log('Booking created:', newBooking.bookingId);
    
    res.json({ 
      message: 'Booking created successfully',
      booking: newBooking
    });
  } catch (error) {
    console.error('Booking create error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Confirm payment
router.post('/:id/confirm', (req, res) => {
  try {
    const bookings = readData('bookings');
    const booking = bookings.find(b => b.id === parseInt(req.params.id));
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    booking.status = 'confirmed';
    booking.paymentDate = new Date().toISOString();
    
    writeData('bookings', bookings);
    
    res.json({ 
      message: 'Payment confirmed successfully',
      booking
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user bookings
router.get('/user/:userId', (req, res) => {
  try {
    const bookings = readData('bookings');
    const userBookings = bookings.filter(b => b.userId === parseInt(req.params.userId));
    
    res.json({ bookings: userBookings });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get booking details
router.get('/:id', (req, res) => {
  try {
    const bookings = readData('bookings');
    const booking = bookings.find(b => b.id === parseInt(req.params.id));
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    res.json({ booking });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
