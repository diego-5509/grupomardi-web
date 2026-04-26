/* ═══════════════════════════════════════════════════
   GMD AGENCIA CREATIVA — Main JS
   GSAP · ScrollTrigger · Lenis · Cursor follower
   ═══════════════════════════════════════════════════ */

/* ── 0. SCROLL RESTORATION FIX ──────────────────── */
/*
   Browsers remember scroll position between reloads.
   Force every load/refresh to start at the very top
   so the hero is always the first thing users see.
*/
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);


/* ── 1. GSAP PLUGIN REGISTRATION ────────────────── */
gsap.registerPlugin(ScrollTrigger);


/* ── 2. LENIS SMOOTH SCROLL ─────────────────────── */
/*
   Lenis intercepts native scroll and replaces it with
   a buttery momentum-based version. We pipe its RAF
   callback into GSAP's ticker so ScrollTrigger stays
   perfectly in sync with smooth-scrolled positions.
*/
const lenis = new Lenis({ wheelMultiplier: 0.85, lerp: 0.1 });
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0); // Prevents GSAP from "catching up" after tab blur


/* ── 3. NAVBAR — scroll class ────────────────────── */
/*
   A simple IntersectionObserver on the hero section
   adds .scrolled to the navbar once the user has
   scrolled past the hero. CSS handles the blur/bg.
*/
const navbar = document.getElementById('navbar');
ScrollTrigger.create({
  start: '+=80',
  onEnter:     () => navbar.classList.add('scrolled'),
  onLeaveBack: () => navbar.classList.remove('scrolled'),
});


/* ── 4. LOGO MORPH ANIMATION (hero → navbar) ────────
   ─────────────────────────────────────────────────
   Strategy:
   · #hero-logo-fixed is position:fixed at top:24px left:48px
     — exactly where the nav-logo slot is in the navbar.
   · transform-origin is set to "top left" so scaling keeps
     the top-left corner anchored: no x/y translation needed.
   · #nav-logo-img is invisible (visibility:hidden) but has a
     measured width that defines the target scale.
   · ScrollTrigger with scrub:1.5 scales the logo from 1 → target
     as the user scrolls through the hero.
   · Logo labels fade out early in the scroll.
*/
function initLogoMorphAnimation() {
  const heroWrap = document.getElementById('hero-logo-fixed');
  const heroImg  = document.getElementById('hero-logo-img');
  const navImg   = document.getElementById('nav-logo-img');
  const labels   = document.getElementById('hero-logo-labels');

  requestAnimationFrame(() => {
    const heroW = heroImg.offsetWidth;
    const navW  = navImg.offsetWidth || 100;
    const scale = navW / heroW;

    // Scale logo from hero size → nav size, anchored top-left
    gsap.to(heroWrap, {
      scale,
      transformOrigin: 'top left',
      ease: 'none',
      scrollTrigger: {
        trigger: '#hero',
        start: 'top top',
        end: '+=600',
        scrub: 1.5,
      },
    });

    // Labels fade out in the first quarter of the scroll
    if (labels) {
      gsap.to(labels, {
        opacity: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: '#hero',
          start: 'top top',
          end: '+=220',
          scrub: 1,
        },
      });
    }
  });
}


/* ── 5. WORD SPLITTER UTILITY ────────────────────── */
/*
   Wraps every word in a two-layer span:
     <span class="word-mask">   ← overflow:hidden clip
       <span class="word-inner">word</span>  ← GSAP translates Y
     </span>
   Preserves <br> tags for multi-line headings.
*/
function splitWords(el) {
  const lines = el.innerHTML.split(/<br\s*\/?>/gi);
  el.innerHTML = lines
    .map((line) =>
      line
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map(
          (w) =>
            `<span class="word-mask"><span class="word-inner">${w}</span></span>`
        )
        .join('&nbsp;')
    )
    .join('<br>');
  return el.querySelectorAll('.word-inner');
}


/* ── 6. PAGE-LOAD ANIMATION ──────────────────────── */
/*
   Fires once on DOMContentLoaded (after fonts are ready).
   Staggers: label → hero words → sub → cta → scroll hint.
   All elements start opacity:0 via CSS.
*/
function initPageLoad() {
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });

  const heroWords = splitWords(document.querySelector('.hero-heading'));

  tl
    // Hero logo fades in from above (CSS starts it at opacity:0)
    .fromTo('#hero-logo-fixed', { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out' }, 0)
    // Logo labels fade in
    .from('#hero-logo-labels', { opacity: 0, duration: 0.8, ease: 'power2.out' }, 0.3)
    // Nav links stagger down
    .from('.nav-cta', { y: -16, opacity: 0, duration: 1, stagger: 0.06, ease: 'power3.out' }, 0.15)

    // Hero label
    .to('.hero-label', { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }, 0.55)
    .from('.hero-label', { y: 14 }, 0.55)

    // Headline words reveal
    .from(heroWords, { yPercent: 115, duration: 1.5, stagger: 0.045 }, 0.7)
    .to('.hero-heading', { opacity: 1, duration: 0 }, 0.7)

    // Sub-copy (left column)
    .to('.hero-sub', { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }, 1.1)
    .from('.hero-sub', { y: 22 }, 1.1)

    // CTA arrow link
    .to('.hero-cta', { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }, 1.3)
    .from('.hero-cta', { y: 16 }, 1.3)

    // Scroll indicator
    .to('.scroll-hint', { opacity: 1, duration: 1 }, 1.7);
}


/* ── 7. SCROLL REVEAL — HEADINGS ─────────────────── */
/*
   Every element with .reveal-heading or .reveal-heading-dark
   gets its words split and revealed word-by-word as it
   enters the viewport. toggleActions:"play none none none"
   means the animation only plays once (no reverse).
*/
function initHeadingReveals() {
  const ease = 'expo.out';

  ['reveal-heading', 'reveal-heading-dark'].forEach((cls) => {
    document.querySelectorAll(`.${cls}`).forEach((el) => {
      const words = splitWords(el);
      gsap.from(words, {
        yPercent: 115,
        duration: 1.3,
        stagger: 0.04,
        ease,
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          toggleActions: 'play none none none',
        },
      });
    });
  });
}


/* ── 8. SCROLL REVEAL — MISC ELEMENTS ────────────── */
function initMiscReveals() {
  // Section labels
  document.querySelectorAll('.section-label').forEach((el) => {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 90%' },
    });
    gsap.set(el, { y: 12 });
  });

  // Body text blocks
  document.querySelectorAll('.reveal-text').forEach((el) => {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 85%' },
    });
    gsap.set(el, { y: 28 });
  });

  // Capability rows — staggered fade-up on scroll
  document.querySelectorAll('.cap-row').forEach((row, i) => {
    gsap.from(row, {
      opacity: 0,
      y: 20,
      duration: 0.7,
      ease: 'power3.out',
      scrollTrigger: { trigger: row, start: 'top 88%' },
    });
  });

  // CTA button in footer
  gsap.to('.cta-btn', {
    opacity: 1,
    y: 0,
    duration: 0.9,
    ease: 'power3.out',
    scrollTrigger: { trigger: '.cta-btn', start: 'top 90%' },
  });
  gsap.set('.cta-btn', { y: 20 });
}


/* ── 9. IMAGE PARALLAX REVEALS ────────────────────── */
/*
   About image:
   · Outer clip (.about-img-clip) has overflow:hidden.
   · The image starts translateY(8%) opacity:0.
   · On scroll enter → fade + translate to 0 (one-shot).
   · A separate ScrollTrigger scrubs yPercent from 0 → -12
     as the section passes through the viewport (parallax).

   Capability images:
   · Same pattern: image is 115% tall, scrubs -12% Y.
*/
function initImageParallax() {
  // ─ About image ─
  const aboutImg = document.querySelector('.about-img');
  if (aboutImg) {
    // One-shot reveal
    gsap.to(aboutImg, {
      opacity: 1,
      y: 0,
      duration: 1.4,
      ease: 'expo.out',
      scrollTrigger: {
        trigger: '.about-img-clip',
        start: 'top 80%',
        toggleActions: 'play none none none',
      },
    });

    // Continuous parallax (scrub)
    gsap.to(aboutImg, {
      yPercent: -12,
      ease: 'none',
      scrollTrigger: {
        trigger: '.about-img-clip',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1,
      },
    });
  }

}


/* ── 10. CLIENTS MARQUEE ─────────────────────────────
   Two rows moving in opposite directions.
   Row 1 (left): x: 0 → -setW, repeat.
   Row 2 (right): x: -setW → 0, repeat.
   Both rows react to Lenis scroll velocity:
   - scrolling down: row1 accelerates, row2 decelerates (and vice versa).
*/
function initClientsMarquee() {
  const row1 = document.getElementById('marquee-row-1');
  const row2 = document.getElementById('marquee-row-2');
  if (!row1 || !row2) return;

  const setW1 = row1.querySelector('.marquee-set').offsetWidth;
  const setW2 = row2.querySelector('.marquee-set').offsetWidth;

  const tl1 = gsap.to(row1, {
    x: -setW1,
    ease: 'none',
    duration: 30,
    repeat: -1,
  });

  // Row 2 starts at -setW so the loop jump is seamless going right
  gsap.set(row2, { x: -setW2 });
  const tl2 = gsap.to(row2, {
    x: 0,
    ease: 'none',
    duration: 30,
    repeat: -1,
  });

  lenis.on('scroll', ({ velocity }) => {
    const dir   = velocity > 0 ? 1 : -1;
    const mag   = Math.min(Math.abs(velocity) * 0.09, 2.5);
    const boost = 1 + mag;
    const slow  = Math.max(1 - mag * 0.4, 0.2);

    // Row 1 speeds up scrolling down, slows scrolling up
    tl1.timeScale(dir > 0 ? boost : slow);
    gsap.to(tl1, { timeScale: 1, duration: 1.6, ease: 'power2.out', overwrite: 'auto' });

    // Row 2 does the opposite
    tl2.timeScale(dir > 0 ? slow : boost);
    gsap.to(tl2, { timeScale: 1, duration: 1.6, ease: 'power2.out', overwrite: 'auto' });
  });
}


/* ── 11. HAMBURGER / MOBILE NAV ──────────────────────
   GSAP animates the overlay in/out.
   Each link staggers in from below.
   Lenis pauses while menu is open.
*/
function initHamburger() {
  const btn    = document.getElementById('hamburger');
  const panel  = document.getElementById('mobile-nav');
  const links  = panel.querySelectorAll('.mobile-nav-link');
  if (!btn || !panel) return;

  let isOpen = false;

  /*
     Bug fix: `.mobile-nav-link` had `opacity:0` in CSS, so GSAP's `.from()`
     was animating FROM opacity:0 TO opacity:0 — invisible. The CSS opacity is
     now removed; links default to opacity:1 so `.fromTo()` correctly
     transitions from the hidden state to fully visible.

     Z-index fix: #mobile-nav is z-9500. The navbar (z-50 via Tailwind) must
     be raised above the panel while it's open so the hamburger stays clickable.
  */
  const openTl = gsap.timeline({ paused: true })
    .to(panel, { opacity: 1, visibility: 'visible', duration: 0.45, ease: 'power3.out' }, 0)
    .fromTo(
      links,
      { y: 28, opacity: 0 },
      { y: 0,  opacity: 1, duration: 0.55, stagger: 0.07, ease: 'power3.out' },
      0.1,
    );

  const closePanel = () => {
    isOpen = false;
    btn.setAttribute('aria-expanded', 'false');
    panel.setAttribute('aria-hidden', 'true');
    panel.classList.remove('open');
    navbar.style.zIndex = '';   // restore navbar z-index
    lenis.start();
    gsap.to(panel, {
      opacity: 0, duration: 0.3, ease: 'power3.in',
      onComplete: () => { panel.style.visibility = 'hidden'; },
    });
  };

  btn.addEventListener('click', () => {
    isOpen = !isOpen;
    btn.setAttribute('aria-expanded', String(isOpen));
    panel.setAttribute('aria-hidden', String(!isOpen));
    panel.classList.toggle('open', isOpen);

    if (isOpen) {
      navbar.style.zIndex = '9600';  // float navbar above the nav panel
      lenis.stop();
      openTl.restart();
    } else {
      closePanel();
    }
  });

  // Close when a link is tapped
  links.forEach((link) => link.addEventListener('click', closePanel));
}


/* ── 12. CAPABILITY IMAGE INTERACTIONS ───────────────
   Two completely different behaviours depending on device:

   DESKTOP — Mouse-follow floating gallery
   · A fixed overlay (#cap-image-follower) holds up to 3
     image cards. Each card uses GSAP quickTo to chase the
     cursor at a different lag speed, producing a natural
     trailing-deck effect as the mouse sweeps across a row.
   · Rotations are baked in CSS so the deck always looks
     scattered — GSAP only moves x/y/opacity/scale.
   · Images are shown at their natural aspect ratio (no crop).

   MOBILE — ScrollTrigger peek deck
   · Each cap-row has an .img-stack below its body text.
   · Cards start stacked at left:0, hidden.
   · On scroll enter they "deal" left→right with staggered
     timing (expo.out), like spreading a hand of cards.
   · overflow:visible on .cap-row lets them peek past the
     row boundary for the "asomar" effect.
*/
function initCapabilityStacks() {
  const cap = document.getElementById('capabilities');
  if (!cap) return;

  if (window.innerWidth < 768) {
    initMobileStackedReveal(cap);
    return;
  }

  /* ── Desktop: floating mouse-follow gallery ─────── */

  /*
     Three slots, each with a unique:
     · offsetX/Y  — position relative to the live cursor
     · duration   — quickTo lag (shorter = snappier / front)
     · rotate     — permanent tilt baked at creation
     · zIndex     — depth ordering (3 = front)
  */
  // Offsets sized for 278×278 cards — cluster floats 175-325px above cursor
  const SLOT_CONFIG = [
    { offsetX:   20, offsetY: -300, duration: 0.40, rotate:  2, zIndex: 3 },
    { offsetX: -140, offsetY: -250, duration: 0.68, rotate: -6, zIndex: 2 },
    { offsetX:  190, offsetY: -175, duration: 0.96, rotate:  9, zIndex: 1 },
  ];

  // Build the fixed overlay container once
  const follower = document.createElement('div');
  follower.id = 'cap-image-follower';
  document.body.appendChild(follower);

  // Create each card slot with its own quickTo setters
  const slots = SLOT_CONFIG.map(({ offsetX, offsetY, duration, rotate, zIndex }) => {
    const el  = document.createElement('div');
    const img = document.createElement('img');
    el.className    = 'follower-slot';
    el.style.zIndex = zIndex;
    img.alt = '';
    el.appendChild(img);
    follower.appendChild(el);

    // Park off-screen; never start at 0,0 to avoid a flash
    gsap.set(el, { x: -999, y: -999, opacity: 0, rotate, scale: 0.85 });

    return {
      el, img, offsetX, offsetY,
      xTo: gsap.quickTo(el, 'x', { duration, ease: 'power3' }),
      yTo: gsap.quickTo(el, 'y', { duration, ease: 'power3' }),
    };
  });

  // ── Show / hide helpers ─────────────────────────────
  const showSlots = (srcs) => {
    srcs.slice(0, slots.length).forEach((src, i) => {
      slots[i].img.src = src;
      gsap.to(slots[i].el, {
        opacity: 1, scale: 1,
        duration: 0.36, ease: 'power3.out', delay: i * 0.07,
      });
    });
    // Hide any slots not needed by this row
    for (let i = srcs.length; i < slots.length; i++) {
      gsap.to(slots[i].el, { opacity: 0, scale: 0.85, duration: 0.22 });
    }
  };

  const hideSlots = () => {
    slots.forEach(({ el }) =>
      gsap.to(el, { opacity: 0, scale: 0.85, duration: 0.28, ease: 'power3.in' })
    );
  };

  // ── Row hover: swap images per row ─────────────────
  cap.querySelectorAll('.cap-row').forEach((row) => {
    // Read image src attributes from the hidden .img-stack elements
    const srcs = Array.from(row.querySelectorAll('.img-stack-item img'))
                      .map((img) => img.getAttribute('src'));

    row.addEventListener('mouseenter', () => showSlots(srcs));
    row.addEventListener('mouseleave', hideSlots);
  });

  // Hide follower when pointer leaves the section entirely
  cap.addEventListener('mouseleave', hideSlots);

  // ── Cursor tracking: update all slots each frame ───
  cap.addEventListener('mousemove', ({ clientX: cx, clientY: cy }) => {
    slots.forEach(({ xTo, yTo, offsetX, offsetY }) => {
      xTo(cx + offsetX);
      yTo(cy + offsetY);
    });
  });
}


/* ── Mobile card-deck reveal (called from initCapabilityStacks) ──
   Each card has its own ScrollTrigger — fires the moment that
   specific card enters the viewport, so the user reveals them
   one at a time simply by scrolling down.

   Rotations are baked at init and preserved throughout (GSAP
   only animates y / opacity / scale on enter/leave).
   CSS handles horizontal stagger (L / R / center) via nth-child
   margin-left — GSAP doesn't touch x, so no conflict.
*/
function initMobileStackedReveal(cap) {
  // Final resting states: each card lands at a unique rotation + offset
  // creating the "photos tossed on a table" pile feel
  // CSS anchors each card left / right / center — GSAP only adds rotation + subtle y
  const PILE_STATES = [
    { rotation: -9, x: 0, y:   4 },  // card 1: left anchor, tilts left
    { rotation:  8, x: 0, y:  -4 },  // card 2: right anchor, tilts right
    { rotation: -3, x: 0, y:   8 },  // card 3: center anchor, slight tilt
  ];

  cap.querySelectorAll('.cap-row').forEach((row) => {
    const items = Array.from(row.querySelectorAll('.img-stack-item'));
    if (!items.length) return;

    // Park every card: hidden, below its resting spot (CSS handles left/right)
    items.forEach((item, i) => {
      const s = PILE_STATES[i] ?? PILE_STATES[0];
      gsap.set(item, {
        opacity:  0,
        scale:    0.78,
        rotation: s.rotation,
        x:        0,
        y:        s.y + 44,
      });
    });

    // Row-based trigger — all three cards fire at different scroll depths
    // within the SAME row element so the pile stays in one zone.
    items.forEach((item, i) => {
      const s        = PILE_STATES[i] ?? PILE_STATES[0];
      const startPct = 78 - i * 22;  // card 0 → 78%, card 1 → 56%, card 2 → 34%

      ScrollTrigger.create({
        trigger: row,
        start:   `top ${startPct}%`,
        onEnter: () => {
          gsap.to(item, {
            opacity:  1,
            scale:    1,
            x:        s.x,
            y:        s.y,
            duration: 0.7,
            ease:     'back.out(1.5)',
          });
        },
        onLeaveBack: () => {
          gsap.to(item, {
            opacity:  0,
            scale:    0.78,
            x:        0,
            y:        s.y + 44,
            duration: 0.3,
            ease:     'power2.in',
          });
        },
      });
    });
  });
}


/* ── 13. HERO TRAIL EFFECT (desktop only) ────────────
   On mousemove over #hero, spawn a small image card at
   the cursor position. GSAP animates it: scale in quickly,
   then float upward while fading out, then remove from DOM.
   Throttled to ~120ms to avoid DOM flooding.
*/
function initHeroTrail() {
  if (window.innerWidth < 768) return;
  const hero = document.getElementById('hero');
  if (!hero) return;

  const IMAGES = [
    'Imagenes Pagina/00 Header/PRESENTACION-GMD-2025-02.png',
    'Imagenes Pagina/00 Header/PRESENTACION-GMD-2025-03.png',
    'Imagenes Pagina/00 Header/PRESENTACION-GMD-2025-04.png',
    'Imagenes Pagina/00 Header/PRESENTACION-GMD-2025-05.png',
    'Imagenes Pagina/00 Header/PRESENTACION-GMD-2025-06.png',
    'Imagenes Pagina/00 Header/PRESENTACION-GMD-2025-07.png',
    'Imagenes Pagina/00 Header/PRESENTACION-GMD-2025-08.png',
    'Imagenes Pagina/00 Header/PRESENTACION-GMD-2025-09.png',
    'Imagenes Pagina/00 Header/PRESENTACION-GMD-2025-10.png',
  ];

  const CARD_W   = 260;   // px wide (+20% again from 216) — natural height, no crop
  const THROTTLE = 140;   // ms between spawns
  const FLOAT_PX = 200;   // how far the card drifts upward while fading

  let lastSpawn = 0;
  let lastIndex = -1;

  // Pick a random image, never the same twice in a row
  const pickImage = () => {
    let idx;
    do { idx = Math.floor(Math.random() * IMAGES.length); } while (idx === lastIndex);
    lastIndex = idx;
    return IMAGES[idx];
  };

  const spawnCard = (cx, cy) => {
    const now = performance.now();
    if (now - lastSpawn < THROTTLE) return;
    lastSpawn = now;

    const card = document.createElement('div');
    card.className = 'trail-card';

    const img = document.createElement('img');
    img.src = pickImage();
    img.alt = '';
    card.appendChild(img);

    // Slight random jitter so consecutive cards don't perfectly overlap
    const jx  = (Math.random() - 0.5) * 32;
    const jy  = (Math.random() - 0.5) * 20;
    const rot = (Math.random() - 0.5) * 16; // ±8°

    // Position card centred on cursor; y offset shifted up so card sits above cursor
    gsap.set(card, {
      width:   CARD_W,
      x:       cx - CARD_W / 2 + jx,
      y:       cy - 80 + jy,   // 80px above cursor centre — natural height fills downward
      rotate:  rot,
      scale:   0,
      opacity: 1,
    });

    document.body.appendChild(card);

    // Two-phase: ease in → long elegant drift upward
    gsap.timeline({ onComplete: () => card.remove() })
      .to(card, {
        scale:    1,
        duration: 0.5,          // unhurried snap-in
        ease:     'power3.out',
      })
      .to(card, {
        y:        `-=${FLOAT_PX}`,
        opacity:  0,
        scale:    0.84,
        duration: 2.4,          // slow, lingering drift — feels elegant not frantic
        ease:     'power1.inOut',
      });
  };

  hero.addEventListener('mousemove', ({ clientX, clientY }) => {
    spawnCard(clientX, clientY);
  });
}


/* ── 15. ABOUT FEATURE IMAGE PARALLAX ────────────────
   The full-width image starts at translateY(0) and drifts
   upward as the section scrolls through the viewport.
*/
function initAboutFeatureParallax() {
  const img = document.querySelector('.about-feature-img img');
  if (!img) return;
  gsap.to(img, {
    yPercent: -10,
    ease: 'none',
    scrollTrigger: {
      trigger: '.about-feature-img',
      start: 'top bottom',
      end: 'bottom top',
      scrub: 1,
    },
  });
}


/* ── 16. INIT ─────────────────────────────────────── */
document.fonts.ready.then(() => {
  initLogoMorphAnimation();
  initPageLoad();
  initHeadingReveals();
  initMiscReveals();
  initImageParallax();
  initClientsMarquee();
  initHamburger();
  initCapabilityStacks();
  initAboutFeatureParallax();
  initHeroTrail();

  ScrollTrigger.refresh();
});
