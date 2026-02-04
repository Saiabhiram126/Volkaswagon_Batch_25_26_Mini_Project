const express = require('express');
const router = express.Router();
const { readData, writeData } = require('../utils/database');

// Search buses
router.post('/search', (req, res) => {
  try {
    const { from, to, date } = req.body;
    
    const buses = readData('buses');
    
    // Filter buses based on search criteria (case-insensitive)
    const filteredBuses = buses.filter(bus => 
      bus.from.toLowerCase() === (from || '').toLowerCase() &&
      bus.to.toLowerCase() === (to || '').toLowerCase() &&
      bus.availableDates.includes(date)
    );
    
    console.log(`Search: ${from} → ${to} on ${date}, Found: ${filteredBuses.length} buses`);
    
    res.json({ buses: filteredBuses });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get bus details
router.get('/:id', (req, res) => {
  try {
    const buses = readData('buses');
    const bus = buses.find(b => b.id === parseInt(req.params.id));
    
    if (!bus) {
      return res.status(404).json({ error: 'Bus not found' });
    }
    
    res.json({ bus });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get available seats
router.get('/:id/seats', (req, res) => {
  try {
    const { date } = req.query;
    const bookings = readData('bookings');
    
    // Get booked seats for this bus and date
    const bookedSeats = bookings
      .filter(b => b.busId === parseInt(req.params.id) && b.date === date && b.status !== 'cancelled')
      .flatMap(b => b.seats);
    
    res.json({ bookedSeats });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
