// Initializing variables
let stream = null;
let hands = null;
let cameraInstance = null;
const camera = document.getElementById('camera');
const startButton = document.getElementById('start-camera');
const stopButton = document.getElementById('stop-camera');
const gestureResult = document.getElementById('gesture-result');
const overlay = document.getElementById('overlay');

// Start Camera
async function startCamera() {
    try {
        // Accessing the camera
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        camera.srcObject = stream;
        camera.play();

        // Initialize MediaPipe Hands after camera is ready
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

        // Initialize the camera instance for MediaPipe
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

// Stop Camera
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

// Handle results from MediaPipe Hands
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

// Draw hand landmarks (as lines connecting each point)
function drawHandLandmarks(landmarks) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = camera.width;
    canvas.height = camera.height;
    document.body.appendChild(canvas); // Temporary addition of canvas for visualization

    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear previous drawing
    ctx.beginPath();
    for (let i = 0; i < landmarks.length; i++) {
        const x = landmarks[i].x * canvas.width;
        const y = landmarks[i].y * canvas.height;
        ctx.lineWidth = 5;
        ctx.strokeStyle = '#FF6347'; // Line color
        ctx.lineTo(x, y);
    }
    ctx.stroke();
}

// Count the number of fingers raised
function countFingers(landmarks) {
    const fingers = [
        landmarks[8],  // Index Finger Tip
        landmarks[12], // Middle Finger Tip
        landmarks[16], // Ring Finger Tip
        landmarks[20], // Pinky Finger Tip
    ];

    const base = [
        landmarks[6],  // Index Finger Base
        landmarks[10], // Middle Finger Base
        landmarks[14], // Ring Finger Base
        landmarks[18], // Pinky Finger Base
    ];

    let count = 0;
    for (let i = 0; i < fingers.length; i++) {
        if (fingers[i].y < base[i].y) {
            count++;
        }
    }

    // Thumb (special case)
    if (landmarks[4].x < landmarks[3].x) {
        count++;
    }

    return count;
}

// Event listeners for buttons
startButton.addEventListener('click', startCamera);
stopButton.addEventListener('click', stopCamera);
