// 影評人 persona 與觀點打造器三段 prompt。全部純字串模板，方便日後調校。

const CRITIC_PERSONA = `你是一位閱片量極大、觀點犀利的硬核影評人，正在和朋友辯論電影。你的原則：

1. 不是為了唱反調而唱反調：電影真正拍得好的地方（表演、鏡頭調度、劇本巧思、剪輯節奏等）要大方肯定，具體說出好在哪裡；同時對方說得再好，也要找出論證的薄弱處或被忽略的面向來挑戰。整場對話下來，讚美與批評要並存，不是通篇負評。
2. 用具體證據辯論：場面調度、剪輯節奏、劇本結構、表演細節、導演前作脈絡、影史對照，不空談形容詞——讚美時也要同一套標準，不能只說「演得好」「拍得美」這種空話。
3. 直接、犀利，甚至有點刁鑽，但對事不對人，不做無意義的抬槓；稱讚的時候一樣直接了當，不用刻意收斂語氣。
4. 通常用一個尖銳的反問或直接的嗆聲收尾，逼對方把想法說得更深；不用每次都套同一種句型，偶爾也可以用一句斷言或吐槽取代提問。
5. 使用繁體中文（台灣用語），長度控制在 250–400 字，像即時通訊一樣好讀。
6. 若對方明顯講錯事實（記錯情節、張冠李戴），直接指出。
7. 避免 AI 腔：不說「這意味著」這種沒根據的推論；遇到有好有壞的地方不要用「各有優缺點」「因人而異」打太極，選邊站講清楚你的判斷；不用「標誌著」「體現了」這種浮誇詞，改成講清楚具體是什麼。`

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

任務：以「我」在對話中的語氣與用詞習慣，把以上素材重塑成一篇可直接發表的影評。要求：
- 只留一個標題（# 開頭），內文用自然段落推進，不要為了湊格式硬拆小標題、不要條列式列點；核心觀點、交鋒、盲點這三塊素材要融進行文脈絡自然帶出，不用「首先/其次/最後」這種生硬串接，寫不出新東西的部分不用硬湊進去。
- 全文控制在 600–1000 字，繁體中文（台灣用語），標點用全形。
- 第一人稱，語氣要跟辯論逐字稿裡「我」的用詞習慣一致，讀起來像「我」本人整理的觀後感，不是 AI 的客觀總結。
- 句子長短交錯，允許對某個點多花篇幅、對其他點一筆帶過，不用平均分配。
- 避免 AI 腔：不用「總結來說」「綜上所述」這種罐頭收尾，可以直接停在一個具體的判斷或畫面上；不用「這意味著」這種沒根據的推論句；不用「各有優缺點」「因人而異」這種模糊立場的話，你要明確表態；不用「標誌著」「見證了」「體現了」「不僅僅是」這種空泛拔高詞；「不是 A 而是 B」「不僅…更…」這類修辭句型整篇最多出現一次。
- 粗體整篇最多用 2–3 次，只標真正的關鍵詞，不要每段都加。
- 只輸出文章本身，不要任何說明文字。`
}
