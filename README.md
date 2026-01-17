# LottoGenius Pro 🎰

Advanced Lottery Analytics & Prediction System for Ontario Lotteries

![License](https://img.shields.io/badge/license-Personal%20Use-blue)
![Status](https://img.shields.io/badge/status-Active-green)

## 🎯 Features

### Supported Games
- **Lotto Max** (7/50 + Bonus)
- **Lotto 6/49** (6/49 + Bonus)
- **Daily Grand** (5/49 + Grand Number 1/7)
- **Lottario** (6/45 + Bonus)
- **Ontario 49** (6/49 + Bonus)

### Analytics
- **Number Frequency Analysis** - Track how often each number appears
- **Hot/Cold Numbers** - Identify trending and dormant numbers
- **Overdue Analysis** - Find numbers due for appearance
- **Pair Analysis** - Common number combinations
- **Odd/Even Distribution** - Balance analysis
- **Sum Range Distribution** - Statistical sum patterns
- **Decade Distribution** - Number range analysis
- **Pattern Recognition** - Identify recurring patterns

### Prediction Algorithms
1. **Frequency-Based** - Weighted selection based on historical frequency
2. **Overdue-Based** - Prioritizes numbers that haven't appeared recently
3. **Pattern-Based** - Uses common pair correlations
4. **Statistical Equilibrium** - Matches historical statistical profiles
5. **Wheeling System** - Mathematical coverage optimization
6. **Delta System** - Gap analysis between consecutive numbers
7. **Markov Chain** - Transition probability modeling
8. **Genetic Algorithm** - Evolutionary optimization
9. **Monte Carlo Simulation** - Probabilistic sampling
10. **Fourier Analysis** - Cyclical pattern detection
11. **Hybrid Algorithm** - Combines all methods with weighted scoring

## 🚀 Deployment to Your GitHub (googlebud)

### Step 1: Create New Repository
1. Go to https://github.com/new
2. Repository name: `lottery-predictor` (or any name you prefer)
3. Set to **Private** for personal use
4. **Don't** initialize with README (we have one)
5. Click **Create repository**

### Step 2: Upload Files
**Option A: GitHub Web Interface**
1. In your new repo, click **"uploading an existing file"**
2. Drag all these files into the upload area:
   - `index.html`
   - `styles.css`
   - `lottery-data.js`
   - `algorithms.js`
   - `app.js`
   - `data-fetcher.js`
   - `README.md`
   - `.gitignore`
3. Commit the files

**Option B: Git Command Line**
```bash
# Clone your empty repo
git clone https://github.com/googlebud/lottery-predictor.git
cd lottery-predictor

# Copy all files to this folder, then:
git add .
git commit -m "Initial commit - LottoGenius Pro"
git push origin main
```

### Step 3: Enable GitHub Pages
1. Go to your repo **Settings** → **Pages**
2. Under "Source", select **Deploy from a branch**
3. Choose **main** branch and **/ (root)** folder
4. Click **Save**
5. Wait 1-2 minutes for deployment

### Step 4: Access Your Site
- **Public repo**: `https://googlebud.github.io/lottery-predictor`
- **Private repo**: GitHub Pages requires GitHub Pro/Team for private repos
  - Alternative: Test locally by opening `index.html` in browser

### Running Locally (Recommended for Private Use)
```bash
# Simply open index.html in your browser
# Or use a local server:
cd lottery-predictor
python -m http.server 8000
# Then visit http://localhost:8000
```

## 📁 Project Structure

```
lottery-predictor/
├── index.html          # Main HTML file
├── styles.css          # All styling
├── lottery-data.js     # Game configs & data management
├── algorithms.js       # 11 prediction algorithms
├── app.js              # Main application logic
├── data-fetcher.js     # Real data fetching module
├── .gitignore          # Git ignore file
└── README.md           # This file
```

## 🔧 Configuration

### Adding Real Historical Data

The system generates sample data by default. To add real data:

1. Open `lottery-data.js`
2. Find the `HISTORICAL_DATA` section
3. Replace with actual draw results:

```javascript
const HISTORICAL_DATA = {
    lottomax: [
        { date: '2024-01-15', numbers: [3, 12, 19, 28, 35, 41, 47], bonus: 22, jackpot: 55000000 },
        { date: '2024-01-12', numbers: [5, 8, 17, 23, 39, 44, 50], bonus: 11, jackpot: 50000000 },
        // Add more draws...
    ],
    lotto649: [
        { date: '2024-01-13', numbers: [4, 15, 22, 31, 38, 45], bonus: 7, jackpot: 12000000 },
        // Add more draws...
    ],
    // ... other games
};
```

### Data Sources for Manual Entry
- **OLG Official**: https://www.olg.ca/en/lottery/past-results.html
- **LottoNumbers**: https://ca.lottonumbers.com/
- **PlayOLG**: https://www.playnow.com/lottery/

### Adjusting Algorithm Weights

In the Settings section or modify `app.js`:

```javascript
this.weights = {
    frequency: 0.25,    // Weight for frequency-based predictions
    overdue: 0.25,      // Weight for overdue number predictions
    pattern: 0.25,      // Weight for pattern matching
    statistical: 0.25   // Weight for statistical equilibrium
};
```

## 📊 Algorithm Details

### Frequency-Based Prediction
```
P(n) = frequency(n) / Σfrequency(all)
```
Selects numbers proportionally to their historical appearance frequency.

### Overdue Analysis
```
Overdue(n) = draws_since_last_appearance(n) / expected_interval(n)
expected_interval = total_balls / numbers_per_draw
```
Identifies numbers that are statistically "due" based on average appearance intervals.

### Genetic Algorithm
Evolves combinations through natural selection:
- **Population**: 100 random combinations
- **Selection**: Keep top 20% fittest
- **Crossover**: Combine genes from two parents
- **Mutation**: 10% random changes
- **Fitness Function**: `Σ(frequency + pair_bonus + balance_score + spread_score)`

### Markov Chain
Models draw-to-draw transitions:
```
P(next_number | previous_draw) = transition_matrix[prev][next]
```

### Monte Carlo Simulation
Runs 10,000+ simulations based on probability distributions to identify most likely combinations.

### Delta System
Analyzes gaps between consecutive winning numbers:
```
δᵢ = nᵢ₊₁ - nᵢ
```
Uses most common delta patterns to generate new combinations.

## 📈 Mathematical Formulas Used

| Algorithm | Formula |
|-----------|---------|
| Chi-Square Test | χ² = Σ((O-E)²/E) |
| Standard Deviation | σ = √(Σ(x-μ)²/N) |
| Binomial Probability | P(X=k) = C(n,k) × p^k × (1-p)^(n-k) |
| Poisson Distribution | P(X=k) = (λ^k × e^(-λ)) / k! |
| Correlation | r = Σ((x-x̄)(y-ȳ)) / (n×σx×σy) |

## ⚠️ Important Disclaimer

**This tool is for EDUCATIONAL and ENTERTAINMENT purposes only.**

- Lottery games are games of **pure chance**
- Past results have **no influence** on future outcomes (independence)
- No algorithm can **predict** truly random number draws
- Mathematical patterns in historical data are **expected statistical variance**
- Always gamble **responsibly** and within your means

While some mathematicians have won lotteries, their success typically involved:
- Playing syndicates with many tickets
- Exploiting specific game flaws (now patched)
- Statistical arbitrage during rollover periods
- Simple luck

## 🔒 Privacy & Security

- ✅ All processing happens **locally** in your browser
- ✅ **No data** is sent to external servers
- ✅ Predictions are generated **client-side**
- ✅ Your number selections remain **private**

## 🛠️ Browser Compatibility

- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+

## 📝 License

This project is for **personal use only**. Not for commercial distribution.

---

**Remember**: The lottery is a game of chance. Play responsibly! 🎲
