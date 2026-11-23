(()=>{
const THREE=window.THREE;
const params=new URLSearchParams(location.search);
const id=params.get('model')||'willow_river';
const config={
 willow_river:{title:'垂柳 · 活枝与悬垂细叶',center:3.55,dist:17.0,near:7.7},
 willow_swept:{title:'斜柳 · 不规则主枝',center:3.5,dist:16.8,near:7.5},
 bush_wide:{title:'阔叶灌木 · 基部多枝',center:.87,dist:6.6,near:3.2},
 bush_compact:{title:'矮灌木 · 疏密变化',center:.75,dist:6.0,near:2.8},
 bush_flowers:{title:'野花灌木 · 真实花瓣',center:.89,dist:6.4,near:3.1},
 bush_berry:{title:'浆果灌木 · 真实果实',center:.79,dist:6.2,near:3.0},
 bush_dry:{title:'旱地灌木 · 枯枝与稀叶',center:.72,dist:5.8,near:2.75},
 fern_fronds:{title:'蕨类 · 羽状复叶',center:.50,dist:5.5,near:2.8},
 fern_shade:{title:'阴生蕨 · 林下叶序',center:.45,dist:5.0,near:2.6},
 grass_short:{title:'短草丛 · 独立长曲叶',center:.35,dist:4.9,near:2.4},
 grass_tall:{title:'高草丛 · 真实卷曲叶',center:.7,dist:5.6,near:2.7},
 wild_grass_spray:{title:'野草 · 植株自然姿态',center:.79,dist:6.0,near:2.9},
 river_reeds:{title:'河岸芦苇 · 种穗与叶片',center:1.25,dist:7.8,near:3.6},
 sedge_river:{title:'河岸莎草 · 细长叶片',center:.90,dist:6.5,near:3.2}
};
const opt=config[id]||config.willow_river;
const isLocal=['localhost','127.0.0.1'].includes(location.hostname)&&params.get('public')!=='1';
const localBase='../assets/r40-base/'+id+'.glb';
const localNew='../assets/'+id+'.glb';
const pubRoot='https://raw.githubusercontent.com/star8592/star8592.github.io/assets-r36-models-20261123/models/';
const leftSource=isLocal?localBase:'https://raw.githubusercontent.com/star8592/star8592.github.io/assets-r40-nature-20261123/models/'+id+'/base.glb';
const rightSource=isLocal?localNew:'https://raw.githubusercontent.com/star8592/star8592.github.io/assets-r40-nature-20261123/models/'+id+'/r40.glb';
document.querySelector('#header b').textContent='R40 自然植被 · '+opt.title;
document.querySelector('#left').textContent=id+' · 旧版基线';
document.querySelector('#right').textContent=id+' · R40原生几何';
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
 if(ready)window.__R40_LAB={ready,model:id,frames,distance:+distance.toFixed(2),
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
          'R40实机模型：下载完整几何 '+downloaded+'/'+index.parts.length+' 分片…';
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
 console.error('R40_LAB_ERROR',e);
});
})();
