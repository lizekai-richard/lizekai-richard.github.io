# FlashVLA LIBERO teaser

Adapted from `src/components/content/StreamingSim.astro` and the FlashVLA blog
in https://github.com/z-lab/website/tree/dev/flashvla-blog at commit
`c11f4041be5d882e663ef8e3c6e6002624837d6e`.

The two MP4 files and their timing traces are copied unchanged from
`public/assets/projects/flashvla/`. JPEG posters are their first frames.

`timing.js` preserves the blog's schedule: decode pauses use the recorded
`step_latencies_ms` multiplied by 12; both lanes execute at 45 ms per control
step and seek frame `step / render_fps` in their source video. The schematic
keeps five streaming slots, a 10-unit buffer and a six-unit executed trail.
This is a stylized explanation, not real-time playback or a new benchmark.

`index.html?teaser=1` is the compact, looping homepage view. `index.html` is
the expanded view. Playback pauses when hidden or scrolled out of view;
visitors can pause manually, and reduced-motion preferences disable autoplay.
There are no external runtime dependencies or blog-release requirements.
