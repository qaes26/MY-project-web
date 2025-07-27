const express = require('express');
const puppeteer = require('puppeteer-core'); // تغيير هنا
const chromium = require('@sparticuz/chromium'); // إضافة هنا
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.static(path.join(__dirname, 'public')));
app.use('/public', express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/convert', async (req, res) => {
    const url = req.query.url;

    if (!url) {
        return res.status(400).json({ error: 'Please provide a URL to convert.' });
    }

    let browser;
    try {
        // تحديث طريقة تشغيل Puppeteer-core
        browser = await puppeteer.launch({
            args: [...chromium.args, '--hide-scrollbars', '--disable-web-security'], // استخدام وسيطات chromium الموصى بها
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(), // تحديد مسار المتصفح
            headless: chromium.headless // استخدام وضع headless الخاص بـ chromium
        });

        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="converted.pdf"`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Error converting URL to PDF:', error);
        res.status(500).json({ error: `Failed to convert URL to PDF: ${error.message}` });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
});

app.listen(PORT, () => {
    console.log(`خادم تحويل الروابط يعمل على http://localhost:${PORT}`);
    console.log(`لتحويل الروابط، قم بزيارة http://localhost:${PORT}`);
});