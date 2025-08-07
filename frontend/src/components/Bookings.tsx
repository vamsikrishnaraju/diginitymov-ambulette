import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Calendar, Phone, MapPin, Clock, User, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface Location {
  address: string
  latitude: number
  longitude: number
}

interface Booking {
  id: string
  name: string
  phone: string
  email?: string
  health_condition?: string
  pickup_location: Location
  drop_location: Location
  from_date: string
  to_date: string
  status: string
  assigned_ambulance_id?: string
  created_at: string
}

export default function Bookings() {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [isOtpSent, setIsOtpSent] = useState(false)
  const [isPhoneVerified, setIsPhoneVerified] = useState(false)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [sendCooldown, setSendCooldown] = useState(0)

  const apiUrl = import.meta.env.VITE_API_URL as string

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    if (timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => time - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [timeLeft])

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    if (sendCooldown > 0) {
      interval = setInterval(() => {
        setSendCooldown(time => time - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [sendCooldown])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const sendOTP = async () => {
    if (!phone) {
      toast.error('Please enter a phone number first')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`${apiUrl}/api/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone }),
      })

      if (response.ok) {
        const data = await response.json()
        setIsOtpSent(true)
        setTimeLeft(300) // 5 minutes
        setSendCooldown(60) // 1 minute cooldown
        toast.success('OTP sent successfully!')
        console.log('OTP for testing:', data.message)
      } else {
        setIsOtpSent(true)
        setTimeLeft(300) // 5 minutes
        setSendCooldown(60) // 1 minute cooldown
        toast.error('Failed to send OTP, but you can still enter OTP for testing')
      }
    } catch (error) {
      setIsOtpSent(true)
      setTimeLeft(300) // 5 minutes
      setSendCooldown(60) // 1 minute cooldown
      toast.error('Error sending OTP, but you can still enter OTP for testing')
    } finally {
      setIsLoading(false)
    }
  }

  const verifyOTP = async () => {
    if (!otp) {
      toast.error('Please enter the OTP')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`${apiUrl}/api/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, otp }),
      })

      if (response.ok) {
        setIsPhoneVerified(true)
        toast.success('Phone number verified successfully!')
        await fetchBookings()
      } else {
        const error = await response.json()
        toast.error(error.detail || 'Invalid OTP')
      }
    } catch (error) {
      toast.error('Error verifying OTP')
    } finally {
      setIsLoading(false)
    }
  }

  const resendOTP = () => {
    setOtp('')
    setIsOtpSent(false)
    setTimeLeft(0)
    setSendCooldown(0)
    sendOTP()
  }

  const fetchBookings = async () => {
    if (!phone) return

    setIsLoading(true)
    try {
      const response = await fetch(`${apiUrl}/api/bookings/by-phone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone }),
      })

      if (response.ok) {
        const data = await response.json()
        setBookings(data)
        if (data.length === 0) {
          toast.info('No bookings found for this phone number')
        }
      } else {
        const error = await response.json()
        toast.error(error.detail || 'Failed to fetch bookings')
      }
    } catch (error) {
      toast.error('Error fetching bookings')
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setPhone('')
    setOtp('')
    setIsOtpSent(false)
    setIsPhoneVerified(false)
    setBookings([])
    setTimeLeft(0)
    setSendCooldown(0)
  }

  if (!isPhoneVerified) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Phone className="h-5 w-5 mr-2" />
              Verify Phone Number
            </CardTitle>
            <CardDescription>
              Enter your phone number and verify with OTP to view your bookings
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your phone number"
                className="h-10"
                required
                disabled={isOtpSent}
              />
            </div>
            
            {!isOtpSent ? (
              <Button
                type="button"
                onClick={sendOTP}
                disabled={isLoading || !phone || sendCooldown > 0}
                className="w-full"
              >
                {isLoading ? 'Sending...' : sendCooldown > 0 ? `Wait ${sendCooldown}s` : 'Send OTP'}
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp" className="flex items-center text-sm font-medium">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    Enter OTP
                  </Label>
                  <Input
                    id="otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    className="text-center text-lg tracking-widest h-12"
                    inputMode="numeric"
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-1 text-sm text-gray-600">
                    <Clock className="h-3 w-3" />
                    <span>
                      {timeLeft > 0 ? `Expires in ${formatTime(timeLeft)}` : 'OTP expired'}
                    </span>
                  </div>
                  
                  {timeLeft === 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={resendOTP}
                      disabled={isLoading}
                      className="w-full sm:w-auto"
                    >
                      Resend OTP
                    </Button>
                  )}
                </div>
                
                <Button
                  type="button"
                  onClick={verifyOTP}
                  disabled={isLoading || !otp || timeLeft === 0}
                  className="w-full h-10"
                >
                  {isLoading ? 'Verifying...' : 'Verify OTP & View Bookings'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Your Bookings
            </div>
            <button
              onClick={resetForm}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Change Phone Number
            </button>
          </CardTitle>
          <CardDescription>
            Bookings for phone number: {phone}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading your bookings...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
              <p className="text-gray-500 mb-4">
                You haven't made any ambulette bookings with this phone number yet.
              </p>
              <a
                href="/"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Book an Ambulette
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">
                  {bookings.length} booking{bookings.length !== 1 ? 's' : ''} found
                </h3>
              </div>
              
              <div className="overflow-x-auto">
                <Table className="min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Booking Details</TableHead>
                      <TableHead>Pickup Location</TableHead>
                      <TableHead>Drop Location</TableHead>
                      <TableHead>Schedule</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-medium">
                          <div className="space-y-1">
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-1 text-gray-400" />
                              <span>{booking.name}</span>
                            </div>
                            {booking.email && (
                              <div className="text-sm text-gray-500">{booking.email}</div>
                            )}
                            {booking.health_condition && (
                              <div className="text-sm text-gray-600 max-w-xs truncate" title={booking.health_condition}>
                                Health: {booking.health_condition}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-start">
                            <MapPin className="h-4 w-4 mr-1 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm max-w-xs truncate" title={booking.pickup_location?.address || 'N/A'}>
                              {booking.pickup_location?.address || 'N/A'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-start">
                            <MapPin className="h-4 w-4 mr-1 text-red-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm max-w-xs truncate" title={booking.drop_location?.address || 'N/A'}>
                              {booking.drop_location?.address || 'N/A'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center text-sm">
                              <Clock className="h-3 w-3 mr-1 text-gray-400" />
                              <span>From: {new Date(booking.from_date).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center text-sm">
                              <Clock className="h-3 w-3 mr-1 text-gray-400" />
                              <span>To: {new Date(booking.to_date).toLocaleString()}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                            booking.status === 'assigned' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {booking.status}
                          </span>
                          {booking.assigned_ambulance_id && (
                            <div className="text-xs text-gray-500 mt-1">
                              Ambulette assigned
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
