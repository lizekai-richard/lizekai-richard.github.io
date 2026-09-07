(() => {
  const dialog = document.getElementById("publication-video-dialog");
  // Full-video links remain usable without dialog support.
  if (!dialog || typeof dialog.showModal !== "function") return;

  const player = dialog.querySelector("iframe");
  const title = dialog.querySelector("h2");

  document.querySelectorAll("[data-video-embed]").forEach((link) => {
    link.addEventListener("click", (event) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      title.textContent = link.dataset.videoTitle;
      player.title = `${link.dataset.videoTitle} — video`;
      dialog.classList.toggle("video-dialog-animation", link.dataset.videoFormat === "animation");
      dialog.showModal();
      player.src = link.dataset.videoEmbed;
    });
  });

  dialog.querySelector(".video-close").addEventListener("click", () => dialog.close());
  // Closing with the button, Escape, or the backdrop also stops playback.
  dialog.addEventListener("close", () => player.removeAttribute("src"));
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right ||
        event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
})();
