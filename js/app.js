(() => {
  "use strict";

  const state = {
    rows: [], filtered: [], fileName: "", timestampFilterActive: false,
    timestamp: { type: null, description: "Not detected", parser: null },
    slowThreshold: 1000,
    theme: localStorage.getItem("olw.theme") || "dark",
    fontSize: ["small", "medium", "large"].includes(localStorage.getItem("olw.fontSize")) ? localStorage.getItem("olw.fontSize") : "medium",
    language: localStorage.getItem("olw.language") || "ja"
  };

  const $ = id => document.getElementById(id);
  const els = {
    fileInput:$("fileInput"), clearBtn:$("clearBtn"), settingsBtn:$("settingsBtn"), sidebarToggleBtn:$("sidebarToggleBtn"), sidebarEmptyOpenBtn:$("sidebarEmptyOpenBtn"), sidebarCloseBtn:$("sidebarCloseBtn"), csvBtn:$("csvBtn"),
    dropZone:$("dropZone"), loadingOverlay:$("loadingOverlay"), loadingText:$("loadingText"), emptyState:$("emptyState"), viewer:$("viewer"),
    fileName:$("fileName"), logBody:$("logBody"), resultCount:$("resultCount"),
    slowThreshold:$("slowThreshold"),
    filterError:$("filterError"), filterWarning:$("filterWarning"), filterSlow:$("filterSlow"),
    filterText:$("filterText"), timestampFrom:$("timestampFrom"), timestampTo:$("timestampTo"), timestampFilterTitle:$("timestampFilterTitle"), timestampFromLabel:$("timestampFromLabel"), timestampToLabel:$("timestampToLabel"), clearTimestampFilterBtn:$("clearTimestampFilterBtn"), contextMode:$("contextMode"), contextCount:$("contextCount"), contextRowsLabel:$("contextRowsLabel"), contextRowsUnit:$("contextRowsUnit"), headerSortSelect:$("headerSortSelect"),
    timestampFormatSelect:$("timestampFormatSelect"), copyBtn:$("copyBtn"),
    resetViewBtn:$("resetViewBtn"), sortLabel:$("sortLabel"), statusText:$("statusText"),
    settingsModal:$("settingsModal"), settingsCloseBtn:$("settingsCloseBtn"), settingsDoneBtn:$("settingsDoneBtn"),
    languageSelect:$("languageSelect"), languageLabel:$("languageLabel"), themeLabel:$("themeLabel"), fontSizeSelect:$("fontSizeSelect"), fontSizeLabel:$("fontSizeLabel"),
    settingsTitle:$("settingsTitle"), settingsSubtitle:$("settingsSubtitle") ,
    statLines:$("statLines"), statErrors:$("statErrors"), statWarnings:$("statWarnings"),
    statSlow:$("statSlow"), statAvg:$("statAvg"), statMedian:$("statMedian"),
    statMax:$("statMax"), statP95:$("statP95"), lineHeader:$("lineHeader"), timestampHeader:$("timestampHeader"), elapsedHeader:$("elapsedHeader"), levelHeader:$("levelHeader"), messageHeader:$("messageHeader")
  };

  document.documentElement.dataset.theme = state.theme;

  const I18N = {
    en: {
      settings:"Settings", settingsSubtitle:"Language and appearance", close:"Close", done:"Done",
      language:"Language", theme:"Theme", light:"Light", dark:"Dark", contrast:"High Contrast", fontSize:"Font size", fontSmall:"Small", fontMedium:"Medium", fontLarge:"Large",
      overview:"Overview", filter:"Filter", performance:"Performance", sort:"Sort", line:"Line", timestamp:"Timestamp", elapsed:"Time since previous log", levelHeader:"Level", messageHeader:"Message", loading:"Loading…",
      errors:"Errors", warnings:"Warnings", slow:"Slow operations", text:"Message", slowThreshold:"Slow interval threshold", keyword:"Keyword", original:"Original line order",
      contextRows:"Context rows", contextTarget:"Target rows only", contextBoth:"Before & after", contextBefore:"Before only", contextAfter:"After only", rowsUnit:"rows",
      timestampRange:"Timestamp range", timestampFrom:"From", timestampTo:"To", timestampExtent:"Log range", clearTimestampFilter:"Clear all filters", invalidTimestampRange:"Start time must be earlier than or equal to end time",
      durationDesc:"Interval ↓", durationAsc:"Interval ↑", timestampAsc:"Timestamp ↑", timestampDesc:"Timestamp ↓", level:"Log level",
      avg:"Average gap", median:"Median gap", maximum:"Maximum gap", p95:"95th percentile gap",
      performanceNote:"This is the elapsed time since the previous log entry, not the actual processing time. Use it as a reference only for single-threaded, sequential logs.",
      resetView:"Reset view", copy:"Copy", exportCsv:"Export CSV", openLog:"Open Log", clear:"Clear", hideSidebar:"Close sidebar", showSidebar:"Open sidebar", ready:"Ready", offline:"Offline / Local only", emptyTitle:"Open a text or log file",
      emptyText:"Right-click a supported file in the Explorer or editor tab and choose Open with Log Workbench S.",
      emptyNote:"The selected file is processed locally in VS Code. Log data is not uploaded.", drop:"Drop a log file here", lines:"Lines", displayFormat:"Timestamp display format", originalTimestamp:"Original",
      noTimestamp:"No reliable timestamp format detected.", openToDetect:"Open a log to detect its timestamp format.", selectRow:"Select a log row to inspect it."
    },
    ja: {
      settings:"設定", settingsSubtitle:"言語と表示設定", close:"閉じる", done:"完了",
      language:"言語", theme:"テーマ", light:"ライト", dark:"ダーク", contrast:"ハイコントラスト", fontSize:"フォント", fontSmall:"小", fontMedium:"中", fontLarge:"大",
      overview:"概要", filter:"フィルター", performance:"パフォーマンス", sort:"ソート", line:"行", timestamp:"タイムスタンプ", elapsed:"前行からの経過時間", levelHeader:"レベル", messageHeader:"メッセージ", loading:"読み込み中…",
      errors:"エラー", warnings:"警告", slow:"遅い処理（前行との比較）", text:"メッセージ", slowThreshold:"遅延判定しきい値", keyword:"キーワード", original:"元の行順",
      contextRows:"周辺行表示オプション", contextTarget:"対象行のみ", contextBoth:"前後", contextBefore:"前のみ", contextAfter:"後のみ", rowsUnit:"行",
      timestampRange:"タイムスタンプで絞り込み", timestampFrom:"開始", timestampTo:"終了", timestampExtent:"ログ範囲", clearTimestampFilter:"すべての絞り込みをクリア", invalidTimestampRange:"開始日時は終了日時以前にしてください",
      durationDesc:"経過時間 ↓", durationAsc:"経過時間 ↑", timestampAsc:"タイムスタンプ ↑", timestampDesc:"タイムスタンプ ↓", level:"ログレベル",
      avg:"平均時間差", median:"時間差の中央値", maximum:"最大時間差", p95:"時間差の95パーセンタイル",
      performanceNote:"この値は前のログ行からの経過時間であり、処理自体の所要時間ではありません。シングルスレッドで逐次処理されるログの場合に限り、参考値として利用してください。",
      resetView:"表示をリセット", copy:"コピー", exportCsv:"CSV出力", openLog:"ログを開く", clear:"クリア", hideSidebar:"サイドバーを閉じる", showSidebar:"サイドバーを開く", ready:"準備完了", offline:"オフライン / ローカルのみ", emptyTitle:"テキストまたはログファイルを開いてください",
      emptyText:"エクスプローラーまたはエディタータブで対応ファイルを右クリックし、「Open with Log Workbench S」を選択してください。",
      emptyNote:"選択したファイルはVS Code内でローカル処理されます。ログデータは外部へ送信されません。", drop:"ログファイルをここにドロップ", lines:"行", displayFormat:"タイムスタンプ表示形式", originalTimestamp:"元の形式",
      noTimestamp:"信頼できるタイムスタンプ形式を検出できませんでした。", openToDetect:"ログを開くとタイムスタンプ形式を自動判定します。", selectRow:"ログ行を選択すると詳細を表示します。"
    }
  };
  function t(key) { return I18N[state.language][key] || I18N.en[key] || key; }

  function applyLanguage() {
    document.documentElement.lang = state.language;
    els.settingsTitle.textContent=t("settings");
    els.settingsSubtitle.textContent=t("settingsSubtitle");
    els.settingsCloseBtn.setAttribute("aria-label",t("close"));
    els.settingsDoneBtn.textContent=t("done");
    els.languageLabel.textContent=t("language");
    els.themeLabel.textContent=t("theme");
    els.fontSizeLabel.textContent=t("fontSize");
    els.fontSizeSelect.options[0].text=t("fontLarge");
    els.fontSizeSelect.options[1].text=t("fontMedium");
    els.fontSizeSelect.options[2].text=t("fontSmall");
    els.fontSizeSelect.value=state.fontSize;
    document.querySelector('[data-theme-name="light"]').textContent=t("light");
    document.querySelector('[data-theme-name="dark"]').textContent=t("dark");
    document.querySelector('[data-theme-name="contrast"]').textContent=t("contrast");

    $("overviewTitle").textContent=t("overview");
    $("filterTitle").textContent=t("filter");
    $("performanceTitle").textContent=t("performance");
    $("performanceNote").textContent=t("performanceNote");
    const stats=document.querySelectorAll(".overview-list:not(.performance-slow) .overview-row > span");
    ["lines","errors","warnings"].forEach((k,i)=>{if(stats[i])stats[i].textContent=t(k);});
    $("statSlowLabel").textContent=t("slow");
    const metric=document.querySelectorAll(".metric-list span");
    ["avg","median","maximum","p95"].forEach((k,i)=>{if(metric[i])metric[i].textContent=t(k);});
    els.filterError.parentElement.lastChild.textContent=" "+t("errors");
    els.filterWarning.parentElement.lastChild.textContent=" "+t("warnings");
    els.filterSlow.parentElement.lastChild.textContent=" "+t("slow");
    const displayLabel=document.querySelector(".display-format-field");
    if(displayLabel) displayLabel.firstChild.textContent=t("displayFormat");
    const thresholdLabel=document.querySelector(".slow-threshold-field");
    if(thresholdLabel) thresholdLabel.firstChild.textContent=t("slowThreshold");
    els.filterText.placeholder=t("keyword");
    if(els.contextRowsLabel) els.contextRowsLabel.textContent=t("contextRows");
    if(els.contextRowsUnit) els.contextRowsUnit.textContent=t("rowsUnit");
    if(els.timestampFilterTitle) els.timestampFilterTitle.textContent=t("timestampRange");
    const extentLabel=$("timestampExtentLabel"); if(extentLabel) extentLabel.textContent=t("timestampExtent");
    const keywordLabel=$("keywordFilterLabel"); if(keywordLabel) keywordLabel.textContent=t("keyword");
    if(els.timestampFromLabel) els.timestampFromLabel.textContent=t("timestampFrom");
    if(els.timestampToLabel) els.timestampToLabel.textContent=t("timestampTo");
    if(els.timestampFrom) els.timestampFrom.setAttribute("aria-label",t("timestampFrom"));
    if(els.timestampTo) els.timestampTo.setAttribute("aria-label",t("timestampTo"));
    if(els.clearTimestampFilterBtn) els.clearTimestampFilterBtn.textContent=t("clearTimestampFilter");
    if(els.contextMode) {
      const options=els.contextMode.options;
      ["contextTarget","contextBoth","contextBefore","contextAfter"].forEach((k,i)=>{options[i].text=t(k);});
    }
    const sort=els.headerSortSelect.options;
    ["original","durationDesc","durationAsc","timestampAsc","timestampDesc","level"].forEach((k,i)=>{sort[i].text=t(k);});
    const fmt=els.timestampFormatSelect.options;
    fmt[0].text="YYYY-MM-DD HH:mm:ss.SSS"; fmt[1].text="YYYY/MM/DD HH:mm:ss.SSS";
    fmt[2].text="YYYY-MM-DD"; fmt[3].text="HH:mm:ss.SSS"; fmt[4].text="ISO 8601 (UTC)"; fmt[5].text="Unix timestamp (ms)"; fmt[6].text=t("originalTimestamp");
    els.copyBtn.textContent=t("copy");
    els.csvBtn.textContent=t("exportCsv");
    els.settingsBtn.textContent=t("settings");
    const openLogLabel = $("openLogLabel"); if (openLogLabel) openLogLabel.textContent = t("openLog");
    if (els.clearBtn) els.clearBtn.textContent = t("clear");
    const sidebarCollapsed=document.querySelector(".layout").classList.contains("sidebar-collapsed");
    [els.sidebarToggleBtn,els.sidebarEmptyOpenBtn].forEach(button=>{
      button.setAttribute("aria-label",t("showSidebar"));
      button.setAttribute("title",t("showSidebar"));
      button.setAttribute("aria-expanded",String(!sidebarCollapsed));
    });
    els.sidebarCloseBtn.setAttribute("aria-label",t("hideSidebar"));
    els.sidebarCloseBtn.setAttribute("title",t("hideSidebar"));
    els.sortLabel.textContent=t("sort");
    els.lineHeader.textContent=t("line"); els.timestampHeader.textContent=t("timestamp");
    els.elapsedHeader.textContent=t("elapsed"); els.elapsedHeader.title=t("performanceNote");
    els.levelHeader.textContent=t("levelHeader"); els.messageHeader.textContent=t("messageHeader");
    els.resetViewBtn.textContent=t("resetView"); els.loadingText.textContent=t("loading");
    document.querySelector(".empty-state h1").textContent=t("emptyTitle");
    document.querySelector(".empty-state p").textContent=t("emptyText");
    document.querySelector(".empty-state .small").textContent=t("emptyNote");
    els.dropZone.firstElementChild.textContent=t("drop");
    document.querySelector(".statusbar span:last-child").textContent=t("offline");
    if(!state.rows.length) els.statusText.textContent=t("ready");
  }

  function setFontSize(size) {
    if (!["small", "medium", "large"].includes(size)) size = "medium";
    state.fontSize = size;
    document.documentElement.dataset.fontSize = size;
    localStorage.setItem("olw.fontSize", size);
    if (els.fontSizeSelect) els.fontSizeSelect.value = size;
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
  setFontSize(state.fontSize);

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

  function configureTimestampFilterInputs() {
    const timeOnly = state.timestamp.type === "HH:mm:ss.SSS";
    const type = timeOnly ? "time" : "datetime-local";
    [els.timestampFrom, els.timestampTo].forEach(input => {
      input.value = "";
      input.type = type;
      input.step = "0.001";
    });
  }

  function timestampInputValue(value) {
    if (!Number.isFinite(value)) return "";
    const d = new Date(value);
    const pad = n => String(n).padStart(2, "0");
    const ms = String(d.getMilliseconds()).padStart(3, "0");
    if (els.timestampFrom.type === "time") {
      return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}.${ms}`;
    }
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${ms}`;
  }

  function updateTimestampExtent() {
    const minEl=$("timestampMin"), maxEl=$("timestampMax");
    if(!minEl || !maxEl) return;
    let min=Infinity, max=-Infinity;
    for(const row of state.rows) {
      if(Number.isFinite(row.timestamp)) { if(row.timestamp<min) min=row.timestamp; if(row.timestamp>max) max=row.timestamp; }
    }
    if(min===Infinity) { minEl.textContent="—"; maxEl.textContent="—"; els.timestampFrom.value=""; els.timestampTo.value=""; state.timestampFilterActive=false; return; }
    const formatExtent=value=>{
      if(state.timestamp.type==="HH:mm:ss.SSS") {
        const d=new Date(value);
        return `${String(d.getUTCHours()).padStart(2,"0")}:${String(d.getUTCMinutes()).padStart(2,"0")}:${String(d.getUTCSeconds()).padStart(2,"0")}.${String(d.getUTCMilliseconds()).padStart(3,"0")}`;
      }
      const d=new Date(value);
      const p=n=>String(n).padStart(2,"0");
      return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
    };
    minEl.textContent=formatExtent(min); maxEl.textContent=formatExtent(max);
    minEl.dateTime=new Date(min).toISOString(); maxEl.dateTime=new Date(max).toISOString();
    // Show the full detected log range by default without excluding timestamp-less continuation lines.
    els.timestampFrom.value=timestampInputValue(min);
    els.timestampTo.value=timestampInputValue(max);
    state.timestampFilterActive=false;
  }

  function timestampBound(input) {
    const value = input.value;
    if (!value) return null;
    if (input.type === "time") {
      const match = value.match(/^(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/);
      if (!match) return null;
      return Date.UTC(1970, 0, 1, Number(match[1]), Number(match[2]), Number(match[3] || 0), Number(((match[4] || "") + "000").slice(0, 3)));
    }
    const parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : null;
  }

  function applyFilters() {
    const searchTerms=getSearchTerms();
    const slowValue=Number(els.slowThreshold.value);
    const slow=Number.isFinite(slowValue)&&slowValue>=0?slowValue:1000;
    state.slowThreshold=slow;
    // Keyword filtering defines the investigation set. Category filters select targets;
    // surrounding rows are taken only from that keyword-filtered set.
    const from = timestampBound(els.timestampFrom);
    const to = timestampBound(els.timestampTo);
    const hasTimestampRange = state.timestampFilterActive && (from !== null || to !== null);
    const timeOnlyRange = els.timestampFrom.type === "time";
    const crossesMidnight = timeOnlyRange && from !== null && to !== null && from > to;
    if (from !== null && to !== null && from > to && !timeOnlyRange) {
      els.timestampFrom.setCustomValidity(t("invalidTimestampRange"));
      els.timestampTo.setCustomValidity(t("invalidTimestampRange"));
    } else {
      els.timestampFrom.setCustomValidity("");
      els.timestampTo.setCustomValidity("");
    }
    const timestampRows = hasTimestampRange && from !== null && to !== null && from > to && !timeOnlyRange
      ? []
      : state.rows.filter(r => {
          if (!hasTimestampRange) return true;
          if (r.timestamp === null || r.timestamp === undefined) return false;
          if (crossesMidnight) return r.timestamp >= from || r.timestamp <= to;
          return (from === null || r.timestamp >= from) && (to === null || r.timestamp <= to);
        });
    const keywordRows=searchTerms.length?timestampRows.filter(r=>messageMatches(r.text,searchTerms)):timestampRows;
    const anyCategory=els.filterError.checked||els.filterWarning.checked||els.filterSlow.checked;
    const targetRows=keywordRows.filter(r=>{
      if(!anyCategory)return true;
      return (els.filterError.checked&&r.level==="ERROR")||
        (els.filterWarning.checked&&r.level==="WARN")||
        (els.filterSlow.checked&&r.duration!=null&&r.duration>=slow);
    });
    const mode=els.contextMode?els.contextMode.value:"target";
    const rawCount=els.contextCount?Number(els.contextCount.value):1;
    const count=mode==="target"?0:(Number.isFinite(rawCount)?Math.max(1,Math.min(1000,Math.floor(rawCount))):1);
    let rows;
    if(mode==="target") rows=targetRows.slice();
    else {
      const included=new Set();
      const indexByLine=new Map(keywordRows.map((row,index)=>[row.line,index]));
      for(const target of targetRows){
        const index=indexByLine.get(target.line); if(index==null)continue;
        const from=(mode==="both"||mode==="before")?Math.max(0,index-count):index;
        const to=(mode==="both"||mode==="after")?Math.min(keywordRows.length-1,index+count):index;
        for(let i=from;i<=to;i++)included.add(i);
      }
      rows=Array.from(included).sort((a,b)=>a-b).map(i=>keywordRows[i]).filter(Boolean);
    }
    const sort=els.headerSortSelect.value;
    rows.sort((a,b)=>{
      if(sort==="duration-desc")return(b.duration??-1)-(a.duration??-1);
      if(sort==="duration-asc")return(a.duration??Infinity)-(b.duration??Infinity);
      if(sort==="timestamp-asc")return(a.timestamp??Infinity)-(b.timestamp??Infinity);
      if(sort==="timestamp-desc")return(b.timestamp??-Infinity)-(a.timestamp??-Infinity);
      if(sort==="level")return a.level.localeCompare(b.level)||a.line-b.line;
      return a.line-b.line;
    });
    state.filtered=rows; render(); updateStats(); updateStatus();
  }

  function pad2(n) { return String(n).padStart(2, "0"); }
  function pad3(n) { return String(n).padStart(3, "0"); }
  function formatTimestamp(row) {
    if (!row || row.timestamp == null) return row?.timestampText || "—";
    const mode = els.timestampFormatSelect.value;
    if (mode === "original") return row.timestampText || "—";
    const d = new Date(row.timestamp);
    if (Number.isNaN(d.getTime())) return row.timestampText || "—";
    if(mode==="iso") return d.toISOString();
    if(mode==="epoch") return String(d.getTime());
    const y=d.getFullYear();
    const mo=pad2(d.getMonth()+1),day=pad2(d.getDate());
    const h=pad2(d.getHours()),mi=pad2(d.getMinutes()),se=pad2(d.getSeconds()),ms=pad3(d.getMilliseconds());
    if(mode==="date")return `${y}-${mo}-${day}`;
    if(mode==="time")return `${h}:${mi}:${se}.${ms}`;
    return mode==="slash"?`${y}/${mo}/${day} ${h}:${mi}:${se}.${ms}`:`${y}-${mo}-${day} ${h}:${mi}:${se}.${ms}`;
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

  function resetFileFilters() {
    els.filterError.checked=false;
    els.filterWarning.checked=false;
    els.filterSlow.checked=false;
    els.filterText.value="";
    if (els.timestampFrom) { els.timestampFrom.value=""; els.timestampFrom.setCustomValidity(""); }
    if (els.timestampTo) { els.timestampTo.value=""; els.timestampTo.setCustomValidity(""); }
    state.timestampFilterActive=false;
    els.contextMode.value="target";
    els.contextCount.value="1";
    els.headerSortSelect.value="line";
  }

  async function openText(text,name) {
    setBusy(true, t("loading"));
    try {
      resetFileFilters();
      await nextFrame();
      state.fileName=name||"Untitled log";
      state.rows=parseRows(text);
      configureTimestampFilterInputs();
      updateTimestampExtent();
      els.fileName.textContent=state.fileName;
      els.emptyState.hidden = true;
      els.viewer.hidden = false;
      const sidebarCollapsed=document.querySelector(".layout").classList.contains("sidebar-collapsed");
      els.sidebarToggleBtn.hidden=!sidebarCollapsed;
      els.sidebarEmptyOpenBtn.hidden=true;
      els.dropZone.hidden = true;
      await nextFrame();
      applyFilters();
      // Keep the timestamp range inputs synchronized with the full loaded log range.
      // The bounds are displayed by default, but do not activate timestamp filtering.
      updateTimestampExtent();
    } finally {
      setBusy(false);
    }
  }

  async function openFile(file) {
    if (!file) return;
    setBusy(true, state.language === "ja" ? "ファイルを読み込み中…" : "Reading file…");
    try {
      const text = await file.text();
      await openText(text, file.name);
    } catch (error) {
      console.error(error);
      els.statusText.textContent = state.language === "ja" ? "ファイルを読み込めませんでした。" : "Could not read file.";
    } finally {
      setBusy(false);
    }
  }

  function clearAll() {
    state.rows = [];
    state.filtered = [];
    state.fileName = "";
    if (els.fileInput) els.fileInput.value = "";
    els.viewer.hidden = true;
    els.emptyState.hidden = false;
    els.dropZone.hidden = true;
    els.logBody.replaceChildren();
    ["statLines", "statErrors", "statWarnings", "statSlow", "statAvg", "statMedian", "statMax", "statP95"].forEach(id => $(id).textContent = "—");
    els.statusText.textContent = t("ready");
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

  els.copyBtn.addEventListener("click",copyVisibleRows);
  if (els.fileInput) els.fileInput.addEventListener("change", event => openFile(event.target.files[0]));
  if (els.clearBtn) els.clearBtn.addEventListener("click", clearAll);

  function csvEscape(value) {
    const text=String(value == null ? "" : value);
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }
  function exportVisibleCsv() {
    const header=["Line","Timestamp","Elapsed","Level","Message"];
    const lines=[header,...state.filtered.map(row=>[
      row.line,formatTimestamp(row),formatDuration(row.duration),row.level||"",row.text||""
    ])].map(columns=>columns.map(csvEscape).join(","));
    // UTF-8 BOM improves compatibility with spreadsheet applications.
    const base=(state.fileName||"log").replace(/\.[^.]*$/,"").replace(/[\\/:*?"<>|]/g,"_")||"log";
    const content="\uFEFF"+lines.join("\r\n");
    if (vscodeApi) {
      vscodeApi.postMessage({type:"exportCsv",fileName:`${base}.csv`,content});
      els.statusText.textContent=state.language==="ja"?"CSVの保存先を選択してください":"Choose where to save the CSV file";
      return;
    }
    const blob=new Blob([content],{type:"text/csv;charset=utf-8;"});
    const url=URL.createObjectURL(blob);
    const link=document.createElement("a");
    link.href=url; link.download=`${base}.csv`; link.style.display="none";
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    els.statusText.textContent=state.language==="ja"?`${state.filtered.length.toLocaleString()}行をCSV出力しました`:`Exported ${state.filtered.length.toLocaleString()} rows to CSV`;
  }
  els.csvBtn.addEventListener("click",exportVisibleCsv);

  function setSidebarCollapsed(collapsed) {
    const layout=document.querySelector(".layout");
    layout.classList.toggle("sidebar-collapsed",collapsed);
    // Keep the content grid alive when the sidebar is hidden; never collapse the whole viewer.
    els.sidebarToggleBtn.hidden=!collapsed || els.viewer.hidden;
    els.sidebarEmptyOpenBtn.hidden=!collapsed || els.emptyState.hidden;
    els.sidebarCloseBtn.hidden=collapsed;
    applyLanguage();
  }
  els.sidebarToggleBtn.addEventListener("click",()=>setSidebarCollapsed(false));
  els.sidebarEmptyOpenBtn.addEventListener("click",()=>setSidebarCollapsed(false));
  els.sidebarCloseBtn.addEventListener("click",()=>setSidebarCollapsed(true));
  // Initial state: sidebar open, close button in sidebar; hamburger appears only after closing.
  setSidebarCollapsed(false);

  function openSettings() {
    els.languageSelect.value=state.language;
    els.fontSizeSelect.value=state.fontSize;
    const radio=document.querySelector(`input[name="theme"][value="${state.theme}"]`);
    if(radio) radio.checked=true;
    els.settingsModal.hidden=false;
  }
  function closeSettings() {
    els.settingsModal.hidden=true;
  }
  els.fontSizeSelect.addEventListener("change", () => setFontSize(els.fontSizeSelect.value));
  els.languageSelect.addEventListener("change", () => {
    state.language = els.languageSelect.value;
    localStorage.setItem("olw.language", state.language);
    applyLanguage();
  });
  els.settingsBtn.addEventListener("click",openSettings);
  els.settingsCloseBtn.addEventListener("click",closeSettings);
  els.settingsDoneBtn.addEventListener("click",()=>{
    state.language=els.languageSelect.value;
    localStorage.setItem("olw.language",state.language);
    const checked=document.querySelector('input[name="theme"]:checked');
    if(checked) setTheme(checked.value);
    setFontSize(els.fontSizeSelect.value);
    applyLanguage();
    closeSettings();
  });
  els.settingsModal.addEventListener("click",e=>{
    if(e.target===els.settingsModal) closeSettings();
  });
  [els.filterError,els.filterWarning,els.filterSlow,els.filterText,els.timestampFrom,els.timestampTo,els.slowThreshold,els.headerSortSelect,els.contextCount]
    .forEach(el=>el.addEventListener("input",applyFilters));
  function normalizeContextCount() {
    if (els.contextMode.value === "target") {
      els.contextCount.value = "0";
    } else if (Number(els.contextCount.value) === 0 || els.contextCount.value === "") {
      els.contextCount.value = "1";
    }
  }
  els.contextMode.addEventListener("change", () => { normalizeContextCount(); applyFilters(); });
  els.contextCount.addEventListener("change", () => { normalizeContextCount(); applyFilters(); });
  els.timestampFrom.addEventListener("change",()=>{state.timestampFilterActive=true;applyFilters();});
  els.timestampTo.addEventListener("change",()=>{state.timestampFilterActive=true;applyFilters();});
  function clearAllFilters() {
    els.filterError.checked=false; els.filterWarning.checked=false; els.filterSlow.checked=false;
    els.filterText.value="";
    els.timestampFrom.value=""; els.timestampTo.value="";
    state.timestampFilterActive=false;
    els.timestampFrom.setCustomValidity(""); els.timestampTo.setCustomValidity("");
    applyFilters();
  }
  els.clearTimestampFilterBtn.addEventListener("click",clearAllFilters);
  els.timestampFormatSelect.addEventListener("change", render);
  els.resetViewBtn.addEventListener("click",()=>{
    clearAllFilters();
    els.contextMode.value="target"; els.contextCount.value="1"; els.headerSortSelect.value="line";
    applyFilters();
  });

  // Signal to the VS Code extension host that the Webview is ready.
  const vscodeApi = typeof acquireVsCodeApi === "function" ? acquireVsCodeApi() : null;
  if (vscodeApi) vscodeApi.postMessage({ type: "ready" });

  // VS Code extension host can provide a selected log file directly.
  window.addEventListener("message", async event => {
    const message = event.data;
    if (!message || message.type !== "loadLog") return;
    await openText(String(message.text || ""), message.name || "Untitled log");
  });

  window.addEventListener("message", event => {
    const message=event.data;
    if (!message || message.type !== "csvExportResult") return;
    if (message.status === "success") {
      els.statusText.textContent=state.language==="ja"?`${state.filtered.length.toLocaleString()}行をCSV出力しました`:`Exported ${state.filtered.length.toLocaleString()} rows to CSV`;
    } else if (message.status === "cancelled") {
      els.statusText.textContent=state.language==="ja"?"CSV出力をキャンセルしました":"CSV export cancelled";
    }
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
