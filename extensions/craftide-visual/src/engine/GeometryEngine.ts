import * as vscode from 'vscode';

export class GeometryEngine {
    private _panel: vscode.WebviewPanel | undefined;
    constructor(private readonly extensionUri: vscode.Uri) { }

    open(): void {
        if (this._panel) { this._panel.reveal(vscode.ViewColumn.Beside); return; }
        this._panel = vscode.window.createWebviewPanel(
            'craftide.3dEngine', '🧊 3D Geometry Engine', vscode.ViewColumn.Beside,
            { enableScripts: true, retainContextWhenHidden: true, localResourceRoots: [this.extensionUri] }
        );
        this._panel.webview.html = this._getHtml();
        this._panel.webview.onDidReceiveMessage(async (data) => {
            if (data.type === 'insertCode') {
                const editor = vscode.window.activeTextEditor;
                if (editor) { await editor.edit(e => e.insert(editor.selection.active, data.code)); }
            } else if (data.type === 'copyCode') {
                await vscode.env.clipboard.writeText(data.code);
                vscode.window.showInformationMessage('⛏️ Kod panoya kopyalandı!');
            }
        });
        this._panel.onDidDispose(() => { this._panel = undefined; });
    }

    private _getHtml(): string {
        return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:var(--vscode-font-family);background:#0a0a15;color:#dfe6e9;height:100vh;display:flex;flex-direction:column;overflow:hidden}
.header{display:flex;align-items:center;gap:8px;padding:8px 16px;background:#111122;border-bottom:1px solid #252547}
.header h3{font-size:13px;background:linear-gradient(135deg,#3498db,#9b59b6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-right:auto}
.tabs{display:flex;gap:4px;padding:0 16px;background:#0e0e20;border-bottom:1px solid #252547}
.tab{padding:8px 16px;font-size:11px;cursor:pointer;border-bottom:2px solid transparent;color:#636e72;transition:all .2s}
.tab:hover{color:#dfe6e9}.tab.active{color:#3498db;border-bottom-color:#3498db}
.main{flex:1;display:flex;overflow:hidden}
.viewport{flex:1;position:relative}
#c3d{width:100%;height:100%;display:block}
.ctrl{width:240px;background:#111122;border-left:1px solid #252547;padding:16px;overflow-y:auto}
.ctrl h4{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#636e72;margin-bottom:8px}
.cg{margin-bottom:14px}
.cr{display:flex;align-items:center;gap:8px;margin-bottom:6px}
.cr label{font-size:11px;color:#b2bec3;width:30px;flex-shrink:0}
.cr input[type=range]{flex:1;height:4px;accent-color:#3498db}
.cr input[type=number]{width:55px;padding:4px;background:#1a1a2e;border:1px solid #3d3d5c;border-radius:4px;color:#dfe6e9;font-size:11px;text-align:center}
.cr input[type=color]{width:30px;height:24px;border:none;cursor:pointer}
select{width:100%;padding:6px;background:#1a1a2e;border:1px solid #3d3d5c;border-radius:4px;color:#dfe6e9;font-size:11px}
.br{display:flex;gap:6px;margin-top:12px}
.b{flex:1;padding:7px;border:1px solid #3d3d5c;border-radius:6px;background:#1a1a2e;color:#dfe6e9;font-size:11px;cursor:pointer;text-align:center;transition:all .2s}
.b:hover{background:#252547;border-color:#3498db}.b.p{background:#3498db;color:#fff;border-color:#3498db}
.co{margin-top:14px;padding:10px;background:#0a0a15;border:1px solid #252547;border-radius:6px;font-family:monospace;font-size:11px;color:#2ecc71;white-space:pre-wrap;max-height:180px;overflow-y:auto}
.info{padding:4px 16px;background:#0e0e20;border-top:1px solid #252547;font-size:10px;color:#636e72}
</style></head><body>
<div class="header"><h3>🧊 CraftIDE 3D Engine</h3></div>
<div class="tabs">
<div class="tab active" onclick="sT('p')">🌟 Parçacık</div>
<div class="tab" onclick="sT('v')">📐 Vektör</div>
</div>
<div class="main">
<div class="viewport"><canvas id="c3d"></canvas></div>
<div class="ctrl">
<div id="pC">
<h4>🌟 Parçacık Efekti</h4>
<div class="cg"><label style="font-size:11px;display:block;margin-bottom:4px">Tür</label>
<select id="pT" onchange="uP()"><option value="FLAME">🔥 Alev</option><option value="REDSTONE">💎 Redstone</option><option value="HEART">❤️ Kalp</option><option value="CLOUD">☁️ Bulut</option><option value="SMOKE_NORMAL">💨 Duman</option><option value="PORTAL">🌀 Portal</option><option value="NOTE">🎵 Nota</option><option value="EXPLOSION_LARGE">💥 Patlama</option></select></div>
<div class="cg"><h4>Şekil</h4><select id="pS" onchange="uP()"><option value="circle">⭕ Daire</option><option value="sphere">🔮 Küre</option><option value="helix">🌀 Helis</option><option value="cube">🧊 Küp</option><option value="star">⭐ Yıldız</option></select></div>
<div class="cg"><h4>Parametreler</h4>
<div class="cr"><label>R</label><input type="range" id="rad" min="0.5" max="10" step="0.1" value="3" oninput="uP()"><input type="number" id="radN" value="3" min="0.5" max="10" step="0.1" onchange="document.getElementById('rad').value=this.value;uP()"></div>
<div class="cr"><label>N</label><input type="range" id="cnt" min="5" max="200" step="1" value="50" oninput="uP()"><input type="number" id="cntN" value="50" min="5" max="200" onchange="document.getElementById('cnt').value=this.value;uP()"></div>
<div class="cr"><label>Renk</label><input type="color" id="pCol" value="#ff6b6b" onchange="uP()"></div>
</div></div>
<div id="vC" style="display:none"><h4>📐 Vektör Hesaplayıcı</h4>
<div class="cg"><h4>Vektör A</h4><div class="cr"><label>X</label><input type="number" id="ax" value="1" step="0.5"></div><div class="cr"><label>Y</label><input type="number" id="ay" value="2" step="0.5"></div><div class="cr"><label>Z</label><input type="number" id="az" value="3" step="0.5"></div></div>
<div class="cg"><h4>Vektör B</h4><div class="cr"><label>X</label><input type="number" id="bx" value="4" step="0.5"></div><div class="cr"><label>Y</label><input type="number" id="by" value="1" step="0.5"></div><div class="cr"><label>Z</label><input type="number" id="bz" value="2" step="0.5"></div></div>
<div class="br"><div class="b" onclick="cV('add')">A+B</div><div class="b" onclick="cV('sub')">A-B</div><div class="b" onclick="cV('cross')">A×B</div><div class="b" onclick="cV('dot')">A·B</div></div></div>
<div class="co" id="cO">// Ayarları değiştirin ⛏️</div>
<div class="br"><div class="b" onclick="vscode.postMessage({type:'copyCode',code:document.getElementById('cO').textContent})">📋 Kopyala</div><div class="b p" onclick="vscode.postMessage({type:'insertCode',code:document.getElementById('cO').textContent})">📥 Editöre Ekle</div></div>
</div></div>
<div class="info"><span id="fps">FPS: --</span></div>
<script>
const vscode=acquireVsCodeApi(),cv=document.getElementById('c3d'),cx=cv.getContext('2d'),cO=document.getElementById('cO');
let rX=.5,rY=.5,pts=[],mD=false,mX=0,mY=0;
function rs(){cv.width=cv.parentElement.clientWidth;cv.height=cv.parentElement.clientHeight}
rs();window.addEventListener('resize',rs);
function pj(x,y,z){const cX=Math.cos(rX),sX=Math.sin(rX),cY=Math.cos(rY),sY=Math.sin(rY);const y1=y*cX-z*sX,z1=y*sX+z*cX,x1=x*cY-z1*sY,z2=x*sY+z1*cY;const s=300/(z2+8);return{x:cv.width/2+x1*s,y:cv.height/2-y1*s,s,z:z2}}
function gP(){const sh=document.getElementById('pS').value,r=parseFloat(document.getElementById('rad').value),n=parseInt(document.getElementById('cnt').value),c=document.getElementById('pCol').value;pts=[];
for(let i=0;i<n;i++){const t=(i/n)*Math.PI*2;let x=0,y=0,z=0;
switch(sh){case'circle':x=Math.cos(t)*r;z=Math.sin(t)*r;break;case'sphere':const p=Math.acos(2*Math.random()-1),h=Math.random()*Math.PI*2;x=r*Math.sin(p)*Math.cos(h);y=r*Math.sin(p)*Math.sin(h);z=r*Math.cos(p);break;case'helix':x=Math.cos(t*3)*r;y=(i/n)*r*2-r;z=Math.sin(t*3)*r;break;case'cube':x=(Math.random()-.5)*r*2;y=(Math.random()-.5)*r*2;z=(Math.random()-.5)*r*2;break;case'star':const sr=(i%2===0)?r:r*.4;x=Math.cos(t)*sr;z=Math.sin(t)*sr;break}
pts.push({x,y,z,c,sz:3+Math.random()*3})}}
function uP(){document.getElementById('radN').value=document.getElementById('rad').value;document.getElementById('cntN').value=document.getElementById('cnt').value;gP();uC()}
function uC(){const t=document.getElementById('pT').value,sh=document.getElementById('pS').value,r=document.getElementById('rad').value,n=document.getElementById('cnt').value;
let c='// Particle: '+t+' ('+sh+')\\nfor(int i=0;i<'+n+';i++){\\n  double t=(i/(double)'+n+')*Math.PI*2;\\n  double x=Math.cos(t)*'+r+';\\n  double z=Math.sin(t)*'+r+';\\n  Location loc=center.clone().add(x,0,z);\\n  loc.getWorld().spawnParticle(Particle.'+t+',loc,1,0,0,0,0);\\n}';
cO.textContent=c}
let lt=0;function dr(t){const dt=t-lt;lt=t;cx.fillStyle='#0a0a15';cx.fillRect(0,0,cv.width,cv.height);
cx.strokeStyle='#1a1a2e';cx.lineWidth=.5;for(let i=-5;i<=5;i++){const a=pj(i,0,-5),b=pj(i,0,5);cx.beginPath();cx.moveTo(a.x,a.y);cx.lineTo(b.x,b.y);cx.stroke();const c=pj(-5,0,i),d=pj(5,0,i);cx.beginPath();cx.moveTo(c.x,c.y);cx.lineTo(d.x,d.y);cx.stroke()}
const o=pj(0,0,0),xE=pj(2,0,0),yE=pj(0,2,0),zE=pj(0,0,2);cx.lineWidth=2;
cx.strokeStyle='#e74c3c';cx.beginPath();cx.moveTo(o.x,o.y);cx.lineTo(xE.x,xE.y);cx.stroke();
cx.strokeStyle='#2ecc71';cx.beginPath();cx.moveTo(o.x,o.y);cx.lineTo(yE.x,yE.y);cx.stroke();
cx.strokeStyle='#3498db';cx.beginPath();cx.moveTo(o.x,o.y);cx.lineTo(zE.x,zE.y);cx.stroke();
pts.map(p=>({...p,pj:pj(p.x,p.y,p.z)})).sort((a,b)=>a.pj.z-b.pj.z).forEach(p=>{const sz=Math.max(1,p.sz*(p.pj.s/40));cx.globalAlpha=Math.max(.2,Math.min(1,p.pj.s/50));cx.fillStyle=p.c;cx.beginPath();cx.arc(p.pj.x,p.pj.y,sz,0,Math.PI*2);cx.fill()});
cx.globalAlpha=1;document.getElementById('fps').textContent='FPS: '+Math.round(1000/(dt||16));rY+=.005;requestAnimationFrame(dr)}
cv.addEventListener('mousedown',e=>{mD=true;mX=e.clientX;mY=e.clientY});
cv.addEventListener('mousemove',e=>{if(!mD)return;rY+=(e.clientX-mX)*.01;rX+=(e.clientY-mY)*.01;mX=e.clientX;mY=e.clientY});
cv.addEventListener('mouseup',()=>mD=false);cv.addEventListener('mouseleave',()=>mD=false);
function sT(t){document.querySelectorAll('.tab').forEach(e=>e.classList.remove('active'));document.querySelector('.tab[onclick*="'+t+'"]').classList.add('active');document.getElementById('pC').style.display=t==='p'?'block':'none';document.getElementById('vC').style.display=t==='v'?'block':'none'}
function cV(op){const a={x:+document.getElementById('ax').value,y:+document.getElementById('ay').value,z:+document.getElementById('az').value};const b={x:+document.getElementById('bx').value,y:+document.getElementById('by').value,z:+document.getElementById('bz').value};let r='';
switch(op){case'add':r='new Vector('+(a.x+b.x)+','+(a.y+b.y)+','+(a.z+b.z)+')';break;case'sub':r='new Vector('+(a.x-b.x)+','+(a.y-b.y)+','+(a.z-b.z)+')';break;case'cross':r='new Vector('+(a.y*b.z-a.z*b.y)+','+(a.z*b.x-a.x*b.z)+','+(a.x*b.y-a.y*b.x)+')';break;case'dot':r='// Dot = '+(a.x*b.x+a.y*b.y+a.z*b.z);break}
cO.textContent='Vector a=new Vector('+a.x+','+a.y+','+a.z+');\\nVector b=new Vector('+b.x+','+b.y+','+b.z+');\\nVector result='+r+';'}
gP();uC();requestAnimationFrame(dr);
</script></body></html>`;
    }
}
