// THC Pickup Generator V4 — portrait, four-step navigation card.
const POSTER_WIDTH=1200, POSTER_HEIGHT=1900;
c.width=POSTER_WIDTH;c.height=POSTER_HEIGHT;
function rounded(x,y,w,h,r,fill,stroke){
 ctx.beginPath();ctx.roundRect(x,y,w,h,r);
 if(fill){ctx.fillStyle=fill;ctx.fill();}
 if(stroke){ctx.lineWidth=2;ctx.strokeStyle=stroke;ctx.stroke();}
}
function write(value,x,y,size=25,color='#eaf0e5',weight=600,align='left'){
 ctx.font=weight+' '+size+'px Segoe UI, Arial';ctx.textAlign=align;ctx.fillStyle=color;
 ctx.fillText(String(value??''),x,y);
}
function wrapLines(value,x,y,maxWidth,size=21,lineHeight=30,color='#eaf0e5',maxLines=10){
 ctx.font='600 '+size+'px Segoe UI, Arial';ctx.textAlign='left';ctx.fillStyle=color;
 const words=String(value||'').split(/\s+/);let line='',lines=0;
 for(const word of words){
  const next=line?line+' '+word:word;
  if(ctx.measureText(next).width>maxWidth&&line){ctx.fillText(line,x,y);y+=lineHeight;lines++;line=word;if(lines>=maxLines)return y;}
  else line=next;
 }
 if(line){ctx.fillText(line,x,y);y+=lineHeight;}
 return y;
}
function photoContain(im,x,y,w,h){
 if(!im)return;
 const s=Math.min(w/im.width,h/im.height);
 const dw=im.width*s,dh=im.height*s;
 ctx.drawImage(im,x+(w-dw)/2,y+(h-dh)/2,dw,dh);
}
function photoCover(im,x,y,w,h,fx=50,fy=50){
 if(!im)return;
 const s=Math.max(w/im.width,h/im.height),sw=w/s,sh=h/s;
 const sx=(im.width-sw)*Math.max(0,Math.min(100,fx))/100;
 const sy=(im.height-sh)*Math.max(0,Math.min(100,fy))/100;
 ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();
 ctx.drawImage(im,sx,sy,sw,sh,x,y,w,h);ctx.restore();
}
function section(n,title,subtitle,y){
 rounded(32,y,1136,44,10,'#263d2a');
 rounded(38,y+2,44,39,9,'#d5b75c');
 write(n,60,y+30,25,'#132015',900,'center');
 write(title,96,y+30,27,'#f2dc8e',900);
 write(subtitle,1155,y+28,16,'#b9c9b7',600,'right');
}
function mapFrame(x,y,w,h){
 rounded(x,y,w,h,14,'#142219','#64794d');
 const map=normalizeMapName(getVal('mapName'));
 const im=state.images.map;
 if(im){
  // Coordinate overlays require map-specific calibration. Show a clear map
  // reference and coordinates separately until artwork is calibrated.
  photoContain(im,x+8,y+8,w-16,h-16);
  write('MAP REFERENCE',x+20,y+34,17,'#ffffff',800);
  THCLog.render('map','reference image; marker withheld pending calibration');
 }else{
  write(map?map.name.toUpperCase():'CUSTOM MAP',x+w/2,y+h/2-10,33,'#e2c66f',900,'center');
  write('Upload a map image to show the terrain',x+w/2,y+h/2+28,18,'#b7c8b2',600,'center');
 }
}
function draw(){
 const W=c.width,H=c.height;
 ctx.fillStyle='#08130c';ctx.fillRect(0,0,W,H);
 ctx.fillStyle='#152b1a';ctx.fillRect(0,0,W,122);
 write('THE HIGH COUNCIL',42,59,43,'#ebd17b',900);
 write('READY FOR PICKUP  •  YOUR FOUR-STEP GUIDE',45,96,21,'#c5d5bf',700);
 rounded(34,145,1132,325,18,'#111f15','#50663d');
 section('1','PICKUP DETAILS & INSTRUCTIONS','Transfer to the correct server',155);
 rounded(54,215,523,86,12,'#213724');
 rounded(593,215,550,86,12,'#213724');
 write('MAP',72,241,16,'#b4c7b0',700);write(getVal('mapName')||'—',72,282,35,'#fff',900);
 write('SERVER',611,241,16,'#b4c7b0',700);write(getVal('server')||'—',611,282,35,'#fff',900);
 write('PICKUP TYPE',70,339,17,'#b4c7b0',700);
 const drake=getVal('pickupType')==='drakeling';
 write(drake?'Drakeling Key Pickup':'Standard Pickup',70,376,27,'#f0dc98',800);
 write('PICKUP PIN',1100,339,17,'#b4c7b0',700,'right');
 write(getVal('pin')||'----',1100,382,39,'#f1d579',900,'right');
 const instructions=drake
 ? 'Collect XP-loaded Drakelings from the Cryofridge. Transfer XP to your target dinosaur; notify your trader and return Drakelings as instructed.'
 : 'Collect your order from the indicated storage cluster. Contact your trader if you need assistance.';
 wrapLines(instructions,70,415,1060,18,24,'#dce7d8',2);
 rounded(34,490,1132,425,18,'#111f15','#50663d');
 section('2','COORDINATES & MAP','Navigate to the pickup area',500);
 write('LATITUDE / LONGITUDE',65,574,18,'#b9c9b7',800);
 const coords=parseArkCoords(getVal('coords'));
 write(coords?coords.lat.toFixed(1)+'  /  '+coords.lon.toFixed(1):getVal('coords')||'—',65,628,43,'#a8df79',900);
 write('SPAWN / REGION',630,574,18,'#b9c9b7',800);
 wrapLines(getVal('spawn')||'—',630,615,500,24,30,'#f1ead4',2);
 if(getVal('showMap'))mapFrame(58,663,1084,228);
 else write('Map image hidden in display settings',600,772,22,'#9aa997',600,'center');
 rounded(34,935,1132,485,18,'#111f15','#50663d');
 section('3','FIND THE LOCATION','Match the storefront or landmark',945);
 rounded(56,1006,1088,390,13,'#19291c','#405c3b');
 if(state.images.bg)photoCover(state.images.bg,61,1011,1078,380,Number(getVal('bgX')),Number(getVal('bgY')));
 else write('UPLOAD A LOCATION PHOTO',600,1205,29,'#c1d1b9',800,'center');
 rounded(34,1440,1132,378,18,'#111f15','#50663d');
 section('4','IDENTIFY THE PICKUP CLUSTER','Match the correct container',1450);
 const cluster=drake?'cryoDedi':getVal('clusterType');
 const im=state.images[cluster==='standard'?getVal('resourceColor'):cluster];
 const label=cluster==='cryoDedi'?'CRYOFRIDGE + DEDICATED STORAGE':
 cluster==='fridgeDedi'?'REFRIGERATOR + DEDICATED STORAGE':'STANDARD PICKUP CLUSTER';
 rounded(57,1514,490,282,12,'#19291c','#405c3b');
 if(im){photoContain(im,66,1522,472,266);THCLog.render(cluster,'photo fitted to portrait-friendly cluster frame');}
 else{write('UPLOAD CLUSTER PHOTO',302,1660,22,'#c1d1b9',800,'center');THCLog.render(cluster,'missing photo');}
 write('LOOK FOR',578,1555,19,'#b6cbb0',800);
 wrapLines(label,578,1601,525,31,39,'#f2d77f',3);
 wrapLines('Match this image before opening a container.',578,1715,525,20,29,'#d8e4d3',2);
 write('72-HOUR PICKUP WINDOW  •  CONTACT YOUR TRADER FOR AN EXTENSION',600,1861,19,'#e3ce83',800,'center');
 write('THE WARDEN  •  ONE TRIBE. ONE GOAL. ONE HIGHER POWER.',600,1888,14,'#a7bda4',600,'center');
}
function makeNewPin(){setVal('pin',randomPin());draw();}
$('newPin').onclick=makeNewPin;$('newPin2').onclick=makeNewPin;
fields.forEach(id=>$(id).addEventListener('input',()=>{updateOutputs();draw();}));
$('profileSelect').addEventListener('change',async e=>{await loadProfile(e.target.value);if(typeof syncMapPicker==='function')syncMapPicker();});
$('newProfile').onclick=()=>{resetFields();$('profileSelect').value='';$('profileName').focus();};
$('saveProfile').onclick=saveProfile;$('saveCurrent').onclick=saveProfile;
$('deleteProfile').onclick=async()=>{
 if(!state.profileId){alert('Select or save a profile first.');return;}
 if(confirm('Delete this saved profile and its stored images?')){
  await dbDelete(state.profileId);state.profileId=null;await refreshProfiles();
  $('profileStatus').textContent='Profile deleted.';
 }
};
$('reset').onclick=()=>{if(confirm('Reset current poster fields? Saved profiles will not be deleted.'))resetFields();};
$('download').onclick=async()=>{
 setVal('pin',randomPin());draw();const pin=getVal('pin');
 try{
  const blob=await new Promise(resolve=>c.toBlob(resolve,'image/png'));
  if(!blob)throw new Error('No image data produced.');
  await navigator.clipboard.write([new ClipboardItem({'image/png':blob})]);
  $('saveStatus').textContent='Copied to clipboard — PIN '+pin+'.';
 }catch(e){THCLog.add('error','Clipboard',String(e));$('saveStatus').textContent='Clipboard failed; use Chrome or Edge on HTTPS.';}
 setTimeout(()=>$('saveStatus').textContent='',3000);
};
(async()=>{
 for(const key of Object.keys(DEFAULTS))loadImage(DEFAULTS[key],key);
 state.imageData={...DEFAULTS};updateOutputs();draw();
 try{await seedCenter();await seedAstreos();await refreshProfiles();}catch(e){THCLog.add('error','Profiles',String(e));}
})();
