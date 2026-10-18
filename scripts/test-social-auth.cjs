const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, mocks) {
 const exports = {};
 const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.React, esModuleInterop: true}}).outputText;
 vm.runInNewContext(code, {exports, process: {env: {}}, require: name => {if (!(name in mocks)) throw Error('Unexpected import '+name); return mocks[name];}});
 return exports;
}
function setup(platform='android', configured=true) {
 const calls=[];let appleArgs;
 const api={post: async(path, body)=> {calls.push([path,body]);return path.endsWith('/challenge') ? {challenge_id:'one-time-id',nonce:'server-nonce'} : {access_token:'lingoiq-token',refresh_token:'refresh',created:true};}};
 const sdk={GoogleSignin:{configure: args=>calls.push(['configure',args]),hasPlayServices:async()=>{},signOut:async()=>calls.push(['signOut']),signIn:async()=>({type:'success',data:{serverAuthCode:'one-time-code',idToken:'must-not-be-sent'}})},isSuccessResponse:r=>r.type==='success',isErrorWithCode:e=>!!e.code,statusCodes:{SIGN_IN_CANCELLED:'CANCELLED',IN_PROGRESS:'IN_PROGRESS'}};
 const apple={isAvailableAsync:async()=>true,AppleAuthenticationScope:{EMAIL:1,FULL_NAME:2},signInAsync:async args=>{appleArgs=args;return {identityToken:'signed-apple-token',state:args.state,fullName:null,email:null};}};
 const native={get:()=>true};
 const oauth=load('src/lib/oauth.ts',{'react-native':{Platform:{OS:platform},TurboModuleRegistry:native},'expo-constants':{expoConfig:{extra:configured?{googleWebClientId:'web',googleIosClientId:'ios'}:{}}},'./api-client':{ApiClient:api},'@react-native-google-signin/google-signin':sdk,'expo-apple-authentication':apple});
 return {oauth,calls,sdk,apple,native,getAppleArgs:()=>appleArgs};
}
test('Google exchanges a fresh server code with LingoIQ; never sends client email/ID token',async()=>{
 const s=setup();const result=await s.oauth.socialSignIn('google');assert.equal(result.access_token,'lingoiq-token');assert.equal(result.created,true);
 const submit=s.calls.find(([path])=>path==='/auth/social/google');assert.deepEqual(JSON.parse(JSON.stringify(submit[1])),{challenge_id:'one-time-id',authorization_code:'one-time-code'});
 assert.equal(s.calls.find(([n])=>n==='configure')[1].offlineAccess,true);
 assert.ok(s.calls.findIndex(([n])=>n==='signOut')>s.calls.findIndex(([n])=>n.endsWith('/challenge')));
});
test('Google cancellation never submits credentials',async()=>{
 const s=setup();s.sdk.GoogleSignin.signIn=async()=>({type:'cancelled'});
 await assert.rejects(s.oauth.socialSignIn('google'),s.oauth.SocialAuthCancelled);
 assert.equal(s.calls.filter(([p])=>p==='/auth/social/google').length,0);
});
test('missing configuration or native module does not start OAuth',async()=>{
 let s=setup('android',false);await assert.rejects(s.oauth.socialSignIn('google'),/oauth_not_configured/);assert.equal(s.calls.length,0);
 s=setup();s.native.get=()=>false;await assert.rejects(s.oauth.socialSignIn('google'),/oauth_native_build_required/);assert.equal(s.calls.length,0);
});
test('Apple is rejected on Android; iOS binds native nonce/state and supports repeat login without email',async()=>{
 let s=setup();await assert.rejects(s.oauth.socialSignIn('apple'),/oauth_unavailable/);assert.equal(s.calls.length,0);
 s=setup('ios');await s.oauth.socialSignIn('apple');assert.equal(s.getAppleArgs().nonce,'server-nonce');assert.equal(s.getAppleArgs().state,'one-time-id');
 const body=s.calls.find(([p])=>p==='/auth/social/apple')[1];assert.equal(body.identity_token,'signed-apple-token');assert.equal(body.email,undefined);
});
test('Apple state mismatch never reaches login API',async()=>{
 const s=setup('ios');s.apple.signInAsync=async()=>({identityToken:'token',state:'other-challenge'});
 await assert.rejects(s.oauth.socialSignIn('apple'),/oauth_no_token/);
 assert.equal(s.calls.filter(([p])=>p==='/auth/social/apple').length,0);
});
test('provider buttons show Google on Android and Google + Apple on iOS',()=>{
 for (const platform of ['android','ios']) {
  const react={createElement:(type,props,...children)=>({type,props,children}),Fragment:'fragment'};
  const {SocialAuthButtons}=load('src/components/auth/SocialAuthButtons.tsx',{
   react,'react-native':{Platform:{OS:platform},View:'View',Text:'Text',Pressable:'Pressable',ActivityIndicator:'ActivityIndicator'},'react-i18next':{useTranslation:()=>({t:k=>k})},'@/components/figma/FigmaSvg':{FigmaSvg:'SVG'},'../../../assets/figma/mieo-login/113-366-15242-svg.svg':'google-svg','../../../assets/figma/mieo-login/115-366-15246-svg.svg':'apple-svg'});
  const tree=JSON.stringify(SocialAuthButtons({disabled:false,onPress:()=>{}}));assert.ok(tree.includes('social-google'));assert.equal(tree.includes('social-apple'),platform==='ios');
 }
});

function setupSocialHook() {
 let options;const events=[];
 const {useSocialLogin}=load('src/hooks/use-social-login.ts',{
  react:{useRef:value=>({current:value})},
  '@tanstack/react-query':{useQueryClient:()=>({removeQueries:()=>events.push(['clearQueries']),setQueryData:()=>{}}),useMutation:opts=>{options=opts;return {mutate:()=>{}}}},
  'expo-router':{router:{replace:path=>events.push(['route',path])}},
  'react-i18next':{useTranslation:()=>({t:key=>key})},
  'react-native-toast-message':{show:props=>events.push(['toast',props.type])},
  '@/lib/oauth':{socialSignIn:()=>{},SocialAuthCancelled:class extends Error{}},
  '@/lib/auth-service':{AuthService:{saveAuthResponse:async()=>events.push(['saveSession']),setUser:async()=>{}}},
  '@/lib/api-client':{ApiClient:{get:async()=>({id:'signed-in-user'})},OnboardingApi:{getState:async()=>({completed:true})}},
  '@/lib/onboarding-storage':{mergeBackendState:async()=>events.push(['mergeRemote']),getOnboardingState:async()=>({target_language:null,native_language:null}),patchOnboardingState:async patch=>events.push(['patchLocal',patch])},
  '@/lib/i18n':{getCurrentLang:()=> 'ru'},
  './use-onboarding':{syncLocalOnboardingToBackend:async()=>events.push(['syncSelections'])}
 });
 return {start:origin=>useSocialLogin(origin),events,getOptions:()=>options};
}
test('new Google account enters learning setup with a saved session, without returning to welcome',async()=>{
 const s=setupSocialHook();s.start('login');await s.getOptions().onSuccess({created:true});
 assert.ok(s.events.some(([e])=>e==='saveSession'));
 assert.ok(s.events.some(([e,p])=>e==='route'&&p==='/onboarding/goal'));
 assert.ok(!s.events.some(([e,p])=>e==='route'&&p==='/onboarding/welcome'));
 const patch=s.events.find(([e])=>e==='patchLocal')[1];assert.equal(patch.target_language,'en');assert.equal(patch.native_language,'ru');
});
test('social signup saves the completed selections; an existing account loads its server profile',async()=>{
 let s=setupSocialHook();s.start('onboarding');await s.getOptions().onSuccess({created:true});
 assert.ok(s.events.some(([e])=>e==='syncSelections'));assert.ok(s.events.some(([e,p])=>e==='route'&&p==='/(tabs)'));
 s=setupSocialHook();s.start('login');await s.getOptions().onSuccess({created:false});
 assert.ok(s.events.some(([e])=>e==='mergeRemote'));assert.ok(!s.events.some(([e])=>e==='syncSelections'));assert.ok(s.events.some(([e,p])=>e==='route'&&p==='/(tabs)'));
});
test('cancelled social sign-in does not replace a session or navigate',async()=>{
 const s=setupSocialHook();s.start('login');await s.getOptions().onSuccess(null);assert.equal(s.events.length,0);
});
