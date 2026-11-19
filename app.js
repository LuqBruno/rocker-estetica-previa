/* Rocker Estética — prévia v0.2 · Bruno Luque
   Motion (pacote `motion` 14.3.0, build JS em assets/motion.js). Sem Motion, a página continua completa e estática. */
(() => {
  'use strict';

  const WA = '5548920043671';
  const doc = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const desktop = matchMedia('(min-width: 900px)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const waHref = msg => `https://wa.me/${WA}?text=${encodeURIComponent(msg)}`;

  /* Links de WhatsApp com mensagem do contexto */
  document.querySelectorAll('[data-wa]').forEach(a => { a.href = waHref(a.dataset.wa); });

  /* Cabeçalho: translúcido depois do hero */
  const top = document.querySelector('[data-top]');
  const hero = document.getElementById('inicio');
  let headTick = false;
  const syncHead = () => {
    headTick = false;
    top.classList.toggle('is-solid', hero.getBoundingClientRect().bottom <= top.offsetHeight + 1);
  };
  addEventListener('scroll', () => { if (!headTick) { headTick = true; requestAnimationFrame(syncHead); } }, { passive: true });
  syncHead();

  const M = window.Motion;

  /* Menu do celular: folha que desce do botão, Esc e toque fora fecham, foco volta ao botão */
  const menuBtn = document.querySelector('[data-menu-btn]');
  const sheet = document.querySelector('[data-sheet]');
  let sheetAnim = null;
  const setMenu = open => {
    if (open === !sheet.hidden) return;
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.querySelector('.sr').textContent = open ? 'Fechar menu' : 'Abrir menu';
    sheetAnim && sheetAnim.stop();
    if (open) {
      sheet.hidden = false;
      if (M && !reduce) {
        sheetAnim = M.animate(sheet, { opacity: [0, 1], transform: ['translateY(-12px) scale(.985)', 'translateY(0px) scale(1)'] },
          { type: 'spring', bounce: 0, duration: .38 });
      }
      sheet.querySelector('a').focus({ preventScroll: true });
    } else {
      const done = () => { sheet.hidden = true; };
      if (M && !reduce) {
        sheetAnim = M.animate(sheet, { opacity: 0, transform: 'translateY(-12px) scale(.985)' }, { duration: .2, ease: [.4, 0, 1, 1] });
        sheetAnim.then(done);
      } else done();
    }
  };
  menuBtn.addEventListener('click', () => setMenu(sheet.hidden));
  sheet.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !sheet.hidden) { setMenu(false); menuBtn.focus(); } });
  document.addEventListener('pointerdown', e => {
    if (!sheet.hidden && !sheet.contains(e.target) && !menuBtn.contains(e.target)) setMenu(false);
  });
  matchMedia('(min-width: 900px)').addEventListener('change', e => { if (e.matches) setMenu(false); });

  /* Faixa de resultados: rolagem nativa com encaixe; setas andam uma foto e se apagam nas pontas */
  const track = document.querySelector('[data-reel-track]');
  const prev = document.querySelector('[data-reel-prev]');
  const next = document.querySelector('[data-reel-next]');
  if (track) {
    const items = [...track.children];
    const step = dir => {
      const mid = track.scrollLeft + track.clientWidth / 2;
      const centers = items.map(li => li.offsetLeft + li.offsetWidth / 2);
      let i = centers.findIndex(c => c > mid + 4);
      i = dir > 0 ? (i < 0 ? items.length - 1 : i) : Math.max(0, centers.filter(c => c < mid - 4).length - 1);
      track.scrollTo({ left: centers[i] - track.clientWidth / 2, behavior: reduce ? 'auto' : 'smooth' });
    };
    prev.addEventListener('click', () => step(-1));
    next.addEventListener('click', () => step(1));
    const syncBtns = () => {
      prev.disabled = track.scrollLeft < 4;
      next.disabled = track.scrollLeft > track.scrollWidth - track.clientWidth - 4;
    };
    track.addEventListener('scroll', syncBtns, { passive: true });
    addEventListener('resize', syncBtns);
    syncBtns();
  }

  if (!M) { const m = document.querySelector('[data-hero-mist]'); if (m) m.style.opacity = '0'; return; } // sem a biblioteca: tudo visível, cartela fica como lista
  doc.classList.add('motion'); // estados iniciais animados só existem quando o Motion está de fato presente

  /* ---------- Tons da página: troca em pontos discretos, por seção ---------- */
  document.querySelectorAll('main > section[data-tone]').forEach(sec => {
    M.inView(sec, () => {
      const c = sec.dataset.tone;
      if (reduce) { document.body.style.backgroundColor = c; return; }
      M.animate(document.body, { backgroundColor: c }, { duration: .8, ease: [.22, 1, .36, 1] });
    }, { amount: .35 });
  });

  /* ---------- 1. Hero: o véu se desfaz e o corredor aparece; ao rolar, a gente "entra" nele ---------- */
  const heroBg = hero.querySelector('[data-hero-bg]');
  const heroImg = hero.querySelector('.hero__img');
  const mist = hero.querySelector('[data-hero-mist]');
  const spots = [...hero.querySelectorAll('.spots i')];
  const lightSpots = k => spots.forEach((s, i) => s.classList.toggle('on', i < k));
  if (reduce) {
    lightSpots(spots.length);
  } else {
    lightSpots(0);
    // Chegada: só a foto aparece por trás do véu; texto e botão já estão legíveis desde o primeiro quadro.
    const arrive = () => {
      M.animate(mist, { opacity: 0 }, { duration: 1.6, ease: [.22, 1, .36, 1] });
      M.animate(heroImg, { transform: ['scale(1.07)', 'scale(1)'] }, { type: 'spring', bounce: 0, duration: 2.2 });
      spots.forEach((s, i) => setTimeout(() => s.classList.add('on'), 380 + i * 170)); // os spots acendem como no teto
    };
    (heroImg.decode ? heroImg.decode() : Promise.resolve()).then(arrive, arrive);
    // Rolagem: a foto avança mais devagar que o texto e se aproxima da fuga do corredor
    M.scroll(p => {
      heroBg.style.transform = `translate3d(0, ${(p * 18).toFixed(2)}%, 0) scale(${(1 + p * .1).toFixed(4)})`;
    }, { target: hero, offset: ['start start', 'end start'] });
  }

  /* ---------- 2. Manifesto: palavra a palavra, ligado à rolagem ---------- */
  const splitWords = el => {
    const out = [];
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            const s = document.createElement('span');
            s.className = 'w'; s.textContent = part; frag.appendChild(s); out.push(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el);
    return out;
  };
  const quote = document.querySelector('.manifest__quote');
  if (quote && !reduce) {
    const words = [...quote.querySelectorAll('[data-words]')].flatMap(splitWords);
    const n = words.length;
    // Cada palavra começa no laranja Rocker e assenta na tinta da página (contraste ≥ 3:1 em qualquer instante, texto grande)
    const from = [168, 46, 3];
    const to = words.map(w => getComputedStyle(w).color.match(/\d+/g).slice(0, 3).map(Number));
    const paint = p => {
      const head = p * (n + 4);
      words.forEach((w, i) => {
        const t = clamp(head - i, 0, 1);
        w.style.color = `rgb(${from.map((c, k) => Math.round(c + (to[i][k] - c) * t)).join(',')})`;
      });
    };
    paint(0);
    M.scroll(paint, { target: quote, offset: ['start .85', 'end .55'] });
  }

  /* ---------- Títulos: máscara de linha (line-mask) ---------- */
  if (!reduce) {
    document.querySelectorAll('.title[data-line] > span').forEach(span => {
      if (span.getBoundingClientRect().top < innerHeight) return; // já visível ao carregar: não esconder
      span.style.transform = 'translateY(108%)';
      const stop = M.inView(span.parentElement, () => {
        stop();
        M.animate(span, { transform: ['translateY(108%)', 'translateY(0%)'] }, { type: 'spring', bounce: 0, duration: .9 });
      }, { amount: .6 });
    });
  }

  /* ---------- 3. A cartela (fan + ix-dialog-origin + mecânica apple-design) ---------- */
  const section = document.getElementById('atendimentos');
  const stage = section.querySelector('[data-cartela]');
  const fan = section.querySelector('[data-fan]');
  const panel = section.querySelector('[data-panel]');
  const items = [...section.querySelectorAll('[data-path]')];
  const N = items.length;
  if (N) {
    section.classList.add('is-live');
    stage.hidden = false;

    const SPREAD = 84;                                   // graus entre a primeira e a última lâmina aberta
    const openA = i => -SPREAD + i * (SPREAD / (N - 1)); // -84 … 0
    const closedA = i => -2 - (N - 1 - i) * 1.6;         // pilha levemente escalonada
    const o = M.motionValue(reduce ? 1 : 0);             // abertura: 0 fechada, 1 aberta
    let selected = 0;
    let hovered = -1;
    let anim = null;

    const blades = items.map((it, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'blade';
      b.id = `tom-${it.dataset.path}`;
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-controls', 'cartela-painel');
      b.dataset.ink = it.dataset.ink;
      b.style.setProperty('--tone', it.dataset.tone);
      b.style.zIndex = String(N - i);
      b.innerHTML = `<span class="blade__n">${String(i + 1).padStart(2, '0')}</span><span class="blade__label">${it.dataset.label}</span>`;
      fan.appendChild(b);
      return { el: b, lift: M.motionValue(0), item: it };
    });
    panel.id = 'cartela-painel';
    panel.removeAttribute('aria-live');

    const render = () => {
      const v = o.get();
      blades.forEach((bl, i) => {
        const a = closedA(i) + (openA(i) - closedA(i)) * v;
        bl.el.style.transform = `rotate(${a.toFixed(3)}deg) translateX(${(bl.lift.get() * 18).toFixed(2)}px)`;
      });
    };
    o.on('change', render);
    blades.forEach(bl => bl.lift.on('change', render));

    const liftTo = () => blades.forEach((bl, i) => {
      const t = i === selected ? 1 : (i === hovered ? .45 : 0);
      if (reduce) bl.lift.set(t);
      else M.animate(bl.lift, t, { type: 'spring', bounce: 0, duration: .35 });
    });

    const openTo = (target, velocity = 0) => {
      anim && anim.stop();
      if (reduce) { o.set(target); return; }
      const flick = Math.abs(velocity) > 1.2;
      anim = M.animate(o, target, { type: 'spring', velocity, bounce: flick ? .2 : 0, duration: flick ? .55 : .6 });
    };

    const fillPanel = (i, animate) => {
      const it = items[i];
      const who = it.querySelector('.path__who');
      const title = it.querySelector('.path__title');
      const body = [...it.querySelectorAll('p:not(.path__who)')].map(p => p.outerHTML).join('');
      const fig = it.querySelector('.path__img');
      panel.style.setProperty('--tone', it.dataset.tone);
      panel.style.setProperty('--panel-bg', `color-mix(in oklab, ${it.dataset.tone} 16%, #FFF6EE)`);
      panel.setAttribute('aria-labelledby', blades[i].el.id);
      panel.innerHTML =
        (fig ? fig.outerHTML : `<span class="panel__chip" aria-hidden="true"></span>`) +
        `<h3 class="path__title">${title.innerHTML}</h3>` + `<p class="path__who">${who.textContent}</p>` + body +
        `<a class="btn btn--rk" href="${waHref(it.dataset.msg)}" target="_blank" rel="noopener">Perguntar no WhatsApp</a>`;
      if (animate && !reduce) {
        panel.style.transformOrigin = desktop.matches ? '0% 100%' : '18% 0%';
        M.animate(panel, { opacity: [.4, 1], transform: ['scale(.965) translateY(8px)', 'scale(1) translateY(0px)'] },
          { type: 'spring', bounce: 0, duration: .45 });
      }
    };

    const select = (i, { focus = false, animate = true, open = true } = {}) => {
      i = (i + N) % N;
      const changed = i !== selected;
      selected = i;
      blades.forEach((bl, k) => {
        bl.el.setAttribute('aria-selected', String(k === i));
        bl.el.tabIndex = k === i ? 0 : -1;
      });
      if (focus) blades[i].el.focus({ preventScroll: true });
      liftTo();
      if (changed || !animate) fillPanel(i, animate && changed);
      if (open && o.get() < .5) openTo(1);
    };

    // Clique/Enter numa lâmina (o arrasto suprime o clique que vem depois dele)
    let suppressClick = false;
    blades.forEach((bl, i) => {
      bl.el.addEventListener('click', () => {
        if (suppressClick) { suppressClick = false; return; }
        select(i);
      });
      bl.el.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse' && fine.matches) { hovered = i; liftTo(); } });
      bl.el.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') { hovered = -1; liftTo(); } });
    });

    // Teclado: setas movem e ativam, Home/End nas pontas
    fan.addEventListener('keydown', e => {
      const map = { ArrowUp: -1, ArrowLeft: -1, ArrowDown: 1, ArrowRight: 1 };
      if (e.key in map) { e.preventDefault(); select(selected + map[e.key], { focus: true }); }
      else if (e.key === 'Home') { e.preventDefault(); select(0, { focus: true }); }
      else if (e.key === 'End') { e.preventDefault(); select(N - 1, { focus: true }); }
    });

    // Arrasto angular 1:1 em volta do rebite, com histórico de velocidade, rubber-band, projeção e mola
    const rivet = fan.querySelector('.fan__rivet');
    const angleAt = e => {
      const r = rivet.getBoundingClientRect();
      return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180 / Math.PI;
    };
    const rubber = x => (x * .55) / (1 + .55 * Math.abs(x)); // dimensão 1, constante .55
    let drag = null;
    fan.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      anim && anim.stop();                       // interrompe a partir do valor vivo
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, a0: angleAt(e), o0: o.get(), live: false, hist: [] };
    });
    fan.addEventListener('pointermove', e => {
      if (!drag || e.pointerId !== drag.id) return;
      if (!drag.live) {
        if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 8) return; // histerese antes de assumir o arrasto
        drag.live = true;
        fan.setPointerCapture(e.pointerId);
        fan.classList.add('is-dragging');
      }
      let raw = drag.o0 + (drag.a0 - angleAt(e)) / SPREAD;
      if (raw > 1) raw = 1 + rubber(raw - 1);
      else if (raw < 0) raw = -rubber(-raw);
      o.set(raw);
      const t = performance.now();
      drag.hist.push([t, raw]);
      while (drag.hist.length > 2 && t - drag.hist[0][0] > 100) drag.hist.shift();
    });
    const release = (e, cancelled) => {
      if (!drag || e.pointerId !== drag.id) return;
      const d = drag; drag = null;
      fan.classList.remove('is-dragging');
      if (!d.live) return; // foi um toque: o clique cuida
      suppressClick = true;
      setTimeout(() => { suppressClick = false; }, 0);
      let v = 0;
      if (!cancelled && d.hist.length > 1) {
        const [t0, a] = d.hist[0]; const [t1, b] = d.hist[d.hist.length - 1];
        v = t1 > t0 ? (b - a) / ((t1 - t0) / 1000) : 0; // aberturas por segundo
      }
      const dec = .998;
      const projected = o.get() + (v / 1000) * dec / (1 - dec);
      openTo(projected >= .5 ? 1 : 0, v);
    };
    fan.addEventListener('pointerup', e => release(e, false));
    fan.addEventListener('pointercancel', e => release(e, true));

    // Estado inicial e abertura ao entrar na tela
    blades.forEach(bl => bl.el.setAttribute('aria-selected', 'false'));
    select(0, { animate: false, open: false });
    if (!reduce) {
      o.set(0); render();
      M.inView(fan, () => { if (o.get() < .5 && !drag) setTimeout(() => openTo(1), 180); }, { amount: .55 });
    } else render();
  }

  /* ---------- 3. Faixa de resultados: barra de progresso e a foto central em foco ---------- */
  if (track) {
    const bar = document.querySelector('[data-reel-progress]');
    M.scroll(p => { bar.style.transform = `scaleX(${(.15 + .85 * p).toFixed(4)})`; }, { container: track, axis: 'x' });
    if (!reduce) {
      [...track.querySelectorAll('figure')].forEach(fig => {
        M.scroll(p => {
          const d = Math.abs(p - .5) * 2; // 0 no centro, 1 nas bordas
          fig.style.transform = `scale(${(1 - .05 * d).toFixed(4)})`;
          fig.style.opacity = (1 - .3 * d).toFixed(3);
        }, { container: track, target: fig.parentElement, axis: 'x', offset: ['start end', 'end start'] });
      });
    }
  }

  /* ---------- 4. Amostras das roupas cedem à foto (ed-swatch-story) ---------- */
  const swPhoto = document.querySelector('[data-swatch]');
  if (swPhoto && !reduce) {
    const bars = [...swPhoto.querySelectorAll('.swatches i')];
    M.scroll(p => {
      bars.forEach((b, i) => {
        const local = clamp((p - i * .07) / .5);
        b.style.transform = `scaleY(${(1 - ease(local)).toFixed(4)})`;
      });
    }, { target: swPhoto, offset: ['start .95', 'center .55'] });
  }

  /* ---------- 5. Fachada: do laranja à cor (duotone) ---------- */
  const duo = document.querySelector('[data-duotone] .duo');
  if (duo && !reduce) {
    M.scroll(p => { duo.style.opacity = (.92 * (1 - ease(clamp(p)))).toFixed(3); },
      { target: duo.parentElement, offset: ['start .9', 'center .5'] });
  }
})();
