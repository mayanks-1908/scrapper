# Uber Eats Scraper

A collection of Node.js scripts for scraping restaurant data from Uber Eats.

## Prerequisites

- Node.js 14+
- npm or yarn
- Puppeteer (will be installed via npm)

## Installation

```bash
# Clone the repository
git clone https://github.com/mayanks-1908/scrapper.git
cd scrapper

# Install dependencies
npm install
```

## Available Scripts

### 1. Main Page Scraper
Scrapes restaurant listings from the main Uber Eats feed.

```bash
# Run with default URL
npm run mainPageScrape

# Or directly with Node
node src/scrapers/mainPageScrapper.js
```

**Outputs:**
- `ubereats.json`: Extracted restaurant data
- `netlogs/`: Network request logs
- `page_after_js.html`: Final rendered HTML

### 2. Restaurant Scraper
Scrapes detailed information for specific restaurants.

```bash
# Run with default configuration
npm run puppeter

# Or with custom URL
node src/scrapers/restroScrapperWithPup.js "https://www.ubereats.com/store/restaurant-name/ID"
```

**Outputs:**
- `data/output/`: JSON files with restaurant details
- Screenshots and debug information

### 3. API Extractor
Extracts data from Uber Eats API responses.

```bash
node src/scrapers/apiExtractor.js
```

## Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
# Proxy configuration (if needed)
PROXY_SERVER=your-proxy-server:port
PROXY_USERNAME=your-username
PROXY_PASSWORD=your-password

# Output directory
OUTPUT_DIR=./data/output
```

## Troubleshooting

### Common Issues

1. **Page Not Loading**
   - Check your internet connection
   - Try running with `headless: false` for debugging
   - Verify if you're being blocked by Cloudflare

