/**
 * Article analysis functionality for News Genie
 */

// Analyze an article with Claude API
function analyzeArticle(apiKey, content) {
    document.getElementById('analysisResult').innerHTML = '';
    document.getElementById('analysisLoadingSpinner').style.display = 'flex';
    
    fetch('/analyze', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            api_key: apiKey,
            content: content
        })
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('analysisLoadingSpinner').style.display = 'none';
        if (data.analysis) {
            document.getElementById('analysisResult').innerHTML = `
                <div class="border p-3 rounded">
                    ${data.analysis.replace(/\n/g, '<br>')}
                </div>
            `;
        } else if (data.error) {
            document.getElementById('analysisResult').innerHTML = `
                <div class="alert alert-danger">${data.error}</div>
            `;
        }
    })
    .catch(error => {
        console.error('Error analyzing article:', error);
        document.getElementById('analysisLoadingSpinner').style.display = 'none';
        document.getElementById('analysisResult').innerHTML = `
            <div class="alert alert-danger">Error analyzing article: ${error.message}</div>
        `;
    });
} 