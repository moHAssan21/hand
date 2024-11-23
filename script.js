const camera = document.getElementById('camera');
const startButton = document.getElementById('start-camera');
const stopButton = document.getElementById('stop-camera');
const fingerCountElement = document.getElementById('finger-count');
let stream = null;
let hands = null;
let cameraInstance = null;

// Check if getUserMedia is supported
if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert('Your browser does not support camera access. Please use a modern browser.');
}

startButton.addEventListener('click', async () => {
    try {
        // Request camera access with supported settings
        stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: { exact: 'user' }, // Use front camera explicitly
                width: { ideal: 640 },
                height: { ideal: 360 }
            }
        });

        // Display the video stream on the camera element
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

        // Initialize Camera Utils for frame processing
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
        console.error('Error accessing camera:', error.message);
        alert('Failed to access camera: ' + error.message);
    }
});

// Stop the camera and processing
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

// Handle the hand gesture results
function onResults(results) {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        const fingers = countFingers(landmarks);
        fingerCountElement.textContent = fingers;
    } else {
        fingerCountElement.textContent = 'No hand detected';
    }
}

// Count raised fingers based on landmarks
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

    // Special case for thumb
    if (landmarks[4].x < landmarks[3].x) {
        count++;
    }

    return count;
}
