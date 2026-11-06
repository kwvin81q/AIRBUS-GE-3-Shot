'use strict';
const RAD=Math.PI/180;
function estimate(vals){let [ri,ra,rb,rc]=vals;let centers=[0,123,246].map(deg=>({x:ri*Math.sin(deg*RAD),y:ri*Math.cos(deg*RAD)}));let rads=[ra,rb,rc]; let best={loss:Infinity,x:0,y:0}; let bound=Math.max(...vals,0.5)*2.6; for(let x=-bound;x<=bound;x+=bound/15)for(let y=-bound;y<=bound;y+=bound/15){let loss=centers.reduce((s,c,i)=>s+(Math.hypot(x-c.x,y-c.y)-rads[i])**2,0);if(loss<best.loss)best={loss,x,y}}let x=best.x,y=best.y,lam=.001;
for(let it=0;it<140;it++){let aa=lam,bb=0,cc=lam,dd=0,ee=0;for(let i=0;i<3;i++){let dx=x-centers[i].x,dy=y-centers[i].y,d=Math.max(1e-10,Math.hypot(dx,dy)),err=d-rads[i],jx=dx/d,jy=dy/d;aa+=jx*jx;bb+=jx*jy;cc+=jy*jy;dd+=jx*err;ee+=jy*err}let det=aa*cc-bb*bb;if(det<1e-15)break;let sx=(cc*dd-bb*ee)/det,sy=(aa*ee-bb*dd)/det;if(!Number.isFinite(sx+sy))break;let nx=x-sx,ny=y-sy,old=centers.reduce((s,c,i)=>s+(Math.hypot(x-c.x,y-c.y)-rads[i])**2,0),neu=centers.reduce((s,c,i)=>s+(Math.hypot(nx-c.x,ny-c.y)-rads[i])**2,0);if(neu<=old){x=nx;y=ny;lam=Math.max(1e-8,lam/2)}else lam=Math.min(1e6,lam*5);if(Math.hypot(sx,sy)<1e-9)break}

const r = Math.hypot(x,y);
const residual = Math.sqrt(centers.reduce((sum,c,i)=>sum+(Math.hypot(x-c.x,y-c.y)-rads[i])**2,0)/3);
const angle = Math.atan2(x,y)/RAD;
return {ri,r,residual,angle,centers,rads,x,y};
}

if (typeof document !== 'undefined') {
  const $ = id => document.getElementById(id);
  const fields = ['u0', 'u1', 'u2', 'u3'];
  const labels = ['U₀ Baseline', 'U₁ Shot A', 'U₂ Shot B', 'U₃ Shot C'];
  const colors = ['#65d1fb', '#ffd06c', '#cfadff'];
  const prompt = '<p class="hint">Enter the readings to draw the baseline and three trial arcs.</p>';
  $('readings').innerHTML = fields.map((id, i) => `
    <div><label for="${id}">${labels[i]} (units)</label>
    <input id="${id}" type="number" step="any" min="${i ? 0 : 0.01}" inputmode="decimal" required></div>
  `).join('');

  const trialGroups = [['A', 0], ['B', 25], ['C', 12]];
  const wrapHole = index => (index + 38) % 38;
  const trialMarks = new Map(trialGroups.map(([mark, center]) => [center, mark]));
  const trialHoles = new Set(trialGroups.flatMap(([, center]) =>
    [-1, 0, 1].map(offset => wrapHole(center + offset))));
  const holes = Array.from({length: 38}, (_, index) => {
    const angle = index * 2 * Math.PI / 38;
    const x = 160 - 134 * Math.sin(angle);
    const y = 160 - 134 * Math.cos(angle);
    const mark = trialMarks.get(index);
    const trialHole = trialHoles.has(index);
    return `<g>
      <circle cx="${x}" cy="${y}" r="8" fill="${trialHole ? '#ffad68' : '#35271f'}"/>
      <text x="${x}" y="${y + 2.8}" fill="${trialHole ? '#231306' : '#f7e8da'}" font-size="8">${index + 1}</text>
      ${mark ? `<text x="${160 - 108 * Math.sin(angle)}" y="${164 - 108 * Math.cos(angle)}" fill="#ffad68" font-size="13" font-weight="bold">${mark}</text>` : ''}
    </g>`;
  }).join('');
  $('hub').innerHTML = `<svg viewBox="0 0 320 320" role="img" aria-label="Front looking aft. Hub weight holes numbered counterclockwise from A.">
    <g text-anchor="middle">${holes}<text x="160" y="160" fill="#f7e8da" font-size="14">WEIGHT HOLES</text>
    <text x="160" y="180" fill="#ffad68" font-size="12">↺ COUNTERCLOCKWISE</text>
    <text x="160" y="200" fill="#f7e8da" font-size="11">FRONT LOOKING AFT</text></g>
  </svg><p class="hint">Diagram hole numbers are relative to A, shown at the top.</p>
    <ul class="hint">${trialGroups.map(([mark, center]) =>
      `<li><strong>${mark} weight holes</strong> · ${[-1, 0, 1].map(offset =>
        wrapHole(center + offset) + 1).join(' · ')}</li>`).join('')}</ul>`;

  function draw(m) {
    const scale = 149 / Math.max(m.ri + Math.max(...m.rads), m.r, 0.1);
    const px = x => 180 + scale * x;
    const py = y => 180 - scale * y;
    const circles = m.centers.map((c, i) => `
      <circle cx="${px(c.x)}" cy="${py(c.y)}" r="${m.rads[i] * scale}" stroke="${colors[i]}" fill="none" stroke-width="1.6"/>
      <circle cx="${px(c.x)}" cy="${py(c.y)}" r="3" fill="${colors[i]}"/>
    `).join('');
    return `<svg viewBox="0 0 360 360" role="img" aria-label="Three-shot polar plot, clockwise from zero at the top">
      <path d="M180 24V336M24 180H336" stroke="#615349" stroke-dasharray="3 5"/>
      <g fill="#e8d6c6" font-size="11" text-anchor="middle">
      <text x="180" y="17">0°</text><text x="345" y="174">90°</text>
      <text x="180" y="350">180°</text><text x="15" y="174">270°</text></g>
      <circle cx="180" cy="180" r="${m.ri * scale}" stroke="#cab29e" stroke-dasharray="5 4" fill="none"/>
      ${circles}
      <path d="M180 180L${px(m.x)} ${py(m.y)}" stroke="#ff9650" stroke-width="3"/>
      <circle cx="${px(m.x)}" cy="${py(m.y)}" r="4" fill="#ff9650"/>
      <circle cx="180" cy="180" r="2.5" fill="#fff"/>
      </svg><p class="hint legend">${colors.map((c, i) => `<span><b style="color:${c}">●</b>${"ABC"[i]} · U${i + 1}</span>`).join('')}<span>Dashed ring · U₀</span></p>`;
  }

  function clearPlot() {
    $('result').innerHTML = prompt;
    $('plot').innerHTML = '';
  }

  $('worksheet').addEventListener('input', clearPlot);
  $('worksheet').addEventListener('reset', clearPlot);

  $('worksheet').addEventListener('submit', event => {
    event.preventDefault();
    const readings = fields.map(id => $(id).valueAsNumber);
    const model = estimate(readings);
    const weight = $('weight').valueAsNumber * (model.ri / model.r);
    const direction = model.angle < 0 ? 'CCW' : 'CW';
    // Suppress an unstable ratio when the fitted vector cannot be distinguished
    // from the circle disagreement or from a zero-length vector.
    const resolved = Number.isFinite(weight) && model.r > Math.max(1e-6 * model.ri, model.residual);
    $('result').innerHTML = `<div class="result"><div class="tag">NUMERICAL PLOT ESTIMATE</div>
      ${resolved ? `<div class="big">${weight.toFixed(1)} g · ${Math.abs(model.angle).toFixed(1)}° ${direction}</div>`
        : '<p>No resolved weight estimate from this plot.</p>'}
      <p class="hint">R₁ ${model.r.toFixed(2)} units · Circle fit RMS ${model.residual.toFixed(3)} units · N1 ${$('n1').valueAsNumber}%</p>
      <p class="hint">Angle is relative to A. Use Figure 507 in the controlled manual for equivalent weight selection.</p>
      </div>`;
    $('plot').innerHTML = draw(model);
  });

  $('example').addEventListener('click', () => {
    const example = {n1: 97.6, weight: 51.9, u0: 5, u1: 3.3, u2: 5.6, u3: 6.7};
    Object.entries(example).forEach(([id, value]) => { $(id).value = value; });
    $('worksheet').requestSubmit();
  });

  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}
