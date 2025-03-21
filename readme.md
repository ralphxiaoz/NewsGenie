# News Genie

A modern RSS feed reader application that allows users to manage multiple news sources, filter content by keywords, and analyze articles with Claude AI.

## Features

- **Feed Management**: Add, remove, and describe RSS feeds for easy identification
- **Content Filtering**: Filter stories by source and keywords
- **Search Capability**: Search through all articles by keywords
- **Responsive UI**: Clean, mobile-friendly interface with modern styling
- **Story Preview**: View article previews with source and publication date
- **Infinite Scroll**: Automatically load more content as you scroll
- **Feed Selection**: Choose which feeds to display with persistent preferences
- **Article Analysis**: Analyze article content with Claude AI

## Requirements

- Python 3.7+
- Flask
- Feedparser
- Requests
- Anthropic Python SDK
- BeautifulSoup4
- NLTK
- python-dotenv

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd News_Genie
   ```

2. Create a virtual environment (optional but recommended):
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install the required packages:
   ```
   pip install -r requirements.txt
   ```

4. Configure your environment variables:
   - Create a `.env` file in the root directory with your Anthropic API key:
   ```
   ANTHROPIC_API_KEY=your_api_key_here
   ```

## Running the Application

1. Start the Flask application:
   ```
   python app.py
   ```

2. Open your web browser and navigate to:
   ```
   http://127.0.0.1:5000/
   ```

3. Add RSS feeds in the "Manage RSS Feeds" tab, then browse and filter content in the "Latest News" section.

## Project Structure

```
News_Genie/
├── app.py              # Main Flask application
├── feed.py             # RSS feed handling functionality
├── search.py           # Search functionality
├── config.py           # Application configuration
├── utils.py            # Utility functions
├── requirements.txt    # Python dependencies
├── data/               # Data storage directory
├── static/             # Static assets
│   ├── css/            # CSS stylesheets
│   └── js/             # JavaScript files
│       ├── analyze.js  # Article analysis functionality
│       ├── feeds.js    # Feed management functionality
│       ├── filters.js  # Content filtering functionality
│       ├── main.js     # Main application initialization
│       ├── search.js   # Search functionality
│       └── stories.js  # Story display functionality
└── templates/          # HTML templates
    └── index.html      # Main application template
```

## Key Features Explained

### Feed Management
- Add new RSS feeds via URL
- Remove feeds you no longer want to follow
- Add descriptions to feeds for better organization

### Content Filtering
- Filter by feed source with checkboxes
- Add custom keyword filters that persist across sessions
- Combine source and keyword filters for precise content curation

### User Interface
- Tabbed interface for easy navigation between features
- Clean card-based layout for stories
- Responsive design that works on mobile and desktop
- Infinite scroll loading for seamless browsing

### Article Analysis
- Analyze article content with Claude AI
- Get summaries, key points, and insights about the content

## User Data Storage

- Feed selections and keyword filters are stored in your browser's localStorage
- No user data is sent to external servers except when using the Claude analysis feature

## Future Enhancements

- User accounts for cloud-based preference storage
- Categorization and tagging system for articles
- Dark mode theme option
- Export and import of feed collections
- Read/unread article tracking
- Offline reading capability
