(()=>{
'use strict';
const THREE=window.THREE;
const args=new URLSearchParams(location.search);
const isLocal=['127.0.0.1','localhost'].includes(location.hostname)&&args.get('public')!=='1';
const base='https://raw.githubusercontent.com/star8592/star8592.github.io/';
const models={
 willow_river:{local:'../assets/r41-riverbank/willow_river.glb',public:base+'assets-r41-willow-20261123/models/willow_river/willow_river.r41.glb.gz.parts.json'},
 willow_swept:{local:'../assets/r41-riverbank/willow_swept.glb',public:base+'assets-r41-willow-20261123/models/willow_swept/willow_swept.r41.glb.gz.parts.json'},
 bush_wide:{local:'../assets/r41-riverbank/bush_wide.glb',public:base+'assets-r40-nature-20261123/models/bush_wide/r40.glb'},
 bush_flowers:{local:'../assets/r41-riverbank/bush_flowers.glb',public:base+'assets-r40-nature-20261123/models/bush_flowers/r40.glb'},
 fern_fronds:{local:'../assets/r41-riverbank/fern_fronds.glb',public:base+'assets-r40-nature-20261123/models/fern_fronds/r40.glb'},
 river_reeds:{local:'../assets/r41-riverbank/river_reeds.glb',public:base+'assets-r40-nature-20261123/models/river_reeds/r40.glb'},
 grass_short:{local:'../assets/r41-riverbank/grass_short.glb',public:base+'assets-r40-nature-20261123/models/grass_short/r40.glb'},
 river_rocks:{local:'../assets/r41-riverbank/river_rocks.glb',public:base+'assets-r36-models-20261123/models/river_rocks/r36.glb'}
};
const status=document.querySelector('#status');
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.outputEncoding=THREE.sRGBEncoding;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=.79;
renderer.setPixelRatio(Math.min(1.5,window.devicePixelRatio||1));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);
const world=new THREE.Scene();
world.background=new THREE.Color('#b8cfbf');
world.fog=new THREE.FogExp2('#b8cfbf',.010);
world.add(new THREE.HemisphereLight(0xf7f5da,0x4f6854,.60));
const sun=new THREE.DirectionalLight(0xffedd4,1.03);
sun.position.set(-8,18,11);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.left=-23;sun.shadow.camera.right=23;
sun.shadow.camera.top=20;sun.shadow.camera.bottom=-20;sun.shadow.camera.far=62;
sun.shadow.bias=-.00027;world.add(sun);
const bounce=new THREE.DirectionalLight(0x9fbfb4,.18);
bounce.position.set(12,7,-12);world.add(bounce);
const camera=new THREE.PerspectiveCamera(39,innerWidth/innerHeight,.1,220);
let yaw=.57,pitch=.21,dist=28;
const focus=new THREE.Vector3(0,2.65,0);
function cameraPose(){
 const d=dist*Math.cos(pitch);
 camera.position.set(focus.x+Math.sin(yaw)*d,focus.y+Math.sin(pitch)*dist,focus.z+Math.cos(yaw)*d);
 camera.lookAt(focus);
 camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
}
function addTerrain(){
 // River runs parallel to X-axis; banks are uneven, not a flat sharp strip.
 const planeMesh=(xlen,zlo,zhi,width,material,water=false)=>{
  const Nx=96,Nz=24;
  const positions=[],colors=[],faces=[];
  const baseColor=new THREE.Color(material.color);
  for(let ix=0;ix<=Nx;ix++){
   const x=xlen*(ix/Nx-.5);
   const bend=.47*Math.sin(x*.24)+.26*Math.sin(x*.57+1.1);
   for(let iz=0;iz<=Nz;iz++){
    const t=iz/Nz;
    let z=zlo+(zhi-zlo)*t+bend;
    let y=water?-.085:(.03+.08*Math.sin(x*.21+z*.31)+.045*Math.cos(x*.71-z*.24));
    if(!water){
      const distToRiver=Math.max(0,Math.abs(z-bend)-3.65);
      y+=.28*(1-Math.exp(-distToRiver*.85));
    }
    positions.push(x,y,z);
    const cc=baseColor.clone();
    const grain=.90+.14*Math.sin(x*.57+z*.42)+.05*Math.sin(x*2.1-z*.57);
    cc.multiplyScalar(grain);
    colors.push(cc.r,cc.g,cc.b);
   }
  }
  for(let i=0;i<Nx;i++)for(let j=0;j<Nz;j++){
   const a=i*(Nz+1)+j,b=a+Nz+1;
   faces.push(a,b,a+1,a+1,b,b+1);
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  g.setIndex(faces);g.computeVertexNormals();
  const mesh=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:water?.24:.99,
   metalness:water?.1:0,side:THREE.DoubleSide,transparent:water,opacity:water?.92:1}));
  mesh.receiveShadow=true;world.add(mesh);
  if(water)window.__R41_WATER={geometry:g,base:new Float32Array(g.attributes.position.array)};
  return mesh;
 };
 planeMesh(65,-34,-3.2,0,{color:'#6b8b61'});
 planeMesh(65,3.2,34,0,{color:'#66875f'});
 planeMesh(65,-3.6,3.6,0,{color:'#4f8994'},true);
 // Simple shallow bank strata in the shoreline, without any image texture.
 const bank=new THREE.MeshStandardMaterial({color:'#9d9d86',roughness:1});
 for(const side of [-1,1]){
  const curve=[];
  for(let i=0;i<=96;i++){
    const x=-32.5+i*65/96;const bend=.47*Math.sin(x*.24)+.26*Math.sin(x*.57+1.1);
    curve.push(new THREE.Vector3(x,.065,side*(3.42)+bend));
  }
  const strip=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(curve),160,.085,5,false);
  world.add(new THREE.Mesh(strip,bank));
 }
}
addTerrain();
const loader=new THREE.GLTFLoader();
const ready={};
const layout=[
 ['willow_river',[[-8,0,-7.7,1,1.0],[3.5,0,-9.6,.83,-.71]]],
 ['willow_swept',[[9.2,0,7.6,.87,-.8]]],
 ['bush_wide',[[-12,0,-10.6,.9,.2],[11.6,0,11.4,.7,.6],[1.2,0,8.5,.62,-.3]]],
 ['bush_flowers',[[-4.3,0,-5.5,.75,.7],[7.1,0,4.8,.81,-.45]]],
 ['fern_fronds',[[-10,0,-5.9,.76,.1],[-4,0,-7.7,.88,.5],[4.4,0,5.8,.73,-.7],[10.5,0,8.4,.82,.2]]],
 ['river_reeds',[[-12,0,-3.9,.9,.2],[-1.8,0,-4.2,.9,-.3],[8.6,0,3.7,1.1,.1],[12,0,4.1,.89,-.45]]],
 ['grass_short',[[-7.5,0,-4.9,1,0],[-1.6,0,-6.2,1.2,.7],[2.6,0,5.6,.94,1.1],[5,0,-5.7,1.05,-.35],[8.6,0,5.1,1,-.7],[11.2,0,-6.9,1.13,.35]]],
 ['river_rocks',[[-5,0,-3.1,1.1,.4],[5.2,0,3.4,.72,1.1],[-13.5,0,-4.5,.85,-.3],[13.2,0,3.5,.70,.7]]]
];
let instances=0,loaded=0,failed=[];
const materials=(root)=>{
 root.traverse(node=>{
  if(!node.isMesh)return;
  node.receiveShadow=true;node.castShadow=true;
  const tune=m=>new THREE.MeshStandardMaterial({
    name:m.name,color:m.color.clone(),metalness:0,roughness:.91,side:THREE.DoubleSide,
    transparent:false,depthWrite:true});
  node.material=Array.isArray(node.material)?node.material.map(tune):tune(node.material);
 });
};
function asset(name){
 return new Promise(resolve=>{
   const source=models[name];
   const url=isLocal?source.local:source.public;
   const handle=gltf=>{
     const root=gltf.scene;materials(root);
     const row=layout.find(x=>x[0]===name);
     for(const [x,y,z,scale,rot] of row[1]){
       const copy=root.clone(true);copy.scale.setScalar(scale);
       copy.rotation.y=rot;copy.position.set(x,y,z);world.add(copy);instances++;
     }
     ready[name]=true;loaded++;
     status.textContent='已载入 '+loaded+'/'+layout.length+' 种真实植物与岩石…';
     resolve();
   };
   const fail=err=>{
     failed.push(name+': '+String(err));ready[name]=false;resolve();
   };
   if(url.endsWith('.parts.json')){
     (async()=>{
       const resp=await fetch(url);
       if(!resp.ok)throw new Error('archive index HTTP '+resp.status);
       const info=await resp.json();
       if(info.format!=='gzip-parted-glb'||!info.parts?.length)
         throw new Error('invalid GLB archive manifest '+name);
       const compressedParts=await Promise.all(info.parts.map(async file=>{
         const res=await fetch(new URL(file,url));
         if(!res.ok)throw new Error('model part HTTP '+res.status+' '+file);
         return new Uint8Array(await res.arrayBuffer());
       }));
       const sum=compressedParts.reduce((t,p)=>t+p.length,0);
       if(sum!==info.compressed_bytes)throw new Error('truncated '+name);
       const compressed=new Uint8Array(sum);
       let offset=0;
       for(const part of compressedParts){compressed.set(part,offset);offset+=part.length;}
       if(compressed[0]!==31||compressed[1]!==139)throw new Error('invalid gzip');
       const buffer=await new Response(new Blob([compressed]).stream()
         .pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
       if(buffer.byteLength!==info.raw_bytes)throw new Error('truncated raw GLB '+name);
       loader.parse(buffer,new URL('.',url).href,handle,fail);
     })().catch(fail);
   }else{
     loader.load(url,handle,undefined,fail);
   }
 });
}
let frame=0,drag=false,last=[0,0];
renderer.domElement.addEventListener('pointerdown',e=>{drag=true;last=[e.clientX,e.clientY]});
window.addEventListener('pointerup',()=>drag=false);
window.addEventListener('pointermove',e=>{
 if(!drag)return;
 yaw+=(last[0]-e.clientX)*.005;pitch=Math.max(-.05,Math.min(1.15,pitch+(e.clientY-last[1])*.005));
 last=[e.clientX,e.clientY];
});
renderer.domElement.addEventListener('wheel',e=>{
 e.preventDefault();dist=Math.min(70,Math.max(12,dist*Math.exp(e.deltaY*.001)));
},{passive:false});
window.addEventListener('resize',()=>{
 renderer.setSize(innerWidth,innerHeight);cameraPose();
});
function paint(){
 requestAnimationFrame(paint);
 frame++;
 const water=window.__R41_WATER;
 if(water&&frame%2===0){
   const arr=water.geometry.attributes.position.array,old=water.base;
   const time=performance.now()*.00039;
   for(let i=0;i<arr.length;i+=3){
     const x=old[i],z=old[i+2];
     arr[i+1]=old[i+1]+.034*Math.sin(x*.9+z*.5+time*2.7)
       +.013*Math.sin(x*1.7-z*1.3-time*3.1);
   }
   water.geometry.attributes.position.needsUpdate=true;
   water.geometry.computeVertexNormals();
 }
 cameraPose();renderer.render(world,camera);
 if(window.__R41_SCENE)window.__R41_SCENE.frames=frame;
}
paint();
Promise.all(layout.map(([name])=>asset(name))).then(()=>{
 document.body.dataset.ready=failed.length?'error':'1';
 status.textContent=failed.length?'有模型加载失败：'+failed.join(', '):
  '已载入全部实机模型 · 拖动旋转 / 滚轮缩放';
 window.__R41_SCENE={ready:!failed.length,loaded,instances,failed,frames:frame,
                     camera:{yaw,pitch,dist},river:true,terrain:true};
});
window.__R41_Pose=(name)=>{
 if(name==='wide'){yaw=.57;pitch=.21;dist=28;}
 if(name==='detail'){yaw=.62;pitch=.13;dist=18;}
 if(name==='opposite'){yaw=2.20;pitch=.21;dist=29;}
 if(window.__R41_SCENE)window.__R41_SCENE.camera={yaw,pitch,dist};
};
})();
