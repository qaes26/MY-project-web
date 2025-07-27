// script.js
document.addEventListener('DOMContentLoaded', () => {
    const urlInput = document.getElementById('urlInput');
    const convertBtn = document.getElementById('convertBtn');
    const messageDiv = document.getElementById('message');
    const loadingDiv = document.getElementById('loading');

    // وظيفة لإظهار رسالة
    const showMessage = (msg, type) => {
        messageDiv.textContent = msg;
        messageDiv.className = `message ${type}`; // إضافة فئة النوع (error/success)
        messageDiv.style.display = 'block';
    };

    // وظيفة لإخفاء الرسالة
    const hideMessage = () => {
        messageDiv.style.display = 'none';
        messageDiv.textContent = '';
    };

    convertBtn.addEventListener('click', async () => {
        const url = urlInput.value.trim(); // احصل على القيمة وأزل المسافات البيضاء

        hideMessage(); // إخفاء أي رسالة سابقة
        convertBtn.disabled = true; // تعطيل الزر أثناء التحويل
        loadingDiv.style.display = 'block'; // إظهار رسالة التحميل

        if (!url) {
            showMessage('الرجاء إدخال رابط URL.', 'error');
            convertBtn.disabled = false;
            loadingDiv.style.display = 'none';
            return;
        }

        try {
            // إرسال طلب POST إلى الواجهة الخلفية
            const response = await fetch('/convert-to-pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url: url })
            });

            if (!response.ok) {
                // إذا كان هناك خطأ من الخادم (مثال: 400 Bad Request, 500 Internal Server Error)
                const errorData = await response.json();
                throw new Error(errorData.error || `خطأ في الخادم: ${response.statusText}`);
            }

            // إذا كان التحويل ناجحاً، يتم تنزيل الملف
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = 'converted_page.pdf'; // اسم الملف الذي سيتم تنزيله
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(downloadUrl); // تحرير الرابط

            showMessage('تم تحويل الرابط بنجاح! بدأ التنزيل.', 'success');

        } catch (error) {
            console.error('حدث خطأ:', error);
            showMessage(`فشل التحويل: ${error.message}`, 'error');
        } finally {
            convertBtn.disabled = false; // تفعيل الزر مرة أخرى
            loadingDiv.style.display = 'none'; // إخفاء رسالة التحميل
        }
    });
});