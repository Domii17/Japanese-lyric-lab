"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, Copyright, Download, Github, Image as ImageIcon, Info, LoaderCircle, RotateCcw, Search, ShieldCheck, Sparkles, Upload, X } from "lucide-react";
import type { StudyLine, StudyToken } from "@/lib/analyzer";

const sample = `好きな歌を口ずさむ
言葉の意味を少しずつ知る
昨日より近く感じられる`;

type AiExplanation = { summary?: string; natural?: string; grammar?: Array<{ pattern?: string; explanation?: string }>; notes?: string[] };
type AiEnhanced = { glosses?: Array<{ surface?: string; meaning?: string }>; explanation?: AiExplanation };
type LyricSearchResult = { id: number; trackName: string; artistName: string; albumName?: string; lyrics: string };
type DeploymentCapabilities = { aiConfigured: boolean | null; aiProvider: string | null; repositoryUrl: string | null };

function tokenKey(lineIndex: number, tokenIndex: number) {
  return `${lineIndex}-${tokenIndex}`;
}

export default function Home() {
  const [text, setText] = useState(sample);
  const [lines, setLines] = useState<StudyLine[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [message, setMessage] = useState("准备就绪");
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiLoading, setAiLoading] = useState<number | null>(null);
  const [aiResults, setAiResults] = useState<Record<number, AiEnhanced>>({});
  const [aiError, setAiError] = useState<Record<number, string>>({});
  const [collapsedExplanations, setCollapsedExplanations] = useState<Set<number>>(new Set());
  const [track, setTrack] = useState("");
  const [artist, setArtist] = useState("");
  const [searchingLyrics, setSearchingLyrics] = useState(false);
  const [searchResults, setSearchResults] = useState<LyricSearchResult[]>([]);
  const [exportMode, setExportMode] = useState(false);
  const [selectedLines, setSelectedLines] = useState<Set<number>>(new Set());
  const [exportPreview, setExportPreview] = useState<{ url: string; filename: string } | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [capabilities, setCapabilities] = useState<DeploymentCapabilities>({ aiConfigured: null, aiProvider: null, repositoryUrl: null });
  const fileInput = useRef<HTMLInputElement>(null);

  const tokenCount = useMemo(() => lines.reduce((sum, line) => sum + line.tokens.length, 0), [lines]);

  useEffect(() => {
    let active = true;
    fetch("/api/capabilities", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Capabilities request failed");
        return response.json() as Promise<Omit<DeploymentCapabilities, "aiConfigured"> & { aiConfigured: boolean }>;
      })
      .then((payload) => { if (active) setCapabilities(payload); })
      .catch(() => { if (active) setCapabilities({ aiConfigured: false, aiProvider: null, repositoryUrl: null }); });
    return () => { active = false; };
  }, []);

  async function runAnalysis() {
    if (!text.trim()) { setLines([]); setMessage("请先输入日语文本"); return; }
    setIsAnalyzing(true); setMessage("正在加载日语词典"); setSelected(null); setAiResults({}); setAiError({}); setCollapsedExplanations(new Set()); setExportMode(false); setSelectedLines(new Set());
    try {
      const response = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
      if (!response.ok) throw new Error("Analysis request failed");
      const { lines: parsed } = (await response.json()) as { lines: StudyLine[] };
      setLines(parsed);
      setMessage("分析完成");
    } catch (error) {
      console.error(error); setMessage("分析失败，请刷新页面重试");
    } finally { setIsAnalyzing(false); }
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".txt") || file.size > 100_000) { setMessage("请选择不超过 100 KB 的 TXT 文件"); event.target.value = ""; return; }
    setText(await file.text()); setLines([]); setSelected(null); setMessage(`已载入 ${file.name}`); event.target.value = "";
  }

  async function explainLine(lineIndex: number) {
    const line = lines[lineIndex];
    if (!line) return;
    setAiLoading(lineIndex); setAiError((current) => ({ ...current, [lineIndex]: "" }));
    try {
      const response = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ line: line.original, tokens: line.tokens }) });
      const payload = (await response.json()) as AiEnhanced & { error?: string };
      if (!response.ok) throw new Error(payload.error || "AI 请求失败");
      setAiResults((current) => ({ ...current, [lineIndex]: payload }));
      setCollapsedExplanations((current) => { const next = new Set(current); next.delete(lineIndex); return next; });
    } catch (error) { setAiError((current) => ({ ...current, [lineIndex]: error instanceof Error ? error.message : "AI 讲解失败" })); }
    finally { setAiLoading(null); }
  }

  async function searchLyrics() {
    if (!track.trim() && !artist.trim()) { setMessage("请至少输入歌名或歌手"); return; }
    setSearchingLyrics(true); setSearchResults([]); setMessage("正在搜索歌词");
    try {
      const response = await fetch(`/api/lyrics/search?track=${encodeURIComponent(track.trim())}&artist=${encodeURIComponent(artist.trim())}`);
      const payload = (await response.json()) as { results?: LyricSearchResult[]; error?: string };
      if (!response.ok) throw new Error(payload.error || "搜索失败");
      setSearchResults(payload.results || []); setMessage(payload.results?.length ? "请选择要导入的版本" : "没有找到带歌词的结果");
    } catch (error) { setMessage(error instanceof Error ? error.message : "搜索失败"); }
    finally { setSearchingLyrics(false); }
  }

  function selectToken(lineIndex: number, tokenIndex: number) {
    const key = tokenKey(lineIndex, tokenIndex);
    setSelected((current) => current === key ? null : key);
  }

  function getTokenMeaning(lineIndex: number, tokenIndex: number) {
    if (capabilities.aiConfigured === false) return "自行部署并配置 AI 后展示";
    if (!aiEnabled) return "开启释义和解析后展示";
    if (!aiResults[lineIndex]) return "请先点击全句解析";
    return aiResults[lineIndex].glosses?.[tokenIndex]?.meaning || "暂未返回释义";
  }

  function toggleExplanation(lineIndex: number) {
    setCollapsedExplanations((current) => {
      const next = new Set(current);
      if (next.has(lineIndex)) next.delete(lineIndex); else next.add(lineIndex);
      return next;
    });
  }

  function openExportMode() {
    setExportMode(true);
    setSelectedLines(new Set(lines.map((_, index) => index)));
  }

  function toggleExportLine(lineIndex: number) {
    setSelectedLines((current) => {
      const next = new Set(current);
      if (next.has(lineIndex)) next.delete(lineIndex); else next.add(lineIndex);
      return next;
    });
  }

  function closeExportPreview() {
    setExportPreview((current) => {
      if (current) URL.revokeObjectURL(current.url);
      return null;
    });
  }

  function downloadImage() {
    const chosen = [...selectedLines].sort((a, b) => a - b).map((index) => lines[index]).filter(Boolean);
    if (!chosen.length) { setMessage("请至少选择一句歌词"); return; }
    if (chosen.length > 20) { setMessage("一次最多保存 20 句"); return; }
    const logicalWidth = 1080;
    const padding = 48;
    const cardGap = 12;
    const cardHeight = 124;
    const contentWidth = logicalWidth - padding * 2;
    const measure = document.createElement("canvas").getContext("2d");
    if (!measure) return;
    measure.font = '600 25px "Yu Gothic", "Noto Sans JP", sans-serif';
    const layouts = chosen.map((line) => {
      const widths = line.tokens.map((token) => Math.max(92, Math.ceil(Math.max(measure.measureText(token.surface).width, token.reading.length * 15, token.romaji.length * 9) + 32)));
      const rows: Array<Array<{ token: StudyToken; width: number }>> = [[]];
      let used = 0;
      line.tokens.forEach((token, index) => {
        const width = Math.min(widths[index], contentWidth);
        const needed = rows.at(-1)!.length ? width + cardGap : width;
        if (used + needed > contentWidth && rows.at(-1)!.length) { rows.push([]); used = 0; }
        rows.at(-1)!.push({ token, width });
        used += (rows.at(-1)!.length > 1 ? cardGap : 0) + width;
      });
      return { line, rows, height: 66 + rows.length * cardHeight + (rows.length - 1) * cardGap + 34 };
    });
    const logicalHeight = 104 + layouts.reduce((sum, item) => sum + item.height, 0) + padding;
    const scale = 2;
    const canvas = document.createElement("canvas");
    canvas.width = logicalWidth * scale;
    canvas.height = logicalHeight * scale;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.scale(scale, scale);
    context.fillStyle = "#f7faf8";
    context.fillRect(0, 0, logicalWidth, logicalHeight);
    context.fillStyle = "#157a70";
    context.font = '700 13px "Segoe UI", sans-serif';
    context.fillText("JAPANESE LYRIC LAB", padding, 45);
    context.fillStyle = "#18302d";
    context.font = '500 28px "Yu Gothic", "Noto Sans SC", sans-serif';
    context.fillText("歌词拆解", padding, 80);
    let y = 112;
    layouts.forEach(({ line, rows, height }, lineIndex) => {
      context.fillStyle = "#6b7e79";
      context.font = '600 12px "Segoe UI", sans-serif';
      context.fillText(String(lineIndex + 1).padStart(2, "0"), padding, y + 18);
      context.fillStyle = "#18302d";
      context.font = '500 19px "Yu Gothic", "Noto Sans JP", sans-serif';
      context.fillText(line.original, padding + 34, y + 19);
      y += 44;
      rows.forEach((row) => {
        let x = padding;
        row.forEach(({ token, width }) => {
          context.fillStyle = "#e3f2ed";
          context.beginPath();
          context.roundRect(x, y, width, cardHeight, 7);
          context.fill();
          context.textAlign = "center";
          context.fillStyle = "#0e5f58";
          context.font = '500 15px "Yu Gothic", "Noto Sans JP", sans-serif';
          context.fillText(token.reading, x + width / 2, y + 28);
          context.fillStyle = "#18302d";
          context.font = '600 25px "Yu Gothic", "Noto Sans JP", sans-serif';
          context.fillText(token.surface, x + width / 2, y + 67);
          context.fillStyle = "#506963";
          context.font = '400 14px "Segoe UI", sans-serif';
          context.fillText(token.romaji, x + width / 2, y + 101);
          context.textAlign = "left";
          x += width + cardGap;
        });
        y += cardHeight + cardGap;
      });
      y += height - 44 - rows.length * cardHeight - (rows.length - 1) * cardGap;
      if (lineIndex < layouts.length - 1) {
        context.strokeStyle = "#d9e5e0";
        context.beginPath(); context.moveTo(padding, y - 14); context.lineTo(logicalWidth - padding, y - 14); context.stroke();
      }
    });
    canvas.toBlob((blob) => {
      if (!blob) { setMessage("图片生成失败，请重试"); return; }
      setExportPreview((current) => {
        if (current) URL.revokeObjectURL(current.url);
        return {
          url: URL.createObjectURL(blob),
          filename: `歌词拆解-${new Date().toISOString().slice(0, 10)}.png`,
        };
      });
    }, "image/png");
  }

  return (
    <main className="app-shell">
      <header className="masthead">
        <div>
          <p className="eyebrow"><BookOpen size={14} /> Japanese lyric lab</p>
          <h1>歌词拆解</h1>
          <p className="subtitle">从喜欢的一句歌开始，慢慢读懂日语。</p>
        </div>
        <div className="header-actions">
          <button className="about-button" onClick={() => setAboutOpen(true)}><Info size={15} /> 关于本站</button>
          {capabilities.aiConfigured ? <label className="advanced-toggle">
            <span className="toggle-label"><Sparkles size={15} /><span>释义和解析</span></span>
            <input type="checkbox" checked={aiEnabled} onChange={(event) => { setAiEnabled(event.target.checked); setSelected(null); }} />
            <span className="toggle-track" aria-hidden="true"><span /></span>
          </label> : capabilities.aiConfigured === false && (capabilities.repositoryUrl ?
            <a className="deployment-link" href={capabilities.repositoryUrl} target="_blank" rel="noreferrer"><Github size={15} /> 自行部署启用 AI</a> :
            <span className="deployment-status"><Github size={15} /> 基础开源版</span>)}
        </div>
      </header>

      <section className="workbench">
        <aside className="input-panel">
          <div className="section-heading"><div><span className="step">01</span><h2>输入文本</h2></div><span>每行一句</span></div>
          <textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="粘贴日语歌词或其他日语文本……" aria-label="日语文本" />
          <div className="button-row">
            <button className="primary-button" onClick={runAnalysis} disabled={isAnalyzing}>
              {isAnalyzing ? <LoaderCircle className="spin" size={17} /> : <Sparkles size={17} />} {isAnalyzing ? "分析中" : "开始拆解"}
            </button>
            <button className="icon-button" onClick={() => fileInput.current?.click()} aria-label="上传 TXT" title="上传 TXT"><Upload size={17} /></button>
            <button className="icon-button" onClick={() => { setText(sample); setLines([]); setSelected(null); setMessage("已恢复示例"); }} aria-label="恢复示例" title="恢复示例"><RotateCcw size={17} /></button>
            <input ref={fileInput} type="file" accept=".txt,text/plain" onChange={handleFile} hidden />
          </div>
          <div className="song-search">
            <div className="search-label"><Search size={15} /><span>从歌曲导入歌词</span><em>LRCLIB</em></div>
            <div className="search-fields"><input value={track} onChange={(event) => setTrack(event.target.value)} placeholder="歌名（可选）" aria-label="歌名" /><input value={artist} onChange={(event) => setArtist(event.target.value)} placeholder="歌手（可选）" aria-label="歌手" /></div>
            <button className="search-button" onClick={searchLyrics} disabled={searchingLyrics}>{searchingLyrics ? <LoaderCircle className="spin" size={15} /> : <Search size={15} />} 搜索带歌词的版本</button>
            {searchResults.length > 0 && <div className="search-results">{searchResults.map((result) => <button key={result.id} className="search-result" onClick={() => { setText(result.lyrics); setLines([]); setSearchResults([]); setMessage(`已导入：${result.trackName}`); }}><strong>{result.trackName}</strong><span>{result.artistName}{result.albumName ? ` · ${result.albumName}` : ""}</span></button>)}</div>}
          </div>
        </aside>

        <section className="results-panel" aria-live="polite">
          <div className="section-heading result-title"><div><span className="step">02</span><h2>歌词拆解</h2></div><div className="result-controls"><span>{lines.length ? `${lines.length} 行 · ${tokenCount} 词` : message}</span>{lines.length > 0 && <button className="export-trigger" onClick={openExportMode}><ImageIcon size={14} /> 保存图片</button>}</div></div>
          {exportMode && <div className="export-toolbar"><span>选择要保存的句子</span><button onClick={() => setSelectedLines(selectedLines.size === lines.length ? new Set() : new Set(lines.map((_, index) => index)))}>{selectedLines.size === lines.length ? "取消全选" : "全选"}</button><button className="download-button" onClick={downloadImage} disabled={!selectedLines.size}><ImageIcon size={14} /> 生成 {selectedLines.size ? `${selectedLines.size} 句图片` : "图片"}</button><button className="close-export" onClick={() => setExportMode(false)} title="关闭选择" aria-label="关闭选择"><X size={15} /></button></div>}
          <div className="results-scroll">
            {!lines.length ? (
              <div className="empty-state"><span className="empty-mark">あ</span><h3>准备好后开始拆解</h3><p>结果会按原文、假名和罗马音逐词对齐。</p></div>
            ) : (
              <div className="line-list">
                {lines.map((line, lineIndex) => (
                  <article className={`study-line${exportMode ? " export-selecting" : ""}`} key={`${line.original}-${lineIndex}`}>
                  <div className="line-index">{String(lineIndex + 1).padStart(2, "0")}</div>
                  {exportMode && <label className="line-selector"><input type="checkbox" checked={selectedLines.has(lineIndex)} onChange={() => toggleExportLine(lineIndex)} /><span>选择</span></label>}
                  <div className="original-line" lang="ja">{line.original}</div>
                  <div className="token-flow">
                    {line.tokens.map((token, tokenIndex) => {
                      const key = tokenKey(lineIndex, tokenIndex);
                      return <TokenButton key={key} token={token} active={selected === key} onClick={() => selectToken(lineIndex, tokenIndex)} />;
                    })}
                  </div>
                  {selected?.startsWith(`${lineIndex}-`) && (() => {
                    const tokenIndex = Number(selected.split("-")[1]);
                    const token = line.tokens[tokenIndex];
                    return <div className="token-detail"><div><span>原形</span><strong>{token.baseForm}</strong></div><div><span>词性</span><strong>{token.partOfSpeech}{token.detail ? ` · ${token.detail}` : ""}</strong></div><div><span>释义</span><strong>{getTokenMeaning(lineIndex, tokenIndex)}</strong></div></div>;
                  })()}
                  {aiEnabled && <div className="line-actions">
                    <button className="ai-button" onClick={() => explainLine(lineIndex)} disabled={aiLoading === lineIndex}><Sparkles size={14} /> {aiLoading === lineIndex ? "解析中" : aiResults[lineIndex] ? "重新解析" : "全句解析"}</button>
                    {aiResults[lineIndex]?.explanation && <button className="collapse-button" onClick={() => toggleExplanation(lineIndex)}>{collapsedExplanations.has(lineIndex) ? "展开解析" : "收起解析"}</button>}
                    <span>只发送这一句</span>
                  </div>}
                  {aiError[lineIndex] && <div className="ai-error">{aiError[lineIndex]}</div>}
                  {aiEnabled && aiResults[lineIndex]?.explanation && !collapsedExplanations.has(lineIndex) && <AiPanel explanation={aiResults[lineIndex].explanation!} />}
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </section>
      {exportPreview && <div className="preview-backdrop" role="dialog" aria-modal="true" aria-label="歌词图片预览">
        <div className="preview-dialog">
          <div className="preview-heading"><div><ImageIcon size={16} /><strong>图片预览</strong></div><button onClick={closeExportPreview} aria-label="关闭图片预览" title="关闭图片预览"><X size={17} /></button></div>
          {/* Canvas output is already rasterized; a native image preserves its generated dimensions. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={exportPreview.url} alt="歌词拆解图片预览" />
          <div className="preview-actions"><span>{selectedLines.size} 句 · 高清 PNG</span><a href={exportPreview.url} download={exportPreview.filename}><Download size={15} /> 下载 PNG</a></div>
        </div>
      </div>}
      {aboutOpen && <div className="preview-backdrop" role="dialog" aria-modal="true" aria-label="关于本站">
        <div className="about-dialog">
          <div className="preview-heading"><div><Info size={16} /><strong>关于本站</strong></div><button onClick={() => setAboutOpen(false)} aria-label="关闭关于本站" title="关闭关于本站"><X size={17} /></button></div>
          <div className="about-content">
            <p className="about-intro">从喜欢的歌词开始，通过逐词切分、假名和罗马音对照，降低阅读与演唱日语歌词的门槛。</p>
            <section><h3><Github size={15} /> 开源与 AI</h3>{capabilities.aiConfigured ?
              <p>当前自行部署实例已配置 {capabilities.aiProvider || "AI"}。只有主动点击“全句解析”时，对应句子才会发送给该服务。</p> :
              <><p>当前站点只提供基础拆解，不使用站点运营者的 AI Key。需要释义和解析时，请自行部署开源项目，并在服务器环境变量中选择一种配置：</p>
                <div className="about-config"><code>AI_PROVIDER=deepseek</code><code>DEEPSEEK_API_KEY=你的密钥</code><span>或</span><code>AI_PROVIDER=openai</code><code>OPENAI_API_KEY=你的密钥</code></div>
              </>}
              {capabilities.repositoryUrl && <a className="about-repository" href={capabilities.repositoryUrl} target="_blank" rel="noreferrer"><Github size={14} /> 查看 GitHub 项目</a>}
            </section>
            <section><h3><ShieldCheck size={15} /> 隐私</h3><p>本站不设置用户数据库，不保存输入文本或解析结果。基础拆解在当前部署的服务器上完成；歌词搜索会将歌名或歌手发送至第三方歌曲目录和 LRCLIB。自行部署并启用 AI 后，只有主动解析的句子会发送至所配置的 AI 服务。</p></section>
            <section><h3><Copyright size={15} /> 歌词与版权</h3><p>本站仅面向个人语言学习，不建立公开歌词库。歌词可能由用户输入或来自第三方 LRCLIB；相关文字、歌曲和录音的权利归各自权利人所有。请勿将歌词或导出图片用于未经授权的商业传播。</p></section>
            <p className="about-footnote">公开部署者应补充自己的运营者信息，以及版权投诉、纠错和下架联系渠道。</p>
          </div>
        </div>
      </div>}
    </main>
  );
}

function AiPanel({ explanation }: { explanation: AiExplanation }) {
  return <div className="ai-panel"><div className="ai-heading"><Sparkles size={14} /> AI 整句解析</div>{explanation.summary && <p className="ai-summary">{explanation.summary}</p>}<div className="ai-translations"><div><span>自然翻译</span><strong>{explanation.natural || "—"}</strong></div></div>{explanation.grammar?.length ? <div className="ai-list"><span>语法</span>{explanation.grammar.map((item, index) => <p key={`${item.pattern}-${index}`}><strong>{item.pattern}</strong>{item.explanation}</p>)}</div> : null}{explanation.notes?.length ? <div className="ai-list"><span>表达提示</span>{explanation.notes.map((note) => <p key={note}>{note}</p>)}</div> : null}</div>;
}

function TokenButton({ token, active, onClick }: { token: StudyToken; active: boolean; onClick: () => void }) {
  const punctuation = token.partOfSpeech === "符号";
  return (
    <button className={`word-token${active ? " active" : ""}${punctuation ? " punctuation" : ""}`} onClick={onClick} aria-pressed={active}>
      <span className="word-reading">{token.reading}</span>
      <strong className="word-surface">{token.surface}</strong>
      <span className="word-romaji">{token.romaji}</span>
    </button>
  );
}
