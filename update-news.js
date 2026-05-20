// Real news fetching function - keeps your exact design
async function fetchLiveNews() {
    const sources = [
        'https://api.rss2json.com/v1/api.json?rss_url=https://feeds.feedburner.com/TheHackersNews',
        'https://api.rss2json.com/v1/api.json?rss_url=https://www.bleepingcomputer.com/feed/',
        'https://api.rss2json.com/v1/api.json?rss_url=https://securityaffairs.com/feed',
        'https://api.rss2json.com/v1/api.json?rss_url=https://threatpost.com/feed/',
        'https://api.rss2json.com/v1/api.json?rss_url=https://www.darkreading.com/rss.xml',
        'https://api.rss2json.com/v1/api.json?rss_url=https://www.cisa.gov/cybersecurity-advisories/all.xml'
    ];
    
    let allArticles = [];
    
    for (let url of sources) {
        try {
            let response = await fetch(url);
            let data = await response.json();
            if (data.items && data.items.length > 0) {
                for (let item of data.items.slice(0, 8)) {
                    let severity = getSeverityFromTitle(item.title);
                    allArticles.push({
                        title: item.title,
                        summary: (item.description || '').replace(/<[^>]*>/g, '').substring(0, 180),
                        date: new Date(item.pubDate).toLocaleDateString(),
                        source: data.feed?.title || 'Security Feed',
                        link: item.link,
                        severity: severity
                    });
                }
            }
        } catch(e) {
            console.log('Feed error:', e);
        }
    }
    
    // Remove duplicates
    let unique = [];
    let titles = new Set();
    for (let article of allArticles) {
        if (!titles.has(article.title)) {
            titles.add(article.title);
            unique.push(article);
        }
    }
    
    // Sort by date (newest first)
    unique.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return unique.slice(0, 24); // Get up to 24 articles
}

function getSeverityFromTitle(title) {
    let t = title.toLowerCase();
    if (t.includes('critical') || t.includes('ransomware') || t.includes('zero-day') || t.includes('breach')) return 'critical';
    if (t.includes('attack') || t.includes('hack') || t.includes('malware') || t.includes('phishing')) return 'high';
    if (t.includes('vulnerability') || t.includes('exploit') || t.includes('data leak')) return 'medium';
    return 'low';
}

// Override the original fetchNews function
const originalFetchNews = window.fetchNews;
window.fetchNews = async function() {
    const container = document.getElementById('incidentsContainer');
    if (container) {
        container.innerHTML = '<div class="loading"><div class="spinner"></div><p>Fetching live cybersecurity news from 6 sources...</p></div>';
    }
    
    try {
        const liveNews = await fetchLiveNews();
        
        if (liveNews && liveNews.length > 0) {
            window.allIncidents = liveNews;
            document.getElementById('incidentCount').innerHTML = liveNews.length;
            if (window.filterIncidents) window.filterIncidents();
        } else {
            console.log('No live news, keeping existing data');
        }
    } catch(e) {
        console.log('Error fetching news:', e);
    }
};

// Auto-refresh every 3 minutes (faster than before)
setInterval(() => {
    if (window.fetchNews) window.fetchNews();
}, 180000);
