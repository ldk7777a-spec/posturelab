// Frame-level pose detection helpers built on the shared PoseLandmarker (VIDEO mode).

export async function analyzeVideo(video, landmarker, onProgress) {
  if (video.readyState < 2) {
    await new Promise((res) => {
      video.addEventListener("loadeddata", res, { once: true });
      // safety timeout — some formats never fire loadeddata
      setTimeout(res, 3000);
    });
  }

  const frames = [];
  video.muted = true;
  try {
    video.currentTime = 0;
    await video.play();
  } catch {
    /* autoplay blocked — detection can still run on paused frame via seek */
  }

  let lastTs = -1;
  await new Promise((resolve) => {
    const tick = () => {
      const now = performance.now();
      if (now === lastTs) {
        requestAnimationFrame(tick);
        return;
      }
      lastTs = now;
      try {
        const res = landmarker.detectForVideo(video, now);
        if (res?.landmarks?.[0]) {
          frames.push({ time: video.currentTime, landmarks: res.landmarks[0] });
        }
      } catch {
        /* transient detect error — skip frame */
      }
      if (onProgress && video.duration) onProgress(Math.min(1, video.currentTime / video.duration));
      if (!video.ended && !video.paused) requestAnimationFrame(tick);
      else resolve();
    };
    requestAnimationFrame(tick);
  });

  video.pause();
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

export function captureVideoFrame(video, time) {
  return new Promise((resolve, reject) => {
    const onSeeked = () => {
      video.removeEventListener("seeked", onSeeked);
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 360;
      canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
      resolve(canvas);
    };
    video.addEventListener("seeked", onSeeked);
    video.pause();
    try {
      video.currentTime = time;
    } catch (e) {
      video.removeEventListener("seeked", onSeeked);
      reject(e);
    }
    setTimeout(() => {
      // fallback in case seeked never fires
      video.removeEventListener("seeked", onSeeked);
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 360;
      canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
      resolve(canvas);
    }, 600);
  });
}

export function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}