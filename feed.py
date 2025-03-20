"""RSS feed handling module for the News Genie application."""

import time
import json
import os
import feedparser
import requests
from requests.exceptions import RequestException
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup

from config import FEEDS_FILE, DEFAULT_FEEDS, REQUEST_SETTINGS, RATE_LIMIT, PAGINATION
from utils import logger, check_rate_limit, preprocess_text

def is_valid_rss(content):
    """Check if the content is valid RSS/XML"""
    try:
        root = ET.fromstring(content)
        if 'rss' in root.tag.lower():
            return True
        if 'feed' in root.tag.lower():
            return True
        return False
    except ET.ParseError:
        return False

def validate_feed_url(url):
    """Validate if a URL contains a valid RSS feed"""
    logger.info(f"Validating feed URL: {url}")
    try:
        feed_content = fetch_feed(url)
        if not feed_content:
            return False, "Could not fetch feed content"
            
        feed = feedparser.parse(feed_content)
        
        if feed.bozo:
            logger.warning(f"Feed parsing error for {url}: {feed.bozo_exception}")
            return False, "Invalid feed format"
            
        if not feed.entries:
            logger.warning(f"No entries found in feed: {url}")
            return False, "No entries found in feed"
            
        feed_title = feed.feed.get('title', '')
        logger.info(f"Successfully validated feed: {feed_title} ({url})")
        return True, feed_title
            
    except Exception as e:
        logger.error(f"Error validating feed {url}: {str(e)}", exc_info=True)
        return False, str(e)

def load_feeds():
    """Load feeds from feeds file"""
    if not os.path.exists(FEEDS_FILE):
        logger.info(f"Feeds file not found. Creating default at {FEEDS_FILE}")
        with open(FEEDS_FILE, 'w') as f:
            json.dump(DEFAULT_FEEDS, f)
        return DEFAULT_FEEDS
    
    try:
        with open(FEEDS_FILE, 'r') as f:
            feeds = json.load(f)
        logger.info(f"Loaded {len(feeds)} feeds from {FEEDS_FILE}")
        return feeds
    except Exception as e:
        logger.error(f"Error loading feeds from {FEEDS_FILE}: {str(e)}", exc_info=True)
        return DEFAULT_FEEDS

def save_feeds(feeds):
    """Save feeds to feeds file"""
    try:
        with open(FEEDS_FILE, 'w') as f:
            json.dump(feeds, f, indent=2)
        logger.info(f"Saved {len(feeds)} feeds to {FEEDS_FILE}")
        return True
    except Exception as e:
        logger.error(f"Error saving feeds to {FEEDS_FILE}: {str(e)}", exc_info=True)
        return False

def add_feed(url):
    """Add a new feed URL to the feeds list"""
    # Validate the feed
    is_valid, title = validate_feed_url(url)
    if not is_valid:
        return False, title  # Return the error message
    
    # Load existing feeds
    feeds = load_feeds()
    
    # Check if feed already exists
    for feed in feeds:
        if feed['url'] == url:
            return False, "Feed already exists"
    
    # Add the new feed
    feeds.append({
        'url': url,
        'title': title or url,
        'added_date': time.strftime('%Y-%m-%d %H:%M:%S')
    })
    
    # Save feeds
    if save_feeds(feeds):
        return True, "Feed added successfully"
    else:
        return False, "Failed to save feed"

def remove_feed(url):
    """Remove a feed URL from the feeds list"""
    # Load existing feeds
    feeds = load_feeds()
    
    # Filter out the feed to remove
    new_feeds = [feed for feed in feeds if feed['url'] != url]
    
    # Check if any feed was removed
    if len(new_feeds) == len(feeds):
        return False, "Feed not found"
    
    # Save feeds
    if save_feeds(new_feeds):
        return True, "Feed removed successfully"
    else:
        return False, "Failed to remove feed"

def fetch_feed(url):
    """Fetch feed with retry logic and validation"""
    logger.info(f"Fetching feed from: {url}")
    check_rate_limit(url)
    
    for attempt in range(REQUEST_SETTINGS['max_retries']):
        try:
            headers = {'User-Agent': REQUEST_SETTINGS['user_agent']}
            response = requests.get(url, timeout=REQUEST_SETTINGS['timeout'], headers=headers)
            response.raise_for_status()
            
            content_type = response.headers.get('content-type', '').lower()
            if 'xml' not in content_type and 'rss' not in content_type and 'atom' not in content_type:
                logger.warning(f"Invalid content type for {url}: {content_type}")
                return None
            
            if not is_valid_rss(response.text):
                logger.warning(f"Invalid RSS content from {url}")
                return None
                
            logger.info(f"Successfully fetched feed from {url}")
            return response.text
            
        except RequestException as e:
            logger.error(f"Error fetching {url} (attempt {attempt + 1}/{REQUEST_SETTINGS['max_retries']}): {str(e)}")
            if attempt < REQUEST_SETTINGS['max_retries'] - 1:
                wait_time = 2 ** attempt
                logger.info(f"Waiting {wait_time} seconds before retry...")
                time.sleep(wait_time)  # Exponential backoff
            continue
    
    logger.error(f"Failed to fetch feed from {url} after {REQUEST_SETTINGS['max_retries']} attempts")
    return None

def process_entry(entry, feed_url, feed_title):
    """Process a single feed entry"""
    try:
        title = entry.get('title', '')
        description = entry.get('description', '')
        
        content = ""
        if 'content' in entry:
            content = entry.content[0].value
        elif 'summary' in entry:
            content = entry.summary
        elif 'description' in entry:
            content = entry.description
        
        if content:
            soup = BeautifulSoup(content, 'html.parser')
            content = soup.get_text()
        
        # Generate a unique ID for the entry
        entry_id = entry.get('id', entry.get('guid', entry.get('link', '')))
        
        # Get the published date
        published = entry.get('published', entry.get('pubDate', ''))
        
        return {
            'id': entry_id,
            'title': title,
            'link': entry.get('link', ''),
            'description': description,
            'content': content,
            'published': published,
            'source': feed_title or feed_url,
            'feed_url': feed_url
        }
    except Exception as e:
        logger.error(f"Error processing entry from {feed_url}: {str(e)}", exc_info=True)
        return None

def get_feed_stories(page=1, items_per_page=None):
    """Get stories from all feeds with pagination"""
    if items_per_page is None:
        items_per_page = PAGINATION['stories_per_page']
    
    logger.info(f"Getting stories (page {page}, {items_per_page} per page)")
    all_entries = []
    feeds = load_feeds()
    
    if not feeds:
        logger.warning("No feeds configured. Please add some feeds first.")
        return [], 0
    
    for feed_data in feeds:
        feed_url = feed_data['url']
        try:
            # Set a timeout for feed processing to prevent hanging
            feed_content = fetch_feed(feed_url)
            if not feed_content:
                logger.warning(f"Skipping feed {feed_url} - no content returned")
                continue
                
            feed = feedparser.parse(feed_content)
            
            if feed.bozo:
                logger.error(f"Feed parsing error for {feed_url}: {feed.bozo_exception}")
                continue
            
            feed_title = feed.feed.get('title', feed_data.get('title', ''))
            logger.info(f"Processing {len(feed.entries)} entries from feed: {feed_title}")
            
            for entry in feed.entries:
                processed_entry = process_entry(entry, feed_url, feed_title)
                if processed_entry:
                    all_entries.append(processed_entry)
                    
        except Exception as e:
            logger.error(f"Error processing feed {feed_url}: {str(e)}", exc_info=True)
            continue
    
    # Sort entries by published date (newest first)
    all_entries.sort(key=lambda x: x.get('published', ''), reverse=True)
    
    # Calculate pagination
    total_entries = len(all_entries)
    start_idx = (page - 1) * items_per_page
    end_idx = start_idx + items_per_page
    
    paginated_entries = all_entries[start_idx:end_idx] if start_idx < total_entries else []
    
    logger.info(f"Returning {len(paginated_entries)} entries (page {page} of {max(1, (total_entries + items_per_page - 1) // items_per_page)})")
    return paginated_entries, total_entries 