// server.js
const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path'); // لاستخدام مسارات الملفات بشكل صحيح

const app = express();
const port = process.env.PORT || 3000;

// لتمكين قراءة JSON في طلبات POST
app.use(express.json());

// لتقديم الملفات الثابتة (مثل ملفات الواجهة الأمامية HTML/CSS/JS)
app.use(express.static(path.join(__dirname, 'public')));

// مسار API لتحويل الرابط إلى PDF
app.post('/convert-to-pdf', async (req, res) => {
    const { url } = req.body; // استخراج الرابط من جسم الطلب

    if (!url) {
        return res.status(400).json({ error: 'الرجاء توفير رابط صالح للتحويل.' });
    }

    try {
        // التحقق من صحة الرابط الأساسية
        new URL(url);
    } catch (error) {
        return res.status(400).json({ error: 'الرابط المدخل غير صالح. تأكد من أن يبدأ بـ http:// أو https://' });
    }

    let browser;
    try {
        // تشغيل متصفح Chromium
        browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'] // ضروريات لبيئات الخادم
        });
        const page = await browser.newPage();

        // الانتقال إلى الرابط وتحويله إلى PDF
        await page.goto(url, { waitUntil: 'networkidle0' }); // انتظر حتى يتم تحميل الشبكة
        const pdfBuffer = await page.pdf({
            format: 'A4', // حجم الورقة
            printBackground: true // طباعة الخلفيات (ألوان وصور)
        });

        // إرسال ملف PDF كاستجابة
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="converted.pdf"');
        res.send(pdfBuffer);

    } catch (error) {
        console.error('خطأ في تحويل الرابط إلى PDF:', error);
        res.status(500).json({ error: `حدث خطأ أثناء التحويل: ${error.message}` });
    } finally {
        if (browser) {
            await browser.close(); // إغلاق المتصفح دائماً
        }
    }
});

// تشغيل الخادم
app.listen(port, () => {
    console.log(`خادم تحويل الروابط يعمل على http://localhost:${port}`);
    console.log(`لتحويل الروابط، قم بزيارة http://localhost:${port}`);
});