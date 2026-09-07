// Timing matches StreamingSim.astro in z-lab/website, dev/flashvla-blog.
// Pauses use measured decode latency ×12. Execution uses 45 ms per step
// in both lanes; source video frame i corresponds to control step i.
export function buildTimeline(trace, magnify = 12, frameMs = 45) {
  const steps = trace.num_steps;
  const chunkSize = trace.n_action_steps > 0 ? trace.n_action_steps : 10;
  if (!Number.isInteger(steps) || steps < 1 || !(trace.render_fps > 0) ||
      !Array.isArray(trace.step_latencies_ms) || trace.step_latencies_ms.length < steps) {
    throw new Error("Invalid LIBERO timing trace");
  }
  const segments = [];
  let total = 0;
  let stallTotal = 0;
  for (let start = 0, chunk = 0; start < steps; start += chunkSize, chunk++) {
    const count = Math.min(chunkSize, steps - start);
    const stall = trace.step_latencies_ms.slice(start, start + count).reduce((a, b) => a + b, 0);
    if (!Number.isFinite(stall) || stall < 0) throw new Error("Invalid decode latency");
    segments.push({ kind: "stall", chunk, start: total, duration: stall * magnify, step: start, count });
    total += stall * magnify;
    segments.push({ kind: "exec", chunk, start: total, duration: count * frameMs, step: start, count });
    total += count * frameMs;
    stallTotal += stall;
  }
  return { steps, chunkSize, chunks: Math.ceil(steps / chunkSize), fps: trace.render_fps, segments, total, stallTotal };
}

export function sampleTimeline(timeline, time) {
  const done = time >= timeline.total;
  const clock = Math.max(0, Math.min(time, timeline.total - .001));
  let index = 0;
  while (index + 1 < timeline.segments.length && timeline.segments[index + 1].start <= clock) index++;
  const segment = timeline.segments[index];
  const progress = segment.duration > 0 ? Math.max(0, Math.min(1, (clock - segment.start) / segment.duration)) : 1;
  const step = done ? timeline.steps : segment.step + (segment.kind === "exec" ? Math.floor(progress * segment.count) : 0);
  const frame = done ? timeline.steps - 1 : segment.kind === "stall"
    ? Math.max(0, segment.step - 1)
    : Math.min(timeline.steps - 1, step);
  return { segment, progress, step, frame, done };
}
