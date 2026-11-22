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
  W.__R30_LAB={ready,models:models.length,frames:renderFrames,
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
  loader.load(src,gltf=>{
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
        let pigment='#7b8d6b';
        if(n.includes('LEAF'))pigment=(
          n.includes('SUN')?'#80a74c':n.includes('GOLD')?'#a0ab58':
          n.includes('SHADE')?'#2f5b3d':'#4e804a');
        if(n.includes('WOOD'))pigment=n.includes('LIGHT')?'#988166':'#66513b';
        return new THREE.MeshLambertMaterial({
          color:new THREE.Color(pigment),side:THREE.DoubleSide,
          transparent:false,depthWrite:true
        });
      };
      o.material=Array.isArray(old)?old.map(tune):tune(old);
    });
    scenes[idx].add(root);
    models[idx]={meshCount,triangles};
    resolve();
  },undefined,reject);
 });
}
Promise.all([loadModel(0,'../assets/r29-oak-arch-baseline.glb'),
 loadModel(1,'../assets/oak_arch.glb')]).then(()=>{
  ready=true;document.body.dataset.ready='1';
  document.querySelector('#status').textContent=
    '真实3D：左 '+Math.round(models[0].triangles).toLocaleString()+' 面 · 右 '+
      Math.round(models[1].triangles).toLocaleString()+' 面';
  W.__R30_LAB={ready,models:2,frames:renderFrames,triangleCount:models.map(x=>x.triangles)};
}).catch(e=>{
  document.body.dataset.ready='error';
  document.querySelector('#status').textContent='加载失败：'+(e.message||e);
  console.error('R30_LAB_FAILED',e);
});
})();
