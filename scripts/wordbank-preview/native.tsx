/** Browser-only QA adapter for the existing native components. Not shipped. */
import React from 'react';
const fonts = { Nunito_400Regular:'Nunito_400Regular', Nunito_600SemiBold:'Nunito_600SemiBold',Nunito_700Bold:'Nunito_700Bold',Nunito_800ExtraBold:'Nunito_800ExtraBold',Nunito_900Black:'Nunito_900Black' };
function css(input: any): any {
  const s = Object.assign({}, ...[input].flat(Infinity).filter(Boolean));
  if(s.flex===1) {s.flex='1 1 0%';s.minHeight=0;}
  if(s.resizeMode) delete s.resizeMode;
  if(s.textAlignVertical) {s.verticalAlign=s.textAlignVertical;delete s.textAlignVertical;}
  if(Array.isArray(s.transform))s.transform=s.transform.map((x:any)=>Object.entries(x).map(([k,v])=>`${k}(${typeof v==='number'?v+'px':v})`).join(' ')).join(' ');
  if(s.fontFamily)s.fontFamily=fonts[s.fontFamily as keyof typeof fonts]??s.fontFamily;
  return s;
}
function props(p:any){return {className:p.className,style:css(p.style),'aria-label':p.accessibilityLabel,'aria-hidden':p.accessibilityElementsHidden||undefined,'data-testid':p.testID};}
export function View(p:any){return <div {...props(p)} className={'rn-view '+(p.className??'')} style={{...css(p.style),pointerEvents:p.pointerEvents==='none'?'none':undefined}}>{p.children}</div>}
export function Text(p:any){return <div {...props(p)} style={{position:'relative',...css(p.style)}}>{p.children}</div>}
export function Pressable(p:any){return <button type="button" {...props(p)} disabled={p.disabled} aria-checked={p.accessibilityState?.checked} aria-selected={p.accessibilityState?.selected} onClick={p.onPress} role={p.accessibilityRole==='radio'?'radio':undefined}>{p.children}</button>}
export function TextInput(p:any){const C=p.multiline?'textarea':'input';return <C {...props(p)} value={p.value} placeholder={p.placeholder} onChange={(e:any)=>p.onChangeText?.(e.target.value)} disabled={p.editable===false} />}
export function Image(p:any){return <img {...props(p)} src={typeof p.source==='string'?p.source:p.source?.uri} alt={p.accessibilityLabel??''} style={{...css(p.style),objectFit:p.resizeMode==='contain'?'contain':'cover'}} />}
export function ScrollView(p:any){return <div className="rn-view" style={{flex:'1 1 0%',minHeight:0,overflow:'auto'}}><div className={'rn-view '+(p.contentContainerClassName??'')} style={{minHeight:'100%',...css(p.contentContainerStyle)}}>{p.children}</div></div>}
export function KeyboardAvoidingView(p:any){return <View {...p}/>}
export function ActivityIndicator(p:any){return <span role="status" style={{color:p.color}}>…</span>}
export const Platform={OS:'web'};
export const StyleSheet={absoluteFill:{position:'absolute',inset:0},create:(x:any)=>x,flatten:css};
export const PixelRatio={get:()=>1};
export const Touchable={Mixin:{}};
export const unstable_createElement=React.createElement;
