require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data', 'trips.json');

// Ensure data directory and file exist
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify({ trips: [] }, null, 2));

app.use(express.json({ limit: '10mb' }));
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

// ── Flight OCR ─────────────────────────────────────────────────────

app.post('/api/extract-flight', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: '未配置 GEMINI_API_KEY，请在 .env 文件中添加后重启服务。',
    });
  }

  const { imageBase64, mediaType } = req.body;
  if (!imageBase64) return res.status(400).json({ error: '未收到图片数据' });

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const result = await model.generateContent([
      {
        inlineData: {
          data: imageBase64,
          mimeType: mediaType || 'image/jpeg',
        },
      },
      {
        text: `请从这张机票或订单截图中提取航班信息。只返回如下 JSON，不要任何其他文字：
{
  "fromAirport": "出发机场 IATA 三字码（如 PVG、SHA）",
  "toAirport": "到达机场 IATA 三字码（如 NRT、HND）",
  "flightNo": "航班号（如 MU517、CA821）",
  "date": "出发日期 YYYY-MM-DD 格式",
  "departureTime": "出发时间 HH:mm 格式（24小时制）",
  "arrivalTime": "到达时间 HH:mm 格式（24小时制）",
  "terminal": "航站楼（如 T1、T2，找不到则填 null）"
}
找不到的字段填 null，只返回 JSON。`,
      },
    ]);

    const raw = result.response.text();
    // Strip markdown code fences if present
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const data = JSON.parse(cleaned);
    res.json({ ok: true, data });
  } catch (err) {
    console.error('[extract-flight]', err.message);
    if (err instanceof SyntaxError) {
      return res.status(422).json({ error: '识别结果解析失败，请尝试更清晰的截图' });
    }
    res.status(500).json({ error: err.message || '识别失败，请稍后重试' });
  }
});

// ───────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`✈  Waylog 已启动: http://localhost:${PORT}`);
});
