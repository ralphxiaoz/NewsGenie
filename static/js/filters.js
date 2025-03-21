/**
 * Story filtering functionality for News Genie
 */

let activeFilters = new Set();
let allStories = [];
let userFilters = new Map(); // Maps filter words to their counts

// Initialize or load from localStorage
function initializeFilters() {
    // Try to load saved filters from localStorage
    try {
        const savedFilters = JSON.parse(localStorage.getItem('newsGenieFilters'));
        if (savedFilters && Array.isArray(savedFilters)) {
            userFilters = new Map(savedFilters);
        }
    } catch (error) {
        console.error('Error loading saved filters:', error);
        userFilters = new Map();
    }
}

// Process stories to update filter counts
function processStoriesForFilters(stories) {
    allStories = stories;
    
    // Update counts for existing user filters
    updateFilterCounts();
    
    // Display the filter buttons
    displayFilterButtons();
}

// Count occurrences of filter words in stories
function updateFilterCounts() {
    // Reset counts for all filters
    userFilters.forEach((_, word) => {
        userFilters.set(word, 0);
    });
    
    // Count stories containing each filter word
    allStories.forEach(story => {
        const text = (story.title + ' ' + (story.description || '')).toLowerCase();
        
        userFilters.forEach((count, word) => {
            if (text.includes(word.toLowerCase())) {
                userFilters.set(word, count + 1);
            }
        });
    });
    
    // Save updated filters to localStorage
    saveFilters();
}

// Save filters to localStorage
function saveFilters() {
    try {
        localStorage.setItem('newsGenieFilters', JSON.stringify([...userFilters]));
    } catch (error) {
        console.error('Error saving filters:', error);
    }
}

// Display filter buttons
function displayFilterButtons() {
    const filterContainer = document.getElementById('filterContainer');
    
    if (!filterContainer) return;
    
    let filterHtml = '';
    
    // Add filter buttons
    if (userFilters.size === 0) {
        filterHtml += '<p class="text-muted small">No filters added yet. Add some keywords above to filter stories.</p>';
    } else {
        userFilters.forEach((count, word) => {
            const activeClass = activeFilters.has(word) ? 'active' : '';
            filterHtml += `
                <button class="btn btn-sm btn-outline-secondary filter-btn ${activeClass}" 
                        data-word="${word}">
                    ${word} <span class="badge bg-secondary">${count}</span>
                    <span class="remove-filter" data-word="${word}">&times;</span>
                </button>
            `;
        });
    }
    
    filterContainer.innerHTML = filterHtml;
    
    // Add event listeners for the filter buttons
    document.querySelectorAll('.filter-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            // Don't toggle if the remove button was clicked
            if (e.target.classList.contains('remove-filter')) return;
            
            const word = this.getAttribute('data-word');
            toggleFilter(word);
        });
    });
    
    document.querySelectorAll('.remove-filter').forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent the filter button click event
            const word = this.getAttribute('data-word');
            removeFilter(word);
        });
    });
    
    // Make sure the add button event listener is set up
    const addFilterBtn = document.getElementById('addFilterBtn');
    if (addFilterBtn && !addFilterBtn._hasClickListener) {
        addFilterBtn.addEventListener('click', addNewFilter);
        addFilterBtn._hasClickListener = true;
    }
    
    // Set up enter key for the input field
    const newFilterInput = document.getElementById('newFilterInput');
    if (newFilterInput && !newFilterInput._hasKeyListener) {
        newFilterInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                addNewFilter();
            }
        });
        newFilterInput._hasKeyListener = true;
    }
}

// Add a new filter
function addNewFilter() {
    const input = document.getElementById('newFilterInput');
    const word = input.value.trim();
    
    if (!word) return;
    
    // Add to user filters if it doesn't exist
    if (!userFilters.has(word)) {
        userFilters.set(word, 0);
        
        // Count occurrences
        allStories.forEach(story => {
            const text = (story.title + ' ' + (story.description || '')).toLowerCase();
            if (text.includes(word.toLowerCase())) {
                userFilters.set(word, userFilters.get(word) + 1);
            }
        });
        
        // Save filters
        saveFilters();
        
        // Refresh display
        displayFilterButtons();
    }
    
    // Clear input
    input.value = '';
}

// Remove a filter
function removeFilter(word) {
    // Remove from active filters if it's active
    if (activeFilters.has(word)) {
        activeFilters.delete(word);
    }
    
    // Remove from user filters
    userFilters.delete(word);
    
    // Save filters
    saveFilters();
    
    // Refresh display and apply filters
    displayFilterButtons();
    applyFilters();
}

// Toggle a filter
function toggleFilter(word) {
    const button = document.querySelector(`.filter-btn[data-word="${word}"]`);
    
    if (activeFilters.has(word)) {
        // Remove filter
        activeFilters.delete(word);
        button.classList.remove('active');
    } else {
        // Add filter
        activeFilters.add(word);
        button.classList.add('active');
    }
    
    // Apply filters
    applyFilters();
}

// Apply filters to stories
function applyFilters() {
    if (activeFilters.size === 0) {
        // No active filters, show all stories
        displayStories(allStories);
        return;
    }
    
    // Filter stories that contain any of the active filter words
    const filteredStories = allStories.filter(story => {
        const text = (story.title + ' ' + (story.description || '')).toLowerCase();
        return Array.from(activeFilters).some(word => 
            text.includes(word.toLowerCase())
        );
    });
    
    // Display filtered stories
    displayStories(filteredStories);
    
    // Clear any search messages
    const searchResults = document.getElementById('searchResults');
    if (searchResults) {
        searchResults.innerHTML = '';
    }
} 