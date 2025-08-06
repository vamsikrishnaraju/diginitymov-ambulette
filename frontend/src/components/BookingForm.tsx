import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, MapPin, Phone, User, Mail, FileText } from 'lucide-react'
import { toast } from 'sonner'
import MapSelector from './MapSelector'
import OTPVerification from './OTPVerification'

interface Location {
  address: string
  latitude: number
  longitude: number
}

interface BookingData {
  name: string
  phone: string
  email: string
  health_condition: string
  pickup_location: Location | null
  drop_location: Location | null
  from_date: string
  to_date: string
}

export default function BookingForm() {
  const [formData, setFormData] = useState<BookingData>({
    name: '',
    phone: '',
    email: '',
    health_condition: '',
    pickup_location: null,
    drop_location: null,
    from_date: '',
    to_date: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPickupMap, setShowPickupMap] = useState(false)
  const [showDropMap, setShowDropMap] = useState(false)
  const [isPhoneVerified, setIsPhoneVerified] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    if (name === 'phone' && isPhoneVerified) {
      setIsPhoneVerified(false)
    }
  }

  const handleLocationSelect = (location: Location, type: 'pickup' | 'drop') => {
    if (type === 'pickup') {
      setFormData(prev => ({ ...prev, pickup_location: location }))
      setShowPickupMap(false)
    } else {
      setFormData(prev => ({ ...prev, drop_location: location }))
      setShowDropMap(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.phone || !formData.pickup_location || !formData.drop_location || !formData.from_date || !formData.to_date) {
      toast.error('Please fill in all required fields')
      return
    }

    if (!isPhoneVerified) {
      toast.error('Please verify your phone number with OTP')
      return
    }

    const fromDate = new Date(formData.from_date)
    const toDate = new Date(formData.to_date)
    
    if (toDate <= fromDate) {
      toast.error('To date and time must be greater than from date and time')
      return
    }

    setIsSubmitting(true)
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL as string}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const booking = await response.json()
        toast.success(`Booking created successfully! Booking ID: ${booking.id}`)
        setFormData({
          name: '',
          phone: '',
          email: '',
          health_condition: '',
          pickup_location: null,
          drop_location: null,
          from_date: '',
          to_date: ''
        })
        setIsPhoneVerified(false)
      } else {
        toast.error('Failed to create booking')
      }
    } catch (error) {
      toast.error('Error creating booking')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Book an Ambulette
          </CardTitle>
          <CardDescription>
            Fill out the form below to book an ambulette. No registration required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  Name *
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center">
                  <Phone className="h-4 w-4 mr-1" />
                  Phone Number *
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+1234567890"
                  required
                />
                {formData.phone && (
                  <OTPVerification
                    phone={formData.phone}
                    onVerified={() => setIsPhoneVerified(true)}
                  />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center">
                <Mail className="h-4 w-4 mr-1" />
                Email (Optional)
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="your.email@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="health_condition" className="flex items-center">
                <FileText className="h-4 w-4 mr-1" />
                Health Condition (Optional)
              </Label>
              <Textarea
                id="health_condition"
                name="health_condition"
                value={formData.health_condition}
                onChange={handleInputChange}
                placeholder="Please describe any relevant health conditions, mobility requirements, or special medical needs..."
                rows={3}
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  Pickup Location *
                </Label>
                {formData.pickup_location ? (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-800 mb-1">Selected Pickup Location:</p>
                        <p className="text-sm text-green-700">{formData.pickup_location.address}</p>
                        <p className="text-xs text-green-600 mt-1">
                          Coordinates: {formData.pickup_location.latitude.toFixed(6)}, {formData.pickup_location.longitude.toFixed(6)}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="ml-3"
                        onClick={() => setShowPickupMap(true)}
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-12 border-dashed border-2 border-gray-300 hover:border-gray-400"
                      onClick={() => setShowPickupMap(true)}
                    >
                      <MapPin className="h-5 w-5 mr-2" />
                      Select Pickup Location (Required)
                    </Button>
                    <p className="text-xs text-gray-500">Click to open map and select your pickup location</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  Drop Location *
                </Label>
                {formData.drop_location ? (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-800 mb-1">Selected Drop Location:</p>
                        <p className="text-sm text-blue-700">{formData.drop_location.address}</p>
                        <p className="text-xs text-blue-600 mt-1">
                          Coordinates: {formData.drop_location.latitude.toFixed(6)}, {formData.drop_location.longitude.toFixed(6)}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="ml-3"
                        onClick={() => setShowDropMap(true)}
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-12 border-dashed border-2 border-gray-300 hover:border-gray-400"
                      onClick={() => setShowDropMap(true)}
                    >
                      <MapPin className="h-5 w-5 mr-2" />
                      Select Drop Location (Required)
                    </Button>
                    <p className="text-xs text-gray-500">Click to open map and select your drop-off location</p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="from_date">From Date & Time *</Label>
                <Input
                  id="from_date"
                  name="from_date"
                  type="datetime-local"
                  value={formData.from_date}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="to_date">To Date & Time *</Label>
                <Input
                  id="to_date"
                  name="to_date"
                  type="datetime-local"
                  value={formData.to_date}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Booking...' : 'Book Ambulette'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {showPickupMap && (
        <MapSelector
          onLocationSelect={(location) => handleLocationSelect(location, 'pickup')}
          onClose={() => setShowPickupMap(false)}
          title="Select Pickup Location"
        />
      )}

      {showDropMap && (
        <MapSelector
          onLocationSelect={(location) => handleLocationSelect(location, 'drop')}
          onClose={() => setShowDropMap(false)}
          title="Select Drop Location"
        />
      )}
    </div>
  )
}
