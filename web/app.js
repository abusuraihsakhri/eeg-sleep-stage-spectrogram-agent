/* Local-only visualization and legacy threshold audit. */
"use strict";
const $ = id => document.getElementById(id);
let current = null;

function localAudit(primary, secondary, descriptor, critical) {
  if (!Number.isFinite(primary) || !Number.isFinite(secondary)) throw new Error("Both metrics must be finite numbers");
  const alerts = [];
  if (primary > 25) alerts.push("Primary metric exceeds example threshold 25");
  if (critical || secondary > 12) alerts.push(critical ? "Critical flag enabled" : "Secondary metric exceeds example threshold 12");
  if (["DISCORDANT","ANOMALY","MUTANT","VIOLATION","FAIL","REJECT"].some(x => descriptor.toUpperCase().includes(x)))
    alerts.push("Descriptor contains a flagged term");
  return { status: critical ? "CRITICAL_STAT_PANIC" : alerts.length ? "ELEVATED_RISK" : "ROUTINE", alerts,
    rule_source: "Local demonstration of agents/workers.py thresholds; not a medical interpretation",
    audit_signature: null };
}

function renderPlot(result) {
  const canvas = $("spectrogram");
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height, left = 62, top = 25, right = 20, bottom = 57;
  const pw = w-left-right, ph = h-top-bottom;
  ctx.fillStyle = "#080d19"; ctx.fillRect(0,0,w,h);
  const frames = result.frames, freqs = result.frequencies, binCount = freqs.length;
  const logValues = frames.flatMap(f => f.powers.map(p => 10 * Math.log10(Math.max(p,1e-10))));
  const sorted = logValues.slice().sort((a,b)=>a-b);
  let low = sorted[Math.floor(sorted.length*.05)], high=sorted[Math.floor(sorted.length*.98)];
  if (high-low < 10) high=low+10;
  frames.forEach((frame,i) => frame.powers.forEach((power,k) => {
    const z = Math.max(0,Math.min(1,(10*Math.log10(Math.max(power,1e-10))-low)/(high-low)));
    ctx.fillStyle = "hsl("+(238-226*z)+",85%,"+(20+40*z)+"%)";
    const x = left+i*pw/frames.length, y = top+(binCount-1-k)*ph/binCount;
    ctx.fillRect(x,y,Math.ceil(pw/frames.length)+.3,Math.ceil(ph/binCount)+.3);
  }));
  ctx.strokeStyle="#879bb4";ctx.fillStyle="#d7e4f7";ctx.lineWidth=1;ctx.font="14px system-ui";
  ctx.strokeRect(left,top,pw,ph);
  ctx.textAlign="right";
  for(let hz=0;hz<=freqs[freqs.length-1];hz+=5){
    const y=top+ph-(hz/freqs[freqs.length-1])*ph;
    ctx.fillText(String(hz),left-10,y+5);
  }
  ctx.save();ctx.translate(19,top+ph/2);ctx.rotate(-Math.PI/2);ctx.textAlign="center";ctx.fillText("Frequency (Hz)",0,0);ctx.restore();
  ctx.textAlign="center";const duration=result.samples/result.sampleRate;
  for(let i=0;i<=5;i++)ctx.fillText((duration*i/5).toFixed(1),left+pw*i/5,top+ph+21);
  ctx.fillText("Time (seconds)",left+pw/2,h-8);
}

function renderSummary(result){
  const body=$("band-summary");body.replaceChildren();
  for(const [band,range] of Object.entries(EEGSpectrogram.BANDS)){
    const avg=result.frames.reduce((sum,frame)=>sum+frame.bands[band],0)/result.frames.length;
    const tr=document.createElement("tr");
    [band,range[0]+"–"+range[1]+" Hz",avg.toFixed(3)].forEach(value=>{
      const td=document.createElement("td");td.textContent=value;tr.appendChild(td);
    });
    body.appendChild(tr);
  }
  $("recording-summary").textContent=result.samples.toLocaleString()+" samples · "+(result.samples/result.sampleRate).toFixed(2)+" seconds · "+result.frames.length+" analysis windows · frequency resolution "+(result.sampleRate/result.windowSamples).toFixed(3)+" Hz.";
}

function analyze(samples, name) {
  const result=EEGSpectrogram.analyze(samples,Number($("sample-rate").value),{windowSeconds:Number($("window-seconds").value)});
  current=result;renderPlot(result);renderSummary(result);
  $("eeg-status").textContent="Analyzed "+name+" locally.";
  $("export-image").disabled=false;$("export-csv").disabled=false;
}

$("demo").addEventListener("click",()=>{
  $("eeg-error").textContent="";
  try { $("sample-rate").value="128";analyze(EEGSpectrogram.example(),"synthetic example (2 Hz and 10 Hz)"); }
  catch(err){$("eeg-error").textContent=err.message;}
});
$("analyze").addEventListener("click",async()=>{
  $("eeg-error").textContent="";$("eeg-status").textContent="";
  const file=$("eeg-file").files[0];
  if(!file){$("eeg-error").textContent="Choose a CSV file or load the synthetic example.";return;}
  if(file.size>5*1024*1024){$("eeg-error").textContent="CSV exceeds the 5 MB limit.";return;}
  try {analyze(EEGSpectrogram.parseCSV(await file.text()),file.name);}
  catch(err){$("eeg-error").textContent=err.message;}
});
$("audit").addEventListener("click",()=>{
  $("audit-error").textContent="";
  try{
    const primary=$("primary").value.trim(),secondary=$("secondary").value.trim();
    if(!primary||!secondary)throw new Error("Enter both numeric metrics.");
    const result=localAudit(Number(primary),Number(secondary),$("descriptor").value,$("critical").checked);
    $("audit-result").textContent=JSON.stringify(result,null,2);
  }catch(err){$("audit-error").textContent=err.message;}
});
$("export-image").addEventListener("click",()=>{
  if(!current)return;
  const a=document.createElement("a");a.href=$("spectrogram").toDataURL("image/png");a.download="eeg-spectrogram.png";a.click();
});
$("export-csv").addEventListener("click",()=>{
  if(!current)return;
  const fields=Object.keys(EEGSpectrogram.BANDS);
  const rows=[["time_seconds",...fields.map(b=>b+"_uv2")].join(",")];
  for(const f of current.frames)rows.push([f.time,...fields.map(b=>f.bands[b])].join(","));
  const url=URL.createObjectURL(new Blob([rows.join("\n")+"\n"],{type:"text/csv;charset=utf-8"}));
  const a=document.createElement("a");a.href=url;a.download="eeg-band-power.csv";a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
});
$("demo").click();
