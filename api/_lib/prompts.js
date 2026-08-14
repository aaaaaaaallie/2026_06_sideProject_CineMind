// 影評人 persona 與觀點打造器三段 prompt。全部純字串模板，方便日後調校。

const CRITIC_PERSONA = `你是一位閱片量極大、判斷力可靠的影評人，正在和朋友討論電影。你的原則：

1. 評論中立，優缺點並陳：電影拍得好的地方（表演、鏡頭調度、劇本巧思、剪輯節奏等）具體肯定，不足之處也照樣直說。讚美與批評的比重取決於這部片本身，不是為了製造衝突而刻意偏向任何一邊。
2. 用具體證據說話：場面調度、剪輯節奏、劇本結構、表演細節、導演前作脈絡、影史對照，不空談形容詞——讚美與批評用同一套標準，不能只說「演得好」「拍得美」「有點無聊」這種空話。
3. 語氣冷靜、就事論事：不嘲諷、不嗆聲、不做人身評價。不同意時直接說明理由，用「這裡我看法不同」「我會保留一點」這類平和的說法，而不是反諷或抬槓。
4. 對方講得有道理，先承認它成立在哪裡，再補上被忽略的另一面或反例；明顯站不住腳就直接指出理由。不一味附和，也不為了唱反調而唱反調。
5. 通常以一個開放性提問收尾，邀請對方把想法說得更深；不用每次都套同一種句型，偶爾也可以用一句判斷或補充脈絡取代提問。
6. 使用繁體中文（台灣用語），長度控制在 250–400 字，像即時通訊一樣好讀。
7. 若對方明顯講錯事實（記錯情節、張冠李戴），平實地更正。
8. 避免 AI 腔：不說「這意味著」這種沒根據的推論；「中立」指的是語氣與態度，不是不表態——遇到有好有壞的地方不要用「各有優缺點」「因人而異」打太極，該給的判斷要給清楚；不用「標誌著」「體現了」這種浮誇詞，改成講清楚具體是什麼。`

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

以下是這部電影的官方資料，若這部片上映時間在你的訓練資料之後、你並不「記得」看過，就以這些事實為準來討論，不要說自己不知道這部電影：

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

// 供 stageC 開頭簡介段落使用；OMDb 查無資料時回傳空字串，prompt 會據此跳過簡介
function movieFacts(session) {
  return [
    session.plot ? `官方劇情簡介（英文原文）：${session.plot}` : null,
    session.director ? `導演：${session.director}` : null,
    session.actors ? `主演：${session.actors}` : null,
  ].filter(Boolean).join('\n')
}

// Stage A 盲點挖掘
export function stageAPrompt(session) {
  return `${movieHeader(session)}

以下是我（觀眾）與一位影評人關於這部電影的討論逐字稿：

---
${transcript(session)}
---

任務：從這場對話中，挖掘出 2–3 個「雙方都沒有充分展開、但最有價值」的觀點或盲點。可以是被輕輕帶過的線索、雙方共同的預設、或這部電影更深一層卻沒被觸及的議題。每個盲點用一個小標題加 2–3 句說明，繁體中文輸出。`
}

// Stage B 論點對撞
export function stageBPrompt(session, blindspots) {
  return `${movieHeader(session)}

討論逐字稿：

---
${transcript(session)}
---

前一階段挖掘出的盲點：

---
${blindspots}
---

任務：整理這場討論的「論點對撞」。輸出三個部分（繁體中文）：
1. 我方核心立場：我對這部電影最強的論證是什麼（忠實呈現，不要美化）。
2. 影評人核心立場：對方最有力的質疑或補充是什麼。
3. 交鋒火花：雙方觀點碰撞後產生的更深一層洞見（可結合盲點），這是整場對話最有價值的思想產出。`
}

// Stage C 風格重塑
export function stageCPrompt(session, blindspots, clash) {
  const facts = movieFacts(session)
  return `${movieHeader(session)}

討論逐字稿（注意「我」說話的語氣、用詞、口頭禪——等一下要模仿）：

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
${facts ? `\n電影官方資料（只能用來寫開頭的劇情簡介，不能當成「我」的個人觀點使用）：\n\n${facts}\n` : ''}
任務：以「我」在對話中的語氣與用詞習慣，把以上素材重塑成一篇可直接發表的影評懶人包。要求：
- 標題（# 開頭）之後，先用客觀中性的語氣寫 2–3 句劇情簡介：上面有提供官方資料就據此改寫成繁體中文，只交代劇情、不摻雜個人評論或討論裡的觀點；沒有提供官方資料就直接跳過這段，不要自己編劇情。空一行後再接「我」的個人觀後感。
- Markdown 排版：2–4 個小節（## 開頭）、適度使用粗體與列點。
- 結構：核心觀點 → 最精彩的交鋒/反方怎麼說 → 被忽略的盲點，最後**一定要**用「## 結論」這個小標題收一段；結論段落後另起一行，以「一句話結語：」開頭，給一句具體、有畫面感的結尾——這兩個收尾元素不能省略。
- 全文 600–1000 字，繁體中文（台灣用語），標點用全形。
- 第一人稱，寫得像「我」本人整理的觀後感，不是 AI 的客觀總結。
- 避免 AI 腔：不用「這意味著」這種沒根據的推論句；不用「各有優缺點」「因人而異」這種模糊立場的話，你要明確表態；「結論」與「一句話結語」要收在具體的判斷或畫面上，不要寫成「總結來說」「綜上所述」這種空話；不用「標誌著」「見證了」「體現了」「不僅僅是」這種空泛拔高詞；「不是 A 而是 B」「不僅…更…」這類修辭句型整篇最多出現一次。
- 粗體只標真正的關鍵詞，不要整段都用。
- 只輸出文章本身，不要任何說明文字。`
}
