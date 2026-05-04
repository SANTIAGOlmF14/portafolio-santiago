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

  const clips = [
    'Media/Saludo.mp4',
    'Media/paz.mp4',
    'Media/bien.mp4'
  ];

  // Tiempo que la imagen permanece visible (ms)
  const DISPLAY_TIME = 10000; // 10 segundos

  // Cuánto antes del cambio se empieza a precargar el siguiente clip (ms)
  // Debe ser > tiempo de carga del video. Con archivos locales 3 s sobra.
  const PRELOAD_AHEAD = 3000;

  // Duración del crossfade (debe coincidir con la transition del CSS: 1s)
  const FADE_MS = 1000;

  let lastIndex = -1;
  let displayTimer  = null;
  let preloadTimer  = null;
  let isTransitioning = false;

  /* ── Elige un clip diferente al anterior ── */
  function pickClip() {
    if (clips.length === 1) return 0;
    let idx;
    do { idx = Math.floor(Math.random() * clips.length); } while (idx === lastIndex);
    lastIndex = idx;
    return idx;
  }

  /* ── Precarga: asigna src y espera a tener el primer frame listo ──
     Devuelve una Promise que resuelve cuando el frame está en GPU. */
  function preloadClip(src) {
    return new Promise((resolve, reject) => {
      // Si ya está cargado el mismo src, simplemente rebobina
      if (video.src.endsWith(src) && video.readyState >= 2) {
        video.currentTime = 0;
        video.addEventListener('seeked', () => resolve(), { once: true });
        return;
      }

      video.src = src;
      video.load();

      // `loadeddata` = el primer frame está disponible para mostrar
      video.addEventListener('loadeddata', function onLoaded() {
        video.removeEventListener('loadeddata', onLoaded);
        // Forzamos ir al frame 0 y esperamos `seeked` para confirmar que
        // el frame está pintado en el buffer antes de hacer el crossfade.
        video.currentTime = 0;
        video.addEventListener('seeked', () => resolve(), { once: true });
      }, { once: true });

      video.addEventListener('error', () => reject(new Error('Error cargando: ' + src)), { once: true });
    });
  }

  /* ── Ejecuta el crossfade foto → video ── */
  function crossfadeToVideo() {
    if (isTransitioning) return;
    isTransitioning = true;

    const src = clips[pickClip()];

    preloadClip(src)
      .then(() => {
        // El primer frame está listo en GPU: inicia reproducción y fade
        video.play().catch(() => {});

        // Sube el video, baja la foto — la GPU hace el blend sin parpadeo
        video.style.opacity = '1';
        photo.style.opacity = '0';

        // Espera a que termine el clip
        video.addEventListener('ended', onVideoEnded, { once: true });

        isTransitioning = false;
      })
      .catch(err => {
        console.warn('[HeroSlideshow]', err);
        isTransitioning = false;
        scheduleNext(); // reintenta el ciclo si hay error
      });
  }

  /* ── Cuando el video termina, vuelve a la foto ── */
  function onVideoEnded() {
    // Sube la foto, baja el video — la foto ya estaba renderizada, sin flash
    photo.style.opacity = '1';
    video.style.opacity = '0';

    // Pausa y rebobina sin limpiar el src (limpiar src causa el flash)
    video.pause();
    video.currentTime = 0;

    // Programa la siguiente aparición del video
    scheduleNext();
  }

  /* ── Programa el siguiente ciclo:
        - Inicia la precarga PRELOAD_AHEAD ms antes del cambio visual
        - Lanza el crossfade cuando se cumple DISPLAY_TIME ── */
  function scheduleNext() {
    // Timer de precarga: carga el video en silencio antes de mostrarlo
    preloadTimer = setTimeout(() => {
      const src = clips[pickClip()];
      // Precarga sin modificar la opacidad
      preloadClip(src).catch(() => {});
      // Ajusta lastIndex para que crossfadeToVideo use el mismo clip
      // (preloadClip ya lo habrá cargado cuando se llame)
      lastIndex = clips.indexOf(src);
    }, DISPLAY_TIME - PRELOAD_AHEAD);

    // Timer principal: dispara el crossfade
    displayTimer = setTimeout(crossfadeToVideo, DISPLAY_TIME);
  }

  // Arranca el ciclo
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
