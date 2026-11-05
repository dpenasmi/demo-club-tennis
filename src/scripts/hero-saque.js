// JavaScript nativo: sin GSAP, sin reproducción de vídeo y sin interceptar la rueda.
const root = document.querySelector('.serve');
if (root) {
  const config = JSON.parse(root.dataset.config);
  const canvas = root.querySelector('canvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  const copy = root.querySelector('.serve__copy');
  const status = root.querySelector('.serve__status');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const debug = new URLSearchParams(location.search).get('debug') === '1';
  const panel = root.querySelector('.serve__debug');
  const scrub = root.querySelector('.debug-scrub');
  const impact = root.querySelector('.debug-impact');
  const output = root.querySelector('.debug-frame');
  const dialog = root.querySelector('dialog');
  root.querySelector('.serve__cta').addEventListener('click', () => dialog.showModal());
  panel.hidden = !debug;
  const count = config.frameCount;
  let impactFrame = config.impactFrame;
  let wanted = 1, shown = 0, pending = 0, raf = 0;
  const cache = new Map(); // Máximo 18 imágenes decodificadas, no las 94 simultáneamente.
  const loading = new Set();
  const failed = new Set();
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const url = (n) => `${config.frameDirectory}ezgif-frame-${String(n).padStart(3, '0')}.jpg`;

  function reveal(frame) {
    const amount = reduced.matches ? 1 : clamp((frame - impactFrame + 1) / config.revealFrames, 0, 1);
    copy.style.setProperty('--reveal', String(amount));
    copy.style.setProperty('--reveal-offset', `${(1 - amount) * 26}px`);
    copy.classList.toggle('is-visible', amount > 0);
    copy.inert = amount === 0;
    copy.setAttribute('aria-hidden', String(amount === 0));
  }
  function draw() {
    if (!ctx || !cache.size) return;
    // Si la imagen solicitada está pendiente, mantenemos la más próxima disponible.
    const n = cache.has(wanted) ? wanted : [...cache.keys()].reduce((a,b) => Math.abs(a-wanted) <= Math.abs(b-wanted) ? a : b);
    const img = cache.get(n);
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(rect.width*dpr)), h = Math.max(1, Math.round(rect.height*dpr));
    const resized = canvas.width !== w || canvas.height !== h;
    if (resized) { canvas.width = w; canvas.height = h; }
    if (n !== shown || resized) {
      const scale = Math.min(w/img.naturalWidth, h/img.naturalHeight);
      ctx.fillStyle = '#080e0f'; ctx.fillRect(0,0,w,h);
      ctx.drawImage(img,(w-img.naturalWidth*scale)/2,(h-img.naturalHeight*scale)/2,img.naturalWidth*scale,img.naturalHeight*scale);
      shown = n; root.setAttribute('data-drawn','');
    }
    reveal(n); // Texto sincronizado con la imagen DIBUJADA, incluso durante la carga.
    output.value = `${n} / ${count}`;
    scrub.value = String(wanted);
  }
  function priorities() {
    const list = [wanted];
    for (let d=1; d<=8; d++) {
      if(wanted+d<=count) list.push(wanted+d);
      if(wanted-d>=1) list.push(wanted-d);
    }
    return reduced.matches ? [1] : list;
  }
  function trim() {
    while(cache.size>18) {
      const oldest = [...cache.keys()].sort((a,b)=>Math.abs(b-wanted)-Math.abs(a-wanted))[0];
      cache.delete(oldest);
    }
  }
  function pump() {
    if (!ctx) return;
    for (const n of priorities()) {
      if(pending>=3) break;
      if(cache.has(n)||loading.has(n)||failed.has(n)) continue;
      pending++; loading.add(n);
      const img = new Image(); img.decoding = 'async';
      const finish = () => { pending--;loading.delete(n);schedule(); };
      img.onload = async () => {
        try { await img.decode(); } catch { /* onload confirma que puede dibujarse */ }
        cache.set(n,img);trim();finish();
      };
      img.onerror = () => {
        failed.add(n);
        status.textContent = `No se pudo cargar el fotograma ${n}. Comprueba IMG/ESCENA-1-WebP y los nombres ezgif-frame-001.jpg a ezgif-frame-094.jpg.`;
        finish();
      };
      img.src = url(n);
    }
  }
  function update() {
    raf=0;
    const rect=root.getBoundingClientRect();
    const stage=root.querySelector('.serve__stage');
    const travel=Math.max(1,root.offsetHeight-stage.offsetHeight);
    const progress=clamp(-rect.top/travel,0,1);
    // Último 12% del recorrido reservado para leer el mensaje con el gesto acabado.
    wanted=reduced.matches ? 1 : 1+Math.round(clamp(progress/.88,0,1)*(count-1));
    root.style.setProperty('--progress',String(progress));
    root.querySelector('.serve__hint').textContent=progress>.02 ? 'Desliza para avanzar o retroceder ↕' : 'Desliza para empezar ↓';
    if(!ctx) { reveal(count);status.textContent='Tu navegador no permite dibujar la secuencia. Se muestra la imagen inicial.'; return; }
    draw();pump();
  }
  function schedule(){if(!raf)raf=requestAnimationFrame(update);}
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',schedule);
  reduced.addEventListener('change',schedule);
  const resizeObserver = new ResizeObserver(schedule);
  resizeObserver.observe(root.querySelector('.serve__stage'));
  resizeObserver.observe(root.querySelector('.serve__visual'));
  impact.addEventListener('input',()=>{
    const next=Number(impact.value);
    if(Number.isInteger(next)&&next>=1&&next<=count){impactFrame=next;reveal(shown||1);}
  });
  scrub.addEventListener('input',()=>{
    if(reduced.matches)return;
    const top=window.scrollY+root.getBoundingClientRect().top;
    const travel=root.offsetHeight-root.querySelector('.serve__stage').offsetHeight;
    window.scrollTo({top:top+((Number(scrub.value)-1)/(count-1))*.88*travel,behavior:'instant'});
    schedule();
  });
  window.addEventListener('pageshow',schedule);
  reveal(1);schedule();
}
