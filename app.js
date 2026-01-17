/**
 * LottoGenius Pro - Main Application
 * Handles UI interactions, data visualization, and state management
 */

class LottoGeniusApp {
    constructor() {
        this.currentGame = 'lottomax';
        this.analyzer = new LotteryDataAnalyzer(this.currentGame);
        this.engine = new PredictionEngine(this.currentGame);
        this.charts = {};
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadData();
        this.updateUI();
        this.updateLastUpdateTime();
    }
    
    // =========================================
    // EVENT LISTENERS
    // =========================================
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchSection(e.target.dataset.section));
        });
        
        // Game selection
        document.querySelectorAll('.game-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchGame(e.target.closest('.game-btn').dataset.game));
        });
        
        // Refresh data
        document.getElementById('refreshData').addEventListener('click', () => this.refreshData());
        
        // Generate predictions
        document.getElementById('generateNewPredictions').addEventListener('click', () => this.generateDashboardPredictions());
        
        // Run prediction engine
        document.getElementById('runPrediction').addEventListener('click', () => this.runPredictionEngine());
        
        // Settings sliders
        document.querySelectorAll('.slider-item input[type="range"]').forEach(slider => {
            slider.addEventListener('input', (e) => {
                e.target.nextElementSibling.textContent = e.target.value + '%';
                this.updateAlgorithmWeights();
            });
        });
        
        // Export buttons
        document.getElementById('exportData')?.addEventListener('click', () => this.exportAnalysisData());
        document.getElementById('exportPredictions')?.addEventListener('click', () => this.exportPredictions());
    }
    
    // =========================================
    // NAVIGATION
    // =========================================
    switchSection(sectionId) {
        // Update nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.section === sectionId);
        });
        
        // Update sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.toggle('active', section.id === sectionId);
        });
        
        // Initialize section-specific content
        if (sectionId === 'analysis') {
            this.updateAnalysisSection();
        } else if (sectionId === 'predictions') {
            this.updatePredictionsSection();
        }
    }
    
    switchGame(gameKey) {
        this.currentGame = gameKey;
        this.analyzer = new LotteryDataAnalyzer(gameKey);
        this.engine = new PredictionEngine(gameKey);
        
        // Update game buttons
        document.querySelectorAll('.game-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.game === gameKey);
        });
        
        // Update UI
        this.updateUI();
    }
    
    // =========================================
    // DATA LOADING
    // =========================================
    async loadData() {
        this.showLoading(true);
        
        try {
            // Try to fetch live data
            const liveData = await DataFetcher.fetchLottoMaxData();
            if (liveData) {
                console.log('Live data fetched:', liveData);
            }
        } catch (e) {
            console.warn('Using cached data:', e);
        }
        
        this.showLoading(false);
    }
    
    async refreshData() {
        this.showLoading(true);
        
        try {
            await this.loadData();
            this.updateUI();
            this.updateLastUpdateTime();
        } catch (e) {
            console.error('Refresh failed:', e);
        }
        
        this.showLoading(false);
    }
    
    // =========================================
    // UI UPDATES
    // =========================================
    updateUI() {
        this.updateGameName();
        this.updateNextDrawDate();
        this.updateQuickStats();
        this.updatePredictions();
        this.updateFrequencyChart();
        this.updateRecentDraws();
    }
    
    updateGameName() {
        const gameName = GAMES[this.currentGame].name;
        document.getElementById('currentGameName').textContent = gameName;
    }
    
    updateNextDrawDate() {
        const nextDraw = this.analyzer.getNextDrawDate();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        document.getElementById('nextDrawDate').textContent = nextDraw.toLocaleDateString('en-US', options);
    }
    
    updateQuickStats() {
        const hot = this.analyzer.getHotNumbers(1)[0];
        const cold = this.analyzer.getColdNumbers(1)[0];
        const overdue = this.analyzer.getOverdueNumbers(1)[0];
        const totalDraws = HISTORICAL_DATA[this.currentGame].length;
        
        document.getElementById('hottestNumber').textContent = hot.number;
        document.getElementById('hottestDetail').textContent = `${hot.frequency} draws`;
        
        document.getElementById('coldestNumber').textContent = cold.number;
        document.getElementById('coldestDetail').textContent = `${cold.frequency} draws`;
        
        document.getElementById('overdueNumber').textContent = overdue.number;
        document.getElementById('overdueDetail').textContent = `${overdue.drawsAgo} draws ago`;
        
        document.getElementById('totalDraws').textContent = totalDraws;
    }
    
    updatePredictions() {
        // Primary set (hybrid)
        const primarySet = this.engine.hybridPrediction();
        this.displayNumbers('primaryNumbers', primarySet);
        document.getElementById('primaryScore').textContent = `Score: ${this.engine.calculateConfidence(primarySet)}%`;
        
        // Hot numbers set
        const hotSet = this.engine.frequencyBasedPrediction();
        this.displayNumbers('hotNumbers', hotSet);
        document.getElementById('hotScore').textContent = `Score: ${this.engine.calculateConfidence(hotSet)}%`;
        
        // Overdue numbers set
        const overdueSet = this.engine.overdueBasedPrediction();
        this.displayNumbers('overdueNumbers', overdueSet);
        document.getElementById('overdueScore').textContent = `Score: ${this.engine.calculateConfidence(overdueSet)}%`;
        
        // Balanced set
        const balancedSet = this.engine.statisticalEquilibriumPrediction();
        this.displayNumbers('balancedNumbers', balancedSet);
        document.getElementById('balancedScore').textContent = `Score: ${this.engine.calculateConfidence(balancedSet)}%`;
        
        // Update confidence meter
        const avgConfidence = (
            this.engine.calculateConfidence(primarySet) +
            this.engine.calculateConfidence(hotSet) +
            this.engine.calculateConfidence(overdueSet) +
            this.engine.calculateConfidence(balancedSet)
        ) / 4;
        
        document.getElementById('confidenceFill').style.width = `${avgConfidence}%`;
        document.getElementById('confidenceValue').textContent = `${Math.round(avgConfidence)}%`;
    }
    
    displayNumbers(containerId, numbers) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        
        numbers.forEach((num, idx) => {
            const ball = document.createElement('div');
            ball.className = 'number-ball';
            ball.textContent = num;
            
            // Add tooltip
            ball.title = this.getNumberTooltip(num);
            
            container.appendChild(ball);
        });
    }
    
    getNumberTooltip(num) {
        const frequency = this.analyzer.getNumberFrequency()[num];
        const expected = this.analyzer.getExpectedFrequency();
        const deviation = ((frequency - expected) / expected * 100).toFixed(1);
        return `#${num}: ${frequency} draws (${deviation > 0 ? '+' : ''}${deviation}% from expected)`;
    }
    
    generateDashboardPredictions() {
        this.showLoading(true);
        
        setTimeout(() => {
            this.updatePredictions();
            this.showLoading(false);
        }, 500);
    }
    
    // =========================================
    // CHARTS
    // =========================================
    updateFrequencyChart() {
        const frequency = this.analyzer.getNumberFrequency();
        const expected = this.analyzer.getExpectedFrequency();
        const labels = Object.keys(frequency);
        const data = Object.values(frequency);
        
        const ctx = document.getElementById('frequencyChart').getContext('2d');
        
        if (this.charts.frequency) {
            this.charts.frequency.destroy();
        }
        
        this.charts.frequency = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Frequency',
                    data: data,
                    backgroundColor: data.map(v => {
                        const deviation = (v - expected) / expected;
                        if (deviation > 0.1) return 'rgba(255, 71, 87, 0.7)';
                        if (deviation < -0.1) return 'rgba(0, 210, 211, 0.7)';
                        return 'rgba(102, 126, 234, 0.7)';
                    }),
                    borderWidth: 0
                }, {
                    label: 'Expected',
                    data: Array(labels.length).fill(expected),
                    type: 'line',
                    borderColor: 'rgba(255, 206, 86, 1)',
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        labels: { color: '#a0a0b0' }
                    }
                },
                scales: {
                    x: {
                        ticks: { color: '#a0a0b0' },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    },
                    y: {
                        ticks: { color: '#a0a0b0' },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    }
                }
            }
        });
    }
    
    // =========================================
    // RECENT DRAWS
    // =========================================
    updateRecentDraws() {
        const draws = this.analyzer.getRecentDraws(15);
        const tbody = document.getElementById('recentDrawsBody');
        tbody.innerHTML = '';
        
        draws.forEach(draw => {
            const row = document.createElement('tr');
            
            const sum = draw.numbers.reduce((a, b) => a + b, 0);
            const odds = draw.numbers.filter(n => n % 2 === 1).length;
            const evens = draw.numbers.length - odds;
            
            row.innerHTML = `
                <td>${draw.date}</td>
                <td>
                    <div class="draw-numbers">
                        ${draw.numbers.map(n => `<span class="draw-number">${n}</span>`).join('')}
                    </div>
                </td>
                <td><span class="draw-number bonus">${draw.bonus}</span></td>
                <td>${sum}</td>
                <td>${odds}O/${evens}E</td>
            `;
            
            tbody.appendChild(row);
        });
    }
    
    // =========================================
    // ANALYSIS SECTION
    // =========================================
    updateAnalysisSection() {
        this.updateHeatmap();
        this.updateCommonPairs();
        this.updateOddEvenChart();
        this.updateSumRangeChart();
        this.updateDecadeChart();
        this.updateGapAnalysis();
        this.updatePatternsList();
        this.updateConsecutiveChart();
    }
    
    updateHeatmap() {
        const frequency = this.analyzer.getNumberFrequency();
        const expected = this.analyzer.getExpectedFrequency();
        const container = document.getElementById('frequencyHeatmap');
        container.innerHTML = '';
        
        for (let i = 1; i <= GAMES[this.currentGame].balls; i++) {
            const cell = document.createElement('div');
            cell.className = 'heatmap-cell';
            cell.textContent = i;
            
            const deviation = (frequency[i] - expected) / expected * 100;
            
            if (deviation > 10) cell.classList.add('hot');
            else if (deviation > 5) cell.classList.add('warm');
            else if (deviation > -5) cell.classList.add('neutral');
            else if (deviation > -10) cell.classList.add('cool');
            else cell.classList.add('cold');
            
            cell.title = `#${i}: ${frequency[i]} draws (${deviation > 0 ? '+' : ''}${deviation.toFixed(1)}%)`;
            
            container.appendChild(cell);
        }
    }
    
    updateCommonPairs() {
        const pairs = this.analyzer.getCommonPairs(12);
        const container = document.getElementById('commonPairs');
        container.innerHTML = '';
        
        pairs.forEach(({ numbers, frequency }) => {
            const item = document.createElement('div');
            item.className = 'pair-item';
            item.innerHTML = `
                <div class="pair-numbers">
                    <span class="draw-number">${numbers[0]}</span>
                    <span class="draw-number">${numbers[1]}</span>
                </div>
                <span class="pair-count">${frequency} times</span>
            `;
            container.appendChild(item);
        });
    }
    
    updateOddEvenChart() {
        const distribution = this.analyzer.getOddEvenDistribution();
        const ctx = document.getElementById('oddEvenChart').getContext('2d');
        
        if (this.charts.oddEven) {
            this.charts.oddEven.destroy();
        }
        
        this.charts.oddEven = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(distribution),
                datasets: [{
                    data: Object.values(distribution),
                    backgroundColor: [
                        'rgba(102, 126, 234, 0.8)',
                        'rgba(118, 75, 162, 0.8)',
                        'rgba(255, 71, 87, 0.8)',
                        'rgba(0, 210, 211, 0.8)',
                        'rgba(255, 206, 86, 0.8)',
                        'rgba(75, 192, 192, 0.8)',
                        'rgba(153, 102, 255, 0.8)',
                        'rgba(255, 159, 64, 0.8)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { color: '#a0a0b0' }
                    }
                }
            }
        });
    }
    
    updateSumRangeChart() {
        const sumDist = this.analyzer.getSumDistribution();
        const ctx = document.getElementById('sumRangeChart').getContext('2d');
        
        if (this.charts.sumRange) {
            this.charts.sumRange.destroy();
        }
        
        this.charts.sumRange = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(sumDist.ranges),
                datasets: [{
                    label: 'Draws',
                    data: Object.values(sumDist.ranges),
                    backgroundColor: 'rgba(102, 126, 234, 0.7)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        ticks: { color: '#a0a0b0', maxRotation: 45 },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    },
                    y: {
                        ticks: { color: '#a0a0b0' },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    }
                }
            }
        });
    }
    
    updateDecadeChart() {
        const decades = this.analyzer.getDecadeDistribution();
        const ctx = document.getElementById('decadeChart').getContext('2d');
        
        if (this.charts.decade) {
            this.charts.decade.destroy();
        }
        
        this.charts.decade = new Chart(ctx, {
            type: 'polarArea',
            data: {
                labels: Object.keys(decades),
                datasets: [{
                    data: Object.values(decades),
                    backgroundColor: [
                        'rgba(255, 71, 87, 0.7)',
                        'rgba(255, 159, 64, 0.7)',
                        'rgba(255, 206, 86, 0.7)',
                        'rgba(75, 192, 192, 0.7)',
                        'rgba(102, 126, 234, 0.7)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { color: '#a0a0b0' }
                    }
                },
                scales: {
                    r: {
                        ticks: { color: '#a0a0b0' },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    }
                }
            }
        });
    }
    
    updateConsecutiveChart() {
        const consecutive = this.analyzer.getConsecutivePairFrequency();
        const ctx = document.getElementById('consecutiveChart').getContext('2d');
        
        if (this.charts.consecutive) {
            this.charts.consecutive.destroy();
        }
        
        this.charts.consecutive = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(consecutive).map(k => `${k} pairs`),
                datasets: [{
                    label: 'Draws',
                    data: Object.values(consecutive),
                    backgroundColor: 'rgba(118, 75, 162, 0.7)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        ticks: { color: '#a0a0b0' },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    },
                    y: {
                        ticks: { color: '#a0a0b0' },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    }
                }
            }
        });
    }
    
    updateGapAnalysis() {
        const overdue = this.analyzer.getOverdueNumbers(GAMES[this.currentGame].balls);
        const container = document.getElementById('gapAnalysis');
        container.innerHTML = '';
        
        overdue.slice(0, 30).forEach(({ number, drawsAgo }) => {
            const item = document.createElement('div');
            item.className = 'gap-item';
            
            // Color based on how overdue
            const expected = GAMES[this.currentGame].balls / GAMES[this.currentGame].pick;
            const ratio = drawsAgo / expected;
            let color = '#667eea';
            if (ratio > 2) color = '#ff4757';
            else if (ratio > 1.5) color = '#f59e0b';
            else if (ratio < 0.5) color = '#10b981';
            
            item.innerHTML = `
                <div class="gap-number" style="color: ${color}">${number}</div>
                <div class="gap-days">${drawsAgo} ago</div>
            `;
            
            container.appendChild(item);
        });
    }
    
    updatePatternsList() {
        const patterns = this.analyzer.getPatternAnalysis();
        const total = HISTORICAL_DATA[this.currentGame].length;
        const container = document.getElementById('patternsList');
        container.innerHTML = '';
        
        const patternNames = {
            allOdd: 'All Odd Numbers',
            allEven: 'All Even Numbers',
            balanced: 'Balanced Odd/Even',
            lowNumbers: 'Mostly Low Numbers',
            highNumbers: 'Mostly High Numbers',
            hasConsecutive: 'Has Consecutive',
            spreadOut: 'Wide Spread'
        };
        
        for (let key in patterns) {
            const item = document.createElement('div');
            item.className = 'pattern-item';
            const percentage = ((patterns[key] / total) * 100).toFixed(1);
            item.innerHTML = `
                <span class="pattern-name">${patternNames[key]}</span>
                <span class="pattern-frequency">${percentage}%</span>
            `;
            container.appendChild(item);
        }
    }
    
    // =========================================
    // PREDICTIONS SECTION
    // =========================================
    updatePredictionsSection() {
        // Section is ready for predictions
    }
    
    runPredictionEngine() {
        const numSets = parseInt(document.getElementById('numSets').value) || 5;
        const algorithm = document.getElementById('algorithmMix').value;
        
        const constraints = {
            balanceOddEven: document.getElementById('balanceOddEven').checked,
            balanceHighLow: document.getElementById('balanceHighLow').checked,
            includeConsecutive: document.getElementById('includeConsecutive').checked,
            avoidRepeats: document.getElementById('avoidRepeats').checked
        };
        
        this.showLoading(true);
        
        setTimeout(() => {
            const sets = this.engine.generateMultipleSets(numSets, algorithm, constraints);
            this.displayGeneratedPredictions(sets);
            this.savePredictionHistory(sets);
            this.showLoading(false);
        }, 1000);
    }
    
    displayGeneratedPredictions(sets) {
        const container = document.getElementById('generatedPredictions');
        container.innerHTML = '';
        
        sets.forEach((set, idx) => {
            const div = document.createElement('div');
            div.className = 'generated-set';
            div.innerHTML = `
                <div class="generated-set-header">
                    <span class="set-number">Set #${idx + 1}</span>
                    <span class="set-algorithm">${set.algorithm} | Confidence: ${set.confidence}%</span>
                </div>
                <div class="numbers-display">
                    ${set.numbers.map(n => `<div class="number-ball">${n}</div>`).join('')}
                </div>
            `;
            container.appendChild(div);
        });
    }
    
    savePredictionHistory(sets) {
        const history = StorageManager.load(StorageManager.KEYS.PREDICTIONS) || [];
        const nextDraw = this.analyzer.getNextDrawDate();
        
        sets.forEach(set => {
            history.unshift({
                dateGenerated: new Date().toISOString(),
                forDraw: nextDraw.toISOString().split('T')[0],
                game: this.currentGame,
                numbers: set.numbers,
                algorithm: set.algorithm,
                confidence: set.confidence,
                actual: null,
                matches: null
            });
        });
        
        // Keep only last 100 predictions
        StorageManager.save(StorageManager.KEYS.PREDICTIONS, history.slice(0, 100));
        this.updatePredictionHistoryTable();
    }
    
    updatePredictionHistoryTable() {
        const history = StorageManager.load(StorageManager.KEYS.PREDICTIONS) || [];
        const tbody = document.getElementById('predictionHistoryBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        history.slice(0, 20).forEach(entry => {
            if (entry.game !== this.currentGame) return;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(entry.dateGenerated).toLocaleDateString()}</td>
                <td>${entry.forDraw}</td>
                <td>${entry.numbers.join(', ')}</td>
                <td>${entry.actual ? entry.actual.join(', ') : '-'}</td>
                <td>${entry.matches !== null ? entry.matches : '-'}</td>
                <td>${entry.algorithm}</td>
            `;
            tbody.appendChild(row);
        });
    }
    
    // =========================================
    // ALGORITHM WEIGHTS
    // =========================================
    updateAlgorithmWeights() {
        const weights = {
            frequency: parseInt(document.getElementById('weightFrequency')?.value || 25) / 100,
            overdue: parseInt(document.getElementById('weightOverdue')?.value || 25) / 100,
            pattern: parseInt(document.getElementById('weightPattern')?.value || 25) / 100,
            statistical: parseInt(document.getElementById('weightStatistical')?.value || 25) / 100
        };
        
        this.engine.setWeights(weights);
    }
    
    // =========================================
    // EXPORT FUNCTIONS
    // =========================================
    exportAnalysisData() {
        const data = {
            game: this.currentGame,
            exportDate: new Date().toISOString(),
            frequency: this.analyzer.getNumberFrequency(),
            hotNumbers: this.analyzer.getHotNumbers(15),
            coldNumbers: this.analyzer.getColdNumbers(15),
            overdueNumbers: this.analyzer.getOverdueNumbers(15),
            commonPairs: this.analyzer.getCommonPairs(20),
            oddEvenDistribution: this.analyzer.getOddEvenDistribution(),
            sumDistribution: this.analyzer.getSumDistribution(),
            patterns: this.analyzer.getPatternAnalysis()
        };
        
        this.downloadJSON(data, `lottery-analysis-${this.currentGame}-${Date.now()}.json`);
    }
    
    exportPredictions() {
        const history = StorageManager.load(StorageManager.KEYS.PREDICTIONS) || [];
        const filtered = history.filter(h => h.game === this.currentGame);
        
        this.downloadJSON(filtered, `lottery-predictions-${this.currentGame}-${Date.now()}.json`);
    }
    
    downloadJSON(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    // =========================================
    // UTILITY
    // =========================================
    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.toggle('active', show);
        }
    }
    
    updateLastUpdateTime() {
        const now = new Date();
        document.getElementById('lastUpdateTime').textContent = 
            now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new LottoGeniusApp();
});
