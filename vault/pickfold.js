// Pull single Drive file/folder objects by id out of earlier tool results in a session transcript (no retyping).
// Usage: TRANSCRIPT=<session .jsonl> node vault/pickfold.js <outDir> <id>...
const fs=require('fs');const F=process.env.TRANSCRIPT;
const [out,...ids]=process.argv.slice(2);const want=new Set(ids);const got={};
const keep=['id','title','mimeType','parentId','createdTime','modifiedTime','viewUrl','fileSize','owner'];
const take=o=>{if(o&&want.has(o.id)&&o.mimeType)got[o.id]=Object.fromEntries(keep.map(k=>[k,o[k]]));};
for(const line of fs.readFileSync(F,'utf8').split('\n')){if(!ids.some(i=>line.includes(i)))continue;let j;try{j=JSON.parse(line)}catch{continue}
 const c=j.message&&j.message.content;if(!Array.isArray(c))continue;
 for(const b of c){if(b.type!=='tool_result')continue;const t=Array.isArray(b.content)?b.content.map(x=>x.text||'').join(''):String(b.content);
  if(!t.trim().startsWith('{'))continue;let r;try{r=JSON.parse(t)}catch{continue}(r.files||[r]).forEach(take);}}
for(const id of ids){if(!got[id]){console.log('MISSING',id);continue}fs.writeFileSync(out+'/'+id+'.json',JSON.stringify({files:[got[id]]}));}
console.log('found',Object.keys(got).length,'of',ids.length);
