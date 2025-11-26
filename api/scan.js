const express = require('express');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4000;
const isDev = process.env.NODE_ENV !== 'production';

app.use(cors({
    origin: isDev ? 'http://localhost:5173' : process.env.FRONTEND_URL || '*'
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

        // Use different browser launch options for dev vs production
        browser = await puppeteer.launch(
            isDev
                ? {
                    headless: 'new',
                    args: ['--no-sandbox', '--disable-setuid-sandbox']
                }
                : {
                    args: chromium.args,
                    defaultViewport: chromium.defaultViewport,
                    executablePath: await chromium.executablePath(),
                    headless: chromium.headless,
                }
        );

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
                    const lineHeightPx = parseFloat(computed.lineHeight) || fontSizePx * 1.2;

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
                            tagName: el.tagName,
                            isInjected: false
                        });
                    }
                });

                // Check which heading tags are missing
                const existingTags = new Set(Array.from(styleMap.values()).map(s => s.tagName));
                const headingTags = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'];
                const missingTags = headingTags.filter(tag => !existingTags.has(tag));

                // Inject missing tags and extract their styles
                const injectedElements = [];
                missingTags.forEach(tagName => {
                    const el = document.createElement(tagName.toLowerCase());
                    el.textContent = 'Sample text';
                    el.style.visibility = 'hidden';
                    el.style.position = 'absolute';
                    el.style.top = '-9999px';
                    document.body.appendChild(el);
                    injectedElements.push(el);

                    const computed = window.getComputedStyle(el);
                    const fontSizePx = parseFloat(computed.fontSize);
                    const lineHeightPx = parseFloat(computed.lineHeight) || fontSizePx * 1.2;

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
                            tagName: tagName,
                            isInjected: true
                        });
                    }
                });

                // Clean up injected elements
                injectedElements.forEach(el => el.remove());

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

        // Extract unique font families
        const allStyles = [...desktopStyles, ...mobileStyles];
        const fontFamiliesSet = new Set();
        allStyles.forEach(style => {
            const cleanFamily = style.fontFamily.replace(/['"]/g, '').split(',')[0].trim();
            fontFamiliesSet.add(cleanFamily);
        });
        const fontFamilies = Array.from(fontFamiliesSet);

        res.json({
            desktop: generateNames(desktopStyles),
            mobile: generateNames(mobileStyles, 'M_'),
            fontFamilies: fontFamilies
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

// For Vercel serverless
if (isDev) {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

module.exports = app;
