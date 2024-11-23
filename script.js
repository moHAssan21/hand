const camera = document.getElementById('camera');
const startButton = document.getElementById('start-camera');
const stopButton = document.getElementById('stop-camera');
const gestureResult = document.getElementById('gesture-result');
let stream = null;
let hands = null;
let cameraInstance = null;

// Start the camera and MediaPipe Hands
startButton.addEventListener('click', async () => {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        camera.srcObject = stream;

        // Initialize MediaPipe Hands
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

        // Initialize Camera Utils
        cameraInstance = new Camera(camera, {
            onFrame: async () => {
                await hands.send({ image: camera });
            },
            width: 640,
            height: 360,
        });

        cameraInstance.start();

        startButton.disabled = true;
        stopButton.disabled = false;
    } catch (error) {
        alert('Unable to access camera: ' + error.message);
    }
});

// Stop the camera and MediaPipe Hands
stopButton.addEventListener('click', () => {
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
});

// Handle results from MediaPipe Hands
function onResults(results) {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];

        // Calculate the number of fingers raised
        const fingers = countFingers(landmarks);
        gestureResult.textContent = `Fingers: ${fingers}`;
    } else {
        gestureResult.textContent = 'No hand detected';
    }
}

// Helper function to count fingers raised
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

    // Thumb (Special Case)
    if (landmarks[4].x < landmarks[3].x) {
        count++;
    }

    return count;
}
