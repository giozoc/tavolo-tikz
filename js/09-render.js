/* ============ RENDER DI UNA FIGURA ============ */
function findFigures(src){
  const out=[]; const re=/\\begin\s*\{tikzpicture\}/g; let m;
  while ((m=re.exec(src))){
    const saveS=S; S=src; const en=findEnd('tikzpicture', m.index+m[0].length, src.length); S=saveS;
    if (!en) { out.push({s:m.index, bodyS:m.index+m[0].length, bodyE:src.length, endS:src.length, e:src.length, open:true}); break; }
    out.push({s:m.index, bodyS:m.index+m[0].length, bodyE:en.s, endS:en.s, e:en.e});
    re.lastIndex=en.e;
  }
  return out;
}
const PRE_RE = /\\(tikzset|pgfplotsset|definecolor|colorlet|tikzstyle|newcommand|renewcommand|def|pgfmathsetmacro)\b/g;
function renderFigure(src, fig){
  S = src; R = newRender(); DEFS=[]; DEFN=0; userColors={};
  const base = {frame:affineFrame(M_ID), style:newStyle(), styles:{}, vars:{}, warn:mkWarn(fig?fig.s:0), axis:null, axisDefaults:[], scope:{clip:null}, layer:null};
  // preambolo: comandi fuori dalle figure
  const figs = fig ? [fig] : [];
  PRE_RE.lastIndex=0; let m;
  const all = findFigures(src);
  while ((m=PRE_RE.exec(src))){
    if (all.some(f=>m.index>=f.s && m.index<f.e)) continue;
    let j=m.index+m[0].length;
    if (m[1]==='def'){ const mm=/^\\[a-zA-Z@]+/.exec(src.slice(j)); if(mm) j+=mm[0].length; }
    if (m[1]==='newcommand'||m[1]==='renewcommand'){ j=skipWS(j); if(src[j]==='{') j=mcS(j)+1; else { const mm=/^\\[a-zA-Z@]+/.exec(src.slice(j)); if(mm) j+=mm[0].length; } }
    for (let k=0;k<3;k++){ const jj=skipWS(j); if (src[jj]==='{'||src[jj]==='['){ const e=mcS(jj); if(e<0) break; j=e+1; if(m[1]==='tikzstyle'||m[1]==='def'||m[1]==='newcommand') { if(src[skipWS(j)]==='='){ j=skipWS(j)+1; continue; } if(m[1]!=='tikzstyle') break; } } else if (src[jj]==='=') j=jj+1; else break; }
    try { run(m.index, j, base); } catch(e){}
  }
  R.warns = [];
  let bs=0, be=src.length;
  if (fig){
    bs=fig.bodyS; be=fig.bodyE;
    const op=readOpt(bs);
    if (op){ const M=applyOpts(base.style, op.text, {vars:base.vars, styles:base.styles, warn:mkWarn(op.s)}); base.frame=affineFrame(M); base.style.nodeRot=0; bs=op.e+1; R.picOpts={s:op.s,e:op.e}; }
    R.picStart = fig.s; R.insertAt = fig.endS;
  } else { R.insertAt = src.length; }
  try { run(bs, be, base); } catch(e){ console.error(e); R.warns.push({pos:bs, msg:'errore interno: '+e.message, kind:'e'}); }
  return `<defs>${DEFS.join('')}</defs>${R.bg.join('')}${R.out.join('')}`;
}
