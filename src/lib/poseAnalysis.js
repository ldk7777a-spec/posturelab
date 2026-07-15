// Frame-level pose detection helpers built on the shared PoseLandmarker (VIDEO mode).

const MAX_FRAMES = 41;

function loadImageEl(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function seekTo(video, t) {
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      video.removeEventListener("seeked", finish);
      resolve();
    };
    video.addEventListener("seeked", finish);
    try {
      const safe = Math.max(0, Math.min(t, (video.duration || t) - 0.001));
      video.currentTime = safe;
    } catch {
      finish();
    }
    setTimeout(finish, 600); // safety
  });
}

function makeFrame(video, landmarks, time) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(2, video.videoWidth || 480);
  canvas.height = Math.max(2, video.videoHeight || 640);
  canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
  return {
    time,
    landmarks,
    width: canvas.width,
    height: canvas.height,
    image: canvas.toDataURL("image/jpeg", 0.8),
  };
}

// Seek-based, evenly-spaced sampling (up to MAX_FRAMES) so the scrubber has uniform steps.
export async function analyzeVideo(video, landmarker, onProgress) {
  if (video.readyState < 1) {
    await new Promise((res) => {
      video.addEventListener("loadedmetadata", res, { once: true });
      setTimeout(res, 3000);
    });
  }

  const duration = isFinite(video.duration) && video.duration > 0 ? video.duration : 0;

  if (!duration) {
    let landmarks = null;
    try {
      const res = landmarker.detectForVideo(video, performance.now());
      landmarks = res?.landmarks?.[0] || null;
    } catch {}
    return { frames: landmarks ? [makeFrame(video, landmarks, 0)] : [] };
  }

  const count = Math.min(MAX_FRAMES, Math.max(2, Math.round(duration * 10) + 1));
  const frames = [];
  for (let i = 0; i < count; i++) {
    const t = (duration * i) / (count - 1);
    await seekTo(video, t);
    let landmarks = null;
    try {
      const res = landmarker.detectForVideo(video, performance.now());
      landmarks = res?.landmarks?.[0] || null;
    } catch {
      /* skip frame */
    }
    if (landmarks) frames.push(makeFrame(video, landmarks, t));
    if (onProgress) onProgress((i + 1) / count);
  }

  return { frames };
}

export function analyzeImage(image, landmarker) {
  const res = landmarker.detectForVideo(image, performance.now());
  return { landmarks: res?.landmarks?.[0] || null };
}

export function pickBestFrame(frames) {
  if (!frames?.length) return null;
  const keyJoints = [11, 12, 23, 24, 25, 26, 27, 28];
  let best = null;
  let bestVis = -1;
  for (const f of frames) {
    let sum = 0;
    let n = 0;
    for (const i of keyJoints) {
      const l = f.landmarks[i];
      if (l) {
        sum += l.visibility ?? 0.5;
        n += 1;
      }
    }
    const v = n ? sum / n : 0;
    if (v > bestVis) {
      bestVis = v;
      best = f;
    }
  }
  return best || frames[0];
}

export { loadImageEl as loadImageEl };
export function loadImage(file) {
  return loadImageEl(URL.createObjectURL(file));
}