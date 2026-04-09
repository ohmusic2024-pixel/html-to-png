const express = require('express');
const puppeteer = require('puppeteer');
const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.text({ limit: '10mb', type: '*/*' }));

app.post('/screenshot', async (req, res) => {
  let html = req.body;
  
  if (typeof html === 'object' && html !== null) {
    html = html.html;
  }
  
  if (!html || html.trim() === '') {
    return res.status(400).json({ error: 'HTML is required' });
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 380, height: 900 });
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Remove gray background and get exact card height
    await page.evaluate(() => {
      document.body.style.margin = '0';
      document.body.style.padding = '0';
      document.body.style.background = 'transparent';
    });

    // Get actual card height
    const cardHeight = await page.evaluate(() => {
      const card = document.querySelector('.card') || document.body;
      return card.scrollHeight;
    });

    // Resize viewport to match card height
    await page.setViewport({ width: 380, height: cardHeight });

    const screenshot = await page.screenshot({
      type: 'png',
      fullPage: false,
      omitBackground: true,
      clip: {
        x: 0,
        y: 0,
        width: 380,
        height: cardHeight
      }
    });

    res.set('Content-Type', 'image/png');
    res.send(screenshot);

  } catch (error) {
    console.error('Screenshot error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    if (browser) await browser.close();
  }
});

app.get('/', (req, res) => {
  res.json({ status: 'HTML to PNG service running' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
