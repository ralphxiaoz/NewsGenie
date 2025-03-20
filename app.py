# app.py
from flask import Flask, render_template, request, jsonify
import feedparser
import requests
import anthropic
import os
import time
from bs4 import BeautifulSoup
import re

app = Flask(__name__)

# Common RSS feed URLs that can be searched
RSS_FEEDS = {
    "news": [
        "http://rss.cnn.com/rss/cnn_topstories.rss",
        "https://feeds.bbci.co.uk/news/rss.xml",
        "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml",
        "https://www.theguardian.com/international/rss",
        "https://feeds.npr.org/1001/rss.xml",
        "https://www.aljazeera.com/xml/rss/all.xml",
        "https://www.reutersagency.com/feed/?taxonomy=best-topics&post_type=best",
        "https://www.wsj.com/xml/rss/3_7085.xml",
        "https://www.yahoo.com/news/rss",
    ]
}

def search_feeds(keyword, limit=10):
    """Search RSS feeds for articles matching keywords"""
    results = []
    
    for category, feeds in RSS_FEEDS.items():
        for feed_url in feeds:
            try:
                feed = feedparser.parse(feed_url)
                
                for entry in feed.entries:
                    # Search in title and description
                    title = entry.get('title', '')
                    description = entry.get('description', '')
                    
                    # Check if keyword is in title or description (case insensitive)
                    if (re.search(keyword, title, re.IGNORECASE) or 
                        re.search(keyword, description, re.IGNORECASE)):
                        
                        # Get the full content if available
                        content = ""
                        if 'content' in entry:
                            content = entry.content[0].value
                        elif 'summary' in entry:
                            content = entry.summary
                        elif 'description' in entry:
                            content = entry.description
                            
                        # Clean HTML tags if present
                        if content:
                            soup = BeautifulSoup(content, 'html.parser')
                            content = soup.get_text()
                        
                        # Create a result object
                        result = {
                            'title': title,
                            'link': entry.get('link', ''),
                            'description': description,
                            'content': content,
                            'published': entry.get('published', ''),
                            'source': feed.feed.get('title', feed_url)
                        }
                        
                        results.append(result)
                        
                        # Break early if we have enough results
                        if len(results) >= limit:
                            return results
                            
            except Exception as e:
                print(f"Error parsing feed {feed_url}: {e}")
                continue
                
    return results

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/search', methods=['POST'])
def search():
    data = request.json
    keyword = data.get('keyword', '')
    
    if not keyword:
        return jsonify({'error': 'No keyword provided'}), 400
        
    results = search_feeds(keyword)
    return jsonify({'results': results})

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.json
    api_key = data.get('api_key', '')
    content = data.get('content', '')
    
    if not api_key or not content:
        return jsonify({'error': 'API key and content are required'}), 400
    
    try:
        client = anthropic.Anthropic(api_key=api_key)
        
        # Create a message with Claude
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
        
        # Return Claude's response
        return jsonify({
            'analysis': message.content
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
