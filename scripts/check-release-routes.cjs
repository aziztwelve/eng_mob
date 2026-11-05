const fs = require('fs');
const path = require('path');
const ts = require(process.cwd() + '/node_modules/typescript');
const root = process.cwd();
function walk(dir) { return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir,e.name)) : [path.join(dir,e.name)]); }
const files = walk(path.join(root,'src')).filter(f => /\.(tsx?|[cm]?js)$/.test(f));
const imports = new Map();
const links = [];
function resolve(from, spec) {
 let target;
 if(spec.startsWith('@/assets/')) target=path.join(root,spec.slice(2));
 else if(spec.startsWith('@/')) target=path.join(root,'src',spec.slice(2));
 else if(spec.startsWith('.')) target=path.resolve(path.dirname(from),spec);
 else return;
 const variants = [target+'.android.tsx',target+'.native.tsx',target+'.tsx',target+'.android.ts',target+'.native.ts',target+'.ts',target+'.js',target+'.cjs',path.join(target,'index.tsx'),path.join(target,'index.ts'),target];
 return variants.find(f => fs.existsSync(f) && fs.statSync(f).isFile());
}
for(const file of files) {
 const code=fs.readFileSync(file,'utf8');
 const ast=ts.createSourceFile(file,code,ts.ScriptTarget.Latest,true);
 const deps=[];
 function visit(n) {
  let spec;
  if((ts.isImportDeclaration(n)||ts.isExportDeclaration(n)) && n.moduleSpecifier && !n.isTypeOnly && !n.importClause?.isTypeOnly) spec=n.moduleSpecifier.text;
  if(ts.isCallExpression(n)&&ts.isIdentifier(n.expression)&&n.expression.text==='require'&&n.arguments.length===1&&ts.isStringLiteral(n.arguments[0])) spec=n.arguments[0].text;
  if(spec) { const r=resolve(file,spec); if(r) deps.push(r); }
  if(file.endsWith('.tsx') && ts.isStringLiteral(n) && n.text.startsWith('/') && !n.text.startsWith('//')) links.push({file:path.relative(root,file),line:ast.getLineAndCharacterOfPosition(n.getStart()).line+1,target:n.text});
  ts.forEachChild(n,visit);
 }
 visit(ast); imports.set(file,[...new Set(deps)]);
}
const entries=files.filter(f=>f.startsWith(path.join(root,'src/app/')));
const seen=new Set();
function scan(f) {if(seen.has(f)) return; seen.add(f); (imports.get(f)||[]).forEach(scan);}
entries.forEach(scan);
const assets=[...seen].filter(f=>f.startsWith(path.join(root,'assets/')));
const unusedCode=files.filter(f=>!seen.has(f));
const unusedAssets=walk(path.join(root,'assets')).filter(f=>!seen.has(f));
const routeFiles=entries.filter(f=>!path.basename(f).startsWith('_'));
const routePath=f=>'/'+path.relative(path.join(root,'src/app'),f).replace(/\.(tsx?|jsx?)$/,'').split('/').filter(p=>!/^\(.*\)$/.test(p)).join('/').replace(/(^|\/)index$/,'');
const routes=routeFiles.map(f=>({file:path.relative(root,f),path:routePath(f)||'/'}));
const normalize=p=>p.replace(/\/\([^/]+\)/g,'').replace(/\/$/,'')||'/';
const patterns=routes.map(r=>new RegExp('^'+r.path.split('/').map(part=>part.startsWith('[...')?'.+':part.startsWith('[')?'[^/]+':part.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('/')+'/?$'));
const invalidLinks=links.filter(l=>!patterns.some(re=>re.test(normalize(l.target.split('?')[0]))));
const report={routeCount:routes.length, routes, reachableCode: [...seen].filter(f=>imports.has(f)).length, assets:assets.map(f=>({file:path.relative(root,f),bytes:fs.statSync(f).size})), assetBytes: assets.reduce((n,f)=>n+fs.statSync(f).size,0), unusedCode:unusedCode.map(f=>path.relative(root,f)), unusedAssetCount:unusedAssets.length, unusedAssetBytes:unusedAssets.reduce((n,f)=>n+fs.statSync(f).size,0), invalidLinks};
const retired = ['(tabs)/courses/index.tsx', '(tabs)/courses/[id].tsx', 'index-old.tsx', 'index-backup.tsx', 'explore.tsx', 'figma/index.tsx', '(tabs)/home-candy.tsx', '(tabs)/home-neon.tsx', '(tabs)/home-ruya.tsx', '(tabs)/home-ruya-pro.tsx', '(tabs)/ai/roleplay.tsx', '(tabs)/ai/tutor.tsx', '(tabs)/ai/writing.tsx', '(tabs)/ai/pronunciation.tsx'];
const forbidden = retired.filter(name => fs.existsSync(path.join(root, 'src/app', name)));
if (invalidLinks.length || forbidden.length) {
  console.error(JSON.stringify({ invalidLinks, retiredRoutesInApp: forbidden }, null, 2));
  process.exitCode = 1;
} else {
  console.log(`PASS: ${report.routeCount} pages, ${links.length} static internal links, no retired routes or broken static destinations`);
}
if (process.argv[2]) fs.writeFileSync(process.argv[2], JSON.stringify(report, null, 2));
