// THC Pickup Generator V4 — portrait, four-step navigation card.
const POSTER_WIDTH=1200, POSTER_HEIGHT=1710;
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
 rounded(32,y,1136,43,10,'#19432b');
 rounded(38,y+2,44,38,9,'#baff38');
 write(n,60,y+30,25,'#12301c',900,'center');
 write(title,96,y+30,26,'#ffe079',900);
 write(subtitle,1155,y+28,16,'#a7ef9d',700,'right');
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
 const W=c.width,H=c.height, drake=getVal('pickupType')==='drakeling';
 const lime='#baff38', emerald='#13df79', gold='#ffe079', white='#f4fbea', muted='#bdd5b9';
 const grad=ctx.createLinearGradient(0,0,W,H);grad.addColorStop(0,'#061b10');grad.addColorStop(.55,'#0a2617');grad.addColorStop(1,'#09130e');
 ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
 ctx.fillStyle='#103c26';ctx.fillRect(0,0,W,108);
 ctx.fillStyle=lime;ctx.fillRect(0,104,W,5);
 write('THE HIGH COUNCIL',36,57,41,gold,900);
 write('PICKUP GUIDE  •  FOUR STEPS',40,89,19,emerald,800);
 rounded(920,23,242,64,12,'#193c27','#50c55b');
 write('READY FOR PICKUP',1041,62,20,lime,900,'center');
 // Step 1: condensed high-contrast information strip.
 section('1','PICKUP DETAILS','TRANSFER & ACCESS',123);
 rounded(32,175,1136,157,13,'#123422','#377d48');
 write('MAP',52,205,15,muted,800);write(getVal('mapName')||'—',52,244,31,white,900);
 write('SERVER',422,205,15,muted,800);write(getVal('server')||'—',422,244,31,white,900);
 write('PICKUP TYPE',645,205,15,muted,800);
 wrapLines(drake?'Drakeling Key Pickup':'Standard Pickup',645,242,280,23,26,gold,2);
 rounded(975,185,170,115,12,'#25482b','#9fe944');
 write('PIN',1060,211,15,muted,900,'center');
 write(getVal('pin')||'----',1060,268,42,lime,900,'center');
 const instructions=drake?'Collect XP-loaded Drakelings, transfer XP, then notify your trader for return pickup.':'Collect from the marked storage cluster. Contact your trader if assistance is needed.';
 wrapLines(instructions,52,300,870,17,22,muted,2);
 // Step 2: map screenshot fills the panel; no tiny centered thumbnail.
 section('2','COORDINATES & MAP','FIND YOUR WAY',350);
 rounded(32,403,1136,355,13,'#112d1e','#377d48');
 const coords=parseArkCoords(getVal('coords'));
 write('LAT / LON',52,437,15,muted,800);
 write(coords?coords.lat.toFixed(1)+'  /  '+coords.lon.toFixed(1):getVal('coords')||'—',52,481,38,lime,900);
 write('SPAWN / REGION',560,437,15,muted,800);
 wrapLines(getVal('spawn')||'—',560,474,580,24,27,white,2);
 if(getVal('showMap')){
  const im=state.images.map;
  rounded(48,506,1104,234,10,'#07170f','#448a46');
  if(im){
   photoCover(im,51,509,1098,228,50,50);
   rounded(58,516,165,29,7,'#071b10');
   write('MAP REFERENCE',69,537,16,lime,900);
   THCLog.render('map','reference image; marker withheld pending calibration');
  }else{
   write('MAP IMAGE NOT SET',600,625,26,gold,800,'center');
  }
 }else write('Map hidden in display settings',600,633,21,muted,700,'center');
 // Step 3: photo is largest element on card.
 section('3','FIND THE LOCATION','MATCH THE LANDMARK',776);
 rounded(32,829,1136,390,13,'#112d1e','#377d48');
 if(state.images.bg)photoCover(state.images.bg,39,836,1122,376,Number(getVal('bgX')),Number(getVal('bgY')));
 else write('UPLOAD LOCATION PHOTO',600,1028,27,gold,800,'center');
 // Step 4: horizontal cluster panel with image on left.
 section('4','IDENTIFY THE PICKUP CLUSTER','MATCH THE CONTAINER',1237);
 rounded(32,1290,1136,276,13,'#112d1e','#377d48');
 const cluster=drake?'cryoDedi':getVal('clusterType');
 const im=state.images[cluster==='standard'?getVal('resourceColor'):cluster];
 const label=cluster==='cryoDedi'?'CRYOFRIDGE + DEDICATED STORAGE':cluster==='fridgeDedi'?'REFRIGERATOR + DEDICATED STORAGE':'STANDARD PICKUP CLUSTER';
 rounded(47,1302,470,250,10,'#0b2116','#327346');
 if(im){photoContain(im,56,1308,452,238);THCLog.render(cluster,'photo fitted without cropping');}
 else{write('CLUSTER PHOTO',282,1433,23,gold,800,'center');THCLog.render(cluster,'missing photo');}
 write('LOOK FOR',549,1352,18,emerald,900);
 wrapLines(label,549,1400,578,30,39,gold,3);
 wrapLines('Match this image before collecting your order.',549,1512,565,18,24,muted,2);
 rounded(32,1584,1136,61,12,'#22542f','#66bd47');
 write('72-HOUR PICKUP WINDOW  •  CONTACT YOUR TRADER FOR AN EXTENSION',600,1623,20,white,900,'center');
 write('THE WARDEN  •  THE HIGH COUNCIL',600,1686,17,emerald,800,'center');
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
