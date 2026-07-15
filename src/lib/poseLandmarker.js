import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";

let landmarkerPromise = null;

const WASM_PATH = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task";

export function getPoseLandmarker() {
  if (landmarkerPromise) return landmarkerPromise;
  landmarkerPromise = (async () => {
    const vision = await FilesetResolver.forVisionTasks(WASM_PATH);
    const baseOptions = { modelAssetPath: MODEL_URL, delegate: "GPU" };
    try {
      return PoseLandmarker.createFromOptions(vision, {
        baseOptions,
        runningMode: "VIDEO",
        numPoses: 1,
      });
    } catch (e) {
      // GPU init can fail on some devices — fall back to CPU
      return PoseLandmarker.createFromOptions(vision, {
        baseOptions: { ...baseOptions, delegate: "CPU" },
        runningMode: "VIDEO",
        numPoses: 1,
      });
    }
  })();
  return landmarkerPromise;
}