/* ============================================
   F1 EXPERIENCE - Scrollytelling Engine
   ============================================ */

class F1Experience {
  constructor() {
    this.frameCount = 197;
    this.frames = [];
    this.loadedCount = 0;
    this.currentFrame = 0;
    this.isReady = false;

    // DOM
    this.preloader = document.getElementById('preloader');
    this.preloaderFill = document.getElementById('preloader-fill');
    this.preloaderPercent = document.getElementById('preloader-percent');
    this.fgCanvas = document.getElementById('f1-canvas');
    this.bgCanvas = document.getElementById('ambient-canvas');
    this.fgCtx = this.fgCanvas.getContext('2d');
    this.bgCtx = this.bgCanvas.getContext('2d');

    // Panel definitions: [id, startProgress, endProgress]
    this.panels = [
      ['panel-hero',       0.00, 0.06],
      ['panel-about',      0.08, 0.14],
      ['panel-exp1',       0.16, 0.22],
      ['panel-exp2',       0.24, 0.30],
      ['panel-exp3',       0.32, 0.38],
      ['panel-exp4',       0.40, 0.46],
      ['panel-proj1',      0.48, 0.54],
      ['panel-proj2',      0.56, 0.62],
      ['panel-proj3',      0.64, 0.70],
      ['panel-skills',     0.72, 0.78],
      ['panel-education',  0.80, 0.86],
      ['panel-certs',      0.88, 0.94],
      ['panel-contact',    0.96, 1.00],
    ];

    this.panelElements = this.panels.map(([id]) => document.getElementById(id));

    this.init();
  }

  init() {
    this.sizeCanvases();
    this.preloadFrames();
    this.bindResize();
  }

  /* ---- Canvas Sizing ---- */

  sizeCanvases() {
    this.fgCanvas.width = window.innerWidth;
    this.fgCanvas.height = window.innerHeight;
    this.bgCanvas.width = Math.ceil(window.innerWidth * 1.1);
    this.bgCanvas.height = Math.ceil(window.innerHeight * 1.1);
  }

  /* ---- Frame Preloading ---- */

  preloadFrames() {
    for (let i = 0; i < this.frameCount; i++) {
      const img = new Image();
      const idx = String(i).padStart(6, '0');
      img.src = `assets/frame_${idx}.jpg`;
      img.onload = () => this.onFrameLoaded();
      img.onerror = () => this.onFrameLoaded();
      this.frames.push(img);
    }
  }

  onFrameLoaded() {
    this.loadedCount++;
    const pct = Math.round((this.loadedCount / this.frameCount) * 100);
    this.preloaderFill.style.width = pct + '%';
    this.preloaderPercent.textContent = pct + '%';

    if (this.loadedCount >= this.frameCount) {
      this.onAllLoaded();
    }
  }

  onAllLoaded() {
    this.isReady = true;
    this.preloader.classList.add('hidden');
    this.renderFrame(0);
    this.initScrollEngine();
  }

  /* ---- Rendering ---- */

  renderFrame(index) {
    const img = this.frames[index];
    if (!img || !img.complete || img.naturalWidth === 0) return;
    this.currentFrame = index;
    this.drawCover(this.fgCtx, this.fgCanvas, img);
    this.drawCover(this.bgCtx, this.bgCanvas, img);
  }

  drawCover(ctx, canvas, img) {
    const cw = canvas.width;
    const ch = canvas.height;
    const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
  }

  /* ---- Scroll Engine ---- */

  initScrollEngine() {
    // Lenis smooth scroll
    this.lenis = new Lenis({
      lerp: 0.07,
      smoothWheel: true,
    });

    this.lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => this.lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    const self = this;

    // Frame scrubbing
    ScrollTrigger.create({
      trigger: '#f1-hero',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.5,
      onUpdate(st) {
        const progress = st.progress;

        // Spread all frames across the full scroll
        const idx = Math.round(progress * (self.frameCount - 1));
        if (idx !== self.currentFrame) {
          requestAnimationFrame(() => self.renderFrame(idx));
        }

        // Update panels
        self.updatePanels(progress);
      },
    });
  }

  /* ---- Panel Transitions ---- */

  updatePanels(progress) {
    const fadeZone = 0.02; // 2% scroll for fade in/out

    this.panels.forEach(([id, start, end], i) => {
      const el = this.panelElements[i];
      if (!el) return;

      let opacity = 0;
      const isFirst = i === 0;
      const isLast = i === this.panels.length - 1;

      if (isFirst) {
        // Hero: visible from start, only fades out
        if (progress <= end) {
          if (progress > end - fadeZone) {
            opacity = (end - progress) / fadeZone;
          } else {
            opacity = 1;
          }
        }
      } else if (progress >= start && progress <= end) {
        // Fade in zone
        if (progress < start + fadeZone) {
          opacity = (progress - start) / fadeZone;
        }
        // Fade out zone (skip for last panel - stays visible)
        else if (!isLast && progress > end - fadeZone) {
          opacity = (end - progress) / fadeZone;
        }
        // Fully visible
        else {
          opacity = 1;
        }
      }
      // Keep last panel visible after its start
      else if (isLast && progress >= start) {
        opacity = 1;
      }

      opacity = Math.max(0, Math.min(1, opacity));

      el.style.opacity = opacity;
      el.style.visibility = opacity > 0 ? 'visible' : 'hidden';
      el.style.transform = `translateY(${(1 - opacity) * 20}px)`;

      if (opacity > 0) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });
  }

  /* ---- Resize ---- */

  bindResize() {
    let timer;
    window.addEventListener('resize', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        this.sizeCanvases();
        if (this.isReady) this.renderFrame(this.currentFrame);
      }, 150);
    });
  }
}

/* ---- Boot ---- */
document.addEventListener('DOMContentLoaded', () => {
  new F1Experience();
});
