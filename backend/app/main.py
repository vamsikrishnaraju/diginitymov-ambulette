from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date, timedelta
import uuid
import random
import time
import jwt
import hashlib

app = FastAPI(title="Diginitymov Ambulette Booking API")

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

ambulances_db = []
drivers_db = []
bookings_db = []
driver_assignments_db = []
otp_db = {}

SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

ADMIN_USERS = {
    "admin": hashlib.sha256("admin123".encode()).hexdigest(),
    "manager": hashlib.sha256("manager123".encode()).hexdigest()
}

security = HTTPBearer()

class Location(BaseModel):
    address: str
    latitude: float
    longitude: float

class BookingRequest(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    pickup_location: Location
    drop_location: Location
    from_date: datetime
    to_date: datetime

class Booking(BaseModel):
    id: str
    name: str
    phone: str
    email: Optional[str] = None
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

class OTPRequest(BaseModel):
    phone: str

class OTPVerifyRequest(BaseModel):
    phone: str
    otp: str

class OTPResponse(BaseModel):
    message: str
    expires_at: datetime

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str

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
    expires_at = datetime.now().timestamp() + 300  # 5 minutes expiry
    
    otp_db[otp_request.phone] = {
        "otp": otp,
        "expires_at": expires_at,
        "verified": False
    }
    
    print(f"OTP for {otp_request.phone}: {otp}")  # For development/testing
    
    return OTPResponse(
        message=f"OTP sent to {otp_request.phone}. For testing: {otp}",
        expires_at=datetime.fromtimestamp(expires_at)
    )

@app.post("/api/verify-otp")
async def verify_otp(verify_request: OTPVerifyRequest):
    phone_data = otp_db.get(verify_request.phone)
    
    if not phone_data:
        raise HTTPException(status_code=400, detail="No OTP found for this phone number")
    
    if time.time() > phone_data["expires_at"]:
        del otp_db[verify_request.phone]
        raise HTTPException(status_code=400, detail="OTP has expired")
    
    if phone_data["otp"] != verify_request.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    otp_db[verify_request.phone]["verified"] = True
    
    return {"message": "OTP verified successfully"}

@app.post("/api/bookings", response_model=Booking)
async def create_booking(booking_request: BookingRequest):
    phone_data = otp_db.get(booking_request.phone)
    
    if not phone_data or not phone_data.get("verified"):
        raise HTTPException(status_code=400, detail="Phone number must be verified with OTP before booking")
    
    if time.time() > phone_data["expires_at"]:
        del otp_db[booking_request.phone]
        raise HTTPException(status_code=400, detail="OTP verification has expired. Please verify again")
    
    booking_id = str(uuid.uuid4())
    booking = Booking(
        id=booking_id,
        name=booking_request.name,
        phone=booking_request.phone,
        email=booking_request.email,
        pickup_location=booking_request.pickup_location,
        drop_location=booking_request.drop_location,
        from_date=booking_request.from_date,
        to_date=booking_request.to_date,
        created_at=datetime.now()
    )
    bookings_db.append(booking.dict())
    
    del otp_db[booking_request.phone]
    
    return booking

@app.get("/api/bookings", response_model=List[Booking])
async def get_bookings(current_user: str = Depends(verify_token)):
    return [Booking(**booking) for booking in bookings_db]

@app.get("/api/bookings/{booking_id}", response_model=Booking)
async def get_booking(booking_id: str):
    booking = next((b for b in bookings_db if b["id"] == booking_id), None)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return Booking(**booking)

@app.post("/api/admin/ambulances", response_model=Ambulance)
async def create_ambulance(ambulance_request: AmbulanceRequest, current_user: str = Depends(verify_token)):
    ambulance_id = str(uuid.uuid4())
    ambulance = Ambulance(
        id=ambulance_id,
        license_plate=ambulance_request.license_plate,
        model=ambulance_request.model,
        capacity=ambulance_request.capacity
    )
    ambulances_db.append(ambulance.dict())
    return ambulance

@app.get("/api/admin/ambulances", response_model=List[Ambulance])
async def get_ambulances(current_user: str = Depends(verify_token)):
    return [Ambulance(**ambulance) for ambulance in ambulances_db]

@app.delete("/api/admin/ambulances/{ambulance_id}")
async def delete_ambulance(ambulance_id: str, current_user: str = Depends(verify_token)):
    global ambulances_db
    ambulances_db = [a for a in ambulances_db if a["id"] != ambulance_id]
    return {"message": "Ambulance deleted successfully"}

@app.post("/api/admin/drivers", response_model=Driver)
async def create_driver(driver_request: DriverRequest, current_user: str = Depends(verify_token)):
    phone_data = otp_db.get(driver_request.phone)
    
    if not phone_data or not phone_data.get("verified"):
        raise HTTPException(status_code=400, detail="Phone number must be verified with OTP before creating driver")
    
    if time.time() > phone_data["expires_at"]:
        del otp_db[driver_request.phone]
        raise HTTPException(status_code=400, detail="OTP verification has expired. Please verify again")
    
    driver_id = str(uuid.uuid4())
    driver = Driver(
        id=driver_id,
        name=driver_request.name,
        phone=driver_request.phone,
        license_number=driver_request.license_number
    )
    drivers_db.append(driver.dict())
    
    del otp_db[driver_request.phone]
    
    return driver

@app.get("/api/admin/drivers", response_model=List[Driver])
async def get_drivers(current_user: str = Depends(verify_token)):
    return [Driver(**driver) for driver in drivers_db]

@app.delete("/api/admin/drivers/{driver_id}")
async def delete_driver(driver_id: str, current_user: str = Depends(verify_token)):
    global drivers_db
    drivers_db = [d for d in drivers_db if d["id"] != driver_id]
    return {"message": "Driver deleted successfully"}

@app.post("/api/admin/assign-driver", response_model=DriverAssignment)
async def assign_driver_to_ambulance(assignment_request: AssignDriverRequest, current_user: str = Depends(verify_token)):
    assignment_id = str(uuid.uuid4())
    assignment = DriverAssignment(
        id=assignment_id,
        driver_id=assignment_request.driver_id,
        ambulance_id=assignment_request.ambulance_id,
        date=assignment_request.date
    )
    driver_assignments_db.append(assignment.dict())
    return assignment

@app.get("/api/admin/driver-assignments", response_model=List[DriverAssignment])
async def get_driver_assignments(current_user: str = Depends(verify_token)):
    return [DriverAssignment(**assignment) for assignment in driver_assignments_db]

@app.post("/api/admin/assign-ambulance")
async def assign_ambulance_to_booking(assignment_request: AssignAmbulanceRequest, current_user: str = Depends(verify_token)):
    booking = next((b for b in bookings_db if b["id"] == assignment_request.booking_id), None)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    ambulance = next((a for a in ambulances_db if a["id"] == assignment_request.ambulance_id), None)
    if not ambulance:
        raise HTTPException(status_code=404, detail="Ambulance not found")
    
    for i, b in enumerate(bookings_db):
        if b["id"] == assignment_request.booking_id:
            bookings_db[i]["assigned_ambulance_id"] = assignment_request.ambulance_id
            bookings_db[i]["status"] = "assigned"
            break
    
    return {"message": "Ambulance assigned to booking successfully"}
