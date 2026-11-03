import {KEY, draw, resume, transition, validateNames} from './core.mjs';
const $ = id => document.getElementById(id);
const app = $('app');
let state = null, broken = false, storageFailed = false, pending = null, busy = false;
const defaults = ['Melissa','Adrian','Maddie','Sam','Sara','Anthony','Kelson','Maya','Nonnie'];
try { const raw = localStorage.getItem(KEY); if (raw) state = resume(JSON.parse(raw)); } catch { broken = true; }
function node(tag, text, cls) { const n = document.createElement(tag); if (text) n.textContent = text; if (cls) n.className = cls; return n; }
function button(text, action, cls) { const b = node('button',text,cls); b.addEventListener('click',action); return b; }
function save(next) {
  try { localStorage.setItem(KEY,JSON.stringify(next)); state = next; return true; }
  catch { storageFailed = true; render(); return false; }
}
function advance(action) {
  // Remove secrets synchronously, even if persisting the completion fails.
  if (action === 'hide') app.replaceChildren();
  const next = transition(state,action);
  if (save(next)) render();
}
function art(type = 'tree') {
  const wrap = node('div',null,`art ${type}`); wrap.setAttribute('aria-hidden','true');
  if (type === 'tree') wrap.innerHTML = '<span class="star">✦</span><div class="treetop"></div><div class="treebottom"></div><span class="ornaments">●　●<br>　●　●</span><div class="trunk"></div><img class="little-gift" src="assets/gift.svg" alt="">';
  else wrap.innerHTML = '<div class="present"><div class="present-body"></div><div class="present-lid"><span>⋈</span></div></div><span class="sparkle s1">✦</span><span class="sparkle s2">✧</span><span class="sparkle s3">✦</span>';
  return wrap;
}
function heading(eyebrow,title,description) { app.append(node('p',eyebrow,'eyebrow'),node('h1',title)); if(description) app.append(node('p',description,'intro')); }
function render() {
  app.replaceChildren(); $('practice').hidden = !state?.practice; $('settings').hidden = state?.phase === 'reveal' && !storageFailed && !broken;
  if (broken || storageFailed) {
    heading('A little help needed', 'Your secrets are hidden', storageFailed ? 'We couldn’t save your progress. Make sure this browser allows local storage, then reload to safely recover your last saved turn.' : 'This browser’s saved draw could not be read. Reset it to begin a new draw.');
    app.append(button('Reload safely',() => location.reload(),'secondary')); app.focus(); return;
  }
  if (!state) {
    heading('The family Christmas draw','Secret Santa','One phone. Nine people. Everyone gets a secret name.');
    app.append(art(),button('Set up our draw',setup),node('p','A little mystery. A lot of Christmas spirit.','small')); return;
  }
  const person = state.participants[state.order[state.turn]];
  if (state.phase === 'handoff') {
    heading(`A secret for ${state.turn + 1} of 9`,'Pass the phone to'); app.append(node('p',person.name,'person'),art('gift'),node('p',`Only ${person.name} should look at the screen.`,'intro'),button(`I’m ${person.name} — continue`,() => advance('identify')));
  } else if(state.phase === 'ready') {
    heading(`Your turn, ${person.name}`,'A little privacy, please','Make sure nobody is looking. Your Christmas secret is one tap away.'); app.append(art('gift'),button('Reveal my person',() => advance('reveal')));
  } else if(state.phase === 'reveal') {
    heading('Keep this one under wraps', 'You’re buying a gift for…'); app.append(art('opening'),node('p',state.participants[state.assignment[state.order[state.turn]]].name + '!','person recipient'),button('Hide my assignment',() => advance('hide')),node('p','Remember your name or take a private screenshot before hiding.','small'));
  } else {
    heading('Every secret is delivered',state.phase === 'closed' ? 'Your secrets are tucked away' : 'All done! Merry Christmas!','9 names drawn, 9 gifts to give.'); app.append(art('celebrate'),node('p','Let the thoughtful gifting begin.','intro'));
    if(state.phase === 'finished') app.append(button('Finish / Close',() => advance('close')));
  }
  app.focus();
}
function setup() {
  app.replaceChildren(); heading('Gather your favorite people','Who’s joining?','You won’t be assigned anyone in your own household.');
  const form = node('form'); const practiceLabel = node('label',null,'toggle'); const toggle = document.createElement('input'); toggle.type = 'checkbox'; practiceLabel.append(toggle,document.createTextNode(' Practice mode — try the full flow')); form.append(practiceLabel);
  const inputs = [], errors = [];
  ['Haiths (4)','Ngaatas (4)','Nonnie (1)'].forEach((title,g) => {
    const field = node('fieldset'); field.append(node('legend',title));
    for(let j=0;j<(g===2?1:4);j++) {
      const i=inputs.length, label=node('label',g===2?'Name':`Person ${j+1}`); const input=node('input'); input.value=defaults[i]; input.maxLength=80; input.autocomplete='off'; input.spellcheck=false; input.id=`name-${i}`; const error=node('span',null,'error'); error.id=`error-${i}`; input.setAttribute('aria-describedby',error.id); label.append(input,error); field.append(label); inputs.push(input); errors.push(error);
    }
    form.append(field);
  });
  const submit = node('button','Start Secret Santa draw'); submit.type='submit'; const status=node('p',null,'error'); status.setAttribute('role','status');
  toggle.onchange=()=> { $('practice').hidden=!toggle.checked; submit.textContent=toggle.checked?'Start practice':'Start Secret Santa draw'; };
  async function start(names,practice) {
    if(busy) return; busy=true; submit.disabled=true; status.textContent='The elves are mixing up the names…';
    try { const next=await draw(names,practice); if(save(next)) render(); }
    catch { status.textContent='The elves need another try. Please try starting again.'; }
    finally { busy=false; submit.disabled=false; }
  }
  form.onsubmit=e=> { e.preventDefault(); if(busy)return; const names=inputs.map(i=>i.value); const messages=validateNames(names); messages.forEach((message,i)=> {errors[i].textContent=message; inputs[i].setAttribute('aria-invalid',String(!!message));}); if(messages.some(Boolean)){inputs[messages.findIndex(Boolean)].focus();return;} const practice=toggle.checked; if(practice) start(names,true); else confirmAction('Ready to lock in the names?','Names are locked until reset. The organizer will not see an assignment list. Hand the phone to each person when prompted.','Start real draw',()=>start(names,false)); };
  form.append(submit,status); app.append(form); app.focus();
}
function confirmAction(title,text,label,action,erase = false) { $('erase-label').hidden=!erase; $('erase-input').value=''; $('accept').disabled=erase; $('confirm-title').textContent=title; $('confirm-text').textContent=text; $('accept').textContent=label; pending=action; $('confirm').showModal(); $('cancel').focus(); }
$('erase-input').oninput=()=>{ $('accept').disabled=$('erase-input').value !== 'RESET'; };
$('cancel').onclick=()=> {pending=null;$('confirm').close();};
$('accept').onclick=()=> {const action=pending; pending=null;$('confirm').close();action?.();};
$('confirm').addEventListener('cancel',()=>pending=null);
$('reset').onclick=()=>confirmAction('Reset the entire draw?','This will permanently destroy the current draw and everyone’s progress. You cannot recover these assignments.','Continue to reset',()=>confirmAction('One last check','Erase this draw and start again with nine names?','Erase draw',()=>{try{localStorage.removeItem(KEY);state=null;broken=false;storageFailed=false;$('settings').open=false;render();}catch{storageFailed=true;render();}},true));
const audio = new Audio(); audio.preload='none'; audio.loop=true; audio.volume=.22;
audio.src='assets/christmas-instrumental.mp3';
let playing=false, musicWanted=false;
try{musicWanted=localStorage.getItem('family-secret-santa-music')==='on';}catch{}
function musicLabel(){ $('music').textContent=playing?'♫ Music: On':musicWanted?'♫ Tap to resume':'♫ Music: Off'; $('music').setAttribute('aria-label',playing?'Turn music off':'Turn music on'); $('music').setAttribute('aria-pressed',String(playing)); }
$('music').onclick=async()=> {
  if(playing){audio.pause();playing=false;musicWanted=false;} else {try{await audio.play(); if(document.hidden){audio.pause();musicWanted=true;musicLabel();return;} playing=true;musicWanted=true;$('audio-status').textContent='';}catch{$('audio-status').textContent='Music unavailable. The draw is ready to play.';playing=false;musicWanted=false;}}
  try{localStorage.setItem('family-secret-santa-music',musicWanted?'on':'off');}catch{} musicLabel();
};
function mask(){ audio.pause();playing=false;musicLabel(); if(state?.phase==='reveal'){state={...state,phase:'ready'};app.replaceChildren();if(save(state))render();} }
window.addEventListener('pagehide',mask);
document.addEventListener('visibilitychange',()=>{if(document.hidden)mask();});
window.addEventListener('pageshow',()=>{if(state?.phase==='reveal')mask();});
musicLabel(); render();
