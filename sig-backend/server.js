const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');
const { Graph, haversineDistance } = require('./utils');

const app = express();
const port = 3001;

app.use(bodyParser.json());
app.use(cors());

// Set CORS headers for preflight requests
app.options('*', cors());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'sig'
});

db.connect(err => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    throw err;
  }
  console.log('MySQL Connected...');
});

const campusLocation = { latitude: -6.9467, longitude: 107.5938 }; // Koordinat kampus

app.post('/add-location', async (req, res) => {
  const { name, address } = req.body;

  try {
    const response = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
    const { lat, lon, display_name } = response.data[0];

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);
    const distance_to_campus = haversineDistance({ latitude, longitude }, campusLocation);

    const newLocation = { name, address: display_name, latitude, longitude, distance_to_campus };
    console.log(newLocation);

    db.query('INSERT INTO locations SET ?', newLocation, (err, result) => {
      if (err) {
        console.error('Error inserting into database:', err);
        res.status(500).send('Error adding location to database');
        return;
      }
      res.send('Location added');
    });
  } catch (error) {
    console.error('Error fetching location data:', error);
    res.status(500).send('Error fetching location data');
  }
});

app.get('/locations', (req, res) => {
  db.query('SELECT * FROM locations', (err, results) => {
    if (err) {
      console.error('Error fetching locations from database:', err);
      res.status(500).send('Error fetching locations');
      return;
    }
    res.json(results);
  });
});

app.put('/edit-location/:id', async (req, res) => {
  const { id } = req.params;
  const { name, address } = req.body;

  try {
    const response = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
    const { lat, lon, display_name } = response.data[0];

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);
    const distance_to_campus = haversineDistance({ latitude, longitude }, campusLocation);

    const updatedLocation = { name, address: display_name, latitude, longitude, distance_to_campus };

    db.query('UPDATE locations SET ? WHERE id = ?', [updatedLocation, id], (err, result) => {
      if (err) {
        console.error('Error updating location in database:', err);
        res.status(500).send('Error updating location');
        return;
      }
      res.send('Location updated');
    });
  } catch (error) {
    console.error('Error fetching location data:', error);
    res.status(500).send('Error fetching location data');
  }
});

app.delete('/delete-location/:id', (req, res) => {
  const { id } = req.params;

  db.query('DELETE FROM locations WHERE id = ?', [id], (err, result) => {
    if (err) {
      console.error('Error deleting location from database:', err);
      res.status(500).send('Error deleting location');
      return;
    }
    res.send('Location deleted');
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
