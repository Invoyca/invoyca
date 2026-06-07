// @ts-nocheck
// Şablon şema/wireframe önizleme — sol listede gösterilir (gerçek faturayı küçültmek yerine düzeni temsil eder)
export function thumbSchema(variant: string, c: string, lt: string): string {

    const bar=(w,h,x,y,col,r)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r||1}" fill="${col}"/>`;
    const g="#e2e8f0", g2="#cbd5e1";
    const rows=(x,y,w)=>[0,1,2].map(i=>bar(w-10,2,x,y+i*7,g)).join("")+[0,1,2].map(i=>bar(8,2,x+w-8,y+i*7,g2)).join("");
    let s=""; const W=64,H=90;
    switch(variant){
      case "standard": s=bar(10,10,8,8,c,2)+bar(20,3,40,9,c)+rows(8,28,48)+bar(20,3,36,64,c); break;
      case "bordered": s=`<rect x="5" y="5" width="54" height="80" rx="2" fill="none" stroke="${c}" stroke-width="1.2"/>`+bar(54,12,5,5,lt)+bar(8,6,9,8,c,1)+rows(10,34,44)+bar(20,3,34,72,c); break;
      case "centered": s=bar(10,10,27,8,c,2)+bar(24,3,20,22,c)+rows(10,40,44)+bar(20,3,34,72,c); break;
      case "letterhead": s=bar(64,4,0,0,c)+bar(10,8,8,12,c,1)+bar(18,3,38,14,c)+rows(8,34,48)+bar(64,10,0,80,c); break;
      case "detailed": s=bar(9,9,8,8,c,1)+bar(16,3,40,9,c)+bar(24,12,8,24,lt,2)+bar(24,12,34,24,lt,2)+rows(8,42,48); break;
      case "band": s=bar(64,22,0,0,c)+bar(8,8,8,7,"#fff",1)+bar(20,4,34,9,"#fff")+rows(8,34,48); break;
      case "sidebar": s=bar(20,90,0,0,c)+bar(8,8,6,8,"#fff",1)+bar(20,4,28,10,c)+rows(28,30,30); break;
      case "split": s=bar(64,30,0,0,c)+`<rect x="6" y="24" width="24" height="16" rx="2" fill="#fff" stroke="${g}"/>`+`<rect x="34" y="24" width="24" height="16" rx="2" fill="#fff" stroke="${g}"/>`+rows(8,48,48); break;
      case "card": s=`<rect x="5" y="6" width="54" height="78" rx="5" fill="#fff" stroke="${g}"/>`+bar(8,8,10,11,c,1)+bar(14,7,40,11,c,2)+bar(20,10,10,24,lt,2)+bar(20,10,34,24,lt,2)+rows(10,42,44); break;
      case "accent": s=bar(2,12,8,8,c)+bar(8,8,13,8,c,1)+bar(18,4,38,10,c)+bar(2,8,8,30,c)+bar(2,18,8,44,c)+rows(13,46,42); break;
      case "mono": s=bar(8,8,8,8,g2,1)+bar(18,3,38,9,g2)+bar(40,1,8,26,g)+rows(8,32,48); break;
      case "wide": s=bar(22,3,8,8,c)+bar(8,1,8,14,c)+bar(8,8,8,24,g2,1)+rows(8,44,48); break;
      case "line": s=bar(8,7,8,8,g2,1)+bar(18,3,38,9,c)+bar(48,1.5,8,20,"#0f172a")+rows(8,28,48)+bar(48,1.5,8,62,"#0f172a"); break;
      case "corner": s=bar(9,9,8,8,g2,1)+bar(18,4,38,9,c)+rows(8,50,48); break;
      case "serif": s=bar(10,10,27,8,g2,2)+bar(26,4,19,22,c)+rows(8,44,48); break;
      case "dense": s=bar(7,7,6,6,c,1)+bar(16,3,42,7,c)+bar(56,1,4,16,c)+[0,1,2,3,4,5].map(i=>bar(56,1.5,4,22+i*5,g)).join(""); break;
      case "grid": s=bar(8,7,6,6,c,1)+bar(16,3,42,7,c)+`<rect x="5" y="20" width="54" height="40" rx="2" fill="none" stroke="${g}"/>`+bar(54,6,5,20,c)+[0,1,2].map(i=>bar(54,6,5,26+i*6,i%2?lt:"#fff")).join(""); break;
      case "header": s=bar(64,16,0,0,c)+bar(7,7,7,5,"#fff",1)+bar(14,5,42,7,"#fff")+rows(8,26,48); break;
      case "twin": s=bar(8,7,6,6,c,1)+bar(16,3,42,7,c)+`<rect x="5" y="20" width="54" height="9" rx="2" fill="none" stroke="${g}"/>`+rows(8,38,48); break;
      case "receipt": s=bar(8,8,28,6,g2,1)+bar(16,3,24,18,c)+`<line x1="14" y1="28" x2="50" y2="28" stroke="${g2}" stroke-dasharray="2 2"/>`+[0,1,2].map(i=>bar(36,1.5,14,34+i*6,g)).join("")+bar(12,12,26,62,"#fff",1)+`<rect x="26" y="62" width="12" height="12" fill="none" stroke="${g2}"/>`; break;
      case "block": s=bar(64,30,0,0,c)+`<circle cx="58" cy="4" r="10" fill="#fff" opacity="0.12"/>`+bar(8,8,8,7,"#fff",1)+bar(26,6,8,18,"#fff")+rows(8,42,48); break;
      case "dark": s=bar(64,90,0,0,"#0f172a")+bar(8,8,8,8,c,1)+bar(20,5,38,9,c)+[0,1,2].map(i=>bar(48,2,8,34+i*7,"#334155")).join("")+bar(20,3,36,66,c); break;
      case "diagonal": s=`<path d="M0 0 H64 V26 L0 34 Z" fill="${c}"/>`+bar(8,8,8,8,"#fff",1)+bar(20,5,34,10,"#fff")+rows(8,44,48); break;
      case "stamp": s=bar(9,9,8,8,c,1)+bar(16,3,40,9,c)+rows(8,28,48)+`<rect x="36" y="62" width="22" height="16" rx="3" fill="${c}"/>`; break;
      case "frame": s=`<rect x="4" y="4" width="56" height="82" rx="2" fill="none" stroke="${c}" stroke-width="3"/>`+bar(52,10,6,6,c)+bar(8,5,9,8,"#fff",1)+rows(11,30,42); break;
      default: s=rows(8,20,48);
    }
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="100%" style="display:block;background:#fff">${s}</svg>`;
  
}
