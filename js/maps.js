// THC V4 map registry. Image artwork is deliberately not redistributed without verified permission.
// Custom uploaded/saved map images remain supported for every entry.
const ASA_MAPS=[
 ['The Island','the-island'],['Scorched Earth','scorched-earth'],['The Center','the-center'],
 ['Aberration','aberration'],['Extinction','extinction'],['Ragnarok','ragnarok'],
 ['Astraeos','astraeos'],['Valguero','valguero'],['Genesis Part 1','genesis-part-1'],
 ['Genesis Part 2','genesis-part-2'],['Crystal Isles','crystal-isles'],
 ['Lost Island','lost-island'],['Fjordur','fjordur']
].map(([name,id])=>({name,id,artwork:null,calibration:null}));
function normalizeMapName(value){
 const key=String(value||'').toLowerCase().replace(/[^a-z0-9]/g,'');
 const aliases={astreos:'astraeos',genesis:'genesispart1',genesis1:'genesispart1',genesis2:'genesispart2'};
 const canonical=aliases[key]||key;
 return ASA_MAPS.find(m=>m.name.toLowerCase().replace(/[^a-z0-9]/g,'')===canonical)||null;
}
function parseArkCoords(raw){
 const match=String(raw||'').match(/^\s*(\d{1,3}(?:\.\d+)?)\s*[,;/ ]\s*(\d{1,3}(?:\.\d+)?)\s*$/);
 if(!match)return null;
 const lat=Number(match[1]),lon=Number(match[2]);
 return lat>=0&&lat<=100&&lon>=0&&lon<=100?{lat,lon}:null;
}
