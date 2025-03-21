/**
 * Feeds management functionality for News Genie
 */

// Load feeds with retry mechanism
function loadFeeds(retryCount = 0, maxRetries = 3) {
    console.log(`Loading feeds... (attempt ${retryCount + 1}/${maxRetries + 1})`);
    
    // Show a temporary loading indicator in the feedsList
    const feedsList = document.getElementById('feedsList');
    if (feedsList) {
        feedsList.innerHTML = `
            <div class="text-center py-2">
                <div class="spinner-border spinner-border-sm text-primary" role="status">
                    <span class="visually-hidden">Loading feeds...</span>
                </div>
                <span class="ms-2">Updating feed list...</span>
            </div>
        `;
    }
    
    fetch('/api/feeds')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log(`Loaded ${data.feeds ? data.feeds.length : 0} feeds`);
            
            // Display feeds in the feed management tab
            displayFeeds(data.feeds || []);
            
            // Also populate the feed filter section
            populateFeedFilters(data.feeds || []);
        })
        .catch(error => {
            console.error(`Error loading feeds (attempt ${retryCount + 1}):`, error);
            
            // If we haven't reached max retries, try again after a delay
            if (retryCount < maxRetries) {
                console.log(`Retrying in ${(retryCount + 1) * 1000}ms...`);
                setTimeout(() => {
                    loadFeeds(retryCount + 1, maxRetries);
                }, (retryCount + 1) * 1000); // Exponential backoff
            } else {
                if (feedsList) {
                    // Show retry button after all retries fail
                    feedsList.innerHTML = `
                        <div class="alert alert-danger">
                            Error loading feeds. 
                            <button class="btn btn-sm btn-outline-danger ms-2" onclick="loadFeeds(0, 3)">
                                Try Again
                            </button>
                        </div>
                    `;
                }
                
                // Show error in feed filter section too
                const feedFilterContainer = document.getElementById('feedFilterContainer');
                if (feedFilterContainer) {
                    feedFilterContainer.innerHTML = `
                        <div class="alert alert-danger">
                            Error loading feeds. 
                            <button class="btn btn-sm btn-outline-danger ms-2" onclick="loadFeeds(0, 3)">
                                Try Again
                            </button>
                        </div>
                    `;
                }
            }
        });
}

// Display feeds with animation
function displayFeeds(feeds) {
    const feedsList = document.getElementById('feedsList');
    const noFeedsMessage = document.getElementById('noFeedsMessage');
    
    if (!Array.isArray(feeds)) {
        console.error('Invalid feeds data:', feeds);
        feedsList.innerHTML = `
            <div class="alert alert-warning">
                Invalid feed data received.
                <button class="btn btn-sm btn-outline-warning ms-2" onclick="loadFeeds(0, 3)">
                    Try Again
                </button>
            </div>
        `;
        return;
    }
    
    if (feeds.length === 0) {
        feedsList.innerHTML = `
            <div class="text-center py-3 text-muted">
                No feeds added yet. Add your first RSS feed above.
            </div>
        `;
        return;
    }
    
    if (noFeedsMessage) {
        noFeedsMessage.style.display = 'none';
    }
    
    let feedsHtml = '';
    feeds.forEach(feed => {
        feedsHtml += `
            <div class="feed-item" style="animation: fadeIn 0.5s">
                <div style="width: 100%;">
                    <div class="d-flex justify-content-between align-items-start mb-1">
                        <strong>${feed.title}</strong>
                        <button class="btn btn-sm btn-danger remove-feed" data-url="${feed.url}">Remove</button>
                    </div>
                    <div class="text-muted small mb-2">${feed.url}</div>
                    <div class="feed-description-container">
                        <div class="input-group input-group-sm">
                            <input type="text" class="form-control form-control-sm feed-description" 
                                placeholder="Add a short description (optional)" 
                                value="${feed.description || ''}" 
                                data-url="${feed.url}">
                            <button class="btn btn-outline-secondary save-description" type="button" data-url="${feed.url}">
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    feedsList.innerHTML = feedsHtml;
    
    // Add event listeners for remove buttons
    document.querySelectorAll('.remove-feed').forEach(button => {
        button.addEventListener('click', function() {
            const url = this.getAttribute('data-url');
            removeFeed(url);
        });
    });
    
    // Add event listeners for save description buttons
    document.querySelectorAll('.save-description').forEach(button => {
        button.addEventListener('click', function() {
            const url = this.getAttribute('data-url');
            const descriptionInput = document.querySelector(`.feed-description[data-url="${url}"]`);
            if (descriptionInput) {
                saveDescription(url, descriptionInput.value);
            }
        });
    });
    
    // Add event listeners for pressing Enter in description fields
    document.querySelectorAll('.feed-description').forEach(input => {
        input.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                const url = this.getAttribute('data-url');
                saveDescription(url, this.value);
            }
        });
    });
}

// Save feed description
function saveDescription(url, description) {
    // Find the input field and add a saving indicator
    const descriptionInput = document.querySelector(`.feed-description[data-url="${url}"]`);
    const saveButton = document.querySelector(`.save-description[data-url="${url}"]`);
    
    if (descriptionInput && saveButton) {
        // Disable input and button while saving
        descriptionInput.disabled = true;
        saveButton.disabled = true;
        saveButton.innerHTML = `
            <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            Saving...
        `;
    }
    
    fetch(`/api/feeds/${encodeURIComponent(url)}/description`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ description: description })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Show brief success feedback
            if (saveButton) {
                saveButton.innerHTML = `✓ Saved`;
                saveButton.classList.remove('btn-outline-secondary');
                saveButton.classList.add('btn-success');
                
                // Revert button after a delay
                setTimeout(() => {
                    saveButton.innerHTML = `Save`;
                    saveButton.classList.remove('btn-success');
                    saveButton.classList.add('btn-outline-secondary');
                }, 2000);
            }
        } else {
            console.error('Error saving description:', data.error);
            
            // Show error message
            if (saveButton) {
                saveButton.innerHTML = `Failed`;
                saveButton.classList.remove('btn-outline-secondary');
                saveButton.classList.add('btn-danger');
                
                // Revert button after a delay
                setTimeout(() => {
                    saveButton.innerHTML = `Save`;
                    saveButton.classList.remove('btn-danger');
                    saveButton.classList.add('btn-outline-secondary');
                }, 2000);
            }
        }
    })
    .catch(error => {
        console.error('Error saving description:', error);
        
        // Show error message
        if (saveButton) {
            saveButton.innerHTML = `Error`;
            saveButton.classList.remove('btn-outline-secondary');
            saveButton.classList.add('btn-danger');
            
            // Revert button after a delay
            setTimeout(() => {
                saveButton.innerHTML = `Save`;
                saveButton.classList.remove('btn-danger');
                saveButton.classList.add('btn-outline-secondary');
            }, 2000);
        }
    })
    .finally(() => {
        // Re-enable input and button
        if (descriptionInput && saveButton) {
            descriptionInput.disabled = false;
            saveButton.disabled = false;
        }
    });
}

// Add feed
function addFeed(url) {
    // Disable the form while submitting
    const submitButton = document.querySelector('#addFeedForm button[type="submit"]');
    const feedUrlInput = document.getElementById('feedUrl');
    submitButton.disabled = true;
    feedUrlInput.disabled = true;
    
    document.getElementById('feedbackMessage').innerHTML = `
        <div class="alert alert-info">
            <div class="d-flex align-items-center">
                <div class="spinner-border spinner-border-sm me-2" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <div>Adding feed, please wait...</div>
            </div>
        </div>
    `;
    
    fetch('/api/feeds', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: url })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            console.log('Feed added successfully:', data.message);
            
            // Show success message
            document.getElementById('feedbackMessage').innerHTML = `
                <div class="alert alert-success">${data.message}</div>
            `;
            
            // Clear input field
            feedUrlInput.value = '';
            
            // Allow a small delay for the server to update its feed cache
            setTimeout(() => {
                // Refresh feeds list
                loadFeeds();
                
                // Reload stories to include the new feed
                currentPage = 1;
                hasMoreStories = true;
                document.getElementById('storiesContainer').innerHTML = '';
                loadStories();
            }, 500);
            
            // Auto-clear the feedback message after 5 seconds
            setTimeout(() => {
                document.getElementById('feedbackMessage').innerHTML = '';
            }, 5000);
        } else {
            console.error('Error adding feed:', data.error);
            document.getElementById('feedbackMessage').innerHTML = `
                <div class="alert alert-danger">${data.error}</div>
            `;
            
            // Auto-clear the error message after 8 seconds
            setTimeout(() => {
                document.getElementById('feedbackMessage').innerHTML = '';
            }, 8000);
        }
    })
    .catch(error => {
        console.error('Error adding feed:', error);
        document.getElementById('feedbackMessage').innerHTML = `
            <div class="alert alert-danger">Error adding feed: ${error.message}</div>
        `;
    })
    .finally(() => {
        // Re-enable the form
        submitButton.disabled = false;
        feedUrlInput.disabled = false;
    });
}

// Remove feed
function removeFeed(url) {
    if (confirm('Are you sure you want to remove this feed?')) {
        // Find the feed item to apply visual feedback
        const feedItem = document.querySelector(`.feed-item button[data-url="${url}"]`).closest('.feed-item');
        
        if (feedItem) {
            // Apply a fading out effect
            feedItem.style.opacity = '0.5';
        }
        
        document.getElementById('feedbackMessage').innerHTML = `
            <div class="alert alert-info">
                <div class="d-flex align-items-center">
                    <div class="spinner-border spinner-border-sm me-2" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <div>Removing feed, please wait...</div>
                </div>
            </div>
        `;
        
        fetch(`/api/feeds/${encodeURIComponent(url)}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                console.log('Feed removed successfully:', data.message);
                
                document.getElementById('feedbackMessage').innerHTML = `
                    <div class="alert alert-success">${data.message}</div>
                `;
                
                // Allow a small delay for the server to update its feed cache
                setTimeout(() => {
                    // Refresh the feeds list
                    loadFeeds();
                    
                    // Reload stories to reflect the removed feed
                    currentPage = 1;
                    hasMoreStories = true;
                    document.getElementById('storiesContainer').innerHTML = '';
                    loadStories();
                }, 500);
                
                // Auto-clear the feedback message after 5 seconds
                setTimeout(() => {
                    document.getElementById('feedbackMessage').innerHTML = '';
                }, 5000);
            } else {
                console.error('Error removing feed:', data.error);
                
                document.getElementById('feedbackMessage').innerHTML = `
                    <div class="alert alert-danger">${data.error}</div>
                `;
                
                // Reset the opacity if removal failed
                if (feedItem) {
                    feedItem.style.opacity = '1';
                }
                
                // Auto-clear the error message after 8 seconds
                setTimeout(() => {
                    document.getElementById('feedbackMessage').innerHTML = '';
                }, 8000);
            }
        })
        .catch(error => {
            console.error('Error removing feed:', error);
            document.getElementById('feedbackMessage').innerHTML = `
                <div class="alert alert-danger">Error removing feed: ${error.message}</div>
            `;
            
            // Reset the opacity if removal failed
            if (feedItem) {
                feedItem.style.opacity = '1';
            }
        });
    }
}

// Populate feed filters in the filter section
function populateFeedFilters(feeds) {
    const feedFilterContainer = document.getElementById('feedFilterContainer');
    if (!feedFilterContainer) return;
    
    if (!Array.isArray(feeds) || feeds.length === 0) {
        feedFilterContainer.innerHTML = `
            <div class="text-muted text-center py-2">
                No feeds available. Add some in the "Manage RSS Feeds" tab.
            </div>
        `;
        return;
    }
    
    // Get saved feed filters
    let savedFilters = [];
    try {
        const saved = localStorage.getItem('selectedFeedFilters');
        if (saved) {
            savedFilters = JSON.parse(saved);
        }
    } catch (e) {
        console.error('Error parsing saved feed filters:', e);
    }
    
    // If no saved filters, default to selecting all
    const selectAll = !savedFilters || savedFilters.length === 0;
    
    let filterHtml = '<div class="feed-filter-list">';
    feeds.forEach(feed => {
        const description = feed.description ? feed.description : '';
        const isChecked = selectAll || savedFilters.includes(feed.url);
        
        filterHtml += `
            <div class="form-check feed-filter-item">
                <input class="form-check-input feed-checkbox" type="checkbox" 
                    id="feed-${encodeURIComponent(feed.url)}" 
                    value="${feed.url}" 
                    ${isChecked ? 'checked' : ''}>
                <label class="form-check-label" for="feed-${encodeURIComponent(feed.url)}">
                    <span class="feed-title">${feed.title}</span>
                    ${description ? `<span class="feed-description"> | ${description}</span>` : ''}
                </label>
            </div>
        `;
    });
    filterHtml += '</div>';
    
    // Add Select All/Clear All buttons
    filterHtml = `
        <div class="feed-filter-header mb-2">
            <button id="selectAllFeeds" class="btn btn-sm btn-outline-primary me-2">Select All</button>
            <button id="clearAllFeeds" class="btn btn-sm btn-outline-secondary">Clear All</button>
        </div>
        ${filterHtml}
    `;
    
    feedFilterContainer.innerHTML = filterHtml;
    
    // Add event listeners for select all/clear all buttons
    document.getElementById('selectAllFeeds').addEventListener('click', function() {
        document.querySelectorAll('.feed-checkbox').forEach(checkbox => {
            checkbox.checked = true;
        });
        // Save and reload stories
        getActiveFeedFilters();
        loadStories();
    });
    
    document.getElementById('clearAllFeeds').addEventListener('click', function() {
        document.querySelectorAll('.feed-checkbox').forEach(checkbox => {
            checkbox.checked = false;
        });
        // At least check the first one to avoid empty selection
        const firstCheckbox = document.querySelector('.feed-checkbox');
        if (firstCheckbox) {
            firstCheckbox.checked = true;
        }
        // Save and reload stories
        getActiveFeedFilters();
        loadStories();
    });
} 