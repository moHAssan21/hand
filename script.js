const camera = document.getElementById('camera');
const startButton = document.getElementById('start-camera');
const stopButton = document.getElementById('stop-camera');
const gestureResult = document.getElementById('gesture-result');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let stream = null;
let hands = null;
let cameraInstance = null;

// إعدادات الكاميرا
async function startCamera() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        camera.srcObject = stream;
        camera.play();

        hands = new Hands({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });

        hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.8,
            minTrackingConfidence: 0.8,
        });

        hands.onResults(onResults);

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
}

// تتبع الأصابع
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

// رسم الأصابع والخطوط
function drawHandLandmarks(landmarks) {
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
