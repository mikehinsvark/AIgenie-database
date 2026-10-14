import * as THREE from './vendor/three/three.module.min.js';

// A self-contained visual. It never reads or writes contact data.
let disposeCurrent = () => {};
let currentStage = null;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
let userPaused = false;
try { userPaused = sessionStorage.getItem('gold-mine-motion-paused') === 'yes'; } catch {}

function diamondGeometry() {
  const positions = [], colors = [];
  const point = (radius, y, angle) => new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
  const levels = [[.52,.68,0],[.84,.40,Math.PI/16],[1.04,.02,0],[1.04,-.025,0],[.53,-.64,Math.PI/16],[.012,-1.23,0]];
  const rings = levels.map(([r,y,offset]) => Array.from({length:16},(_,i)=>point(r,y,i*Math.PI/8+offset)));
  function triangle(a,b,c,top=false) {
    const n = new THREE.Vector3().subVectors(b,a).cross(new THREE.Vector3().subVectors(c,a));
    const midpoint = a.clone().add(b).add(c).multiplyScalar(1/3);
    if(top ? n.y<0 : n.x*midpoint.x+n.z*midpoint.z<0) [b,c]=[c,b];
    const variation = .92 + Math.sin(positions.length * .73) * .045;
    const color = new THREE.Color('#f6c765').multiplyScalar(variation);
    [a,b,c].forEach(v=>{positions.push(v.x,v.y,v.z);colors.push(color.r,color.g,color.b);});
  }
  for(let row=0;row<rings.length-1;row++)for(let i=0;i<16;i++){
    const next=(i+1)%16;
    triangle(rings[row][i],rings[row+1][i],rings[row][next]);
    triangle(rings[row][next],rings[row+1][i],rings[row+1][next]);
  }
  for(let i=0;i<16;i++)triangle(new THREE.Vector3(0,.68,0),rings[0][i],rings[0][(i+1)%16],true);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  geometry.computeVertexNormals();
  return geometry;
}

function reflectionTexture() {
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;
  const ctx=canvas.getContext('2d');
  const base=ctx.createLinearGradient(0,0,0,512);
  base.addColorStop(0,'#b0c9df');base.addColorStop(.28,'#63748b');base.addColorStop(.5,'#3d3020');base.addColorStop(.77,'#9d875a');base.addColorStop(1,'#586477');
  ctx.fillStyle=base;ctx.fillRect(0,0,1024,512);
  // Soft studio reflection panels create moving highlights on the metal facets.
  for(const [x,y,w,h,c] of [[90,60,150,265,'#fff6db'],[370,40,55,360,'#ffffff'],[600,10,170,150,'#fff3cc'],[835,70,40,315,'#a6e8ff'],[985,180,25,140,'#ffe8aa'],[25,370,280,110,'#f4cf83'],[540,340,95,150,'#fff5df'],[860,390,75,100,'#e3c98c']]){
    ctx.fillStyle=c;ctx.shadowBlur=22;ctx.shadowColor=c;ctx.fillRect(x,y,w,h);
  }
  ctx.shadowBlur=0;
  const texture=new THREE.CanvasTexture(canvas);texture.mapping=THREE.EquirectangularReflectionMapping;texture.colorSpace=THREE.SRGBColorSpace;
  return texture;
}

function glowTexture() {
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;
  const ctx=canvas.getContext('2d'),g=ctx.createRadialGradient(64,64,0,64,64,64);
  g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.055,'rgba(255,255,255,.95)');g.addColorStop(.15,'rgba(255,255,255,.32)');g.addColorStop(.4,'rgba(255,255,255,.07)');g.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=g;ctx.fillRect(0,0,128,128);
  return new THREE.CanvasTexture(canvas);
}

function start(stage) {
  const wrapper=stage.closest('.gold-network'),button=wrapper.querySelector('.motion-toggle');
  let renderer;
  try { renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'}); }
  catch { stage.classList.add('is-still');wrapper.classList.add('is-still');return()=>{}; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.65));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
  renderer.setClearColor(0x000000,0);
  renderer.domElement.setAttribute('aria-hidden','true');
  stage.appendChild(renderer.domElement);
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(42,1,.1,40);camera.position.set(0,.16,6.6);camera.lookAt(0,0,0);
  const envTexture=reflectionTexture(),pmrem=new THREE.PMREMGenerator(renderer);
  const environment=pmrem.fromEquirectangular(envTexture);
  scene.environment=environment.texture;pmrem.dispose();envTexture.dispose();
  const cluster=new THREE.Group();scene.add(cluster);cluster.position.y=.12;
  const glow=glowTexture();
  const jewel=new THREE.Group();cluster.add(jewel);jewel.position.y=.12;
  const geometry=diamondGeometry();
  const gold=new THREE.MeshPhysicalMaterial({vertexColors:true,metalness:1,roughness:.19,clearcoat:.65,clearcoatRoughness:.15,envMapIntensity:2,side:THREE.DoubleSide});
  const stone=new THREE.Mesh(geometry,gold);jewel.add(stone);
  const edges=new THREE.LineSegments(new THREE.EdgesGeometry(geometry,13),new THREE.LineBasicMaterial({color:0xffdf94,transparent:true,opacity:.2}));jewel.add(edges);
  jewel.rotation.set(.07,.38,-.035);
  const key=new THREE.DirectionalLight(0xffefcf,3.1);key.position.set(-3,4,5);scene.add(key);
  const rim=new THREE.DirectionalLight(0x71d7ff,1.7);rim.position.set(3,1,-2);scene.add(rim);
  const fill=new THREE.DirectionalLight(0xffd578,1.4);fill.position.set(-2,-2,2);scene.add(fill);
  scene.add(new THREE.AmbientLight(0x90aac4,.4));

  function lightSprite(color,size,opacity=1) {
    const material=new THREE.SpriteMaterial({map:glow,color,transparent:true,opacity,blending:THREE.AdditiveBlending,depthWrite:false});
    const sprite=new THREE.Sprite(material);sprite.scale.setScalar(size);return sprite;
  }
  const tipGlow=lightSprite(0xffd88a,.72,.78);tipGlow.position.set(0,-1.13,.03);cluster.add(tipGlow);
  const aura=lightSprite(0xd99a30,3.6,.16);aura.position.z=-.8;cluster.add(aura);
  const orbitDefs=[{radius:1.60,tilt:[1.12,.12,-.28],color:0xffd77b,speed:.22},{radius:2.00,tilt:[-.64,.22,.46],color:0xf4c36b,speed:-.16},{radius:2.17,tilt:[1.35,-.30,-.26],color:0x53d8ff,speed:.12},{radius:2.28,tilt:[.22,-.52,.12],color:0x987741,speed:-.07}];
  const orbits=[];
  for(const [index,def] of orbitDefs.entries()){
    const group=new THREE.Group();group.rotation.set(...def.tilt);cluster.add(group);
    group.add(new THREE.Mesh(new THREE.TorusGeometry(def.radius,index===3?.004:.009,6,160),new THREE.MeshBasicMaterial({color:def.color,transparent:true,opacity:index===3?.25:.68})));
    group.add(new THREE.Mesh(new THREE.TorusGeometry(def.radius,.031,5,160),new THREE.MeshBasicMaterial({color:def.color,transparent:true,opacity:.047,blending:THREE.AdditiveBlending,depthWrite:false})));
    const traveller=new THREE.Group();group.add(traveller);
    const bead=new THREE.Mesh(new THREE.SphereGeometry(.030,12,8),new THREE.MeshBasicMaterial({color:index===2?0xc4ffff:0xfff1bc}));bead.position.x=def.radius;traveller.add(bead);
    const flare=lightSprite(def.color,index===3?.35:.59,index===3?.35:.8);flare.position.x=def.radius;traveller.add(flare);
    const tailPositions=[],tailColors=[];
    for(let j=0;j<50;j++){const theta=-j*.012;tailPositions.push(Math.cos(theta)*def.radius,Math.sin(theta)*def.radius,0);const c=new THREE.Color(def.color).multiplyScalar(Math.pow(1-j/50,2)*1.5);tailColors.push(c.r,c.g,c.b);}
    const tailGeometry=new THREE.BufferGeometry();tailGeometry.setAttribute('position',new THREE.Float32BufferAttribute(tailPositions,3));tailGeometry.setAttribute('color',new THREE.Float32BufferAttribute(tailColors,3));
    traveller.add(new THREE.Line(tailGeometry,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.95,blending:THREE.AdditiveBlending,depthWrite:false})));
    orbits.push({group,traveller,...def,offset:index*1.7});
  }

  let seed=714;const rand=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646};
  const dustPositions=[],dustColors=[];
  for(let i=0;i<210;i++){
    const theta=rand()*Math.PI*2,radius=1.1+rand()*1.65;
    dustPositions.push(Math.cos(theta)*radius,(rand()-.5)*3.5,Math.sin(theta)*radius*.52-.6);
    const color=new THREE.Color(i%4===0?0x3fa9d4:0xd7ae62).multiplyScalar(.32+rand()*.75);dustColors.push(color.r,color.g,color.b);
  }
  const dustGeometry=new THREE.BufferGeometry();dustGeometry.setAttribute('position',new THREE.Float32BufferAttribute(dustPositions,3));dustGeometry.setAttribute('color',new THREE.Float32BufferAttribute(dustColors,3));
  const dust=new THREE.Points(dustGeometry,new THREE.PointsMaterial({size:.053,map:glow,transparent:true,opacity:.8,vertexColors:true,blending:THREE.AdditiveBlending,depthWrite:false}));cluster.add(dust);
  const wavePositions=[],waveColors=[];
  for(let x=0;x<72;x++)for(let z=0;z<14;z++){
    const px=(x/71-.5)*7,pz=(z/13-.5)*2;
    wavePositions.push(px,-1.98+Math.sin(px*1.2+pz*2)*.12,pz-.5);
    const color=new THREE.Color(x>46?0xd1a14e:0x258bb8).multiplyScalar(.22+.4*(1-z/14));waveColors.push(color.r,color.g,color.b);
  }
  const waveGeometry=new THREE.BufferGeometry();waveGeometry.setAttribute('position',new THREE.Float32BufferAttribute(wavePositions,3));waveGeometry.setAttribute('color',new THREE.Float32BufferAttribute(waveColors,3));
  const wave=new THREE.Points(waveGeometry,new THREE.PointsMaterial({size:.024,map:glow,transparent:true,vertexColors:true,opacity:.6,depthWrite:false,blending:THREE.AdditiveBlending}));scene.add(wave);

  let frame=0,last=0,time=0,visible=true,alive=true,contextLost=false;
  const paused=()=>userPaused||reduced.matches;
  function paint() {
    jewel.rotation.y=.38+time*.36;
    jewel.rotation.z=-.035+Math.sin(time*.33)*.035;
    jewel.position.y=.12+Math.sin(time*.65)*.055;
    tipGlow.position.y=-1.11+Math.sin(time*.65)*.055;
    for(const orbit of orbits){orbit.traveller.rotation.z=orbit.offset+time*orbit.speed;orbit.group.rotation.z=orbit.tilt[2]+Math.sin(time*.15+orbit.offset)*.085;}
    dust.rotation.y=time*.025;wave.rotation.y=Math.sin(time*.08)*.08;
    renderer.render(scene,camera);
  }
  function tick(now) {
    frame=0;if(!alive||contextLost)return;
    if(last)time+=Math.min((now-last)/1000,.05);last=now;paint();
    if(!paused()&&visible&&!document.hidden)frame=requestAnimationFrame(tick);
  }
  function sync() {
    cancelAnimationFrame(frame);frame=0;last=0;
    if(!alive||contextLost)return;
    const stopped=paused();wrapper.classList.toggle('motion-paused',stopped);
    button.setAttribute('aria-pressed',String(stopped));button.setAttribute('aria-label',stopped?'Play diamond animation':'Pause diamond animation');
    button.innerHTML=stopped?'<span aria-hidden="true">▷</span><span>Play motion</span>':'<span aria-hidden="true">Ⅱ</span><span>Pause motion</span>';
    // Respect the OS preference; the control remains a clear indication of it.
    button.disabled=reduced.matches;button.title=reduced.matches?'Reduced motion is enabled in your device settings.':'';
    if(visible&&!document.hidden){paint();if(!stopped)frame=requestAnimationFrame(tick);}
  }
  function resize() {
    const width=stage.clientWidth,height=stage.clientHeight;if(!width||!height||contextLost)return;
    renderer.setSize(width,height,false);camera.aspect=width/height;
    camera.position.z=width<360?7.6:6.6;camera.updateProjectionMatrix();paint();
  }
  function toggle(){userPaused=!userPaused;try{sessionStorage.setItem('gold-mine-motion-paused',userPaused?'yes':'no')}catch{}sync();}
  function loseContext(event){event.preventDefault();contextLost=true;cancelAnimationFrame(frame);stage.classList.remove('is-ready');stage.classList.add('is-still');wrapper.classList.add('is-still');button.hidden=true;}
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{threshold:.04});observer.observe(stage);
  const resizer=new ResizeObserver(resize);resizer.observe(stage);
  renderer.domElement.addEventListener('webglcontextlost',loseContext);
  document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);button.addEventListener('click',toggle);
  resize();button.hidden=false;stage.classList.add('is-ready');sync();
  return()=>{
    alive=false;cancelAnimationFrame(frame);observer.disconnect();resizer.disconnect();
    document.removeEventListener('visibilitychange',sync);reduced.removeEventListener('change',sync);button.removeEventListener('click',toggle);
    renderer.domElement.removeEventListener('webglcontextlost',loseContext);
    const geometries=new Set(),materials=new Set();scene.traverse(object=>{if(object.geometry)geometries.add(object.geometry);if(object.material)(Array.isArray(object.material)?object.material:[object.material]).forEach(m=>materials.add(m));});
    geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());environment.dispose();glow.dispose();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();
  };
}

function mount() {
  const stage=document.querySelector('.gold-stage');if(stage===currentStage)return;
  disposeCurrent();disposeCurrent=()=>{};currentStage=stage;
  if(stage){try{disposeCurrent=start(stage)}catch(error){stage.classList.remove('is-ready');stage.classList.add('is-still');stage.closest('.gold-network').classList.add('is-still');console.warn('Gold artwork is using the still image on this device.');}}
}
window.addEventListener('gold:render',mount);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
