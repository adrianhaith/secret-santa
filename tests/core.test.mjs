import test from 'node:test';
import assert from 'node:assert/strict';
import {draw,validateNames,validAssignment,validState,resume,transition,shuffle} from '../core.mjs';
const names=Array.from({length:9},(_,i)=>`Person ${i}`);
test('5,000 draws satisfy the 4+4+1 bijection and independently permuted turn order',async()=>{
  const seen=Array.from({length:9},()=>new Set());
  for(let i=0;i<5000;i++){
    const s=await draw(names);
    assert(validState(s)); assert(validAssignment(s.assignment));
    s.assignment.forEach((recipient,giver)=>seen[giver].add(recipient));
    assert.deepEqual([...s.order].sort((a,b)=>a-b),[0,1,2,3,4,5,6,7,8]);
  }
  assert.equal(seen[0].size,5); assert.equal(seen[8].size,8);
});
test('trimmed, case-insensitive duplicate and missing names rejected',async()=>{
  assert(validateNames(['   ','']).every(Boolean));
  assert(validateNames([' Alice ','aLiCe']).every(Boolean));
  assert(validateNames(names).every(x=>!x));
  await assert.rejects(draw([...names.slice(0,8),' Person 0 ']));
});
test('all nine turns recover safely and only hide completes a turn',async()=>{
  let s=await draw(names,true); const order=[...s.order];
  for(let turn=0;turn<9;turn++){
    assert.equal(s.turn,turn); assert.equal(s.phase,'handoff');
    assert.equal(transition(s,'hide').turn,turn);
    s=transition(s,'identify'); assert.equal(s.phase,'ready');
    assert.equal(resume(JSON.parse(JSON.stringify(s))).phase,'handoff');
    s=transition(s,'reveal'); assert.equal(s.phase,'reveal');
    const recovered=resume(JSON.parse(JSON.stringify(s)));
    assert.equal(recovered.turn,turn); assert.equal(recovered.phase,'handoff');
    assert.deepEqual(recovered.assignment,s.assignment);
    s=transition(s,'hide');
    assert.equal(transition(s,'hide').turn,turn+1);
    assert.equal(resume(s).turn,turn+1);
  }
  assert.equal(s.phase,'finished'); assert.deepEqual(s.order,order);
  s=transition(s,'close'); assert.equal(resume(s).phase,'closed');
});
test('corrupt or incompatible storage rejected without rendering',async()=>{
  const s=await draw(names);
  for(const bad of [null,{}, {...s,version:2},{...s,turn:10},{...s,assignment:Array(9).fill(0)},{...s,order:Array(9).fill(0)},{...s,phase:'finished'},{...s,participants:[{}]}]){
    assert.equal(validState(bad),false); assert.throws(()=>resume(bad));
  }
});
test('bounded sampler fails gracefully instead of silently relaxing constraints',async()=>{
  await assert.rejects(draw(names,false,{cap:0}),/another try/);
  assert.deepEqual(shuffle([]),[]); assert.deepEqual(shuffle([1]),[1]);
});
