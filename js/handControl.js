import { HandLandmarker, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";

const video = document.getElementById("webcam");

let handLandmarker;
let lastVideoTime = -1;
let isTracking = false;

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

// Expose to global scope for the start menu button
window.initHandTracking = async function() {
  await createHandLandmarker();
  startCamera();
};

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
      
      tx = Math.max(-1, Math.min(1, tx));
      ty = Math.max(-1, Math.min(1, ty));
      
      window.mousePos = { x: tx, y: ty };
    }
  }
  
  requestAnimationFrame(predictWebcam);
}
