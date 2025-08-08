import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Trash2, Plus, UserCheck, Truck, LogOut, LayoutDashboard, Calendar, Users, DollarSign, BarChart3, Edit, Check, X } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { toast } from 'sonner'
import Login from './Login'
import { useAuth } from '../contexts/AuthContext'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
} from '@/components/ui/sidebar'

interface Ambulance {
  id: string
  license_plate: string
  model: string
  capacity: number
  status: 'available' | 'busy'
}

interface Driver {
  id: string
  name: string
  phone: string
  license_number: string
  status: 'available' | 'busy'
}

interface Booking {
  id: string
  name: string
  phone: string
  email?: string
  health_condition?: string
  pickup_location?: { address: string; lat: number; lng: number }
  drop_location?: { address: string; lat: number; lng: number }
  from_date: string
  to_date: string
  status: 'pending' | 'assigned' | 'completed'
  assigned_ambulance_id?: string
}

interface Assignment {
  id: string
  driver_id: string
  ambulance_id: string
  date: string
}

interface Employee {
  id: string
  name: string
  phone: string
  email?: string
  position: string
  status: 'active' | 'inactive'
}

interface Attendance {
  id: string
  employee_id: string
  check_in_time?: string
  check_out_time?: string
  date: string
}

interface Expense {
  id: string
  category: 'ambulette' | 'employee'
  type: 'fuel' | 'maintenance' | 'other' | 'salary' | 'bonus'
  amount: number
  description?: string
  bill_file_path?: string
  employee_id?: string
  ambulance_id?: string
  employee_name?: string
  ambulance_plate?: string
  expense_date: string
  created_at: string
}

export default function AdminDashboard() {
  const { isAuthenticated, token, login, logout } = useAuth()
  const [ambulances, setAmbulances] = useState<Ambulance[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [activeMenuItem, setActiveMenuItem] = useState('dashboard')

  const menuItems = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'bookings', label: 'Bookings', icon: Calendar },
    { key: 'ambulettes', label: 'Ambulettes', icon: Truck },
    { key: 'drivers', label: 'Drivers', icon: UserCheck },
    { key: 'assignments', label: 'Assignments', icon: Users },
    { key: 'employee-management', label: 'Employee Management', icon: Users },
    { key: 'expenses', label: 'Expenses', icon: DollarSign },
    { key: 'reports', label: 'Reports', icon: BarChart3 },
  ]

  const [newAmbulance, setNewAmbulance] = useState({
    license_plate: '',
    model: '',
    capacity: 1
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

  const [newEmployee, setNewEmployee] = useState({
    name: '',
    phone: '',
    email: '',
    position: ''
  })

  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)

  const [newExpense, setNewExpense] = useState({
    category: 'ambulette' as 'ambulette' | 'employee',
    type: 'fuel' as 'fuel' | 'maintenance' | 'other' | 'salary' | 'bonus',
    amount: '',
    description: '',
    employee_id: '',
    ambulance_id: '',
    expense_date: new Date().toISOString().split('T')[0]
  })

  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    if (isAuthenticated) {
      fetchData()
    }
  }, [isAuthenticated])

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  })

  const fetchData = async () => {
    try {
      const [ambulancesRes, driversRes, bookingsRes, assignmentsRes, employeesRes, attendanceRes, expensesRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/admin/ambulances`, { headers: getAuthHeaders() }),
        fetch(`${import.meta.env.VITE_API_URL}/api/admin/drivers`, { headers: getAuthHeaders() }),
        fetch(`${import.meta.env.VITE_API_URL}/api/admin/bookings`, { headers: getAuthHeaders() }),
        fetch(`${import.meta.env.VITE_API_URL}/api/admin/driver-assignments`, { headers: getAuthHeaders() }),
        fetch(`${import.meta.env.VITE_API_URL}/api/admin/employees`, { headers: getAuthHeaders() }),
        fetch(`${import.meta.env.VITE_API_URL}/api/admin/attendance`, { headers: getAuthHeaders() }),
        fetch(`${import.meta.env.VITE_API_URL}/api/admin/expenses`, { headers: getAuthHeaders() })
      ])

      if (ambulancesRes.ok) setAmbulances(await ambulancesRes.json())
      if (driversRes.ok) setDrivers(await driversRes.json())
      if (bookingsRes.ok) setBookings(await bookingsRes.json())
      if (assignmentsRes.ok) setAssignments(await assignmentsRes.json())
      if (employeesRes.ok) setEmployees(await employeesRes.json())
      if (attendanceRes.ok) setAttendance(await attendanceRes.json())
      if (expensesRes.ok) setExpenses(await expensesRes.json())
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const addAmbulance = async () => {
    if (!newAmbulance.license_plate || !newAmbulance.model) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/ambulances`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newAmbulance)
      })

      if (response.ok) {
        toast.success('Ambulance added successfully')
        setNewAmbulance({ license_plate: '', model: '', capacity: 1 })
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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/ambulances/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
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
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/drivers`, {
        method: 'POST',
        headers: getAuthHeaders(),
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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/drivers/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
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
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/assign-driver`, {
        method: 'POST',
        headers: getAuthHeaders(),
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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/assign-ambulance`, {
        method: 'POST',
        headers: getAuthHeaders(),
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

  const addEmployee = async () => {
    if (!newEmployee.name || !newEmployee.phone || !newEmployee.position) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/employees`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newEmployee)
      })

      if (response.ok) {
        toast.success('Employee added successfully')
        setNewEmployee({ name: '', phone: '', email: '', position: '' })
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.detail || 'Failed to add employee')
      }
    } catch (error) {
      toast.error('Error adding employee')
    }
  }

  const updateEmployee = async (employee: Employee) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/employees/${employee.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: employee.name,
          phone: employee.phone,
          email: employee.email,
          position: employee.position,
          status: employee.status
        })
      })

      if (response.ok) {
        toast.success('Employee updated successfully')
        setEditingEmployee(null)
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.detail || 'Failed to update employee')
      }
    } catch (error) {
      toast.error('Error updating employee')
    }
  }

  const deleteEmployee = async (id: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/employees/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })

      if (response.ok) {
        toast.success('Employee deleted successfully')
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.detail || 'Failed to delete employee')
      }
    } catch (error) {
      toast.error('Error deleting employee')
    }
  }

  const checkInEmployee = async (employeeId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/attendance/check-in`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ employee_id: employeeId })
      })

      if (response.ok) {
        toast.success('Employee checked in successfully')
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.detail || 'Failed to check in employee')
      }
    } catch (error) {
      toast.error('Error checking in employee')
    }
  }

  const checkOutEmployee = async (employeeId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/attendance/check-out`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ employee_id: employeeId })
      })

      if (response.ok) {
        toast.success('Employee checked out successfully')
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.detail || 'Failed to check out employee')
      }
    } catch (error) {
      toast.error('Error checking out employee')
    }
  }

  const getEmployeeName = (id: string) => {
    return employees.find(e => e.id === id)?.name || 'Unknown'
  }

  const getTodayAttendance = (employeeId: string) => {
    const today = new Date().toISOString().split('T')[0]
    return attendance.find(a => a.employee_id === employeeId && a.date === today)
  }

  const addExpense = async () => {
    if (!newExpense.category || !newExpense.type || !newExpense.amount) {
      toast.error('Please fill in all required fields')
      return
    }

    if (newExpense.category === 'ambulette' && !['fuel', 'maintenance', 'other'].includes(newExpense.type)) {
      toast.error('Invalid expense type for ambulette category')
      return
    }
    if (newExpense.category === 'employee' && !['salary', 'bonus', 'other'].includes(newExpense.type)) {
      toast.error('Invalid expense type for employee category')
      return
    }

    if (newExpense.category === 'employee' && !newExpense.employee_id) {
      toast.error('Please select an employee for employee expenses')
      return
    }
    if (newExpense.category === 'ambulette' && !newExpense.ambulance_id) {
      toast.error('Please select an ambulette for ambulette expenses')
      return
    }

    try {
      const expenseData = {
        ...newExpense,
        amount: parseFloat(newExpense.amount),
        employee_id: newExpense.category === 'employee' ? newExpense.employee_id : null,
        ambulance_id: newExpense.category === 'ambulette' ? newExpense.ambulance_id : null
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/expenses`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(expenseData)
      })

      if (response.ok) {
        const result = await response.json()
        
        if (selectedFile && ['fuel', 'maintenance'].includes(newExpense.type)) {
          await uploadBill(result.id, selectedFile)
        }
        
        toast.success('Expense added successfully')
        setNewExpense({
          category: 'ambulette',
          type: 'fuel',
          amount: '',
          description: '',
          employee_id: '',
          ambulance_id: '',
          expense_date: new Date().toISOString().split('T')[0]
        })
        setSelectedFile(null)
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.detail || 'Failed to add expense')
      }
    } catch (error) {
      toast.error('Error adding expense')
    }
  }

  const updateExpense = async (expense: Expense) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/expenses/${expense.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          category: expense.category,
          type: expense.type,
          amount: expense.amount,
          description: expense.description,
          employee_id: expense.employee_id,
          ambulance_id: expense.ambulance_id,
          expense_date: expense.expense_date
        })
      })

      if (response.ok) {
        toast.success('Expense updated successfully')
        setEditingExpense(null)
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.detail || 'Failed to update expense')
      }
    } catch (error) {
      toast.error('Error updating expense')
    }
  }

  const deleteExpense = async (id: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/expenses/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })

      if (response.ok) {
        toast.success('Expense deleted successfully')
        fetchData()
      } else {
        const error = await response.json()
        toast.error(error.detail || 'Failed to delete expense')
      }
    } catch (error) {
      toast.error('Error deleting expense')
    }
  }

  const uploadBill = async (expenseId: string, file: File) => {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/expenses/${expenseId}/upload-bill`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (response.ok) {
        toast.success('Bill uploaded successfully')
      } else {
        toast.error('Failed to upload bill')
      }
    } catch (error) {
      toast.error('Error uploading bill')
    }
  }

  const getExpenseTypeOptions = (category: string) => {
    if (category === 'ambulette') {
      return ['fuel', 'maintenance', 'other']
    } else {
      return ['salary', 'bonus', 'other']
    }
  }

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookings.length}</div>
            <p className="text-xs text-muted-foreground">
              {bookings.filter(b => b.status === 'pending').length} pending
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ambulettes</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ambulances.length}</div>
            <p className="text-xs text-muted-foreground">
              {ambulances.filter(a => a.status === 'available').length} available
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Drivers</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{drivers.length}</div>
            <p className="text-xs text-muted-foreground">
              {drivers.filter(d => d.status === 'available').length} available
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assignments</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignments.length}</div>
            <p className="text-xs text-muted-foreground">Today's assignments</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderEmployeeManagement = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add Employee</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              placeholder="Employee Name"
              value={newEmployee.name}
              onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
            />
            <Input
              placeholder="Phone Number"
              value={newEmployee.phone}
              onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
            />
            <Input
              placeholder="Email (Optional)"
              value={newEmployee.email}
              onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
            />
            <Input
              placeholder="Position"
              value={newEmployee.position}
              onChange={(e) => setNewEmployee({ ...newEmployee, position: e.target.value })}
            />
          </div>
          <Button onClick={addEmployee} className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Employees ({employees.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Today's Attendance</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => {
                  const todayAttendance = getTodayAttendance(employee.id)
                  const isEditing = editingEmployee?.id === employee.id
                  
                  return (
                    <TableRow key={employee.id}>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={editingEmployee.name}
                            onChange={(e) => setEditingEmployee({ ...editingEmployee, name: e.target.value })}
                          />
                        ) : (
                          employee.name
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={editingEmployee.phone}
                            onChange={(e) => setEditingEmployee({ ...editingEmployee, phone: e.target.value })}
                          />
                        ) : (
                          employee.phone
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={editingEmployee.email || ''}
                            onChange={(e) => setEditingEmployee({ ...editingEmployee, email: e.target.value })}
                          />
                        ) : (
                          employee.email || 'N/A'
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={editingEmployee.position}
                            onChange={(e) => setEditingEmployee({ ...editingEmployee, position: e.target.value })}
                          />
                        ) : (
                          employee.position
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <select
                            value={editingEmployee.status}
                            onChange={(e) => setEditingEmployee({ ...editingEmployee, status: e.target.value as 'active' | 'inactive' })}
                            className="border rounded px-2 py-1"
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        ) : (
                          <span className={`px-2 py-1 rounded text-xs ${
                            employee.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {employee.status}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {todayAttendance ? (
                          <div className="text-sm">
                            <div>In: {todayAttendance.check_in_time ? new Date(todayAttendance.check_in_time).toLocaleTimeString() : 'N/A'}</div>
                            <div>Out: {todayAttendance.check_out_time ? new Date(todayAttendance.check_out_time).toLocaleTimeString() : 'N/A'}</div>
                          </div>
                        ) : (
                          <span className="text-gray-500">No record</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {isEditing ? (
                            <>
                              <Button size="sm" onClick={() => updateEmployee(editingEmployee)}>
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingEmployee(null)}>
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button size="sm" variant="outline" onClick={() => setEditingEmployee(employee)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => deleteEmployee(employee.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              {!todayAttendance?.check_in_time && (
                                <Button size="sm" variant="outline" onClick={() => checkInEmployee(employee.id)}>
                                  Check In
                                </Button>
                              )}
                              {todayAttendance?.check_in_time && !todayAttendance?.check_out_time && (
                                <Button size="sm" variant="outline" onClick={() => checkOutEmployee(employee.id)}>
                                  Check Out
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Attendance Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Hours Worked</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendance.slice(0, 10).map((record) => {
                  const hoursWorked = record.check_in_time && record.check_out_time
                    ? ((new Date(record.check_out_time).getTime() - new Date(record.check_in_time).getTime()) / (1000 * 60 * 60)).toFixed(2)
                    : 'N/A'
                  
                  return (
                    <TableRow key={record.id}>
                      <TableCell>{getEmployeeName(record.employee_id)}</TableCell>
                      <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {record.check_in_time ? new Date(record.check_in_time).toLocaleTimeString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {record.check_out_time ? new Date(record.check_out_time).toLocaleTimeString() : 'N/A'}
                      </TableCell>
                      <TableCell>{hoursWorked} hours</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderExpenses = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add Expense</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={newExpense.category} onValueChange={(value: 'ambulette' | 'employee') => {
                setNewExpense({ 
                  ...newExpense, 
                  category: value,
                  type: value === 'ambulette' ? 'fuel' : 'salary',
                  employee_id: '',
                  ambulance_id: ''
                })
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ambulette">Ambulette</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="type">Type</Label>
              <Select value={newExpense.type} onValueChange={(value) => setNewExpense({ ...newExpense, type: value as any })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {getExpenseTypeOptions(newExpense.category).map(type => (
                    <SelectItem key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={newExpense.amount}
                onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="expense_date">Date</Label>
              <Input
                id="expense_date"
                type="date"
                value={newExpense.expense_date}
                onChange={(e) => setNewExpense({ ...newExpense, expense_date: e.target.value })}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {newExpense.category === 'employee' && (
              <div>
                <Label htmlFor="employee">Employee</Label>
                <Select value={newExpense.employee_id} onValueChange={(value) => setNewExpense({ ...newExpense, employee_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map(employee => (
                      <SelectItem key={employee.id} value={employee.id}>{employee.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {newExpense.category === 'ambulette' && (
              <div>
                <Label htmlFor="ambulance">Ambulette</Label>
                <Select value={newExpense.ambulance_id} onValueChange={(value) => setNewExpense({ ...newExpense, ambulance_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select ambulette" />
                  </SelectTrigger>
                  <SelectContent>
                    {ambulances.map(ambulance => (
                      <SelectItem key={ambulance.id} value={ambulance.id}>{ambulance.license_plate} - {ambulance.model}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                placeholder="Expense description"
                value={newExpense.description}
                onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
              />
            </div>
          </div>

          {['fuel', 'maintenance'].includes(newExpense.type) && (
            <div className="mt-4">
              <Label htmlFor="bill">Bill Upload (Required)</Label>
              <Input
                id="bill"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
            </div>
          )}

          <Button onClick={addExpense} className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Expenses ({expenses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Employee/Ambulette</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Bill</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => {
                  const isEditing = editingExpense?.id === expense.id
                  return (
                    <TableRow key={expense.id}>
                      <TableCell>
                        {isEditing ? (
                          <Select value={editingExpense.category} onValueChange={(value: 'ambulette' | 'employee') => 
                            setEditingExpense({ ...editingExpense, category: value })
                          }>
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ambulette">Ambulette</SelectItem>
                              <SelectItem value="employee">Employee</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="capitalize">{expense.category}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Select value={editingExpense.type} onValueChange={(value) => 
                            setEditingExpense({ ...editingExpense, type: value as any })
                          }>
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {getExpenseTypeOptions(editingExpense.category).map(type => (
                                <SelectItem key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="capitalize">{expense.type}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="number"
                            step="0.01"
                            value={editingExpense.amount}
                            onChange={(e) => setEditingExpense({ ...editingExpense, amount: parseFloat(e.target.value) })}
                            className="w-24"
                          />
                        ) : (
                          `$${expense.amount.toFixed(2)}`
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={editingExpense.description || ''}
                            onChange={(e) => setEditingExpense({ ...editingExpense, description: e.target.value })}
                            className="w-32"
                          />
                        ) : (
                          expense.description || 'N/A'
                        )}
                      </TableCell>
                      <TableCell>
                        {expense.category === 'employee' ? expense.employee_name : expense.ambulance_plate}
                      </TableCell>
                      <TableCell>{new Date(expense.expense_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {expense.bill_file_path ? (
                          <span className="text-green-600">✓ Uploaded</span>
                        ) : (
                          ['fuel', 'maintenance'].includes(expense.type) ? (
                            <span className="text-red-600">Required</span>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {isEditing ? (
                            <>
                              <Button size="sm" onClick={() => updateExpense(editingExpense)}>
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingExpense(null)}>
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button size="sm" variant="outline" onClick={() => setEditingExpense(expense)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => deleteExpense(expense.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const generateMonthlyBookingsData = () => {
    const months = [
      'Jan 2024', 'Feb 2024', 'Mar 2024', 'Apr 2024', 'May 2024', 'Jun 2024',
      'Jul 2024', 'Aug 2024', 'Sep 2024', 'Oct 2024', 'Nov 2024', 'Dec 2024'
    ]
    return months.map(month => ({
      month,
      bookings: Math.floor(Math.random() * 50) + 10
    }))
  }

  const generateMonthlyExpensesData = () => {
    const months = [
      'Jan 2024', 'Feb 2024', 'Mar 2024', 'Apr 2024', 'May 2024', 'Jun 2024',
      'Jul 2024', 'Aug 2024', 'Sep 2024', 'Oct 2024', 'Nov 2024', 'Dec 2024'
    ]
    return months.map(month => ({
      month,
      ambulette: Math.floor(Math.random() * 5000) + 2000,
      employee: Math.floor(Math.random() * 8000) + 3000,
      total: 0
    })).map(item => ({
      ...item,
      total: item.ambulette + item.employee
    }))
  }

  const renderReports = () => {
    const bookingsData = generateMonthlyBookingsData()
    const expensesData = generateMonthlyExpensesData()

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Monthly Reports
            </CardTitle>
            <CardDescription>Static reports showing monthly bookings and expenses data</CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Monthly Bookings Report
            </CardTitle>
            <CardDescription>Number of ambulette bookings per month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bookingsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="bookings" fill="#3b82f6" name="Bookings" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {bookingsData.reduce((sum, item) => sum + item.bookings, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Bookings</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {Math.round(bookingsData.reduce((sum, item) => sum + item.bookings, 0) / 12)}
                </p>
                <p className="text-sm text-muted-foreground">Avg per Month</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">
                  {Math.max(...bookingsData.map(item => item.bookings))}
                </p>
                <p className="text-sm text-muted-foreground">Peak Month</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">
                  {Math.min(...bookingsData.map(item => item.bookings))}
                </p>
                <p className="text-sm text-muted-foreground">Lowest Month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Monthly Expenses Report
            </CardTitle>
            <CardDescription>Ambulette and employee expenses breakdown by month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expensesData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, '']} />
                  <Legend />
                  <Bar dataKey="ambulette" stackId="a" fill="#ef4444" name="Ambulette Expenses" />
                  <Bar dataKey="employee" stackId="a" fill="#22c55e" name="Employee Expenses" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  ${expensesData.reduce((sum, item) => sum + item.total, 0).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-500">
                  ${expensesData.reduce((sum, item) => sum + item.ambulette, 0).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Ambulette Total</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-500">
                  ${expensesData.reduce((sum, item) => sum + item.employee, 0).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Employee Total</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">
                  ${Math.round(expensesData.reduce((sum, item) => sum + item.total, 0) / 12).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Avg per Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderAmbulettes = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Truck className="h-5 w-5 mr-2" />
            Add New Ambulette
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                min="1"
                value={newAmbulance.capacity}
                onChange={(e) => setNewAmbulance(prev => ({ ...prev, capacity: parseInt(e.target.value) || 1 }))}
                placeholder="4"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={addAmbulance} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Ambulette
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ambulettes List</CardTitle>
          <CardDescription>Manage your ambulette fleet</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="overflow-x-auto">
            <Table className="min-w-full">
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
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderDrivers = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserCheck className="h-5 w-5 mr-2" />
            Add New Driver
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <Label htmlFor="driver_license">License Number</Label>
              <Input
                id="driver_license"
                value={newDriver.license_number}
                onChange={(e) => setNewDriver(prev => ({ ...prev, license_number: e.target.value }))}
                placeholder="DL123456"
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
        <CardContent className="p-4 sm:p-6">
          <div className="overflow-x-auto">
            <Table className="min-w-full">
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
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderBookings = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserCheck className="h-5 w-5 mr-2" />
            Assign Ambulette to Booking
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label>Select Booking</Label>
              <Select value={bookingAssignment.booking_id} onValueChange={(value) => setBookingAssignment(prev => ({ ...prev, booking_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select booking" />
                </SelectTrigger>
                <SelectContent>
                  {bookings.filter(b => b.status === 'pending').map((booking) => (
                    <SelectItem key={booking.id} value={booking.id}>
                      {booking.name} - {booking.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Select Ambulette</Label>
              <Select value={bookingAssignment.ambulance_id} onValueChange={(value) => setBookingAssignment(prev => ({ ...prev, ambulance_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select ambulette" />
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
                Assign Ambulette
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Bookings</CardTitle>
          <CardDescription>View and manage ambulette bookings</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="overflow-x-auto">
            <Table className="min-w-[800px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Health Condition</TableHead>
                  <TableHead>Pickup Location</TableHead>
                  <TableHead>Drop Location</TableHead>
                  <TableHead>From Date</TableHead>
                  <TableHead>To Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned Ambulette</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">{booking.name}</TableCell>
                    <TableCell>{booking.phone}</TableCell>
                    <TableCell>{booking.email || 'N/A'}</TableCell>
                    <TableCell className="max-w-xs truncate" title={booking.health_condition || 'None'}>
                      {booking.health_condition || 'None'}
                    </TableCell>
                    <TableCell className="max-w-xs truncate" title={booking.pickup_location?.address || 'N/A'}>
                      {booking.pickup_location?.address || 'N/A'}
                    </TableCell>
                    <TableCell className="max-w-xs truncate" title={booking.drop_location?.address || 'N/A'}>
                      {booking.drop_location?.address || 'N/A'}
                    </TableCell>
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
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderAssignments = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserCheck className="h-5 w-5 mr-2" />
            Assign Driver to Ambulance
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <Label>Select Ambulette</Label>
              <Select value={assignmentForm.ambulance_id} onValueChange={(value) => setAssignmentForm(prev => ({ ...prev, ambulance_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select ambulette" />
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
        <CardContent className="p-4 sm:p-6">
          <div className="overflow-x-auto">
            <Table className="min-w-full">
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
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderContent = () => {
    switch (activeMenuItem) {
      case 'dashboard':
        return renderDashboard()
      case 'bookings':
        return renderBookings()
      case 'ambulettes':
        return renderAmbulettes()
      case 'drivers':
        return renderDrivers()
      case 'assignments':
        return renderAssignments()
      case 'employee-management':
        return renderEmployeeManagement()
      case 'expenses':
        return renderExpenses()
      case 'reports':
        return renderReports()
      default:
        return renderDashboard()
    }
  }

  if (!isAuthenticated) {
    return <Login onLogin={login} />
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <SidebarProvider>
        <div className="flex h-[calc(100vh-8rem)] w-full peer relative">
          <Sidebar variant="inset" className="!relative !inset-auto !h-full !left-auto !right-auto">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {menuItems.map((item) => (
                      <SidebarMenuItem key={item.key}>
                        <SidebarMenuButton
                          isActive={activeMenuItem === item.key}
                          onClick={() => setActiveMenuItem(item.key)}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="border-t border-sidebar-border">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={logout}>
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarFooter>
          </Sidebar>
          <SidebarInset>
            <div className="flex items-center justify-between mb-4 p-4 border-b">
              <h2 className="text-lg font-medium">
                {menuItems.find(item => item.key === activeMenuItem)?.label || 'Dashboard'}
              </h2>
              <Button onClick={fetchData} variant="outline" size="sm">
                Refresh Data
              </Button>
            </div>
            <main className="flex-1 overflow-auto p-4">
              {renderContent()}
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  )
}
