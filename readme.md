# RSS News Feed Application

A simple RSS news feed application that allows users to search for news by keywords and analyze them with Claude.

## Features

- Search news feeds by keywords
- Display top 10 relevant news articles
- Analyze articles with Claude AI
- Responsive design for mobile and desktop

## Requirements

- Python 3.7+
- Flask
- Feedparser
- Requests
- Anthropic Python SDK
- BeautifulSoup4

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd rss-news-app
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

4. Make sure to create a `templates` directory and place the `index.html` file in it.

## Running the Application

1. Start the Flask application:
   ```
   python app.py
   ```

2. Open your web browser and navigate to:
   ```
   http://127.0.0.1:5000/
   ```

3. Enter keywords to search for news and your Claude API key to analyze articles.

## Project Structure

```
rss-news-app/
├── app.py              # Main Flask application
├── requirements.txt    # Python dependencies
└── templates/          # HTML templates
    └── index.html      # Main page template
```

## Future Enhancements

- Implement infinite scroll for more results
- Add more news sources and categories
- Support for different LLM providers
- Save favorite articles
- User authentication
- Customizable news filters

## Notes

- The Claude API key is stored only in your browser's local storage and is only sent to the server when analyzing an article.
- The application fetches news from a predefined list of RSS feeds.
