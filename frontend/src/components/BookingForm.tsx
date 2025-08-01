import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, MapPin, Phone, User, Mail } from 'lucide-react'
import { toast } from 'sonner'
import MapSelector from './MapSelector'

interface Location {
  address: string
  latitude: number
  longitude: number
}

interface BookingData {
  name: string
  phone: string
  email: string
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
    pickup_location: null,
    drop_location: null,
    from_date: '',
    to_date: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPickupMap, setShowPickupMap] = useState(false)
  const [showDropMap, setShowDropMap] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
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
          pickup_location: null,
          drop_location: null,
          from_date: '',
          to_date: ''
        })
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
            Book an Ambulance
          </CardTitle>
          <CardDescription>
            Fill out the form below to book an ambulance. No registration required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  Pickup Location *
                </Label>
                {formData.pickup_location ? (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-800">{formData.pickup_location.address}</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => setShowPickupMap(true)}
                    >
                      Change Location
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowPickupMap(true)}
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Select Pickup Location
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  Drop Location *
                </Label>
                {formData.drop_location ? (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-800">{formData.drop_location.address}</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => setShowDropMap(true)}
                    >
                      Change Location
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowDropMap(true)}
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Select Drop Location
                  </Button>
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
              {isSubmitting ? 'Booking...' : 'Book Ambulance'}
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
