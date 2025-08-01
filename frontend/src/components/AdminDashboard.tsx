import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Trash2, Plus, UserCheck, Truck } from 'lucide-react'
import { toast } from 'sonner'

interface Ambulance {
  id: string
  license_plate: string
  model: string
  capacity: number
  status: string
}

interface Driver {
  id: string
  name: string
  phone: string
  license_number: string
  status: string
}

interface Booking {
  id: string
  name: string
  phone: string
  email?: string
  pickup_location: {
    address: string
    latitude: number
    longitude: number
  }
  drop_location: {
    address: string
    latitude: number
    longitude: number
  }
  from_date: string
  to_date: string
  status: string
  assigned_ambulance_id?: string
  created_at: string
}

interface DriverAssignment {
  id: string
  driver_id: string
  ambulance_id: string
  date: string
}

export default function AdminDashboard() {
  const [ambulances, setAmbulances] = useState<Ambulance[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [assignments, setAssignments] = useState<DriverAssignment[]>([])
  const [loading, setLoading] = useState(false)

  const [newAmbulance, setNewAmbulance] = useState({
    license_plate: '',
    model: '',
    capacity: ''
  })

  const [newDriver, setNewDriver] = useState({
    name: '',
    phone: '',
    license_number: ''
  })

  const [assignmentForm, setAssignmentForm] = useState({
    driver_id: '',
    ambulance_id: '',
    date: ''
  })

  const [bookingAssignment, setBookingAssignment] = useState({
    booking_id: '',
    ambulance_id: ''
  })

  const apiUrl = import.meta.env.VITE_API_URL as string

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [ambulancesRes, driversRes, bookingsRes, assignmentsRes] = await Promise.all([
        fetch(`${apiUrl}/api/admin/ambulances`),
        fetch(`${apiUrl}/api/admin/drivers`),
        fetch(`${apiUrl}/api/bookings`),
        fetch(`${apiUrl}/api/admin/driver-assignments`)
      ])

      if (ambulancesRes.ok) setAmbulances(await ambulancesRes.json())
      if (driversRes.ok) setDrivers(await driversRes.json())
      if (bookingsRes.ok) setBookings(await bookingsRes.json())
      if (assignmentsRes.ok) setAssignments(await assignmentsRes.json())
    } catch (error) {
      toast.error('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const addAmbulance = async () => {
    if (!newAmbulance.license_plate || !newAmbulance.model || !newAmbulance.capacity) {
      toast.error('Please fill all fields')
      return
    }

    try {
      const response = await fetch(`${apiUrl}/api/admin/ambulances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newAmbulance,
          capacity: parseInt(newAmbulance.capacity)
        })
      })

      if (response.ok) {
        toast.success('Ambulance added successfully')
        setNewAmbulance({ license_plate: '', model: '', capacity: '' })
        fetchData()
      } else {
        toast.error('Failed to add ambulance')
      }
    } catch (error) {
      toast.error('Error adding ambulance')
    }
  }

  const deleteAmbulance = async (id: string) => {
    try {
      const response = await fetch(`${apiUrl}/api/admin/ambulances/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Ambulance deleted successfully')
        fetchData()
      } else {
        toast.error('Failed to delete ambulance')
      }
    } catch (error) {
      toast.error('Error deleting ambulance')
    }
  }

  const addDriver = async () => {
    if (!newDriver.name || !newDriver.phone || !newDriver.license_number) {
      toast.error('Please fill all fields')
      return
    }

    try {
      const response = await fetch(`${apiUrl}/api/admin/drivers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDriver)
      })

      if (response.ok) {
        toast.success('Driver added successfully')
        setNewDriver({ name: '', phone: '', license_number: '' })
        fetchData()
      } else {
        toast.error('Failed to add driver')
      }
    } catch (error) {
      toast.error('Error adding driver')
    }
  }

  const deleteDriver = async (id: string) => {
    try {
      const response = await fetch(`${apiUrl}/api/admin/drivers/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Driver deleted successfully')
        fetchData()
      } else {
        toast.error('Failed to delete driver')
      }
    } catch (error) {
      toast.error('Error deleting driver')
    }
  }

  const assignDriver = async () => {
    if (!assignmentForm.driver_id || !assignmentForm.ambulance_id || !assignmentForm.date) {
      toast.error('Please fill all fields')
      return
    }

    try {
      const response = await fetch(`${apiUrl}/api/admin/assign-driver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignmentForm)
      })

      if (response.ok) {
        toast.success('Driver assigned successfully')
        setAssignmentForm({ driver_id: '', ambulance_id: '', date: '' })
        fetchData()
      } else {
        toast.error('Failed to assign driver')
      }
    } catch (error) {
      toast.error('Error assigning driver')
    }
  }

  const assignAmbulanceToBooking = async () => {
    if (!bookingAssignment.booking_id || !bookingAssignment.ambulance_id) {
      toast.error('Please select both booking and ambulance')
      return
    }

    try {
      const response = await fetch(`${apiUrl}/api/admin/assign-ambulance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingAssignment)
      })

      if (response.ok) {
        toast.success('Ambulance assigned to booking successfully')
        setBookingAssignment({ booking_id: '', ambulance_id: '' })
        fetchData()
      } else {
        toast.error('Failed to assign ambulance to booking')
      }
    } catch (error) {
      toast.error('Error assigning ambulance to booking')
    }
  }

  const getDriverName = (driverId: string) => {
    const driver = drivers.find(d => d.id === driverId)
    return driver ? driver.name : 'Unknown'
  }

  const getAmbulancePlate = (ambulanceId: string) => {
    const ambulance = ambulances.find(a => a.id === ambulanceId)
    return ambulance ? ambulance.license_plate : 'Unknown'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button onClick={fetchData} variant="outline">
          Refresh Data
        </Button>
      </div>

      <Tabs defaultValue="ambulances" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="ambulances">Ambulances</TabsTrigger>
          <TabsTrigger value="drivers">Drivers</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
        </TabsList>

        <TabsContent value="ambulances" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Truck className="h-5 w-5 mr-2" />
                Add New Ambulance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="license_plate">License Plate</Label>
                  <Input
                    id="license_plate"
                    value={newAmbulance.license_plate}
                    onChange={(e) => setNewAmbulance(prev => ({ ...prev, license_plate: e.target.value }))}
                    placeholder="ABC-123"
                  />
                </div>
                <div>
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    value={newAmbulance.model}
                    onChange={(e) => setNewAmbulance(prev => ({ ...prev, model: e.target.value }))}
                    placeholder="Mercedes Sprinter"
                  />
                </div>
                <div>
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={newAmbulance.capacity}
                    onChange={(e) => setNewAmbulance(prev => ({ ...prev, capacity: e.target.value }))}
                    placeholder="4"
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={addAmbulance} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Ambulance
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ambulances List</CardTitle>
              <CardDescription>Manage your ambulance fleet</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>License Plate</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ambulances.map((ambulance) => (
                    <TableRow key={ambulance.id}>
                      <TableCell className="font-medium">{ambulance.license_plate}</TableCell>
                      <TableCell>{ambulance.model}</TableCell>
                      <TableCell>{ambulance.capacity}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          ambulance.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {ambulance.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteAmbulance(ambulance.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drivers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserCheck className="h-5 w-5 mr-2" />
                Add New Driver
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="driver_name">Name</Label>
                  <Input
                    id="driver_name"
                    value={newDriver.name}
                    onChange={(e) => setNewDriver(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="driver_phone">Phone</Label>
                  <Input
                    id="driver_phone"
                    value={newDriver.phone}
                    onChange={(e) => setNewDriver(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+1234567890"
                  />
                </div>
                <div>
                  <Label htmlFor="license_number">License Number</Label>
                  <Input
                    id="license_number"
                    value={newDriver.license_number}
                    onChange={(e) => setNewDriver(prev => ({ ...prev, license_number: e.target.value }))}
                    placeholder="DL123456789"
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={addDriver} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Driver
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Drivers List</CardTitle>
              <CardDescription>Manage your driver team</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>License Number</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drivers.map((driver) => (
                    <TableRow key={driver.id}>
                      <TableCell className="font-medium">{driver.name}</TableCell>
                      <TableCell>{driver.phone}</TableCell>
                      <TableCell>{driver.license_number}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          driver.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {driver.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteDriver(driver.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assign Ambulance to Booking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Select Booking</Label>
                  <Select value={bookingAssignment.booking_id} onValueChange={(value) => setBookingAssignment(prev => ({ ...prev, booking_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select booking" />
                    </SelectTrigger>
                    <SelectContent>
                      {bookings.filter(b => b.status === 'pending').map((booking) => (
                        <SelectItem key={booking.id} value={booking.id}>
                          {booking.name} - {new Date(booking.from_date).toLocaleDateString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Select Ambulance</Label>
                  <Select value={bookingAssignment.ambulance_id} onValueChange={(value) => setBookingAssignment(prev => ({ ...prev, ambulance_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select ambulance" />
                    </SelectTrigger>
                    <SelectContent>
                      {ambulances.filter(a => a.status === 'available').map((ambulance) => (
                        <SelectItem key={ambulance.id} value={ambulance.id}>
                          {ambulance.license_plate} - {ambulance.model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={assignAmbulanceToBooking} className="w-full">
                    Assign Ambulance
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>All Bookings</CardTitle>
              <CardDescription>View and manage ambulance bookings</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>From Date</TableHead>
                    <TableHead>To Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned Ambulance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">{booking.name}</TableCell>
                      <TableCell>{booking.phone}</TableCell>
                      <TableCell>{new Date(booking.from_date).toLocaleString()}</TableCell>
                      <TableCell>{new Date(booking.to_date).toLocaleString()}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                          booking.status === 'assigned' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {booking.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        {booking.assigned_ambulance_id ? getAmbulancePlate(booking.assigned_ambulance_id) : 'Not assigned'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assign Driver to Ambulance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Select Driver</Label>
                  <Select value={assignmentForm.driver_id} onValueChange={(value) => setAssignmentForm(prev => ({ ...prev, driver_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select driver" />
                    </SelectTrigger>
                    <SelectContent>
                      {drivers.map((driver) => (
                        <SelectItem key={driver.id} value={driver.id}>
                          {driver.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Select Ambulance</Label>
                  <Select value={assignmentForm.ambulance_id} onValueChange={(value) => setAssignmentForm(prev => ({ ...prev, ambulance_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select ambulance" />
                    </SelectTrigger>
                    <SelectContent>
                      {ambulances.map((ambulance) => (
                        <SelectItem key={ambulance.id} value={ambulance.id}>
                          {ambulance.license_plate} - {ambulance.model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="assignment_date">Date</Label>
                  <Input
                    id="assignment_date"
                    type="date"
                    value={assignmentForm.date}
                    onChange={(e) => setAssignmentForm(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={assignDriver} className="w-full">
                    Assign Driver
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Driver Assignments</CardTitle>
              <CardDescription>View daily driver assignments</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Driver</TableHead>
                    <TableHead>Ambulance</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell className="font-medium">{getDriverName(assignment.driver_id)}</TableCell>
                      <TableCell>{getAmbulancePlate(assignment.ambulance_id)}</TableCell>
                      <TableCell>{new Date(assignment.date).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
