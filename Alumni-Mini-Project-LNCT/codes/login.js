const insider = document.getElementById('visitor-insider');
const outsider = document.getElementById('visitor-outsider');
const insiderPanel = document.getElementById('insiderPanel');
const outsiderPanel = document.getElementById('outsiderPanel');
const email = document.getElementById('email');
const emailHint = document.getElementById('emailHint');
const intent = document.getElementById('intent');
const intentHint = document.getElementById('intentHint');
const intentList = document.getElementById('intentList');
const comboToggle = document.getElementById('comboToggle');

function goIn(){ window.location.href = 'index.html'; }
function warn(hintEl, msg){ hintEl.textContent = msg; hintEl.classList.add('warn'); }
function clearWarn(hintEl, msg){ hintEl.textContent = msg; hintEl.classList.remove('warn'); }

/* ---------- insider: email gate ---------- */
insider.addEventListener('change', () => {
  if(insider.checked){
    outsiderPanel.hidden = true;
    insiderPanel.hidden = false;
    email.focus();
  }
});

email.addEventListener('keydown', (e) => {
  if(e.key !== 'Enter') return;
  e.preventDefault();
  const v = email.value.trim();
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  if(!ok){ warn(emailHint, v ? 'Enter a valid email address' : 'Enter your email to continue'); return; }
  try{
    sessionStorage.setItem('lnct-visitor','insider');
    sessionStorage.setItem('lnct-email', v);
    sessionStorage.removeItem('lnct-outsider-intent');
  }catch(e){}
  goIn();
});
email.addEventListener('input', () => clearWarn(emailHint, 'Press Enter to continue'));

/* ---------- outsider: autocomplete combobox ---------- */
const INTENTS = [
  "Contact information of an individual",
  "Current job title of an individual",
  "Current residence / location of an individual",
  "Placement details and salary package",
  "Skillset of an individual",
  "Projects completed during their studies",
  "Academic record and CGPA",
  "Verifying a degree or enrolment number",
  "Career track since graduating"
];
let filtered = INTENTS.slice();
let activeIdx = -1;

function renderList(){
  intentList.innerHTML = filtered.map((opt,i)=>
    `<li role="option" id="opt-${i}" data-i="${i}" class="${i===activeIdx?'active':''}">${opt}</li>`
  ).join('');
}
function openList(){
  filtered = INTENTS.filter(o => o.toLowerCase().includes(intent.value.trim().toLowerCase()));
  activeIdx = -1;
  renderList();
  intentList.hidden = false;
  intent.setAttribute('aria-expanded','true');
}
function closeList(){
  intentList.hidden = true;
  intent.setAttribute('aria-expanded','false');
  activeIdx = -1;
}
function choose(text){
  intent.value = text;
  closeList();
  submitIntent(text);
}
function submitIntent(text){
  if(!text.trim()){ warn(intentHint, 'Type or pick what you need, then press Enter'); return; }
  try{
    sessionStorage.setItem('lnct-visitor','outsider');
    sessionStorage.setItem('lnct-outsider-intent', text.trim());
  }catch(e){}
  goIn();
}

outsider.addEventListener('change', () => {
  if(outsider.checked){
    insiderPanel.hidden = true;
    outsiderPanel.hidden = false;
    intent.focus();
    openList();
  }
});

intent.addEventListener('focus', openList);
intent.addEventListener('input', () => { clearWarn(intentHint, "Pick an option, or type your own and press Enter"); openList(); });

intent.addEventListener('keydown', (e) => {
  if(e.key === 'ArrowDown'){
    e.preventDefault();
    if(intentList.hidden) return openList();
    activeIdx = Math.min(activeIdx+1, filtered.length-1);
    renderList();
    document.getElementById('opt-'+activeIdx)?.scrollIntoView({block:'nearest'});
  } else if(e.key === 'ArrowUp'){
    e.preventDefault();
    activeIdx = Math.max(activeIdx-1, 0);
    renderList();
    document.getElementById('opt-'+activeIdx)?.scrollIntoView({block:'nearest'});
  } else if(e.key === 'Enter'){
    e.preventDefault();
    if(!intentList.hidden && activeIdx >= 0 && filtered[activeIdx]){
      choose(filtered[activeIdx]);
    } else {
      closeList();
      submitIntent(intent.value);
    }
  } else if(e.key === 'Escape'){
    closeList();
  }
});

intentList.addEventListener('mousedown', (e) => {
  const li = e.target.closest('li'); if(!li) return;
  e.preventDefault();
  choose(filtered[+li.dataset.i]);
});

comboToggle.addEventListener('mousedown', (e) => {
  e.preventDefault();
  if(intentList.hidden){ intent.focus(); openList(); } else { closeList(); }
});

document.addEventListener('click', (e) => {
  if(!e.target.closest('.combobox')) closeList();
});

document.getElementById('gateForm').addEventListener('submit', e => e.preventDefault());
