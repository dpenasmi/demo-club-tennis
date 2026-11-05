// Motor independiente del HERO. Selectores y estado locales a esta sección.
class TennisPoint extends HTMLElement {
  connectedCallback() {
    if (this.started) return;
    this.started = true;
    const root = this;
    const config = JSON.parse(root.dataset.config);
    const canvas = root.querySelector('canvas');
    const ctx = canvas.getContext('2d', { alpha: false });
    const copy = root.querySelector('.closing-scene__copy');
    const status = root.querySelector('.closing-scene__status');
    const panel = root.querySelector('.closing-scene__debug');
    const output = root.querySelector('.closing-frame');
    const scrub = root.querySelector('.closing-scrub');
    const revealInput = root.querySelector('.closing-reveal');
    const stage = root.querySelector('.closing-scene__stage');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const controller = new AbortController();
    const signal = controller.signal;
    const count = config.frameCount;
    const cache = new Map(), loading = new Set(), failed = new Set();
    let wanted = 1, shown = 0, pending = 0, raf = 0, nearby = false;
    let revealFrame = config.revealFrame;
    const clamp = (n,min,max) => Math.max(min,Math.min(max,n));
    panel.hidden = new URLSearchParams(location.search).get('debug') !== '1';
    function reveal(frame) {
      const amount = reduced.matches ? 1 : clamp((frame-revealFrame+1)/config.revealFrames,0,1);
      copy.style.setProperty('--closing-reveal', String(amount));
      copy.style.setProperty('--closing-offset', `${(1-amount)*26}px`);
      copy.classList.toggle('is-visible', amount>0);
      copy.inert = amount === 0;
      copy.setAttribute('aria-hidden',String(amount===0));
    }
    function draw() {
      if (!ctx || !cache.size) return;
      const n = cache.has(wanted) ? wanted : [...cache.keys()].reduce((a,b)=>Math.abs(a-wanted)<=Math.abs(b-wanted)?a:b);
      const image = cache.get(n);
      const box = canvas.getBoundingClientRect();
      const dpr = Math.min(devicePixelRatio || 1,2);
      const width = Math.max(1,Math.round(box.width*dpr));
      const height = Math.max(1,Math.round(box.height*dpr));
      const resized = canvas.width!==width || canvas.height!==height;
      if (resized) {canvas.width=width;canvas.height=height;}
      if(n!==shown || resized) {
        const scale=Math.min(width/image.naturalWidth,height/image.naturalHeight);
        ctx.fillStyle='#080e0f';ctx.fillRect(0,0,width,height);
        ctx.drawImage(image,(width-image.naturalWidth*scale)/2,(height-image.naturalHeight*scale)/2,image.naturalWidth*scale,image.naturalHeight*scale);
        shown=n;root.setAttribute('data-drawn','');
      }
      reveal(n); // Sigue al fotograma visible, no a una descarga pendiente.
      output.value=`${n} / ${count}`;
      scrub.value=String(wanted);
      if(failed.has(wanted)) status.textContent=`No se pudo cargar el fotograma ${wanted}. Comprueba IMG/ESCENA-4-WebP y los nombres de los archivos.`;
      else if(cache.has(wanted)) status.textContent='';
    }
    function priorities() {
      if(reduced.matches)return [1];
      const list=[wanted];
      for(let distance=1;distance<=8;distance++) {
        if(wanted+distance<=count)list.push(wanted+distance);
        if(wanted-distance>=1)list.push(wanted-distance);
      }
      return list;
    }
    function pump() {
      if(!nearby || !ctx)return;
      for(const n of priorities()) {
        if(pending>=3)break;
        if(cache.has(n)||loading.has(n)||failed.has(n))continue;
        pending++;loading.add(n);
        const image=new Image();image.decoding='async';
        const finish=()=>{pending--;loading.delete(n);schedule();};
        image.onload=async()=>{
          try{await image.decode();}catch{/* onload ya confirma una imagen dibujable */}
          if(signal.aborted){pending--;loading.delete(n);return;}
          cache.set(n,image);
          while(cache.size>18) {
            const farthest=[...cache.keys()].sort((a,b)=>Math.abs(b-wanted)-Math.abs(a-wanted))[0];
            cache.delete(farthest);
          }
          finish();
        };
        image.onerror=()=>{
          failed.add(n);
          if(n===wanted)status.textContent=`No se pudo cargar el fotograma ${n}. Comprueba IMG/ESCENA-4-WebP y los nombres ezgif-frame-001.jpg a ezgif-frame-126.jpg.`;
          finish();
        };
        image.src=`${config.frameDirectory}ezgif-frame-${String(n).padStart(3,'0')}.jpg`;
      }
    }
    function update() {
      raf=0;
      if(!nearby)return;
      const box=root.getBoundingClientRect();
      const travel=Math.max(1,root.offsetHeight-stage.offsetHeight);
      const progress=clamp(-box.top/travel,0,1);
      wanted=reduced.matches?1:1+Math.round(clamp(progress/config.sequenceEnd,0,1)*(count-1));
      root.style.setProperty('--closing-progress',String(progress));
      if(!ctx){reveal(count);return;}
      draw();pump();
    }
    function schedule(){if(!signal.aborted && nearby && !raf)raf=requestAnimationFrame(update);}
    // Precarga cuando la sección se aproxima, sin descargar la escena 04 al abrir el HERO.
    const observer=new IntersectionObserver(entries=>{
      nearby=entries[0].isIntersecting;
      if(nearby)schedule();
    },{rootMargin:'600px 0px'});
    observer.observe(root);
    const resizeObserver=new ResizeObserver(schedule);
    resizeObserver.observe(stage);
    resizeObserver.observe(root.querySelector('.closing-scene__visual'));
    window.addEventListener('scroll',schedule,{passive:true,signal});
    window.addEventListener('resize',schedule,{signal});
    window.addEventListener('pageshow',schedule,{signal});
    reduced.addEventListener('change',()=>{reveal(shown||1);schedule();},{signal});
    revealInput.addEventListener('input',()=>{
      const n=Number(revealInput.value);
      if(Number.isInteger(n)&&n>=1&&n<=count){revealFrame=n;reveal(shown||1);}
    },{signal});
    scrub.addEventListener('input',()=>{
      if(reduced.matches)return;
      const top=scrollY+root.getBoundingClientRect().top;
      const travel=root.offsetHeight-stage.offsetHeight;
      window.scrollTo({top:top+((Number(scrub.value)-1)/(count-1))*config.sequenceEnd*travel,behavior:'instant'});
      schedule();
    },{signal});
    const openButton=root.querySelector('[data-open-point]');
    const dialog=root.querySelector('.closing-scene__dialog');
    openButton?.addEventListener('click',()=>dialog?.showModal(),{signal});
    reveal(1);
    this.cleanup=()=>{
      controller.abort();observer.disconnect();resizeObserver.disconnect();cancelAnimationFrame(raf);cache.clear();
    };
  }
  disconnectedCallback(){this.cleanup?.();this.started=false;}
}
if(!customElements.get('tennis-point'))customElements.define('tennis-point',TennisPoint);
