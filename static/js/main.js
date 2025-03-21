/**
 * Main application initialization for News Genie
 */

// Global variables
let currentPage = 1;
let isLoading = false;
let hasMoreStories = true;
let currentArticleContent = '';
let analysisModalArticleTitle = '';

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Hide spinners initially
    hideSpinners();
    
    // Initialize feed filters
    initializeFeedFilters();
    
    // Initialize keyword filters
    initializeFilters();
    
    // Load feeds and stories with a slight delay to ensure filters are set up
    setTimeout(() => {
        loadFeeds();
        loadStories();
    }, 100);
    
    // Set up infinite scroll
    window.addEventListener('scroll', function() {
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500) {
            loadMoreStories();
        }
    });

    // Setup form event listeners
    document.getElementById('addFeedForm').addEventListener('submit', function(e) {
        e.preventDefault();
        addFeed();
    });
    
    document.getElementById('searchForm').addEventListener('submit', function(e) {
        e.preventDefault();
        searchStories();
    });
});

function hideSpinners() {
    const spinners = document.querySelectorAll('.loading-spinner');
    spinners.forEach(spinner => {
        spinner.style.display = 'none';
    });
}

// Initialize feed filters
function initializeFeedFilters() {
    // Create the feed filter container if it doesn't exist
    const feedFilterContainer = document.getElementById('feedFilterContainer');
    if (!feedFilterContainer) return;
    
    // Get saved filters from localStorage
    try {
        const savedFilters = localStorage.getItem('selectedFeedFilters');
        if (savedFilters) {
            const filters = JSON.parse(savedFilters);
            // We'll use these when loading feeds
            window.savedFeedFilters = filters;
        }
    } catch (e) {
        console.error('Error loading saved feed filters:', e);
    }
    
    // Add an event listener to handle feed checkbox changes
    document.addEventListener('change', function(e) {
        if (e.target && e.target.classList.contains('feed-checkbox')) {
            // Get active feed filters and save them
            const selectedFeeds = getActiveFeedFilters();
            
            // If no feeds are selected, select all feeds
            if (selectedFeeds.length === 0) {
                const allCheckboxes = document.querySelectorAll('.feed-checkbox');
                allCheckboxes.forEach(cb => cb.checked = true);
                // Recalculate selected feeds
                const allFeeds = Array.from(allCheckboxes).map(cb => cb.value);
                try {
                    localStorage.setItem('selectedFeedFilters', JSON.stringify(allFeeds));
                } catch (e) {
                    console.error('Error saving all feed filters:', e);
                }
            }
            
            // Reload stories with the new filter selection
            loadStories();
        }
    });
}

// Get active feed filters
function getActiveFeedFilters() {
    // First check for UI selection (these take priority over localStorage)
    const checkboxes = document.querySelectorAll('.feed-checkbox:checked');
    if (checkboxes && checkboxes.length > 0) {
        // Get values from checked checkboxes
        const selectedFeeds = Array.from(checkboxes).map(cb => cb.value);
        // Save to localStorage
        try {
            localStorage.setItem('selectedFeedFilters', JSON.stringify(selectedFeeds));
        } catch (e) {
            console.error('Error saving feed filters:', e);
        }
        return selectedFeeds;
    }
    
    // If no UI checkboxes found, try to get from localStorage
    try {
        const saved = localStorage.getItem('selectedFeedFilters');
        if (saved) {
            const parsedFeeds = JSON.parse(saved);
            if (Array.isArray(parsedFeeds) && parsedFeeds.length > 0) {
                return parsedFeeds;
            }
        }
    } catch (e) {
        console.error('Error parsing saved feed filters:', e);
    }
    
    // If nothing saved or empty array, check if we have feeds loaded yet
    const allFeedCheckboxes = document.querySelectorAll('.feed-checkbox');
    if (allFeedCheckboxes && allFeedCheckboxes.length > 0) {
        // Default to all feeds if none specifically selected
        const allFeeds = Array.from(allFeedCheckboxes).map(cb => cb.value);
        // Mark all checkboxes as checked
        allFeedCheckboxes.forEach(cb => cb.checked = true);
        // Save to localStorage
        try {
            localStorage.setItem('selectedFeedFilters', JSON.stringify(allFeeds));
        } catch (e) {
            console.error('Error saving all feed filters:', e);
        }
        return allFeeds;
    }
    
    // Return empty array if no feeds available yet
    return [];
}

// Modified loadStories to respect feed filters (defined in stories.js) 