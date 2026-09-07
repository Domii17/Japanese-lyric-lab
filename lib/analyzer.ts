import Kuroshiro from "kuroshiro";
import KuromojiAnalyzer, { type KuromojiToken } from "kuroshiro-analyzer-kuromoji";

export type StudyToken = {
  surface: string;
  reading: string;
  romaji: string;
  baseForm: string;
  partOfSpeech: string;
  detail: string;
  meaning?: string;
  source?: "local" | "dictionary";
};

export type StudyLine = { original: string; tokens: StudyToken[] };

const localMeanings: Record<string, string> = {
  は: "提示主题；作助词时读 wa",
  が: "标记主语或强调对象",
  を: "标记动作的对象；读 o",
  に: "表示目标、时间、位置或变化结果",
  で: "表示地点、手段、原因或状态",
  の: "表示所属、修饰，相当于“的”",
  も: "也；连……都",
  と: "和；与；引用内容",
  へ: "表示方向；作助词时读 e",
  から: "从……；因为……",
  まで: "到……为止",
  だけ: "只有；仅仅",
  ない: "没有；否定形式",
  いる: "存在；也用于表示动作持续",
  ある: "有；存在（多用于无生命事物）",
  する: "做；进行",
  なる: "成为；变得",
  欲しい: "想要；接て形时表示希望别人做",
  東京: "东京",
  毎晩: "每晚",
  最近: "最近",
  将来: "将来",
  結婚: "结婚",
  帰る: "回去；回家",
  愛す: "爱",
  無い: "没有",
  報酬: "报酬；收入",
  何: "什么",
  匂い: "气味；气息",
  大変: "严重；不得了",
  絶頂: "顶点；高潮",
  マーシャル: "Marshall 吉他音箱品牌",
  入社後: "入职以后（入社＋後）",
  並行線: "平行线；也可比喻没有进展",
  愛せど: "虽然爱着（愛せる＋ど）",
  飛んじゃって: "不由得飞起或兴奋起来（飛ぶ＋てしまう的口语）",
  達して居る: "正达到；处于达到的状态（達す＋ている）",
};

const posLabels: Record<string, string> = {
  名詞: "名词",
  動詞: "动词",
  形容詞: "形容词",
  助詞: "助词",
  助動詞: "助动词",
  副詞: "副词",
  連体詞: "连体词",
  接続詞: "接续词",
  感動詞: "感叹词",
  記号: "符号",
  フィラー: "填充词",
  その他: "其他",
};

let analyzerPromise: Promise<KuromojiAnalyzer> | null = null;

function getAnalyzer() {
  if (!analyzerPromise) {
    const analyzer = new KuromojiAnalyzer();
    analyzerPromise = analyzer.init().then(() => analyzer);
  }
  return analyzerPromise;
}

function toHiragana(value: string) {
  return value.replace(/[ァ-ヶ]/g, (character) =>
    String.fromCharCode(character.charCodeAt(0) - 0x60),
  );
}

const japaneseGlyphVariants: Record<string, string> = {
  亞: "亜", 惡: "悪", 壓: "圧", 圍: "囲", 爲: "為", 醫: "医", 壹: "壱",
  榮: "栄", 衞: "衛", 驛: "駅", 圓: "円", 緣: "縁", 艷: "艶", 鹽: "塩",
  奧: "奥", 應: "応", 櫻: "桜", 假: "仮", 價: "価", 畫: "画", 會: "会",
  壞: "壊", 懷: "懐", 樂: "楽", 渴: "渇", 卷: "巻", 陷: "陥", 勸: "勧",
  寬: "寛", 關: "関", 歡: "歓", 觀: "観", 顏: "顔", 歸: "帰", 氣: "気",
  龜: "亀", 戲: "戯", 犧: "犠", 舊: "旧", 據: "拠", 擧: "挙", 峽: "峡",
  挾: "挟", 狹: "狭", 鄕: "郷", 曉: "暁", 區: "区", 驅: "駆", 勳: "勲",
  惠: "恵", 揭: "掲", 溪: "渓", 經: "経", 繼: "継", 莖: "茎", 螢: "蛍",
  輕: "軽", 鷄: "鶏", 藝: "芸", 擊: "撃", 缺: "欠", 儉: "倹", 劍: "剣",
  圈: "圏", 檢: "検", 權: "権", 獻: "献", 縣: "県", 險: "険", 顯: "顕",
  驗: "験", 嚴: "厳", 廣: "広", 黃: "黄", 國: "国", 黑: "黒", 碎: "砕",
  雜: "雑", 參: "参", 慘: "惨", 絲: "糸", 齒: "歯", 兒: "児", 辭: "辞",
  濕: "湿", 實: "実", 寫: "写", 釋: "釈", 壽: "寿", 收: "収", 從: "従",
  澁: "渋", 獸: "獣", 縱: "縦", 處: "処", 敍: "叙", 將: "将", 燒: "焼",
  乘: "乗", 淨: "浄", 剩: "剰", 疊: "畳", 孃: "嬢", 條: "条", 讓: "譲",
  釀: "醸", 觸: "触", 囑: "嘱", 寢: "寝", 愼: "慎", 眞: "真", 盡: "尽",
  圖: "図", 粹: "粋", 醉: "酔", 隨: "随", 髓: "髄", 數: "数", 樞: "枢",
  聲: "声", 齊: "斉", 靜: "静", 竊: "窃", 攝: "摂", 專: "専", 戰: "戦",
  淺: "浅", 潛: "潜", 纖: "繊", 踐: "践", 錢: "銭", 禪: "禅", 曾: "曽",
  雙: "双", 壯: "壮", 搜: "捜", 插: "挿", 巢: "巣", 爭: "争", 瘦: "痩",
  總: "総", 莊: "荘", 裝: "装", 騷: "騒", 增: "増", 臟: "臓", 藏: "蔵",
  屬: "属", 續: "続", 墮: "堕", 體: "体", 對: "対", 帶: "帯", 滯: "滞",
  臺: "台", 瀧: "滝", 擇: "択", 澤: "沢", 單: "単", 團: "団", 彈: "弾",
  斷: "断", 遲: "遅", 晝: "昼", 蟲: "虫", 鑄: "鋳", 廳: "庁", 徵: "徴",
  聽: "聴", 鎭: "鎮", 轉: "転", 傳: "伝", 燈: "灯", 當: "当", 黨: "党",
  盜: "盗", 稻: "稲", 鬪: "闘", 德: "徳", 獨: "独", 讀: "読", 屆: "届",
  貳: "弐", 惱: "悩", 腦: "脳", 覇: "覇", 廢: "廃", 拜: "拝", 賣: "売",
  麥: "麦", 發: "発", 髮: "髪", 拔: "抜", 蠻: "蛮", 祕: "秘", 濱: "浜",
  拂: "払", 佛: "仏", 竝: "並", 邊: "辺", 變: "変", 辨: "弁", 舖: "舗",
  穗: "穂", 寶: "宝", 豐: "豊", 褒: "褒", 萬: "万", 滿: "満", 默: "黙",
  譯: "訳", 藥: "薬", 與: "与", 豫: "予", 餘: "余", 譽: "誉", 搖: "揺",
  樣: "様", 謠: "謡", 來: "来", 賴: "頼", 亂: "乱", 覽: "覧", 龍: "竜",
  兩: "両", 獵: "猟", 綠: "緑", 鄰: "隣", 淚: "涙", 壘: "塁", 禮: "礼",
  勵: "励", 靈: "霊", 齡: "齢", 曆: "暦", 歷: "歴", 戀: "恋", 爐: "炉",
  勞: "労", 樓: "楼", 灣: "湾",
};

function normalizeJapaneseText(value: string) {
  return [...value.normalize("NFKC")]
    .filter((character) => !/[\u200B-\u200D\u2060\uFE00-\uFE0F\uFEFF\u{E0100}-\u{E01EF}]/u.test(character))
    .map((character) => japaneseGlyphVariants[character] || character)
    .join("");
}

const digitReadings: Record<string, string> = {
  "0": "ぜろ",
  "1": "いち",
  "2": "に",
  "3": "さん",
  "4": "よん",
  "5": "ご",
  "6": "ろく",
  "7": "なな",
  "8": "はち",
  "9": "きゅう",
};

function readUnderTenThousand(value: number) {
  if (!value) return "";
  const thousands = Math.floor(value / 1000);
  const hundreds = Math.floor((value % 1000) / 100);
  const tens = Math.floor((value % 100) / 10);
  const ones = value % 10;
  const thousandReading = ["", "せん", "にせん", "さんぜん", "よんせん", "ごせん", "ろくせん", "ななせん", "はっせん", "きゅうせん"][thousands];
  const hundredReading = ["", "ひゃく", "にひゃく", "さんびゃく", "よんひゃく", "ごひゃく", "ろっぴゃく", "ななひゃく", "はっぴゃく", "きゅうひゃく"][hundreds];
  const tenReading = tens ? `${tens === 1 ? "" : digitReadings[String(tens)]}じゅう` : "";
  const oneReading = ones ? digitReadings[String(ones)] : "";
  return `${thousandReading}${hundredReading}${tenReading}${oneReading}`;
}

function readNumber(value: string) {
  if (value === "0") return digitReadings["0"];
  if (value === "19") return "じゅうく";
  if (value.length > 1 && value.startsWith("0")) {
    return [...value].map((digit) => digitReadings[digit]).join("");
  }
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number >= 1_0000_0000_0000) {
    return [...value].map((digit) => digitReadings[digit]).join("");
  }
  const oku = Math.floor(number / 1_0000_0000);
  const man = Math.floor((number % 1_0000_0000) / 1_0000);
  const remainder = number % 1_0000;
  return `${oku ? `${readUnderTenThousand(oku)}おく` : ""}${man ? `${readUnderTenThousand(man)}まん` : ""}${readUnderTenThousand(remainder)}`;
}

function addDigitReadings(value: string) {
  return value
    .replace(/[０-９]/g, (digit) => String(digit.charCodeAt(0) - 0xfee0))
    .replace(/[0-9]+/g, (digits) => readNumber(digits));
}

function normalizeRomaji(value: string) {
  return value.replace(/ou|oo/g, "ō").replace(/uu/g, "ū");
}

function normalizeToken(token: KuromojiToken): StudyToken {
  // Kuromoji sometimes leaves ASCII numbers unchanged. Full-width model
  // numbers are already tokenized digit by digit, while ordinary numbers use
  // their natural Japanese reading here.
  const reading = addDigitReadings(toHiragana(token.reading || token.surface_form));
  const baseForm = token.basic_form === "*" ? token.surface_form : token.basic_form;
  const meaning = localMeanings[baseForm] || localMeanings[token.surface_form];
  const particleRomaji: Record<string, string> = { は: "wa", へ: "e", を: "o" };
  return {
    surface: token.surface_form,
    reading,
    romaji: token.pos === "助詞" && particleRomaji[token.surface_form]
      ? particleRomaji[token.surface_form]
      : normalizeRomaji(Kuroshiro.Util.kanaToRomaji(reading)),
    baseForm,
    partOfSpeech: posLabels[token.pos] || token.pos,
    detail: token.pos_detail_1 === "*" ? "" : token.pos_detail_1,
    meaning,
    source: meaning ? "local" : undefined,
  };
}

function combine(parts: StudyToken[], partOfSpeech?: string): StudyToken {
  const surface = parts.map((part) => part.surface).join("");
  const reading = parts.map((part) => part.reading).join("");
  const meaning = localMeanings[surface] || parts[0].meaning;
  return {
    surface,
    reading,
    romaji: normalizeRomaji(Kuroshiro.Util.kanaToRomaji(reading, "hepburn")),
    baseForm: parts[0].baseForm,
    partOfSpeech: partOfSpeech || parts[0].partOfSpeech,
    detail: parts.map((part) => part.surface).join("＋"),
    meaning,
    source: meaning ? "local" : undefined,
  };
}

function mergeStudyUnits(tokens: StudyToken[]) {
  const units: StudyToken[] = [];
  for (let index = 0; index < tokens.length; index += 1) {
    const current = tokens[index];
    if (current.detail === "接尾" && units.length && units.at(-1)?.partOfSpeech !== "助词") {
      units[units.length - 1] = combine([units.at(-1)!, current]);
      continue;
    }
    if (["动词", "形容词"].includes(current.partOfSpeech)) {
      const parts = [current];
      while (tokens[index + 1]) {
        const next = tokens[index + 1];
        const grammaticalEnding = next.partOfSpeech === "助动词" || next.detail === "接続助詞" || ["じゃ", "って"].includes(next.surface);
        const continuousVerb = /[てで]$/.test(parts.at(-1)!.surface) && ["居る", "いる", "有る", "ある", "仕舞う", "しまう"].includes(next.baseForm);
        if (!grammaticalEnding && !continuousVerb) break;
        parts.push(next); index += 1;
      }
      units.push(parts.length > 1 ? combine(parts, "动词短语") : current);
      continue;
    }
    units.push(current);
  }
  return units;
}

export async function analyzeText(text: string): Promise<StudyLine[]> {
  const analyzer = await getAnalyzer();
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  return Promise.all(
    lines.map(async (original) => ({
      original,
      tokens: mergeStudyUnits((await analyzer.parse(normalizeJapaneseText(original))).map(normalizeToken)),
    })),
  );
}
