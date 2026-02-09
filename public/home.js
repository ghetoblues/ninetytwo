const root = document.documentElement;

let mouseX = 0.5;
let mouseY = 0.5;
let scrollY = 0;
let rafId = null;

function updateParallax() {
  const maxShift = 36;
  const x = (mouseX - 0.5) * maxShift;
  const y = (mouseY - 0.5) * maxShift - scrollY * 0.08;

  root.style.setProperty("--parallax-x", `${x.toFixed(2)}px`);
  root.style.setProperty("--parallax-y", `${y.toFixed(2)}px`);

  rafId = requestAnimationFrame(updateParallax);
}

function onPointerMove(event) {
  const x = event.clientX / window.innerWidth;
  const y = event.clientY / window.innerHeight;
  mouseX = Math.min(Math.max(x, 0), 1);
  mouseY = Math.min(Math.max(y, 0), 1);
}

function onScroll() {
  scrollY = window.scrollY || 0;
}

window.addEventListener("mousemove", onPointerMove);
window.addEventListener("touchmove", (event) => {
  const touch = event.touches && event.touches[0];
  if (!touch) return;
  onPointerMove(touch);
});
window.addEventListener("scroll", onScroll, { passive: true });

if (!rafId) {
  rafId = requestAnimationFrame(updateParallax);
}
