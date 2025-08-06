import { useEffect, useRef, useState } from 'react'
import { Loader } from '@googlemaps/js-api-loader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X, MapPin, Search, Navigation } from 'lucide-react'

interface Location {
  address: string
  latitude: number
  longitude: number
}

interface MapSelectorProps {
  onLocationSelect: (location: Location) => void
  onClose: () => void
  title: string
}

export default function MapSelector({ onLocationSelect, onClose, title }: MapSelectorProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [marker, setMarker] = useState<google.maps.Marker | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchValue, setSearchValue] = useState('')
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isGettingLocation, setIsGettingLocation] = useState(false)

  useEffect(() => {
    const getCurrentLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
            setCurrentLocation(userLocation)
          },
          (error) => {
            console.log('Geolocation error:', error)
            setCurrentLocation({ lat: 40.7128, lng: -74.0060 })
          }
        )
      } else {
        setCurrentLocation({ lat: 40.7128, lng: -74.0060 })
      }
    }

    getCurrentLocation()
  }, [])

  useEffect(() => {
    if (!currentLocation) return

    const initMap = async () => {
      const loader = new Loader({
        apiKey: (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) || 'demo-key',
        version: 'weekly',
        libraries: ['places']
      })

      try {
        await loader.load()
        
        if (mapRef.current) {
          const mapInstance = new google.maps.Map(mapRef.current, {
            center: currentLocation,
            zoom: 13,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false
          })

          const markerInstance = new google.maps.Marker({
            map: mapInstance,
            draggable: true
          })

          mapInstance.addListener('click', (e: google.maps.MapMouseEvent) => {
            if (e.latLng) {
              const lat = e.latLng.lat()
              const lng = e.latLng.lng()
              markerInstance.setPosition({ lat, lng })
              
              const geocoder = new google.maps.Geocoder()
              geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                if (status === 'OK' && results && results[0]) {
                  setSelectedLocation({
                    address: results[0].formatted_address,
                    latitude: lat,
                    longitude: lng
                  })
                }
              })
            }
          })

          markerInstance.addListener('dragend', () => {
            const position = markerInstance.getPosition()
            if (position) {
              const lat = position.lat()
              const lng = position.lng()
              
              const geocoder = new google.maps.Geocoder()
              geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                if (status === 'OK' && results && results[0]) {
                  setSelectedLocation({
                    address: results[0].formatted_address,
                    latitude: lat,
                    longitude: lng
                  })
                }
              })
            }
          })

          if (searchInputRef.current) {
            const autocomplete = new google.maps.places.Autocomplete(searchInputRef.current, {
              types: ['establishment', 'geocode'],
              componentRestrictions: { country: 'us' }
            })

            autocomplete.addListener('place_changed', () => {
              const place = autocomplete.getPlace()
              if (place.geometry && place.geometry.location) {
                const lat = place.geometry.location.lat()
                const lng = place.geometry.location.lng()
                
                mapInstance.setCenter({ lat, lng })
                mapInstance.setZoom(15)
                markerInstance.setPosition({ lat, lng })
                
                setSelectedLocation({
                  address: place.formatted_address || place.name || '',
                  latitude: lat,
                  longitude: lng
                })
                
                setSearchValue(place.formatted_address || place.name || '')
              }
            })
          }

          setMap(mapInstance)
          setMarker(markerInstance)
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Error loading Google Maps:', error)
        setIsLoading(false)
      }
    }

    initMap()
  }, [currentLocation])

  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation)
    }
  }

  const useCurrentLocation = () => {
    if (!map || !marker || isGettingLocation) return

    setIsGettingLocation(true)
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
          
          map.setCenter(userLocation)
          map.setZoom(15)
          marker.setPosition(userLocation)
          
          const geocoder = new google.maps.Geocoder()
          geocoder.geocode({ location: userLocation }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
              setSelectedLocation({
                address: results[0].formatted_address,
                latitude: userLocation.lat,
                longitude: userLocation.lng
              })
            }
            setIsGettingLocation(false)
          })
        },
        (error) => {
          console.error('Error getting current location:', error)
          setIsGettingLocation(false)
        }
      )
    } else {
      setIsGettingLocation(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center">
            <MapPin className="h-5 w-5 mr-2" />
            {title}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-4 border-b">
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search for a location..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={useCurrentLocation}
                disabled={isGettingLocation}
                className="w-full"
              >
                <Navigation className="h-4 w-4 mr-2" />
                {isGettingLocation ? 'Getting location...' : 'Use Current Location'}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Search for an address, use current location, or click on the map to select a location
            </p>
          </div>
          <div className="h-96 w-full relative">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Loading map...</p>
                </div>
              </div>
            )}
            <div ref={mapRef} className="w-full h-full" />
          </div>
          
          {selectedLocation && (
            <div className="p-4 border-t">
              <p className="text-sm text-gray-600 mb-3">Selected location:</p>
              <p className="font-medium mb-4">{selectedLocation.address}</p>
              <div className="flex gap-2">
                <Button onClick={handleConfirm} className="flex-1">
                  Confirm Location
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
          
          {!selectedLocation && !isLoading && (
            <div className="p-4 border-t">
              <p className="text-sm text-gray-600 text-center">
                Search above or click on the map to select a location
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
