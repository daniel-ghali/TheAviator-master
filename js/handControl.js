import { HandLandmarker, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";

const video = document.getElementById("webcam");

let handLandmarker;
let lastVideoTime = -1;
let isTracking = false;

let targetX = 0;
let targetY = 0;
let smoothX = 0;
let smoothY = 0;
let hasHand = false;

async function createHandLandmarker() {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
  );
  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
      delegate: "GPU"
    },
    runningMode: "VIDEO",
    numHands: 1,
    minHandDetectionConfidence: 0.7,
    minHandPresenceConfidence: 0.7,
    minTrackingConfidence: 0.7
  });
}

window.initHandTracking = async function() {
  await createHandLandmarker();
  startCamera();
  requestAnimationFrame(smoothTracking);
};

function smoothTracking() {
  if (hasHand && typeof window.mousePos !== 'undefined') {
    // 60fps interpolation to remove webcam 30fps stutter
    smoothX += (targetX - smoothX) * 0.3;
    smoothY += (targetY - smoothY) * 0.3;
    window.mousePos = { x: smoothX, y: smoothY };
  }
  requestAnimationFrame(smoothTracking);
}

async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480 } // Fixed resolution to provide IMAGE_DIMENSIONS implicitly
    });
    video.srcObject = stream;
    
    video.addEventListener("loadedmetadata", () => {
      // Vital for MediaPipe Tasks Vision: explicit dimensions
      video.width = video.videoWidth;
      video.height = video.videoHeight;
      video.style.display = "block";
      video.play();
      isTracking = true;
      requestAnimationFrame(predictWebcam);
    });
  } catch (error) {
    console.error("Camera error:", error);
  }
}

async function predictWebcam() {
  if (!isTracking) return;
  
  if (handLandmarker && video.currentTime !== lastVideoTime) {
    lastVideoTime = video.currentTime;
    
    const results = handLandmarker.detectForVideo(video, performance.now());
    if (results.landmarks && results.landmarks.length > 0) {
      const palm = results.landmarks[0][9];
      
      // Map Mediapipe (0..1) to Game mousePos (-1..1) based on Palm
      let tx = -((palm.x - 0.5) * 3); 
      let ty = -((palm.y - 0.5) * 3);
      
      targetX = Math.max(-1, Math.min(1, tx));
      targetY = Math.max(-1, Math.min(1, ty));
      hasHand = true;
    }
  }
  
  requestAnimationFrame(predictWebcam);
}
