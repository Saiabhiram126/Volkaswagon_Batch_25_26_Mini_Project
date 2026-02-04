const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize data files if they don't exist
const initializeData = () => {
  const files = {
    'users.json': [],
    'buses.json': [
      {
        id: 1,
        name: 'Luxury Express',
        from: 'Mumbai',
        to: 'Pune',
        departure: '06:00 AM',
        arrival: '09:30 AM',
        price: 500,
        totalSeats: 40,
        type: 'AC Sleeper',
        availableDates: ['2026-02-01', '2026-02-02', '2026-02-03', '2026-02-04', '2026-02-05']
      },
      {
        id: 2,
        name: 'Comfort Travels',
        from: 'Mumbai',
        to: 'Pune',
        departure: '08:00 AM',
        arrival: '11:30 AM',
        price: 400,
        totalSeats: 40,
        type: 'AC Seater',
        availableDates: ['2026-02-01', '2026-02-02', '2026-02-03', '2026-02-04', '2026-02-05']
      },
      {
        id: 3,
        name: 'Super Deluxe',
        from: 'Delhi',
        to: 'Jaipur',
        departure: '10:00 AM',
        arrival: '03:00 PM',
        price: 600,
        totalSeats: 40,
        type: 'AC Sleeper',
        availableDates: ['2026-02-01', '2026-02-02', '2026-02-03', '2026-02-04', '2026-02-05']
      },
      {
        id: 4,
        name: 'Swift Travels',
        from: 'Pune',
        to: 'Hyderabad',
        departure: '07:00 PM',
        arrival: '06:30 AM',
        price: 800,
        totalSeats: 40,
        type: 'AC Sleeper',
        availableDates: ['2026-02-01', '2026-02-02', '2026-02-03', '2026-02-04', '2026-02-05']
      },
      {
        id: 5,
        name: 'City Express',
        from: 'Pune',
        to: 'Hyderabad',
        departure: '08:00 PM',
        arrival: '07:30 AM',
        price: 700,
        totalSeats: 40,
        type: 'AC Seater',
        availableDates: ['2026-02-01', '2026-02-02', '2026-02-03', '2026-02-04', '2026-02-05']
      },
      {
        id: 6,
        name: 'Night Rider',
        from: 'Pune',
        to: 'Hyderabad',
        departure: '09:00 PM',
        arrival: '08:00 AM',
        price: 750,
        totalSeats: 40,
        type: 'AC Sleeper',
        availableDates: ['2026-02-01', '2026-02-02', '2026-02-03', '2026-02-04', '2026-02-05']
      }
    ],
    'bookings.json': []
  };

  for (const [filename, defaultData] of Object.entries(files)) {
    const filepath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filepath)) {
      fs.writeFileSync(filepath, JSON.stringify(defaultData, null, 2));
    }
  }
};

// Initialize data on load
initializeData();

// Read data from JSON file
const readData = (filename) => {
  try {
    const filepath = path.join(DATA_DIR, `${filename}.json`);
    const data = fs.readFileSync(filepath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return [];
  }
};

// Write data to JSON file
const writeData = (filename, data) => {
  try {
    const filepath = path.join(DATA_DIR, `${filename}.json`);
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing ${filename}:`, error);
    return false;
  }
};

module.exports = { readData, writeData };
