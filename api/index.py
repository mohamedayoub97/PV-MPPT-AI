import sys
import os

# Add the root directory to the Python path so it can find weather_api.py
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from weather_api import app

# Vercel needs the app object to be named 'app'
# This file serves as the serverless function entry point
handler = app
