
const THEMES = [
  { id: 'theme-01', name: '01 Arctic Glass' },
  { id: 'theme-02', name: '02 Aurora Violet' },
  { id: 'theme-03', name: '03 Midnight Black' },
  { id: 'theme-04', name: '04 Ocean Teal' },
  { id: 'theme-05', name: '05 Emerald Matrix' },
  { id: 'theme-06', name: '06 Rose Sunset' },
  { id: 'theme-07', name: '07 Royal Gold' },
  { id: 'theme-08', name: '08 Crimson Night' },
  { id: 'theme-09', name: '09 iOS Light' },
  { id: 'theme-10', name: '10 Soft Neumorph' },
  { id: 'theme-11', name: '11 Anime Energy' },
  { id: 'theme-12', name: '12 Comic Pop' },
  { id: 'theme-13', name: '13 Cyberpunk Neon' },
  { id: 'theme-14', name: '14 Cosmic Nebula' }
];

function applyTheme(themeId) {
  const body = document.body;
  body.classList.remove(...THEMES.map(t => t.id));
  body.classList.add(themeId);
  const select = document.getElementById('theme-select');
  if (select) select.value = themeId;
}

async function saveTheme(themeId) {
  applyTheme(themeId);
  await chrome.storage.local.set({ sfPopupTheme: themeId });
}

async function initThemes() {
  const select = document.getElementById('theme-select');
  if (!select) return;

  select.innerHTML = THEMES.map(t => `<option value="${t.id}">${t.name}</option>`).join('');

  const result = await chrome.storage.local.get('sfPopupTheme');
  const saved = result.sfPopupTheme || 'theme-03';
  applyTheme(saved);

  select.addEventListener('change', async (e) => {
    await saveTheme(e.target.value);
  });

  document.getElementById('btn-theme-next')?.addEventListener('click', async () => {
    const current = select.value || saved;
    const index = THEMES.findIndex(t => t.id === current);
    const next = THEMES[(index + 1) % THEMES.length].id;
    await saveTheme(next);
  });
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) return null;
  try {
    if (new URL(tab.url).hostname !== "flexstudent.nu.edu.pk") {
      alert("Please open the FlexStudent website first.");
      return null;
    }
  } catch { return null; }
  return tab;
}
function exec(tab, fn, args = []) {
  chrome.scripting.executeScript({ target: { tabId: tab.id }, function: fn, args });
}

document.getElementById("btn-fix-marks").addEventListener("click", async () => {
  const tab = await getActiveTab(); if (!tab) return;
  exec(tab, marksMainFunction);
});
document.getElementById("btn-edit-marks").addEventListener("click", async () => {
  const tab = await getActiveTab(); if (!tab) return;
  exec(tab, editMarksMainFunction);
});
document.getElementById("btn-gpa").addEventListener("click", async () => {
  const tab = await getActiveTab(); if (!tab) return;
  exec(tab, calculatorMainFunction);
});
document.getElementById("btn-dark").addEventListener("click", async () => {
  const tab = await getActiveTab(); if (!tab) return;
  const result = await chrome.storage.local.get("darkMode");
  const newState = !result.darkMode;
  await chrome.storage.local.set({ darkMode: newState });
  exec(tab, DarkModeMainFunction, [newState]);
});
document.getElementById("btn-fee").addEventListener("click", async () => {
  const tab = await getActiveTab(); if (!tab) return;
  exec(tab, feeCalculatorMainFunction);
});
document.getElementById("btn-feedback").addEventListener("click", async () => {
  const tab = await getActiveTab(); if (!tab) return;
  const input = document.querySelector('input[name="fb"]:checked');
  if (!input) { alert("Please select a feedback option first."); return; }
  exec(tab, feedbackMainFunction, [input.value]);
});

initThemes();

function editMarksMainFunction() {
  if (!window.location.href.includes("Student/StudentMarks")) {
    alert("Please open the Marks Page first.");
    return;
  }

  
  if (document.getElementById("sf-edit-style")) {
    document.getElementById("sf-edit-style").remove();
    document.querySelectorAll(".sf-editable").forEach(el => {
      el.contentEditable = "false";
      el.classList.remove("sf-editable");
    });
    
    document.querySelectorAll(".sf-add-row-btn").forEach(b => b.remove());
    return;
  }

  
  const style = document.createElement("style");
  style.id = "sf-edit-style";
  style.textContent = `
    .sf-editable {
      background: rgba(0,212,170,0.08) !important;
      cursor: text !important;
      border-radius: 3px;
    }
    .sf-editable:focus {
      outline: 2px solid #00d4aa !important;
      background: rgba(0,212,170,0.14) !important;
      box-shadow: 0 0 6px rgba(0,212,170,0.3);
    }
    .sf-add-row-btn {
      display: inline-block;
      margin-left: 10px;
      padding: 2px 10px;
      font-size: 11px;
      font-weight: 600;
      color: #00d4aa;
      background: rgba(0,212,170,0.10);
      border: 1px solid rgba(0,212,170,0.35);
      border-radius: 20px;
      cursor: pointer;
      vertical-align: middle;
      transition: all 0.12s;
      font-family: 'Inter', 'Segoe UI', sans-serif;
      line-height: 1.6;
    }
    .sf-add-row-btn:hover {
      background: rgba(0,212,170,0.22);
      border-color: #00d4aa;
      color: #fff;
    }
  `;
  document.head.appendChild(style);

  
  const num = t => { const v = parseFloat(t); return isNaN(v) ? 0 : v; };

  
  function recalcAll() {
    for (const course of document.querySelectorAll("div[class*='tab-pane']")) {
      const btn = course.querySelector("button[onclick*='ftn_calculateMarks']");
      if (!btn) continue;
      const id = parseInt(btn.getAttribute("onclick").substring(20, 24));
      const courseId = course.id;
      const sections = course.querySelectorAll(`div[id^="${courseId}"]:not([id$="Grand_Total_Marks"])`);

      let gW = 0, gO = 0, gA = 0, gMn = 0, gMx = 0;

      for (const section of sections) {
        const rows = section.querySelectorAll(".calculationrow");
        if (!rows.length) continue;
        let sW = 0, sO = 0, sA = 0, sMn = 0, sMx = 0;

        for (const row of rows) {
          const wC  = row.querySelector(".weightage");
          const oC  = row.querySelector(".ObtMarks");
          const tC  = row.querySelector(".GrandTotal");
          const aC  = row.querySelector(".AverageMarks");
          const mnC = row.querySelector(".MinMarks");
          const mxC = row.querySelector(".MaxMarks");
          if (!wC || !oC) continue;
          const w  = num(wC.textContent);
          const tot = num(tC?.textContent) || 1;
          sW  += w;
          sO  += num(oC.textContent)  * (w / tot);
          sA  += num(aC?.textContent)  * (w / tot);
          sMn += num(mnC?.textContent) * (w / tot);
          sMx += num(mxC?.textContent) * (w / tot);
        }

        
        const totalRow = section.querySelector(`.totalColumn_${id}`);
        if (totalRow) {
          const wEl = totalRow.querySelector(".totalColweightage");
          if (wEl) wEl.textContent = sW.toFixed(2);
          const oEl = totalRow.querySelector(".totalColObtMarks");
          if (oEl) oEl.textContent = sO.toFixed(2);
        }

        gW += sW; gO += sO; gA += sA; gMn += sMn; gMx += sMx;
      }

      
      const byId = sfx => document.getElementById(`Grandtotal${sfx}_${id}`);
      const colM = byId("ColMarks"); if (colM) colM.textContent = gW.toFixed(2);
      const obtM = byId("ObtMarks"); if (obtM) obtM.textContent = gO.toFixed(2);
      const avgM = byId("ClassAvg"); if (avgM) avgM.textContent = gA.toFixed(2);
      const mnM  = byId("ClassMin"); if (mnM)  mnM.textContent  = gMn.toFixed(2);
      const mxM  = byId("ClassMax"); if (mxM)  mxM.textContent  = gMx.toFixed(2);
    }
  }

  
  function makeCellEditable(td) {
    if (td.contentEditable === "true") return;
    td.contentEditable = "true";
    td.classList.add("sf-editable");
    td.focus();
    const onInput = () => recalcAll();
    const onKey   = e => { if (e.key === "Enter") { e.preventDefault(); td.blur(); } };
    td.addEventListener("input", onInput);
    td.addEventListener("keydown", onKey);
    td.addEventListener("blur", () => {
      td.contentEditable = "false";
      td.classList.remove("sf-editable");
      td.removeEventListener("input", onInput);
      td.removeEventListener("keydown", onKey);
      recalcAll();
    }, { once: true });
  }

  
  document.querySelectorAll("table td").forEach(td => {
    td.addEventListener("dblclick", () => makeCellEditable(td));
  });

  
  
  
  
  function getColsFromTable(table) {
    const headerRow = table.querySelector("thead tr") || table.querySelector("tr");
    return headerRow ? headerRow.querySelectorAll("th, td").length : 8;
  }

  function addRowToSection(sectionContainer) {
    
    const table = sectionContainer.querySelector("table");
    if (!table) {
      
      const toggle = sectionContainer.querySelector("[data-toggle='collapse'], [data-bs-toggle='collapse'], a[href]");
      if (toggle) toggle.click();
      
      setTimeout(() => addRowToSection(sectionContainer), 300);
      return;
    }
    const tbody = table.querySelector("tbody");
    if (!tbody) return;

    const cols = getColsFromTable(table);
    const tr = document.createElement("tr");
    tr.classList.add("calculationrow", "sf-added-row");

    
    const classMap = ["", "weightage", "ObtMarks", "GrandTotal", "AverageMarks", "", "MinMarks", "MaxMarks"];
    for (let i = 0; i < cols; i++) {
      const td = document.createElement("td");
      td.className = "text-center";
      if (classMap[i]) td.classList.add(classMap[i]);
      td.textContent = i === 0 ? "—" : "0";
      td.contentEditable = "true";
      td.classList.add("sf-editable");
      td.style.color = "#38bdf8";
      td.addEventListener("input", () => recalcAll());
      td.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); td.blur(); } });
      td.addEventListener("dblclick", () => makeCellEditable(td));
      tr.appendChild(td);
    }

    
    const totalRow = tbody.querySelector("tr:last-child");
    if (totalRow && (totalRow.textContent.trim().startsWith("Total") || totalRow.querySelector(".totalCol"))) {
      tbody.insertBefore(tr, totalRow);
    } else {
      tbody.appendChild(tr);
    }
    recalcAll();
    
    tr.querySelectorAll("td")[1]?.focus();
  }

  
  
  
  function injectAddRowButtons() {
    
    
    
    

    for (const pane of document.querySelectorAll("div[class*='tab-pane']")) {
      for (const card of pane.querySelectorAll(".card")) {
        const header = card.querySelector(".card-header");
        const btn    = header?.querySelector("button.btn-link");
        if (!btn) continue;

        const sectionName = btn.textContent.trim();
        if (!sectionName) continue;
        if (sectionName.toLowerCase().includes("grand total")) continue;
        if (header.querySelector(".sf-add-row-btn")) continue;

        const collapseDiv = card.querySelector(".collapse");
        if (!collapseDiv?.querySelector("table")) continue;

        const addBtn = document.createElement("button");
        addBtn.className = "sf-add-row-btn";
        addBtn.textContent = "+ Row";
        addBtn.addEventListener("click", e => {
          e.stopPropagation();
          e.preventDefault();
          if (!collapseDiv.classList.contains("show")) {
            btn.click();
            setTimeout(() => addRowToSection(card), 350);
          } else {
            addRowToSection(card);
          }
        });

        btn.parentElement.appendChild(addBtn);
      }
    }
  }

  injectAddRowButtons();
}

async function marksMainFunction() {
  if (!window.location.href.includes("Student/StudentMarks")) { alert("Please Open Marks Page First"); return; }

  const getTd = (cls, id) => { const td = document.createElement('td'); td.classList.add("text-center", cls); td.id = id; return td; };
  const getTr = (id) => {
    const tr = document.createElement('tr');
    tr.classList.add("totalColumn_" + id);
    tr.appendChild(getTd("totalColGrandTotal", `GrandtotalColMarks_${id}`));
    tr.appendChild(getTd("totalColObtMarks",   `GrandtotalObtMarks_${id}`));
    tr.appendChild(getTd("totalColAverageMark",`GrandtotalClassAvg_${id}`));
    tr.appendChild(getTd("totalColMinMarks",   `GrandtotalClassMin_${id}`));
    tr.appendChild(getTd("totalColMaxMarks",   `GrandtotalClassMax_${id}`));
    tr.appendChild(getTd("totalColStdDev",     `GrandtotalClassStdDev_${id}`));
    return tr;
  };
  const pf = v => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };
  const checkBestOff = (section, w) => {
    let acc = 0, count = 0;
    for (const row of section.querySelectorAll('.calculationrow')) {
      acc += pf(row.querySelector('.weightage').textContent);
      if (w < acc) return count;
      count++;
    }
    return count;
  };
  const reorder = (section, bestOff) =>
    [...section.querySelectorAll('.calculationrow')]
      .sort((a, b) => pf(b.querySelector('.ObtMarks').textContent) - pf(a.querySelector('.ObtMarks').textContent))
      .slice(0, bestOff);

  async function set_marks(courseId, id) {
    const course = document.getElementById(courseId);
    const sections = course.querySelectorAll(`div[id^="${courseId}"]:not([id$="Grand_Total_Marks"])`);
    let gW=0, gO=0, gA=0, gMn=0, gMx=0;
    for (const section of sections) {
      const totalRow = section.querySelector(`.totalColumn_${id}`);
      const lW = pf(totalRow.querySelector('.totalColweightage').textContent);
      const lO = pf(totalRow.querySelector('.totalColObtMarks').textContent);
      gW += lW; gO += lO;
      for (const row of reorder(section, checkBestOff(section, lW))) {
        const w  = pf(row.querySelector('.weightage').textContent);
        const tot= pf(row.querySelector('.GrandTotal').textContent) || 1;
        gA  += pf(row.querySelector('.AverageMarks').textContent) * (w/tot);
        gMn += pf(row.querySelector('.MinMarks').textContent)     * (w/tot);
        gMx += pf(row.querySelector('.MaxMarks').textContent)     * (w/tot);
      }
    }
    document.getElementById(`GrandtotalColMarks_${id}`).textContent = gW.toFixed(2);
    document.getElementById(`GrandtotalObtMarks_${id}`).textContent = gO.toFixed(2);
    document.getElementById(`GrandtotalClassAvg_${id}`).textContent = gA.toFixed(2);
    document.getElementById(`GrandtotalClassMin_${id}`).textContent = gMn.toFixed(2);
    document.getElementById(`GrandtotalClassMax_${id}`).textContent = gMx.toFixed(2);
  }

  for (const course of document.querySelectorAll("div[class*='tab-pane']")) {
    const btn = course.querySelector("button[onclick*='ftn_calculateMarks']");
    if (!btn) continue;
    const id = parseInt(btn.getAttribute('onclick').substring(20, 24));
    const gtDiv = course.querySelector(`div[id=${course.id}-Grand_Total_Marks]`);
    gtDiv.querySelector('tbody').innerHTML = '';
    gtDiv.querySelector('tbody').appendChild(getTr(id));
    set_marks(course.id, id);
  }
}

async function feedbackMainFunction(input) {
  if (!window.location.href.includes("Student/FeedBackQuestions")) { alert("Please Open Feedback Page of a Specific Course First"); return; }
  const selectOne = (el, val) => {
    for (const span of el.getElementsByClassName('m-list-timeline__time')) {
      if (span.textContent.trim() === val) { span.querySelector('input[type="radio"]').checked = true; break; }
    }
  };
  const questions = document.getElementsByClassName('m-list-timeline__item');
  if (input === "Randomize") {
    for (const q of questions) {
      const spans = q.getElementsByClassName('m-list-timeline__time');
      spans[Math.floor(Math.random() * spans.length)].querySelector('input[type="radio"]').checked = true;
    }
  } else {
    for (const q of questions) selectOne(q, input);
  }
}

async function calculatorMainFunction() {
  if (!window.location.href.includes("Student/Transcript")) { alert("Please Open Transcript Page first"); return; }
  const gradeMap = {'A+':4,'A':4,'A-':3.67,'B+':3.33,'B':3,'B-':2.67,'C+':2.33,'C':2,'C-':1.67,'D+':1.33,'D':1,'F':0,'S':-2,'U':-3};
  const getSelect = (g) => `<select>
    <option value="-1">-</option>
    <option value="4" ${g=='A+'||g=='A'?'selected':''}>A/A+</option>
    <option value="3.67" ${g=='A-'?'selected':''}>A-</option>
    <option value="3.33" ${g=='B+'?'selected':''}>B+</option>
    <option value="3" ${g=='B'?'selected':''}>B</option>
    <option value="2.67" ${g=='B-'?'selected':''}>B-</option>
    <option value="2.33" ${g=='C+'?'selected':''}>C+</option>
    <option value="2" ${g=='C'?'selected':''}>C</option>
    <option value="1.67" ${g=='C-'?'selected':''}>C-</option>
    <option value="1.33" ${g=='D+'?'selected':''}>D+</option>
    <option value="1" ${g=='D'?'selected':''}>D</option>
    <option value="0" ${g=='F'?'selected':''}>F</option>
    <option value="-2" ${g=='S'?'selected':''}>S</option>
    <option value="-3" ${g=='U'?'selected':''}>U</option>
  </select>`;

  const semesters = document.getElementsByClassName("col-md-6");
  const lastSem = semesters[semesters.length - 1];
  const spans = lastSem.querySelectorAll("span");
  const cgpaElem = spans[2], sgpaElem = spans[3];
  let prevCGPA = 0;
  if (semesters.length > 1) prevCGPA = parseFloat(semesters[semesters.length-2].querySelectorAll("span")[2].innerText.split(':')[1]);

  for (const row of lastSem.querySelectorAll('tbody > tr')) {
    const cell = row.querySelectorAll('td.text-center')[1];
    cell.innerHTML = getSelect(cell.innerText.trim());
  }

  const getCH = sel => parseInt(sel.parentElement.previousElementSibling.innerText);

  const handleChange = () => {
    const selects = [...document.getElementsByTagName("select")];
    const allCourses = [];
    for (const sem of semesters) {
      for (const row of sem.querySelectorAll("tbody > tr")) {
        const name = row.querySelector("td:nth-child(2)")?.innerText.trim();
        const ch   = parseInt(row.querySelector("td:nth-child(4)")?.innerText);
        const cell = row.querySelector("td:nth-child(5)");
        if (!name || !cell) continue;
        const sel = cell.querySelector("select");
        const gv  = sel ? parseFloat(sel.value) : (gradeMap[cell.innerText.trim()] ?? -1);
        if (gv > -1) allCourses.push({ name, ch, gv });
      }
    }
    const latest = {};
    for (const c of allCourses) latest[c.name] = c;
    let totCH = 0, totGP = 0;
    for (const c of Object.values(latest)) { totCH += c.ch; totGP += c.ch * c.gv; }

    let sCH = 0, sGP = 0;
    for (const sel of selects) {
      const v = parseFloat(sel.value);
      const next = sel.parentElement.nextElementSibling;
      if (v > -1) { next.innerText = v; next.style.fontWeight='bold'; sCH += getCH(sel); sGP += getCH(sel)*v; }
      else { next.innerText = v==-2?'S':v==-3?'U':'-'; next.style.fontWeight='normal'; }
    }
    if (!totCH) { cgpaElem.innerHTML=`CGPA: ${prevCGPA.toFixed(2)}`; sgpaElem.innerHTML=`SGPA: 0`; return; }
    cgpaElem.innerHTML = `CGPA: ${(totGP/totCH).toFixed(2)}`; cgpaElem.style.fontWeight='bold';
    sgpaElem.innerHTML = `SGPA: ${sCH>0?(sGP/sCH).toFixed(2):'0'}`; sgpaElem.style.fontWeight='bold';
  };
  for (const sel of document.getElementsByTagName('select')) sel.addEventListener('change', handleChange);
  handleChange();
}

async function DarkModeMainFunction(enable) {
  const ID = "jugadu-top-left-overlay";
  if (!document.getElementById("jugadu-dark-style")) {
    const s = document.createElement("style"); s.id="jugadu-dark-style";
    s.textContent=`body.jugadu-dark-mode,body.jugadu-dark-mode div,body.jugadu-dark-mode section,body.jugadu-dark-mode header,body.jugadu-dark-mode main,body.jugadu-dark-mode footer,body.jugadu-dark-mode table,body.jugadu-dark-mode tbody,body.jugadu-dark-mode tr,body.jugadu-dark-mode td,body.jugadu-dark-mode th,body.jugadu-dark-mode input,body.jugadu-dark-mode select,body.jugadu-dark-mode textarea,body.jugadu-dark-mode .card,body.jugadu-dark-mode .panel,body.jugadu-dark-mode .panel-body{background-color:#121212!important;color:#e0e0e0!important;border-color:#333!important}body.jugadu-dark-mode a{color:#bb86fc!important}body.jugadu-dark-mode .btn{background-color:#333!important;color:#fff!important}`;
    document.head.appendChild(s);
  }
  const addOverlay = () => { if (!document.getElementById(ID)) { const d=document.createElement('div'); d.id=ID; Object.assign(d.style,{position:'fixed',top:'0',left:'0',width:'300px',height:'80px',backgroundColor:'#000',zIndex:'9999',pointerEvents:'none'}); document.body.appendChild(d); }};
  if (enable===true)  { document.body.classList.add("jugadu-dark-mode"); addOverlay(); }
  else if (enable===false) { document.body.classList.remove("jugadu-dark-mode"); document.getElementById(ID)?.remove(); }
  else { const d=document.body.classList.toggle("jugadu-dark-mode"); if(d) addOverlay(); else document.getElementById(ID)?.remove(); }
}

async function feeCalculatorMainFunction() {
  if (!window.location.href.includes("flexstudent.nu.edu.pk/Student/TentativeStudyPlan")) { alert("Please Open Tentative Study Plan Page first"); return; }
  const FEE = 11000;
  const headings = [...document.querySelectorAll("h4,h5,h3,div,span")].filter(el=>el.innerText?.trim().startsWith("Semester No."));
  if (!headings.length) { alert("Could not detect semester headings."); return; }
  headings.forEach(h => {
    if (h.dataset.feeInjected) return;
    let table = h.nextElementSibling;
    while (table && table.tagName !== "TABLE") table = table.nextElementSibling;
    if (!table) return;
    let credits = 0;
    table.querySelectorAll("tbody tr").forEach(row => {
      const cells = row.querySelectorAll("td"); if (cells.length < 4) return;
      const c = Number(cells[2].innerText.trim());
      if (cells[3].innerText.trim().toLowerCase() !== "non credit" && !isNaN(c)) credits += c;
    });
    const span = document.createElement("span");
    span.innerText = ` — Fee: Rs. ${(credits*FEE).toLocaleString()}`;
    Object.assign(span.style, {marginLeft:"10px",fontWeight:"600",color:"#0ccccc"});
    h.appendChild(span); h.dataset.feeInjected="true";
  });
}

async function admitCardMainFunction(val) {
  if (!["Sessional-I","Sessional-II","Final"].includes(val)) return;
  const blob = await (await fetch(`https://flexstudent.nu.edu.pk/Student/AdmitCardByRollNo?cardtype=${val}&type=pdf`,{method:'POST'})).blob();
  const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`Admit_Card_${val}.pdf`; a.click(); URL.revokeObjectURL(a.href);
}
