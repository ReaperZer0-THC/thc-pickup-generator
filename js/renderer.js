function fitCover(im,x,y,w,h,fx=50,fy=50){
  if(!im)return;
  const scale=Math.max(w/im.width,h/im.height);
  const sw=w/scale,sh=h/scale;
  const sx=(im.width-sw)*(fx/100), sy=(im.height-sh)*(fy/100);
  ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();ctx.drawImage(im,sx,sy,sw,sh,x,y,w,h);ctx.restore();
}
function fitContain(im,x,y,w,h,pad=0){
  if(!im)return;
  const s=Math.min((w-pad*2)/im.width,(h-pad*2)/im.height);
  const dw=im.width*s,dh=im.height*s;
  ctx.drawImage(im,x+(w-dw)/2,y+(h-dh)/2,dw,dh);
}
function rr(x,y,w,h,r,fill,stroke,line=2){
  ctx.beginPath();ctx.roundRect(x,y,w,h,r);
  if(fill){ctx.fillStyle=fill;ctx.fill();}
  if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=line;ctx.stroke();}
}
function text(txt,x,y,font,fill='#fff',align='left'){
  ctx.font=font;ctx.fillStyle=fill;ctx.textAlign=align;ctx.fillText(txt,x,y);
}
function wrap(txt,x,y,maxW,lineH,font,fill='#fff'){
  ctx.font=font;ctx.fillStyle=fill;ctx.textAlign='left';
  let line='';
  for(const word of String(txt||'').split(/\s+/)){
    const test=line?line+' '+word:word;
    if(ctx.measureText(test).width>maxW && line){ctx.fillText(line,x,y);y+=lineH;line=word;}
    else line=test;
  }
  if(line)ctx.fillText(line,x,y);
  return y+lineH;
}
function panel(x,y,w,h,stroke='#6d5a25'){
  rr(x,y,w,h,18,'rgba(8,14,9,.94)',stroke,2);
}
function sectionTitle(label,x,y,color='#e3c76b'){
  text(label,x,y,'900 25px Segoe UI',color);
}
function drawClusterPlaceholder(kind){
  const x=1263,y=752,w=265;
  const cryo=kind==='cryoDedi';
  const label=cryo?'CRYOFRIDGE':'REFRIGERATOR';
  rr(x+47,y,171,95,9,cryo?'#213b43':'#424b42','#b8c5aa',3);
  rr(x+60,y+10,145,70,5,cryo?'#163d48':'#303b32','#718a78',2);
  if(cryo){
    ctx.fillStyle='#67b9c8';ctx.fillRect(x+74,y+23,116,3);
    ctx.fillRect(x+74,y+45,116,3);
  }else{
    ctx.fillStyle='#a5b4a1';ctx.fillRect(x+185,y+17,5,54);
  }
  text(label,x+w/2,y+110,'700 13px Segoe UI','#d9e6d6','center');
  rr(x+31,y+120,203,43,6,'#52634b','#b7c88c',2);
  rr(x+44,y+130,176,23,3,'#26372a','#87a86e',1);
  text('DEDICATED STORAGE',x+w/2,y+146,'700 12px Segoe UI','#e6ebdc','center');
}
function draw(){
  const W=c.width,H=c.height;
  ctx.clearRect(0,0,W,H);
  const bg=ctx.createLinearGradient(0,0,W,H);
  bg.addColorStop(0,'#182519');bg.addColorStop(.55,'#071008');bg.addColorStop(1,'#0c160d');
  ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);

  ctx.fillStyle='#060b07e8';ctx.fillRect(0,0,W,100);
  text('THE HIGH COUNCIL',52,58,'900 50px Georgia','#e4c96d');
  text('One Tribe. One Goal. One Higher Power.',55,87,'600 21px Segoe UI','#c2cbbd');

  // Left column
  panel(42,125,390,820,'rgba(210,177,82,.65)');
  if(getVal('showWarden')){
    if(state.images.warden) fitContain(state.images.warden,62,150,350,545,8);
    else {ctx.fillStyle='#203822';ctx.beginPath();ctx.arc(237,365,105,0,Math.PI*2);ctx.fill();}
    text('THE WARDEN',237,725,'900 27px Georgia','#e1c76b','center');
  }
  // Main location section
  panel(455,125,1103,585,'rgba(210,177,82,.75)');
  sectionTitle('📍  PICKUP LOCATION',485,160);
  rr(480,177,1053,285,12,'#111b12','#425542',2);
  if(state.images.bg) fitCover(state.images.bg,480,177,1053,285,Number(getVal('bgX')),Number(getVal('bgY')));
  else text('Upload the location screenshot',1007,325,'700 24px Segoe UI','#8b9b88','center');

  // Location details
  text('SERVER',500,503,'900 22px Segoe UI','#e8e1c7');
  text(getVal('server')||'—',650,503,'800 22px Segoe UI','#f0ead7');
  text('MAP',500,542,'900 22px Segoe UI','#e8e1c7');
  text(getVal('mapName')||'—',650,542,'800 22px Segoe UI','#f0ead7');
  text('SPAWN',500,581,'900 22px Segoe UI','#e8e1c7');
  text(getVal('spawn')||'—',650,581,'800 22px Segoe UI','#f0ead7');
  text('COORDINATES',500,626,'900 27px Segoe UI','#b9e56d');
  text(getVal('coords')||'—',700,626,'900 27px Segoe UI','#b9e56d');
  text('PIN',500,668,'900 22px Segoe UI','#e8e1c7');
  text(getVal('pin')||'----',650,668,'900 22px Segoe UI','#f0ead7');

  // Map inset
  if(getVal('showMap')){
    rr(1055,488,478,195,12,'#0c140d','#465746',2);
    if(state.images.map) fitContain(state.images.map,1065,498,458,175,3);
    text('LOCATION MAP',1072,515,'800 14px Segoe UI','#aebaa8');
  }

  // Policy section — second priority
  panel(455,730,760,215,'rgba(127,189,67,.72)');
  sectionTitle(getVal('pickupType')==='drakeling'?'🔑  DRAKELING KEY PICKUP':'📦  PICKUP POLICY',485,766,'#9bd45f');
  const policy=getVal('pickupType')==='drakeling' ? [
    '• Collect XP-loaded Drakelings from the Cryofridge.',
    '• Transfer XP to your target dinosaur.',
    '• Notify your trader when finished; return Drakelings as instructed.',
    '• Pickup within 72 hours of notification; contact trader for extension.',
    '• No-show orders may be canceled or released.'
  ] : [
    '• Pick up within 72 hours of notification.',
    '• Need more time? Contact your trader before the deadline.',
    '• No communication after 72 hours? Your order may be canceled.',
    '• Canceled orders may be auctioned or released to other community members.',
    '• Communication keeps trades moving.'
  ];
  let py=803;
  for(const line of policy){py=wrap(line,485,py,700,25,'600 15px Segoe UI','#e4eadf')+1;}

  // Resource section — third priority
  panel(1235,730,323,215,'rgba(127,189,67,.45)');
  const cluster=getVal('pickupType')==='drakeling'?'cryoDedi':getVal('clusterType');
  if(cluster==='standard'){
    const res=state.images[getVal('resourceColor')];
    if(res) fitContain(res,1250,745,295,185,3);
  }else{
    const res=state.images[cluster];
    if(res){fitContain(res,1250,745,295,185,3);THCLog.render(cluster,'photo loaded');}
    else {drawClusterPlaceholder(cluster);THCLog.render(cluster,'placeholder');}
  }

  // THC footer
  ctx.beginPath();ctx.arc(800,970,28,0,Math.PI*2);ctx.fillStyle='#151a12';ctx.fill();
  ctx.strokeStyle='#d0ad54';ctx.lineWidth=3;ctx.stroke();
  text('THC',800,978,'900 17px Georgia','#e3c76b','center');
}

function makeNewPin(){setVal('pin',randomPin());draw();}
$('newPin').onclick=makeNewPin;$('newPin2').onclick=makeNewPin;
fields.forEach(id=>$(id).addEventListener('input',()=>{updateOutputs();draw();}));

$('profileSelect').addEventListener('change',e=>loadProfile(e.target.value));
$('newProfile').onclick=()=>{resetFields();$('profileSelect').value='';$('profileName').focus();};
$('saveProfile').onclick=saveProfile;$('saveCurrent').onclick=saveProfile;
$('deleteProfile').onclick=async()=>{
  if(!state.profileId){alert('Select or save a profile first.');return;}
  if(confirm('Delete this saved profile and its stored images?')){
    await dbDelete(state.profileId);state.profileId=null;await refreshProfiles();
    $('profileStatus').textContent='Profile deleted.';
  }
};
$('reset').onclick=()=>{if(confirm('Reset the current poster fields? Saved profiles will not be deleted.'))resetFields();};

$('download').onclick=async()=>{
  setVal('pin',randomPin());draw();
  const pin=getVal('pin');
  try{
    const blob=await new Promise(resolve=>c.toBlob(resolve,'image/png'));
    if(!blob) throw new Error('No image data produced.');
    await navigator.clipboard.write([new ClipboardItem({'image/png':blob})]);
    $('saveStatus').textContent=`Copied to clipboard — PIN ${pin}.`;
  }catch(e){
    console.warn(e);
    $('saveStatus').textContent='Clipboard copy failed — your browser may not support it. Try Chrome or Edge.';
  }
  setTimeout(()=>$('saveStatus').textContent='',3000);
};

(async()=>{
  // Preload supplied assets.
  for(const key of Object.keys(DEFAULTS)) loadImage(DEFAULTS[key],key);
  state.imageData={...DEFAULTS};
  updateOutputs();draw();
  try{await seedCenter();await seedAstreos();await refreshProfiles();}catch(e){console.warn(e);}
})();

