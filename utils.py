"""Utility functions for the News Genie application."""

import logging
import sys
from datetime import datetime
import time
from urllib.parse import urlparse
import nltk
from bs4 import BeautifulSoup
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from string import punctuation

from config import NLTK_PACKAGES, RATE_LIMIT

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stdout
)
logger = logging.getLogger(__name__)

def setup_nltk():
    """Download required NLTK data"""
    try:
        logger.info("Attempting to download all NLTK data...")
        nltk.download('all', quiet=True)
        logger.info("Successfully downloaded all NLTK data")
    except Exception as e:
        logger.error(f"Error downloading all NLTK data: {str(e)}")
        for package in NLTK_PACKAGES:
            try:
                logger.info(f"Attempting to download NLTK package: {package}")
                nltk.download(package, quiet=True)
                logger.info(f"Successfully downloaded {package}")
            except Exception as e:
                logger.error(f"Error downloading {package}: {str(e)}")

def check_rate_limit(feed_url):
    """Check if we need to wait before making a request"""
    domain = urlparse(feed_url).netloc
    if domain in RATE_LIMIT:
        last_request = RATE_LIMIT[domain]['last_request']
        min_interval = RATE_LIMIT[domain]['min_interval']
        
        if last_request:
            time_since_last = (datetime.now() - last_request).total_seconds()
            if time_since_last < min_interval:
                wait_time = min_interval - time_since_last
                logger.info(f"Rate limiting: waiting {wait_time:.1f} seconds before requesting {feed_url}")
                time.sleep(wait_time)
        
        RATE_LIMIT[domain]['last_request'] = datetime.now()

def preprocess_text(text):
    """Preprocess text by removing HTML, converting to lowercase, and tokenizing"""
    if not text:
        return []
    
    try:
        # Remove HTML tags
        soup = BeautifulSoup(text, 'html.parser', on_duplicate_attribute='ignore')
        text = soup.get_text(separator=' ', strip=True)
        
        # Convert to lowercase
        text = text.lower()
        
        # Tokenize
        tokens = word_tokenize(text)
        
        # Remove stopwords and punctuation
        stop_words = set(stopwords.words('english'))
        tokens = [token for token in tokens 
                  if token not in stop_words 
                  and token not in punctuation]
        
        return tokens
    except Exception as e:
        logger.error(f"Error preprocessing text: {str(e)}")
        return [] 