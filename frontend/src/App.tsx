import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import { Ambulance, Users, Home, Menu, X, Calendar } from 'lucide-react'
import { useState } from 'react'
import BookingForm from './components/BookingForm'
import AdminDashboard from './components/AdminDashboard'
import Bookings from './components/Bookings'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import './App.css'

function NavigationContent() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  const isAdminRoute = location.pathname === '/admin'

  return (
        <div className="min-h-screen bg-gray-50">
          <nav className="bg-white shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center">
                  <Ambulance className="h-8 w-8 text-red-600 mr-2" />
                  <span className="text-lg sm:text-xl font-bold text-gray-900">
                    <span className="hidden sm:inline">Diginitymov Ambulette</span>
                    <span className="sm:hidden">Ambulette</span>
                  </span>
                </div>
                
                <div className="hidden md:flex items-center space-x-4">
                  {!isAuthenticated && (
                    <>
                      <Link
                        to="/"
                        className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                      >
                        <Home className="h-4 w-4 mr-1" />
                        Book Ambulette
                      </Link>
                      <Link
                        to="/bookings"
                        className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                      >
                        <Calendar className="h-4 w-4 mr-1" />
                        Bookings
                      </Link>
                    </>
                  )}
                  <Link
                    to="/admin"
                    className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                  >
                    <Users className="h-4 w-4 mr-1" />
                    Admin
                  </Link>
                </div>

                <div className="md:hidden flex items-center">
                  <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-500 transition-colors"
                    aria-expanded="false"
                  >
                    <span className="sr-only">Open main menu</span>
                    {isMobileMenuOpen ? (
                      <X className="block h-6 w-6" aria-hidden="true" />
                    ) : (
                      <Menu className="block h-6 w-6" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              {isMobileMenuOpen && (
                <div className="md:hidden">
                  <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200">
                    {!isAuthenticated && (
                      <>
                        <Link
                          to="/"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                        >
                          <Home className="h-5 w-5 mr-2" />
                          Book Ambulette
                        </Link>
                        <Link
                          to="/bookings"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                        >
                          <Calendar className="h-5 w-5 mr-2" />
                          Bookings
                        </Link>
                      </>
                    )}
                    <Link
                      to="/admin"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                    >
                      <Users className="h-5 w-5 mr-2" />
                      Admin
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </nav>

        <main className={isAdminRoute ? '' : 'max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8'}>
          <Routes>
            <Route path="/" element={<BookingForm />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </main>
      </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <NavigationContent />
      </Router>
    </AuthProvider>
  )
}

export default App
