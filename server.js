const express = require('express');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data', 'trips.json');

// Ensure data directory and file exist
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify({ trips: [] }, null, 2));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function readData() {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ── Trips ──────────────────────────────────────────────────────────

app.get('/api/trips', (req, res) => {
  res.json(readData().trips);
});

app.get('/api/trips/:id', (req, res) => {
  const trip = readData().trips.find(t => t.id === req.params.id);
  if (!trip) return res.status(404).json({ error: 'Not found' });
  res.json(trip);
});

app.post('/api/trips', (req, res) => {
  const data = readData();
  const trip = {
    id: randomUUID(),
    name: req.body.name || '新行程',
    destination: req.body.destination || '',
    startDate: req.body.startDate || '',
    endDate: req.body.endDate || '',
    flights: [],
    hotels: [],
    activities: [],
    createdAt: new Date().toISOString(),
  };
  data.trips.push(trip);
  writeData(data);
  res.status(201).json(trip);
});

app.put('/api/trips/:id', (req, res) => {
  const data = readData();
  const idx = data.trips.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  data.trips[idx] = { ...data.trips[idx], ...req.body, id: req.params.id };
  writeData(data);
  res.json(data.trips[idx]);
});

app.delete('/api/trips/:id', (req, res) => {
  const data = readData();
  data.trips = data.trips.filter(t => t.id !== req.params.id);
  writeData(data);
  res.json({ ok: true });
});

// ── Flights ────────────────────────────────────────────────────────

app.post('/api/trips/:id/flights', (req, res) => {
  const data = readData();
  const trip = data.trips.find(t => t.id === req.params.id);
  if (!trip) return res.status(404).json({ error: 'Not found' });
  const flight = { id: randomUUID(), ...req.body };
  trip.flights.push(flight);
  writeData(data);
  res.status(201).json(flight);
});

app.put('/api/trips/:id/flights/:fid', (req, res) => {
  const data = readData();
  const trip = data.trips.find(t => t.id === req.params.id);
  if (!trip) return res.status(404).json({ error: 'Not found' });
  const idx = trip.flights.findIndex(f => f.id === req.params.fid);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  trip.flights[idx] = { ...trip.flights[idx], ...req.body, id: req.params.fid };
  writeData(data);
  res.json(trip.flights[idx]);
});

app.delete('/api/trips/:id/flights/:fid', (req, res) => {
  const data = readData();
  const trip = data.trips.find(t => t.id === req.params.id);
  if (!trip) return res.status(404).json({ error: 'Not found' });
  trip.flights = trip.flights.filter(f => f.id !== req.params.fid);
  writeData(data);
  res.json({ ok: true });
});

// ── Hotels ─────────────────────────────────────────────────────────

app.post('/api/trips/:id/hotels', (req, res) => {
  const data = readData();
  const trip = data.trips.find(t => t.id === req.params.id);
  if (!trip) return res.status(404).json({ error: 'Not found' });
  const hotel = { id: randomUUID(), ...req.body };
  trip.hotels.push(hotel);
  writeData(data);
  res.status(201).json(hotel);
});

app.put('/api/trips/:id/hotels/:hid', (req, res) => {
  const data = readData();
  const trip = data.trips.find(t => t.id === req.params.id);
  if (!trip) return res.status(404).json({ error: 'Not found' });
  const idx = trip.hotels.findIndex(h => h.id === req.params.hid);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  trip.hotels[idx] = { ...trip.hotels[idx], ...req.body, id: req.params.hid };
  writeData(data);
  res.json(trip.hotels[idx]);
});

app.delete('/api/trips/:id/hotels/:hid', (req, res) => {
  const data = readData();
  const trip = data.trips.find(t => t.id === req.params.id);
  if (!trip) return res.status(404).json({ error: 'Not found' });
  trip.hotels = trip.hotels.filter(h => h.id !== req.params.hid);
  writeData(data);
  res.json({ ok: true });
});

// ── Activities ─────────────────────────────────────────────────────

app.post('/api/trips/:id/activities', (req, res) => {
  const data = readData();
  const trip = data.trips.find(t => t.id === req.params.id);
  if (!trip) return res.status(404).json({ error: 'Not found' });
  const activity = { id: randomUUID(), ...req.body };
  trip.activities.push(activity);
  writeData(data);
  res.status(201).json(activity);
});

app.put('/api/trips/:id/activities/:aid', (req, res) => {
  const data = readData();
  const trip = data.trips.find(t => t.id === req.params.id);
  if (!trip) return res.status(404).json({ error: 'Not found' });
  const idx = trip.activities.findIndex(a => a.id === req.params.aid);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  trip.activities[idx] = { ...trip.activities[idx], ...req.body, id: req.params.aid };
  writeData(data);
  res.json(trip.activities[idx]);
});

app.delete('/api/trips/:id/activities/:aid', (req, res) => {
  const data = readData();
  const trip = data.trips.find(t => t.id === req.params.id);
  if (!trip) return res.status(404).json({ error: 'Not found' });
  trip.activities = trip.activities.filter(a => a.id !== req.params.aid);
  writeData(data);
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`✈  Waylog 已启动: http://localhost:${PORT}`);
});
