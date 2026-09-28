global.window=undefined;
const C=require('../js/core.js'); globalThis.PSCore=C;
const MG=require('../js/mathgen.js');globalThis.MathGen=MG;require('../js/mathgen2.js');require('../js/mathgen3.js');
let bad=0,total=0; const fails={};
const norm=s=>C.parseAnswer(String(s).replace(/[$°%π,]/g,''));
const ALL=Object.entries(MG.BY_DOMAIN).map(([d,l])=>[d,l.map(n=>[n,[1,2,3]])]).concat(Object.entries(MG.HARD).map(([d,l])=>[d,l.map(n=>[n,[3]])]));
for(const [dom,list] of ALL) for(const [name,LV] of list) for(const L of LV) for(let i=0;i<400;i++){
  const r=C.makeRng(i*977+L*13+name.length*101);
  let q; try{q=MG.build(name,r,L); if(!q){fails[name+L]='NULL';bad++;continue;}}catch(e){fails[name+L]=(fails[name+L]||'THROW '+e.message);bad++;continue;}
  total++;
  const errs=[];
  if(!q.o||q.o.length!==4) errs.push('opts '+(q.o&&q.o.length));
  if(new Set(q.o).size!==4) errs.push('dup opts '+q.o);
  if(!(q.a>=0&&q.a<4)) errs.push('a');
  const txt=JSON.stringify(q);
  if(/NaN|undefined|Infinity|null/.test(txt.replace(/"spr":null/,''))) errs.push('bad token');
  if(q.spr!=null){const v=norm(q.o[q.a]); if(!isNaN(v)&&Math.abs(v-q.spr)>1e-6) errs.push(`spr mismatch ${q.o[q.a]} vs ${q.spr}`);}
  if(!q.key||!q.e||!q.q) errs.push('missing');
  if(q.chart){const c=q.chart; if(c.points) for(const [x,y] of c.points){ if(c.x.min!=null&&(x<c.x.min||x>c.x.max)) errs.push('pt x out '+x); if(y<c.y.min||y>c.y.max) errs.push('pt y out '+y+' range '+c.y.min+'..'+c.y.max);} if(c.bars&&c.bars.some(b=>b[1]>c.y.max)) errs.push('bar out');}
  if(errs.length){bad++; if(!fails[name+L]) fails[name+L]=errs.join('; ')+' :: '+q.q.slice(0,80)+' | '+q.o.join(' / ');}
}
console.log('total',total,'bad',bad); for(const [k,v] of Object.entries(fails)) console.log(k,'->',v);
