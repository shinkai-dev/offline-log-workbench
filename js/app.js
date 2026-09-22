(() => {
  "use strict";

  const state = {
    rows: [], filtered: [], fileName: "",
    timestamp: { type: null, description: "Not detected", parser: null },
    slowThreshold: 1000,
    theme: localStorage.getItem("olw.theme") || "light",
    language: localStorage.getItem("olw.language") || "ja"
  };

  const $ = id => document.getElementById(id);
  const els = {
    fileInput:$("fileInput"), clearBtn:$("clearBtn"), settingsBtn:$("settingsBtn"),
    dropZone:$("dropZone"), loadingOverlay:$("loadingOverlay"), loadingText:$("loadingText"), emptyState:$("emptyState"), viewer:$("viewer"),
    fileName:$("fileName"), logBody:$("logBody"), resultCount:$("resultCount"),
    slowThreshold:$("slowThreshold"),
    filterError:$("filterError"), filterWarning:$("filterWarning"), filterSlow:$("filterSlow"),
    filterText:$("filterText"), minDuration:$("minDuration"), headerSortSelect:$("headerSortSelect"),
    timestampFormatSelect:$("timestampFormatSelect"), copyBtn:$("copyBtn"),
    resetViewBtn:$("resetViewBtn"), sortLabel:$("sortLabel"), statusText:$("statusText"),
    settingsModal:$("settingsModal"), settingsCloseBtn:$("settingsCloseBtn"), settingsDoneBtn:$("settingsDoneBtn"),
    languageSelect:$("languageSelect"), languageLabel:$("languageLabel"), themeLabel:$("themeLabel"),
    settingsTitle:$("settingsTitle"), settingsSubtitle:$("settingsSubtitle") ,
    statLines:$("statLines"), statErrors:$("statErrors"), statWarnings:$("statWarnings"),
    statSlow:$("statSlow"), statAvg:$("statAvg"), statMedian:$("statMedian"),
    statMax:$("statMax"), statP95:$("statP95"), lineHeader:$("lineHeader"), timestampHeader:$("timestampHeader"), elapsedHeader:$("elapsedHeader"), levelHeader:$("levelHeader"), messageHeader:$("messageHeader")
  };

  document.documentElement.dataset.theme = state.theme;

  const I18N = {
    en: {
      settings:"Settings", settingsSubtitle:"Language and appearance", close:"Close", done:"Done",
      language:"Language", theme:"Theme", light:"Light", dark:"Dark", contrast:"High Contrast",
      overview:"Overview", filter:"Filter", performance:"Performance", sort:"Sort", line:"Line", timestamp:"Timestamp", elapsed:"Elapsed", levelHeader:"Level", messageHeader:"Message", loading:"Loading…",
      selection:"Selection", errors:"Errors", warnings:"Warnings", slow:"Slow operations", text:"Message",
      minDuration:"Minimum elapsed time", slowThreshold:"Slow threshold", keyword:"Keyword", original:"Original line order",
      durationDesc:"Duration ↓", durationAsc:"Duration ↑", timestampAsc:"Timestamp ↑",
      timestampDesc:"Timestamp ↓", level:"Log level", avg:"Average interval", median:"Median interval",
      maximum:"Maximum interval", p95:"95th percentile delay", openLog:"Open Log", clear:"Clear",
      resetView:"Reset view", ready:"Ready", offline:"Offline / Local only",
      emptyTitle:"Open a text or log file", emptyText:"Drag & drop a file anywhere in the window, or use Open Log.",
      emptyNote:"The file is analyzed entirely in this browser. Nothing is uploaded.",
      drop:"Drop a log file here", lines:"Lines", displayFormat:"Display format", originalTimestamp:"Original",
      noTimestamp:"No reliable timestamp format detected.",
      openToDetect:"Open a log to detect its timestamp format.", selectRow:"Select a log row to inspect it."
    },
    ja: {
      settings:"設定", settingsSubtitle:"言語と表示設定", close:"閉じる", done:"完了",
      language:"言語", theme:"テーマ", light:"ライト", dark:"ダーク", contrast:"ハイコントラスト",
      overview:"概要", filter:"フィルター", performance:"パフォーマンス", sort:"ソート", line:"行", timestamp:"タイムスタンプ", elapsed:"経過時間", levelHeader:"レベル", messageHeader:"メッセージ", loading:"読み込み中…",
      selection:"選択行", errors:"エラー", warnings:"警告", slow:"遅い処理", text:"メッセージ",
      minDuration:"最小経過時間", slowThreshold:"遅延判定しきい値", keyword:"キーワード", original:"元の行順",
      durationDesc:"経過時間 ↓", durationAsc:"経過時間 ↑", timestampAsc:"タイムスタンプ ↑",
      timestampDesc:"タイムスタンプ ↓", level:"ログレベル", avg:"平均経過時間", median:"中央値",
      maximum:"最大経過時間", p95:"遅延の上位5%基準", openLog:"ログを開く", clear:"クリア",
      resetView:"表示をリセット", ready:"準備完了", offline:"オフライン / ローカルのみ",
      emptyTitle:"テキストまたはログファイルを開いてください", emptyText:"ファイルを画面へドラッグ＆ドロップするか、「ログを開く」を使用してください。",
      emptyNote:"ファイルはこのブラウザ内だけで解析されます。アップロードされません。",
      drop:"ログファイルをここにドロップ", lines:"行", displayFormat:"表示形式", originalTimestamp:"元の形式",
      noTimestamp:"信頼できるタイムスタンプ形式を検出できませんでした。",
      openToDetect:"ログを開くとタイムスタンプ形式を自動判定します。", selectRow:"ログ行を選択すると詳細を表示します。"
    }
  };

  function t(key) { return I18N[state.language][key] || I18N.en[key] || key; }

  function applyLanguage() {
    document.documentElement.lang = state.language;
    els.settingsTitle.textContent = t("settings");
    els.settingsSubtitle.textContent = t("settingsSubtitle");
    els.settingsCloseBtn.setAttribute("aria-label", t("close"));
    els.settingsDoneBtn.textContent = t("done");
    els.languageLabel.textContent = t("language");
    els.themeLabel.textContent = t("theme");
    document.querySelector('[data-theme-name="light"]').textContent = t("light");
    document.querySelector('[data-theme-name="dark"]').textContent = t("dark");
    document.querySelector('[data-theme-name="contrast"]').textContent = t("contrast");

    const titles = document.querySelectorAll(".section-title");
    const keys = ["overview","filter","performance"];
    titles.forEach((el,i)=>{ if(keys[i]) el.textContent=t(keys[i]); });

    const stats = document.querySelectorAll(".stats-grid span");
    ["lines","errors","warnings","slow"].forEach((k,i)=>{ if(stats[i]) stats[i].textContent=t(k); });
    const metric = document.querySelectorAll(".metric-list span");
    ["avg","median","maximum","p95"].forEach((k,i)=>{ if(metric[i]) metric[i].textContent=t(k); });

    els.filterError.parentElement.lastChild.textContent = " " + t("errors");
    els.filterWarning.parentElement.lastChild.textContent = " " + t("warnings");
    els.filterSlow.parentElement.lastChild.textContent = " " + t("slow");

    const labels = document.querySelectorAll(".field-label");
    if(labels[0]) labels[0].firstChild.textContent=t("displayFormat");
    if(labels[1]) labels[1].firstChild.textContent=t("slowThreshold");
    if(labels[2]) labels[2].firstChild.textContent=t("minDuration");
    els.filterText.placeholder=t("keyword");

    const options = els.headerSortSelect.options;
    options[0].text=t("original"); options[1].text=t("durationDesc"); options[2].text=t("durationAsc");
    options[3].text=t("timestampAsc"); options[4].text=t("timestampDesc"); options[5].text=t("level");
    const fmt = els.timestampFormatSelect.options;
    fmt[0].text="YYYY-MM-DD HH:mm:ss.SSS"; fmt[1].text="YYYY/MM/DD HH:mm:ss.SSS"; fmt[2].text=t("originalTimestamp");
    els.copyBtn.textContent = state.language === "ja" ? "コピー" : "Copy";

    document.querySelector('label[for="fileInput"]').textContent=t("openLog");
    els.clearBtn.textContent=t("clear");
    els.settingsBtn.textContent=t("settings");
    els.sortLabel.textContent=t("sort");
    els.lineHeader.textContent=t("line");
    els.timestampHeader.textContent=t("timestamp");
    els.elapsedHeader.textContent=t("elapsed");
    els.levelHeader.textContent=t("levelHeader");
    els.messageHeader.textContent=t("messageHeader");
    els.resetViewBtn.textContent=t("resetView");
    els.loadingText.textContent=t("loading");
    document.querySelector(".empty-state h1").textContent=t("emptyTitle");
    document.querySelector(".empty-state p").innerHTML=t("emptyText");
    document.querySelector(".empty-state .small").textContent=t("emptyNote");
    els.dropZone.firstElementChild.textContent=t("drop");
    document.querySelector(".statusbar span:last-child").textContent=t("offline");
    if(!state.rows.length) {
      els.statusText.textContent=t("ready");
    } else {
    }
  }

  function setTheme(theme) {
    state.theme=theme;
    document.documentElement.dataset.theme=theme;
    localStorage.setItem("olw.theme",theme);
    const radio=document.querySelector(`input[name="theme"][value="${theme}"]`);
    if(radio) radio.checked=true;
  }

  // Apply persisted/default settings only after I18N has been initialized.
  applyLanguage();
  setTheme(state.theme);

  function formatDuration(ms) {
    if (ms == null || !Number.isFinite(ms)) return "—";
    if (ms < 1000) return `+${Math.round(ms)}ms`;
    return `+${(ms / 1000).toFixed(ms >= 10000 ? 1 : 3).replace(/\.?0+$/,"")}s`;
  }

  function percentile(values, p) {
    if (!values.length) return null;
    const a = [...values].sort((x,y)=>x-y);
    const pos = (a.length - 1) * p;
    const lo = Math.floor(pos), hi = Math.ceil(pos);
    return lo === hi ? a[lo] : a[lo] + (a[hi] - a[lo]) * (pos - lo);
  }

  function median(values) { return percentile(values, .5); }

  function detectTimestamp(lines) {
    const candidates = [
      {
        name:"ISO 8601",
        re:/\b(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:[.,]\d{1,9})?(?:Z|[+-]\d{2}:?\d{2})?)\b/,
        parse:s => { const d = new Date(s.replace(",", ".")); return Number.isNaN(d.getTime()) ? null : d.getTime(); }
      },
      {
        name:"YYYY-MM-DD HH:mm:ss",
        re:/\b(\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?:[.,]\d{1,9})?)\b/,
        parse:s => { const d = new Date(s.replace(",", "T")); return Number.isNaN(d.getTime()) ? null : d.getTime(); }
      },
      {
        name:"HH:mm:ss.SSS",
        re:/\b(\d{2}:\d{2}:\d{2}[.,]\d{1,9})\b/,
        parse:s => {
          const m=s.replace(",", ".").match(/^(\d{2}):(\d{2}):(\d{2})\.(\d+)$/);
          if(!m) return null;
          const base = Date.UTC(1970,0,1,+m[1],+m[2],+m[3], +(m[4]+"000").slice(0,3));
          return base;
        }
      },
      {
        name:"Unix milliseconds",
        re:/\b(1[0-9]{12,14})\b/,
        parse:s => Number(s)
      },
      {
        name:"Unix seconds",
        re:/\b(1[0-9]{9,11}(?:\.\d+)?)\b/,
        parse:s => Number(s)*1000
      }
    ];

    const sample = lines.slice(0, Math.min(lines.length, 5000));
    let best = null;
    for (const c of candidates) {
      let count=0, first=null;
      for (const line of sample) {
        const m=line.match(c.re);
        if(m) { count++; if(first===null) first=m[1]; }
      }
      if(!best || count > best.count) best={...c,count,first};
    }
    if(!best || best.count < 2) return { type:null, description:"No reliable timestamp format detected.", parser:null };
    return { type:best.name, description:`${best.name} (${best.count} matching lines in sample)`, parser:best };
  }

  function detectLevel(text) {
    if (/\b(?:FATAL|ERROR|ERR|EXCEPTION)\b/i.test(text)) return "ERROR";
    if (/\b(?:WARN|WARNING)\b/i.test(text)) return "WARN";
    if (/\b(?:DEBUG|TRACE)\b/i.test(text)) return "DEBUG";
    if (/\b(?:INFO|INFORMATION)\b/i.test(text)) return "INFO";
    return "";
  }

  function parseRows(text) {
    const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/);
    state.timestamp = detectTimestamp(lines);
    const parser = state.timestamp.parser;
    const raw = lines.map((text, i) => {
      let timestamp = null, timestampText = "";
      if (parser) {
        const m=text.match(parser.re);
        if(m) { timestampText=m[1]; timestamp=parser.parse(timestampText); }
      }
      return { line:i+1, text, timestamp, timestampText, level:detectLevel(text), duration:null };
    });
    let previous = null;
    for (const row of raw) {
      if (row.timestamp != null && previous != null) {
        let d=row.timestamp-previous;
        if (state.timestamp.type === "HH:mm:ss.SSS" && d < 0) d += 24*60*60*1000;
        row.duration = d >= 0 ? d : null;
      }
      if (row.timestamp != null) previous=row.timestamp;
    }
    return raw;
  }

  function getSearchTerms() {
    return (els.filterText.value || "").trim().toLowerCase().split(/\s+/).filter(Boolean);
  }

  function messageMatches(text, terms) {
    const lower = text.toLowerCase();
    return terms.every(term => lower.includes(term));
  }

  function appendHighlightedMessage(cell, text, terms) {
    if (!terms.length) { cell.textContent = text; return; }
    const source = String(text);
    const lower = source.toLowerCase();
    const ranges = [];
    for (const term of terms) {
      let from = 0;
      while (term && from < lower.length) {
        const at = lower.indexOf(term, from);
        if (at < 0) break;
        ranges.push([at, at + term.length]);
        from = at + term.length;
      }
    }
    ranges.sort((a,b) => a[0]-b[0] || b[1]-a[1]);
    const merged = [];
    for (const range of ranges) {
      const last = merged[merged.length-1];
      if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1]);
      else merged.push(range.slice());
    }
    let pos = 0;
    for (const [start,end] of merged) {
      if (start > pos) cell.appendChild(document.createTextNode(source.slice(pos,start)));
      const mark = document.createElement("mark");
      mark.className = "search-hit";
      mark.textContent = source.slice(start,end);
      cell.appendChild(mark);
      pos = end;
    }
    if (pos < source.length) cell.appendChild(document.createTextNode(source.slice(pos)));
  }

  function applyFilters() {
    const searchTerms=getSearchTerms();
    const minRaw=els.minDuration.value.trim().toLowerCase();
    let min=null;
    if (minRaw !== "") {
      const match=minRaw.match(/^(\d+(?:\.\d+)?)\s*(ms|s)?$/);
      if (match) min=Number(match[1]) * (match[2]==="s" ? 1000 : 1);
    }
    const slowValue=Number(els.slowThreshold.value);
    const slow=Number.isFinite(slowValue) && slowValue >= 0 ? slowValue : 1000;
    state.slowThreshold=slow;
    let rows=state.rows.filter(r => {
      const anyCategory = els.filterError.checked || els.filterWarning.checked || els.filterSlow.checked;
      const matchesCategory =
        (els.filterError.checked && r.level==="ERROR") ||
        (els.filterWarning.checked && r.level==="WARN") ||
        (els.filterSlow.checked && r.duration!=null && r.duration>=slow);
      if (anyCategory && !matchesCategory) return false;
      if(min!=null && !(r.duration!=null && r.duration>=min)) return false;
      if(searchTerms.length && !messageMatches(r.text, searchTerms)) return false;
      return true;
    });
    const sort=els.headerSortSelect.value;
    rows.sort((a,b)=>{
      if(sort==="duration-desc") return (b.duration??-1)-(a.duration??-1);
      if(sort==="duration-asc") return (a.duration??Infinity)-(b.duration??Infinity);
      if(sort==="timestamp-asc") return (a.timestamp??Infinity)-(b.timestamp??Infinity);
      if(sort==="timestamp-desc") return (b.timestamp??-Infinity)-(a.timestamp??-Infinity);
      if(sort==="level") return a.level.localeCompare(b.level) || a.line-b.line;
      return a.line-b.line;
    });
    state.filtered=rows;
    render();
    updateStats();
    updateStatus();
  }

  function pad2(n) { return String(n).padStart(2, "0"); }
  function pad3(n) { return String(n).padStart(3, "0"); }
  function formatTimestamp(row) {
    if (!row || row.timestamp == null) return row?.timestampText || "—";
    const mode = els.timestampFormatSelect.value;
    if (mode === "original") return row.timestampText || "—";
    const d = new Date(row.timestamp);
    if (Number.isNaN(d.getTime())) return row.timestampText || "—";
    const y = d.getFullYear();
    const mo = pad2(d.getMonth()+1), day = pad2(d.getDate());
    const h = pad2(d.getHours()), mi = pad2(d.getMinutes()), se = pad2(d.getSeconds()), ms = pad3(d.getMilliseconds());
    return mode === "slash" ? `${y}/${mo}/${day} ${h}:${mi}:${se}.${ms}` : `${y}-${mo}-${day} ${h}:${mi}:${se}.${ms}`;
  }

  function render() {
    const frag=document.createDocumentFragment();
    const searchTerms=getSearchTerms();
    const maxRows=20000; // protects the DOM for very large result sets
    for(const row of state.filtered.slice(0,maxRows)) {
      const tr=document.createElement("tr");
      const cells=[
        ["line-number",row.line],
        ["timestamp",formatTimestamp(row)],
        ["elapsed",formatDuration(row.duration)],
        ["",row.level||"—"],
        ["message",row.text||" "]
      ];
      cells.forEach(([cls,val],idx)=>{
        const td=document.createElement("td");
        if(cls) td.className=cls;
        if(idx===2 && row.duration!=null) {
          td.className="elapsed";
          if(row.duration>=state.slowThreshold) td.classList.add(row.duration>=state.slowThreshold*5?"critical":"slow");
        }
        if(idx===3) {
          if(row.level==="ERROR") td.className="level-error";
          if(row.level==="WARN") td.className="level-warn";
        }
        if (idx===4) appendHighlightedMessage(td, String(val), searchTerms);
        else td.textContent=String(val);
        tr.appendChild(td);
      });
      frag.appendChild(tr);
    }
    els.logBody.replaceChildren(frag);
    els.resultCount.textContent=`${state.filtered.length.toLocaleString()} rows`;
    if(state.filtered.length>maxRows) els.statusText.textContent=`Showing first ${maxRows.toLocaleString()} rows of ${state.filtered.length.toLocaleString()} results`;
  }

  function updateStats() {
    const durations=state.rows.map(r=>r.duration).filter(Number.isFinite);
    const errors=state.rows.filter(r=>r.level==="ERROR").length;
    const warns=state.rows.filter(r=>r.level==="WARN").length;
    const slow=durations.filter(x=>x>=state.slowThreshold).length;
    els.statLines.textContent=state.rows.length.toLocaleString();
    els.statErrors.textContent=errors.toLocaleString();
    els.statWarnings.textContent=warns.toLocaleString();
    els.statSlow.textContent=slow.toLocaleString();
    els.statAvg.textContent=durations.length ? formatDuration(durations.reduce((a,b)=>a+b,0)/durations.length) : "—";
    els.statMedian.textContent=durations.length ? formatDuration(median(durations)) : "—";
    els.statMax.textContent=durations.length ? formatDuration(durations.reduce((max,v)=>v>max?v:max, 0)) : "—";
    els.statP95.textContent=durations.length ? formatDuration(percentile(durations,.95)) : "—";
  }

  function updateStatus() {
    els.statusText.textContent=`${state.rows.length.toLocaleString()} lines · ${state.filtered.length.toLocaleString()} visible`;
  }

  function setBusy(busy, message) {
    els.loadingText.textContent = message || t("loading");
    els.loadingOverlay.hidden = !busy;
  }

  function nextFrame() {
    return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  }

  async function openText(text,name) {
    setBusy(true, t("loading"));
    try {
      await nextFrame();
      state.fileName=name||"Untitled log";
      state.rows=parseRows(text);
      els.fileName.textContent=state.fileName;
      els.emptyState.hidden = true;
      els.viewer.hidden = false;
      els.dropZone.hidden = true;
      await nextFrame();
      applyFilters();
    } finally {
      setBusy(false);
    }
  }

  async function openFile(file) {
    if(!file) return;
    setBusy(true, state.language === "ja" ? "ファイルを読み込み中…" : "Reading file…");
    els.statusText.textContent=state.language === "ja" ? "ファイルを読み込み中…" : "Reading file…";
    try {
      await nextFrame();
      const text=await file.text();
      await openText(text,file.name);
    } catch(e) {
      els.statusText.textContent=state.language === "ja" ? "ファイルを読み込めませんでした。" : "Could not read file.";
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  function clearAll() {
    state.rows=[]; state.filtered=[]; state.fileName="";
    els.fileInput.value="";
    els.viewer.hidden = true;
    els.emptyState.hidden = false;
    els.dropZone.hidden = true;
    els.logBody.replaceChildren();
    ["statLines","statErrors","statWarnings","statSlow","statAvg","statMedian","statMax","statP95"].forEach(id=>$(id).textContent="—");
    els.statusText.textContent="Ready";
  }

  async function copyVisibleRows() {
    const header = ["Line", "Timestamp", "Elapsed", "Level", "Message"].join("\t");
    const body = state.filtered.map(row => [
      row.line, formatTimestamp(row), formatDuration(row.duration), row.level || "", row.text || ""
    ].join("\t")).join("\n");
    const text = body ? `${header}\n${body}` : header;
    try {
      await navigator.clipboard.writeText(text);
      els.statusText.textContent = state.language === "ja" ? `${state.filtered.length.toLocaleString()}行をコピーしました` : `Copied ${state.filtered.length.toLocaleString()} rows`;
    } catch (e) {
      const ta=document.createElement("textarea"); ta.value=text; ta.style.position="fixed"; ta.style.opacity="0"; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); els.statusText.textContent = state.language === "ja" ? "表示内容をコピーしました" : "Visible data copied"; }
      finally { ta.remove(); }
    }
  }

  els.fileInput.addEventListener("change",e=>openFile(e.target.files[0]));
  els.clearBtn.addEventListener("click",clearAll);
  els.copyBtn.addEventListener("click",copyVisibleRows);
  function openSettings() {
    els.languageSelect.value=state.language;
    const radio=document.querySelector(`input[name="theme"][value="${state.theme}"]`);
    if(radio) radio.checked=true;
    els.settingsModal.hidden=false;
  }
  function closeSettings() {
    els.settingsModal.hidden=true;
  }
  els.settingsBtn.addEventListener("click",openSettings);
  els.settingsCloseBtn.addEventListener("click",closeSettings);
  els.settingsDoneBtn.addEventListener("click",()=>{
    state.language=els.languageSelect.value;
    localStorage.setItem("olw.language",state.language);
    const checked=document.querySelector('input[name="theme"]:checked');
    if(checked) setTheme(checked.value);
    applyLanguage();
    closeSettings();
  });
  els.settingsModal.addEventListener("click",e=>{
    if(e.target===els.settingsModal) closeSettings();
  });
  [els.filterError,els.filterWarning,els.filterSlow,els.filterText,els.minDuration,els.slowThreshold,els.headerSortSelect]
    .forEach(el=>el.addEventListener("input",applyFilters));
  els.timestampFormatSelect.addEventListener("change", render);
  els.resetViewBtn.addEventListener("click",()=>{
    els.filterError.checked=false; els.filterWarning.checked=false; els.filterSlow.checked=false;
    els.filterText.value=""; els.minDuration.value=""; els.headerSortSelect.value="line";
    applyFilters();
  });

  let dragDepth = 0;
  window.addEventListener("dragenter", e => {
    e.preventDefault();
    dragDepth++;
    els.dropZone.hidden = false;
  });
  window.addEventListener("dragover", e => {
    e.preventDefault();
    els.dropZone.hidden = false;
  });
  window.addEventListener("dragleave", e => {
    e.preventDefault();
    dragDepth = Math.max(0, dragDepth - 1);
    if (dragDepth === 0) els.dropZone.hidden = true;
  });
  window.addEventListener("drop", e => {
    e.preventDefault();
    dragDepth = 0;
    els.dropZone.hidden = true;
    const file = e.dataTransfer.files[0];
    if (file) openFile(file);
  });
})();
