"""Search functionality for the News Genie application."""

from utils import logger, preprocess_text
from feed import get_feed_stories
from config import SEARCH_SETTINGS
from collections import Counter

def calculate_relevance_score(tokens, keyword_tokens):
    """Calculate relevance score based on keyword matches and position"""
    if not tokens or not keyword_tokens:
        return 0
        
    score = 0
    token_counter = Counter(tokens)
    keyword_counter = Counter(keyword_tokens)
    
    # Calculate keyword coverage (how many unique keywords are found)
    found_keywords = sum(1 for keyword in keyword_counter if token_counter[keyword] > 0)
    keyword_coverage = found_keywords / len(keyword_counter) if keyword_counter else 0
    
    # Base score on keyword coverage
    score += keyword_coverage * 5
    
    # Count exact matches with higher weight for consecutive matches
    for keyword in keyword_counter:
        count = token_counter[keyword]
        if count > 0:
            score += count * 3  # Base score for each match
            
            # Check for consecutive matches (phrases)
            for i in range(len(tokens) - len(keyword_tokens) + 1):
                if tokens[i:i + len(keyword_tokens)] == keyword_tokens:
                    score += 5  # Bonus for exact phrase match
    
    # Title matches are very important
    title_tokens = tokens[:10]  # First 10 tokens are considered title
    title_matches = sum(1 for keyword in keyword_counter if keyword in title_tokens)
    if title_matches > 0:
        score += title_matches * 4  # Higher weight for title matches
    
    # Check for semantic similarity (simple word overlap)
    overlap = sum(min(token_counter[word], keyword_counter[word]) 
                 for word in set(token_counter) & set(keyword_counter))
    score += overlap * 2
    
    # Penalize if the text is too long (to avoid irrelevant long articles)
    if len(tokens) > 1000:  # Arbitrary threshold
        score *= 0.8
    
    return score

def search_feeds(keyword):
    """Search RSS feeds for articles matching keywords with improved relevance"""
    logger.info(f"Starting feed search for keyword: '{keyword}'")
    results = []
    keyword_tokens = preprocess_text(keyword)
    
    if not keyword_tokens:
        logger.warning(f"No valid tokens found for keyword: '{keyword}'")
        return results
    
    try:
        logger.info("Fetching all feed entries for search...")
        # Get all available entries (no pagination for search)
        entries, _ = get_feed_stories(page=1, items_per_page=1000)
        logger.info(f"Retrieved {len(entries)} total entries for search")
        
        for i, entry in enumerate(entries, 1):
            try:
                # Preprocess all text fields
                title_tokens = preprocess_text(entry['title'])
                desc_tokens = preprocess_text(entry['description'])
                content_tokens = preprocess_text(entry['content'])
                
                # Calculate relevance score for each field
                title_score = calculate_relevance_score(title_tokens, keyword_tokens)
                desc_score = calculate_relevance_score(desc_tokens, keyword_tokens)
                content_score = calculate_relevance_score(content_tokens, keyword_tokens)
                
                # Weighted combination of scores
                score = (
                    title_score * SEARCH_SETTINGS['title_weight'] +
                    desc_score * SEARCH_SETTINGS['description_weight'] +
                    content_score * SEARCH_SETTINGS['content_weight']
                )
                
                # Only include results with a minimum relevance score
                if score >= SEARCH_SETTINGS['min_relevance_score']:
                    result = entry.copy()
                    result['relevance_score'] = score
                    result['match_details'] = {
                        'title_score': title_score,
                        'description_score': desc_score,
                        'content_score': content_score
                    }
                    results.append(result)
                    logger.debug(f"Entry {i}: Found match with score {score:.2f} - {entry['title']}")
                    logger.debug(f"Match details: title={title_score:.2f}, desc={desc_score:.2f}, content={content_score:.2f}")
                    
            except Exception as e:
                logger.error(f"Error processing entry {i} for search: {str(e)}", exc_info=True)
                continue
        
        # Sort results by relevance score and limit
        results.sort(key=lambda x: x['relevance_score'], reverse=True)
        final_results = results[:SEARCH_SETTINGS['max_results']]
        logger.info(f"Search completed. Found {len(final_results)} matching results out of {len(entries)} total entries")
        return final_results
        
    except Exception as e:
        logger.error(f"Error in search_feeds: {str(e)}", exc_info=True)
        return [] 