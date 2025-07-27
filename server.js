const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000; // استخدم المنفذ الذي يحدده Render أو 10000 افتراضيا

// تهيئة Express لخدمة الملفات الثابتة (HTML, CSS, JS)
// هذا السطر يخدم الملفات مباشرة من مجلد public
app.use(express.static(path.join(__dirname, 'public')));

// هذا السطر الإضافي يحل مشكلة المسارات في بعض بيئات الاستضافة مثل Render
// بحيث يمكن الوصول للملفات عبر /public/file.css
app.use('/public', express.static(path.join(__dirname, 'public')));

// مسار لتقديم ملف index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// مسار API لتحويل الرابط إلى PDF
app.get('/convert', async (req, res) => {
    const url = req.query.url;

    if (!url) {
        return res.status(400).json({ error: 'Please provide a URL to convert.' }); // استجابة JSON للخطأ
    }

    let browser;
    try {
        // تشغيل Puppeteer في وضع headless (بدون واجهة رسومية)
        // إضافة خيارات لتناسب بيئات السحابة مثل Render (هذه الخيارات مهمة جداً)
        browser = await puppeteer.launch({
            headless: true, // تأكد أنها true
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage', // مهم لبعض بيئات الاستضافة
                '--disable-gpu',
                '--no-zygote',
                '--single-process',
                '--disable-features=site-per-process', // قد يساعد في بعض الحالات
                '--lang=en-US,en' // تحديد اللغة لمنع مشاكل التحويل
            ]
        });

        const page = await browser.newPage();
        // ضبط مهلة التنقل ووقت انتظار الشبكة
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 }); // زيادة مهلة التحميل إلى 60 ثانية

        // يمكنك إضافة تأخير قصير هنا إذا كانت بعض الصفحات تحتاج وقتاً إضافياً لتحميل JS
        // await new Promise(resolve => setTimeout(resolve, 2000));

        // توليد ملف PDF
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true
        });

        // إرسال ملف PDF كاستجابة
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="converted.pdf"`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Error converting URL to PDF:', error);
        // إرسال رسالة خطأ بصيغة JSON للواجهة الأمامية
        res.status(500).json({ error: `Failed to convert URL to PDF: ${error.message}` });
    } finally {
        if (browser) {
            await browser.close(); // إغلاق المتصفح لتحرير الموارد
        }
    }
});

// بدء تشغيل الخادم
app.listen(PORT, () => {
    console.log(`خادم تحويل الروابط يعمل على http://localhost:${PORT}`);
    console.log(`لتحويل الروابط، قم بزيارة http://localhost:${PORT}`);
});