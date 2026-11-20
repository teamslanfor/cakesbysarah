/* Cakes by Sarah – scripted chat assistant (no AI service, no dependencies). */
(function () {
  'use strict';
  const S = window.SITE || {};
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const css = `
  .lt-btn{position:fixed;right:18px;bottom:18px;z-index:70;display:flex;align-items:center;gap:10px;padding:8px 20px 8px 8px;border:0;border-radius:18px;background:#7a2948;color:#fff;font:800 .95rem 'Playfair Display',Georgia,serif;cursor:pointer;box-shadow:0 6px 0 #e0a43a;transition:transform .35s cubic-bezier(.22,.7,.2,1),box-shadow .35s}
  .lt-btn:hover{transform:translateY(-3px);box-shadow:0 9px 0 #e0a43a}
  .lt-btn i{width:40px;height:40px;border-radius:13px;background:#fbe3c0;display:grid;place-items:center;font-style:normal;font-size:1.3rem}
  .lt-panel{position:fixed;right:18px;bottom:90px;z-index:71;width:min(370px,calc(100vw - 36px));height:min(540px,calc(100vh - 120px));background:#fff;border-radius:24px;box-shadow:0 30px 70px -24px rgba(43,27,46,.55);display:flex;flex-direction:column;overflow:hidden;transform:translateY(16px) scale(.97);opacity:0;pointer-events:none;transition:all .35s cubic-bezier(.22,.7,.2,1)}
  .lt-panel.open{transform:none;opacity:1;pointer-events:auto}
  .lt-head{background:#7a2948;color:#fff;padding:15px 18px;display:flex;align-items:center;gap:12px}
  .lt-head b{display:block;font:800 1.15rem 'Playfair Display',Georgia,serif}
  .lt-head small{color:#f6dbe4;font-size:.78rem}
  .lt-head .x{margin-left:auto;background:rgba(255,255,255,.15);border:0;color:#fff;width:34px;height:34px;border-radius:50%;cursor:pointer;font-size:1rem}
  .lt-body{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;background:#fff8f1}
  .lt-m{max-width:86%;padding:10px 14px;border-radius:18px;font-size:.93rem;line-height:1.5;white-space:pre-line;animation:ltIn .35s ease both}
  .lt-m a{color:#7a2948;font-weight:800}
  .lt-bot{background:#fff;border:1px solid #f1e2dc;border-bottom-left-radius:5px;color:#3b3040}
  .lt-me{align-self:flex-end;background:#e0a43a;color:#fff;border-bottom-right-radius:5px}
  .lt-chips{display:flex;flex-wrap:wrap;gap:6px;padding:0 16px 10px;background:#fff8f1}
  .lt-chips button{border:2px solid #7a2948;background:#fff;color:#7a2948;border-radius:999px;padding:5px 12px;font:700 .82rem 'Nunito Sans',system-ui,sans-serif;cursor:pointer;transition:all .25s}
  .lt-chips button:hover{background:#7a2948;color:#fbe3c0}
  .lt-form{display:flex;gap:8px;padding:12px;border-top:1px solid #f1e2dc;background:#fff}
  .lt-form input{flex:1;min-width:0;border:2px solid #f1e2dc;border-radius:14px;padding:10px 14px;font:inherit;font-size:.94rem}
  .lt-form input:focus{outline:none;border-color:#7a2948}
  .lt-form button{width:44px;height:44px;border-radius:14px;border:0;background:#7a2948;color:#fff;cursor:pointer;display:grid;place-items:center}
  .lt-form svg{width:18px;height:18px}
  .lt-typing{display:inline-flex;gap:4px}.lt-typing span{width:6px;height:6px;border-radius:50%;background:#c9b8cc;animation:ltDot 1s infinite}.lt-typing span:nth-child(2){animation-delay:.15s}.lt-typing span:nth-child(3){animation-delay:.3s}
  @keyframes ltIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
  @keyframes ltDot{0%,80%,100%{opacity:.3}40%{opacity:1}}
  @media (max-width:640px){.lt-btn span{display:none}.lt-btn{padding:6px;bottom:88px;right:14px}.lt-panel{bottom:150px;right:14px;height:min(500px,calc(100vh - 180px))}}
  @media (prefers-reduced-motion:reduce){.lt-m,.lt-panel{animation:none;transition:none}}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  const sendI = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/></svg>';
  const root = document.createElement('div');
  root.innerHTML = `
  <button class="lt-btn" aria-expanded="false" aria-controls="lt-panel"><i aria-hidden="true">🎂</i><span>Ask Sarah</span></button>
  <section class="lt-panel" id="lt-panel" role="dialog" aria-label="Chat with Cakes by Sarah">
    <div class="lt-head"><div><b>Cakes by Sarah</b><small>Automated assistant · set answers</small></div><button class="x" aria-label="Close chat">✕</button></div>
    <div class="lt-body" aria-live="polite"></div>
    <div class="lt-chips"></div>
    <form class="lt-form"><label class="sr-only" for="lt-in">Type your message</label><input id="lt-in" autocomplete="off" placeholder="Ask about cakes, treats, dietary options…" maxlength="300"><button aria-label="Send">${sendI}</button></form>
  </section>`;
  document.body.appendChild(root);
  const btn = root.querySelector('.lt-btn'), panel = root.querySelector('.lt-panel'), body = root.querySelector('.lt-body'),
    chipBox = root.querySelector('.lt-chips'), form = root.querySelector('.lt-form'), input = root.querySelector('#lt-in');
  let started = false, busy = false;
  const add = (h, who = 'bot') => { const m = document.createElement('div'); m.className = 'lt-m lt-' + who; m.innerHTML = h; body.appendChild(m); body.scrollTop = body.scrollHeight; return m; };
  const say = (h, w = 420) => new Promise((r) => { const tp = add('<span class="lt-typing"><span></span><span></span><span></span></span>'); setTimeout(() => { tp.innerHTML = h; body.scrollTop = body.scrollHeight; r(); }, w); });
  const chips = (l) => { chipBox.innerHTML = ''; l.forEach((c) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = c; b.onclick = () => handle(c); chipBox.appendChild(b); }); };
  const MAIN = ['Order a cake', 'Treats', 'Dietary options', 'Persian bakes', 'Contact'];
  const wa = () => `<a href="https://wa.me/${S.whatsapp}" target="_blank" rel="noopener">WhatsApp</a>`;
  const tel = () => `<a href="${S.phoneHref}">${S.phone}</a>`;
  const contact = () => `💬 ${wa()}\n📞 ${tel()}\n✉️ <a href="mailto:${S.email}">${esc(S.email)}</a>\n📘 <a href="${S.facebook}" target="_blank" rel="noopener">Facebook</a> · 📸 <a href="${S.instagram}" target="_blank" rel="noopener">Instagram</a>`;
  const intents = [
    { re: /^(order a cake|cake order)$/i, run: () => say(`Lovely! Tell Sarah the occasion, date, size and design on the <a href="order.html">order form</a>, and add an inspiration photo if you have one. You can send it by email or WhatsApp.`).then(() => chips(['How much notice?', 'Sizes', 'Prices'])) },
    { re: /notice|advance|how long|how soon|last minute|urgent|tomorrow|this week|book/i, run: () => say(`Popular dates book up, so the earlier the better, especially for weddings and tiered cakes. For something soon, message on ${wa()} and Sarah will let you know if she can fit you in.`).then(() => chips(MAIN)) },
    { re: /size|inch|"|tier|how big|portion|serv/i, run: () => say(`Celebration cakes come in sizes like 8", 9", 10" and 12", right up to multi-tiered wedding cakes. Tell Sarah how many people you’re feeding and she’ll suggest the right size.`).then(() => chips(['Order a cake', 'Prices'])) },
    { re: /price|cost|how much|£|quote|budget/i, run: () => say(`Every cake is made to order, so the price depends on size and design. Send your idea and Sarah will reply with a quote.`).then(() => chips(['Order a cake', 'Contact'])) },
    { re: /dairy|gluten|nut|vegan|allerg|coeliac|celiac|egg|dietary|free from/i, run: () => say(`Yes! Dairy-free, gluten-free, nut-free and vegan options are available. Please tell Sarah about any allergies when you order.`).then(() => chips(['Order a cake', 'Treats'])) },
    { re: /persian|saffron|rose ?water|pistachio|cardamom|iran/i, run: () => say(`Sarah shares her Persian bakes on Instagram at <a href="${S.instagram}" target="_blank" rel="noopener">@saras_persian_bakes</a>. Ask about them when you order!`).then(() => chips(MAIN)) },
    { re: /brownie|blondie|fudge|cupcake|flapjack|traybake|cookie|treat|box|gift/i, run: () => say(`As well as cakes there are brownies, blondies, fudge, cupcakes, flapjacks, traybakes and cookies. <a href="bakes.html?tab=treats">See the treats</a>`).then(() => chips(['Order a cake', 'Dietary options'])) },
    { re: /wedding|birthday|christening|baby|anniversar|engage|party|celebrat|cake|occasion|theme|character/i, run: () => say(`Sarah has been creating cakes for every occasion for over 15 years, from birthday cupcakes to multi-tiered wedding cakes. <a href="order.html">Request your cake</a>`).then(() => chips(['How much notice?', 'Sizes', 'Prices'])) },
    { re: /deliver|collect|pick ?up|where|location|area|coleraine/i, run: () => say(`Cakes are collected by arrangement in the Coleraine area. Message Sarah to arrange it:\n${contact()}`).then(() => chips(MAIN)) },
    { re: /insta|facebook|photo|picture|gallery|see.*work/i, run: () => say(`See Sarah’s latest cakes on <a href="${S.facebook}" target="_blank" rel="noopener">Facebook</a> and <a href="${S.instagram}" target="_blank" rel="noopener">Instagram</a>, or browse the <a href="index.html#creations">recent creations</a>.`).then(() => chips(MAIN)) },
    { re: /contact|phone|call|number|whatsapp|text|email|talk|message/i, run: () => say(`You can reach Sarah here:\n${contact()}`).then(() => chips(MAIN)) },
    { re: /^(hi|hello|hey|hiya|good (morning|afternoon|evening))\b/i, run: () => say('Hello! 🎂 What are we celebrating?').then(() => chips(MAIN)) },
    { re: /thank|cheers|lovely|great/i, run: () => say('You’re very welcome! 😊').then(() => chips(MAIN)) },
  ];
  async function handle(text) {
    if (busy || !text.trim()) return;
    busy = true; add(esc(text), 'me');
    try {
      const map = { 'Order a cake': 'order a cake', 'Treats': 'treats', 'Dietary options': 'dietary', 'Persian bakes': 'persian', 'Contact': 'contact', 'How much notice?': 'notice', 'Prices': 'price', 'Sizes': 'size' };
      const q = map[text] || text, hit = intents.find((i) => i.re.test(q));
      if (hit) { await hit.run(); return; }
      await say(`I don’t have a set answer for that one, but Sarah can help:\n${contact()}`); chips(MAIN);
    } finally { busy = false; }
  }
  const open = async (s) => {
    panel.classList.toggle('open', s); btn.setAttribute('aria-expanded', String(s));
    if (s) { input.focus(); if (!started) { started = true; await say('Hello and welcome to <strong>Cakes by Sarah</strong>! 🎂 Ask me about celebration cakes, treats, dietary options or how to order.', 300); chips(MAIN); } }
  };
  btn.addEventListener('click', () => open(!panel.classList.contains('open')));
  root.querySelector('.x').addEventListener('click', () => open(false));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && panel.classList.contains('open')) open(false); });
  form.addEventListener('submit', (e) => { e.preventDefault(); const v = input.value; input.value = ''; handle(v); });
})();
