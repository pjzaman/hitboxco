"use client";

import { useEffect } from "react";

/**
 * Marketing landing client — port of the original
 * `marketing/index.html` to a Next.js client component. CSS lives as
 * a single embedded string (React-safe via dangerouslySetInnerHTML
 * on a <style> element); the scroll-linked canvas animation runs in
 * useEffect and tears down its listeners on unmount.
 *
 * Frame folders served from web/public/:
 *   /sequence-1/frame_0.webp … frame_215.webp   (216 frames)
 *   /sequence-2/frame_0.webp … frame_311.webp   (312 frames)
 *   /sequence-3/frame_0.webp … frame_215.webp   (216 frames)
 */

const STYLES = `
  *,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
  :root{
    --bg:#070B12;
    --surface:#0D1117;
    --raised:#161B22;
    --overlay:#1C2128;
    --aqua:#7DD8FF;
    --aqua-dim:#4BA8D4;
    --teal:#80DEEA;
    --rose:#FFAFD7;
    --text:#F0F6FC;
    --text-dim:#8B949E;
    --muted:#8B949E;
    --font:'Plus Jakarta Sans',system-ui,-apple-system,sans-serif;
  }
  html.landing-page{scroll-behavior:auto;overflow-x:clip;scrollbar-width:thin;scrollbar-color:#2D333B var(--surface)}
  body.landing-page{font-family:var(--font);background:var(--surface);color:var(--text);overflow-x:clip;-webkit-font-smoothing:antialiased}
  body.landing-page ::-webkit-scrollbar{width:6px}
  body.landing-page ::-webkit-scrollbar-track{background:var(--surface)}
  body.landing-page ::-webkit-scrollbar-thumb{background:#2D333B;border-radius:3px}
  body.landing-page ::-webkit-scrollbar-thumb:hover{background:#444C56}

  .lp-nav{position:fixed;top:0;left:0;right:0;z-index:100;padding:16px 48px;display:flex;align-items:center;justify-content:space-between;pointer-events:none;opacity:0;transform:translateY(-20px);transition:opacity .6s,transform .6s}
  .lp-nav.show{opacity:1;transform:translateY(0);pointer-events:auto}
  .lp-nav-inner{margin:0 auto;max-width:1100px;width:100%;display:flex;align-items:center;justify-content:space-between;padding:12px 24px;border-radius:9999px;background:rgba(13,17,23,.7);backdrop-filter:blur(24px);border:1px solid rgba(125,216,255,.06)}
  .lp-logo{font-size:20px;font-weight:800;letter-spacing:-1px;color:var(--aqua)}
  .lp-nav-links{display:flex;gap:28px;align-items:center}
  .lp-nav-links a{color:rgba(255,255,255,.4);text-decoration:none;font-size:13px;font-weight:500;transition:color .3s}
  .lp-nav-links a:hover{color:rgba(255,255,255,.9)}
  .lp-nav-cta{padding:8px 20px;border-radius:9999px;background:var(--aqua);color:var(--surface);font-weight:700;font-size:13px;text-decoration:none;transition:all .3s}
  .lp-nav-cta:hover{filter:brightness(1.1)}

  .scroll-section{position:relative}
  .scroll-sticky{position:sticky;top:0;height:100vh;width:100%;overflow:hidden}
  .scroll-canvas{width:100%;height:100%}
  .scroll-loader{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--surface);z-index:50}
  .loader-bar{width:192px;height:4px;background:var(--raised);border-radius:9999px;overflow:hidden}
  .loader-fill{height:100%;background:var(--aqua);border-radius:9999px;transition:width .3s}
  .loader-text{margin-top:16px;font-size:14px;color:var(--muted)}

  .beat{position:absolute;inset:0;display:flex;flex-direction:column;pointer-events:none;z-index:10;padding:32px;opacity:0;transform:translateY(30px);transition:none}
  .beat.center{align-items:center;justify-content:center;text-align:center}
  .beat.left{justify-content:center;padding-left:clamp(32px,6vw,96px)}
  .beat.right{justify-content:center;align-items:flex-end;padding-right:clamp(32px,6vw,96px);text-align:right}
  .beat h1{font-size:clamp(56px,10vw,160px);font-weight:800;letter-spacing:-4px;line-height:.95}
  .beat h2{font-size:clamp(32px,5vw,72px);font-weight:700;letter-spacing:-2px;line-height:1.05}
  .beat p{margin-top:16px;font-size:clamp(16px,1.5vw,22px);color:rgba(255,255,255,.4);max-width:560px;line-height:1.6}
  .beat .subtitle{margin-top:24px}
  .text-gradient{background:linear-gradient(135deg,var(--aqua) 0%,var(--teal) 40%,var(--rose) 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
  .text-aqua{color:var(--aqua)}
  .text-teal{color:var(--teal)}
  .text-rose{color:var(--rose)}

  .scroll-hint{position:absolute;bottom:32px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:8px;z-index:20;transition:opacity .3s}
  .scroll-hint span{font-size:12px;color:rgba(255,255,255,.3);letter-spacing:3px;text-transform:uppercase}
  .scroll-mouse{width:20px;height:32px;border-radius:9999px;border:1px solid rgba(255,255,255,.15);display:flex;align-items:flex-start;justify-content:center;padding-top:6px}
  .scroll-dot{width:4px;height:6px;border-radius:9999px;background:var(--aqua);animation:scroll-bob 1.5s infinite ease-in-out}
  @keyframes scroll-bob{0%,100%{transform:translateY(0);opacity:1}50%{transform:translateY(8px);opacity:.3}}

  .content-section{padding:clamp(80px,10vw,128px) clamp(24px,4vw,48px);position:relative}
  .lp-container{max-width:1200px;width:100%;margin:0 auto}
  .bg-raised{background:var(--raised)}
  .bg-surface{background:var(--surface)}

  .fade-up{opacity:0;transform:translateY(50px);transition:opacity .8s cubic-bezier(.16,1,.3,1),transform .8s cubic-bezier(.16,1,.3,1)}
  .fade-up.visible{opacity:1;transform:translateY(0)}
  .fade-up.d1{transition-delay:.1s}.fade-up.d2{transition-delay:.2s}.fade-up.d3{transition-delay:.3s}.fade-up.d4{transition-delay:.4s}.fade-up.d5{transition-delay:.5s}.fade-up.d6{transition-delay:.6s}

  .section-label{font-size:12px;letter-spacing:3px;text-transform:uppercase;color:var(--aqua);font-weight:700;margin-bottom:16px}
  .section-title{font-size:clamp(32px,4vw,56px);font-weight:800;line-height:1.1;letter-spacing:-2px;margin-bottom:20px}
  .section-text{font-size:16px;color:var(--text-dim);line-height:1.75;margin-bottom:32px;max-width:560px}

  .stats-bar{display:grid;grid-template-columns:repeat(4,1fr);gap:32px;padding:48px 0}
  .stat{text-align:center}
  .stat-num{font-size:clamp(32px,4vw,52px);font-weight:800;letter-spacing:-2px;color:var(--aqua)}
  .stat-label{margin-top:4px;font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:2px;font-weight:600}

  .problem-grid{display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center}
  .pain-points{display:flex;flex-direction:column;gap:16px}
  .pain-point{display:flex;gap:16px;align-items:flex-start;padding:20px;border-radius:16px;background:rgba(125,216,255,.03);border:1px solid rgba(125,216,255,.06);transition:all .4s}
  .pain-point:hover{background:rgba(125,216,255,.06);border-color:rgba(125,216,255,.12)}
  .pain-icon{width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
  .pain-icon.red{background:rgba(255,107,107,.1);color:#FF6B6B}
  .pain-icon.amber{background:rgba(255,183,77,.1);color:#FFB74D}
  .pain-icon.gray{background:rgba(139,155,180,.1);color:var(--text-dim)}
  .pain-title{font-size:15px;font-weight:700;margin-bottom:3px}
  .pain-desc{font-size:13px;color:var(--text-dim);line-height:1.6}
  .big-number{font-size:clamp(100px,14vw,200px);font-weight:800;letter-spacing:-6px;line-height:.85;background:linear-gradient(180deg,rgba(125,216,255,.12) 0%,transparent 80%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;text-align:center}
  .big-caption{text-align:center;color:var(--text-dim);font-size:15px;margin-top:12px;font-weight:500}

  .tech-stack{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin-top:56px}
  .tech-card{padding:36px 28px;border-radius:24px;background:var(--raised);border:1px solid rgba(125,216,255,.06);text-align:center;transition:all .5s;position:relative;overflow:hidden}
  .tech-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,var(--aqua),transparent);opacity:0;transition:opacity .5s}
  .tech-card:hover::before{opacity:1}
  .tech-card:hover{transform:translateY(-4px);border-color:rgba(125,216,255,.15);background:var(--overlay)}
  .tech-icon{width:56px;height:56px;border-radius:16px;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:24px}
  .tech-icon.nfc{background:linear-gradient(135deg,rgba(125,216,255,.15),rgba(125,216,255,.05))}
  .tech-icon.chain{background:linear-gradient(135deg,rgba(128,222,234,.15),rgba(128,222,234,.05))}
  .tech-icon.evolve{background:linear-gradient(135deg,rgba(255,175,215,.15),rgba(255,175,215,.05))}
  .tech-name{font-size:17px;font-weight:700;margin-bottom:8px}
  .tech-desc{font-size:13px;color:var(--text-dim);line-height:1.7}

  .eco-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:48px}
  .eco-card{position:relative;padding:32px 24px;border-radius:24px;background:var(--raised);border:1px solid transparent;transition:all .5s;overflow:hidden}
  .eco-card:hover{transform:translateY(-4px);border-color:rgba(125,216,255,.1)}
  .eco-card .glow{position:absolute;inset:0;border-radius:24px;opacity:0;transition:opacity .5s;background:radial-gradient(ellipse at 50% 0%,rgba(125,216,255,.06),transparent 70%);pointer-events:none}
  .eco-card:hover .glow{opacity:1}
  .eco-card-inner{position:relative;z-index:2}
  .eco-badge{display:inline-block;padding:4px 12px;border-radius:9999px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:16px}
  .eco-badge.aqua{background:rgba(125,216,255,.12);color:var(--aqua)}
  .eco-badge.rose{background:rgba(255,175,215,.12);color:var(--rose)}
  .eco-badge.teal{background:rgba(128,222,234,.12);color:var(--teal)}
  .eco-card h3{font-size:20px;font-weight:700;margin-bottom:8px}
  .eco-card p{font-size:14px;color:rgba(255,255,255,.45);line-height:1.7}

  .ip-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin-top:48px}
  .ip-card{padding:32px 24px;border-radius:20px;background:var(--raised);border:1px solid rgba(125,216,255,.06);text-align:center;transition:all .5s}
  .ip-card:hover{border-color:rgba(125,216,255,.12);transform:translateY(-2px)}
  .ip-num{font-size:48px;font-weight:800;letter-spacing:-2px;margin-bottom:6px}
  .ip-label{font-size:13px;color:var(--text-dim);font-weight:500}
  .moat-list{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:40px;max-width:900px;margin-left:auto;margin-right:auto}
  .moat-item{display:flex;gap:12px;align-items:flex-start;padding:14px 18px;border-radius:14px;background:var(--raised);border:1px solid rgba(125,216,255,.04)}
  .moat-check{color:var(--aqua);font-size:16px;flex-shrink:0;margin-top:1px}
  .moat-text{font-size:13px;color:var(--text-dim);line-height:1.6}
  .moat-text strong{color:var(--text);font-weight:600}

  .btn-primary{display:inline-block;padding:14px 36px;border-radius:9999px;background:var(--aqua);color:var(--surface);font-weight:700;font-size:15px;text-decoration:none;transition:all .3s;border:none;cursor:pointer}
  .btn-primary:hover{filter:brightness(1.1);transform:translateY(-1px);box-shadow:0 8px 32px rgba(125,216,255,.25)}
  .btn-ghost{display:inline-block;padding:14px 36px;border-radius:9999px;background:transparent;border:1px solid rgba(125,216,255,.25);color:var(--aqua);font-weight:600;font-size:15px;text-decoration:none;transition:all .3s;cursor:pointer}
  .btn-ghost:hover{background:rgba(125,216,255,.08);border-color:var(--aqua)}

  .lp-footer{background:var(--raised);padding:64px 48px 48px}
  .lp-footer-grid{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:48px;max-width:1100px;margin:0 auto}
  .lp-footer-brand{font-size:20px;font-weight:800;color:var(--aqua);margin-bottom:12px}
  .lp-footer-desc{font-size:14px;color:rgba(255,255,255,.35);line-height:1.7}
  .lp-footer-col h4{font-size:12px;font-weight:700;color:rgba(255,255,255,.6);text-transform:uppercase;letter-spacing:2px;margin-bottom:16px}
  .lp-footer-col a{display:block;font-size:14px;color:rgba(255,255,255,.35);text-decoration:none;margin-bottom:10px;transition:color .3s}
  .lp-footer-col a:hover{color:rgba(255,255,255,.7)}
  .lp-footer-bottom{max-width:1100px;margin:48px auto 0;padding-top:32px;border-top:1px solid rgba(255,255,255,.04);display:flex;align-items:center;justify-content:space-between}
  .lp-footer-bottom p{font-size:12px;color:rgba(255,255,255,.25)}
  .lp-footer-bottom a{font-size:12px;color:rgba(255,255,255,.25);text-decoration:none;margin-left:24px;transition:color .3s}
  .lp-footer-bottom a:hover{color:rgba(255,255,255,.5)}

  @media(max-width:900px){
    .problem-grid{grid-template-columns:1fr;gap:48px}
    .tech-stack,.eco-grid,.ip-grid{grid-template-columns:1fr 1fr}
    .stats-bar{grid-template-columns:repeat(2,1fr);gap:24px}
    .moat-list{grid-template-columns:1fr}
    .lp-footer-grid{grid-template-columns:1fr 1fr;gap:32px}
    .lp-nav{padding:12px 16px}
    .lp-nav-links a:not(.lp-nav-cta){display:none}
    .beat h1{letter-spacing:-2px}
    .beat h2{letter-spacing:-1px}
  }
  @media(max-width:600px){
    .tech-stack,.eco-grid,.ip-grid,.stats-bar{grid-template-columns:1fr}
    .lp-footer-grid{grid-template-columns:1fr}
  }
`;

export default function LandingClient() {
  useEffect(() => {
    // Apply landing-page class to <body> so the bare reset / scroll
    // styling applies. Removed on unmount so other routes don't carry
    // these styles.
    document.body.classList.add("landing-page");
    document.documentElement.classList.add("landing-page");

    type Triple = [HTMLElement | null, HTMLElement | null, HTMLElement | null, HTMLElement | null];
    interface ScrollCanvasInstance {
      update(progress: number): void;
    }

    function makeScrollCanvas(
      id: "seq1" | "seq2" | "seq3",
      seqPath: string,
      frameCount: number,
    ): ScrollCanvasInstance {
      const canvas = document.getElementById(
        "canvas" + id.slice(-1),
      ) as HTMLCanvasElement | null;
      const loader = document.getElementById("loader" + id.slice(-1));
      const fill = document.getElementById("fill" + id.slice(-1));
      const pct = document.getElementById("pct" + id.slice(-1));
      if (!canvas || !loader || !fill || !pct) {
        return { update() {} };
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) return { update() {} };

      const prefix = id.replace("seq", "s");
      const beats: Triple = [
        document.getElementById(prefix + "b1"),
        document.getElementById(prefix + "b2"),
        document.getElementById(prefix + "b3"),
        document.getElementById(prefix + "b4"),
      ];

      const images: HTMLImageElement[] = [];
      let loaded = false;
      let currentFrame = -1;
      let canvasW = 0;
      let canvasH = 0;
      let dpr = 1;
      let rafId: number | null = null;

      function sizeCanvas() {
        if (!canvas) return;
        dpr = window.devicePixelRatio || 1;
        const w = window.innerWidth;
        const h = window.innerHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + "px";
        canvas.style.height = h + "px";
        canvasW = w;
        canvasH = h;
      }

      function updateLoader(count: number) {
        const p = count / frameCount;
        if (fill) fill.style.width = p * 100 + "%";
        if (pct) pct.textContent = Math.round(p * 100) + "%";
      }

      function drawImageToCanvas(img: HTMLImageElement) {
        if (!ctx) return;
        const w = canvasW;
        const h = canvasH;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.fillStyle = "#0D1117";
        ctx.fillRect(0, 0, w, h);

        const imgW = img.naturalWidth;
        const imgH = img.naturalHeight;
        const imgAspect = imgW / imgH;
        const viewAspect = w / h;

        let drawW: number, drawH: number, drawX: number, drawY: number;
        if (imgAspect > viewAspect) {
          drawH = h;
          drawW = drawH * imgAspect;
          drawX = (w - drawW) / 2;
          drawY = 0;
        } else {
          drawW = w;
          drawH = drawW / imgAspect;
          drawX = 0;
          drawY = (h - drawH) / 2;
        }
        ctx.drawImage(img, drawX, drawY, drawW, drawH);
      }

      function drawFrame(idx: number) {
        if (idx < 0) idx = 0;
        if (idx >= frameCount) idx = frameCount - 1;
        const img = images[idx];
        if (!img || !img.naturalWidth) {
          for (let offset = 1; offset < 10; offset++) {
            const before = images[idx - offset];
            if (before && before.naturalWidth) {
              drawImageToCanvas(before);
              currentFrame = idx;
              return;
            }
            const after = images[idx + offset];
            if (after && after.naturalWidth) {
              drawImageToCanvas(after);
              currentFrame = idx;
              return;
            }
          }
          return;
        }
        drawImageToCanvas(img);
        currentFrame = idx;
      }

      function onAllLoaded() {
        loaded = true;
        if (loader) loader.style.display = "none";
        if (canvas) canvas.style.display = "block";
        drawFrame(0);
      }

      let preloadDone = 0;
      let preloadErrored = 0;
      for (let i = 0; i < frameCount; i++) {
        const img = new Image();
        img.onload = () => {
          preloadDone++;
          updateLoader(preloadDone + preloadErrored);
          if (preloadDone + preloadErrored === frameCount) onAllLoaded();
        };
        img.onerror = () => {
          preloadErrored++;
          updateLoader(preloadDone + preloadErrored);
          if (preloadDone + preloadErrored === frameCount) onAllLoaded();
        };
        img.src = "/" + seqPath + "/frame_" + i + ".webp";
        images.push(img);
      }

      sizeCanvas();
      const onResize = () => {
        sizeCanvas();
        if (loaded && currentFrame >= 0) drawFrame(currentFrame);
      };
      window.addEventListener("resize", onResize);
      // Track for cleanup via the closure
      (makeScrollCanvas as unknown as { _cleanups?: (() => void)[] })._cleanups ??= [];
      (
        makeScrollCanvas as unknown as { _cleanups: (() => void)[] }
      )._cleanups.push(() => window.removeEventListener("resize", onResize));

      return {
        update(progress: number) {
          if (!loaded) return;
          const frame = Math.min(
            frameCount - 1,
            Math.max(0, Math.floor(progress * (frameCount - 1))),
          );
          if (frame !== currentFrame) {
            if (rafId) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
              drawFrame(frame);
              rafId = null;
            });
          }
          // Beat timing — A=0–20%, B=25–45%, C=50–70%, D=75–95%
          const beatRanges: Array<[number, number, number, number]> = [
            [0.0, 0.05, 0.15, 0.2],
            [0.25, 0.3, 0.4, 0.45],
            [0.5, 0.55, 0.65, 0.7],
            [0.75, 0.8, 0.9, 0.95],
          ];
          for (let i = 0; i < beats.length; i++) {
            const el = beats[i];
            if (!el) continue;
            const [fadeIn, full, fullEnd, fadeOut] = beatRanges[i];
            let opacity = 0;
            let y = 30;
            if (progress < fadeIn) {
              opacity = 0;
              y = 30;
            } else if (progress < full) {
              const t = (progress - fadeIn) / (full - fadeIn);
              opacity = t;
              y = 30 * (1 - t);
            } else if (progress <= fullEnd) {
              opacity = 1;
              y = 0;
            } else if (progress < fadeOut) {
              const t = (progress - fullEnd) / (fadeOut - fullEnd);
              opacity = 1 - t;
              y = -20 * t;
            } else {
              opacity = 0;
              y = -20;
            }
            el.style.opacity = String(opacity);
            el.style.transform = "translateY(" + y + "px)";
          }
        },
      };
    }

    function getScrollProgress(el: HTMLElement | null): number {
      if (!el) return 0;
      const rect = el.getBoundingClientRect();
      const scrollable = el.offsetHeight - window.innerHeight;
      if (scrollable <= 0) return 0;
      const scrolled = -rect.top;
      return Math.min(1, Math.max(0, scrolled / scrollable));
    }

    const seq1El = document.getElementById("seq1");
    const seq2El = document.getElementById("seq2");
    const seq3El = document.getElementById("seq3");

    const seq1 = makeScrollCanvas("seq1", "sequence-1", 216);
    const seq2 = makeScrollCanvas("seq2", "sequence-2", 312);
    const seq3 = makeScrollCanvas("seq3", "sequence-3", 216);

    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        seq1.update(getScrollProgress(seq1El));
        seq2.update(getScrollProgress(seq2El));
        seq3.update(getScrollProgress(seq3El));

        const hint = document.getElementById("scrollHint");
        if (hint) {
          const p = getScrollProgress(seq1El);
          hint.style.opacity = String(Math.max(0, 1 - p * 8));
        }

        const nav = document.getElementById("lp-navbar");
        if (nav && seq1El) {
          const seq1Bottom = seq1El.getBoundingClientRect().bottom;
          if (seq1Bottom < 0) nav.classList.add("show");
          else nav.classList.remove("show");
        }
        ticking = false;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -30px 0px" },
    );
    document.querySelectorAll(".fade-up").forEach((el) => obs.observe(el));

    const anchorClickHandlers: Array<{ el: HTMLAnchorElement; handler: (e: Event) => void }> = [];
    document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
      const handler = (e: Event) => {
        const href = a.getAttribute("href");
        if (!href || href === "#") return;
        e.preventDefault();
        const t = document.querySelector(href);
        if (t) (t as HTMLElement).scrollIntoView({ behavior: "smooth" });
      };
      a.addEventListener("click", handler);
      anchorClickHandlers.push({ el: a, handler });
    });

    return () => {
      window.removeEventListener("scroll", onScroll);
      obs.disconnect();
      anchorClickHandlers.forEach(({ el, handler }) =>
        el.removeEventListener("click", handler),
      );
      const cleanups = (
        makeScrollCanvas as unknown as { _cleanups?: (() => void)[] }
      )._cleanups;
      if (cleanups) cleanups.forEach((c) => c());
      document.body.classList.remove("landing-page");
      document.documentElement.classList.remove("landing-page");
    };
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      {/* NAV — appears after first scroll section */}
      <nav id="lp-navbar" className="lp-nav">
        <div className="lp-nav-inner">
          <span className="lp-logo">hitbox</span>
          <div className="lp-nav-links">
            <a href="#tech-section">Technology</a>
            <a href="#ecosystem-section">Ecosystem</a>
            <a href="#investor-section">Investors</a>
            <a href="/signup" className="lp-nav-cta">
              Join Waitlist
            </a>
          </div>
        </div>
      </nav>

      {/* SEQUENCE 1 — Hero / Introduction */}
      <div className="scroll-section" id="seq1" style={{ height: "500vh" }}>
        <div className="scroll-sticky">
          <div className="scroll-loader" id="loader1">
            <div className="loader-bar">
              <div
                className="loader-fill"
                id="fill1"
                style={{ width: "0%" }}
              />
            </div>
            <p className="loader-text" id="pct1">
              0%
            </p>
          </div>
          <canvas
            className="scroll-canvas"
            id="canvas1"
            style={{ display: "none" }}
          />

          <div className="scroll-hint" id="scrollHint">
            <span>Scroll to Explore</span>
            <div className="scroll-mouse">
              <div className="scroll-dot" />
            </div>
          </div>

          <div className="beat center" id="s1b1">
            <h1 className="text-gradient">HITBOX</h1>
            <p className="subtitle">
              Collectibles that live, evolve, and invest in you
            </p>
          </div>

          <div className="beat left" id="s1b2">
            <h2 style={{ color: "rgba(255,255,255,.9)" }}>
              Not Toys.
              <br />
              <span className="text-aqua">Real Assets.</span>
            </h2>
            <p>
              Every Hitbox collectible is NFC-embedded and blockchain-verified.
              One tap proves it&apos;s authentic. One scan confirms its value.
              No fakes. No guessing.
            </p>
          </div>

          <div className="beat right" id="s1b3">
            <h2 style={{ color: "rgba(255,255,255,.9)" }}>
              Tap. Verify.
              <br />
              <span className="text-teal">Own It Forever.</span>
            </h2>
            <p>
              Embedded NFC chips link every physical item to its on-chain
              identity. Ownership history, authenticity, provenance — all in
              one tap.
            </p>
          </div>

          <div className="beat center" id="s1b4">
            <h2 style={{ color: "rgba(255,255,255,.9)" }}>
              But That&apos;s Just
              <br />
              the Beginning
            </h2>
            <p>What if your collectibles could grow?</p>
            <div style={{ marginTop: "24px" }}>
              <svg
                width="24"
                height="24"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                style={{ color: "var(--aqua)" }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* STATS BAR */}
      <section
        className="content-section bg-raised"
        style={{ paddingTop: "56px", paddingBottom: "56px" }}
      >
        <div className="lp-container">
          <div className="stats-bar">
            <div className="stat fade-up">
              <div className="stat-num">100%</div>
              <div className="stat-label">NFC Verified</div>
            </div>
            <div className="stat fade-up d1">
              <div className="stat-num">0</div>
              <div className="stat-label">Counterfeits</div>
            </div>
            <div className="stat fade-up d2">
              <div className="stat-num">15</div>
              <div className="stat-label">Patents Filed</div>
            </div>
            <div className="stat fade-up d3">
              <div className="stat-num">24/7</div>
              <div className="stat-label">On-Chain Proof</div>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="content-section bg-surface" id="problem-section">
        <div className="lp-container">
          <div className="problem-grid">
            <div>
              <div className="section-label fade-up">The Problem</div>
              <h2 className="section-title fade-up d1">
                Collectibles Have Been
                <br />
                Stuck in the Past
              </h2>
              <p className="section-text fade-up d2">
                Traditional collectibles are static, unverifiable, and
                isolated. Counterfeits flood the market. Value is guesswork.
                And once you buy something — it never changes.
              </p>
              <div className="pain-points fade-up d3">
                <div className="pain-point">
                  <div className="pain-icon red">⚠</div>
                  <div>
                    <div className="pain-title">Rampant Counterfeiting</div>
                    <div className="pain-desc">
                      No reliable way to verify if a collectible is authentic
                    </div>
                  </div>
                </div>
                <div className="pain-point">
                  <div className="pain-icon amber">⏸</div>
                  <div>
                    <div className="pain-title">Static After Purchase</div>
                    <div className="pain-desc">
                      Buy it, shelf it, forget it — zero engagement
                    </div>
                  </div>
                </div>
                <div className="pain-point">
                  <div className="pain-icon gray">↙</div>
                  <div>
                    <div className="pain-title">Unpredictable Value</div>
                    <div className="pain-desc">
                      No provenance chain, no transparent value mechanism
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="fade-up d2">
              <div className="big-number">$412B</div>
              <div className="big-caption">
                Global collectibles market — ripe for disruption
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TECH STACK */}
      <section className="content-section bg-raised" id="tech-section">
        <div className="lp-container">
          <div style={{ textAlign: "center", maxWidth: "700px", margin: "0 auto" }}>
            <div className="section-label fade-up">The Solution</div>
            <h2 className="section-title fade-up d1">
              Three Technologies.
              <br />
              One Living Ecosystem.
            </h2>
            <p
              className="section-text fade-up d2"
              style={{ margin: "0 auto", maxWidth: "640px" }}
            >
              Every Hitbox collectible is embedded with NFC hardware, backed by
              blockchain provenance, and powered by an evolution engine that
              makes your collection grow.
            </p>
          </div>
          <div className="tech-stack">
            <div className="tech-card fade-up d2">
              <div className="tech-icon nfc">📱</div>
              <div className="tech-name">NFC Authentication</div>
              <div className="tech-desc">
                Tap any collectible to instantly verify authenticity, claim
                ownership, and unlock content — no crypto wallet needed
              </div>
            </div>
            <div className="tech-card fade-up d3">
              <div className="tech-icon chain">🔗</div>
              <div className="tech-name">Blockchain Provenance</div>
              <div className="tech-desc">
                Every trade and transfer is recorded on-chain — creating an
                immutable ownership DNA that increases value over time
              </div>
            </div>
            <div className="tech-card fade-up d4">
              <div className="tech-icon evolve">✨</div>
              <div className="tech-name">Evolution Engine</div>
              <div className="tech-desc">
                Collectibles transform visually and unlock new content based on
                trades, milestones, and community activity
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEQUENCE 2 — Evolution Story */}
      <div className="scroll-section" id="seq2" style={{ height: "500vh" }}>
        <div className="scroll-sticky">
          <div className="scroll-loader" id="loader2">
            <div className="loader-bar">
              <div
                className="loader-fill"
                id="fill2"
                style={{ width: "0%" }}
              />
            </div>
            <p className="loader-text" id="pct2">
              0%
            </p>
          </div>
          <canvas
            className="scroll-canvas"
            id="canvas2"
            style={{ display: "none" }}
          />

          <div className="beat center" id="s2b1">
            <h1 style={{ color: "rgba(255,255,255,.9)" }}>They Evolve</h1>
            <p>Trade them. Watch them transform.</p>
          </div>

          <div className="beat left" id="s2b2">
            <h2 style={{ color: "rgba(255,255,255,.9)" }}>
              Trade-Driven
              <br />
              <span className="text-rose">Evolution</span>
            </h2>
            <p>
              Every trade rewrites the collectible. New visuals unlock. Rarity
              shifts. Hidden content surfaces. Your items don&apos;t sit on a
              shelf — they have a life of their own.
            </p>
          </div>

          <div className="beat right" id="s2b3">
            <h2 style={{ color: "rgba(255,255,255,.9)" }}>Ownership DNA</h2>
            <p>
              Every item carries its full history on-chain. Who held it. Where
              it&apos;s been. What it unlocked along the way. Provenance
              isn&apos;t a certificate — it&apos;s baked in.
            </p>
          </div>

          <div className="beat center" id="s2b4">
            <h2 style={{ color: "rgba(255,255,255,.9)" }}>
              Collect. Trade.
              <br />
              <span className="text-gradient">Level Up.</span>
            </h2>
            <p>The more you play, the more your collection becomes</p>
          </div>
        </div>
      </div>

      {/* ECOSYSTEM */}
      <section className="content-section bg-surface" id="ecosystem-section">
        <div className="lp-container">
          <div style={{ textAlign: "center", maxWidth: "700px", margin: "0 auto" }}>
            <div className="section-label fade-up">The Ecosystem</div>
            <h2 className="section-title fade-up d1">Every Piece Connected</h2>
            <p
              className="section-text fade-up d2"
              style={{ margin: "0 auto", maxWidth: "560px" }}
            >
              A platform that keeps collectors engaged, artists connected, and
              value compounding.
            </p>
          </div>
          <div className="eco-grid">
            <div className="eco-card fade-up d1">
              <div className="glow" />
              <div className="eco-card-inner">
                <div className="eco-badge aqua">AI-Powered</div>
                <h3>Smart Trading</h3>
                <p>
                  AI matches you with the perfect trade partner. Inventory
                  scanning, fairness scoring, and auto-trade — all built in.
                </p>
              </div>
            </div>
            <div className="eco-card fade-up d2">
              <div className="glow" />
              <div className="eco-card-inner">
                <div className="eco-badge rose">Gamified</div>
                <h3>XP Seasons</h3>
                <p>
                  Earn XP through trades, set completions, and engagement.
                  Climb the leaderboard. Unlock seasonal rewards.
                </p>
              </div>
            </div>
            <div className="eco-card fade-up d3">
              <div className="glow" />
              <div className="eco-card-inner">
                <div className="eco-badge teal">Creator-First</div>
                <h3>Artist Vaults</h3>
                <p>
                  Creators launch exclusive drops, engage verified collectors,
                  and build direct relationships — no middleman.
                </p>
              </div>
            </div>
            <div className="eco-card fade-up d4">
              <div className="glow" />
              <div className="eco-card-inner">
                <div className="eco-badge aqua">Exclusive</div>
                <h3>Rarity-Gated Access</h3>
                <p>
                  Own rare items to unlock meetups, limited drops, exclusive
                  forums, and real-world VIP perks.
                </p>
              </div>
            </div>
            <div className="eco-card fade-up d5">
              <div className="glow" />
              <div className="eco-card-inner">
                <div className="eco-badge teal">On-Chain</div>
                <h3>Ownership DNA</h3>
                <p>
                  Every trade permanently recorded. Chain of custody builds
                  prestige and verifiable value over time.
                </p>
              </div>
            </div>
            <div className="eco-card fade-up d6">
              <div className="glow" />
              <div className="eco-card-inner">
                <div className="eco-badge rose">Connected</div>
                <h3>Card-to-Playlist</h3>
                <p>
                  Your physical collection auto-generates personalized
                  playlists via Spotify and Apple Music.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEQUENCE 3 — Investment / CTA */}
      <div className="scroll-section" id="seq3" style={{ height: "500vh" }}>
        <div className="scroll-sticky">
          <div className="scroll-loader" id="loader3">
            <div className="loader-bar">
              <div
                className="loader-fill"
                id="fill3"
                style={{ width: "0%" }}
              />
            </div>
            <p className="loader-text" id="pct3">
              0%
            </p>
          </div>
          <canvas
            className="scroll-canvas"
            id="canvas3"
            style={{ display: "none" }}
          />

          <div className="beat center" id="s3b1">
            <h1 style={{ color: "rgba(255,255,255,.9)" }}>Built to Last</h1>
            <p>An economy designed for collectors</p>
          </div>

          <div className="beat left" id="s3b2">
            <h2 style={{ color: "rgba(255,255,255,.9)" }}>Tap to Trade</h2>
            <p>
              Peer-to-peer ownership transfer through NFC. No intermediary. No
              fees. Just tap your items together and the blockchain handles
              the rest.
            </p>
          </div>

          <div className="beat right" id="s3b3">
            <h2 style={{ color: "rgba(255,255,255,.9)" }}>
              Rarity Unlocks
              <br />
              <span className="text-rose">Everything</span>
            </h2>
            <p>
              Own rare items? Access presale drops, exclusive content, and VIP
              events. Your collection isn&apos;t just valuable — it&apos;s your
              key to the inner circle.
            </p>
          </div>

          <div className="beat center" id="s3b4">
            <h2
              className="text-gradient"
              style={{
                fontSize: "clamp(40px,7vw,100px)",
                letterSpacing: "-3px",
                lineHeight: ".95",
              }}
            >
              The Future
              <br />
              Collects Different
            </h2>
            <p style={{ marginTop: "24px" }}>Verified. Evolving. Yours.</p>
            <div
              style={{
                marginTop: "40px",
                display: "flex",
                gap: "16px",
                flexWrap: "wrap",
                justifyContent: "center",
                pointerEvents: "auto",
              }}
            >
              <a href="/signup" className="btn-primary">
                Join the Waitlist
              </a>
              <a href="/about" className="btn-ghost">
                Read the Whitepaper
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* INVESTOR SECTION */}
      <section className="content-section bg-raised" id="investor-section">
        <div className="lp-container">
          <div style={{ textAlign: "center", maxWidth: "700px", margin: "0 auto" }}>
            <div className="section-label fade-up">For Investors</div>
            <h2 className="section-title fade-up d1">
              Protected Technology.
              <br />
              Proven Market.
            </h2>
            <p
              className="section-text fade-up d2"
              style={{ margin: "0 auto", maxWidth: "640px" }}
            >
              A patent-protected ecosystem with technology moats that make
              replication difficult and adoption inevitable.
            </p>
          </div>
          <div className="ip-grid fade-up d3">
            <div className="ip-card">
              <div className="ip-num text-aqua">15</div>
              <div className="ip-label">Patent Applications Filed</div>
            </div>
            <div className="ip-card">
              <div className="ip-num text-teal">6</div>
              <div className="ip-label">Collectible Categories</div>
            </div>
            <div className="ip-card">
              <div className="ip-num text-rose">5</div>
              <div className="ip-label">Platforms, One Codebase</div>
            </div>
          </div>
          <div className="moat-list fade-up d4">
            <div className="moat-item">
              <div className="moat-check">✓</div>
              <div className="moat-text">
                <strong>NFC Smart Collectibles</strong> — patented
                authentication + digital unlock system
              </div>
            </div>
            <div className="moat-item">
              <div className="moat-check">✓</div>
              <div className="moat-text">
                <strong>Trade-Driven Evolution</strong> — items transform based
                on trade history
              </div>
            </div>
            <div className="moat-item">
              <div className="moat-check">✓</div>
              <div className="moat-text">
                <strong>Hybrid Gamification</strong> — XP, seasons, and reward
                tiers
              </div>
            </div>
            <div className="moat-item">
              <div className="moat-check">✓</div>
              <div className="moat-text">
                <strong>AI Trade Matching</strong> — algorithmic inventory +
                wishlist engine
              </div>
            </div>
            <div className="moat-item">
              <div className="moat-check">✓</div>
              <div className="moat-text">
                <strong>Ownership DNA</strong> — on-chain provenance that
                compounds value
              </div>
            </div>
            <div className="moat-item">
              <div className="moat-check">✓</div>
              <div className="moat-text">
                <strong>Rarity Access Control</strong> — gated features tied to
                ownership
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="lp-footer">
        <div className="lp-footer-grid">
          <div>
            <div className="lp-footer-brand">hitbox</div>
            <p className="lp-footer-desc">
              Redesigning what collectibles are. NFC-verified,
              blockchain-secured, and built to evolve.
            </p>
          </div>
          <div className="lp-footer-col">
            <h4>Platform</h4>
            <a href="/marketplace">Marketplace</a>
            <a href="/feed">Feed</a>
            <a href="/about">About</a>
            <a href="/signup">Join the Waitlist</a>
          </div>
          <div className="lp-footer-col">
            <h4>Creators</h4>
            <a href="/about">For Artists</a>
            <a href="/signup">Apply</a>
            <a href="mailto:hello@hitbox.app">Partnerships</a>
          </div>
          <div className="lp-footer-col">
            <h4>Legal</h4>
            <a href="/legal/privacy">Privacy</a>
            <a href="/legal/terms">Terms</a>
          </div>
        </div>
        <div className="lp-footer-bottom">
          <p>© 2026 Hitbox by The Zaman Group LLC. All rights reserved.</p>
          <div>
            <a href="/legal/privacy">Privacy</a>
            <a href="/legal/terms">Terms</a>
          </div>
        </div>
      </footer>
    </>
  );
}
