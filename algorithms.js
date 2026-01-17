/**
 * LottoGenius Pro - Advanced Prediction Algorithms
 * Collection of mathematical algorithms for lottery number prediction
 */

class PredictionEngine {
    constructor(gameKey) {
        this.gameKey = gameKey;
        this.game = GAMES[gameKey];
        this.analyzer = new LotteryDataAnalyzer(gameKey);
        this.weights = {
            frequency: 0.25,
            overdue: 0.25,
            pattern: 0.25,
            statistical: 0.25
        };
    }
    
    setWeights(weights) {
        this.weights = { ...this.weights, ...weights };
    }
    
    // =========================================
    // ALGORITHM 1: Frequency-Based Prediction
    // =========================================
    frequencyBasedPrediction() {
        const frequency = this.analyzer.getNumberFrequency();
        const totalFreq = Object.values(frequency).reduce((a, b) => a + b, 0);
        
        // Calculate probability weights
        const weights = {};
        for (let num in frequency) {
            weights[num] = frequency[num] / totalFreq;
        }
        
        // Weighted random selection
        return this.weightedSelection(weights, this.game.pick);
    }
    
    // =========================================
    // ALGORITHM 2: Overdue-Based Prediction
    // =========================================
    overdueBasedPrediction() {
        const overdue = this.analyzer.getOverdueNumbers(this.game.balls);
        const frequency = this.analyzer.getNumberFrequency();
        const expected = this.analyzer.getExpectedFrequency();
        
        // Calculate overdue score for each number
        const scores = {};
        const data = HISTORICAL_DATA[this.gameKey];
        
        // Find last seen index for each number
        const lastSeen = {};
        for (let i = 1; i <= this.game.balls; i++) {
            lastSeen[i] = data.length;
        }
        
        data.forEach((draw, idx) => {
            draw.numbers.forEach(num => {
                if (lastSeen[num] > idx) {
                    lastSeen[num] = idx;
                }
            });
        });
        
        // Calculate expected interval
        const expectedInterval = this.game.balls / this.game.pick;
        
        for (let i = 1; i <= this.game.balls; i++) {
            const drawsSince = lastSeen[i];
            const overdueRatio = drawsSince / expectedInterval;
            scores[i] = Math.min(overdueRatio, 3); // Cap at 3x overdue
        }
        
        return this.weightedSelection(scores, this.game.pick);
    }
    
    // =========================================
    // ALGORITHM 3: Pattern-Based Prediction
    // =========================================
    patternBasedPrediction() {
        const pairs = this.analyzer.getCommonPairs(30);
        const frequency = this.analyzer.getNumberFrequency();
        
        // Build adjacency scores from common pairs
        const pairScores = {};
        pairs.forEach(({ numbers, frequency: freq }) => {
            const [a, b] = numbers;
            pairScores[`${a}-${b}`] = freq;
            pairScores[`${b}-${a}`] = freq;
        });
        
        // Start with most common number
        const sorted = Object.entries(frequency).sort((a, b) => b[1] - a[1]);
        const selected = [parseInt(sorted[0][0])];
        
        // Greedy selection based on pair frequency
        while (selected.length < this.game.pick) {
            let bestNext = null;
            let bestScore = -1;
            
            for (let num = 1; num <= this.game.balls; num++) {
                if (selected.includes(num)) continue;
                
                let score = frequency[num];
                selected.forEach(sel => {
                    const key = `${sel}-${num}`;
                    score += (pairScores[key] || 0) * 2;
                });
                
                if (score > bestScore) {
                    bestScore = score;
                    bestNext = num;
                }
            }
            
            if (bestNext) selected.push(bestNext);
        }
        
        return selected.sort((a, b) => a - b);
    }
    
    // =========================================
    // ALGORITHM 4: Statistical Equilibrium
    // =========================================
    statisticalEquilibriumPrediction() {
        const oddEven = this.analyzer.getOddEvenDistribution();
        const sumDist = this.analyzer.getSumDistribution();
        const decades = this.analyzer.getDecadeDistribution();
        
        // Find most common patterns
        const sortedOddEven = Object.entries(oddEven).sort((a, b) => b[1] - a[1]);
        const targetOddEven = sortedOddEven[0][0]; // e.g., "3O/4E"
        const targetOdds = parseInt(targetOddEven.split('O')[0]);
        
        // Target sum range
        const targetSum = sumDist.avg;
        const sumTolerance = 30;
        
        // Generate combinations that match criteria
        const maxAttempts = 1000;
        let attempts = 0;
        
        while (attempts < maxAttempts) {
            const candidate = this.generateRandomNumbers();
            const odds = candidate.filter(n => n % 2 === 1).length;
            const sum = candidate.reduce((a, b) => a + b, 0);
            
            // Check if candidate matches target profile
            if (Math.abs(odds - targetOdds) <= 1 && 
                Math.abs(sum - targetSum) <= sumTolerance) {
                return candidate.sort((a, b) => a - b);
            }
            
            attempts++;
        }
        
        // Fallback to frequency-based
        return this.frequencyBasedPrediction();
    }
    
    // =========================================
    // ALGORITHM 5: Wheeling System
    // =========================================
    wheelingSystemPrediction(keyNumbers = null) {
        if (!keyNumbers) {
            // Select key numbers based on hot numbers
            const hot = this.analyzer.getHotNumbers(this.game.pick + 3);
            keyNumbers = hot.map(h => h.number);
        }
        
        // Generate wheel combinations
        const combinations = this.generateCombinations(keyNumbers, this.game.pick);
        
        // Score each combination
        const frequency = this.analyzer.getNumberFrequency();
        const scores = combinations.map(combo => ({
            numbers: combo,
            score: combo.reduce((sum, num) => sum + frequency[num], 0)
        }));
        
        // Return highest scored combination
        scores.sort((a, b) => b.score - a.score);
        return scores[0].numbers.sort((a, b) => a - b);
    }
    
    // =========================================
    // ALGORITHM 6: Delta System
    // =========================================
    deltaSystemPrediction() {
        const deltaFreq = this.analyzer.getDeltaAnalysis();
        
        // Find most common deltas
        const sortedDeltas = Object.entries(deltaFreq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([d, _]) => parseInt(d));
        
        // Generate starting number
        const start = Math.floor(Math.random() * 15) + 1;
        const numbers = [start];
        
        // Build sequence using common deltas
        while (numbers.length < this.game.pick) {
            const delta = sortedDeltas[Math.floor(Math.random() * sortedDeltas.length)];
            const next = numbers[numbers.length - 1] + delta;
            
            if (next <= this.game.balls && !numbers.includes(next)) {
                numbers.push(next);
            } else if (numbers.length < this.game.pick) {
                // Try a different approach
                const altNext = numbers[numbers.length - 1] + Math.floor(Math.random() * 10) + 1;
                if (altNext <= this.game.balls && !numbers.includes(altNext)) {
                    numbers.push(altNext);
                }
            }
        }
        
        // If we couldn't complete the sequence, fill with random
        while (numbers.length < this.game.pick) {
            const rand = Math.floor(Math.random() * this.game.balls) + 1;
            if (!numbers.includes(rand)) {
                numbers.push(rand);
            }
        }
        
        return numbers.sort((a, b) => a - b);
    }
    
    // =========================================
    // ALGORITHM 7: Markov Chain
    // =========================================
    markovChainPrediction() {
        const data = HISTORICAL_DATA[this.gameKey];
        
        // Build transition matrix
        const transitions = {};
        for (let i = 1; i <= this.game.balls; i++) {
            transitions[i] = {};
            for (let j = 1; j <= this.game.balls; j++) {
                transitions[i][j] = 0;
            }
        }
        
        // Count transitions between consecutive draws
        for (let i = 1; i < data.length; i++) {
            const prevNumbers = data[i].numbers;
            const currNumbers = data[i - 1].numbers;
            
            prevNumbers.forEach(prev => {
                currNumbers.forEach(curr => {
                    transitions[prev][curr]++;
                });
            });
        }
        
        // Normalize to probabilities
        for (let from in transitions) {
            const total = Object.values(transitions[from]).reduce((a, b) => a + b, 0);
            if (total > 0) {
                for (let to in transitions[from]) {
                    transitions[from][to] /= total;
                }
            }
        }
        
        // Generate prediction using transition probabilities
        const lastDraw = data[0].numbers;
        const scores = {};
        
        for (let i = 1; i <= this.game.balls; i++) {
            scores[i] = 0;
            lastDraw.forEach(prev => {
                scores[i] += transitions[prev][i];
            });
        }
        
        return this.weightedSelection(scores, this.game.pick);
    }
    
    // =========================================
    // ALGORITHM 8: Genetic Algorithm
    // =========================================
    geneticAlgorithmPrediction(generations = 50, populationSize = 100) {
        // Initialize population
        let population = [];
        for (let i = 0; i < populationSize; i++) {
            population.push(this.generateRandomNumbers());
        }
        
        // Evolution loop
        for (let gen = 0; gen < generations; gen++) {
            // Evaluate fitness
            const scored = population.map(individual => ({
                numbers: individual,
                fitness: this.evaluateFitness(individual)
            }));
            
            scored.sort((a, b) => b.fitness - a.fitness);
            
            // Selection - keep top 20%
            const elite = scored.slice(0, Math.floor(populationSize * 0.2));
            
            // Create new population
            const newPopulation = elite.map(e => e.numbers);
            
            while (newPopulation.length < populationSize) {
                // Select parents
                const parent1 = elite[Math.floor(Math.random() * elite.length)].numbers;
                const parent2 = elite[Math.floor(Math.random() * elite.length)].numbers;
                
                // Crossover
                const child = this.crossover(parent1, parent2);
                
                // Mutation
                const mutated = this.mutate(child, 0.1);
                
                newPopulation.push(mutated);
            }
            
            population = newPopulation;
        }
        
        // Return best individual
        const final = population.map(individual => ({
            numbers: individual,
            fitness: this.evaluateFitness(individual)
        }));
        
        final.sort((a, b) => b.fitness - a.fitness);
        return final[0].numbers.sort((a, b) => a - b);
    }
    
    // Fitness evaluation for genetic algorithm
    evaluateFitness(numbers) {
        let fitness = 0;
        const frequency = this.analyzer.getNumberFrequency();
        const pairs = this.analyzer.getCommonPairs(50);
        
        // Frequency bonus
        numbers.forEach(num => {
            fitness += frequency[num] * 0.5;
        });
        
        // Pair bonus
        for (let i = 0; i < numbers.length; i++) {
            for (let j = i + 1; j < numbers.length; j++) {
                const pairMatch = pairs.find(p => 
                    (p.numbers[0] === numbers[i] && p.numbers[1] === numbers[j]) ||
                    (p.numbers[0] === numbers[j] && p.numbers[1] === numbers[i])
                );
                if (pairMatch) {
                    fitness += pairMatch.frequency * 0.3;
                }
            }
        }
        
        // Balance bonus (odd/even)
        const odds = numbers.filter(n => n % 2 === 1).length;
        const evenCount = numbers.length - odds;
        fitness += (1 - Math.abs(odds - evenCount) / numbers.length) * 10;
        
        // Spread bonus
        const sorted = [...numbers].sort((a, b) => a - b);
        const spread = sorted[sorted.length - 1] - sorted[0];
        fitness += (spread / this.game.balls) * 5;
        
        return fitness;
    }
    
    // Crossover for genetic algorithm
    crossover(parent1, parent2) {
        const child = new Set();
        const crossPoint = Math.floor(this.game.pick / 2);
        
        // Take first half from parent1
        for (let i = 0; i < crossPoint && child.size < this.game.pick; i++) {
            child.add(parent1[i]);
        }
        
        // Fill rest from parent2
        for (let i = 0; i < parent2.length && child.size < this.game.pick; i++) {
            if (!child.has(parent2[i])) {
                child.add(parent2[i]);
            }
        }
        
        // Fill remaining with random
        while (child.size < this.game.pick) {
            const rand = Math.floor(Math.random() * this.game.balls) + 1;
            child.add(rand);
        }
        
        return Array.from(child);
    }
    
    // Mutation for genetic algorithm
    mutate(numbers, rate) {
        const mutated = [...numbers];
        
        for (let i = 0; i < mutated.length; i++) {
            if (Math.random() < rate) {
                let newNum;
                do {
                    newNum = Math.floor(Math.random() * this.game.balls) + 1;
                } while (mutated.includes(newNum));
                mutated[i] = newNum;
            }
        }
        
        return mutated;
    }
    
    // =========================================
    // ALGORITHM 9: Monte Carlo Simulation
    // =========================================
    monteCarloSimulation(iterations = 10000) {
        const frequency = this.analyzer.getNumberFrequency();
        const totalFreq = Object.values(frequency).reduce((a, b) => a + b, 0);
        
        // Build cumulative distribution
        const cdf = [];
        let cumulative = 0;
        for (let i = 1; i <= this.game.balls; i++) {
            cumulative += frequency[i] / totalFreq;
            cdf.push({ number: i, cumulative });
        }
        
        // Run simulations
        const combinationCounts = {};
        
        for (let iter = 0; iter < iterations; iter++) {
            const sample = [];
            while (sample.length < this.game.pick) {
                const rand = Math.random();
                const num = cdf.find(c => c.cumulative >= rand).number;
                if (!sample.includes(num)) {
                    sample.push(num);
                }
            }
            
            sample.sort((a, b) => a - b);
            const key = sample.join('-');
            combinationCounts[key] = (combinationCounts[key] || 0) + 1;
        }
        
        // Find most common combination
        const sorted = Object.entries(combinationCounts).sort((a, b) => b[1] - a[1]);
        return sorted[0][0].split('-').map(Number);
    }
    
    // =========================================
    // ALGORITHM 10: Fourier Analysis (Cyclical)
    // =========================================
    fourierAnalysisPrediction() {
        const data = HISTORICAL_DATA[this.gameKey];
        const frequency = this.analyzer.getNumberFrequency();
        
        // Calculate cyclical scores for each number
        const cycles = {};
        
        for (let num = 1; num <= this.game.balls; num++) {
            // Find all positions where this number appeared
            const positions = [];
            data.forEach((draw, idx) => {
                if (draw.numbers.includes(num)) {
                    positions.push(idx);
                }
            });
            
            if (positions.length < 2) {
                cycles[num] = frequency[num];
                continue;
            }
            
            // Calculate gaps between appearances
            const gaps = [];
            for (let i = 1; i < positions.length; i++) {
                gaps.push(positions[i] - positions[i-1]);
            }
            
            // Average cycle length
            const avgCycle = gaps.reduce((a, b) => a + b, 0) / gaps.length;
            const drawsSinceLast = positions[0];
            
            // Score based on cycle prediction
            const cycleScore = drawsSinceLast / avgCycle;
            cycles[num] = cycleScore * frequency[num];
        }
        
        return this.weightedSelection(cycles, this.game.pick);
    }
    
    // =========================================
    // HYBRID ALGORITHM (Combines All)
    // =========================================
    hybridPrediction() {
        // Get predictions from all algorithms
        const predictions = {
            frequency: this.frequencyBasedPrediction(),
            overdue: this.overdueBasedPrediction(),
            pattern: this.patternBasedPrediction(),
            statistical: this.statisticalEquilibriumPrediction(),
            delta: this.deltaSystemPrediction(),
            markov: this.markovChainPrediction(),
            genetic: this.geneticAlgorithmPrediction(30, 50),
            fourier: this.fourierAnalysisPrediction()
        };
        
        // Score each number based on how many algorithms selected it
        const numberScores = {};
        for (let i = 1; i <= this.game.balls; i++) {
            numberScores[i] = 0;
        }
        
        // Weight each algorithm
        const algoWeights = {
            frequency: this.weights.frequency,
            overdue: this.weights.overdue,
            pattern: this.weights.pattern,
            statistical: this.weights.statistical,
            delta: 0.15,
            markov: 0.2,
            genetic: 0.25,
            fourier: 0.15
        };
        
        for (let algo in predictions) {
            predictions[algo].forEach((num, idx) => {
                // Higher weight for first picks
                const positionWeight = (this.game.pick - idx) / this.game.pick;
                numberScores[num] += (algoWeights[algo] || 0.1) * positionWeight;
            });
        }
        
        return this.weightedSelection(numberScores, this.game.pick);
    }
    
    // =========================================
    // UTILITY METHODS
    // =========================================
    
    // Weighted random selection
    weightedSelection(weights, count) {
        const selected = [];
        const available = { ...weights };
        
        while (selected.length < count) {
            const total = Object.values(available).reduce((a, b) => a + b, 0);
            
            if (total === 0) {
                // Fallback to random
                for (let i = 1; i <= this.game.balls; i++) {
                    if (!selected.includes(i)) {
                        available[i] = 1;
                    }
                }
                continue;
            }
            
            let rand = Math.random() * total;
            
            for (let num in available) {
                rand -= available[num];
                if (rand <= 0) {
                    selected.push(parseInt(num));
                    delete available[num];
                    break;
                }
            }
        }
        
        return selected.sort((a, b) => a - b);
    }
    
    // Generate random numbers
    generateRandomNumbers() {
        const numbers = new Set();
        while (numbers.size < this.game.pick) {
            numbers.add(Math.floor(Math.random() * this.game.balls) + 1);
        }
        return Array.from(numbers);
    }
    
    // Generate all combinations
    generateCombinations(arr, size) {
        const result = [];
        
        function combine(start, combo) {
            if (combo.length === size) {
                result.push([...combo]);
                return;
            }
            
            for (let i = start; i < arr.length; i++) {
                combo.push(arr[i]);
                combine(i + 1, combo);
                combo.pop();
            }
        }
        
        combine(0, []);
        return result;
    }
    
    // Calculate prediction confidence
    calculateConfidence(numbers) {
        let confidence = 0;
        const frequency = this.analyzer.getNumberFrequency();
        const expected = this.analyzer.getExpectedFrequency();
        
        // Frequency alignment
        const avgFreq = numbers.reduce((sum, n) => sum + frequency[n], 0) / numbers.length;
        confidence += Math.min(avgFreq / expected, 1.5) * 20;
        
        // Balance score
        const odds = numbers.filter(n => n % 2 === 1).length;
        const balanceScore = 1 - Math.abs(odds - this.game.pick / 2) / (this.game.pick / 2);
        confidence += balanceScore * 20;
        
        // Spread score
        const sorted = [...numbers].sort((a, b) => a - b);
        const spread = sorted[sorted.length - 1] - sorted[0];
        const spreadScore = Math.min(spread / (this.game.balls * 0.8), 1);
        confidence += spreadScore * 20;
        
        // Decade coverage
        const decades = new Set(numbers.map(n => Math.floor((n - 1) / 10)));
        const decadeCoverage = decades.size / Math.ceil(this.game.balls / 10);
        confidence += decadeCoverage * 20;
        
        // Pair frequency bonus
        const pairs = this.analyzer.getCommonPairs(20);
        let pairBonus = 0;
        for (let i = 0; i < numbers.length; i++) {
            for (let j = i + 1; j < numbers.length; j++) {
                if (pairs.some(p => 
                    (p.numbers[0] === numbers[i] && p.numbers[1] === numbers[j]) ||
                    (p.numbers[1] === numbers[i] && p.numbers[0] === numbers[j])
                )) {
                    pairBonus += 2;
                }
            }
        }
        confidence += Math.min(pairBonus, 20);
        
        return Math.min(Math.round(confidence), 100);
    }
    
    // Generate multiple prediction sets
    generateMultipleSets(count, algorithm = 'hybrid', constraints = {}) {
        const sets = [];
        const usedCombinations = new Set();
        
        for (let i = 0; i < count; i++) {
            let numbers;
            let attempts = 0;
            
            do {
                switch (algorithm) {
                    case 'frequency':
                        numbers = this.frequencyBasedPrediction();
                        break;
                    case 'overdue':
                        numbers = this.overdueBasedPrediction();
                        break;
                    case 'pattern':
                        numbers = this.patternBasedPrediction();
                        break;
                    case 'statistical':
                        numbers = this.statisticalEquilibriumPrediction();
                        break;
                    case 'wheeling':
                        numbers = this.wheelingSystemPrediction();
                        break;
                    case 'delta':
                        numbers = this.deltaSystemPrediction();
                        break;
                    case 'markov':
                        numbers = this.markovChainPrediction();
                        break;
                    case 'genetic':
                        numbers = this.geneticAlgorithmPrediction();
                        break;
                    case 'montecarlo':
                        numbers = this.monteCarloSimulation();
                        break;
                    case 'fourier':
                        numbers = this.fourierAnalysisPrediction();
                        break;
                    case 'hybrid':
                    default:
                        numbers = this.hybridPrediction();
                }
                
                // Apply constraints
                if (constraints.balanceOddEven) {
                    const odds = numbers.filter(n => n % 2 === 1).length;
                    if (odds < 2 || odds > this.game.pick - 2) {
                        attempts++;
                        continue;
                    }
                }
                
                if (constraints.balanceHighLow) {
                    const mid = this.game.balls / 2;
                    const lows = numbers.filter(n => n <= mid).length;
                    if (lows < 2 || lows > this.game.pick - 2) {
                        attempts++;
                        continue;
                    }
                }
                
                if (constraints.avoidRepeats) {
                    const recentNumbers = new Set();
                    HISTORICAL_DATA[this.gameKey].slice(0, 3).forEach(draw => {
                        draw.numbers.forEach(n => recentNumbers.add(n));
                    });
                    const overlap = numbers.filter(n => recentNumbers.has(n)).length;
                    if (overlap > this.game.pick / 2) {
                        attempts++;
                        continue;
                    }
                }
                
                attempts++;
            } while (usedCombinations.has(numbers.join('-')) && attempts < 100);
            
            usedCombinations.add(numbers.join('-'));
            
            sets.push({
                numbers: numbers,
                confidence: this.calculateConfidence(numbers),
                algorithm: algorithm
            });
        }
        
        return sets.sort((a, b) => b.confidence - a.confidence);
    }
}

// Export
window.PredictionEngine = PredictionEngine;
