# ✈ Waylog

A minimal, local-first travel planning memo app inspired by the clean aesthetic of handcrafted trip itineraries. Built with Node.js + Express, runs entirely on your own machine with no cloud dependency.

![Waylog Screenshot](https://github.com/user-attachments/assets/f5c09e9d-e077-4874-9b19-1f5ede200d1e)

---

## Features

| Feature | Description |
|---|---|
| **Multi-trip management** | Sidebar lists all trips; last selected trip is remembered across sessions |
| **Flights** | Departure/arrival airports (IATA), flight number, times, date, terminal |
| **Hotels** | Name, address, check-in/out dates, notes — displayed as a green info card |
| **Activities** | Time, location, name, memo — supports 4 types: Sight / Food / Transit / Note |
| **Transit entries** | Dedicated transit type with transport mode and duration fields |
| **Day filter** | Day 1 / 2 / 3 … buttons auto-generated from the trip date range |
| **Persistent storage** | All data saved to `data/trips.json` — survives server restarts |
| **Edit / Delete** | Hover any entry to reveal inline edit and delete buttons |

---

## Project Structure

```
Waylog/
├── server.js           # Express backend · REST API · JSON file storage
├── package.json
├── data/
│   └── trips.json      # Auto-created on first run · all your trip data lives here
└── public/
    ├── index.html      # Single-page app shell
    ├── style.css       # Itinerary-style design (timeline, dots, badges, modals)
    └── app.js          # Frontend logic · CRUD · modal forms · day filter
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v16 or later

### Installation

```bash
# Clone or download the project
git clone https://github.com/your-username/Waylog.git
cd Waylog

# Install dependencies (one time only)
npm install
```

### Run

```bash
node server.js
```

You should see:

```
✈  Waylog 已启动: http://localhost:3000
```

Open your browser and go to **http://localhost:3000**.

To stop the server, press `Ctrl + C` in the terminal.

---

## Daily Usage

Each time you want to use Waylog:

```bash
cd /path/to/Waylog
node server.js
```

Then visit **http://localhost:3000** in any browser. Close the terminal tab or press `Ctrl + C` when done.

---

## Optional: Run in the Background with PM2

If you want Waylog to start automatically and run persistently:

```bash
# Install PM2 globally
npm install -g pm2

# Start Waylog as a managed process
pm2 start server.js --name Waylog

# Save the process list and enable startup on boot
pm2 save
pm2 startup
```

To stop or restart:

```bash
pm2 stop Waylog
pm2 restart Waylog
```

---

## Configuration

| Setting | Location | Default |
|---|---|---|
| Port | `server.js` line 5 | `3000` |
| Data file path | `server.js` line 7 | `./data/trips.json` |

---

## Data Format

All data is stored as plain JSON in `data/trips.json`. You can back it up, version it, or edit it manually. Example structure:

```json
{
  "trips": [
    {
      "id": "uuid",
      "name": "Tokyo Trip",
      "destination": "Tokyo, Japan",
      "startDate": "2025-05-16",
      "endDate": "2025-05-20",
      "flights": [
        {
          "id": "uuid",
          "fromAirport": "PVG",
          "toAirport": "NRT",
          "flightNo": "MU517",
          "date": "2025-05-16",
          "departureTime": "08:30",
          "arrivalTime": "12:45",
          "terminal": "T1",
          "note": ""
        }
      ],
      "hotels": [ { "id": "uuid", "name": "...", "checkIn": "...", "checkOut": "...", "note": "..." } ],
      "activities": [ { "id": "uuid", "type": "sight", "name": "...", "date": "...", "time": "...", "location": "...", "memo": "..." } ]
    }
  ]
}
```

---

## REST API

The backend exposes a simple REST API if you want to script or automate data entry.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/trips` | List all trips |
| `POST` | `/api/trips` | Create a trip |
| `PUT` | `/api/trips/:id` | Update a trip |
| `DELETE` | `/api/trips/:id` | Delete a trip |
| `POST` | `/api/trips/:id/flights` | Add a flight |
| `PUT` | `/api/trips/:id/flights/:fid` | Update a flight |
| `DELETE` | `/api/trips/:id/flights/:fid` | Delete a flight |
| `POST` | `/api/trips/:id/hotels` | Add a hotel |
| `PUT` | `/api/trips/:id/hotels/:hid` | Update a hotel |
| `DELETE` | `/api/trips/:id/hotels/:hid` | Delete a hotel |
| `POST` | `/api/trips/:id/activities` | Add an activity |
| `PUT` | `/api/trips/:id/activities/:aid` | Update an activity |
| `DELETE` | `/api/trips/:id/activities/:aid` | Delete an activity |

---

## Tech Stack

- **Backend** — Node.js · Express · `fs` (no database, plain JSON)
- **Frontend** — Vanilla HTML / CSS / JavaScript (no framework, no build step)
- **Storage** — Local JSON file

---

## License

MIT
