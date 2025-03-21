/**
 * Search functionality for News Genie
 * (Maintained for filter compatibility, but search form has been removed)
 */

// Search stories (still used by API but not directly from UI)
function searchStories(keyword) {    
    fetch('/search', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ keyword: keyword })
    })
    .then(response => response.json())
    .then(data => {
        if (data.results && data.results.length > 0) {
            // Process results for filtering
            processStoriesForFilters(data.results);
            
            // Apply any active filters immediately if there are any
            if (activeFilters.size > 0) {
                applyFilters();
            } else {
                // Otherwise show all search results
                displayStories(data.results);
            }
            
            // Hide the no stories message if it's visible
            document.getElementById('noStoriesMessage').style.display = 'none';
        } else {
            // Clear any existing stories
            displayStories([]);
        }
    })
    .catch(error => {
        console.error('Error searching stories:', error);
    });
} 