from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date, timedelta, timezone
import uuid
import random
import time
import jwt
import hashlib
import psycopg
import os
from contextlib import asynccontextmanager

DATABASE_URL = os.getenv("DATABASE_URL") or os.getenv("POSTGRES_URL") or os.getenv("FLY_POSTGRES_URL") or "postgresql://digimov_admin:digimovdbpwd@localhost:5432/diginitymov_ambulette"

async def get_db_connection():
    try:
        return await psycopg.AsyncConnection.connect(DATABASE_URL)
    except Exception as e:
        print(f"Database connection failed: {e}")
        raise HTTPException(status_code=503, detail="Database service unavailable")

async def init_database():
    """Initialize database with schema if not exists"""
    try:
        print(f"Connecting to database with URL: {DATABASE_URL}")
        conn = await get_db_connection()
        print("Database connection established successfully")
        
        result = await conn.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'bookings'
            );
        """)
        tables_exist = await result.fetchone()
        print(f"Tables exist check result: {tables_exist[0]}")
        
        if not tables_exist[0]:
            # Try multiple possible paths for the schema file
            possible_paths = [
                os.path.join(os.path.dirname(__file__), "..", "..", "database_schema.sql"),
                os.path.join(os.path.dirname(__file__), "..", "database_schema.sql"),
                "database_schema.sql",
                os.path.join(os.getcwd(), "database_schema.sql")
            ]
            
            schema_sql = None
            for schema_path in possible_paths:
                if os.path.exists(schema_path):
                    print(f"Found schema file at: {schema_path}")
                    with open(schema_path, 'r') as f:
                        schema_sql = f.read()
                    break
            
            if schema_sql:
                # Use psql to execute the schema file directly
                import subprocess
                import tempfile
                
                try:
                    # Create a temporary file with the schema
                    with tempfile.NamedTemporaryFile(mode='w', suffix='.sql', delete=False) as temp_file:
                        temp_file.write(schema_sql)
                        temp_file_path = temp_file.name
                    
                    # Execute the schema using psql
                    env = os.environ.copy()
                    env['PGPASSWORD'] = 'digimovdbpwd'  # Set password from DATABASE_URL
                    
                    result = subprocess.run([
                        'psql', 
                        '-h', 'localhost',
                        '-U', 'digimov_admin',
                        '-d', 'diginitymov_ambulette',
                        '-f', temp_file_path
                    ], capture_output=True, text=True, env=env)
                    
                    # Clean up temp file
                    os.unlink(temp_file_path)
                    
                    if result.returncode == 0:
                        print("Database schema initialized successfully using psql")
                    else:
                        print(f"psql error: {result.stderr}")
                        # Fallback to direct execution
                        await conn.execute(schema_sql)
                        await conn.commit()
                        print("Database schema initialized successfully using direct execution")
                        
                except Exception as e:
                    print(f"Error executing schema: {e}")
                    # Try direct execution as last resort
                    try:
                        await conn.execute(schema_sql)
                        await conn.commit()
                        print("Database schema initialized successfully using direct execution")
                    except Exception as e2:
                        print(f"Direct execution also failed: {e2}")
                        await conn.rollback()
            else:
                print("Schema file not found in any of the expected locations:")
                for path in possible_paths:
                    print(f"  - {path}")
                print("Skipping initialization")
        else:
            print("Database schema already exists, skipping initialization")
            
        await conn.close()
    except Exception as e:
        print(f"Database initialization error: {e}")
        print("Continuing without database - some features may not work")

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_database()
    yield
    pass

app = FastAPI(title="Diginitymov Ambulette Booking API", lifespan=lifespan)

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

ADMIN_USERS = {
    "admin": hashlib.sha256("admin123".encode()).hexdigest(),
    "manager": hashlib.sha256("manager123".encode()).hexdigest()
}

security = HTTPBearer()

employees_db = {}
attendance_db = {}
bookings_db = {}
ambulances_db = {}
drivers_db = {}
assignments_db = {}
expenses_db = {}
otp_storage = {}

class Location(BaseModel):
    address: str
    latitude: float
    longitude: float

class BookingRequest(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    health_condition: Optional[str] = None
    pickup_location: Location
    drop_location: Location
    from_date: datetime
    to_date: datetime

class Booking(BaseModel):
    id: str
    name: str
    phone: str
    email: Optional[str] = None
    health_condition: Optional[str] = None
    pickup_location: Location
    drop_location: Location
    from_date: datetime
    to_date: datetime
    status: str = "pending"
    assigned_ambulance_id: Optional[str] = None
    created_at: datetime

class Ambulance(BaseModel):
    id: str
    license_plate: str
    model: str
    capacity: int
    status: str = "available"

class Driver(BaseModel):
    id: str
    name: str
    phone: str
    license_number: str
    status: str = "available"

class DriverAssignment(BaseModel):
    id: str
    driver_id: str
    ambulance_id: str
    date: date

class AmbulanceRequest(BaseModel):
    license_plate: str
    model: str
    capacity: int

class DriverRequest(BaseModel):
    name: str
    phone: str
    license_number: str

class AssignDriverRequest(BaseModel):
    driver_id: str
    ambulance_id: str
    date: date

class AssignAmbulanceRequest(BaseModel):
    booking_id: str
    ambulance_id: str

class Employee(BaseModel):
    id: str
    name: str
    phone: str
    email: Optional[str] = None
    position: str
    status: str = "active"

class EmployeeRequest(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    position: str

class EmployeeUpdateRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    position: Optional[str] = None
    status: Optional[str] = None

class Attendance(BaseModel):
    id: str
    employee_id: str
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None
    date: date

class AttendanceRequest(BaseModel):
    employee_id: str

class OTPRequest(BaseModel):
    phone: str

class OTPVerifyRequest(BaseModel):
    phone: str
    otp: str

class PhoneVerifyRequest(BaseModel):
    phone: str

class OTPResponse(BaseModel):
    message: str
    expires_at: datetime

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str

class Expense(BaseModel):
    id: str
    category: str
    type: str
    amount: float
    description: Optional[str] = None
    bill_file_path: Optional[str] = None
    employee_id: Optional[str] = None
    ambulance_id: Optional[str] = None
    expense_date: date
    created_at: datetime

class ExpenseRequest(BaseModel):
    category: str
    type: str
    amount: float
    description: Optional[str] = None
    employee_id: Optional[str] = None
    ambulance_id: Optional[str] = None
    expense_date: Optional[date] = None

class ExpenseUpdateRequest(BaseModel):
    category: Optional[str] = None
    type: Optional[str] = None
    amount: Optional[float] = None
    description: Optional[str] = None
    employee_id: Optional[str] = None
    ambulance_id: Optional[str] = None
    expense_date: Optional[date] = None

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        return username
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}

@app.post("/api/admin/login", response_model=LoginResponse)
async def login(login_request: LoginRequest):
    username = login_request.username
    password_hash = hashlib.sha256(login_request.password.encode()).hexdigest()
    
    if username not in ADMIN_USERS or ADMIN_USERS[username] != password_hash:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": username}, expires_delta=access_token_expires
    )
    
    return LoginResponse(access_token=access_token, token_type="bearer")

@app.post("/api/send-otp", response_model=OTPResponse)
async def send_otp(otp_request: OTPRequest):
    otp = str(random.randint(100000, 999999))
    expires_at = datetime.now() + timedelta(minutes=5)
    
    conn = await get_db_connection()
    try:
        await conn.execute(
            "DELETE FROM otp_verifications WHERE phone = %s",
            (otp_request.phone,)
        )
        
        await conn.execute(
            "INSERT INTO otp_verifications (phone, otp_code, expires_at) VALUES (%s, %s, %s)",
            (otp_request.phone, otp, expires_at)
        )
        await conn.commit()
        
        print(f"OTP for {otp_request.phone}: {otp}")  # For development/testing
        
        return OTPResponse(
            message=f"OTP sent to {otp_request.phone}. For testing: {otp}",
            expires_at=expires_at
        )
    finally:
        await conn.close()

@app.post("/api/verify-otp")
async def verify_otp(verify_request: OTPVerifyRequest):
    conn = await get_db_connection()
    try:
        cursor = await conn.execute(
            "SELECT otp_code, expires_at, verified FROM otp_verifications WHERE phone = %s ORDER BY created_at DESC LIMIT 1",
            (verify_request.phone,)
        )
        result = await cursor.fetchone()
        
        if not result:
            raise HTTPException(status_code=400, detail="No OTP found for this phone number")
        
        otp_code, expires_at, verified = result
        
        if datetime.now(timezone.utc) > expires_at:
            await conn.execute("DELETE FROM otp_verifications WHERE phone = %s", (verify_request.phone,))
            await conn.commit()
            raise HTTPException(status_code=400, detail="OTP has expired")
        
        if otp_code != verify_request.otp:
            raise HTTPException(status_code=400, detail="Invalid OTP")
        
        await conn.execute(
            "UPDATE otp_verifications SET verified = true, verified_at = %s WHERE phone = %s AND otp_code = %s",
            (datetime.now(), verify_request.phone, verify_request.otp)
        )
        await conn.commit()
        
        return {"message": "OTP verified successfully"}
    finally:
        await conn.close()

@app.post("/api/bookings", response_model=Booking)
async def create_booking(booking_request: BookingRequest):
    conn = await get_db_connection()
    try:
        cursor = await conn.execute(
            "SELECT verified, expires_at FROM otp_verifications WHERE phone = %s AND verified = true ORDER BY verified_at DESC LIMIT 1",
            (booking_request.phone,)
        )
        result = await cursor.fetchone()
        
        if not result:
            raise HTTPException(status_code=400, detail="Phone number must be verified with OTP before booking")
        
        verified, expires_at = result
        if datetime.now(timezone.utc) > expires_at:
            raise HTTPException(status_code=400, detail="OTP verification has expired. Please verify again")
        
        pickup_location_id = str(uuid.uuid4())
        drop_location_id = str(uuid.uuid4())
        
        await conn.execute(
            "INSERT INTO locations (id, address, latitude, longitude) VALUES (%s, %s, %s, %s)",
            (pickup_location_id, booking_request.pickup_location.address, 
             booking_request.pickup_location.latitude, booking_request.pickup_location.longitude)
        )
        
        await conn.execute(
            "INSERT INTO locations (id, address, latitude, longitude) VALUES (%s, %s, %s, %s)",
            (drop_location_id, booking_request.drop_location.address,
             booking_request.drop_location.latitude, booking_request.drop_location.longitude)
        )
        
        booking_id = str(uuid.uuid4())
        await conn.execute(
            """INSERT INTO bookings (id, name, phone, email, health_condition, pickup_location_id, drop_location_id, 
               from_date, to_date, status) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
            (booking_id, booking_request.name, booking_request.phone, booking_request.email, booking_request.health_condition,
             pickup_location_id, drop_location_id, booking_request.from_date, booking_request.to_date, "pending")
        )
        
        await conn.commit()
        
        await conn.execute("DELETE FROM otp_verifications WHERE phone = %s", (booking_request.phone,))
        await conn.commit()
        
        booking = Booking(
            id=booking_id,
            name=booking_request.name,
            phone=booking_request.phone,
            email=booking_request.email,
            health_condition=booking_request.health_condition,
            pickup_location=booking_request.pickup_location,
            drop_location=booking_request.drop_location,
            from_date=booking_request.from_date,
            to_date=booking_request.to_date,
            created_at=datetime.now()
        )
        
        return booking
    finally:
        await conn.close()

@app.get("/api/bookings", response_model=List[Booking])
async def get_bookings(current_user: str = Depends(verify_token)):
    conn = await get_db_connection()
    try:
        cursor = await conn.execute("""
            SELECT b.id, b.name, b.phone, b.email, b.health_condition, b.from_date, b.to_date, b.status, 
                   b.assigned_ambulance_id, b.created_at,
                   pl.address as pickup_address, pl.latitude as pickup_lat, pl.longitude as pickup_lng,
                   dl.address as drop_address, dl.latitude as drop_lat, dl.longitude as drop_lng
            FROM bookings b
            JOIN locations pl ON b.pickup_location_id = pl.id
            JOIN locations dl ON b.drop_location_id = dl.id
            ORDER BY b.created_at DESC
        """)
        results = await cursor.fetchall()
        
        bookings = []
        for row in results:
            # Ensure ID is properly converted to string
            booking_id = str(row[0]) if row[0] is not None else None
            if booking_id is None:
                print(f"Warning: Booking ID is None for row")
                continue
            
            booking = Booking(
                id=booking_id,
                name=row[1],
                phone=row[2],
                email=row[3],
                health_condition=row[4],
                from_date=row[5],
                to_date=row[6],
                status=row[7],
                assigned_ambulance_id=str(row[8]) if row[8] is not None else None,
                created_at=row[9],
                pickup_location=Location(address=row[10], latitude=float(row[11]), longitude=float(row[12])),
                drop_location=Location(address=row[13], latitude=float(row[14]), longitude=float(row[15]))
            )
            bookings.append(booking)
        
        return bookings
    finally:
        await conn.close()

@app.get("/api/bookings/{booking_id}", response_model=Booking)
async def get_booking(booking_id: str):
    conn = await get_db_connection()
    try:
        cursor = await conn.execute("""
            SELECT b.id, b.name, b.phone, b.email, b.health_condition, b.from_date, b.to_date, b.status, 
                   b.assigned_ambulance_id, b.created_at,
                   pl.address as pickup_address, pl.latitude as pickup_lat, pl.longitude as pickup_lng,
                   dl.address as drop_address, dl.latitude as drop_lat, dl.longitude as drop_lng
            FROM bookings b
            JOIN locations pl ON b.pickup_location_id = pl.id
            JOIN locations dl ON b.drop_location_id = dl.id
            WHERE b.id = %s
        """, (booking_id,))
        result = await cursor.fetchone()
        
        if not result:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        # Ensure ID is properly converted to string
        booking_id = str(result[0]) if result[0] is not None else None
        if booking_id is None:
            raise HTTPException(status_code=500, detail="Booking ID is missing from database")
        
        booking = Booking(
            id=booking_id,
            name=result[1],
            phone=result[2],
            email=result[3],
            health_condition=result[4],
            from_date=result[5],
            to_date=result[6],
            status=result[7],
            assigned_ambulance_id=str(result[8]) if result[8] is not None else None,
            created_at=result[9],
            pickup_location=Location(address=result[10], latitude=float(result[11]), longitude=float(result[12])),
            drop_location=Location(address=result[13], latitude=float(result[14]), longitude=float(result[15]))
        )
        
        return booking
    finally:
        await conn.close()

@app.post("/api/bookings/by-phone", response_model=List[Booking])
async def get_bookings_by_phone(verify_request: PhoneVerifyRequest):
    conn = await get_db_connection()
    try:
        cursor = await conn.execute(
            "SELECT verified, expires_at FROM otp_verifications WHERE phone = %s AND verified = true ORDER BY verified_at DESC LIMIT 1",
            (verify_request.phone,)
        )
        result = await cursor.fetchone()
        
        if not result:
            raise HTTPException(status_code=400, detail="Phone number must be verified with OTP before viewing bookings")
        
        verified, expires_at = result
        if datetime.now(timezone.utc) > expires_at:
            raise HTTPException(status_code=400, detail="OTP verification has expired. Please verify again")
        
        cursor = await conn.execute("""
            SELECT b.id, b.name, b.phone, b.email, b.health_condition, b.from_date, b.to_date, b.status, 
                   b.assigned_ambulance_id, b.created_at,
                   pl.address as pickup_address, pl.latitude as pickup_lat, pl.longitude as pickup_lng,
                   dl.address as drop_address, dl.latitude as drop_lat, dl.longitude as drop_lng
            FROM bookings b
            JOIN locations pl ON b.pickup_location_id = pl.id
            JOIN locations dl ON b.drop_location_id = dl.id
            WHERE b.phone = %s
            ORDER BY b.created_at DESC
        """, (verify_request.phone,))
        results = await cursor.fetchall()
        print(f"Query results: {results}")
        bookings = []
        for i, row in enumerate(results):
            print(f"Processing row {i}: {row}")
            try:
                # Ensure ID is properly converted to string
                booking_id = str(row[0]) if row[0] is not None else None
                if booking_id is None:
                    print(f"Warning: Booking ID is None for row {i}")
                    continue
                
                booking = Booking(
                    id=booking_id,
                    name=row[1],
                    phone=row[2],
                    email=row[3],
                    health_condition=row[4],
                    from_date=row[5],
                    to_date=row[6],
                    status=row[7],
                    assigned_ambulance_id=str(row[8]) if row[8] is not None else None,
                    created_at=row[9],
                    pickup_location=Location(address=row[10], latitude=float(row[11]), longitude=float(row[12])),
                    drop_location=Location(address=row[13], latitude=float(row[14]), longitude=float(row[15]))
                )
                bookings.append(booking)
            except Exception as e:
                print(f"Error creating booking from row {i}: {e}")
                print(f"Row data: {row}")
                print(f"Row types: {[type(val) for val in row]}")
                raise
        
        return bookings
    finally:
        await conn.close()

@app.post("/api/admin/ambulances", response_model=Ambulance)
async def create_ambulance(ambulance_request: AmbulanceRequest, current_user: str = Depends(verify_token)):
    conn = await get_db_connection()
    try:
        ambulance_id = str(uuid.uuid4())
        await conn.execute(
            "INSERT INTO ambulances (id, license_plate, model, capacity) VALUES (%s, %s, %s, %s)",
            (ambulance_id, ambulance_request.license_plate, ambulance_request.model, ambulance_request.capacity)
        )
        await conn.commit()
        
        ambulance = Ambulance(
            id=ambulance_id,
            license_plate=ambulance_request.license_plate,
            model=ambulance_request.model,
            capacity=ambulance_request.capacity
        )
        return ambulance
    finally:
        await conn.close()

@app.get("/api/admin/ambulances", response_model=List[Ambulance])
async def get_ambulances(current_user: str = Depends(verify_token)):
    conn = await get_db_connection()
    try:
        cursor = await conn.execute("SELECT id, license_plate, model, capacity, status FROM ambulances ORDER BY created_at DESC")
        results = await cursor.fetchall()
        
        ambulances = []
        for row in results:
            ambulance = Ambulance(
                id=row[0],
                license_plate=row[1],
                model=row[2],
                capacity=row[3],
                status=row[4]
            )
            ambulances.append(ambulance)
        
        return ambulances
    finally:
        await conn.close()

@app.delete("/api/admin/ambulances/{ambulance_id}")
async def delete_ambulance(ambulance_id: str, current_user: str = Depends(verify_token)):
    conn = await get_db_connection()
    try:
        cursor = await conn.execute("DELETE FROM ambulances WHERE id = %s", (ambulance_id,))
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Ambulance not found")
        await conn.commit()
        return {"message": "Ambulance deleted successfully"}
    finally:
        await conn.close()

@app.post("/api/admin/drivers", response_model=Driver)
async def create_driver(driver_request: DriverRequest, current_user: str = Depends(verify_token)):
    conn = await get_db_connection()
    try:
        cursor = await conn.execute(
            "SELECT verified, expires_at FROM otp_verifications WHERE phone = %s AND verified = true ORDER BY verified_at DESC LIMIT 1",
            (driver_request.phone,)
        )
        result = await cursor.fetchone()
        
        if not result:
            raise HTTPException(status_code=400, detail="Phone number must be verified with OTP before creating driver")
        
        verified, expires_at = result
        if datetime.now(timezone.utc) > expires_at:
            raise HTTPException(status_code=400, detail="OTP verification has expired. Please verify again")
        
        driver_id = str(uuid.uuid4())
        await conn.execute(
            "INSERT INTO drivers (id, name, phone, license_number) VALUES (%s, %s, %s, %s)",
            (driver_id, driver_request.name, driver_request.phone, driver_request.license_number)
        )
        await conn.commit()
        
        await conn.execute("DELETE FROM otp_verifications WHERE phone = %s", (driver_request.phone,))
        await conn.commit()
        
        driver = Driver(
            id=driver_id,
            name=driver_request.name,
            phone=driver_request.phone,
            license_number=driver_request.license_number
        )
        
        return driver
    finally:
        await conn.close()

@app.get("/api/admin/drivers", response_model=List[Driver])
async def get_drivers(current_user: str = Depends(verify_token)):
    conn = await get_db_connection()
    try:
        cursor = await conn.execute("SELECT id, name, phone, license_number, status FROM drivers ORDER BY created_at DESC")
        results = await cursor.fetchall()
        
        drivers = []
        for row in results:
            driver = Driver(
                id=row[0],
                name=row[1],
                phone=row[2],
                license_number=row[3],
                status=row[4]
            )
            drivers.append(driver)
        
        return drivers
    finally:
        await conn.close()

@app.delete("/api/admin/drivers/{driver_id}")
async def delete_driver(driver_id: str, current_user: str = Depends(verify_token)):
    conn = await get_db_connection()
    try:
        cursor = await conn.execute("DELETE FROM drivers WHERE id = %s", (driver_id,))
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Driver not found")
        await conn.commit()
        return {"message": "Driver deleted successfully"}
    finally:
        await conn.close()

@app.post("/api/admin/assign-driver", response_model=DriverAssignment)
async def assign_driver_to_ambulance(assignment_request: AssignDriverRequest, current_user: str = Depends(verify_token)):
    conn = await get_db_connection()
    try:
        assignment_id = str(uuid.uuid4())
        await conn.execute(
            "INSERT INTO driver_assignments (id, driver_id, ambulance_id, assignment_date) VALUES (%s, %s, %s, %s)",
            (assignment_id, assignment_request.driver_id, assignment_request.ambulance_id, assignment_request.date)
        )
        await conn.commit()
        
        assignment = DriverAssignment(
            id=assignment_id,
            driver_id=assignment_request.driver_id,
            ambulance_id=assignment_request.ambulance_id,
            date=assignment_request.date
        )
        return assignment
    finally:
        await conn.close()

@app.get("/api/admin/driver-assignments", response_model=List[DriverAssignment])
async def get_driver_assignments(current_user: str = Depends(verify_token)):
    conn = await get_db_connection()
    try:
        cursor = await conn.execute("SELECT id, driver_id, ambulance_id, assignment_date FROM driver_assignments ORDER BY assignment_date DESC")
        results = await cursor.fetchall()
        
        assignments = []
        for row in results:
            assignment = DriverAssignment(
                id=row[0],
                driver_id=row[1],
                ambulance_id=row[2],
                date=row[3]
            )
            assignments.append(assignment)
        
        return assignments
    finally:
        await conn.close()

@app.post("/api/admin/assign-ambulance")
async def assign_ambulance_to_booking(assignment_request: AssignAmbulanceRequest, current_user: str = Depends(verify_token)):
    conn = await get_db_connection()
    try:
        cursor = await conn.execute("SELECT id FROM bookings WHERE id = %s", (assignment_request.booking_id,))
        if not await cursor.fetchone():
            raise HTTPException(status_code=404, detail="Booking not found")
        
        cursor = await conn.execute("SELECT id FROM ambulances WHERE id = %s", (assignment_request.ambulance_id,))
        if not await cursor.fetchone():
            raise HTTPException(status_code=404, detail="Ambulance not found")
        
        await conn.execute(
            "UPDATE bookings SET assigned_ambulance_id = %s, status = 'assigned' WHERE id = %s",
            (assignment_request.ambulance_id, assignment_request.booking_id)
        )
        await conn.commit()
        
        return {"message": "Ambulance assigned to booking successfully"}
    finally:
        await conn.close()

@app.post("/api/admin/employees", response_model=Employee)
async def create_employee(employee_request: EmployeeRequest, current_user: str = Depends(verify_token)):
    try:
        conn = await get_db_connection()
        try:
            employee_id = str(uuid.uuid4())
            await conn.execute(
                "INSERT INTO employees (id, name, phone, email, position) VALUES (%s, %s, %s, %s, %s)",
                (employee_id, employee_request.name, employee_request.phone, employee_request.email, employee_request.position)
            )
            await conn.commit()
            
            employee = Employee(
                id=employee_id,
                name=employee_request.name,
                phone=employee_request.phone,
                email=employee_request.email,
                position=employee_request.position
            )
            return employee
        finally:
            await conn.close()
    except:
        # Fallback to in-memory storage
        employee_id = str(uuid.uuid4())
        employee = Employee(
            id=employee_id,
            name=employee_request.name,
            phone=employee_request.phone,
            email=employee_request.email,
            position=employee_request.position,
            status="active"
        )
        employees_db[employee_id] = employee
        return employee

@app.get("/api/admin/employees", response_model=List[Employee])
async def get_employees(current_user: str = Depends(verify_token)):
    try:
        conn = await get_db_connection()
        try:
            cursor = await conn.execute("SELECT id, name, phone, email, position, status FROM employees ORDER BY created_at DESC")
            results = await cursor.fetchall()
            
            employees = []
            for row in results:
                employee = Employee(
                    id=row[0],
                    name=row[1],
                    phone=row[2],
                    email=row[3],
                    position=row[4],
                    status=row[5]
                )
                employees.append(employee)
            
            return employees
        finally:
            await conn.close()
    except:
        # Fallback to in-memory storage
        return list(employees_db.values())

@app.put("/api/admin/employees/{employee_id}", response_model=Employee)
async def update_employee(employee_id: str, employee_update: EmployeeUpdateRequest, current_user: str = Depends(verify_token)):
    conn = await get_db_connection()
    try:
        cursor = await conn.execute("SELECT id, name, phone, email, position, status FROM employees WHERE id = %s", (employee_id,))
        result = await cursor.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="Employee not found")
        
        current_employee = Employee(
            id=result[0],
            name=result[1],
            phone=result[2],
            email=result[3],
            position=result[4],
            status=result[5]
        )
        
        update_fields = []
        update_values = []
        
        if employee_update.name is not None:
            update_fields.append("name = %s")
            update_values.append(employee_update.name)
            current_employee.name = employee_update.name
            
        if employee_update.phone is not None:
            update_fields.append("phone = %s")
            update_values.append(employee_update.phone)
            current_employee.phone = employee_update.phone
            
        if employee_update.email is not None:
            update_fields.append("email = %s")
            update_values.append(employee_update.email)
            current_employee.email = employee_update.email
            
        if employee_update.position is not None:
            update_fields.append("position = %s")
            update_values.append(employee_update.position)
            current_employee.position = employee_update.position
            
        if employee_update.status is not None:
            update_fields.append("status = %s")
            update_values.append(employee_update.status)
            current_employee.status = employee_update.status
        
        if update_fields:
            update_values.append(employee_id)
            query = f"UPDATE employees SET {', '.join(update_fields)} WHERE id = %s"
            await conn.execute(query, update_values)
            await conn.commit()
        
        return current_employee
    finally:
        await conn.close()

@app.delete("/api/admin/employees/{employee_id}")
async def delete_employee(employee_id: str, current_user: str = Depends(verify_token)):
    try:
        conn = await get_db_connection()
        try:
            cursor = await conn.execute("DELETE FROM employees WHERE id = %s", (employee_id,))
            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail="Employee not found")
            await conn.commit()
            return {"message": "Employee deleted successfully"}
        finally:
            await conn.close()
    except:
        # Fallback to in-memory storage
        if employee_id not in employees_db:
            raise HTTPException(status_code=404, detail="Employee not found")
        del employees_db[employee_id]
        attendance_to_delete = [k for k, v in attendance_db.items() if v.employee_id == employee_id]
        for k in attendance_to_delete:
            del attendance_db[k]
        return {"message": "Employee deleted successfully"}

@app.post("/api/admin/attendance/check-in", response_model=Attendance)
async def check_in_employee(attendance_request: AttendanceRequest, current_user: str = Depends(verify_token)):
    conn = await get_db_connection()
    try:
        today = datetime.now(timezone.utc).date()
        
        cursor = await conn.execute("SELECT id FROM employees WHERE id = %s", (attendance_request.employee_id,))
        if not await cursor.fetchone():
            raise HTTPException(status_code=404, detail="Employee not found")
        
        cursor = await conn.execute(
            "SELECT id, check_in_time FROM attendance WHERE employee_id = %s AND date = %s",
            (attendance_request.employee_id, today)
        )
        existing_record = await cursor.fetchone()
        
        if existing_record and existing_record[1] is not None:
            raise HTTPException(status_code=400, detail="Employee already checked in today")
        
        check_in_time = datetime.now(timezone.utc)
        
        if existing_record:
            attendance_id = existing_record[0]
            await conn.execute(
                "UPDATE attendance SET check_in_time = %s WHERE id = %s",
                (check_in_time, attendance_id)
            )
        else:
            attendance_id = str(uuid.uuid4())
            await conn.execute(
                "INSERT INTO attendance (id, employee_id, check_in_time, date) VALUES (%s, %s, %s, %s)",
                (attendance_id, attendance_request.employee_id, check_in_time, today)
            )
        
        await conn.commit()
        
        attendance = Attendance(
            id=attendance_id,
            employee_id=attendance_request.employee_id,
            check_in_time=check_in_time,
            check_out_time=None,
            date=today
        )
        return attendance
    finally:
        await conn.close()

@app.post("/api/admin/attendance/check-out", response_model=Attendance)
async def check_out_employee(attendance_request: AttendanceRequest, current_user: str = Depends(verify_token)):
    conn = await get_db_connection()
    try:
        today = datetime.now(timezone.utc).date()
        
        cursor = await conn.execute("SELECT id FROM employees WHERE id = %s", (attendance_request.employee_id,))
        if not await cursor.fetchone():
            raise HTTPException(status_code=404, detail="Employee not found")
        
        cursor = await conn.execute(
            "SELECT id, check_in_time, check_out_time FROM attendance WHERE employee_id = %s AND date = %s",
            (attendance_request.employee_id, today)
        )
        existing_record = await cursor.fetchone()
        
        if not existing_record or existing_record[1] is None:
            raise HTTPException(status_code=400, detail="Employee must check in before checking out")
        
        if existing_record[2] is not None:
            raise HTTPException(status_code=400, detail="Employee already checked out today")
        
        check_out_time = datetime.now(timezone.utc)
        attendance_id = existing_record[0]
        
        await conn.execute(
            "UPDATE attendance SET check_out_time = %s WHERE id = %s",
            (check_out_time, attendance_id)
        )
        await conn.commit()
        
        attendance = Attendance(
            id=attendance_id,
            employee_id=attendance_request.employee_id,
            check_in_time=existing_record[1],
            check_out_time=check_out_time,
            date=today
        )
        return attendance
    finally:
        await conn.close()

@app.get("/api/admin/attendance", response_model=List[Attendance])
async def get_attendance(current_user: str = Depends(verify_token)):
    try:
        conn = await get_db_connection()
        try:
            cursor = await conn.execute(
                "SELECT id, employee_id, check_in_time, check_out_time, date FROM attendance ORDER BY date DESC, check_in_time DESC"
            )
            results = await cursor.fetchall()
            
            attendance_records = []
            for row in results:
                attendance = Attendance(
                    id=row[0],
                    employee_id=row[1],
                    check_in_time=row[2],
                    check_out_time=row[3],
                    date=row[4]
                )
                attendance_records.append(attendance)
            
            return attendance_records
        finally:
            await conn.close()
    except:
        # Fallback to in-memory storage
        return sorted(list(attendance_db.values()), key=lambda x: (x.date, x.check_in_time or datetime.min.replace(tzinfo=timezone.utc)), reverse=True)

@app.get("/api/admin/attendance/{employee_id}", response_model=List[Attendance])
async def get_employee_attendance(employee_id: str, current_user: str = Depends(verify_token)):
    conn = await get_db_connection()
    try:
        cursor = await conn.execute("SELECT id FROM employees WHERE id = %s", (employee_id,))
        if not await cursor.fetchone():
            raise HTTPException(status_code=404, detail="Employee not found")
        
        cursor = await conn.execute(
            "SELECT id, employee_id, check_in_time, check_out_time, date FROM attendance WHERE employee_id = %s ORDER BY date DESC",
            (employee_id,)
        )
        results = await cursor.fetchall()
        
        attendance_records = []
        for row in results:
            attendance = Attendance(
                id=row[0],
                employee_id=row[1],
                check_in_time=row[2],
                check_out_time=row[3],
                date=row[4]
            )
            attendance_records.append(attendance)
        
        return attendance_records
    finally:
        await conn.close()

@app.post("/api/admin/expenses")
async def create_expense(expense: ExpenseRequest, token: HTTPAuthorizationCredentials = Depends(verify_token)):
    expense_id = str(uuid.uuid4())
    expense_date = expense.expense_date or date.today()
    
    try:
        conn = await get_db_connection()
        async with conn.cursor() as cur:
            await cur.execute("""
                INSERT INTO expenses (id, category, type, amount, description, employee_id, ambulance_id, expense_date, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (expense_id, expense.category, expense.type, expense.amount, expense.description, 
                  expense.employee_id, expense.ambulance_id, expense_date, datetime.now(timezone.utc)))
            await conn.commit()
    except Exception as e:
        print(f"Database error: {e}")
        expenses_db[expense_id] = {
            "id": expense_id,
            "category": expense.category,
            "type": expense.type,
            "amount": expense.amount,
            "description": expense.description,
            "bill_file_path": None,
            "employee_id": expense.employee_id,
            "ambulance_id": expense.ambulance_id,
            "expense_date": expense_date.isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    
    return {"message": "Expense created successfully", "id": expense_id}

@app.get("/api/admin/expenses")
async def get_expenses(token: HTTPAuthorizationCredentials = Depends(verify_token)):
    try:
        conn = await get_db_connection()
        async with conn.cursor() as cur:
            await cur.execute("""
                SELECT e.*, emp.name as employee_name, a.license_plate as ambulance_plate
                FROM expenses e
                LEFT JOIN employees emp ON e.employee_id = emp.id
                LEFT JOIN ambulances a ON e.ambulance_id = a.id
                ORDER BY e.created_at DESC
            """)
            expenses = await cur.fetchall()
            return [dict(expense) for expense in expenses]
    except Exception as e:
        print(f"Database error: {e}")
        return list(expenses_db.values())

@app.put("/api/admin/expenses/{expense_id}")
async def update_expense(expense_id: str, expense: ExpenseUpdateRequest, token: HTTPAuthorizationCredentials = Depends(verify_token)):
    try:
        conn = await get_db_connection()
        async with conn.cursor() as cur:
            update_fields = []
            values = []
            for field, value in expense.dict(exclude_unset=True).items():
                if value is not None:
                    update_fields.append(f"{field} = %s")
                    values.append(value)
            
            if update_fields:
                update_fields.append("updated_at = %s")
                values.append(datetime.now(timezone.utc))
                values.append(expense_id)
                
                query = f"UPDATE expenses SET {', '.join(update_fields)} WHERE id = %s"
                await cur.execute(query, values)
                await conn.commit()
    except Exception as e:
        print(f"Database error: {e}")
        if expense_id in expenses_db:
            for field, value in expense.dict(exclude_unset=True).items():
                if value is not None:
                    expenses_db[expense_id][field] = value
    
    return {"message": "Expense updated successfully"}

@app.delete("/api/admin/expenses/{expense_id}")
async def delete_expense(expense_id: str, token: HTTPAuthorizationCredentials = Depends(verify_token)):
    try:
        conn = await get_db_connection()
        async with conn.cursor() as cur:
            await cur.execute("DELETE FROM expenses WHERE id = %s", (expense_id,))
            await conn.commit()
    except Exception as e:
        print(f"Database error: {e}")
        if expense_id in expenses_db:
            del expenses_db[expense_id]
    
    return {"message": "Expense deleted successfully"}

@app.post("/api/admin/expenses/{expense_id}/upload-bill")
async def upload_bill(expense_id: str, file: UploadFile = File(...), token: HTTPAuthorizationCredentials = Depends(verify_token)):
    upload_dir = "uploads/bills"
    os.makedirs(upload_dir, exist_ok=True)
    
    file_extension = file.filename.split('.')[-1] if '.' in file.filename else ''
    unique_filename = f"{expense_id}_{int(time.time())}.{file_extension}"
    file_path = os.path.join(upload_dir, unique_filename)
    
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    try:
        conn = await get_db_connection()
        async with conn.cursor() as cur:
            await cur.execute("UPDATE expenses SET bill_file_path = %s WHERE id = %s", (file_path, expense_id))
            await conn.commit()
    except Exception as e:
        print(f"Database error: {e}")
        if expense_id in expenses_db:
            expenses_db[expense_id]["bill_file_path"] = file_path
    
    return {"message": "Bill uploaded successfully", "file_path": file_path}
