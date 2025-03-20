"""Configuration settings for the News Genie application."""

import os
from dotenv import load_dotenv
import json

# Load environment variables
load_dotenv()

# Flask settings
FLASK_DEBUG = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
FLASK_SECRET_KEY = os.getenv('FLASK_SECRET_KEY', 'your-secret-key-here')

# File paths
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data')
FEEDS_FILE = os.path.join(DATA_DIR, 'feeds.json')

# Ensure data directory exists
os.makedirs(DATA_DIR, exist_ok=True)

# Default feeds (used only if no feeds file exists)
DEFAULT_FEEDS = []

# Request settings
REQUEST_SETTINGS = {
    'timeout': 10,
    'max_retries': 3,
    'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

# Rate limiting settings
RATE_LIMIT = {
    'yahoo': {'last_request': None, 'min_interval': 60},  # 60 seconds between requests
}

# Pagination settings
PAGINATION = {
    'stories_per_page': 10,
    'default_page': 1
}

# Search settings
SEARCH_SETTINGS = {
    'title_weight': 2.0,        # Title matches are most important
    'description_weight': 1.0,   # Description matches are medium importance
    'content_weight': 0.5,       # Content matches are least important
    'min_relevance_score': 3.0,  # Minimum score required for a result to be included
    'max_results': 10            # Maximum number of results to return
}

# NLTK settings
NLTK_PACKAGES = [
    'punkt',
    'stopwords',
    'averaged_perceptron_tagger',
    'punkt_tab'
] 