(() => {
  'use strict';
  const config = window.TENNIS_CONFIG;
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
  const safeUrl = (value, httpsOnly = false) => {
    if (!value) return '';
    if (!httpsOnly && /^data:(?:image\/(?:jpeg|png|webp|svg\+xml)|video\/mp4);base64,[A-Za-z0-9+/=]+$/.test(value)) return value;
    try {
      const url = new URL(value, location.href);
      return (httpsOnly ? url.protocol === 'https:' : ['https:', 'http:', 'file:'].includes(url.protocol)) ? url.href : '';
    } catch { return ''; }
  };

  $$('[data-asset]').forEach(img => {
    const src = safeUrl(config.assets[img.dataset.asset]);
    if (src) img.src = src;
  });
  $('#interior-pages').classList.add('mockup-sequence');
  $('#interior-pages').innerHTML = config.mockups.map(item => `<article class="mockup-row"><div class="mockup-copy"><h3>${esc(item.title)}</h3><p>${esc(item.body)}</p></div><div class="mockup-image"><img src="${esc(safeUrl(item.image))}" alt="${esc(item.alt)}" loading="lazy" decoding="async" width="1440" height="1080"></div></article>`).join('');

  let chapterNumber = 0;
  const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
  $('#topics').innerHTML = config.syllabusParts.map((part, index) => `<details class="topic syllabus-part"><summary><span class="part-number">${String(index + 1).padStart(2, '0')}</span><span class="part-heading"><small>PARTE ${roman[index]}</small><strong>${esc(part.title)}</strong></span><span class="plus" aria-hidden="true">+</span></summary><ol class="chapter-list">${part.chapters.map(chapter => `<li><span>${String(++chapterNumber).padStart(2, '0')}.</span><span>${esc(chapter)}</span></li>`).join('')}</ol></details>`).join('');
  $('#bonuses').innerHTML = config.bonuses.map((bonus, index) => `<article class="bonus-card"><div class="bonus-art"><span class="bonus-tag">BONO ${String(index + 1).padStart(2, '0')} / INCLUIDO</span><img src="${esc(safeUrl(config.assets['bonus' + (index + 1)]))}" alt="Portada de ${esc(bonus.title)}" loading="lazy" width="1024" height="1536" decoding="async"></div><div class="bonus-copy"><p class="bonus-kicker">TU BONO ${String(index + 1).padStart(2, '0')}</p><h3>${esc(bonus.title)}</h3><p class="tagline">${esc(bonus.tagline)}</p><ul>${bonus.includes.map(item => `<li>${esc(item)}</li>`).join('')}</ul></div></article>`).join('');
  $('#testimonials').innerHTML = config.testimonials.map(t => `<article class="review-card"><span class="review-mark" aria-hidden="true">“</span><blockquote>${esc(t.quote)}</blockquote><div class="review-person"><img src="${esc(safeUrl(t.image))}" alt="Retrato de ${esc(t.name)}" loading="lazy" width="48" height="48"><strong>${esc(t.name)}</strong></div></article>`).join('');

  const visible = video => {
    const r = video.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth && !video.hidden;
  };
  const playVideo = video => {
    if (video.dataset.src && !video.getAttribute('src')) { video.src = video.dataset.src; video.load(); }
    video.play().catch(() => {});
  };
  const canAutoPlay = () => !document.hidden && !document.querySelector('dialog[open]');
  const videoObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => entries.forEach(({target, isIntersecting}) => {
    if (isIntersecting && canAutoPlay()) playVideo(target);
    else target.pause();
  }), {threshold: .15}) : null;
  const observeVideo = video => {
    if (videoObserver) videoObserver.observe(video);
    else if (visible(video)) playVideo(video);
  };
  $('#loops').innerHTML = config.loopVideos.map((media, index) => `<article class="loop-card"><div class="loop-media"><video class="loop-video" data-src="${esc(safeUrl(media.src))}" ${media.poster ? `poster="${esc(safeUrl(media.poster))}"` : ''} autoplay muted loop playsinline preload="none" disablepictureinpicture disableremoteplayback aria-label="${esc(config.loopTitles[index])}"></video></div><h3>${esc(config.loopTitles[index])}</h3></article>`).join('');
  $$('.loop-video').forEach(observeVideo);
  const loops = $('#loops');
  const loopPrev = $('#loop-prev');
  const loopNext = $('#loop-next');
  const loopStep = () => loops.firstElementChild.getBoundingClientRect().width + parseFloat(getComputedStyle(loops).columnGap || '16');
  const updateLoopNavigation = () => {
    const max = Math.max(0, loops.scrollWidth - loops.clientWidth);
    loopPrev.disabled = loops.scrollLeft < 4;
    loopNext.disabled = loops.scrollLeft >= max - 4;
    const step = loopStep();
    const position = step ? Math.min(4, Math.round(loops.scrollLeft / step) + 1) : 1;
    $('#loop-position').textContent = `${String(position).padStart(2, '0')} / 04`;
  };
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const scrollLoop = direction => loops.scrollBy({left: direction * loopStep(), behavior: motion.matches ? 'instant' : 'smooth'});
  loopPrev.addEventListener('click', () => scrollLoop(-1));
  loopNext.addEventListener('click', () => scrollLoop(1));
  loops.addEventListener('scroll', updateLoopNavigation, {passive: true});
  loops.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); scrollLoop(event.key === 'ArrowRight' ? 1 : -1); }
  });
  window.addEventListener('resize', updateLoopNavigation);
  updateLoopNavigation();

  const comparison = $('#comparison');
  const handle = $('#compare-handle');
  let comparisonPosition = 50;
  const setComparison = value => {
    comparisonPosition = Math.max(0, Math.min(100, value));
    comparison.style.setProperty('--pos', comparisonPosition + '%');
    handle.setAttribute('aria-valuenow', String(Math.round(comparisonPosition)));
    handle.setAttribute('aria-valuetext', `${Math.round(comparisonPosition)} % de la imagen de antes`);
  };
  let pointer = null;
  handle.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    event.preventDefault();
    pointer = event.pointerId;
    handle.setPointerCapture(pointer);
    handle.classList.add('dragging');
    handle.focus({preventScroll: true});
  });
  handle.addEventListener('pointermove', event => {
    if (event.pointerId !== pointer) return;
    const rect = comparison.getBoundingClientRect();
    setComparison(100 * (event.clientX - rect.left) / rect.width);
  });
  const stopDragging = () => { pointer = null; handle.classList.remove('dragging'); };
  handle.addEventListener('pointerup', stopDragging);
  handle.addEventListener('pointercancel', stopDragging);
  handle.addEventListener('lostpointercapture', stopDragging);
  handle.addEventListener('keydown', event => {
    const step = event.shiftKey ? 10 : 2;
    const values = {ArrowLeft: comparisonPosition - step, ArrowDown: comparisonPosition - step, ArrowRight: comparisonPosition + step, ArrowUp: comparisonPosition + step, Home: 0, End: 100};
    if (event.key in values) { event.preventDefault(); setComparison(values[event.key]); }
  });
  setComparison(50);

  let dialogTrigger = null;
  const showDialog = (dialog, source) => {
    dialogTrigger = source;
    $$('video').forEach(video => video.pause());
    dialog.showModal();
    document.body.classList.add('modal-open');
  };
  const showInfo = (title, body, source) => {
    $('#info-title').textContent = title;
    $('#info-body').textContent = body;
    showDialog($('#info-dialog'), source);
  };
  $$('dialog').forEach(dialog => {
    dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const box = dialog.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
    });
    dialog.addEventListener('close', () => {
      document.body.classList.remove('modal-open');
      dialogTrigger?.focus({preventScroll: true});
      $$('video').forEach(video => { if (canAutoPlay() && visible(video)) playVideo(video); });
    });
  });
  $('#info-ok').addEventListener('click', () => $('#info-dialog').close());


  const hero = $('#hero-video');
  const heroUrl = safeUrl(config.heroVideoUrl);
  if (heroUrl) {
    hero.dataset.src = heroUrl;
    hero.poster = safeUrl(config.heroPoster);
    hero.hidden = false;
    hero.muted = true;
    hero.controls = false;
    observeVideo(hero);
  } else { $('[data-video-sound]').hidden = true; }
  $('[data-video-sound]').addEventListener('click', event => {
    const button = event.currentTarget;
    hero.muted = !hero.muted;
    button.setAttribute('aria-pressed', String(!hero.muted));
    button.setAttribute('aria-label', hero.muted ? 'Activar sonido' : 'Desactivar sonido');
    playVideo(hero);
  });
  document.addEventListener('visibilitychange', () => {
    $$('video').forEach(video => {
      if (document.hidden) video.pause();
      else if (canAutoPlay() && visible(video)) playVideo(video);
    });
  });

  const price = new Intl.NumberFormat('es-ES', {style: 'currency', currency: config.currency}).format(config.price);
  $$('[data-price]').forEach(el => { el.textContent = price; });
  const checkout = safeUrl(config.checkoutUrl, true);
  $$('[data-checkout]').forEach(link => {
    if (checkout) { link.href = checkout; return; }
    link.removeAttribute('href');
    link.addEventListener('click', event => {
      event.preventDefault();
      showInfo('La compra todavía no está habilitada.', `La guía y sus tres bonos cuestan ${price}. Falta conectar el enlace de pago para habilitar la compra.`, link);
    });
  });
  const guarantee = $('[data-guarantee]');
  if (guarantee && config.guarantee?.enabled) guarantee.textContent = config.guarantee.text;
  $('#delivery-copy').textContent = config.deliveryText;
  $$('[data-legal]').forEach(button => button.addEventListener('click', () => {
    const url = safeUrl(button.dataset.legal === 'privacy' ? config.privacyUrl : config.termsUrl, true);
    if (url) { location.assign(url); return; }
    showInfo('Política pendiente de publicar.', 'Esta sección se conectará a las condiciones oficiales antes de habilitar la compra.', button);
  }));
  $('#year').textContent = new Intl.DateTimeFormat('es-PE', {year: 'numeric', timeZone: 'America/Lima'}).format(new Date());

  const sticky = $('.mobile-cta');
  const heroAction = $('.hero-actions');
  let scheduled = false;
  const updateSticky = () => {
    sticky.hidden = heroAction.getBoundingClientRect().top > innerHeight - 70;
    scheduled = false;
  };
  window.addEventListener('scroll', () => {
    if (!scheduled) { scheduled = true; requestAnimationFrame(updateSticky); }
  }, {passive: true});
  window.addEventListener('resize', updateSticky);
  updateSticky();
})();
