/* =========================================================
   Data — LNCT Bhopal alumni records (sample set)
   ========================================================= */
const BRANCH = {CS:"Computer Science & Engineering", IT:"Information Technology",
  EC:"Electronics & Communication", ME:"Mechanical Engineering",
  CE:"Civil Engineering", EX:"Electrical & Electronics"};

const LANG = {JavaScript:"#f1e05a",Python:"#3572A5",Java:"#b07219","C++":"#f34b7d",
  TypeScript:"#3178c6",Go:"#00ADD8",Kotlin:"#A97BFF",Solidity:"#AA6746",Dart:"#00B4AB",
  R:"#198CE7",MATLAB:"#e16737","C#":"#178600",PHP:"#4F5D95",Rust:"#dea584",HTML:"#e34c26"};

/* =========================================================
   Student data
   =========================================================
   Empty on purpose — fill this array with one object per
   alumnus, in the exact shape shown below, then everything
   else (search, filters, profile view) works unchanged.

   Field guide:
     n     full name                       string
     e     enrolment number                 string, e.g. "0176CS201019"
     y     passing year                     number, e.g. 2024
     b     branch code                      one of: CS, IT, EC, ME, CE, EX
     cg    CGPA                              number, e.g. 8.6
     city  current city                      string
     ph    phone                             string
     em    email                             string
     li    LinkedIn handle (no domain)       string, e.g. "in/jane-doe"
     gh    GitHub username (optional)        string, "" if none
     pf    portfolio website link (optional) string, "" if none
     st    placement status                  one of: "placed","higher","founder","seeking"
     co    company / institute               string, "" if seeking
     role  job title / programme             string, "" if seeking
     ctc   package or scholarship label       string, "" if seeking
     ptype placement route                    string, e.g. "On-campus","Off-campus","Higher studies"
     track career timeline                    array of [date, description] pairs
     sk    skills                             array of [skillName, level 1-5] pairs
     pj    projects                           array of {t,d,l,x} objects:
             t  project title                 string
             d  one/two sentence description  string
             l  primary language               string, must match a key in LANG below
                (or add a new language:hexColor entry to LANG)
             x  tech stack, free text          string

   Example record (copy, fill in, and add a comma between entries):

   {n:"Jane Doe",e:"0176CS201001",y:2024,b:"CS",cg:8.5,city:"Bhopal",
    ph:"+91 90000 00000",em:"jane.doe24@lnct.ac.in",li:"in/jane-doe",gh:"janedoe",pf:"https://janedoe.dev",
    st:"placed",co:"Example Corp",role:"Software Engineer",ctc:"₹10.0 LPA",ptype:"On-campus",
    track:[["Jan 2024","Placed at Example Corp through campus"]],
    sk:[["JavaScript",4],["React",3]],
    pj:[{t:"Project name",d:"What it does and why it mattered.",l:"JavaScript",x:"React · Node"}]}
*/
const S = [

];
/* =========================================================
   Honeycomb background
   ========================================================= */
function honeycomb(){
  const host=document.getElementById('honeycomb');
  const W=innerWidth,H=innerHeight,r=34,w=Math.sqrt(3)*r,h=1.5*r;
  const cols=Math.ceil(W/w)+2,rows=Math.ceil(H/h)+2;
  const pts=i=>{let p=[];for(let k=0;k<6;k++){const a=Math.PI/180*(60*k-90);
    p.push((r*Math.cos(a)).toFixed(2)+','+(r*Math.sin(a)).toFixed(2));}return p.join(' ')};
  const poly=pts();
  let s=`<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice"><g>`;
  for(let row=-1;row<rows;row++){
    for(let col=-1;col<cols;col++){
      const x=col*w+(row%2?w/2:0), y=row*h;
      const lit=Math.random()<0.045;
      s+=`<polygon class="cell${lit?' lit':''}" points="${poly}" transform="translate(${x},${y})"/>`;
    }
  }
  host.innerHTML=s+'</g></svg>';
}
honeycomb();
let rz; addEventListener('resize',()=>{clearTimeout(rz);rz=setTimeout(honeycomb,250)});

/* =========================================================
   Theme
   ========================================================= */
const root=document.documentElement, tL=document.getElementById('t-light'), tD=document.getElementById('t-dark');
function setTheme(t,save=true){
  root.setAttribute('data-theme',t);
  tL.setAttribute('aria-pressed',t==='light'); tD.setAttribute('aria-pressed',t==='dark');
  if(save){try{localStorage.setItem('lnct-theme',t)}catch(e){}}
}
(function(){
  let saved=null; try{saved=localStorage.getItem('lnct-theme')}catch(e){}
  if(saved) setTheme(saved,false);
  else setTheme(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark',false);
})();
tL.onclick=()=>setTheme('light'); tD.onclick=()=>setTheme('dark');

/* =========================================================
   Search: exact → prefix → substring → fuzzy (edit distance)
   ========================================================= */
const norm=s=>s.toLowerCase().replace(/[^a-z0-9 ]/g,'').trim();

function lev(a,b){
  if(a===b) return 0;
  if(!a.length) return b.length; if(!b.length) return a.length;
  let prev=Array.from({length:b.length+1},(_,i)=>i), cur=new Array(b.length+1);
  for(let i=1;i<=a.length;i++){
    cur[0]=i;
    for(let j=1;j<=b.length;j++){
      const cost=a[i-1]===b[j-1]?0:1;
      cur[j]=Math.min(cur[j-1]+1,prev[j]+1,prev[j-1]+cost);
    }
    [prev,cur]=[cur,prev];
  }
  return prev[b.length];
}
const ratio=(a,b)=>1-lev(a,b)/Math.max(a.length,b.length);

/* score a student against a query. >=0.9 counts as a direct hit,
   anything from 0.42 up is offered as a similar name. */
function score(st,q){
  const name=norm(st.n), en=st.e.toLowerCase(), toks=name.split(' ');
  if(/^[0-9]/.test(q)||/^0176/.test(q)){
    if(en===q) return 1.0;
    if(en.startsWith(q)) return .97;
    if(en.includes(q)) return .92;
  }
  if(/^(19|20)\d{2}$/.test(q)) return String(st.y)===q?1.0:0;

  if(name===q) return 1.0;
  if(name.startsWith(q)) return .96;
  if(toks.some(t=>t.startsWith(q))) return .93;
  if(name.includes(q)) return .91;
  if(en.includes(q)) return .90;
  if(norm(st.co||'').includes(q)||norm(st.city).includes(q)||
     norm(BRANCH[st.b]).includes(q)||st.sk.some(k=>norm(k[0]).includes(q))) return .90;

  // fuzzy: best of whole-name and per-token similarity
  let best=ratio(q,name);
  for(const t of toks){
    best=Math.max(best,ratio(q,t));
    if(q.length>3&&t.length>q.length) best=Math.max(best,ratio(q,t.slice(0,q.length))*.97);
  }
  // initials, e.g. "hvs" → Harsh Vardhan Singh
  if(q.length>=2 && q.length<=4 && toks.map(t=>t[0]).join('').startsWith(q)) best=Math.max(best,.88);
  return best;
}

function highlight(name,q){
  if(!q) return name;
  const i=norm(name).indexOf(q);
  if(i<0||!q.length) return name;
  return name.slice(0,i)+'<em>'+name.slice(i,i+q.length)+'</em>'+name.slice(i+q.length);
}

/* =========================================================
   Rendering
   ========================================================= */
const avColors=['#0969da','#8250df','#1a7f37','#bc4c00','#cf222e','#1b7c83','#a40e26','#4d2d9e'];
const avatar=(n,cls='av')=>{
  const parts=n.split(' ');
  const ini=(parts[0][0]+(parts[parts.length-1][0]||'')).toUpperCase();
  let h=0; for(const c of n) h=(h*31+c.charCodeAt(0))|0;
  return `<div class="${cls}" style="background:${avColors[Math.abs(h)%avColors.length]}">${ini}</div>`;
};
const statusBadge=s=>({
  placed:['b-green','Placed'],higher:['b-purple','Higher studies'],
  founder:['b-blue','Entrepreneur'],seeking:['b-yellow','Open to roles']}[s]);

const qEl=document.getElementById('q'), resEl=document.getElementById('results'),
      countEl=document.getElementById('count'), sortEl=document.getElementById('sortnote'),
      clearBtn=document.getElementById('clear'), stage=document.getElementById('stage'),
      crumbs=document.getElementById('crumbs'), yearsEl=document.getElementById('years');

let yearFilter=null, selected=null, visible=[], cursor=-1;

/* year chips */
const YEARS=[...new Set(S.map(s=>s.y))].sort();
yearsEl.innerHTML=YEARS.map(y=>`<button class="chip" data-y="${y}" aria-pressed="false">${y}</button>`).join('')
  +`<button class="chip" data-y="all" aria-pressed="true">All years</button>`;
yearsEl.onclick=e=>{
  const b=e.target.closest('.chip'); if(!b) return;
  yearFilter=b.dataset.y==='all'?null:+b.dataset.y;
  [...yearsEl.children].forEach(c=>c.setAttribute('aria-pressed',c===b));
  render();
};

function render(){
  const raw=qEl.value.trim(), q=norm(raw);
  clearBtn.classList.toggle('on',!!raw);

  let pool=S.filter(s=>!yearFilter||s.y===yearFilter);
  let hits=[], near=[];

  if(!q){
    hits=pool.slice().sort((a,b)=>a.n.localeCompare(b.n));
    sortEl.textContent='A–Z';
  }else{
    const scored=pool.map(s=>({s,v:score(s,q)})).sort((a,b)=>b.v-a.v||a.s.n.localeCompare(b.s.n));
    hits=scored.filter(o=>o.v>=0.9).map(o=>o.s);
    near=scored.filter(o=>o.v<0.9&&o.v>=0.42).slice(0,6).map(o=>o.s);
    sortEl.textContent='by relevance';
  }
  visible=[...hits,...near]; cursor=-1;

  countEl.innerHTML= q
    ? `<b>${hits.length}</b> match${hits.length===1?'':'es'}${yearFilter?` in ${yearFilter}`:''}`
    : `<b>${hits.length}</b> alumni${yearFilter?` from ${yearFilter}`:''}`;

  let html='';
  const rowHTML=(s,qq)=>`
    <button class="row" data-e="${s.e}" role="option" aria-current="${selected&&selected.e===s.e}">
      ${avatar(s.n)}
      <span style="min-width:0">
        <span class="nm">${highlight(s.n,qq)}</span>
        <span class="meta">${s.e} · ${s.b} ${s.y}</span>
      </span>
    </button>`;

  if(hits.length) html+=hits.map(s=>rowHTML(s,q)).join('');
  else if(q) html+=`<p class="empty">No record matches “${raw}”. Check the spelling, or try the enrolment number.</p>`;

  if(near.length){
    html+=`<div class="groupline">Similar names</div>`+near.map(s=>rowHTML(s,'')).join('');
  }
  resEl.innerHTML=html;
}

resEl.onclick=e=>{
  const b=e.target.closest('.row'); if(!b) return;
  open(S.find(s=>s.e===b.dataset.e));
};

/* keyboard: / to focus, arrows to walk the list, Enter to open */
addEventListener('keydown',e=>{
  if(e.key==='/'&&document.activeElement!==qEl){e.preventDefault();qEl.focus();qEl.select();return}
  if(document.activeElement!==qEl) return;
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){
    e.preventDefault();
    if(!visible.length) return;
    cursor=e.key==='ArrowDown'?Math.min(cursor+1,visible.length-1):Math.max(cursor-1,0);
    const rows=resEl.querySelectorAll('.row');
    rows.forEach((r,i)=>r.setAttribute('aria-current',i===cursor));
    rows[cursor]?.scrollIntoView({block:'nearest'});
  }
  if(e.key==='Enter'&&visible[cursor]) open(visible[cursor]);
  if(e.key==='Escape'){qEl.value='';render()}
});
qEl.addEventListener('input',render);
clearBtn.onclick=()=>{qEl.value='';render();qEl.focus()};

/* =========================================================
   Profile view
   ========================================================= */
function bar(lvl){
  return `<i style="background:${['#d1d9e0','#9be9a8','#40c463','#30a14e','#216e39'][lvl-1]||'#d1d9e0'}"></i>`;
}
function open(s){
  if(!s) return;
  selected=s; render();
  document.getElementById('side').classList.remove('open');
  document.getElementById('scrim').classList.remove('on');
  const [bc,bt]=statusBadge(s.st);
  crumbs.innerHTML=`Alumni <span style="color:var(--fg-subtle)">/</span> ${s.y} <span style="color:var(--fg-subtle)">/</span> <b>${s.n}</b>`;

  const placedLine = s.st==='seeking'
    ? `<div class="rs-value">Not currently placed</div>`
    : `<div class="rs-value">${s.co||'—'}${s.ptype?` <span class="rs-tag">${s.ptype}</span>`:''}</div>`;

  stage.innerHTML=`
  <div class="phead">
    <div style="min-width:0;flex:1">
      <h2 class="pname">${s.n}</h2>
      <p class="ptag">${BRANCH[s.b]} · Class of ${s.y} · <span class="badge ${bc}" style="margin-left:2px">${bt}</span></p>
    </div>
    <button class="editbtn" id="editProfileBtn" type="button">
      <svg width="13" height="13" viewBox="0 0 16 16"><path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758ZM12.487 2.5a.25.25 0 0 0-.354 0L10.811 3.72l1.469 1.469 1.323-1.323a.25.25 0 0 0 0-.354Zm-2.732 3.345L8.286 4.379 3.53 9.135l-.723 2.532 2.532-.723Z"/></svg>
      Edit
    </button>
  </div>

  <div class="recordsheet">
    <div class="rs-row">
      <div class="rs-cell">
        <span class="rs-label">Name</span>
        <div class="rs-value">${s.n}</div>
      </div>
      <div class="rs-cell">
        <span class="rs-label">Enrollment number</span>
        <div class="rs-value mono">${s.e}</div>
      </div>
    </div>

    <div class="rs-row">
      <div class="rs-cell">
        <span class="rs-label">Post at the job</span>
        <div class="rs-value">${s.role || '—'}</div>
      </div>
      <div class="rs-cell">
        <span class="rs-label">Placed at</span>
        ${placedLine}
      </div>
    </div>

    <div class="rs-row">
      <div class="rs-cell">
        <span class="rs-label">Skillset</span>
        <div class="rs-chipline">
          ${s.sk.length ? s.sk.map(k=>`<span class="skill">${bar(k[1])}${k[0]}</span>`).join('') : '<span class="rs-value" style="font-weight:400;color:var(--fg-muted)">—</span>'}
        </div>
        <div class="rs-sub">
          <span class="rs-label">GitHub ID</span>
          <div class="rs-value">${s.gh ? `<a href="https://github.com/${s.gh}" target="_blank" rel="noopener">github.com/${s.gh}</a>` : '—'}</div>
        </div>
      </div>
      <div class="rs-cell rs-contact">
        <span class="rs-label">Contact</span>
        <div><span class="k">Email</span><span>${s.em ? `<a href="mailto:${s.em}">${s.em}</a>` : '—'}</span></div>
        <div><span class="k">Address</span><span>${s.city || '—'}</span></div>
        <div><span class="k">LinkedIn</span><span>${s.li ? `<a href="https://linkedin.com/${s.li}" target="_blank" rel="noopener">${s.li}</a>` : '—'}</span></div>
      </div>
    </div>

    <div class="rs-row rs-row-full">
      <div class="rs-cell">
        <span class="rs-label">Portfolio website link</span>
        <div class="rs-value">${s.pf ? `<a href="${s.pf}" target="_blank" rel="noopener">${s.pf}</a>` : '— not provided'}</div>
      </div>
    </div>
  </div>

  <div class="grid grid-single">
    <div>
      <section class="card">
        <h3>Career track<span>${s.e}</span></h3>
        <div class="body">
          <div class="track">
            <ul>${s.track.map(t=>`<li><span class="dotmark"></span><span class="yr">${t[0]}</span><span>${t[1]}</span></li>`).join('')}</ul>
          </div>
        </div>
      </section>

      <section class="card">
        <h3>Projects at LNCT<span>${s.pj.length}</span></h3>
        <div class="body">
          ${s.pj.length ? s.pj.map(p=>`
            <article class="proj">
              <h4>${p.t}</h4>
              <p>${p.d}</p>
              <div class="stack">
                <span class="lang"><i style="background:${LANG[p.l]||'#8b949e'}"></i>${p.l}</span>
                <span>${p.x}</span>
              </div>
            </article>`).join('') : '<p class="fhint" style="margin:0">No projects on file.</p>'}
        </div>
      </section>
    </div>
  </div>`;
  document.getElementById('editProfileBtn').onclick=()=>openModal(s);
  scrollTo({top:0,behavior:'smooth'});
}

/* =========================================================
   Landing
   ========================================================= */
function landing(){
  if(!S.length){
    crumbs.innerHTML=`Alumni <span style="color:var(--fg-subtle)">/</span> <b>All records</b>`;
    stage.innerHTML=`<div class="landing"><h2>No records loaded yet</h2>
      <p class="lede">The <code>S</code> array at the top of the script is empty. Add one object
      per alumnus in the documented shape and this page fills itself in — search, filters and
      profiles all read from that same array.</p></div>`;
    return;
  }
  const placed=S.filter(s=>s.st==='placed');
  const top=Math.max(...placed.map(s=>parseFloat((s.ctc.match(/[\d.]+/)||[0])[0])||0));
  crumbs.innerHTML=`Alumni <span style="color:var(--fg-subtle)">/</span> <b>All records</b>`;
  stage.innerHTML=`
  <div class="landing">
    <h2>Look up any LNCT graduate</h2>
    <p class="lede">Search the directory by name, enrolment number or passing year to see where
      someone landed, what they built here, and how to reach them.</p>
    <div class="stats">
      <div class="stat"><b>${S.length}</b><span>records on file</span></div>
      <div class="stat"><b>${Math.round(placed.length/S.length*100)}%</b><span>placed at graduation</span></div>
      <div class="stat"><b>₹${top.toFixed(1)}L</b><span>highest package</span></div>
      <div class="stat"><b>${YEARS[0]}–${YEARS[YEARS.length-1]}</b><span>batches covered</span></div>
    </div>
    <div class="hint">
      <h3>How to search</h3>
      <ul>
        <li>Type a name — misspellings still work, close matches appear under <b>Similar names</b>.</li>
        <li>Enter an enrolment number like <code>0176CS201019</code>, or a full name.</li>
        <li>Try a skill, company or city — <code>Verilog</code>, <code>Amazon</code>, <code>Indore</code>.</li>
        <li>Press <code>/</code> to jump to the search box, then arrow keys and <code>Enter</code>.</li>
      </ul>
      <div class="recent">
        ${['Sneha Tiwari','Aarav Sharma','Ishita Verma','Kabir Khanna']
          .map(n=>`<button data-n="${n}">${n}</button>`).join('')}
      </div>
    </div>
  </div>`;
  stage.querySelectorAll('.recent button').forEach(b=>{
    b.onclick=()=>open(S.find(s=>s.n===b.dataset.n));
  });
}

/* =========================================================
   Add / edit student — backed by the Flask + CSV API (app.py)
   ========================================================= */
const API_BASE='/api/students';
const addBtn=document.getElementById('addBtn'), backdrop=document.getElementById('modalBackdrop'),
      addForm=document.getElementById('addForm'), formError=document.getElementById('formError'),
      modalTitleEl=document.getElementById('modalTitle'), saveBtn=document.getElementById('saveBtn'),
      exportBtn=document.getElementById('exportBtn');

let editingEnrolment=null; // null while adding; the original enrolment number while editing

function refreshYearChips(){
  YEARS.length=0;
  [...new Set(S.map(s=>s.y))].sort((a,b)=>a-b).forEach(y=>YEARS.push(y));
  yearsEl.innerHTML=YEARS.map(y=>`<button class="chip" data-y="${y}" aria-pressed="${y===yearFilter}">${y}</button>`).join('')
    +`<button class="chip" data-y="all" aria-pressed="${!yearFilter}">All years</button>`;
}

function prefillForm(s){
  document.getElementById('f-n').value=s.n||'';
  document.getElementById('f-e').value=s.e||'';
  document.getElementById('f-y').value=s.y||'';
  document.getElementById('f-b').value=s.b||'CS';
  document.getElementById('f-cg').value=s.cg||'';
  document.getElementById('f-city').value=s.city||'';
  document.getElementById('f-ph').value=s.ph||'';
  document.getElementById('f-em').value=s.em||'';
  document.getElementById('f-li').value=s.li||'';
  document.getElementById('f-gh').value=s.gh||'';
  document.getElementById('f-pf').value=s.pf||'';
  document.getElementById('f-st').value=s.st||'placed';
  document.getElementById('f-co').value=s.co||'';
  document.getElementById('f-role').value=s.role||'';
  document.getElementById('f-ctc').value=s.ctc||'';
  document.getElementById('f-ptype').value=s.ptype||'';
  document.getElementById('f-sk').value=(s.sk||[]).map(k=>k[0]+':'+k[1]).join(', ');
  const p=(s.pj&&s.pj[0])||{};
  document.getElementById('f-pjt').value=p.t||'';
  document.getElementById('f-pjl').value=p.l||'';
  document.getElementById('f-pjd').value=p.d||'';
  document.getElementById('f-pjx').value=p.x||'';
}

function openModal(record){
  formError.textContent='';
  if(record){
    editingEnrolment=record.e;
    prefillForm(record);
    modalTitleEl.textContent='Edit student';
    saveBtn.textContent='Save changes';
  } else {
    editingEnrolment=null;
    addForm.reset();
    modalTitleEl.textContent='Add a student';
    saveBtn.textContent='Add student';
  }
  backdrop.hidden=false;
  document.getElementById('f-n').focus();
}
function closeModal(){ backdrop.hidden=true; }

addBtn.onclick=()=>openModal(null);
document.getElementById('modalCancel').onclick=closeModal;
document.getElementById('modalClose').onclick=closeModal;
backdrop.addEventListener('mousedown', e=>{ if(e.target===backdrop) closeModal(); });
document.addEventListener('keydown', e=>{ if(e.key==='Escape' && !backdrop.hidden) closeModal(); });

function val(id){ return document.getElementById(id).value.trim(); }

function parseSkills(raw){
  if(!raw) return [];
  return raw.split(',').map(s=>s.trim()).filter(Boolean).map(s=>{
    const [name,lvl]=s.split(':').map(x=>x&&x.trim());
    const n=parseInt(lvl,10);
    return [name, (n>=1&&n<=5)?n:3];
  });
}

/* Rebuilt from the current status/company/role every save. Editing a record through
   this form always collapses the career track to this one auto line — to keep a
   richer multi-entry history, edit the "track" column in students.csv directly
   (semicolon-separated "year|note" pairs). */
function trackFor(st,y,co,role){
  const yr=String(y);
  if(st==='placed') return [[yr, `Placed at ${co||'—'}${role?' — '+role:''}`]];
  if(st==='higher') return [[yr, `Joined ${co||'a higher studies programme'}${role?' — '+role:''}`]];
  if(st==='founder') return [[yr, `Started ${co||'a venture'}${role?' — '+role:''}`]];
  return [[yr, 'Actively looking for opportunities']];
}

addForm.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const n=val('f-n'), en=val('f-e'), y=val('f-y'), b=val('f-b'), st=val('f-st');
  if(!n || !en || !y || !b || !st){
    formError.textContent='Please fill in name, enrolment number, passing year, branch and status.';
    return;
  }
  const co=val('f-co'), role=val('f-role');
  const pjt=val('f-pjt');
  const student = {
    n, e:en, y:+y, b, cg:parseFloat(val('f-cg'))||0, city:val('f-city'),
    ph:val('f-ph'), em:val('f-em'), li:val('f-li'), gh:val('f-gh'), pf:val('f-pf'),
    st, co, role, ctc:val('f-ctc'), ptype:val('f-ptype'),
    track: trackFor(st,y,co,role),
    sk: parseSkills(val('f-sk')),
    pj: pjt ? [{t:pjt, d:val('f-pjd'), l:val('f-pjl')||'Other', x:val('f-pjx')}] : []
  };

  saveBtn.disabled=true;
  try{
    const res = editingEnrolment
      ? await fetch(`${API_BASE}/${encodeURIComponent(editingEnrolment)}`, {
          method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(student)
        })
      : await fetch(API_BASE, {
          method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(student)
        });
    if(!res.ok){
      const err = await res.json().catch(()=>({}));
      formError.textContent = err.error || 'Something went wrong saving this record.';
      saveBtn.disabled=false;
      return;
    }
  } catch(err){
    formError.textContent='Could not reach the server — make sure app.py is running (python app.py).';
    saveBtn.disabled=false;
    return;
  }
  saveBtn.disabled=false;

  if(editingEnrolment){
    const idx=S.findIndex(s=>s.e===editingEnrolment);
    if(idx>=0) S[idx]=student; else S.push(student);
  } else {
    S.push(student);
  }
  refreshYearChips();
  closeModal();
  render();
  open(student);
});

exportBtn.onclick=()=>{ window.location.href=`${API_BASE}/export`; };

/* drawer for small screens */
const side=document.getElementById('side'), scrim=document.getElementById('scrim');
document.getElementById('drawer-btn').onclick=()=>{side.classList.add('open');scrim.classList.add('on');qEl.focus()};
scrim.onclick=()=>{side.classList.remove('open');scrim.classList.remove('on')};

/* bootstrap: load every record from the Flask/CSV backend before first render */
async function loadStudents(){
  try{
    const res=await fetch(API_BASE);
    if(res.ok){
      const data=await res.json();
      S.length=0;
      data.forEach(s=>S.push(s));
      refreshYearChips();
    }
  } catch(err){
    console.warn('Could not reach the Flask backend — start it with: python app.py', err);
  }
  render();
  landing();
}
loadStudents();
