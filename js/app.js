const DB_NAME='THC_DINO_PICKUP_BUILDER_V3' , STORE='profiles';
const state={
  profileId:null,
  images:{bg:null,map:null,yellow:null,red:null,green:null,fridgeDedi:null,cryoDedi:null,warden:null},
  imageData:{},
};
const $=id=>document.getElementById(id);
const c=$('canvas'),ctx=c.getContext('2d');

const fields=['astreosPhoto','profileName','server','mapName','spawn','coords','pin','resourceColor','clusterType','pickupType','bgX','bgY','showWarden','showMap'];

function getVal(id){
  const e=$(id); return e.type==='checkbox' ? e.checked : e.value;
}
function setVal(id,v){
  const e=$(id); if(e.type==='checkbox') e.checked=!!v; else e.value=v ?? '';
}
function randomPin(){return String(Math.floor(1000+Math.random()*9000));}

function openDB(){
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB_NAME,1);
    req.onupgradeneeded=()=>req.result.createObjectStore(STORE,{keyPath:'id'});
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error);
  });
}
async function dbPut(obj){
  const db=await openDB();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE,'readwrite');
    tx.objectStore(STORE).put(obj);
    tx.oncomplete=resolve; tx.onerror=()=>reject(tx.error);
  });
}
async function dbGet(id){
  const db=await openDB();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE,'readonly');
    const req=tx.objectStore(STORE).get(id);
    req.onsuccess=()=>resolve(req.result); req.onerror=()=>reject(req.error);
  });
}
async function dbAll(){
  const db=await openDB();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE,'readonly');
    const req=tx.objectStore(STORE).getAll();
    req.onsuccess=()=>resolve(req.result); req.onerror=()=>reject(req.error);
  });
}
async function dbDelete(id){
  const db=await openDB();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE,'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete=resolve; tx.onerror=()=>reject(tx.error);
  });
}

function isAstreos(){return state.profileId===ASTREOS_ID;}
function setAstreosPhoto(variant){
  const choice=variant==='storefront'?'storefront':'logo';
  setVal('astreosPhoto',choice);
  loadImage(ASTREOS_ASSETS[choice],'bg');
}
$('astreosPhoto').addEventListener('change',e=>{
  if(isAstreos()) setAstreosPhoto(e.target.value);
});

async function seedCenter(){
  const all=await dbAll();
  if(all.some(p=>String(p.name||'').toLowerCase().includes('center') ||
    (p.values?.mapName==='The Center' && String(p.values?.server)==='5592')))return;
  const values={
    profileName:'The Center / 5592 / THC Dispensary',server:'5592',mapName:'The Center',
    spawn:'Snow North',coords:'16.5, 38.1',pin:'',
    resourceColor:'yellow',clusterType:'standard',pickupType:'standard',
    bgX:'50',bgY:'50',showWarden:true,showMap:true,astreosPhoto:'logo'
  };
  await dbPut({id:'thc-center-5592',name:values.profileName,values,
    images:{...DEFAULTS},updated:new Date().toISOString()});
}
async function seedAstreos(){
  if(await dbGet(ASTREOS_ID)) return;
  const values={
    profileName:'Astreos / 5992 / THC Dispensary',
    server:'5992',mapName:'Astreos',spawn:'THC Dispensary — Pyranthos',
    coords:'90.3, 56.8',pin:'',resourceColor:'yellow',
    bgX:'50',bgY:'50',showWarden:true,showMap:true,astreosPhoto:'logo',clusterType:'standard',pickupType:'standard'
  };
  await dbPut({
    id:ASTREOS_ID,name:values.profileName,values,
    images:{...DEFAULTS,bg:ASTREOS_ASSETS.logo,map:ASTREOS_ASSETS.map},
    updated:new Date().toISOString()
  });
}
const imageRequests={};
function loadImage(src,key){
  if(!src){THCLog.add('warn','Image '+key,'No source configured');return;}
  const request=(imageRequests[key]||0)+1;imageRequests[key]=request;
  THCLog.add('info','Image '+key,'Loading '+src);
  const im=new Image();
  im.onload=()=>{if(imageRequests[key]!==request)return;state.images[key]=im;state.imageData[key]=src;THCLog.add('info','Image '+key,'Loaded '+im.naturalWidth+'x'+im.naturalHeight+' — '+src);draw();};
  im.onerror=()=>{if(imageRequests[key]!==request)return;THCLog.add('error','Image '+key,'Failed to load '+src);console.warn('THC image could not load:',key,src);};
  im.src=src;
}
function fileToData(file,key){
  if(!file)return;
  const r=new FileReader();
  r.onload=()=>loadImage(r.result,key);
  r.readAsDataURL(file);
}
[['bgFile','bg'],['mapFile','map'],['yellowFile','yellow'],['redFile','red'],['greenFile','green'],['fridgeDediFile','fridgeDedi'],['cryoDediFile','cryoDedi'],['wardenFile','warden']]
.forEach(([input,key])=>$(input).addEventListener('change',e=>fileToData(e.target.files[0],key)));

let standardPickupSnapshot=null;
$('clusterType').addEventListener('change',()=>{
  THCLog.add('info','Cluster selection',getVal('clusterType'));
  if(getVal('pickupType')==='drakeling' && getVal('clusterType')!=='cryoDedi'){
    setVal('clusterType','cryoDedi');
  }
  draw();
});
$('pickupType').addEventListener('change',()=>{
  THCLog.add('info','Pickup type',getVal('pickupType'));
  if(getVal('pickupType')==='drakeling'){
    standardPickupSnapshot={server:getVal('server'),mapName:getVal('mapName'),spawn:getVal('spawn'),coords:getVal('coords'),clusterType:getVal('clusterType')};
    setVal('server','5992');setVal('mapName','Astreos');
    setVal('spawn','THC Dispensary — Pyranthos');setVal('coords','90.3, 56.8');
    setVal('clusterType','cryoDedi');
    loadImage(ASTREOS_ASSETS.logo,'bg');loadImage(ASTREOS_ASSETS.map,'map');
  }else if(standardPickupSnapshot){
    for(const [key,value] of Object.entries(standardPickupSnapshot))setVal(key,value);
    standardPickupSnapshot=null;
  }
  draw();
});
function collectValues(){
  const values={};
  fields.forEach(id=>values[id]=getVal(id));
  return values;
}
function applyValues(v){
  fields.forEach(id=>{if(v && Object.prototype.hasOwnProperty.call(v,id))setVal(id,v[id]);});
  updateOutputs();
}
function profileObject(){
  return {
    id:state.profileId || crypto.randomUUID(),
    name:getVal('profileName') || `${getVal('mapName')} ${getVal('server')}`.trim() || 'Untitled Profile',
    values:collectValues(),
    images:{...state.imageData},
    updated:new Date().toISOString()
  };
}
async function saveProfile(){
  const p=profileObject();
  if(p.values.mapName==='The Center' && String(p.values.server)==='5592')p.name=p.values.profileName='The Center / 5592 / THC Dispensary';
  if(p.values.mapName==='Astreos' && String(p.values.server)==='5992')p.name=p.values.profileName='Astreos / 5992 / THC Dispensary';
  state.profileId=p.id;
  await dbPut(p);
  await refreshProfiles(p.id);
  $('profileStatus').textContent='Profile saved locally.';
  setTimeout(()=>$('profileStatus').textContent='',1800);
}
async function refreshProfiles(selected){
  const list=await dbAll();
  const sel=$('profileSelect');
  sel.innerHTML='<option value="">Select a profile…</option>';
  list.sort((a,b)=>a.name.localeCompare(b.name)).forEach(p=>{
    const map=String(p.values?.mapName||'').trim();
    const server=String(p.values?.server||'').trim();
    if(map==='The Center' && server==='5592')p.name='The Center / 5592 / THC Dispensary';
    if(map==='Astreos' && server==='5992')p.name='Astreos / 5992 / THC Dispensary';
    const o=document.createElement('option');o.value=p.id;o.textContent=p.name;sel.appendChild(o);
  });
  if(selected){sel.value=selected;}
}
async function loadProfile(id){
  if(!id)return;
  const p=await dbGet(id); if(!p){THCLog.add('error','Profile','Not found: '+id);return;}
  THCLog.add('info','Profile','Loading '+p.name);
  state.profileId=p.id;
  try{localStorage.setItem('thc-last-profile',p.id);}catch(e){}
  applyValues(p.values);
  // Migrate only the obsolete default coordinates; preserve user-customized locations.
  if(getVal('mapName')==='The Center' && String(getVal('server'))==='5592' && /^19\.7\s*,\s*36\.6$/.test(String(getVal('coords')).trim())){
    setVal('coords','16.5, 38.1');
    THCLog.add('info','Profile','Updated The Center pickup coordinates to 16.5, 38.1 (unsaved until profile save)');
  }
  if(getVal('mapName')==='The Center' && getVal('server')==='5592')setVal('profileName','The Center / 5592 / THC Dispensary');
  if(getVal('mapName')==='Astreos' && getVal('server')==='5992')setVal('profileName','Astreos / 5992 / THC Dispensary');
  if(!p.values?.pickupType)setVal('pickupType','standard');
  if(!p.values?.clusterType)setVal('clusterType','standard');
  standardPickupSnapshot=null;
  if(getVal('pickupType')==='drakeling')setVal('clusterType','cryoDedi');
  state.imageData={};
  state.images={bg:null,map:null,yellow:null,red:null,green:null,fridgeDedi:null,cryoDedi:null,warden:null};
  for(const key of Object.keys(state.images)) {
    const saved = p.images?.[key];
    const astreosDefault=id===ASTREOS_ID && (key==='bg'||key==='map') && (!saved || saved===DEFAULTS[key]);
    const preferred=astreosDefault?(key==='map'?ASTREOS_ASSETS.map:ASTREOS_ASSETS[(p.values?.astreosPhoto)==='storefront'?'storefront':'logo']):saved;
    const source = (key === 'fridgeDedi' || key === 'cryoDedi')
      ? (saved?.startsWith('data:image/') ? saved : DEFAULTS[key])
      : (preferred || DEFAULTS[key]);
    if(source) loadImage(source,key);
  }
  if(id===ASTREOS_ID){
    // Match the saved choice while retaining any custom uploaded photo.
    const choice=(p.values && p.values.astreosPhoto)==='storefront'?'storefront':'logo';
    setVal('astreosPhoto',choice);
  }
  $('profileStatus').textContent=`Loaded ${p.name}`;
  setTimeout(()=>$('profileStatus').textContent='',1800);
}
function clearImageInputs(){
  ['bgFile','mapFile','yellowFile','redFile','greenFile','fridgeDediFile','cryoDediFile','wardenFile'].forEach(id=>$(id).value='');
}
function resetFields(){
  state.profileId=null;
  try{localStorage.removeItem('thc-last-profile');}catch(e){}
  state.imageData={};
  state.images={bg:null,map:null,yellow:null,red:null,green:null,fridgeDedi:null,cryoDedi:null,warden:null};
  clearImageInputs();
  setVal('profileName','');setVal('server','5592');setVal('mapName','The Center');setVal('spawn','Snow North');
  setVal('coords','16.5, 38.1');setVal('pin','');
  setVal('resourceColor','yellow');setVal('clusterType','standard');setVal('pickupType','standard');setVal('astreosPhoto','logo');
  setVal('bgX',50);setVal('bgY',50);setVal('showWarden',true);setVal('showMap',true);
  loadImage(DEFAULTS.bg,'bg');loadImage(DEFAULTS.map,'map');loadImage(DEFAULTS.yellow,'yellow');
  loadImage(DEFAULTS.red,'red');loadImage(DEFAULTS.green,'green');loadImage(DEFAULTS.warden,'warden');
  state.imageData={...DEFAULTS};
  updateOutputs();draw();
}
function updateOutputs(){
  $('bgXOut').value=$('bgX').value+'%';
  $('bgYOut').value=$('bgY').value+'%';
  $('bgXOut').textContent=$('bgX').value+'%';
  $('bgYOut').textContent=$('bgY').value+'%';
}


// V4 map picker: map name remains the persisted source of truth for legacy profiles.
const mapPicker=$('mapLibrary');
for(const m of ASA_MAPS){const o=document.createElement('option');o.value=m.name;o.textContent=m.name;mapPicker.appendChild(o);}
function syncMapPicker(){const m=normalizeMapName(getVal('mapName'));mapPicker.value=m?m.name:'';}
mapPicker.addEventListener('change',()=>{
 if(!mapPicker.value)return;
 setVal('mapName',mapPicker.value);
 // Never display a previous map's terrain as if it were the newly selected map.
 imageRequests.map=(imageRequests.map||0)+1;state.images.map=null;state.imageData.map=null;
 THCLog.add('info','ASA map','Selected '+mapPicker.value+'; upload a matching map image if needed');
 draw();
});
$('mapName').addEventListener('input',syncMapPicker);
$('profileSelect').addEventListener('change',()=>setTimeout(syncMapPicker,0));
$('newProfile').addEventListener('click',()=>setTimeout(syncMapPicker,0));
$('reset').addEventListener('click',()=>setTimeout(syncMapPicker,0));
syncMapPicker();
