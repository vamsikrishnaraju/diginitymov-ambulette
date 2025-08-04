import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { Ambulance, Users, Home } from 'lucide-react'
import BookingForm from './components/BookingForm'
import AdminDashboard from './components/AdminDashboard'
import { AuthProvider } from './contexts/AuthContext'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Ambulance className="h-8 w-8 text-red-600 mr-2" />
                <span className="text-xl font-bold text-gray-900">Diginitymov Ambulette</span>
              </div>
              <div className="flex items-center space-x-4">
                <Link
                  to="/"
                  className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                >
                  <Home className="h-4 w-4 mr-1" />
                  Book Ambulette
                </Link>
                <Link
                  to="/admin"
                  className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                >
                  <Users className="h-4 w-4 mr-1" />
                  Admin
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto py-6 px-4">
          <Routes>
            <Route path="/" element={<BookingForm />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </main>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
