(()=>{
const W=window,THREE=W.THREE;
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
renderer.outputEncoding=THREE.sRGBEncoding;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=.77;
renderer.setPixelRatio(Math.min(2,devicePixelRatio||1));
renderer.setSize(innerWidth,innerHeight);
renderer.setScissorTest(true);
document.body.appendChild(renderer.domElement);
const scenes=[],models=[];
const param=new URLSearchParams(location.search).get('baseline');
const baseline=['r29','r30','r31','r32'].includes(param)?param:'r32';
const refAsset=baseline==='r32'?'r32-oak-arch-baseline.glb.gz':
               baseline==='r31'?'r31-oak-arch-baseline.glb.gz':
               baseline==='r30'?'r30-oak-arch-baseline.glb':'r29-oak-arch-baseline.glb';
document.querySelector('#head-l').textContent=baseline.toUpperCase()+' 基线对照';
if(baseline==='r32')document.querySelector('#preview').style.display='block';
for(let i=0;i<2;i++){
 const scene=new THREE.Scene();scene.background=new THREE.Color('#dbe5d4');
 const hemi=new THREE.HemisphereLight(0xdaead0,0x527a59,.67);scene.add(hemi);
 const key=new THREE.DirectionalLight(0xffe5b4,.84);key.position.set(-7,15,10);scene.add(key);
 const bounce=new THREE.DirectionalLight(0xb7dbcb,.16);bounce.position.set(8,6,-8);scene.add(bounce);
 const grass=new THREE.Mesh(new THREE.CylinderGeometry(7,7,.18,80),
     new THREE.MeshLambertMaterial({color:'#91a887'}));grass.position.y=-.12;scene.add(grass);
 scenes.push(scene);
}
let yaw=.48,pitch=.28,distance=13.5,drag=false,lastX=0,lastY=0;
const camera=new THREE.PerspectiveCamera(39,1,.1,200);
function positionCamera(){
 const y=4.2+Math.sin(pitch)*distance;
 const rad=distance*Math.cos(pitch);
 camera.position.set(Math.sin(yaw)*rad,y,Math.cos(yaw)*rad);
 camera.lookAt(0,4.3,0);
}
let renderFrames=0,ready=false;
function paint(){
 requestAnimationFrame(paint);
 const w=innerWidth,h=innerHeight,split=Math.floor(w/2);
 renderer.setSize(w,h,false);
 camera.aspect=split/h;camera.updateProjectionMatrix();
 positionCamera();
 for(let i=0;i<2;i++){
  const x=i?split:0,vw=i?w-split:split;
  renderer.setViewport(x,0,vw,h);renderer.setScissor(x,0,vw,h);
  renderer.render(scenes[i],camera);
 }
 renderFrames++;
 if(ready){
  W.__R33_LAB={ready,models:models.length,frames:renderFrames,
    distance:Number(distance.toFixed(2)),yaw:Number(yaw.toFixed(3)),
    triangleCount:models.map(x=>x.triangles)};
 }
}
paint();
renderer.domElement.addEventListener('pointerdown',e=>{drag=true;lastX=e.clientX;lastY=e.clientY;});
W.addEventListener('pointerup',()=>drag=false);
W.addEventListener('pointermove',e=>{
 if(!drag)return;
 yaw-=(e.clientX-lastX)*.008;pitch=Math.max(-.15,Math.min(.9,pitch-(e.clientY-lastY)*.006));
 lastX=e.clientX;lastY=e.clientY;
});
renderer.domElement.addEventListener('wheel',e=>{
 e.preventDefault();distance=Math.max(5,Math.min(26,distance*Math.exp(e.deltaY*.001)));},{passive:false});
W.addEventListener('resize',()=>renderer.setSize(innerWidth,innerHeight));
const loader=new THREE.GLTFLoader();
function loadModel(idx,src){
 return new Promise((resolve,reject)=>{
  const onLoaded=gltf=>{
    const root=gltf.scene;
    let meshCount=0,triangles=0;
    root.traverse(o=>{
      if(!o.isMesh)return;
      meshCount++;
      const geom=o.geometry;
      triangles+=(geom.index?geom.index.count:geom.attributes.position.count)/3;
      const old=o.material;
      const tune=m=>{
        const n=(m.name||'').toUpperCase();
        // Use the actual exported GLB material pigments on BOTH sides,
        // rather than flattening both variants to a synthetic fixed palette.
        return new THREE.MeshLambertMaterial({
          color:m.color.clone(),side:THREE.DoubleSide,
          transparent:false,depthWrite:true
        });
      };
      o.material=Array.isArray(old)?old.map(tune):tune(old);
    });
    scenes[idx].add(root);
    models[idx]={meshCount,triangles};
    resolve();
  };
  if(src.endsWith('.parts.json')){
    fetch(src).then(async response=>{
      if(!response.ok)throw new Error('archive index HTTP '+response.status);
      const index=await response.json();
      if(!Array.isArray(index.parts)||index.parts.length<1||index.parts.length>16)
        throw new Error('invalid archive part manifest');
      const arrays=await Promise.all(index.parts.map(async name=>{
        if(!/^oak_arch[.]glb[.]gz[.]part[0-9]{2}$/.test(name))
          throw new Error('invalid archive part filename');
        const r=await fetch('../assets/'+name);
        if(!r.ok)throw new Error('GLB part HTTP '+r.status+': '+name);
        return new Uint8Array(await r.arrayBuffer());
      }));
      const size=arrays.reduce((n,a)=>n+a.length,0);
      if(index.compressed_bytes && index.compressed_bytes!==size)
        throw new Error('truncated compressed geometry '+size);
      const merged=new Uint8Array(size);let offset=0;
      arrays.forEach(a=>{merged.set(a,offset);offset+=a.length});
      if(merged[0]!==31||merged[1]!==139)
        throw new Error('invalid gzip GLB archive');
      const data=await new Response(new Blob([merged]).stream()
          .pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
      if(index.raw_bytes&&data.byteLength!==index.raw_bytes)
        throw new Error('wrong 3D model geometry size');
      loader.parse(data,'../assets/',onLoaded,reject);
    }).catch(reject);
  }else if(src.endsWith('.gz')){
    fetch(src).then(async r=>{
      if(!r.ok)throw new Error('GLB HTTP '+r.status);
      let buffer=await r.arrayBuffer();
      const magic=new Uint8Array(buffer,0,Math.min(2,buffer.byteLength));
      if(magic[0]===31&&magic[1]===139){
        if(!window.DecompressionStream)throw new Error('Gzip decompression unavailable');
        buffer=await new Response(new Blob([buffer]).stream()
          .pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
      }
      loader.parse(buffer,'../assets/',onLoaded,reject);
    }).catch(reject);
  }else loader.load(src,onLoaded,undefined,reject);
 });
}
Promise.all([loadModel(0,'../assets/'+refAsset),
 loadModel(1,'../assets/oak_arch.glb.gz.parts.json')]).then(()=>{
  ready=true;document.body.dataset.ready='1';
  document.querySelector('#head-l').textContent=baseline.toUpperCase()+' 旧版对照';
  document.querySelector('#status').textContent=
    '真实3D：左 '+Math.round(models[0].triangles).toLocaleString()+' 面 · 右 '+
      Math.round(models[1].triangles).toLocaleString()+' 面';
  W.__R33_LAB={ready,models:2,frames:renderFrames,triangleCount:models.map(x=>x.triangles)};
}).catch(e=>{
  document.body.dataset.ready='error';
  document.querySelector('#status').textContent='加载失败：'+(e.message||e);
  console.error('R33_LAB_FAILED',e);
});
})();
