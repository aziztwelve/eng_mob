const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const path=require('node:path');
const compiled=ts.transpileModule(fs.readFileSync(path.join(__dirname,'../src/lib/lesson-progress.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
test('completion storage belongs to its account and ignores unowned v1 data',async()=>{
 const data=new Map([['lesson_completed_v1','["old-lesson"]']]);let owner='alice';const mod={exports:{}};
 vm.runInNewContext(compiled,{exports:mod.exports,require:name=>({
 '@react-native-async-storage/async-storage':{default:{getItem:async k=>data.get(k)||null,setItem:async(k,v)=>{data.set(k,v)}}},
 './auth-service':{AuthService:{getSessionUserID:async()=>owner}},
 '@/hooks/use-auth':{},'@tanstack/react-query':{},
 }[name])});
 assert.equal((await mod.exports.getCompletedLessons('alice')).size,0);
 await mod.exports.markLessonCompleted('lesson-a','alice');
 owner='bob';assert.equal((await mod.exports.getCompletedLessons('bob')).size,0);
 await mod.exports.markLessonCompleted('late-alice-request','alice');
 assert.equal((await mod.exports.getCompletedLessons('alice')).has('late-alice-request'),false);
 await mod.exports.markLessonCompleted('lesson-b','bob');
 assert.equal((await mod.exports.getCompletedLessons('alice')).has('lesson-b'),false);
 assert.equal((await mod.exports.getCompletedLessons('bob')).has('lesson-b'),true);
});
