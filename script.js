document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
    // 1. SELECTING ELEMENTS
    // ==========================================
    const searchInput = document.querySelector('.search-container input');
    const levelButtons = document.querySelectorAll('.level-btn');
    const levelContents = document.querySelectorAll('.level-content');
    const allCards = document.querySelectorAll('.subject-card');
    const gridSection = document.querySelector('.subject-grid-section');
 
    // Modal Elements
    const modal = document.getElementById("requestModal");
    const openBtn = document.getElementById("openModalBtn");
    const footerBtn = document.getElementById("openModalFooter");
    const closeBtn = document.querySelector(".close-btn");
 
    // ==========================================
    // 2. MODAL & SUCCESS LOGIC
    // ==========================================
    const urlParams = new URLSearchParams(window.location.search);
 
    if (urlParams.get('status') === 'success') {
        alert("Paper Requested! We'll check our archive and update the site soon.");
        window.history.replaceState({}, document.title, window.location.pathname);
    }
 
    [openBtn, footerBtn].forEach(btn => {
        if (btn) {
            btn.onclick = (e) => {
                e.preventDefault();
                modal.style.display = "block";
            };
        }
    });
 
    if (closeBtn) closeBtn.onclick = () => modal.style.display = "none";
 
    window.onclick = (event) => {
        if (event.target == modal) modal.style.display = "none";
    };
 
    // ==========================================
    // 3. SMART SEARCH ENGINE
    // ==========================================
 
    // --- Routing Map ---
    const PAGES = {
        national: {
            route: 'national.html',
            triggers: ['national', 'nesa', 'past paper', 'official']
        },
        district: {
            route: 'district.html',
            triggers: ['district', 'mock', 'trial', 'gasabo', 'kicukiro', 'nyarugenge']
        },
        endofyear: {
            route: 'end-of-year.html',
            triggers: ['end of year', 'end-of-year', 'eoy', 'promotion', 'term 3']
        }
    };
 
    const SUBJECT_ALIASES = {
        'math':        'mathematics',
        'maths':       'mathematics',
        'mathematics': 'mathematics',
        'physics':     'physics',
        'chem':        'chemistry',
        'chemistry':   'chemistry',
        'bio':         'biology',
        'biology':     'biology',
        'english':     'english',
        'computer':    'computer science',
        'cs':          'computer science',
        'ict':         'computer science',
        'computer science': 'computer science',
        'economics':   'economics',
        'eco':         'economics',
        'entrepreneurship': 'entrepreneurship',
        'entre':       'entrepreneurship',
        'general studies': 'general studies and communication',
        'general':     'general studies and communication',
        'gs':          'general studies and communication',
        'history':     'history',
        'geography':   'geography',
        'geo':         'geography',
        'kinyarwanda': 'kinyarwanda',
        'kinya':       'kinyarwanda',
        'french':      'french',
    };
 
    const LEVEL_ALIASES = {
        'p6':  'Primary',
        'p5':  'Primary',
        'p4':  'Primary',
        'p3':  'Primary',
        'p1':  'Primary',
        'primary': 'Primary',
        's3':  'Ordinary',
        'o level': 'Ordinary',
        'ordinary': 'Ordinary',
        's6':  'Advanced',
        's5':  'Advanced',
        's4':  'Advanced',
        'a level': 'Advanced',
        'advanced': 'Advanced',
        's1':  'Ordinary Level (S1-S2)',
        's2':  'Ordinary Level (S1-S2)',
    };
 
    function normalize(text) {
        return (text || '').toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
    }
 
    function parseQuery(rawQuery) {
        const q = normalize(rawQuery);
        const result = { page: null, subject: null, level: null, year: null, district: null };
 
        const yearMatch = q.match(/\b(20\d{2}|19\d{2})\b/);
        if (yearMatch) result.year = yearMatch[1];
 
        for (const [key, pageData] of Object.entries(PAGES)) {
            if (pageData.triggers.some(t => q.includes(t))) {
                result.page = pageData.route;
                break;
            }
        }
 
        const districts = ['gasabo', 'kicukiro', 'nyarugenge'];
        for (const d of districts) {
            if (q.includes(d)) {
                result.district = d.charAt(0).toUpperCase() + d.slice(1);
                result.page = 'district-results.html';
                break;
            }
        }
 
        for (const [alias, canonical] of Object.entries(SUBJECT_ALIASES)) {
            if (q.includes(alias)) {
                result.subject = canonical;
                break;
            }
        }
 
        for (const [alias, levelLabel] of Object.entries(LEVEL_ALIASES)) {
            if (q.includes(alias)) {
                result.level = levelLabel;
                break;
            }
        }
 
        if (!result.page && result.subject) result.page = 'national.html';
 
        return result;
    }
 
    function getPageType() {
        const path = window.location.pathname.toLowerCase();
        if (path.endsWith('national.html'))         return 'national';
        if (path.endsWith('district.html'))         return 'district';
        if (path.endsWith('district-results.html')) return 'district-results';
        if (path.endsWith('end-of-year.html'))      return 'endofyear';
        return 'home';
    }
 
    // ==========================================
    // *** FIX: DISTRICT FILTER ***
    // Reads ?dist=Gasabo from the URL and hides cards
    // that don't belong to that district.
    // Called on page load AND after every level-tab switch.
    // ==========================================
    function applyDistrictFilter() {
        const dist = urlParams.get('dist');
        if (!dist) return; // Not on a district-results page with a district param
 
        allCards.forEach(card => {
            const cardDistrict = card.getAttribute('data-district');
            // Only filter cards that actually have a data-district attribute
            if (cardDistrict) {
                card.style.display =
                    cardDistrict.toLowerCase() === dist.toLowerCase() ? '' : 'none';
            }
        });
    }
 
    // ==========================================
    // 4. CROSS-PAGE NAVIGATION
    // ==========================================
    function performSearch(query) {
        const trimmed = query.trim();
        const pageType = getPageType();
 
        if (pageType === 'home') {
            if (!trimmed || trimmed.length < 2) return;
            const parsed = parseQuery(trimmed);
            const dest = parsed.page || 'national.html';
            const params = new URLSearchParams();
            params.set('search', trimmed);
            if (parsed.subject) params.set('subject', parsed.subject);
            if (parsed.level)   params.set('level', parsed.level);
            if (parsed.year)    params.set('year', parsed.year);
            if (parsed.district) params.set('dist', parsed.district);
            window.location.href = `${dest}?${params.toString()}`;
            return;
        }
 
        if (trimmed.length > 1) {
            const parsed = parseQuery(trimmed);
            const currentPage = window.location.pathname.toLowerCase().split('/').pop();
            const targetPage  = parsed.page ? parsed.page.toLowerCase() : null;
 
            if (targetPage && targetPage !== currentPage && targetPage !== 'district-results.html') {
                const params = new URLSearchParams();
                params.set('search', trimmed);
                if (parsed.subject)  params.set('subject', parsed.subject);
                if (parsed.level)    params.set('level', parsed.level);
                if (parsed.year)     params.set('year', parsed.year);
                if (parsed.district) params.set('dist', parsed.district);
                window.location.href = `${parsed.page}?${params.toString()}`;
                return;
            }
 
            if (parsed.district && currentPage !== 'district-results.html') {
                window.location.href = `district-results.html?dist=${parsed.district}&search=${encodeURIComponent(trimmed)}`;
                return;
            }
        }
 
        filterCardsOnPage(trimmed);
    }
 
    // ==========================================
    // 5. ON-PAGE FILTERING & HIGHLIGHTING
    // ==========================================
    let noResultsMsg = document.getElementById('no-results');
    if (!noResultsMsg && gridSection) {
        noResultsMsg = document.createElement('div');
        noResultsMsg.id = 'no-results';
        noResultsMsg.style.display = 'none';
        noResultsMsg.style.textAlign = 'center';
        noResultsMsg.style.padding = '3rem';
        noResultsMsg.innerHTML = `<h3 style="color:#666;">No subjects match your search.</h3><p>Try searching for a year (2023) or a level (S6).</p>`;
        gridSection.insertBefore(noResultsMsg, gridSection.firstChild);
    }
 
    function filterCardsOnPage(query) {
        if (!query || query.length < 1) {
            // On clear: restore visibility but re-apply district filter
            allCards.forEach(card => { card.classList.remove('search-highlight'); });
            applyDistrictFilter(); // <-- keeps district isolation intact on clear
            if (noResultsMsg) noResultsMsg.style.display = 'none';
            return;
        }
 
        const tokens = normalize(query).split(' ').filter(t => t.length > 1);
        const dist = (urlParams.get('dist') || '').toLowerCase();
        let visibleCount = 0;
 
        allCards.forEach(card => {
            // *** FIX: never un-hide a card from a different district ***
            const cardDistrict = (card.getAttribute('data-district') || '').toLowerCase();
            if (dist && cardDistrict && cardDistrict !== dist) {
                card.style.display = 'none';
                return;
            }
 
            const cardKeywords = normalize(card.getAttribute('data-keywords') || '');
            const cardText = normalize(card.innerText || '');
            const searchable = cardKeywords + ' ' + cardText;
            const matches = tokens.every(t => searchable.includes(t));
            card.style.display = matches ? '' : 'none';
            card.classList.remove('search-highlight');
            if (matches) visibleCount++;
        });
 
        if (noResultsMsg) noResultsMsg.style.display = visibleCount ? 'none' : 'block';
    }
 
    function applyIncomingSearch() {
        const subject  = urlParams.get('subject');
        const level    = urlParams.get('level');
        const year     = urlParams.get('year');
        const rawQuery = urlParams.get('search');
 
        if (level && levelButtons.length) {
            levelButtons.forEach(btn => {
                if (btn.innerText.toLowerCase().includes(level.toLowerCase())) {
                    btn.click();
                }
            });
        } else if (levelButtons.length) {
            const alreadyActive = document.querySelector('.level-btn.active');
            if (!alreadyActive) levelButtons[0].click();
        }
 
        if (subject || rawQuery) {
            const needle = normalize(subject || rawQuery);
            const dist = (urlParams.get('dist') || '').toLowerCase();
 
            let bestCard = null;
            allCards.forEach(card => {
                const h3 = card.querySelector('h3');
                if (!h3) return;
                // *** FIX: only consider cards from the correct district ***
                const cardDistrict = (card.getAttribute('data-district') || '').toLowerCase();
                if (dist && cardDistrict && cardDistrict !== dist) return;
 
                const cardName = normalize(h3.innerText);
                const cardKeywords = normalize(card.getAttribute('data-keywords') || '');
                if (cardName.includes(needle) || needle.includes(cardName) || cardKeywords.includes(needle)) {
                    bestCard = card;
                }
            });
 
            if (bestCard) {
                const parentContent = bestCard.closest('.level-content');
                if (parentContent) {
                    levelContents.forEach(lc => lc.style.display = 'none');
                    parentContent.style.display = 'block';
                }
 
                bestCard.classList.add('search-highlight');
                setTimeout(() => bestCard.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
 
                if (year) {
                    bestCard.querySelectorAll('.paper-list li').forEach(li => {
                        const yearEl = li.querySelector('.year');
                        if (yearEl && !yearEl.innerText.includes(year)) {
                            li.style.opacity = '0.35';
                        }
                    });
                }
            } else {
                filterCardsOnPage(rawQuery || subject);
            }
        }
    }
 
    // ==========================================
    // 6. LEVEL SWITCHER LOGIC
    // ==========================================
    function showLevelContent(btn) {
        const text = btn.innerText;
        levelContents.forEach(c => c.style.display = 'none');
        allCards.forEach(card => { card.classList.remove('search-highlight'); });
 
        if (text.includes('P6') || text.includes('Primary'))        { const el = document.getElementById('p6-content'); if (el) el.style.display = 'block'; }
        else if (text.includes('S3') || text.includes('Ordinary'))  { const el = document.getElementById('s3-content'); if (el) el.style.display = 'block'; }
        else if (text.includes('S6') || text.includes('Advanced'))  { const el = document.getElementById('s6-content'); if (el) el.style.display = 'block'; }
        else {
            if (levelContents[0]) levelContents[0].style.display = 'block';
        }
 
        // *** FIX: re-apply district filter after every tab switch ***
        applyDistrictFilter();
    }
 
    levelButtons.forEach(button => {
        button.addEventListener('click', () => {
            levelButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            showLevelContent(button);
            if (searchInput) { searchInput.value = ''; }
            if (noResultsMsg) noResultsMsg.style.display = 'none';
        });
    });
 
    // ==========================================
    // 7. SEARCH INPUT EVENT LISTENERS
    // ==========================================
    if (searchInput) {
        const pageType = getPageType();
 
        if (pageType === 'home') {
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') performSearch(searchInput.value);
            });
        } else {
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') performSearch(searchInput.value);
            });
            searchInput.addEventListener('input', (e) => {
                filterCardsOnPage(e.target.value);
            });
        }
 
        const incomingQuery = urlParams.get('search');
        if (incomingQuery) {
            searchInput.value = incomingQuery;
            applyIncomingSearch();
        }
    }
 
    // ==========================================
    // 8. UTILITIES
    // ==========================================
    function disableEmptyLinks() {
        document.querySelectorAll('.download-link.scheme').forEach(link => {
            if (link.getAttribute('href') === '#') {
                link.classList.add('disabled-link');
                link.innerText = 'Marking (soon)';
            }
        });
    }
 
    disableEmptyLinks();
 
    // *** Apply district filter on initial page load ***
    applyDistrictFilter();
 

// ==========================================
    // 8. UTILITIES
    // ==========================================
    function disableEmptyLinks() {
        document.querySelectorAll('.download-link.scheme').forEach(link => {
            if (link.getAttribute('href') === '#') {
                link.classList.add('disabled-link');
                link.innerText = 'Marking..';
            }
        });
    }
 
    disableEmptyLinks();
 
});
// ==========================================
// DYNAMIC TITLE FOR DISTRICT RESULTS PAGE
// ==========================================
const _distParams = new URLSearchParams(window.location.search);
const distName = _distParams.get('dist');
if (distName) {
    const heroH1 = document.querySelector('.archive-hero h1');
    if (heroH1) heroH1.innerText = `${distName} Mock Exams`;
}
 
 