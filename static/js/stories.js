/**
 * Stories display and management functionality for News Genie
 */

// Load stories from the server
function loadStories() {
    // Check if there are any feeds selected
    const selectedFeeds = getActiveFeedFilters();
    if (!selectedFeeds || selectedFeeds.length === 0) {
        // Clear existing stories
        const storiesContainer = document.getElementById('storiesContainer');
        storiesContainer.innerHTML = '<div class="alert alert-info">No feeds selected. Please select at least one feed to view stories.</div>';
        return; // Don't try to load when no feeds are selected
    }

    hasMoreStories = true;
    currentPage = 1;
    isLoading = true;
    allStories = [];

    // Clear existing stories
    const storiesContainer = document.getElementById('storiesContainer');
    storiesContainer.innerHTML = '';

    // Show loading spinner
    document.getElementById('loadingSpinner').style.display = 'flex';

    // Build URL with selected feeds
    let url = '/api/stories?page=1';
    const feedsParam = selectedFeeds.map(feed => encodeURIComponent(feed)).join(',');
    url += `&feeds=${feedsParam}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            isLoading = false;
            document.getElementById('loadingSpinner').style.display = 'none';

            if (data.stories && data.stories.length > 0) {
                allStories = data.stories;
                
                // Process stories for filters
                processStoriesForFilters(allStories);
                
                // Apply any active filters or display all stories
                if (activeFilters.size > 0) {
                    applyFilters();
                } else {
                    displayStories(allStories);
                }
                
                hasMoreStories = currentPage < data.total_pages;
                currentPage++;
            } else {
                storiesContainer.innerHTML = '<div class="alert alert-info">No stories found</div>';
                hasMoreStories = false;
            }
        })
        .catch(error => {
            console.error('Error loading stories:', error);
            storiesContainer.innerHTML = '<div class="alert alert-danger">Error loading stories. Please try again later.</div>';
            isLoading = false;
            document.getElementById('loadingSpinner').style.display = 'none';
        });
}

// Load more stories for infinite scroll
function loadMoreStories() {
    // Check if there are any feeds selected
    const selectedFeeds = getActiveFeedFilters();
    if (!selectedFeeds || selectedFeeds.length === 0) {
        hasMoreStories = false;
        return; // Don't try to load more when no feeds are selected
    }
    
    if (isLoading || !hasMoreStories) return;
    
    isLoading = true;
    document.getElementById('loadingSpinner').style.display = 'flex';
    
    let url = `/api/stories?page=${currentPage}`;
    
    // Add selected feeds to query
    const feedsParam = selectedFeeds.map(feed => encodeURIComponent(feed)).join(',');
    url += `&feeds=${feedsParam}`;
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            isLoading = false;
            document.getElementById('loadingSpinner').style.display = 'none';
            
            if (data.stories && data.stories.length > 0) {
                appendStories(data.stories);
                hasMoreStories = currentPage < data.total_pages;
                currentPage++;
            } else {
                hasMoreStories = false;
            }
        })
        .catch(error => {
            console.error('Error loading more stories:', error);
            isLoading = false;
            document.getElementById('loadingSpinner').style.display = 'none';
        });
}

// Display stories
function displayStories(stories, append = false) {
    const storiesContainer = document.getElementById('storiesContainer');
    
    if (!stories || stories.length === 0) {
        if (!append) {
            document.getElementById('noStoriesMessage').style.display = 'block';
            storiesContainer.innerHTML = '';
        }
        return;
    }
    
    let storiesHtml = '';
    stories.forEach(story => {
        const description = story.description ? story.description.substring(0, 300) + '...' : 'No description available';
        const date = story.published ? new Date(story.published).toLocaleDateString() : 'Unknown date';
        
        storiesHtml += `
            <div class="col-12">
                <div class="card story-card">
                    <div class="card-body">
                        <div class="card-header-row">
                            <h5 class="card-title">${story.title}</h5>
                            <span class="card-date">${date}</span>
                        </div>
                        <div class="card-source">${story.source}</div>
                        <div class="card-content-row">
                            <p class="card-text">${description}</p>
                        </div>
                        <div class="card-actions">
                            <a href="${story.link}" target="_blank" class="btn btn-sm btn-primary">Read Full</a>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    // Always replace content, we're not using append anymore with filtering
    storiesContainer.innerHTML = storiesHtml;
    
    // Set display of no stories message based on the stories count
    document.getElementById('noStoriesMessage').style.display = stories.length === 0 ? 'block' : 'none';
}

// Helper function to hide spinners
function hideSpinners() {
    document.getElementById('initialLoadingSpinner').style.display = 'none';
    document.getElementById('loadingSpinner').style.display = 'none';
}

// Append new stories to the existing ones
function appendStories(newStories) {
    // Add to existing stories for filtering
    allStories = [...allStories, ...newStories];
    
    // Process all stories for filtering
    processStoriesForFilters(allStories);
    
    // Apply any active filters to the full set of stories
    if (activeFilters.size > 0) {
        applyFilters();
    } else {
        displayStories(allStories);
    }
} 