import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve('dist');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png','.mp4':'video/mp4','.woff2':'font/woff2'};

http.createServer((request,response)=>{
 const urlPath=decodeURIComponent(new URL(request.url,'http://127.0.0.1').pathname);
 let file=path.resolve(root,'.'+urlPath);
 if(!file.startsWith(root)){response.writeHead(403).end();return;}
 if(urlPath.endsWith('/'))file=path.join(file,'index.html');
 if(!fs.existsSync(file)||!fs.statSync(file).isFile()){response.writeHead(404).end();return;}
 const stat=fs.statSync(file);
 const range=request.headers.range;
 response.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');
 response.setHeader('Accept-Ranges','bytes');
 if(range){
  const match=/bytes=(\d*)-(\d*)/.exec(range);
  const start=match?.[1]?Number(match[1]):0;
  const end=match?.[2]?Math.min(Number(match[2]),stat.size-1):stat.size-1;
  response.writeHead(206,{'Content-Range':`bytes ${start}-${end}/${stat.size}`,'Content-Length':end-start+1});
  fs.createReadStream(file,{start,end}).pipe(response);
  return;
 }
 response.writeHead(200,{'Content-Length':stat.size});
 fs.createReadStream(file).pipe(response);
}).listen(4173,'127.0.0.1',()=>console.log('listening 4173'));
