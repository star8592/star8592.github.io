(()=>{
const THREE=window.THREE;
const params=new URLSearchParams(location.search);
const id=params.get('model')||'birch_airy';
const config={
 maple_canopy:{title:'枫树 · 真实对生叶序',center:4.75,dist:16.4,near:8.0},
 birch_airy:{title:'白桦 · 悬垂枝条和真实小叶',center:5.4,dist:19,near:8.5},
 cedar_fir:{title:'冷杉 · 不规则枝层和立体针叶',center:6.1,dist:21,near:9.5},
 boulder:{title:'巨石 · 真实风化纹与断裂',center:.70,dist:5.8,near:2.4},
 moss_boulder:{title:'苔石 · 真实微型苔茎',center:.7,dist:5.8,near:2.7},
 cliff_outcrop:{title:'崖壁 · 多层风化节理',center:1.45,dist:7.5,near:3.3},
 river_rocks:{title:'河滩石 · 水磨卵石',center:.28,dist:5.3,near:2.5}
};
const opt=config[id]||config.maple_canopy;
const isLocal=['localhost','127.0.0.1'].includes(location.hostname)&&params.get('public')!=='1';
const localBase='../assets/r36-base/'+id+'.glb';
const localNew='../assets/'+id+'.glb';
const pubRoot='https://raw.githubusercontent.com/star8592/star8592.github.io/assets-r36-models-20261123/models/';
const leftSource=isLocal?localBase:pubRoot+id+'/r36.glb';
const rightSource=isLocal?localNew:'https://raw.githubusercontent.com/star8592/star8592.github.io/assets-r39-natural-trees-20261123/models/'+id+'/'+id+'.r39.glb.gz.parts.json';
document.querySelector('#header b').textContent='R39 非规则真实树木 · '+opt.title;
document.querySelector('#left').textContent=id+' · R36规则枝架';
document.querySelector('#right').textContent=id+' · R39自然生长';
const pic=document.querySelector('#firstpaint');
const src='preview/'+id+'.png';
if(params.get('preview')!=='0'){pic.src=src;pic.style.display='block';}
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.outputEncoding=THREE.sRGBEncoding;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.80;
renderer.setPixelRatio(Math.min(1.5,devicePixelRatio||1));
renderer.setSize(innerWidth,innerHeight);renderer.setScissorTest(true);
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);
const scenes=[],stats=[];
for(let side=0;side<2;side++){
 const s=new THREE.Scene();s.background=new THREE.Color('#dce7d8');
 const ambient=new THREE.HemisphereLight(0xe8ecd8,0x617366,.51);s.add(ambient);
 const sun=new THREE.DirectionalLight(0xffecd2,1.08);
 sun.position.set(-6,13,10);sun.target.position.set(0,opt.center,0);
 sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);
 sun.shadow.camera.left=-10;sun.shadow.camera.right=10;
 sun.shadow.camera.top=12;sun.shadow.camera.bottom=-10;sun.shadow.camera.near=.15;sun.shadow.camera.far=40;
 sun.shadow.bias=-.00020;s.add(sun.target);s.add(sun);
 const bounce=new THREE.DirectionalLight(0xc3ddc5,.17);bounce.position.set(6,7,-6);s.add(bounce);
 const ground=new THREE.Mesh(new THREE.CylinderGeometry(id.includes('cliff')?4.5:6,6,.16,72),
 new THREE.MeshLambertMaterial({color:0xa6b4a2}));
 ground.position.y=-.12;ground.receiveShadow=true;s.add(ground);
 scenes.push(s);
}
let yaw=.47,pitch=.29,distance=opt.dist,ready=false,frames=0,drag=false,x0=0,y0=0;
const cam=new THREE.PerspectiveCamera(40,1,.08,200);
function moveCamera(){
 const radius=distance*Math.cos(pitch);
 cam.position.set(Math.sin(yaw)*radius,opt.center+Math.sin(pitch)*distance,
                 Math.cos(yaw)*radius);
 cam.lookAt(0,opt.center,0);
}
window.r36Pose=n=>{
 const poses={
 front:[.47,.29,opt.dist],side:[1.62,.24,opt.dist],
 top:[.63,.88,opt.dist],detail:[.48,.21,opt.near]};
 const q=poses[n];if(q){[yaw,pitch,distance]=q;update();}
};
function update(){
 if(ready)window.__R39_LAB={ready,model:id,frames,distance:+distance.toFixed(2),
 yaw:+yaw.toFixed(3),triangles:stats.map(v=>v.triangles)};
}
function paint(){
 requestAnimationFrame(paint);
 const W=innerWidth,H=innerHeight,M=Math.floor(W/2);
 renderer.setSize(W,H,false);cam.aspect=M/H;cam.updateProjectionMatrix();moveCamera();
 for(let i=0;i<2;i++){
  renderer.setViewport(i?M:0,0,i?W-M:M,H);
  renderer.setScissor(i?M:0,0,i?W-M:M,H);
  renderer.render(scenes[i],cam);
 }
 frames++;update();
}
paint();
renderer.domElement.addEventListener('pointerdown',e=>{drag=true;x0=e.clientX;y0=e.clientY});
window.addEventListener('pointerup',()=>drag=false);
window.addEventListener('pointermove',e=>{
 if(!drag)return;
 yaw-=(e.clientX-x0)*.008;
 pitch=Math.max(-.1,Math.min(1.20,pitch-(e.clientY-y0)*.006));
 x0=e.clientX;y0=e.clientY;update();
});
renderer.domElement.addEventListener('wheel',e=>{
 e.preventDefault();distance=Math.min(opt.dist*1.8,Math.max(opt.near*.68,distance*Math.exp(e.deltaY*.001)));
 update();
},{passive:false});
const loader=new THREE.GLTFLoader();
function load(idx,src){
 return new Promise((ok,fail)=>{
  const onLoaded=gltf=>{
   const root=gltf.scene;
   let faces=0,meshes=0;
   root.traverse(o=>{
    if(!o.isMesh)return;
    meshes++;const g=o.geometry;
    faces+=(g.index?g.index.count:g.attributes.position.count)/3;
    o.castShadow=true;o.receiveShadow=true;
    const tune=m=>new THREE.MeshStandardMaterial({
     name:m.name,color:m.color.clone(),roughness:.89,metalness:0,
     side:THREE.DoubleSide,transparent:false,depthWrite:true});
    o.material=Array.isArray(o.material)?o.material.map(tune):tune(o.material);
   });
   scenes[idx].add(root);stats[idx]={triangles:faces,meshes};ok();
  };
  if(src.endsWith('.parts.json')){
    (async()=>{
      const indexResponse=await fetch(src);
      if(!indexResponse.ok)throw new Error('archive manifest HTTP '+indexResponse.status);
      const index=await indexResponse.json();
      if(index.format!=='gzip-parted-glb'||!index.parts?.length)
        throw new Error('Invalid R37 model archive manifest');
      let downloaded=0;
      const partArrays=await Promise.all(index.parts.map(async name=>{
        const url=new URL(name,new URL(src,location.href));
        const response=await fetch(url);
        if(!response.ok)throw new Error('Model chunk HTTP '+response.status+' '+name);
        const buf=new Uint8Array(await response.arrayBuffer());
        downloaded++;
        document.querySelector('#status').textContent=
          'R39枝叶几何：下载完整几何 '+downloaded+'/'+index.parts.length+' 分片…';
        return buf;
      }));
      const total=partArrays.reduce((v,a)=>v+a.length,0);
      if(total!==index.compressed_bytes)throw new Error('Compressed tree truncated');
      const bytes=new Uint8Array(total);let cursor=0;
      for(const part of partArrays){bytes.set(part,cursor);cursor+=part.length}
      if(bytes[0]!==31||bytes[1]!==139)throw new Error('Invalid tree gzip');
      document.querySelector('#status').textContent='完整几何下载完成，正在无损解压…';
      const buffer=await new Response(new Blob([bytes]).stream()
        .pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
      if(buffer.byteLength!==index.raw_bytes)throw new Error('Incomplete GLB geometry');
      document.querySelector('#status').textContent='解压完成，正在装配独立枝叶…';
      loader.parse(buffer,new URL('.',new URL(src,location.href)).href,onLoaded,fail);
    })().catch(fail);
  }else{
    loader.load(src,onLoaded,undefined,fail);
  }
 });
}
Promise.all([load(0,leftSource),load(1,rightSource)]).then(()=>{
 ready=true;document.body.dataset.ready='1';
 document.querySelector('#status').textContent=
  '真实3D已加载｜左 '+Math.round(stats[0].triangles).toLocaleString()+
  ' 面 · 右 '+Math.round(stats[1].triangles).toLocaleString()+' 面';
 update();
}).catch(e=>{
 document.body.dataset.ready='error';
 document.querySelector('#status').textContent='载入失败：'+String(e.message||e);
 console.error('R39_LAB_ERROR',e);
});
})();
