/* ===== CURSOR ===== */
const cursor = document.querySelector('.cursor');
const trail  = document.querySelector('.cursor-trail');
let mouseX = 0, mouseY = 0, trailX = 0, trailY = 0;

document.addEventListener('mousemove', e => {
  mouseX = e.clientX; mouseY = e.clientY;
  cursor.style.left = mouseX + 'px';
  cursor.style.top  = mouseY + 'px';
});

(function animateTrail() {
  trailX += (mouseX - trailX) * 0.18;
  trailY += (mouseY - trailY) * 0.18;
  trail.style.left = trailX + 'px';
  trail.style.top  = trailY + 'px';
  requestAnimationFrame(animateTrail);
})();

document.querySelectorAll('a, button, .skill-card, .proyecto-card').forEach(el => {
  el.addEventListener('mouseenter', () => {
    cursor.style.width = '20px'; cursor.style.height = '20px';
    trail.style.width  = '60px'; trail.style.height  = '60px';
  });
  el.addEventListener('mouseleave', () => {
    cursor.style.width = '12px'; cursor.style.height = '12px';
    trail.style.width  = '36px'; trail.style.height  = '36px';
  });
});

/* ===== PARTÍCULAS ===== */
const canvas = document.getElementById('particles-canvas');
const ctx    = canvas.getContext('2d');
canvas.width  = window.innerWidth;
canvas.height = window.innerHeight;
window.addEventListener('resize', () => {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
});

class Particle {
  constructor() { this.reset(); }
  reset() {
    this.x  = Math.random() * canvas.width;
    this.y  = Math.random() * canvas.height;
    this.size   = Math.random() * 1.5 + 0.3;
    this.speedX = (Math.random() - 0.5) * 0.4;
    this.speedY = (Math.random() - 0.5) * 0.4;
    this.opacity = Math.random() * 0.6 + 0.1;
    this.color   = Math.random() > 0.5 ? '0,245,196' : '123,97,255';
  }
  update() {
    this.x += this.speedX; this.y += this.speedY;
    if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) this.reset();
  }
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${this.color},${this.opacity})`;
    ctx.fill();
  }
}

const particles = Array.from({ length: 80 }, () => new Particle());

function drawConnections() {
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const d  = Math.sqrt(dx*dx + dy*dy);
      if (d < 120) {
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.strokeStyle = `rgba(0,245,196,${0.08*(1-d/120)})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
  }
}

(function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => { p.update(); p.draw(); });
  drawConnections();
  requestAnimationFrame(animateParticles);
})();

/* ===== NAVBAR ===== */
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
  navbar.style.background  = window.scrollY > 60 ? 'rgba(8,11,16,0.95)' : 'rgba(8,11,16,0.7)';
  navbar.style.boxShadow   = window.scrollY > 60 ? '0 4px 30px rgba(0,0,0,0.4)' : 'none';
});

/* ===== SCROLL REVEAL ===== */
new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.15 }).observe
  ? (() => {
      const obs = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
      }, { threshold: 0.15 });
      document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
    })()
  : document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));

/* ===== SMOOTH SCROLL ===== */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    const t = document.querySelector(a.getAttribute('href'));
    if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

/* ===== GLITCH TAG ===== */
const heroTag = document.querySelector('.hero-tag');
if (heroTag) {
  setInterval(() => {
    heroTag.style.textShadow = `${Math.random()*4-2}px 0 rgba(0,245,196,0.8),${Math.random()*-4+2}px 0 rgba(123,97,255,0.8)`;
    setTimeout(() => { heroTag.style.textShadow = 'none'; }, 100);
  }, 3000);
}

/* ===== TYPING EFFECT ===== */
const heroSub = document.querySelector('.hero-sub');
if (heroSub) {
  const txt = heroSub.textContent;
  heroSub.textContent = '';
  let i = 0;
  setTimeout(() => {
    const t = setInterval(() => {
      heroSub.textContent += txt[i++];
      if (i >= txt.length) clearInterval(t);
    }, 40);
  }, 900);
}

/* =====================================================================
   HERO SLIDESHOW — imagen ↔ video en bucle sin parpadeo
   ---------------------------------------------------------------
   Estrategia anti-parpadeo:

   FOTO → VIDEO
   • Se empieza a precargar el video 3 s ANTES de que expire el timer,
     así el primer frame ya está decodificado cuando llega el momento.
   • Se espera el evento `seeked` (no solo `canplay`): `seeked` garantiza
     que el frame en currentTime=0 está pintado en el buffer de la GPU,
     por lo que al hacer opacity:1 no hay negro inicial.
   • El CSS tiene will-change:opacity + transform:translateZ(0) para que
     ambos elementos vivan en su propio layer de GPU: el crossfade es un
     blend de texturas ya cargadas, sin re-pintar nada en CPU.

   VIDEO → FOTO
   • La foto siempre está en el DOM con opacity:1 debajo del video,
     así que en cuanto bajamos la opacidad del video, la foto aparece
     instantáneamente sin ningún re-render.
   • NO se limpia video.src al terminar: solo pause() + currentTime=0.
     Limpiar el src hace que el elemento vuelva a un estado vacío/negro
     justo cuando el fade empieza, causando el flash. Manteniéndolo
     cargado ese frame negro nunca aparece.
   ===================================================================== */
(function heroSlideshow() {
  const photo = document.getElementById('hero-photo');
  const video = document.getElementById('hero-video');
  if (!photo || !video) return;

  const BASE = 'https://media.githubusercontent.com/media/SANTIAGOlmF14/portafolio-santiago/main/';
  const clips = [
    BASE + 'Media/Saludo.mp4',
    BASE + 'Media/paz.mp4',
    BASE + 'Media/bien.mp4'
  ];

  // Tiempo que la foto permanece visible antes de intentar el video (ms)
  const DISPLAY_TIME  = 12000; // 12 s — da margen para la descarga remota
  // Cuánto antes de DISPLAY_TIME se empieza la precarga (ms)
  const PRELOAD_AHEAD = 9000;  // 9 s de ventana para descargar desde GitHub LFS
  // Timeout máximo de espera por `loadeddata` antes de saltarse el clip (ms)
  const LOAD_TIMEOUT  = 15000;

  let lastIndex = -1;
  let pendingSrc = null;       // src que se preloadea silenciosamente
  let isTransitioning = false;

  /* ── Elige un índice distinto al anterior ── */
  function pickIndex() {
    if (clips.length === 1) return 0;
    let idx;
    do { idx = Math.floor(Math.random() * clips.length); } while (idx === lastIndex);
    lastIndex = idx;
    return idx;
  }

  /* ── Precarga un clip: asigna src y espera el primer frame.
     Resuelve cuando readyState >= 2 (HAVE_CURRENT_DATA).
     Rechaza si hay error o se supera LOAD_TIMEOUT. ── */
  function preloadClip(src) {
    return new Promise((resolve, reject) => {
      // Ya está cargado exactamente este src → solo rebobina
      if (video.src === src && video.readyState >= 2) {
        video.currentTime = 0;
        const onSeeked = () => resolve();
        video.addEventListener('seeked', onSeeked, { once: true });
        return;
      }

      let timer = setTimeout(() => {
        video.removeEventListener('loadeddata', onData);
        video.removeEventListener('error', onErr);
        reject(new Error('[HeroSlideshow] timeout: ' + src));
      }, LOAD_TIMEOUT);

      function cleanup() { clearTimeout(timer); }

      function onData() {
        cleanup();
        video.currentTime = 0;
        video.addEventListener('seeked', () => resolve(), { once: true });
      }
      function onErr() {
        cleanup();
        reject(new Error('[HeroSlideshow] error cargando: ' + src));
      }

      video.addEventListener('loadeddata', onData, { once: true });
      video.addEventListener('error',      onErr,  { once: true });
      video.src = src;
      video.load();
    });
  }

  /* ── Crossfade foto → video ── */
  function crossfadeToVideo() {
    if (isTransitioning) return;
    isTransitioning = true;

    // Usa el clip precargado si está listo, o elige uno nuevo
    const src = (pendingSrc && video.src === pendingSrc && video.readyState >= 2)
      ? pendingSrc
      : clips[pickIndex()];
    pendingSrc = null;

    preloadClip(src)
      .then(() => {
        video.play().catch(() => {});
        video.style.opacity = '1';
        photo.style.opacity = '0';
        video.addEventListener('ended', onVideoEnded, { once: true });
        isTransitioning = false;
      })
      .catch(err => {
        console.warn(err);
        isTransitioning = false;
        scheduleNext(); // saltar este clip y volver a la foto
      });
  }

  /* ── Video terminó → vuelve a la foto ── */
  function onVideoEnded() {
    photo.style.opacity = '1';
    video.style.opacity = '0';
    video.pause();
    // NO limpiamos video.src para evitar flash negro
    scheduleNext();
  }

  /* ── Programa el próximo ciclo ── */
  function scheduleNext() {
    // Precarga silenciosa con PRELOAD_AHEAD de anticipación
    setTimeout(() => {
      const idx = pickIndex();
      pendingSrc = clips[idx];
      lastIndex  = idx;
      preloadClip(pendingSrc).catch(() => { pendingSrc = null; });
    }, DISPLAY_TIME - PRELOAD_AHEAD);

    // Dispara el crossfade al cumplirse DISPLAY_TIME
    setTimeout(crossfadeToVideo, DISPLAY_TIME);
  }

  // Arranca
  scheduleNext();
})();

/* =====================================================================
   VIDEO PRESENTACIÓN — Sección "Sobre mí"
   ===================================================================== */
(function presVideo() {
  const video        = document.getElementById('presentacion-video');
  const overlay      = document.getElementById('play-overlay');
  const controls     = document.getElementById('video-controls');
  const playBtn      = document.getElementById('play-btn');
  const pauseBtn     = document.getElementById('pause-btn');
  const muteBtn      = document.getElementById('mute-btn');
  const fsBtn        = document.getElementById('fullscreen-btn');
  const progressFill = document.getElementById('progress-fill');
  const progressTrack= document.getElementById('progress-track');
  const iconSound    = document.getElementById('icon-sound');
  const iconMuted    = document.getElementById('icon-muted');

  if (!video || !overlay) return;

  playBtn.addEventListener('click', () => {
    video.play().then(() => {
      overlay.style.display  = 'none';
      controls.style.display = 'flex';
    }).catch(err => console.error('[Presentación]', err));
  });

  pauseBtn.addEventListener('click', () => {
    if (video.paused) video.play(); else video.pause();
  });

  muteBtn.addEventListener('click', () => {
    video.muted = !video.muted;
    iconSound.style.display = video.muted ? 'none'  : 'block';
    iconMuted.style.display = video.muted ? 'block' : 'none';
  });

  fsBtn.addEventListener('click', () => {
    if (video.requestFullscreen)            video.requestFullscreen();
    else if (video.webkitRequestFullscreen) video.webkitRequestFullscreen();
  });

  video.addEventListener('timeupdate', () => {
    if (!video.duration) return;
    progressFill.style.width = (video.currentTime / video.duration * 100) + '%';
  });

  progressTrack.addEventListener('click', e => {
    const rect = progressTrack.getBoundingClientRect();
    video.currentTime = ((e.clientX - rect.left) / rect.width) * video.duration;
  });

  video.addEventListener('ended', () => {
    controls.style.display   = 'none';
    overlay.style.display    = 'flex';
    progressFill.style.width = '0%';
  });

  video.addEventListener('click', () => {
    if (video.paused) video.play(); else video.pause();
  });
})();