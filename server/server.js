const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
const PORT = 4000;

app.use(cors({
    origin: 'http://localhost:5173' // Allow requests from Vite frontend
}));
app.use(express.json());

app.post('/api/scan', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    let browser;
    try {
        console.log(`Starting scan for: ${url}`);
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const scrapeStyles = async (viewport) => {
            const page = await browser.newPage();
            await page.setViewport(viewport);
            await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });

            const styles = await page.evaluate(() => {
                const allElements = document.querySelectorAll('*');
                const styleMap = new Map();

                allElements.forEach(el => {
                    if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'PATH'].includes(el.tagName)) return;

                    // Check if element is visible
                    const rect = el.getBoundingClientRect();
                    if (rect.width === 0 || rect.height === 0) return;

                    const computed = window.getComputedStyle(el);

                    if (!el.innerText || el.innerText.trim().length === 0) return;

                    const fontSizePx = parseFloat(computed.fontSize);
                    const lineHeightPx = parseFloat(computed.lineHeight) || fontSizePx * 1.2; // Fallback

                    // Create key for deduplication
                    const key = `${computed.fontFamily}-${computed.fontSize}-${computed.fontWeight}-${computed.lineHeight}-${computed.color}`;

                    if (!styleMap.has(key)) {
                        styleMap.set(key, {
                            fontFamily: computed.fontFamily,
                            fontSize: computed.fontSize,
                            fontSizePx: fontSizePx,
                            fontWeight: computed.fontWeight,
                            lineHeight: computed.lineHeight,
                            lineHeightPx: lineHeightPx,
                            color: computed.color,
                            tagName: el.tagName
                        });
                    }
                });
                return Array.from(styleMap.values());
            });

            await page.close();
            return styles.sort((a, b) => b.fontSizePx - a.fontSizePx);
        };

        // Scrape Desktop
        const desktopStyles = await scrapeStyles({ width: 1920, height: 1080 });

        // Scrape Mobile
        const mobileStyles = await scrapeStyles({ width: 375, height: 812 });

        // Helper to generate names
        const generateNames = (styles, prefix = '') => {
            return styles.map((style, index) => {
                let name = `Text_${index + 1}`;
                if (index === 0) name = `${prefix}Display`;
                else if (index === 1) name = `${prefix}H1`;
                else if (index === 2) name = `${prefix}H2`;
                else if (index === 3) name = `${prefix}H3`;
                else if (index === 4) name = `${prefix}H4`;
                else if (index === 5) name = `${prefix}H5`;
                else if (index === 6) name = `${prefix}H6`;
                else name = `${prefix}Text_${index - 6}`;

                return { ...style, name };
            });
        };

        res.json({
            desktop: generateNames(desktopStyles),
            mobile: generateNames(mobileStyles, 'M_')
        });

    } catch (error) {
        console.error('Scraping error:', error);
        res.status(500).json({ error: 'Failed to scan the website', details: error.message });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
