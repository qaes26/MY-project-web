document.getElementById('convert-btn').addEventListener('click', async () => {
    const urlInput = document.getElementById('url-input');
    const url = urlInput.value;
    const statusDiv = document.getElementById('status-message');

    if (!url) {
        statusDiv.textContent = 'Please enter a URL.';
        statusDiv.style.color = 'red';
        return;
    }

    statusDiv.textContent = 'Converting... Please wait.';
    statusDiv.style.color = 'blue';

    try {
        const response = await fetch(`/convert?url=${encodeURIComponent(url)}`);

        if (response.ok) {
            // إذا كانت الاستجابة OK (200)، فهي ملف PDF
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = 'converted.pdf';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(downloadUrl);
            statusDiv.textContent = 'Conversion successful! PDF downloaded.';
            statusDiv.style.color = 'green';
        } else {
            // إذا لم تكن الاستجابة OK، توقع استجابة JSON مع رسالة خطأ
            // هذا الجزء هو التعديل الأساسي للتعامل مع رسائل الخطأ من الخادم
            let errorData;
            try {
                errorData = await response.json(); // حاول تحليلها كـ JSON
            } catch (jsonError) {
                // إذا فشل التحليل كـ JSON، فهذا يعني أن الخادم أرسل HTML أو نص عادي
                errorData = { error: `Server error: ${response.status} - ${await response.text()}` };
            }

            statusDiv.textContent = `Conversion failed: ${errorData.error || 'Unknown error'}`;
            statusDiv.style.color = 'red';
        }
    } catch (error) {
        console.error('Error during conversion:', error);
        statusDiv.textContent = `Conversion failed: ${error.message}`;
        statusDiv.style.color = 'red';
    }
});