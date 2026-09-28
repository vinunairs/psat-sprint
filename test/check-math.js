global.window=undefined;
const C=require('../js/core.js'); globalThis.PSCore=C;
const MG=require('../js/mathgen.js');
let bad=0,total=0; const fails={};
const norm=s=>C.parseAnswer(String(s).replace(/[$°%π,]/g,''));
for(const [dom,list] of Object.entries(MG.BY_DOMAIN)) for(const name of list) for(const L of [1,2,3]) for(let i=0;i<400;i++){
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
  if(errs.length){bad++; if(!fails[name+L]) fails[name+L]=errs.join('; ')+' :: '+q.q.slice(0,80)+' | '+q.o.join(' / ');}
}
console.log('total',total,'bad',bad); for(const [k,v] of Object.entries(fails)) console.log(k,'->',v);
