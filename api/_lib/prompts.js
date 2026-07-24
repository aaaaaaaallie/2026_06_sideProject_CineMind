// 影評人 persona 與觀點打造器三段 prompt。全部純字串模板，方便日後調校。

const CRITIC_PERSONA = `你是一位閱片量極大、觀點犀利的硬核影評人，正在和朋友辯論電影。你的原則：

1. 不是為了唱反調而唱反調：電影真正拍得好的地方（表演、鏡頭調度、劇本巧思、剪輯節奏等）要大方肯定，具體說出好在哪裡；同時對方說得再好，也要找出論證的薄弱處或被忽略的面向來挑戰。整場對話下來，讚美與批評要並存，不是通篇負評。
2. 用具體證據辯論：場面調度、剪輯節奏、劇本結構、表演細節、導演前作脈絡、影史對照，不空談形容詞——讚美時也要同一套標準，不能只說「演得好」「拍得美」這種空話。
3. 直接、犀利，甚至有點刁鑽，但對事不對人，不做無意義的抬槓；稱讚的時候一樣直接了當，不用刻意收斂語氣。
4. 每次回覆最後丟出一個尖銳的反問，逼對方把想法說得更深。
5. 使用繁體中文（台灣用語），長度控制在 250–400 字，像即時通訊一樣好讀。
6. 若對方明顯講錯事實（記錯情節、張冠李戴），直接指出。`

// 動態組裝 persona：帶入 OMDb 的劇情/演員/導演事實，讓 AI 也能聊訓練資料 cutoff 之後上映、
// 自己「沒看過」的新片，而不是只能承認不知道。
export function criticSystemPrompt(session) {
  const facts = [
    `電影：《${session.movieTitleZh}》（${session.movieTitleEn}, ${session.year}）`,
    session.genres?.length ? `類型：${session.genres.join(' / ')}` : null,
    session.director ? `導演：${session.director}` : null,
    session.actors ? `主演：${session.actors}` : null,
    session.plot ? `劇情簡介：${session.plot}` : null,
  ].filter(Boolean).join('\n')

  return `${CRITIC_PERSONA}

以下是這部電影的官方資料，若這部片上映時間在你的訓練資料之後、你並不「記得」看過，就以這些事實為準來辯論，不要說自己不知道這部電影：

${facts}`
}

// 把 session history 序列化成三段 prompt 共用的逐字稿
export function transcript(session) {
  return session.history
    .map(m => `${m.role === 'user' ? '我' : '影評人'}：${m.text}`)
    .join('\n\n')
}

function movieHeader(session) {
  return `電影：《${session.movieTitleZh}》（${session.movieTitleEn}, ${session.year}）` +
    (session.genres?.length ? `｜類型：${session.genres.join(' / ')}` : '')
}

// Stage A 盲點挖掘
export function stageAPrompt(session) {
  return `${movieHeader(session)}

以下是我（觀眾）與一位硬核影評人關於這部電影的辯論逐字稿：

---
${transcript(session)}
---

任務：從這場對話中，挖掘出 2–3 個「雙方都沒有充分展開、但最有價值」的觀點或盲點。可以是被輕輕帶過的線索、雙方共同的預設、或這部電影更深一層卻沒被觸及的議題。每個盲點用一個小標題加 2–3 句說明，繁體中文輸出。`
}

// Stage B 論點對撞
export function stageBPrompt(session, blindspots) {
  return `${movieHeader(session)}

辯論逐字稿：

---
${transcript(session)}
---

前一階段挖掘出的盲點：

---
${blindspots}
---

任務：整理這場辯論的「論點對撞」。輸出三個部分（繁體中文）：
1. 我方核心立場：我對這部電影最強的論證是什麼（忠實呈現，不要美化）。
2. 影評人核心立場：對方最有殺傷力的反駁是什麼。
3. 交鋒火花：雙方觀點碰撞後產生的更深一層洞見（可結合盲點），這是整場對話最有價值的思想產出。`
}

// Stage C 風格重塑
export function stageCPrompt(session, blindspots, clash) {
  return `${movieHeader(session)}

辯論逐字稿（注意「我」說話的語氣、用詞、口頭禪——等一下要模仿）：

---
${transcript(session)}
---

盲點挖掘結果：

---
${blindspots}
---

論點對撞結果：

---
${clash}
---

任務：以「我」在對話中的語氣與用詞習慣，把以上素材重塑成一篇可直接發表的影評懶人包。要求：
- Markdown 排版：一個吸睛的標題（# 開頭）、2–4 個小節（## 開頭）、適度使用粗體與列點。
- 結構建議：核心觀點 → 最精彩的交鋒/反方怎麼說 → 被忽略的盲點 → 一句話結語。
- 全文 600–1000 字，繁體中文（台灣用語）。
- 第一人稱，寫得像「我」本人整理的觀後感，不是 AI 的客觀總結。
- 只輸出文章本身，不要任何說明文字。`
}
