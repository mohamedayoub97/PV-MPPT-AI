"""
weather_api.py — FastAPI Backend for Open-Meteo Weather Dashboard
Serves weather data for Tunis (36.819°N, 10.1658°E) and any location

Install:
    pip install fastapi uvicorn openmeteo-requests requests-cache retry-requests pandas

Run:
    uvicorn weather_api:app --reload --port 8000

Endpoints:
    GET /api/weather              → full weather data (current + hourly + daily)
    GET /api/weather/current      → current conditions only
    GET /api/weather/hourly       → 168h hourly forecast
    GET /api/weather/daily        → 7-day daily forecast
    GET /api/weather?lat=X&lon=Y  → custom location
"""

import math
from datetime import datetime, timezone
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import openmeteo_requests
import pandas as pd
import numpy as np
import requests_cache
from retry_requests import retry

from sqlmodel import SQLModel, Field, create_engine, Session, select
from passlib.context import CryptContext
from jose import JWTError, jwt
from typing import Optional, List
from pydantic import BaseModel
import os

# ── Auth & DB Setup ──────────────────────────────────────────
SECRET_KEY = "your-secret-key-keep-it-safe" # In production, use env var
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 24 hours

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    email: str = Field(index=True, unique=True)
    hashed_password: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_login: Optional[datetime] = None
    login_count: int = 0

class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

sqlite_url = "sqlite:///./users.db"
engine = create_engine(sqlite_url)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session

# ── App setup ──────────────────────────────────────────
app = FastAPI(title="PV-MPPT AI & Weather API", version="1.1.0")

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve the frontend static files
app.mount("/static", StaticFiles(directory="."), name="static")

# ── Open-Meteo client (cached + retry) ─────────────────
cache_session = requests_cache.CachedSession(".cache", expire_after=1800)  # 30min cache
retry_session = retry(cache_session, retries=5, backoff_factor=0.2)
openmeteo    = openmeteo_requests.Client(session=retry_session)

# ── Default location: Tunis ────────────────────────────
DEFAULT_LAT = 36.819
DEFAULT_LON = 10.1658
DEFAULT_CITY = "Tunis, Tunisia"

# ── WMO Weather Code descriptions ──────────────────────
WMO_CODES = {
    0:  {"desc": "Clear sky",              "icon": "☀️",  "class": "clear"},
    1:  {"desc": "Mainly clear",           "icon": "🌤️", "class": "clear"},
    2:  {"desc": "Partly cloudy",          "icon": "⛅",  "class": "cloudy"},
    3:  {"desc": "Overcast",               "icon": "☁️",  "class": "cloudy"},
    45: {"desc": "Fog",                    "icon": "🌫️", "class": "fog"},
    48: {"desc": "Depositing rime fog",    "icon": "🌫️", "class": "fog"},
    51: {"desc": "Light drizzle",          "icon": "🌦️", "class": "rain"},
    53: {"desc": "Moderate drizzle",       "icon": "🌧️", "class": "rain"},
    55: {"desc": "Dense drizzle",          "icon": "🌧️", "class": "rain"},
    61: {"desc": "Slight rain",            "icon": "🌧️", "class": "rain"},
    63: {"desc": "Moderate rain",          "icon": "🌧️", "class": "rain"},
    65: {"desc": "Heavy rain",             "icon": "🌧️", "class": "rain"},
    71: {"desc": "Slight snowfall",        "icon": "🌨️", "class": "snow"},
    73: {"desc": "Moderate snowfall",      "icon": "❄️",  "class": "snow"},
    75: {"desc": "Heavy snowfall",         "icon": "❄️",  "class": "snow"},
    80: {"desc": "Slight showers",         "icon": "🌦️", "class": "rain"},
    81: {"desc": "Moderate showers",       "icon": "🌧️", "class": "rain"},
    82: {"desc": "Violent showers",        "icon": "⛈️",  "class": "storm"},
    95: {"desc": "Thunderstorm",           "icon": "⛈️",  "class": "storm"},
    96: {"desc": "Thunderstorm w/ hail",   "icon": "⛈️",  "class": "storm"},
    99: {"desc": "Heavy thunderstorm",     "icon": "🌩️", "class": "storm"},
}

def wmo(code: int) -> dict:
    code = int(code) if not math.isnan(code) else 0
    return WMO_CODES.get(code, {"desc": "Unknown", "icon": "🌡️", "class": "clear"})

def safe(val):
    """Convert numpy float to Python float, handling NaN."""
    if val is None: return None
    try:
        v = float(val)
        return None if math.isnan(v) else round(v, 2)
    except (TypeError, ValueError):
        return None

def wind_dir_label(deg: float) -> str:
    dirs = ["N","NE","E","SE","S","SW","W","NW"]
    if deg is None or math.isnan(float(deg)): return "—"
    return dirs[round(float(deg) / 45) % 8]


# ── Core fetch function ─────────────────────────────────
def fetch_weather(lat: float, lon: float) -> dict:
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude":  lat,
        "longitude": lon,
        "daily": [
            "weather_code", "temperature_2m_max", "temperature_2m_min",
            "apparent_temperature_max", "apparent_temperature_min",
            "sunrise", "sunset", "daylight_duration", "sunshine_duration",
            "uv_index_max", "uv_index_clear_sky_max",
            "rain_sum", "showers_sum", "snowfall_sum",
            "precipitation_hours", "precipitation_sum",
            "precipitation_probability_max",
            "wind_speed_10m_max", "wind_gusts_10m_max",
            "shortwave_radiation_sum", "wind_direction_10m_dominant",
            "et0_fao_evapotranspiration",
        ],
        "hourly": [
            "temperature_2m", "relative_humidity_2m",
            "precipitation_probability", "apparent_temperature",
            "dew_point_2m", "rain", "precipitation", "showers",
            "snow_depth", "snowfall", "weather_code",
            "pressure_msl", "surface_pressure",
            "cloud_cover", "cloud_cover_low", "cloud_cover_mid", "cloud_cover_high",
            "visibility", "et0_fao_evapotranspiration", "evapotranspiration",
            "vapour_pressure_deficit",
            "wind_speed_10m", "wind_speed_80m", "wind_speed_120m",
            "wind_direction_10m", "wind_speed_180m",
            "wind_direction_80m", "wind_direction_120m", "wind_direction_180m",
            "wind_gusts_10m",
            "temperature_80m", "temperature_120m", "temperature_180m",
            "soil_temperature_0cm", "soil_temperature_18cm",
            "soil_temperature_6cm", "soil_temperature_54cm",
            "soil_moisture_1_to_3cm", "soil_moisture_9_to_27cm",
            "soil_moisture_27_to_81cm", "soil_moisture_3_to_9cm",
            "soil_moisture_0_to_1cm",
        ],
        "current": [
            "temperature_2m", "is_day", "relative_humidity_2m",
            "apparent_temperature", "precipitation", "rain", "showers",
            "snowfall", "weather_code", "cloud_cover",
            "pressure_msl", "surface_pressure",
            "wind_speed_10m", "wind_direction_10m", "wind_gusts_10m",
        ],
        "timezone": "auto",
    }

    responses = openmeteo.weather_api(url, params=params)
    response  = responses[0]

    # ── Current ──────────────────────────────────────────
    c = response.Current()
    cur_vars = [c.Variables(i).Value() for i in range(15)]
    wcode = int(cur_vars[8]) if cur_vars[8] is not None else 0
    current = {
        "temperature":          safe(cur_vars[0]),
        "is_day":               bool(cur_vars[1]),
        "humidity":             safe(cur_vars[2]),
        "apparent_temperature": safe(cur_vars[3]),
        "precipitation":        safe(cur_vars[4]),
        "rain":                 safe(cur_vars[5]),
        "showers":              safe(cur_vars[6]),
        "snowfall":             safe(cur_vars[7]),
        "weather_code":         wcode,
        "weather":              wmo(wcode),
        "cloud_cover":          safe(cur_vars[9]),
        "pressure_msl":         safe(cur_vars[10]),
        "surface_pressure":     safe(cur_vars[11]),
        "wind_speed":           safe(cur_vars[12]),
        "wind_direction":       safe(cur_vars[13]),
        "wind_direction_label": wind_dir_label(cur_vars[13]),
        "wind_gusts":           safe(cur_vars[14]),
        "time":                 datetime.fromtimestamp(c.Time(), tz=timezone.utc).isoformat(),
    }

    # ── Hourly (next 48h for frontend, full 168h stored) ──
    h = response.Hourly()
    dates = pd.date_range(
        start    = pd.to_datetime(h.Time(),    unit="s", utc=True),
        end      = pd.to_datetime(h.TimeEnd(), unit="s", utc=True),
        freq     = pd.Timedelta(seconds=h.Interval()),
        inclusive= "left"
    ).strftime("%Y-%m-%dT%H:%M").tolist()

    def hv(i): return [safe(x) for x in h.Variables(i).ValuesAsNumpy().tolist()]

    hourly_keys = [
        "temperature_2m", "relative_humidity_2m", "precipitation_probability",
        "apparent_temperature", "dew_point_2m", "rain", "precipitation",
        "showers", "snow_depth", "snowfall", "weather_code", "pressure_msl",
        "surface_pressure", "cloud_cover", "cloud_cover_low", "cloud_cover_mid",
        "cloud_cover_high", "visibility", "et0_fao_evapotranspiration",
        "evapotranspiration", "vapour_pressure_deficit",
        "wind_speed_10m", "wind_speed_80m", "wind_speed_120m",
        "wind_direction_10m", "wind_speed_180m", "wind_direction_80m",
        "wind_direction_120m", "wind_direction_180m", "wind_gusts_10m",
        "temperature_80m", "temperature_120m", "temperature_180m",
        "soil_temperature_0cm", "soil_temperature_18cm",
        "soil_temperature_6cm", "soil_temperature_54cm",
        "soil_moisture_1_to_3cm", "soil_moisture_9_to_27cm",
        "soil_moisture_27_to_81cm", "soil_moisture_3_to_9cm",
        "soil_moisture_0_to_1cm",
    ]
    hourly = {"time": dates}
    for i, key in enumerate(hourly_keys):
        hourly[key] = hv(i)
    # Add weather icons for hourly
    hourly["weather_icon"]  = [wmo(c or 0)["icon"]  for c in (hourly["weather_code"] or [])]
    hourly["weather_class"] = [wmo(c or 0)["class"] for c in (hourly["weather_code"] or [])]

    # ── Daily ──────────────────────────────────────────
    d = response.Daily()
    ddates = pd.date_range(
        start    = pd.to_datetime(d.Time(),    unit="s", utc=True),
        end      = pd.to_datetime(d.TimeEnd(), unit="s", utc=True),
        freq     = pd.Timedelta(seconds=d.Interval()),
        inclusive= "left"
    ).strftime("%Y-%m-%d").tolist()

    def dv(i): return [safe(x) for x in d.Variables(i).ValuesAsNumpy().tolist()]
    def di(i): return [int(x) if x is not None else None for x in d.Variables(i).ValuesInt64AsNumpy().tolist()]

    daily_weather_codes = dv(0)
    daily = {
        "date":                         ddates,
        "weather_code":                 daily_weather_codes,
        "weather_icon":                 [wmo(c or 0)["icon"]  for c in daily_weather_codes],
        "weather_desc":                 [wmo(c or 0)["desc"]  for c in daily_weather_codes],
        "weather_class":                [wmo(c or 0)["class"] for c in daily_weather_codes],
        "temperature_max":              dv(1),
        "temperature_min":              dv(2),
        "apparent_temperature_max":     dv(3),
        "apparent_temperature_min":     dv(4),
        "sunrise":                      [datetime.fromtimestamp(t, tz=timezone.utc).strftime("%H:%M") for t in di(5)],
        "sunset":                       [datetime.fromtimestamp(t, tz=timezone.utc).strftime("%H:%M") for t in di(6)],
        "daylight_duration":            dv(7),
        "sunshine_duration":            dv(8),
        "uv_index_max":                 dv(9),
        "uv_index_clear_sky_max":       dv(10),
        "rain_sum":                     dv(11),
        "showers_sum":                  dv(12),
        "snowfall_sum":                 dv(13),
        "precipitation_hours":          dv(14),
        "precipitation_sum":            dv(15),
        "precipitation_probability_max":dv(16),
        "wind_speed_max":               dv(17),
        "wind_gusts_max":               dv(18),
        "shortwave_radiation_sum":      dv(19),
        "wind_direction_dominant":      dv(20),
        "wind_direction_label":         [wind_dir_label(v or 0) for v in dv(20)],
        "et0_fao_evapotranspiration":   dv(21),
    }

    return {
        "meta": {
            "latitude":  response.Latitude(),
            "longitude": response.Longitude(),
            "elevation": response.Elevation(),
            "timezone":  str(response.UtcOffsetSeconds()) + "s",
            "fetched_at": datetime.now(timezone.utc).isoformat(),
        },
        "current": current,
        "hourly":  hourly,
        "daily":   daily,
    }


# ── API Routes ─────────────────────────────────────────
@app.get("/")
async def root():
    return FileResponse("index.html")

@app.get("/api/weather")
async def get_weather(
    lat:  float = Query(DEFAULT_LAT, description="Latitude"),
    lon:  float = Query(DEFAULT_LON, description="Longitude"),
):
    """Full weather data: current + 168h hourly + 7-day daily."""
    try:
        return fetch_weather(lat, lon)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Open-Meteo error: {str(e)}")

@app.get("/api/weather/current")
async def get_current(lat: float = DEFAULT_LAT, lon: float = DEFAULT_LON):
    """Current weather conditions only."""
    data = fetch_weather(lat, lon)
    return {"meta": data["meta"], "current": data["current"]}

@app.get("/api/weather/hourly")
async def get_hourly(lat: float = DEFAULT_LAT, lon: float = DEFAULT_LON, hours: int = 48):
    """Hourly forecast (default 48h, max 168h)."""
    data  = fetch_weather(lat, lon)
    n     = min(hours, len(data["hourly"]["time"]))
    sliced = {k: v[:n] for k, v in data["hourly"].items()}
    return {"meta": data["meta"], "hourly": sliced}

@app.get("/api/weather/daily")
async def get_daily(lat: float = DEFAULT_LAT, lon: float = DEFAULT_LON):
    """7-day daily forecast."""
    data = fetch_weather(lat, lon)
    return {"meta": data["meta"], "daily": data["daily"]}

# ── Auth Routes ─────────────────────────────────────────

@app.post("/api/auth/register", response_model=User)
async def register(user_data: UserCreate):
    with Session(engine) as session:
        # Check if user exists
        existing_user = session.exec(select(User).where((User.username == user_data.username) | (User.email == user_data.email))).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Username or email already registered")
        
        hashed_pw = pwd_context.hash(user_data.password)
        new_user = User(
            username=user_data.username,
            email=user_data.email,
            hashed_password=hashed_pw
        )
        session.add(new_user)
        session.commit()
        session.refresh(new_user)
        return new_user

@app.post("/api/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    with Session(engine) as session:
        user = session.exec(select(User).where(User.username == credentials.username)).first()
        if not user or not pwd_context.verify(credentials.password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Incorrect username or password")
        
        # Update login stats
        user.last_login = datetime.now(timezone.utc)
        user.login_count += 1
        session.add(user)
        session.commit()

        token_data = {"sub": user.username}
        token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)
        return {"access_token": token, "token_type": "bearer"}

@app.get("/api/auth/me", response_model=User)
async def get_me(token: str = Query(...)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
    
    with Session(engine) as session:
        user = session.exec(select(User).where(User.username == username)).first()
        if user is None:
            raise HTTPException(status_code=404, detail="User not found")
        return user

@app.get("/api/auth/users", response_model=List[User])
async def list_users():
    with Session(engine) as session:
        users = session.exec(select(User)).all()
        return users

@app.get("/api/health")
async def health():
    return {"status": "ok", "time": datetime.now(timezone.utc).isoformat()}
