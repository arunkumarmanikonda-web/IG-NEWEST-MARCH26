import {zipSync,strToU8} from "fflate";
const xml=s=>String(s??"").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g,"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
const base="http://schemas.openxmlformats.org/";
const main=base+"spreadsheetml/2006/main", rel=base+"officeDocument/2006/relationships";
const time=new Intl.DateTimeFormat("en-GB",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"});
const ist=s=>time.format(new Date(s));
function worksheet(rows,widths){
  const cols=widths.map((w,i)=>'<col min="'+(i+1)+'" max="'+(i+1)+'" width="'+w+'" customWidth="1"/>').join("");
  const body=rows.map((row,i)=>'<row r="'+(i+1)+'">'+row.map((v,j)=>'<c r="'+String.fromCharCode(65+j)+(i+1)+'" t="inlineStr" s="'+(i===0?1:0)+'"><is><t xml:space="preserve">'+xml(v)+'</t></is></c>').join("")+'</row>').join("");
  return '<worksheet xmlns="'+main+'"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>'+cols+'</cols><sheetData>'+body+'</sheetData><autoFilter ref="A1:'+String.fromCharCode(64+widths.length)+rows.length+'"/></worksheet>';
}
export function gulluWorkbook(sessions) {
  const summary=[["Guest","Mobile","Email","Conversation","First exchange (IST)","Last exchange (IST)","Topics","Brief summary","Team follow-up","Turns"]];
  const transcript=[["Conversation","Guest","Mobile","Email","Time (IST)","Speaker","Full message","Published pages","Team follow-up"]];
  for(const g of sessions){
    const turns=g.turns||[]; if(!turns.length)continue;
    const topics=[...new Set(turns.map(t=>t.practice))].join(", ");
    const first=turns[0],last=turns.at(-1),follow=turns.some(t=>t.follow_up);
    const pages=[...new Set(turns.flatMap(t=>(t.sources||[]).map(s=>s.title)))];
    const brief="Opened with “"+first.question+"”."+(turns.length>1?" Latest question: “"+last.question+"”.":"")+(pages.length?" Discussed "+pages.slice(0,3).join(", ")+".":"")+(follow?" The guest requested a follow-up.":"");
    summary.push([g.name,g.mobile,g.email,g.session_id,ist(first.created_at),ist(last.created_at),topics,brief,follow?"Requested":"",turns.length]);
    for(const t of turns){
      const info=[g.session_id,g.name,g.mobile,g.email,ist(t.created_at)];
      transcript.push([...info,"Guest",t.question,"",""],[...info,"Gullu",t.answer,(t.sources||[]).map(s=>s.title+" · https://indiagully.com"+s.href).join("\n"),t.follow_up?"Requested":""]);
    }
  }
  const parts={};
  const add=(path,body)=>{parts[path]=strToU8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+body);};
  const typ="application/vnd.openxmlformats-officedocument.spreadsheetml.";
  add("[Content_Types].xml",'<Types xmlns="'+base+'package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>'+[["/xl/workbook.xml","sheet.main"],["/xl/styles.xml","styles"],["/xl/worksheets/sheet1.xml","worksheet"],["/xl/worksheets/sheet2.xml","worksheet"]].map(([p,t])=>'<Override PartName="'+p+'" ContentType="'+typ+t+'+xml"/>').join("")+'</Types>');
  const relationships=items=>'<Relationships xmlns="'+base+'package/2006/relationships">'+items.map(([id,t,path])=>'<Relationship Id="rId'+id+'" Type="'+rel+'/'+t+'" Target="'+path+'"/>').join("")+'</Relationships>';
  add("_rels/.rels",relationships([[1,"officeDocument","xl/workbook.xml"]]));
  add("xl/workbook.xml",'<workbook xmlns="'+main+'" xmlns:r="'+rel+'"><sheets><sheet name="Guest summaries" sheetId="1" r:id="rId1"/><sheet name="Full conversations" sheetId="2" r:id="rId2"/></sheets></workbook>');
  add("xl/_rels/workbook.xml.rels",relationships([[1,"worksheet","worksheets/sheet1.xml"],[2,"worksheet","worksheets/sheet2.xml"],[3,"styles","styles.xml"]]));
  add("xl/styles.xml",'<styleSheet xmlns="'+main+'"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF373329"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="2"><xf xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf><xf xfId="0" fontId="1" fillId="2" applyFont="1" applyFill="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>');
  add("xl/worksheets/sheet1.xml",worksheet(summary,[23,18,32,38,23,23,28,84,18,9]));
  add("xl/worksheets/sheet2.xml",worksheet(transcript,[38,23,18,32,23,12,98,55,18]));
  return Buffer.from(zipSync(parts,{level:5,mtime:new Date("2000-01-01T00:00:00Z")}));
}
export async function readGulluDay(getPage,limit=Infinity){
  const rows=[];let after=null;
  for(;;){const page=await getPage(after);if(!Array.isArray(page))throw new Error("Conversation report unavailable");
    rows.push(...page);if(rows.length>limit)return null;if(page.length<25)return rows;
    const next=page.at(-1).session_id;if(next===after)throw new Error("Report cursor did not advance");after=next;}
}
