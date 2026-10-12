const CHARSETS = {
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lower: "abcdefghijklmnopqrstuvwxyz",
  digit: "0123456789",
  symbol: "!@#$%^&*()-_=+[]{};:,.<>?/~"
};

const $ = (id) => document.getElementById(id);
const el = {
  length: $("length"),
  useSymbols: $("useSymbols"),
  minUpper: $("minUpper"),
  minLower: $("minLower"),
  minDigit: $("minDigit"),
  minSymbol: $("minSymbol"),
  symbolRow: $("symbolRow"),
  error: $("error"),
  result: $("result"),
  status: $("status"),
  generateBtn: $("generateBtn"),
  copyBtn: $("copyBtn")
};

/** 暗号論的に安全な乱数で 0 以上 max 未満の整数を返す(偏りなし) */
function secureRandomInt(max) {
  const limit = Math.floor(0x100000000 / max) * max;
  const buf = new Uint32Array(1);
  do {
    crypto.getRandomValues(buf);
  } while (buf[0] >= limit);
  return buf[0] % max;
}

function pickChars(charset, count) {
  let out = [];
  for (let i = 0; i < count; i++) {
    out.push(charset[secureRandomInt(charset.length)]);
  }
  return out;
}

/** Fisher–Yates シャッフル */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** 入力値の読み取り・検証。問題があれば error にメッセージを入れる */
function readSettings() {
  const length = Number(el.length.value);
  const useSymbols = el.useSymbols.checked;
  const mins = {
    upper: Number(el.minUpper.value),
    lower: Number(el.minLower.value),
    digit: Number(el.minDigit.value),
    symbol: useSymbols ? Number(el.minSymbol.value) : 0
  };

  if (!Number.isInteger(length) || length < 1) {
    return { error: "文字列の長さは1以上の整数で指定してください。" };
  }
  if (length > 256) {
    return { error: "文字列の長さは256以下で指定してください。" };
  }
  for (const v of Object.values(mins)) {
    if (!Number.isInteger(v) || v < 0) {
      return { error: "最低文字数は0以上の整数で指定してください。" };
    }
  }

  const total = mins.upper + mins.lower + mins.digit + mins.symbol;
  if (total > length) {
    return {
      error: `最低文字数の合計(${total})が文字列の長さ(${length})を超えています。`
    };
  }
  return { length, useSymbols, mins };
}

function generate({ length, useSymbols, mins }) {
  const chars = [
    ...pickChars(CHARSETS.upper, mins.upper),
    ...pickChars(CHARSETS.lower, mins.lower),
    ...pickChars(CHARSETS.digit, mins.digit),
    ...pickChars(CHARSETS.symbol, mins.symbol)
  ];

  // 残りは使用可能な全文字種からランダムに補充
  let pool = CHARSETS.upper + CHARSETS.lower + CHARSETS.digit;
  if (useSymbols) pool += CHARSETS.symbol;
  chars.push(...pickChars(pool, length - chars.length));

  return shuffle(chars).join("");
}

function showError(msg) {
  el.error.textContent = msg;
  el.error.hidden = false;
  el.status.textContent = "";
}

function clearError() {
  el.error.hidden = true;
  el.error.textContent = "";
}

el.generateBtn.addEventListener("click", () => {
  el.status.textContent = "";
  const settings = readSettings();
  if (settings.error) {
    showError(settings.error);
    return;
  }
  clearError();
  el.result.value = generate(settings);
});

el.copyBtn.addEventListener("click", async () => {
  const text = el.result.value;
  if (!text) {
    showError("コピーする文字列がありません。先に生成してください。");
    return;
  }
  clearError();
  try {
    await navigator.clipboard.writeText(text);
  } catch (e) {
    // フォールバック
    el.result.select();
    document.execCommand("copy");
    el.result.setSelectionRange(0, 0);
  }
  el.status.textContent = "クリップボードにコピーしました。";
  setTimeout(() => (el.status.textContent = ""), 2000);
});

// 特殊文字のON/OFFに応じて、特殊文字の最低数入力を無効化
el.useSymbols.addEventListener("change", () => {
  const on = el.useSymbols.checked;
  el.minSymbol.disabled = !on;
  el.symbolRow.classList.toggle("disabled", !on);
});

// 設定を変更したらエラー表示を更新(リアルタイムで合計超過に気づけるように)
[el.length, el.minUpper, el.minLower, el.minDigit, el.minSymbol, el.useSymbols].forEach((input) => {
  input.addEventListener("input", () => {
    const s = readSettings();
    if (s.error) showError(s.error);
    else clearError();
  });
});
