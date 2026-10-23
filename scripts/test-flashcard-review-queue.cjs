const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const path=require('node:path');
const compiled=ts.transpileModule(fs.readFileSync(path.join(__dirname,'../src/lib/flashcard-review-queue.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
function load(storage,auth,send){
 const mod={exports:{}};
 const dependencies={
 '@react-native-async-storage/async-storage':{default:storage},
 './auth-service':{AuthService:{getSessionUserID:async()=>auth.owner}},
 './api-client':{FlashcardsApi:{review:send}},
 './vocabulary-attempt-queue':{newVocabularyAttemptId:()=> 'attempt'},
 './query-client':{queryClient:{invalidateQueries:async()=>{}}},
 };
 vm.runInNewContext(compiled,{exports:mod.exports,require:name=>dependencies[name]});return mod.exports;
}
function storage(){const data=new Map();return {getItem:async k=>data.get(k)||null,setItem:async(k,v)=>{data.set(k,v)}}}
test('offline review persists through restart with the same retry key',async()=>{
 const store=storage();const auth={owner:'alice'};const first=load(store,auth,async()=>{throw new Error('offline')});
 await assert.rejects(first.saveFlashcardReview('card',{remembered:true,attempt_id:'stable'}));
 const sent=[];const second=load(store,auth,async(id,data)=>{sent.push([id,data.attempt_id]);return {}});
 await second.drainFlashcardReviews();assert.deepEqual(sent,[['card','stable']]);
 await second.drainFlashcardReviews();assert.equal(sent.length,1);
});
test('new account cannot replay another account review',async()=>{
 const store=storage();const auth={owner:'alice'};const first=load(store,auth,async()=>{throw new Error('offline')});
 await assert.rejects(first.saveFlashcardReview('card',{remembered:false}));auth.owner='bob';
 let sent=0;const second=load(store,auth,async()=>{sent++;return {}});
 await second.drainFlashcardReviews();assert.equal(sent,0);auth.owner='alice';await second.drainFlashcardReviews();assert.equal(sent,1);
});
test('same in-flight intent is sent once even if background drain races retry',async()=>{
 const store=storage();const auth={owner:'alice'};let release;const wait=new Promise(r=>{release=r});let sent=0;
 const queue=load(store,auth,async()=>{sent++;await wait;return {}});
 const saving=queue.saveFlashcardReview('card',{remembered:true,attempt_id:'same'});
 await new Promise(setImmediate);const draining=queue.drainFlashcardReviews();release();await Promise.all([saving,draining]);assert.equal(sent,1);
});
