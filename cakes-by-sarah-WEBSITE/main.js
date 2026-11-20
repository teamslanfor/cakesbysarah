/* Cakes by Sarah – site interactions (no dependencies).
   Orders are emailed through FormSubmit (with the design photo attached), or sent as a ready-written WhatsApp message. */
(function () {
  'use strict';
  document.documentElement.classList.remove('no-js');
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const S = window.SITE || {};
  const params = new URLSearchParams(location.search);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* Header + mobile menu */
  const hdr = $('.hdr');
  const onScroll = () => hdr && hdr.classList.toggle('scrolled', window.scrollY > 10);
  onScroll(); addEventListener('scroll', onScroll, { passive: true });
  const burger = $('.burger'), nav = $('.nav');
  if (burger && nav) {
    const close = () => { nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; };
    burger.addEventListener('click', () => { const o = nav.classList.toggle('open'); burger.setAttribute('aria-expanded', String(o)); document.body.style.overflow = o ? 'hidden' : ''; });
    $$('a', nav).forEach((a) => a.addEventListener('click', close));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  }

  /* Reveal on scroll – never leaves content hidden */
  const rv = $$('.rv'); const show = (el) => el.classList.add('in');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } }), { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    rv.forEach((el) => io.observe(el));
    let tk = false;
    addEventListener('scroll', () => { if (!tk) { tk = true; requestAnimationFrame(() => { tk = false; rv.forEach((el) => { if (!el.classList.contains('in') && el.getBoundingClientRect().top < innerHeight) show(el); }); }); } }, { passive: true });
  } else rv.forEach(show);
  setTimeout(() => rv.forEach(show), 2500);

  /* Tabs with sliding indicator + arrow keys */
  $$('[role=tablist]').forEach((list) => {
    const tabs = $$('[role=tab]', list), ind = $('.ind', list);
    const cur = () => tabs.find((x) => x.getAttribute('aria-selected') === 'true');
    const move = (tb) => { if (ind && tb) { ind.style.width = tb.offsetWidth + 'px'; ind.style.top = tb.offsetTop + 'px'; ind.style.transform = `translateX(${tb.offsetLeft - 6}px)`; } };
    const select = (tb, focus) => {
      tabs.forEach((x) => { const on = x === tb; x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1; const p = document.getElementById(x.getAttribute('aria-controls')); if (p) p.hidden = !on; });
      move(tb); if (focus) tb.focus();
    };
    tabs.forEach((tb, i) => {
      tb.addEventListener('click', () => select(tb));
      tb.addEventListener('keydown', (e) => { const k = { ArrowRight: 1, ArrowLeft: -1 }[e.key]; if (k) { e.preventDefault(); select(tabs[(i + k + tabs.length) % tabs.length], true); } });
    });
    select(tabs.find((x) => x.dataset.id === params.get('tab') || '#' + x.dataset.id === location.hash) || cur() || tabs[0]);
    addEventListener('resize', () => move(cur())); addEventListener('load', () => move(cur()));
    if (document.fonts) document.fonts.ready.then(() => move(cur()));
  });

  /* Gallery filter + lightbox */
  const gBtns = $$('.gfil button'), gItems = $$('.gi');
  gBtns.forEach((b) => b.addEventListener('click', () => {
    gBtns.forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', String(x === b)); });
    gItems.forEach((it) => it.classList.toggle('hide', b.dataset.f !== 'all' && it.dataset.cat !== b.dataset.f));
  }));
  const lb = $('.lightbox');
  if (lb) {
    let idx = 0;
    const vis = () => gItems.filter((g) => !g.classList.contains('hide'));
    const openAt = (i) => { const v = vis(); idx = (i + v.length) % v.length; const it = v[idx]; $('img', lb).src = $('img', it).src; $('img', lb).alt = it.dataset.cap; $('figcaption', lb).textContent = it.dataset.cap; lb.hidden = false; };
    gItems.forEach((it) => it.addEventListener('click', () => { openAt(vis().indexOf(it)); $('.lb-x', lb).focus(); }));
    $('.lb-x', lb).addEventListener('click', () => { lb.hidden = true; });
    $('.lb-prev', lb).addEventListener('click', () => openAt(idx - 1));
    $('.lb-next', lb).addEventListener('click', () => openAt(idx + 1));
    lb.addEventListener('click', (e) => { if (e.target === lb) lb.hidden = true; });
    document.addEventListener('keydown', (e) => { if (lb.hidden) return; if (e.key === 'Escape') lb.hidden = true; if (e.key === 'ArrowLeft') openAt(idx - 1); if (e.key === 'ArrowRight') openAt(idx + 1); });
  }

  /* Pre-fill order type from links (?type=birthday) */
  const type = params.get('type'); if (type) { const r = $(`input[name="treat"][value="${type}"]`); if (r) r.checked = true; }
  $$('input[type=date]').forEach((d) => { const t = new Date(); t.setDate(t.getDate() + 1); d.min = t.toISOString().slice(0, 10); });

  /* Forms */
  const rules = {
    name: (v) => v.trim().length >= 2 || 'Please enter your name.',
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Please enter a valid email address.',
    phone: (v) => { const d = v.replace(/\D/g, ''); return (d.length >= 10 && d.length <= 13) || 'Please enter a valid phone number, e.g. 07700 900123.'; },
    date_needed: (v) => !!v || 'Please choose the date you need it.',
    details: (v) => v.trim().length >= 5 || 'Please tell us a little about what you’d like.',
    message: (v) => v.trim().length >= 5 || 'Please tell us a little more.',
  };
  $$('form[data-send]').forEach((form) => {
    const fields = $$('input, textarea, select', form).filter((el) => rules[el.name] && el.required);
    const check = (el) => { const r = rules[el.name](el.value), box = el.closest('.f'), err = box && $('.err', box), ok = r === true; if (box) box.classList.toggle('bad', !ok); if (err) err.textContent = ok ? '' : r; el.setAttribute('aria-invalid', String(!ok)); return ok; };
    fields.forEach((el) => {
      el.addEventListener('blur', (e) => { if (e.relatedTarget && e.relatedTarget.closest('.form-foot')) return; const bx = el.closest('.f'); if (!el.value.trim() && !(bx && bx.classList.contains('bad'))) return; check(el); });
      el.addEventListener('input', () => { const bx = el.closest('.f'); if (bx && bx.classList.contains('bad')) check(el); });
    });
    const file = $('input[type=file]', form);
    if (file) file.addEventListener('change', () => { const f = file.files[0], hint = $('.hint', file.closest('.f')); if (f && f.size > 5 * 1024 * 1024) { file.value = ''; if (hint) hint.textContent = 'That photo is over 5 MB. Please choose a smaller one.'; } else if (hint && f) hint.textContent = `Attached: ${f.name}`; });
    const status = $('.status', form), btn = $('button[type=submit]', form);
    const valid = () => { if (form.elements._honey && form.elements._honey.value) return false; if (fields.map(check).includes(false)) { status.className = 'status bad'; status.textContent = 'Please fix the highlighted fields and try again.'; const f = $('.f.bad input, .f.bad textarea, .f.bad select', form); if (f) f.focus(); return false; } return true; };
    const summary = () => {
      const map = new Map();
      new FormData(form).forEach((v, k) => {
        if (k.startsWith('_') || typeof v !== 'string' || !v.trim()) return;
        const el = form.querySelector(`[name="${k}"]`); let lab = (el && el.closest('.f') && el.closest('.f').querySelector('label, legend') || {}).textContent || k;
        lab = lab.replace(/\*|\(optional[^)]*\)/g, '').trim();
        if (el && el.type === 'date') { try { v = new Date(v + 'T12:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }); } catch (x) {} }
        map.set(lab, map.has(lab) ? `${map.get(lab)}, ${v}` : v);
      });
      return [...map].map(([k, v]) => `*${k}:* ${v}`);
    };
    const waBtn = $('[data-wa-alt]', form);
    if (waBtn) waBtn.addEventListener('click', () => {
      if (!valid()) return;
      const hasPhoto = file && file.files[0];
      const text = `Hi Sarah! 👋 ${form.dataset.send}\n\n${summary().join('\n')}${hasPhoto ? '\n\n(I’ll attach my inspiration photo here.)' : ''}`;
      window.open(`https://wa.me/${S.whatsapp}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
      status.className = 'status ok'; status.innerHTML = `<strong>WhatsApp is ready!</strong> Just press send${hasPhoto ? ' and attach your photo' : ''}.`;
    });
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!valid()) return;
      const fd = new FormData(form); fd.delete('_honey');
      $$('fieldset[data-multi]', form).forEach((fs) => { const n = fs.dataset.multi, vals = fd.getAll(n); fd.delete(n); if (vals.length) fd.append(n, vals.join(', ')); });
      fd.append('_subject', `${form.dataset.send} from ${fd.get('name')} – website`); fd.append('_template', 'table'); fd.append('_captcha', 'false');
      const first = String(fd.get('name')).trim().split(' ')[0];
      btn.disabled = true; form.classList.add('loading');
      try {
        const res = await fetch(`https://formsubmit.co/ajax/${S.email}`, { method: 'POST', headers: { Accept: 'application/json' }, body: fd });
        const j = await res.json().catch(() => ({}));
        if (!res.ok || String(j.success) === 'false') throw new Error('send');
        form.reset(); $$('.f.bad', form).forEach((b) => b.classList.remove('bad'));
        status.className = 'status ok';
        status.innerHTML = `<strong>Thank you, ${esc(first)}! 🎂</strong> Your ${esc(form.dataset.send.toLowerCase())} has been sent. Sarah will be in touch soon to confirm the details and price.`;
        status.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      } catch (err) {
        const text = `${form.dataset.send}\n\n${summary().join('\n').replace(/\*/g, '')}`;
        status.className = 'status bad';
        status.innerHTML = `Sorry, that didn’t send automatically. Please <a href="https://wa.me/${S.whatsapp}?text=${encodeURIComponent(text)}" target="_blank" rel="noopener">send it on WhatsApp</a>, <a href="mailto:${S.email}?subject=${encodeURIComponent(form.dataset.send)}&body=${encodeURIComponent(text)}">email it</a> (filled in for you) or call <a href="${S.phoneHref}">${S.phone}</a>.`;
      } finally { btn.disabled = false; form.classList.remove('loading'); }
    });
  });

  /* Cookie notice + year */
  const ck = $('.cookie');
  if (ck) {
    let seen = false; try { seen = localStorage.getItem('cbs-cookie-ok') === '1'; } catch (e) {}
    if (!seen) ck.hidden = false;
    $('button', ck).addEventListener('click', () => { ck.hidden = true; try { localStorage.setItem('cbs-cookie-ok', '1'); } catch (e) {} });
  }
  $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
})();
