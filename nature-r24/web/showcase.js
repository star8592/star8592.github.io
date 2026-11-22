/* Original R23 WebGL, no Fab meshes/textures or screenshots.
 * Shares GLB and exact placement JSON with Godot showcase.gd.
 */
(async function(){
"use strict";
const status=document.getElementById("status");
const params=new URLSearchParams(location.search);
const catalogMode=params.get("mode")==="catalog";
if(params.has("capture"))document.body.classList.add("capture");
let season=["summer","autumn","winter"].includes(params.get("season"))?params.get("season"):"summer";
let windOn=params.get("wind")!=="0";
let currentView=["river","detail"].includes(params.get("view"))?params.get("view"):"overview";
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,powerPreference:"high-performance"});
renderer.setPixelRatio(Math.min(1.5,window.devicePixelRatio||1));
renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=.84;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.physicallyCorrectLights=false;
document.body.insertBefore(renderer.domElement,document.body.firstChild);
const scene=new THREE.Scene();
scene.background=new THREE.Color("#a6c7c0");
scene.fog=new THREE.FogExp2("#b7c8bd",.0023);
const camera=new THREE.PerspectiveCamera(53.5,innerWidth/innerHeight,.15,175);
let focus=new THREE.Vector3(-4,2.9,-4.5);
let orbitYaw=.62,orbitPitch=.25,radius=39;
function orbit(){
 camera.position.set(focus.x+radius*Math.sin(orbitYaw)*Math.cos(orbitPitch),
  focus.y+radius*Math.sin(orbitPitch),
  focus.z+radius*Math.cos(orbitYaw)*Math.cos(orbitPitch));
 camera.lookAt(focus);
}
orbit();
if(catalogMode){
 focus.set(0,3,0);orbitYaw=.13;orbitPitch=1.06;radius=103;orbit();
}else if(currentView==="detail"){
 focus.set(-22,4.5,-7);
 orbitYaw=Math.PI/4;orbitPitch=.287;radius=9.61;orbit();
}
const hemi=new THREE.HemisphereLight(0xc4d3c0,0x67805e,.77);
scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff1cb,1.12);
sun.position.set(-15,34,24);
sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.left=-51;sun.shadow.camera.right=51;
sun.shadow.camera.top=51;sun.shadow.camera.bottom=-51;
sun.shadow.camera.near=.2;sun.shadow.camera.far=120;
sun.shadow.bias=-.00025;
scene.add(sun);
const allPalettes=await fetch("../assets/season-palettes.json").then(r=>{
 if(!r.ok)throw Error("Cannot load shared palettes "+r.status);
 return r.json();
});
const P=Object.fromEntries(Object.entries(allPalettes).map(([season,cfg])=>[season,cfg.materials]));
const COLORS=Object.fromEntries(Object.entries(allPalettes).map(([season,cfg])=>[season,cfg.ground]));
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
const pathX=z=>3.4+1.6*Math.sin(z*.13)+.6*Math.cos(z*.31);
const riverX=z=>-11+2.4*Math.sin(.13*z+.5);
function height(x,z){
 let h=.34*Math.sin(x*.145)*Math.cos(z*.12)+.27*Math.cos(x*.075+z*.18);
 h+=.014*Math.abs(x)*Math.sin(z*.08);
 const slope=smooth(6,34,Math.abs(x));
 h+=4.2*slope*slope+.24*Math.sin(z*.26+x*.1)*slope;
 h-=1.0*(1-smooth(1.1,3.15,Math.abs(x-riverX(z))));
 return h;
}
function c3(hex){return new THREE.Color(hex);}
const _col=new THREE.Color();
function terrainColor(x,z){
 const color=COLORS[season];
 const wav=(.5+.5*Math.sin(x*.41+Math.cos(z*.58))*Math.cos(z*.28));
 let result=c3(color.grass).lerp(c3(color.shade),wav*.37);
 const pathblend=1-smooth(1.45,3.10,Math.abs(x-pathX(z)));
 result.lerp(c3(color.path),pathblend*.94);
 const bankblend=1-smooth(2.05,4.0,Math.abs(x-riverX(z)));
 return result.lerp(c3(color.bank),bankblend*.42);
}
function buildTerrain(){
 const N=111,H=36,vertices=[],colors=[],uv=[],idx=[];
 for(let j=0;j<N;j++){
  for(let i=0;i<N;i++){
   const x=-H+2*H*i/(N-1),z=-H+2*H*j/(N-1);
   vertices.push(x,height(x,z),z);
   const c=terrainColor(x,z);
   colors.push(c.r*.67,c.g*.67,c.b*.67);
   uv.push(x*.06,z*.06);
  }
 }
 for(let j=0;j<N-1;j++){
  for(let i=0;i<N-1;i++){
   const a=j*N+i,b=a+1,c=a+N,d=c+1;
   idx.push(a,c,b,b,c,d);
  }
 }
 const g=new THREE.BufferGeometry();
 g.setIndex(idx);
 g.setAttribute("position",new THREE.Float32BufferAttribute(vertices,3));
 g.setAttribute("color",new THREE.Float32BufferAttribute(colors,3));
 g.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2));
 g.computeVertexNormals();
 const m=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,metalness:0});
 const mesh=new THREE.Mesh(g,m);
 mesh.name="R23_original_terrain_path";
 mesh.receiveShadow=true;
 scene.add(mesh);
 return mesh;
}
function buildWater(){
 const N=151,W=9,vertices=[],uv=[],indices=[];
 for(let j=0;j<N;j++){
  const z=-35+70*j/(N-1);
  for(let k=0;k<W;k++){
   const t=k/(W-1),x=riverX(z)+(t-.5)*3.65;
   vertices.push(x,height(x,z)+.07,z);
   uv.push(t,j/(N-1));
  }
 }
 for(let j=0;j<N-1;j++)for(let i=0;i<W-1;i++){
  const a=j*W+i,b=a+1,c=a+W,d=c+1;
  indices.push(a,c,b,a,d,c);
 }
 const g=new THREE.BufferGeometry();
 g.setIndex(indices);
 g.setAttribute("position",new THREE.Float32BufferAttribute(vertices,3));
 g.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2));
 g.computeVertexNormals();
 const m=new THREE.ShaderMaterial({
  uniforms:{uTime:{value:0},uColor:{value:c3(COLORS[season].water)}},
  vertexShader:`varying vec2 vUv;uniform float uTime;
void main(){vUv=uv;vec3 p=position;
p.y+=.027*sin(uTime*1.89+p.z*.88+p.x*.55)+.013*sin(uTime*3.15+p.z*1.75);
gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}`,
  fragmentShader:`varying vec2 vUv;uniform float uTime;uniform vec3 uColor;
void main(){
float stripe=pow(.5+.5*sin(vUv.y*85.+uTime*2.8+sin(vUv.x*14.)),7.);
float wave=.5+.5*sin(vUv.y*53.+uTime*1.19+vUv.x*7.);
vec3 col=mix(uColor,vec3(.55,.73,.74),stripe*.22+wave*.07);
gl_FragColor=vec4(col,.96);
}`,
  transparent:true,side:THREE.DoubleSide,depthWrite:true
 });
 const mesh=new THREE.Mesh(g,m);
 mesh.name="R23_3d_creek";
 scene.add(mesh);
 return mesh;
}
function ridgeY(x,layer,depth){
 const h=7.7+4.1*Math.sin(x*.071+layer*.8)+1.9*Math.sin(x*.159-layer);
 return h+(1.1*Math.sin(x*.047+depth*.21)-.55*depth);
}
function buildMountains(){
 const ridges=[];
 for(let layer=0;layer<2;layer++){
  const verts=[],colors=[],zFront=-62-23*layer,zBack=zFront-18;
  let shade=c3(season==="summer"?"#789e9b":season==="autumn"?"#a69c93":"#a6b9c0");
  let top=shade.clone().lerp(c3("#d2d8c6"),.34);
  if(layer===1){
   shade.lerp(c3("#dae0d3"),.29);
   top.lerp(c3("#e5ebe5"),.29);
  }
  function triangle(vertices,bright){
   for(const v of vertices){
    verts.push(...v);
    const col=shade.clone().lerp(top,bright);
    colors.push(col.r,col.g,col.b);
   }
  }
  for(let i=0;i<60;i++){
   const x0=-96+192*i/60,x1=-96+192*(i+1)/60;
   const y0=ridgeY(x0,layer,0),y1=ridgeY(x1,layer,0);
   const yb0=ridgeY(x0,layer,1),yb1=ridgeY(x1,layer,1);
   const f0=[x0,y0,zFront],f1=[x1,y1,zFront];
   const b0=[x0,yb0,zBack],b1=[x1,yb1,zBack];
   const l0=[x0,-8,zFront],l1=[x1,-8,zFront];
   const lb0=[x0,-8,zBack],lb1=[x1,-8,zBack];
   triangle([l0,f1,l1],.27);triangle([l0,f0,f1],.42);
   triangle([f0,b1,f1],.75);triangle([f0,b0,b1],.75);
   triangle([lb0,lb1,b1],.23);triangle([lb0,b1,b0],.23);
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute("position",new THREE.Float32BufferAttribute(verts,3));
  g.setAttribute("color",new THREE.Float32BufferAttribute(colors,3));
  g.computeVertexNormals();
  const material=new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide});
  const mesh=new THREE.Mesh(g,material);mesh.name="R24_VolumetricRidge_"+layer;
  scene.add(mesh);ridges.push(mesh);
 }
 return ridges;
}

let mountains=buildMountains();
window.__R24_MOUNTAIN_DEPTH=Math.max(...Array.from(mountains[0].geometry.attributes.position.array).filter((_,i)=>i%3===2))-Math.min(...Array.from(mountains[0].geometry.attributes.position.array).filter((_,i)=>i%3===2));
const terrain=buildTerrain(),water=buildWater();
if(catalogMode){
 terrain.visible=false;water.visible=false;
 // A model catalog should not be obscured by the landscape backdrop.
 for(const mountain of mountains)mountain.visible=false;
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(140,140),
  new THREE.MeshStandardMaterial({color:"#8c9d87",roughness:1}));
 ground.rotation.x=-Math.PI/2;ground.position.y=-.16;ground.receiveShadow=true;
 scene.add(ground);
}
let layout,manifest,originalMats=[],windShaders=[],loadedAssets=0,renderGroups=0;
const objects=new Map();
function pickPaint(name,source){
 const p=P[season];
 for(const [key,color] of Object.entries(p))if(name.includes(key))return c3(color);
 if(name.includes("MOSS") && season==="autumn")return c3("#77754d");
 if(name.includes("MOSS") && season==="winter")return c3("#8f9d91");
 if(name.includes("STONE") && season==="winter")return source.clone().lerp(c3("#d6dce0"),.3);
 return source.clone();
}
function decorateMat(material){
 const m=material.clone();
 const original=material.color?material.color.clone():new THREE.Color("#9aa589");
 const name=material.name||"";
 const r24Kind=name.includes("LEAF")?1:name.includes("WOOD")?2:(name.includes("STONE")||name.includes("MOSS"))?3:4;
 m.color.copy(pickPaint(name,original)).multiplyScalar(.75);
 m.roughness=.93;
 m.side=THREE.DoubleSide;
 m.onBeforeCompile=function(shader){
  shader.uniforms.r23WindTime={value:0};
  shader.uniforms.r23WindAmp={value:windOn?.045:0};
  shader.uniforms.r24Kind={value:r24Kind};
  shader.vertexShader=shader.vertexShader.replace("#include <common>",
    "#include <common>\nattribute float r23WindWeight;\nuniform float r23WindTime;\nuniform float r23WindAmp;\nvarying vec3 vR24Pos;\nvarying vec3 vR24Norm;");
  shader.vertexShader=shader.vertexShader.replace("#include <begin_vertex>",
    `vec3 transformed = vec3(position);
      vR24Pos=position;
      vR24Norm=normal;
      float weight=clamp(r23WindWeight,0.,1.);
      float t=r23WindTime;
      transformed.x+=weight*r23WindAmp*(sin(t*1.07+position.z*.72)+.34*sin(t*1.71+position.y*.43));
      transformed.z+=weight*r23WindAmp*.53*sin(t*.8+position.x*.55);`);
  // Diffuse pigment wash: the geometry remains real GLB, no external images.
  shader.fragmentShader=shader.fragmentShader.replace("#include <common>",
   `#include <common>
varying vec3 vR24Pos;
varying vec3 vR24Norm;
uniform float r24Kind;
float r24Hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float r24Noise(vec2 p){
 vec2 i=floor(p),f=fract(p);
 f=f*f*(3.-2.*f);
 return mix(mix(r24Hash(i),r24Hash(i+vec2(1.,0.)),f.x),
            mix(r24Hash(i+vec2(0.,1.)),r24Hash(i+vec2(1.,1.)),f.x),f.y);
}
`);
  shader.fragmentShader=shader.fragmentShader.replace("#include <color_fragment>",
  `#include <color_fragment>
   vec3 pp=vR24Pos;
   float washLarge=r24Noise(pp.xz*2.8+pp.y*.31);
   float washFine=r24Noise(pp.xy*11.7+pp.z*.24);
   float ink=washLarge*.78+washFine*.22;
   float face=max(-.3,dot(normalize(vR24Norm),normalize(vec3(-.32,.87,.30))));
   float wash=.78+.22*face;
   if(r24Kind>.5 && r24Kind<1.5){
     wash*=.94+step(.42,ink)*.06+step(.71,ink)*.05+washLarge*.17;
   }else if(r24Kind>2.5&&r24Kind<3.5){
     float strata=sin(pp.y*15.+washLarge*3.3);
     wash*=.86+.11*smoothstep(-.4,.65,strata)+.13*washLarge;
   }else if(r24Kind>1.5&&r24Kind<2.5){
     wash*=.75+.34*r24Noise(pp.xz*5.+pp.y*.2);
   }else{wash*=.87+.23*ink;}
   diffuseColor.rgb*=clamp(wash*1.04,.43,1.25);
   if(r24Kind>.5&&r24Kind<1.5){
     diffuseColor.rgb*=mix(vec3(1.),vec3(1.12,1.08,.92),.20*clamp(face,0.,1.));
   }
  `);
  windShaders.push(shader);
 };
 m.customProgramCacheKey=()=> "r24-pigment-wind-semantic";
 originalMats.push({mat:m,original,name});
 return m;
}
function buildInstances(asset,specs,geometry,material,submesh=0,modelMatrix=null){
 const list=specs.filter(p=>p.asset===asset.id);
 if(!list.length)return;
 // glTF UV2 is legal, but Three.js defines GLSL uv2 only when USE_UV2.
 // Pass the authored wind mask explicitly so the shader always compiles.
 if(!geometry.getAttribute("r23WindWeight")){
  const uv2=geometry.getAttribute("uv2");
  const pos=geometry.getAttribute("position");
  const weights=new Float32Array(pos.count);
  for(let j=0;j<pos.count;j++){
   weights[j]=uv2?uv2.getX(j):Math.max(0,Math.min(1,(pos.getY(j)-.4)/6.));
  }
  geometry.setAttribute("r23WindWeight",new THREE.BufferAttribute(weights,1));
 }
 const materials=Array.isArray(material)?material.map(decorateMat):decorateMat(material);
 const inst=new THREE.InstancedMesh(geometry,materials,list.length);
 inst.name="R23_instanced_"+asset.id+"_submesh"+submesh;
 inst.castShadow=asset.group==="tree"||asset.group==="bush";
 inst.receiveShadow=true;
 const dummy=new THREE.Object3D();
 for(let i=0;i<list.length;i++){
  const p=list[i];const x=p.x,z=p.z;
  dummy.position.set(x,(catalogMode?0:height(x,z))-.08+(asset.id==="footbridge"?.30:0),z);
  dummy.rotation.set(0,p.angle,0);
  dummy.scale.setScalar(p.scale);
  dummy.updateMatrix();
  const composed=modelMatrix?dummy.matrix.clone().multiply(modelMatrix):dummy.matrix;
  inst.setMatrixAt(i,composed);
 }
 inst.instanceMatrix.needsUpdate=true;
 scene.add(inst);
 objects.set(inst.name,inst);
 renderGroups++;
}
// Original cross-engine seasonal FX, batched as one instanced GPU mesh.
let fx=null,fxData=[];
function buildFX(){
 if(fx){scene.remove(fx);fx.geometry.dispose();fx.material.dispose();}
 const count=season==="summer"?24:season==="autumn"?94:164;
 const verts=season==="summer"?
 [0,0,0,-.19,.115,.015,-.145,-.06,.015,
  0,0,0,.19,.115,.015,.145,-.06,.015]:
 [-.08,0,0,0,.17,.04,.08,0,0];
 const g=new THREE.BufferGeometry();
 g.setAttribute("position",new THREE.Float32BufferAttribute(verts,3));
 g.computeVertexNormals();
 const color=season==="summer"?"#eab4e1":season==="autumn"?"#e7aa73":"#f1f8f9";
 const m=new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide});
 fx=new THREE.InstancedMesh(g,m,count);
 fx.name="R23_Seasonal_FX_"+season;
 fx.frustumCulled=false;
 scene.add(fx);
 fxData=[];
 let state=2026112242;
 const rng=()=>{state=(1664525*state+1013904223)>>>0;return state/4294967296;};
 for(let i=0;i<count;i++){
  const x=-27+54*rng(),z=-28+54*rng();
  fxData.push({x,z,base:height(x,z),phase:rng()*Math.PI*2,
    speed:.26+rng()*.59,size:season==="winter"?.34+rng()*.2:.7+rng()*.55});
 }
}
function updateFX(t){
 if(!fx)return;
 const dummy=new THREE.Object3D();
 for(let i=0;i<fxData.length;i++){
  const p=fxData[i];
  const x=p.x+Math.sin(t*.65+p.phase)*.6+(season==="autumn"?t*.16:season==="winter"?t*.045:0);
  const z=p.z+Math.cos(t*.47+p.phase)*.55;
  const y=season==="summer"?p.base+1.3+Math.sin(t*p.speed*1.7+p.phase)*.38:
   p.base+(((p.phase*1.6-t*p.speed)%5.7)+5.7)%5.7;
  dummy.position.set(x,y,z);
  dummy.rotation.set(0,t*(season==="summer"?3.2:1.5)+p.phase,0);
  dummy.scale.setScalar(p.size);
  dummy.updateMatrix();fx.setMatrixAt(i,dummy.matrix);
 }
 fx.instanceMatrix.needsUpdate=true;
}
buildFX();
function addCatalogLabels(){
 if(!catalogMode)return;
 for(const p of layout.placements){
  const canvas=document.createElement("canvas");canvas.width=512;canvas.height=96;
  const cx=canvas.getContext("2d");
  cx.fillStyle="#1e332bde";cx.fillRect(0,0,512,96);
  cx.fillStyle="#f0f5e7";cx.font="bold 31px system-ui";cx.textAlign="center";
  cx.fillText(p.asset,256,60);
  const map=new THREE.CanvasTexture(canvas);
  const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map,transparent:true,depthTest:false}));
  sprite.position.set(p.x,0.18,p.z+2.7);
  sprite.scale.set(4.8,.9,1);
  scene.add(sprite);
 }
}
async function loadPack(){
 const [lay,man]=await Promise.all([
  fetch("../assets/layout.json").then(r=>{if(!r.ok)throw Error("layout HTTP "+r.status);return r.json()}),
  fetch("../assets/manifest.json").then(r=>{if(!r.ok)throw Error("manifest HTTP "+r.status);return r.json()})
 ]);
 layout=lay;manifest=man;
 if(catalogMode){
  layout.placements=man.assets.map((a,i)=>({
   asset:a.id,x:(i%5-2)*10.0,z:(Math.floor(i/5)-2)*10.0,
   scale:a.group==="tree"?.86:a.group==="bush"?1.4:a.group==="ground"?1.9:a.group==="sky"?.9:1.25,
   angle:0.2
  }));
 }
 const loader=new THREE.GLTFLoader();
 const one=asset=>new Promise((resolve,reject)=>{
  loader.load("../"+asset.gltf,gltf=>{
   const submeshes=[];
   gltf.scene.updateMatrixWorld(true);
   gltf.scene.traverse(o=>{if(o.isMesh)submeshes.push(o);});
   if(!submeshes.length)return reject(Error("No mesh "+asset.id));
   submeshes.forEach((mesh,i)=>{
     buildInstances(asset,layout.placements,mesh.geometry,mesh.material,i,mesh.matrixWorld);
   });
   console.log("R23_MODEL_SURFACES",asset.id,submeshes.length);
   loadedAssets++;
   status.textContent=loadedAssets+" / "+manifest.asset_count+" 类 · "+layout.placements.length+" 株实例";
   resolve(asset.id);
  },undefined,err=>reject(Error(asset.id+": "+err.message)));
 });
 await Promise.all(man.assets.map(one));
 addCatalogLabels();
 status.textContent="原创 GLB "+loadedAssets+" 类 · "+layout.placements.length+" 实例 · "+season.toUpperCase();
 document.body.dataset.ready="1";
 console.log("R23_WEB_SCENE_READY models="+loadedAssets+" submeshes="+renderGroups+" instances="+layout.placements.length+" season="+season);
 window.__R23_STATUS={models:loadedAssets,submeshes:renderGroups,instances:layout.placements.length,season};
}
function seasonChange(next){
 season=next;
 for(const {mat,original,name} of originalMats){
  mat.color.copy(pickPaint(name,original)).multiplyScalar(.75);
 }
 const a=terrain.geometry.attributes.color;
 const pos=terrain.geometry.attributes.position;
 for(let i=0;i<pos.count;i++){
  const c=terrainColor(pos.getX(i),pos.getZ(i));
  a.setXYZ(i,c.r*.67,c.g*.67,c.b*.67);
 }
 a.needsUpdate=true;
 water.material.uniforms.uColor.value.copy(c3(COLORS[season].water));
 mountains.forEach(m=>{scene.remove(m);m.geometry.dispose();m.material.dispose();});
 mountains=buildMountains();
 if(catalogMode)mountains.forEach(m=>m.visible=false);
 scene.background.set(COLORS[season].sky);
 sun.color.set(allPalettes[season].atmosphere.sun);
 for(const s of ["summer","autumn","winter"])
  document.getElementById(s).setAttribute("aria-pressed",String(season===s));
 status.textContent="原创 GLB "+loadedAssets+" 类 · "+(layout?.placements.length||0)+" 实例 · "+season.toUpperCase();
 if(window.__R23_STATUS)window.__R23_STATUS.season=season;
 buildFX();
}
function switchView(view){
 currentView=view;
 if(view==="detail"){
  focus.set(-22,4.5,-7);
  orbitYaw=Math.PI/4;orbitPitch=.287;radius=9.61;
 }else if(view==="river"){
  focus.set(-10,2.4,4);
  orbitYaw=.57;orbitPitch=.15;radius=31;
 }else{
  focus.set(-4,2.9,-4.5);
  orbitYaw=.62;orbitPitch=.25;radius=39;
 }
 orbit();
}
for(const s of ["summer","autumn","winter"]){
 const b=document.getElementById(s);
 b.addEventListener("click",()=>seasonChange(s));
 b.setAttribute("aria-pressed",String(season===s));
}
const windBtn=document.getElementById("wind");
windBtn.addEventListener("click",()=>{
 windOn=!windOn;
 windBtn.textContent=windOn?"风动 ON":"风动 OFF";
 for(const sh of windShaders)sh.uniforms.r23WindAmp.value=windOn?.045:0;
});
for(const name of ["river","overview","detail"])document.getElementById(name).addEventListener("click",()=>switchView(name));
document.getElementById("catalog").addEventListener("click",()=>{
 const next=new URL(location.href);
 if(catalogMode)next.searchParams.delete("mode");
 else next.searchParams.set("mode","catalog");
 location.href=next.toString();
});
document.getElementById("catalog").textContent=catalogMode?"返回完整环境":"素材全览";
let dragging=false,lastX=0,lastY=0;
renderer.domElement.addEventListener("pointerdown",e=>{
 dragging=true;lastX=e.clientX;lastY=e.clientY;
 renderer.domElement.setPointerCapture(e.pointerId);
 renderer.domElement.style.cursor="grabbing";
});
renderer.domElement.addEventListener("pointerup",()=>{
 dragging=false;renderer.domElement.style.cursor="grab";
});
renderer.domElement.style.cursor="grab";
renderer.domElement.addEventListener("pointermove",e=>{
 if(!dragging)return;
 orbitYaw-=(e.clientX-lastX)*.0052;
 orbitPitch=Math.max(-.12,Math.min(1.13,orbitPitch+(e.clientY-lastY)*.003));
 lastX=e.clientX;lastY=e.clientY;orbit();
});
renderer.domElement.addEventListener("wheel",e=>{
 e.preventDefault();
 radius=Math.max(9,Math.min(103,radius*Math.exp(e.deltaY*.00065)));
 orbit();
},{passive:false});
addEventListener("resize",()=>{
 camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
 renderer.setSize(innerWidth,innerHeight);
});
if(currentView!=="overview"&&!catalogMode)switchView(currentView);
seasonChange(season);
const clock=new THREE.Clock();
function render(){
 requestAnimationFrame(render);
 const t=params.has("t")?Number(params.get("t")):clock.getElapsedTime();
 water.material.uniforms.uTime.value=t;
 updateFX(t);
 for(const sh of windShaders){
  sh.uniforms.r23WindTime.value=t;
  sh.uniforms.r23WindAmp.value=windOn?.045:0;
 }
 renderer.render(scene,camera);
}
render();
try{await loadPack();}
catch(err){status.textContent="资源加载失败："+err.message;console.error(err);document.body.dataset.ready="error";}
})();
