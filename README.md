# Digmov Ambulance Booking System

A modern web application for ambulance booking with React frontend and FastAPI backend.

## Features

### User Booking (No Registration Required)
- Book ambulance without user registration
- Mandatory phone number field
- Optional email field
- Name and contact information
- Google Maps integration for pickup and drop location selection
- Date and time selection for booking period

### Admin Dashboard
- Manage ambulances (add/delete)
- Manage drivers (add/delete)
- View all bookings
- Assign drivers to ambulances daily
- Assign ambulances to bookings
- Real-time data management

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- Shadcn/ui components
- Tailwind CSS for styling
- React Router for navigation
- Google Maps JavaScript API integration

### Backend
- FastAPI (Python)
- Pydantic for data validation
- CORS enabled for frontend integration
- In-memory database (proof of concept)
- RESTful API design

## Project Structure

```
digmov-ambulance/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── ui/         # Shadcn UI components
│   │   │   ├── BookingForm.tsx
│   │   │   ├── AdminDashboard.tsx
│   │   │   └── MapSelector.tsx
│   │   ├── App.tsx         # Main app component
│   │   └── main.tsx        # App entry point
│   ├── package.json
│   └── .env                # Environment variables
└── backend/                 # FastAPI backend application
    ├── app/
    │   └── main.py         # FastAPI application
    ├── pyproject.toml      # Python dependencies
    └── README.md
```

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm/pnpm
- Python 3.12+
- Poetry (Python package manager)
- Google Maps API key (for location selection)

### Backend Setup
```bash
cd backend
poetry install
poetry run fastapi dev app/main.py
```
Backend will run on http://localhost:8000

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend will run on http://localhost:5173

### Environment Configuration

Create `frontend/.env` file:
```
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

## API Endpoints

### Bookings
- `GET /api/bookings` - Get all bookings
- `POST /api/bookings` - Create new booking

### Ambulances
- `GET /api/ambulances` - Get all ambulances
- `POST /api/ambulances` - Add new ambulance
- `DELETE /api/ambulances/{ambulance_id}` - Delete ambulance

### Drivers
- `GET /api/drivers` - Get all drivers
- `POST /api/drivers` - Add new driver
- `DELETE /api/drivers/{driver_id}` - Delete driver

### Assignments
- `GET /api/assignments` - Get driver assignments
- `POST /api/assign-driver` - Assign driver to ambulance
- `POST /api/assign-ambulance` - Assign ambulance to booking

## Google Maps Integration

The application uses Google Maps JavaScript API for location selection. To enable this feature:

1. Get a Google Maps API key from [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the following APIs:
   - Maps JavaScript API
   - Geocoding API
3. Update the `VITE_GOOGLE_MAPS_API_KEY` in `frontend/.env`

## Development Notes

- The backend uses an in-memory database for proof of concept
- Data will be lost when the backend server restarts
- CORS is configured to allow frontend access
- All API responses include proper error handling
- The frontend includes loading states and user feedback

## Deployment

### Backend Deployment
The FastAPI backend can be deployed to platforms like:
- Fly.io (recommended)
- Heroku
- Railway
- DigitalOcean App Platform

### Frontend Deployment
The React frontend can be deployed to:
- Vercel (recommended)
- Netlify
- GitHub Pages
- Any static hosting service

Make sure to update the `VITE_API_URL` environment variable to point to your deployed backend URL.

## Contributing

1. Create a feature branch from main
2. Make your changes
3. Test locally
4. Submit a pull request

## License

This project is created for demonstration purposes.
