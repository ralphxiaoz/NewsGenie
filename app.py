"""Main application file for the News Genie application."""

from flask import Flask, render_template, request, jsonify
import anthropic

from config import FLASK_DEBUG, FLASK_SECRET_KEY, PAGINATION
from utils import logger, setup_nltk
from search import search_feeds
from feed import get_feed_stories, add_feed, remove_feed, load_feeds

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = FLASK_SECRET_KEY

# Setup NLTK data
logger.info("Starting NLTK data download...")
setup_nltk()
logger.info("NLTK data download completed")

@app.route('/')
def index():
    """Render the main page"""
    return render_template('index.html')

@app.route('/api/feeds', methods=['GET'])
def get_feeds():
    """Get all saved feeds"""
    try:
        feeds = load_feeds()
        return jsonify({'feeds': feeds})
    except Exception as e:
        logger.error(f"Error getting feeds: {str(e)}", exc_info=True)
        return jsonify({'error': 'Failed to get feeds'}), 500

@app.route('/api/feeds', methods=['POST'])
def add_new_feed():
    """Add a new RSS feed"""
    try:
        data = request.json
        if not data:
            logger.warning("Add feed request received with no JSON data")
            return jsonify({'error': 'No JSON data provided'}), 400
            
        url = data.get('url', '')
        if not url:
            logger.warning("Add feed request received with empty URL")
            return jsonify({'error': 'No feed URL provided'}), 400
            
        logger.info(f"Processing add feed request for URL: '{url}'")
        success, message = add_feed(url)
        
        if success:
            return jsonify({'message': message, 'success': True})
        else:
            return jsonify({'error': message, 'success': False}), 400
            
    except Exception as e:
        logger.error(f"Error adding feed: {str(e)}", exc_info=True)
        return jsonify({'error': 'Failed to add feed'}), 500

@app.route('/api/feeds/<path:url>', methods=['DELETE'])
def delete_feed(url):
    """Remove an RSS feed"""
    try:
        logger.info(f"Processing remove feed request for URL: '{url}'")
        success, message = remove_feed(url)
        
        if success:
            return jsonify({'message': message, 'success': True})
        else:
            return jsonify({'error': message, 'success': False}), 404
            
    except Exception as e:
        logger.error(f"Error removing feed: {str(e)}", exc_info=True)
        return jsonify({'error': 'Failed to remove feed'}), 500

@app.route('/api/stories', methods=['GET'])
def get_stories():
    """Get stories with pagination"""
    try:
        page = request.args.get('page', PAGINATION['default_page'], type=int)
        items_per_page = request.args.get('items_per_page', PAGINATION['stories_per_page'], type=int)
        
        if page < 1:
            page = 1
        if items_per_page < 1:
            items_per_page = PAGINATION['stories_per_page']
            
        logger.info(f"Getting stories for page {page} with {items_per_page} items per page")
        stories, total = get_feed_stories(page, items_per_page)
        
        return jsonify({
            'stories': stories,
            'page': page,
            'items_per_page': items_per_page,
            'total': total,
            'total_pages': (total + items_per_page - 1) // items_per_page
        })
        
    except Exception as e:
        logger.error(f"Error getting stories: {str(e)}", exc_info=True)
        return jsonify({'error': 'Failed to get stories'}), 500

@app.route('/search', methods=['POST'])
def search():
    """Handle search requests"""
    try:
        data = request.json
        if not data:
            logger.warning("Search request received with no JSON data")
            return jsonify({'error': 'No JSON data provided'}), 400
            
        keyword = data.get('keyword', '')
        if not keyword:
            logger.warning("Search request received with empty keyword")
            return jsonify({'error': 'No keyword provided'}), 400
            
        logger.info(f"Processing search request for keyword: '{keyword}'")
        results = search_feeds(keyword)
        logger.info(f"Search completed. Found {len(results)} results")
        return jsonify({'results': results})
        
    except Exception as e:
        logger.error(f"Error in search endpoint: {str(e)}", exc_info=True)
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/analyze', methods=['POST'])
def analyze():
    """Handle article analysis requests"""
    data = request.json
    api_key = data.get('api_key', '')
    content = data.get('content', '')
    
    if not api_key or not content:
        logger.warning("Analyze request received with missing API key or content")
        return jsonify({'error': 'API key and content are required'}), 400
    
    try:
        logger.info("Processing article analysis request")
        client = anthropic.Anthropic(api_key=api_key)
        
        message = client.messages.create(
            model="claude-3-opus-20240229",
            max_tokens=1000,
            messages=[
                {
                    "role": "user",
                    "content": f"Please analyze and summarize this news article: {content}"
                }
            ]
        )
        
        logger.info("Article analysis completed successfully")
        return jsonify({
            'analysis': message.content
        })
    
    except Exception as e:
        logger.error(f"Error in analyze endpoint: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=FLASK_DEBUG)
