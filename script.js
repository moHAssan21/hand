// متغيرات الكاميرا ومكتبة MediaPipe
let stream = null;
let hands = null;
let cameraInstance = null;
let camera = document.getElementById('camera');
let startButton = document.getElementById('start-camera');
let stopButton = document.getElementById('stop-camera');
let gestureResult = document.getElementById('gesture-result');
let overlay = document.getElementById('overlay');

// إعداد الكاميرا
async function startCamera() {
    try {
        // تأكد من أنه يمكن الوصول إلى الكاميرا
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        camera.srcObject = stream;
        camera.play();

        // تحميل مكتبة MediaPipe بعد التأكد من تحميل الصفحة
        if (!hands) {
            hands = new Hands({
                locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1632/${file}`,
            });

            hands.setOptions({
                maxNumHands: 1,
                modelComplexity: 1,
                minDetectionConfidence: 0.8,
                minTrackingConfidence: 0.8,
            });

            hands.onResults(onResults);
        }

        // إعداد الكاميرا
        cameraInstance = new Camera(camera, {
            onFrame: async () => {
                await hands.send({ image: camera });
            },
            width: window.innerWidth,
            height: window.innerHeight,
        });

        cameraInstance.start();

        startButton.disabled = true;
        stopButton.disabled = false;
        overlay.textContent = 'Tracking Hand Gestures...';
    } catch (error) {
        alert('Unable to access camera: ' + error.message);
    }
}

// إيقاف الكاميرا
function stopCamera() {
    if (stream) {
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
        camera.srcObject = null;
    }
    if (cameraInstance) {
        cameraInstance.stop();
    }
    startButton.disabled = false;
    stopButton.disabled = true;
    overlay.textContent = 'Camera stopped.';
}

// معالجة نتائج MediaPipe Hands
function onResults(results) {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        drawHandLandmarks(landmarks);
        const fingers = countFingers(landmarks);
        gestureResult.textContent = `Fingers: ${fingers}`;
    } else {
        gestureResult.textContent = 'No hand detected';
    }
}

// رسم النقاط والخطوط
function drawHandLandmarks(landmarks) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = camera.width;
    canvas.height = camera.height;
    document.body.appendChild(canvas); // إضافة الكانفاس إلى الصفحة بشكل مؤقت (يمكن إخفاءه لاحقاً)

    ctx.clearRect(0, 0, canvas.width, canvas.height); // مسح الرسومات السابقة
    ctx.beginPath();
    for (let i = 0; i < landmarks.length; i++) {
        const x = landmarks[i].x * canvas.width;
        const y = landmarks[i].y * canvas.height;
        ctx.lineWidth = 5;
        ctx.strokeStyle = '#FF6347'; // لون الخط
        ctx.lineTo(x, y);
    }
    ctx.stroke();
}

// حساب الأصابع المرفوعة
function countFingers(landmarks) {
    const fingers = [
        landmarks[8],  // طرف الإصبع السبابة
        landmarks[12], // طرف الإصبع الوسطى
        landmarks[16], // طرف الإصبع البنصر
        landmarks[20], // طرف الإصبع الخنصر
    ];

    const base = [
        landmarks[6],  // قاعدة الإصبع السبابة
        landmarks[10], // قاعدة الإصبع الوسطى
        landmarks[14], // قاعدة الإصبع البنصر
        landmarks[18], // قاعدة الإصبع الخنصر
    ];

    let count = 0;
    for (let i = 0; i < fingers.length; i++) {
        if (fingers[i].y < base[i].y) {
            count++;
        }
    }

    // الإبهام (حالة خاصة)
    if (landmarks[4].x < landmarks[3].x) {
        count++;
    }

    return count;
}

// بدء الكاميرا
startButton.addEventListener('click', startCamera);

// إيقاف الكاميرا
stopButton.addEventListener('click', stopCamera);
