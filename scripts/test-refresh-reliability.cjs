const {test}=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs');const vm=require('node:vm');const ts=require('typescript');const path=require('node:path');
const compiled=ts.transpileModule(fs.readFileSync(path.join(__dirname,'../src/lib/api-client.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
function load(responses){
 let cleared=0;const exports={};const deps={
 'react-native':{Platform:{OS:'android'}},'expo-constants':{default:{expoConfig:{version:'test'}}},
 './i18n':{getCurrentLang:()=> 'en'},'expo-router':{router:{replace:()=>{}}},
 './auth-service':{AuthService:{getAccessToken:async()=> 'access',getRefreshToken:async()=> 'refresh',setTokens:async()=>{},clearTokens:async()=>{cleared++}}},
 };
 vm.runInNewContext(compiled,{exports,require:name=>deps[name]??{},process:{env:{}},setTimeout,clearTimeout,AbortController,fetch:async()=>{
  const next=responses.shift();if(next instanceof Error)throw next;
  return {ok:next>=200&&next<300,status:next,headers:{get:()=> 'application/json'},json:async()=>({}),text:async()=> 'failed'};
 }});return {api:exports.ApiClient,cleared:()=>cleared};
}
test('temporary refresh failure preserves the session',async()=>{
 const state=load([401,503]);await assert.rejects(state.api.get('/flashcards'),e=>e.statusCode===503);assert.equal(state.cleared(),0);
});
test('offline refresh preserves the session',async()=>{
 const state=load([401,new Error('offline')]);await assert.rejects(state.api.get('/flashcards'),e=>e.statusCode===0);assert.equal(state.cleared(),0);
});
test('rejected refresh still clears revoked credentials',async()=>{
 const state=load([401,401]);await assert.rejects(state.api.get('/flashcards'));assert.equal(state.cleared(),1);
});
