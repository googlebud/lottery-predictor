/**
 * LottoGenius Pro - Lottery Data Module
 * Handles game configurations, data fetching, and storage
 * UPDATED: Data now generates backwards from current date (Jan 2026)
 */

// Game Configurations
const GAMES = {
    lottomax: {
        name: 'Lotto Max',
        balls: 50,
        pick: 7,
        hasBonus: true,
        bonusBalls: 50,
        drawDays: ['Tuesday', 'Friday'],
        dataUrl: 'https://www.playnow.com/services2/lotto/draw/history/LMAX/50',
        jackpotStart: 10000000,
        prizeStructure: {
            '7/7': 'Jackpot',
            '6/7+B': '2nd Prize',
            '6/7': '3rd Prize',
            '5/7+B': '4th Prize',
            '5/7': '5th Prize',
            '4/7+B': '6th Prize',
            '4/7': '7th Prize',
            '3/7+B': '8th Prize',
            '3/7': 'Free Play'
        }
    },
    lotto649: {
        name: 'Lotto 6/49',
        balls: 49,
        pick: 6,
        hasBonus: true,
        bonusBalls: 49,
        drawDays: ['Wednesday', 'Saturday'],
        dataUrl: 'https://www.playnow.com/services2/lotto/draw/history/BC49/50',
        jackpotStart: 5000000,
        prizeStructure: {
            '6/6': 'Jackpot',
            '5/6+B': '2nd Prize',
            '5/6': '3rd Prize',
            '4/6': '4th Prize',
            '3/6': '5th Prize',
            '2/6+B': '6th Prize',
            '2/6': 'Free Play'
        }
    },
    dailygrand: {
        name: 'Daily Grand',
        balls: 49,
        pick: 5,
        hasBonus: true,
        bonusBalls: 7,
        drawDays: ['Monday', 'Thursday'],
        dataUrl: null,
        jackpotStart: 1000,
        isAnnuity: true,
        prizeStructure: {
            '5/5+GN': '$1,000/day for life',
            '5/5': '$25,000/year for life',
            '4/5+GN': '$1,000',
            '4/5': '$500',
            '3/5+GN': '$100',
            '3/5': '$20',
            '2/5+GN': '$10',
            '2/5': '$4',
            '1/5+GN': '$4'
        }
    },
    lottario: {
        name: 'Lottario',
        balls: 45,
        pick: 6,
        hasBonus: true,
        bonusBalls: 45,
        drawDays: ['Saturday'],
        dataUrl: null,
        jackpotStart: 250000,
        prizeStructure: {
            '6/6': 'Jackpot',
            '5/6+B': '2nd Prize',
            '5/6': '3rd Prize',
            '4/6+B': '4th Prize',
            '4/6': '5th Prize',
            '3/6+B': '6th Prize',
            '3/6': '7th Prize',
            '2/6+B': 'Free Play'
        }
    },
    ontario49: {
        name: 'Ontario 49',
        balls: 49,
        pick: 6,
        hasBonus: true,
        bonusBalls: 49,
        drawDays: ['Wednesday', 'Saturday'],
        dataUrl: null,
        jackpotStart: 2000000,
        prizeStructure: {
            '6/6': 'Jackpot',
            '5/6+B': '2nd Prize',
            '5/6': '3rd Prize',
            '4/6': '4th Prize',
            '3/6': '5th Prize',
            '2/6+B': '6th Prize'
        }
    }
};

// Generate sample historical data based on game configuration
// FIXED: Now generates data BACKWARDS from current date
function generateSampleData(gameKey, numDraws) {
    const game = GAMES[gameKey];
    const data = [];
    
    // Start from today and work backwards
    const today = new Date('2026-01-17'); // Current date
    
    // Calculate average days between draws based on draw days
    const drawsPerWeek = game.drawDays.length;
    const avgDaysBetweenDraws = 7 / drawsPerWeek;
    
    for (let i = 0; i < numDraws; i++) {
        const drawDate = new Date(today);
        drawDate.setDate(today.getDate() - Math.floor(i * avgDaysBetweenDraws));
        
        // Generate random numbers for the draw
        const numbers = generateRandomNumbers(game.balls, game.pick);
        const bonus = Math.floor(Math.random() * (game.hasBonus ? game.bonusBalls : 1)) + 1;
        
        data.push({
            date: drawDate.toISOString().split('T')[0],
            numbers: numbers.sort((a, b) => a - b),
            bonus: bonus,
            jackpot: game.jackpotStart + Math.floor(Math.random() * 50000000)
        });
    }
    
    return data; // Already in most recent first order
}

// Generate random unique numbers
function generateRandomNumbers(max, count) {
    const numbers = new Set();
    while (numbers.size < count) {
        numbers.add(Math.floor(Math.random() * max) + 1);
    }
    return Array.from(numbers);
}

// Sample Historical Data (comprehensive dataset)
// Data is generated from current date backwards
const HISTORICAL_DATA = {
    lottomax: generateSampleData('lottomax', 700),    // ~2.5 years of data
    lotto649: generateSampleData('lotto649', 700),    // ~2.5 years of data
    dailygrand: generateSampleData('dailygrand', 500), // ~2 years of data
    lottario: generateSampleData('lottario', 350),     // ~3.5 years of data (weekly)
    ontario49: generateSampleData('ontario49', 700)    // ~2.5 years of data
};

// Data Analysis Class
class LotteryDataAnalyzer {
    constructor(gameKey) {
        this.gameKey = gameKey;
        this.game = GAMES[gameKey];
        this.data = HISTORICAL_DATA[gameKey] || [];
    }
    
    // Get frequency of each number
    getNumberFrequency() {
        const frequency = {};
        for (let i = 1; i <= this.game.balls; i++) {
            frequency[i] = 0;
        }
        
        this.data.forEach(draw => {
            draw.numbers.forEach(num => {
                frequency[num]++;
            });
        });
        
        return frequency;
    }
    
    // Get bonus number frequency
    getBonusFrequency() {
        const frequency = {};
        const maxBonus = this.game.bonusBalls || this.game.balls;
        for (let i = 1; i <= maxBonus; i++) {
            frequency[i] = 0;
        }
        
        this.data.forEach(draw => {
            if (draw.bonus) {
                frequency[draw.bonus]++;
            }
        });
        
        return frequency;
    }
    
    // Get expected frequency per number
    getExpectedFrequency() {
        const totalDraws = this.data.length;
        const numbersPerDraw = this.game.pick;
        return (totalDraws * numbersPerDraw) / this.game.balls;
    }
    
    // Get hottest numbers (most frequent)
    getHotNumbers(count = 10) {
        const frequency = this.getNumberFrequency();
        return Object.entries(frequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, count)
            .map(([num, freq]) => ({ number: parseInt(num), frequency: freq }));
    }
    
    // Get coldest numbers (least frequent)
    getColdNumbers(count = 10) {
        const frequency = this.getNumberFrequency();
        return Object.entries(frequency)
            .sort((a, b) => a[1] - b[1])
            .slice(0, count)
            .map(([num, freq]) => ({ number: parseInt(num), frequency: freq }));
    }
    
    // Get overdue numbers (not drawn recently)
    getOverdueNumbers(count = 10) {
        const lastSeen = {};
        for (let i = 1; i <= this.game.balls; i++) {
            lastSeen[i] = this.data.length; // Default to very old
        }
        
        this.data.forEach((draw, index) => {
            draw.numbers.forEach(num => {
                if (lastSeen[num] > index) {
                    lastSeen[num] = index;
                }
            });
        });
        
        return Object.entries(lastSeen)
            .sort((a, b) => b[1] - a[1])
            .slice(0, count)
            .map(([num, drawsAgo]) => ({ number: parseInt(num), drawsAgo: drawsAgo }));
    }
    
    // Get common pairs
    getCommonPairs(count = 15) {
        const pairs = {};
        
        this.data.forEach(draw => {
            for (let i = 0; i < draw.numbers.length; i++) {
                for (let j = i + 1; j < draw.numbers.length; j++) {
                    const key = `${draw.numbers[i]}-${draw.numbers[j]}`;
                    pairs[key] = (pairs[key] || 0) + 1;
                }
            }
        });
        
        return Object.entries(pairs)
            .sort((a, b) => b[1] - a[1])
            .slice(0, count)
            .map(([pair, freq]) => ({
                numbers: pair.split('-').map(Number),
                frequency: freq
            }));
    }
    
    // Get consecutive pair frequency
    getConsecutivePairFrequency() {
        const consecutiveCounts = {};
        
        this.data.forEach(draw => {
            const sorted = [...draw.numbers].sort((a, b) => a - b);
            let consecutiveCount = 0;
            
            for (let i = 1; i < sorted.length; i++) {
                if (sorted[i] === sorted[i-1] + 1) {
                    consecutiveCount++;
                }
            }
            
            consecutiveCounts[consecutiveCount] = (consecutiveCounts[consecutiveCount] || 0) + 1;
        });
        
        return consecutiveCounts;
    }
    
    // Get odd/even distribution
    getOddEvenDistribution() {
        const distribution = {};
        
        this.data.forEach(draw => {
            const oddCount = draw.numbers.filter(n => n % 2 === 1).length;
            const evenCount = draw.numbers.length - oddCount;
            const key = `${oddCount}O/${evenCount}E`;
            distribution[key] = (distribution[key] || 0) + 1;
        });
        
        return distribution;
    }
    
    // Get sum range distribution
    getSumDistribution() {
        const sums = this.data.map(draw => {
            const sum = draw.numbers.reduce((a, b) => a + b, 0);
            return sum;
        });
        
        const min = Math.min(...sums);
        const max = Math.max(...sums);
        const avg = sums.reduce((a, b) => a + b, 0) / sums.length;
        
        // Create ranges
        const ranges = {};
        const rangeSize = 20;
        
        sums.forEach(sum => {
            const rangeStart = Math.floor(sum / rangeSize) * rangeSize;
            const rangeKey = `${rangeStart}-${rangeStart + rangeSize - 1}`;
            ranges[rangeKey] = (ranges[rangeKey] || 0) + 1;
        });
        
        return { min, max, avg, ranges };
    }
    
    // Get decade distribution (1-10, 11-20, etc.)
    getDecadeDistribution() {
        const decades = {};
        const decadeSize = 10;
        
        for (let i = 0; i < Math.ceil(this.game.balls / decadeSize); i++) {
            const start = i * decadeSize + 1;
            const end = Math.min((i + 1) * decadeSize, this.game.balls);
            decades[`${start}-${end}`] = 0;
        }
        
        this.data.forEach(draw => {
            draw.numbers.forEach(num => {
                const decadeIndex = Math.floor((num - 1) / decadeSize);
                const start = decadeIndex * decadeSize + 1;
                const end = Math.min((decadeIndex + 1) * decadeSize, this.game.balls);
                decades[`${start}-${end}`]++;
            });
        });
        
        return decades;
    }
    
    // Get delta (gap between consecutive numbers) analysis
    getDeltaAnalysis() {
        const deltas = [];
        
        this.data.forEach(draw => {
            const sorted = [...draw.numbers].sort((a, b) => a - b);
            for (let i = 1; i < sorted.length; i++) {
                deltas.push(sorted[i] - sorted[i-1]);
            }
        });
        
        const frequency = {};
        deltas.forEach(d => {
            frequency[d] = (frequency[d] || 0) + 1;
        });
        
        return frequency;
    }
    
    // Get recent draws
    getRecentDraws(count = 20) {
        return this.data.slice(0, count);
    }
    
    // Calculate number's deviation from expected
    getDeviationFromExpected() {
        const frequency = this.getNumberFrequency();
        const expected = this.getExpectedFrequency();
        const deviations = {};
        
        for (let num in frequency) {
            const deviation = ((frequency[num] - expected) / expected) * 100;
            deviations[num] = {
                frequency: frequency[num],
                expected: expected,
                deviation: deviation.toFixed(2)
            };
        }
        
        return deviations;
    }
    
    // Get pattern analysis
    getPatternAnalysis() {
        const patterns = {
            allOdd: 0,
            allEven: 0,
            balanced: 0,
            lowNumbers: 0,
            highNumbers: 0,
            hasConsecutive: 0,
            spreadOut: 0
        };
        
        const midPoint = this.game.balls / 2;
        
        this.data.forEach(draw => {
            const odds = draw.numbers.filter(n => n % 2 === 1).length;
            const lows = draw.numbers.filter(n => n <= midPoint).length;
            const sorted = [...draw.numbers].sort((a, b) => a - b);
            const hasConsec = sorted.some((n, i) => i > 0 && n === sorted[i-1] + 1);
            const spread = sorted[sorted.length - 1] - sorted[0];
            
            if (odds === this.game.pick) patterns.allOdd++;
            if (odds === 0) patterns.allEven++;
            if (Math.abs(odds - this.game.pick / 2) <= 1) patterns.balanced++;
            if (lows >= this.game.pick - 1) patterns.lowNumbers++;
            if (lows <= 1) patterns.highNumbers++;
            if (hasConsec) patterns.hasConsecutive++;
            if (spread >= this.game.balls * 0.7) patterns.spreadOut++;
        });
        
        return patterns;
    }
    
    // Get next draw date
    getNextDrawDate() {
        const today = new Date();
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        for (let i = 0; i <= 7; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(today.getDate() + i);
            const dayName = dayNames[checkDate.getDay()];
            
            if (this.game.drawDays.includes(dayName)) {
                // Check if it's still before the draw time (assume 10:30 PM)
                if (i === 0) {
                    const drawTime = new Date(checkDate);
                    drawTime.setHours(22, 30, 0, 0);
                    if (today > drawTime) continue;
                }
                return checkDate;
            }
        }
        
        return new Date();
    }
}

// Storage Manager
class StorageManager {
    static KEYS = {
        HISTORICAL_DATA: 'lottogenius_historical_data',
        PREDICTIONS: 'lottogenius_predictions',
        SETTINGS: 'lottogenius_settings',
        LAST_UPDATE: 'lottogenius_last_update'
    };
    
    static save(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Storage save error:', e);
            return false;
        }
    }
    
    static load(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Storage load error:', e);
            return null;
        }
    }
    
    static clear(key) {
        localStorage.removeItem(key);
    }
    
    static clearAll() {
        Object.values(this.KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
    }
}

// Data Fetcher (with CORS proxy for browser)
class DataFetcher {
    static CORS_PROXY = 'https://api.allorigins.win/raw?url=';
    
    static async fetchLottoMaxData() {
        try {
            // Try to fetch from PlayNow API
            const response = await fetch(
                `${this.CORS_PROXY}${encodeURIComponent('https://www.playnow.com/services2/lotto/draw/history/LMAX/50')}`
            );
            if (response.ok) {
                return await response.json();
            }
        } catch (e) {
            console.warn('Could not fetch live data, using cached data');
        }
        return null;
    }
    
    static async fetchLottoNumbers(game) {
        try {
            // Try lottonumbers.com API
            const urls = {
                lottomax: 'https://ca.lottonumbers.com/lotto-max/past-numbers',
                lotto649: 'https://ca.lottonumbers.com/lotto-649/past-numbers'
            };
            
            if (urls[game]) {
                const response = await fetch(`${this.CORS_PROXY}${encodeURIComponent(urls[game])}`);
                if (response.ok) {
                    return await response.text();
                }
            }
        } catch (e) {
            console.warn('Could not fetch from lottonumbers.com');
        }
        return null;
    }
    
    static async fetchOLGData(game) {
        try {
            // OLG past results page
            const urls = {
                lottomax: 'https://www.olg.ca/en/lottery/play-lotto-max-encore/past-results.html',
                lotto649: 'https://www.olg.ca/en/lottery/play-lotto-649-encore/past-results.html'
            };
            
            if (urls[game]) {
                const response = await fetch(`${this.CORS_PROXY}${encodeURIComponent(urls[game])}`);
                if (response.ok) {
                    return await response.text();
                }
            }
        } catch (e) {
            console.warn('Could not fetch from OLG');
        }
        return null;
    }
}

// Export for use in other modules
window.GAMES = GAMES;
window.HISTORICAL_DATA = HISTORICAL_DATA;
window.LotteryDataAnalyzer = LotteryDataAnalyzer;
window.StorageManager = StorageManager;
window.DataFetcher = DataFetcher;
