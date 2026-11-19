import test from "node:test";
import assert from "node:assert/strict";
import {residencesDefaults,validateResidences,publicResidences,residencesHomeLayout} from "../lib/residences.mjs";
import {validateSection} from "../lib/site-editorial.mjs";
import {parseSiteRecords,sitePrefix,writeSiteRecord} from "../lib/site-cms-records.mjs";
import {effectiveSnapshot} from "../lib/site-schedules.mjs";

const launch = (patch={}) => ({...structuredClone(residencesDefaults),enabled:true,...patch});

test("Residences is hidden until an enabled approved CMS revision exists",()=>{
  assert.equal(publicResidences(residencesDefaults),null);
  assert.equal(publicResidences(null),null);
  assert.equal(publicResidences({...launch(),enabled:"true"}),null);
  assert.equal(publicResidences({...launch(),secret:"private"}),null);
  const publicCopy=publicResidences(launch());
  assert.equal(publicCopy.href,"/residences");
  assert.equal(publicCopy.location,"Sector 35, Sohna");
  for(const key of ["enabled","startsAt","endsAt"])assert.equal(Object.hasOwn(publicCopy,key),false);
  assert.equal(publicCopy.image,"");
  assert.deepEqual(publicCopy.highlights,[]);
});

test("one validated website section supports optional media, booleans and empty approved highlights",()=>{
  const content=validateSection("residences-launch",launch({headline:"  India Gully Residences  "}));
  assert.equal(content.headline,"India Gully Residences");
  assert.deepEqual(parseSiteRecords([{slug:sitePrefix+"residences-launch",body:JSON.stringify(content),version:3}])["residences-launch"].content,content);
  assert.throws(()=>validateResidences(launch({homepage:"false"})));
  assert.throws(()=>validateResidences(launch({placement:"top"})));
  assert.throws(()=>validateResidences(launch({highlights:Array(9).fill("Confirmed feature")})));
  assert.throws(()=>validateResidences(launch({headline:""})));
  assert.equal(validateResidences(launch({highlights:[" Approved detail "]})).highlights[0],"Approved detail");
});

test("launch starts inclusively and expires across website and feeds at the same instant",()=>{
  const content=launch({startsAt:"2032-01-01T10:00:00+05:30",endsAt:"2032-01-02T10:00:00+05:30"});
  const start=Date.parse(content.startsAt),end=Date.parse(content.endsAt);
  assert.equal(publicResidences(content,start-1),null);
  assert.ok(publicResidences(content,start));
  assert.ok(publicResidences(content,end-1));
  assert.equal(publicResidences(content,end),null);
  assert.equal(publicResidences(content,NaN),null);
  assert.throws(()=>validateResidences(launch({startsAt:"tomorrow"})));
  assert.throws(()=>validateResidences(launch({startsAt:"2032-02-31T10:00:00Z"})));
  assert.throws(()=>validateResidences(launch({startsAt:"2032-01-01T24:00:00Z"})));
  assert.ok(validateResidences(launch({startsAt:"2032-02-29T10:00+05:30"})));
  assert.throws(()=>validateResidences(launch({startsAt:"2032-01-02T10:00:00Z",endsAt:"2032-01-02T10:00:00Z"})));
});

test("media and CTA validation excludes unsafe protocols, private routes and malformed fields",()=>{
  for(const ctaHref of ["javascript:alert(1)","https://other.test","//other.test","/api/admin/website","/admin","/account/profile","/images/%2e%2e/admin","/%2fother.test","/\\other.test","/%zz"])assert.throws(()=>validateResidences(launch({ctaHref})),ctaHref);
  for(const image of ["data:text/html,hello","http://images.test/home.jpg","https://user:pass@images.test/home.jpg","/api/admin/source-media/id","/images/%2e%2e/admin/x.jpg","/images/home.svg"])
    assert.throws(()=>validateResidences(launch({image,imageAlt:"Approved project view"})),image);
  assert.throws(()=>validateResidences(launch({image:"/images/library/project.jpg"})));
  const media=validateResidences(launch({image:"/images/library/project.jpg",imageAlt:"Approved project view",video:"https://indiagully.com/videos/film.mp4",logo:"https://www.indiagully.com/brand/mark.svg"}));
  assert.equal(media.video,"/videos/film.mp4");
  assert.equal(media.logo,"/brand/mark.svg");
  assert.throws(()=>validateResidences(launch({video:"https://media.example.com/film.mp4"})));
  assert.throws(()=>validateResidences(launch({image:"https://media.example.com/project.jpg",imageAlt:"Approved project view"})));
  assert.throws(()=>validateResidences(launch({video:"https://www.youtube.com/watch?v=example"})));
});

test("homepage placement preserves the selected existing section order and cannot duplicate launch",()=>{
  const layout=["hero","search","listings","practices","contact"];
  assert.deepEqual(residencesHomeLayout(layout,null),layout);
  assert.deepEqual(residencesHomeLayout(layout,publicResidences(launch())),["hero","residences","search","listings","practices","contact"]);
  assert.deepEqual(residencesHomeLayout(layout,publicResidences(launch({placement:"before-listings"}))),["hero","search","residences","listings","practices","contact"]);
  assert.deepEqual(residencesHomeLayout(layout,publicResidences(launch({placement:"before-contact"}))),["hero","search","listings","practices","residences","contact"]);
  assert.deepEqual(residencesHomeLayout(layout,publicResidences(launch({homepage:false}))),layout);
  assert.deepEqual(residencesHomeLayout(["residences","search","residences"],publicResidences(launch())),["residences","search"]);
});

test("Residences publishing retains CMS version checks and keeps scheduled content encrypted",async()=>{
  const savedCalls=[];
  const secretBefore=process.env.INTEGRATION_MASTER_KEY;
  process.env.INTEGRATION_MASTER_KEY="local-residences-test-encryption-key";
  const content=launch({startsAt:"2099-01-01T00:00:00.000Z"});
  const client={from(table){return {select(){return this;},eq(){return this;},async maybeSingle(){return {data:null,error:null};}};},async rpc(name,args){savedCalls.push([name,args.p]);return {data:{id:"cms-test",version:1},error:null};}};
  try{
    await assert.rejects(()=>writeSiteRecord(client,{section:"residences-launch",version:2,content,action:"save"}),/Another editor/);
    assert.equal(savedCalls.length,0);
    assert.deepEqual(await writeSiteRecord(client,{section:"residences-launch",version:0,content,action:"publish",reviewed:true,effective_at:content.startsAt}),{version:1});
    assert.deepEqual(savedCalls.map(([name])=>name),["ig_save_content","ig_content_action"]);
    const stored=savedCalls[0][1];
    assert.equal(stored.practice,"corporate");
    assert.equal(stored.slug,"website-editor-residences-launch");
    assert.equal(stored.body.includes(content.description),false);
    const snapshot=JSON.parse(stored.body),time=Date.parse(content.startsAt);
    assert.equal(effectiveSnapshot("residences-launch",1,snapshot,{time:time-1,secret:process.env.INTEGRATION_MASTER_KEY}).content,undefined);
    const approved=effectiveSnapshot("residences-launch",1,snapshot,{time,secret:process.env.INTEGRATION_MASTER_KEY}).content;
    assert.ok(publicResidences(approved,time));
    assert.equal(savedCalls[1][1].factsConfirmed,true);
    assert.equal(savedCalls[1][1].rightsConfirmed,true);
    assert.equal(savedCalls[1][1].privacyConfirmed,true);
  }finally{if(secretBefore===undefined)delete process.env.INTEGRATION_MASTER_KEY;else process.env.INTEGRATION_MASTER_KEY=secretBefore;}
});
