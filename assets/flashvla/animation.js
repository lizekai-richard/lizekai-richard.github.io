import { buildTimeline, sampleTimeline } from "./timing.js";

// Adapted from z-lab/website StreamingSim.astro at c11f4041be5d882e663ef8e3c6e6002624837d6e.
// Keep the original schedule and buffer geometry; fit the presentation to a teaser.
document.documentElement.classList.toggle("teaser", new URLSearchParams(location.search).has("teaser"));

const root = document.querySelector(".animation");
const playButton = root.querySelector("[data-play]");
const restartButton = root.querySelector("[data-restart]");
const status = root.querySelector(".status");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const slots = 5;
const bufferUnits = 10;
const trail = 6;
const lanes = [...root.querySelectorAll(".lane")].map((element) => ({
  element,
  mode: element.dataset.mode,
  video: element.querySelector("video"),
  layer: element.querySelector(".chunks"),
  step: element.querySelector("[data-step]"),
  fill: element.querySelector(".fill"),
  finished: element.querySelector(".finished"),
  pool: new Map(),
  timeline: null,
  lastFrame: -1,
}));

let ready = false;
let visible = false;
let userPaused = reducedMotion.matches;
let playing = false;
let elapsed = 0;
let startedAt = 0;
let horizon = 0;
let raf = 0;

function position(element, x, width) {
  element.style.setProperty("--x", x);
  element.style.setProperty("--w", width);
}

function makeSlots(lane) {
  const layer = lane.element.querySelector(".slots");
  const count = lane.mode === "streaming" ? slots : 1;
  for (let index = 0; index < count + trail; index++) {
    const slot = document.createElement("span");
    const executed = index >= count;
    slot.className = `slot${executed ? " slot-executed" : ""}`;
    position(slot, executed ? bufferUnits + index - count : index * bufferUnits / count,
      executed ? 1 : bufferUnits / count);
    layer.appendChild(slot);
  }
}

function viewsFor(lane, state) {
  const { segment, progress, done } = state;
  const chunk = segment.chunk;
  const emitted = done ? lane.timeline.chunks : segment.kind === "exec" ? chunk + 1 : chunk;
  const views = [];
  for (let index = 0; index < trail; index++) {
    const id = emitted - 1 - index;
    if (id < 0) break;
    views.push({ id, x: bufferUnits + index, width: 1, emitted: true, noise: 0 });
  }
  if (done) return views;
  if (lane.mode === "blocking") {
    if (segment.kind === "stall") {
      views.push({ id: chunk, x: 0, width: bufferUnits, emitted: false,
        noise: Math.max(0, slots - 1 - Math.floor(progress * slots)) });
    }
  } else {
    for (let index = 0; index < slots; index++) {
      const executing = segment.kind === "exec";
      views.push({ id: chunk + index + (executing ? 1 : 0), x: bufferUnits - 2 * (index + 1),
        width: 2, emitted: false,
        noise: executing && index < slots - 1 ? index + 1 - progress : index });
    }
  }
  return views;
}

function reconcile(lane, views) {
  const ids = new Set(views.map((view) => view.id));
  lane.pool.forEach((record, id) => {
    if (ids.has(id)) return;
    lane.pool.delete(id);
    record.element.classList.remove("visible");
    setTimeout(() => record.element.remove(), 300);
  });
  views.forEach((view) => {
    let record = lane.pool.get(view.id);
    if (!record) {
      const element = document.createElement("span");
      element.className = "chunk";
      record = { element, view };
      lane.pool.set(view.id, record);
      lane.layer.appendChild(element);
      element.addEventListener("mouseenter", () => {
        if (record.view.emitted || lane.mode !== "streaming") return;
        lane.pool.forEach((other) => {
          other.element.classList.toggle("attends", !other.view.emitted && other.view.noise < record.view.noise - .01);
        });
      });
      element.addEventListener("mouseleave", () => lane.pool.forEach((other) => other.element.classList.remove("attends")));
      setTimeout(() => element.classList.add("visible"), 16);
    }
    record.view = view;
    position(record.element, view.x, view.width);
    record.element.style.setProperty("--noise", Math.max(0, Math.min(1, view.noise / (slots - 1))));
    record.element.classList.toggle("executed", view.emitted);
    record.element.title = view.emitted ? "Executed chunk" : lane.mode === "blocking"
      ? `Decoding in place: pass ${Math.min(slots, slots - Math.round(view.noise))}/${slots}`
      : view.noise < .5 ? "Clean chunk — emitted next" : `${Math.ceil(view.noise)} denoising steps left`;
  });
}

function paint(time) {
  lanes.forEach((lane) => {
    const state = sampleTimeline(lane.timeline, time);
    // Videos are intentionally paused: seeking preserves the measured stalls
    // and the identical execution-frame rate used in the blog animation.
    if (state.frame !== lane.lastFrame && lane.video.readyState >= 2 && !lane.video.seeking) {
      lane.video.currentTime = Math.min(state.frame / lane.timeline.fps, Math.max(0, lane.video.duration - .001));
      lane.lastFrame = state.frame;
    }
    lane.step.textContent = state.step;
    lane.fill.style.width = `${Math.min(100, time / lane.timeline.total * 100)}%`;
    lane.finished.hidden = !state.done;
    reconcile(lane, viewsFor(lane, state));
  });
}

function clearChunks() {
  lanes.forEach((lane) => {
    lane.layer.replaceChildren();
    lane.pool.clear();
    lane.lastFrame = -1;
  });
}

function updateButton() {
  playButton.textContent = userPaused ? "Play" : "Pause";
  playButton.setAttribute("aria-label", userPaused ? "Play animation" : "Pause animation");
}

function pause() {
  if (playing) elapsed += performance.now() - startedAt;
  playing = false;
  cancelAnimationFrame(raf);
}

function frame(now) {
  let time = elapsed + now - startedAt;
  if (time >= horizon + 1000) {
    elapsed = 0;
    startedAt = now;
    time = 0;
    clearChunks();
  }
  paint(time);
  raf = requestAnimationFrame(frame);
}

function syncPlayback() {
  if (ready && visible && !document.hidden && !userPaused) {
    if (!playing) {
      playing = true;
      startedAt = performance.now();
      raf = requestAnimationFrame(frame);
    }
  } else {
    pause();
  }
  updateButton();
}

playButton.addEventListener("click", () => {
  userPaused = !userPaused;
  syncPlayback();
});
restartButton.addEventListener("click", () => {
  pause();
  elapsed = 0;
  clearChunks();
  paint(0);
  syncPlayback();
});
document.addEventListener("visibilitychange", syncPlayback);
reducedMotion.addEventListener("change", (event) => {
  userPaused = event.matches;
  syncPlayback();
});
new IntersectionObserver(([entry]) => {
  visible = entry.isIntersecting;
  syncPlayback();
}, { threshold: .15 }).observe(root);

function mediaReady(video) {
  if (video.readyState >= 2) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      video.removeEventListener("loadeddata", loaded);
      video.removeEventListener("error", failed);
    };
    const loaded = () => { cleanup(); resolve(); };
    const failed = () => { cleanup(); reject(new Error("Could not load LIBERO video")); };
    if (video.error) { failed(); return; }
    video.addEventListener("loadeddata", loaded);
    video.addEventListener("error", failed);
  });
}

async function init() {
  try {
    await Promise.all(lanes.map(async (lane) => {
      makeSlots(lane);
      lane.video.muted = true;
      const [trace] = await Promise.all([
        fetch(lane.element.dataset.trace).then((response) => {
          if (!response.ok) throw new Error("Could not load LIBERO trace");
          return response.json();
        }),
        mediaReady(lane.video),
      ]);
      lane.timeline = buildTimeline(trace);
      lane.element.querySelector("[data-total]").textContent = lane.timeline.steps;
    }));
    horizon = Math.max(...lanes.map((lane) => lane.timeline.total));
    status.textContent = `Decode stalls: ${(lanes[0].timeline.stallTotal / 1000).toFixed(2)} s vs ${(lanes[1].timeline.stallTotal / 1000).toFixed(2)} s`;
    ready = true;
    playButton.disabled = false;
    restartButton.disabled = false;
    paint(0);
    syncPlayback();
  } catch (error) {
    document.documentElement.classList.add("load-error");
    status.textContent = "Animation unavailable. Please reload.";
    console.error("FlashVLA animation:", error);
  }
}

init();
