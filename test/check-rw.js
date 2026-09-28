const C=require('../js/core.js');globalThis.PSCore=C;const RW=require('../js/rwgen.js');const BANK=require('../js/rwbank.js');
let bad=0,n=0;
for(const [name,fn] of Object.entries(RW.fns)) for(let i=0;i<500;i++){const q=RW.build(fn,C.makeRng(i*31+name.length));n++;
 const errs=[]; if(!q){bad++;console.log(name,'NULL');continue;}
 if(q.o.length!==4||new Set(q.o).size!==4) errs.push('opts');
 if(/undefined|NaN|null/.test(JSON.stringify(q))) errs.push('token');
 if(!(q.a>=0&&q.a<4)) errs.push('a');
 if(errs.length){bad++; if(bad<6) console.log(name,errs,q.p,q.o);}}
const ids=new Set(); for(const q of BANK){n++; const errs=[]; if(ids.has(q.id)) errs.push('dup id'); ids.add(q.id);
 if(q.o.length!==4||new Set(q.o).size!==4) errs.push('opts'); if(!(q.a>=0&&q.a<4)) errs.push('a'); if(!['ii','cs','eoi','sec'].includes(q.d)) errs.push('dom'); if(!q.e||!q.q) errs.push('missing');
 if(errs.length){bad++;console.log(q.id,errs);}}
const byd={};BANK.forEach(q=>byd[q.d]=(byd[q.d]||0)+1);
console.log('checked',n,'bad',bad,'bank by domain',byd,'banks',RW.counts);
// answer-position spread in bank
const pos=[0,0,0,0];BANK.forEach(q=>pos[q.a]++);console.log('bank answer positions',pos);
for(const [name,fn] of Object.entries(RW.fns)){const q=RW.build(fn,C.makeRng(7));console.log('\n== '+name+'\n'+q.p+(q.table?'\n'+JSON.stringify(q.table.rows):'')+'\n'+q.o.map((o,i)=>(i===q.a?'*':' ')+o).join(' | ')+'\nE: '+q.e);}
