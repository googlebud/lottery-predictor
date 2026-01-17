/**
 * LottoGenius Pro - Real Data Fetcher
 * Attempts to fetch actual lottery data from various sources
 * Note: Due to CORS restrictions, some sources may not work directly in browser
 */

class RealDataFetcher {
    static CORS_PROXIES = [
        'https://api.allorigins.win/raw?url=',
        'https://corsproxy.io/?',
        'https://cors-anywhere.herokuapp.com/'
    ];
    
    static DATA_SOURCES = {
        lottomax: {
            olg: 'https://www.olg.ca/en/lottery/play-lotto-max-encore/past-results.html',
            playnow: 'https://www.playnow.com/lottery/lotto-max-winning-numbers/',
            lottonumbers: 'https://ca.lottonumbers.com/lotto-max/past-numbers'
        },
        lotto649: {
            olg: 'https://www.olg.ca/en/lottery/play-lotto-649-encore/past-results.html',
            playnow: 'https://www.playnow.com/lottery/lotto-649-winning-numbers/',
            lottonumbers: 'https://ca.lottonumbers.com/lotto-649/past-numbers'
        },
        dailygrand: {
            olg: 'https://www.olg.ca/en/lottery/play-daily-grand-encore/past-results.html'
        },
        lottario: {
            olg: 'https://www.olg.ca/en/lottery/play-lottario-encore/past-results.html'
        },
        ontario49: {
            olg: 'https://www.olg.ca/en/lottery/play-ontario-49-encore/past-results.html'
        }
    };
    
    /**
     * Try to fetch data using multiple CORS proxies
     */
    static async fetchWithProxy(url) {
        for (const proxy of this.CORS_PROXIES) {
            try {
                const response = await fetch(proxy + encodeURIComponent(url), {
                    headers: {
                        'Accept': 'text/html,application/json'
                    }
                });
                
                if (response.ok) {
                    return await response.text();
                }
            } catch (e) {
                console.warn(`Proxy ${proxy} failed for ${url}:`, e.message);
            }
        }
        return null;
    }
    
    /**
     * Parse OLG page HTML to extract winning numbers
     * Note: This is fragile and may break if OLG changes their page structure
     */
    static parseOLGPage(html, game) {
        const draws = [];
        
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // OLG uses various structures, try to find draw results
            const resultContainers = doc.querySelectorAll('.past-results-item, .winning-number-card, [class*="result"]');
            
            resultContainers.forEach(container => {
                const dateEl = container.querySelector('.date, [class*="date"]');
                const numbersEl = container.querySelectorAll('.number, .ball, [class*="number"]');
                
                if (dateEl && numbersEl.length > 0) {
                    const numbers = Array.from(numbersEl)
                        .map(el => parseInt(el.textContent.trim()))
                        .filter(n => !isNaN(n));
                    
                    if (numbers.length >= GAMES[game].pick) {
                        draws.push({
                            date: dateEl.textContent.trim(),
                            numbers: numbers.slice(0, GAMES[game].pick).sort((a, b) => a - b),
                            bonus: numbers[GAMES[game].pick] || null
                        });
                    }
                }
            });
        } catch (e) {
            console.error('Error parsing OLG page:', e);
        }
        
        return draws;
    }
    
    /**
     * Parse LottoNumbers.com page
     */
    static parseLottoNumbersPage(html, game) {
        const draws = [];
        
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // LottoNumbers uses table structure
            const rows = doc.querySelectorAll('table tbody tr, .results-table tr');
            
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length >= 2) {
                    const dateCell = cells[0];
                    const numbersCell = cells[1];
                    
                    const numberElements = numbersCell.querySelectorAll('.ball, .number, span');
                    const numbers = Array.from(numberElements)
                        .map(el => parseInt(el.textContent.trim()))
                        .filter(n => !isNaN(n) && n > 0 && n <= GAMES[game].balls);
                    
                    if (numbers.length >= GAMES[game].pick) {
                        draws.push({
                            date: dateCell.textContent.trim(),
                            numbers: numbers.slice(0, GAMES[game].pick).sort((a, b) => a - b),
                            bonus: numbers[GAMES[game].pick] || null
                        });
                    }
                }
            });
        } catch (e) {
            console.error('Error parsing LottoNumbers page:', e);
        }
        
        return draws;
    }
    
    /**
     * Fetch real data for a specific game
     */
    static async fetchGameData(game) {
        const sources = this.DATA_SOURCES[game];
        if (!sources) return null;
        
        // Try each source
        for (const [sourceName, url] of Object.entries(sources)) {
            console.log(`Trying ${sourceName} for ${game}...`);
            
            const html = await this.fetchWithProxy(url);
            if (!html) continue;
            
            let draws;
            if (sourceName === 'olg') {
                draws = this.parseOLGPage(html, game);
            } else if (sourceName === 'lottonumbers') {
                draws = this.parseLottoNumbersPage(html, game);
            }
            
            if (draws && draws.length > 0) {
                console.log(`Successfully fetched ${draws.length} draws from ${sourceName}`);
                return draws;
            }
        }
        
        console.warn(`Could not fetch real data for ${game}, using sample data`);
        return null;
    }
    
    /**
     * Fetch all games data
     */
    static async fetchAllGamesData() {
        const results = {};
        
        for (const game of Object.keys(GAMES)) {
            results[game] = await this.fetchGameData(game);
        }
        
        return results;
    }
    
    /**
     * Update HISTORICAL_DATA with real data
     */
    static async updateHistoricalData() {
        const realData = await this.fetchAllGamesData();
        
        for (const [game, draws] of Object.entries(realData)) {
            if (draws && draws.length > 0) {
                HISTORICAL_DATA[game] = draws;
                console.log(`Updated ${game} with ${draws.length} real draws`);
            }
        }
        
        return realData;
    }
}

/**
 * Manual Data Entry Helper
 * For when automatic fetching doesn't work
 */
class ManualDataEntry {
    /**
     * Parse CSV format data
     * Expected format: date,num1,num2,num3,num4,num5,num6,num7,bonus
     */
    static parseCSV(csvText, game) {
        const lines = csvText.trim().split('\n');
        const draws = [];
        
        lines.forEach((line, idx) => {
            if (idx === 0 && line.toLowerCase().includes('date')) return; // Skip header
            
            const parts = line.split(',').map(p => p.trim());
            if (parts.length < GAMES[game].pick + 1) return;
            
            const date = parts[0];
            const numbers = parts.slice(1, GAMES[game].pick + 1)
                .map(n => parseInt(n))
                .filter(n => !isNaN(n))
                .sort((a, b) => a - b);
            
            const bonus = parts[GAMES[game].pick + 1] ? parseInt(parts[GAMES[game].pick + 1]) : null;
            
            if (numbers.length === GAMES[game].pick) {
                draws.push({ date, numbers, bonus });
            }
        });
        
        return draws;
    }
    
    /**
     * Parse JSON format data
     */
    static parseJSON(jsonText) {
        try {
            return JSON.parse(jsonText);
        } catch (e) {
            console.error('Invalid JSON:', e);
            return null;
        }
    }
    
    /**
     * Import data from file input
     */
    static async importFromFile(file, game) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const content = e.target.result;
                
                let draws;
                if (file.name.endsWith('.csv')) {
                    draws = this.parseCSV(content, game);
                } else if (file.name.endsWith('.json')) {
                    draws = this.parseJSON(content);
                } else {
                    // Try both
                    draws = this.parseCSV(content, game);
                    if (!draws || draws.length === 0) {
                        draws = this.parseJSON(content);
                    }
                }
                
                resolve(draws);
            };
            
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }
}

/**
 * Sample Data Generator with realistic patterns
 * Generates data that follows typical lottery distribution patterns
 */
class RealisticDataGenerator {
    /**
     * Generate realistic lottery data based on game configuration
     */
    static generate(game, numDraws, startDate = new Date('2019-05-14')) {
        const config = GAMES[game];
        const draws = [];
        
        // Track frequency to create some variance
        const frequency = {};
        for (let i = 1; i <= config.balls; i++) {
            frequency[i] = 0;
        }
        
        for (let d = 0; d < numDraws; d++) {
            const drawDate = new Date(startDate);
            
            // Determine days to add based on draw schedule
            let daysToAdd = 0;
            if (d > 0) {
                // Approximate draw frequency
                if (config.drawDays.length === 2) {
                    daysToAdd = d % 2 === 0 ? 3 : 4; // Tue-Fri or Wed-Sat pattern
                } else {
                    daysToAdd = 7; // Weekly
                }
            }
            drawDate.setDate(startDate.getDate() + Math.floor(d * 3.5));
            
            // Generate numbers with slight bias toward uniform distribution
            const numbers = this.generateBalancedNumbers(config.balls, config.pick, frequency);
            
            // Update frequency
            numbers.forEach(n => frequency[n]++);
            
            // Generate bonus
            const bonus = Math.floor(Math.random() * (config.bonusBalls || config.balls)) + 1;
            
            draws.push({
                date: drawDate.toISOString().split('T')[0],
                numbers: numbers.sort((a, b) => a - b),
                bonus: bonus,
                jackpot: config.jackpotStart + Math.floor(Math.random() * 70000000)
            });
        }
        
        return draws.reverse(); // Most recent first
    }
    
    /**
     * Generate numbers with realistic distribution
     */
    static generateBalancedNumbers(maxBall, count, frequency) {
        const numbers = new Set();
        const totalFreq = Object.values(frequency).reduce((a, b) => a + b, 0) || 1;
        
        while (numbers.size < count) {
            let num;
            
            // 70% random, 30% weighted toward less frequent
            if (Math.random() < 0.7) {
                num = Math.floor(Math.random() * maxBall) + 1;
            } else {
                // Weight toward underrepresented numbers
                const avgFreq = totalFreq / maxBall;
                const underrepresented = Object.entries(frequency)
                    .filter(([_, f]) => f < avgFreq)
                    .map(([n, _]) => parseInt(n));
                
                if (underrepresented.length > 0) {
                    num = underrepresented[Math.floor(Math.random() * underrepresented.length)];
                } else {
                    num = Math.floor(Math.random() * maxBall) + 1;
                }
            }
            
            numbers.add(num);
        }
        
        return Array.from(numbers);
    }
}

// Export
window.RealDataFetcher = RealDataFetcher;
window.ManualDataEntry = ManualDataEntry;
window.RealisticDataGenerator = RealisticDataGenerator;

// Auto-attempt to fetch real data on load (disabled by default to avoid delays)
// Uncomment to enable:
// document.addEventListener('DOMContentLoaded', async () => {
//     console.log('Attempting to fetch real lottery data...');
//     await RealDataFetcher.updateHistoricalData();
// });
