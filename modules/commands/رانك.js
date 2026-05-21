// ╔══════════════════════════════════════════╗
// ║              🌌 REM RANK SYSTEM 🌌        ║
// ╚══════════════════════════════════════════╝

const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

const {
  addUserBeatrix,
  getUserBeatrix
} = require("../../database/controllers/beatrix.controllers");

// ══════════════════════════════════════════
// CONFIG
// ══════════════════════════════════════════
module.exports.config = {
  name: "رانك",
  version: "16.7.0",
  hasPermssion: 0,
  credits: "Yamada KJ / Abdou",
  description: "نظام رانك احترافي أسطوري مع شريط أبيض ولقب ناصع وتحديث جماعي وترقيات مضافة",
  commandCategory: "اقتصاد",
  usages: "[ترقية/كنية/بحث/خلفية/جوائز/توب]",
  cooldowns: 5
};

// ══════════════════════════════════════════
// جوائز البيتريكس
// ══════════════════════════════════════════
const BX_MILESTONES = {
  22: 2,
  28: 4,
  35: 10,
  40: 18,
  50: 50,
};

const RANK_SEARCH_PAGE_SIZE = 5;

// ══════════════════════════════════════════
// روابط الخلفيات الافتراضية للبطاقة
// ══════════════════════════════════════════
const backgrounds = [
  "https://i.ibb.co/4n1MtCk2/image-0.jpg",
  "https://i.ibb.co/PX1sBh7/image-0.jpg",
  "https://i.ibb.co/Xky8zpRM/image-1.jpg",
  "https://i.ibb.co/2BMQsrQ/image-2.jpg",
  "https://i.ibb.co/fdQ9WbKp/image-1.jpg",
  "https://i.ibb.co/prRBCxFR/image-2.jpg",
  "https://i.ibb.co/RpHSX08w/image-3.jpg",
  "https://i.ibb.co/GvrMLCBc/image-0.jpg",
  "https://i.ibb.co/0j3Qcz1F/image-1.jpg",
  "https://i.ibb.co/39McybGn/image-2.jpg",
  "https://i.ibb.co/HLdVQH8C/image-3.jpg",
  "https://i.ibb.co/FL762bZb/image-4.jpg",
  "https://i.ibb.co/sJ1ydfPb/image-4.jpg",
];

// ══════════════════════════════════════════
// DATABASE PATHS
// ══════════════════════════════════════════
const USERS_DB_PATH = path.join(process.cwd(), "database", "users.json");
const RANK_BAN_PATH = path.join(process.cwd(), "database", "rank_bans.json");

// ══════════════════════════════════════════
// ألوان الألقاب وتأثيرات التوهج
// ══════════════════════════════════════════
const TS = {
  lvl50:  { color: "#e056fd", glow: "#be2edd" },
  lvl45:  { color: "#eb4d4b", glow: "#ff7979" },
  lvl40:  { color: "#c0392b", glow: "#ff7675" },
  lvl35:  { color: "#e67e22", glow: "#f39c12" },
  lvl30:  { color: "#f1c40f", glow: "#f39c12" },
  lvl25:  { color: "#badc58", glow: "#6ab04c" },
  lvl20:  { color: "#00d2d3", glow: "#48dbfb" },
  lvl15:  { color: "#686de0", glow: "#4834d4" },
  lvl10:  { color: "#95afc0", glow: "#535c68" },
  lvl5:   { color: "#ffffff", glow: "#bdc3c7" },
  lvl1:   { color: "#7f8c8d", glow: "#95a5a6" },

  lvl55:  { color: "#fd79a8", glow: "#e84393" },
  lvl60:  { color: "#a29bfe", glow: "#6c5ce7" },
  lvl65:  { color: "#74b9ff", glow: "#0984e3" },
  lvl70:  { color: "#55efc4", glow: "#00b894" },
  lvl75:  { color: "#ffeaa7", glow: "#fdcb6e" },
  lvl80:  { color: "#ff6b6b", glow: "#d63031" },
  lvl85:  { color: "#a8e6cf", glow: "#27ae60" },
  lvl90:  { color: "#dfe6e9", glow: "#636e72" },
  lvl95:  { color: "#6c5ce7", glow: "#a29bfe" },
  lvl100: { color: "#ffd700", glow: "#ff8c00" },
};

// ══════════════════════════════════════════
// زخارف وتنسيقات الرسائل
// ══════════════════════════════════════════
const searchHelpMsg =
"●─────── ✾ ───────●\n" +
" ⦿ ⟬ بَحْثُ الرَّانك 🔍 ⟭ ⦿\n" +
"┝━━━━━━━━━━━━━━━\n" +
"┇ 💡 بالاسم: رانك بحث احمد\n" +
"┇ 💡 بالآيدي: رانك بحث 100092990...\n" +
"┇ 💡 بالمنشن: رانك بحث @اسم\n" +
"┇ 💡 بالرد: رد على رسالته + رانك بحث\n" +
"┝━━━━━━━━━━━━━━━\n" +
"┇ رد برقم من النتائج لعرض بطاقة الرانك\n" +
"●─────── ✾ ───────●";

const styleHelpMsg =
"●─────── ✾ ───────●\n" +
" ⦿ ⟬ مُتَغَيِّرَاتُ الكُنْيَةِ 🏷️ ⟭ ⦿\n" +
"┝━━━━━━━━━━━━━━━\n" +
"┇ {اسم}     — اسم العضو\n" +
"┇ {يوزر}    — يوزر العضو\n" +
"┇ {اللقب}   — لقب الرانك\n" +
"┇ {لفل}     — مستواه الحالي\n" +
"┇ {جنس}     — جنسه\n" +
"┇ {محفظة}   — رصيد الكاش\n" +
"┇ {بنك}     — رصيد البنك\n" +
"┇ {رصيد}    — إجمالي الفلوس\n" +
"┇ {تحذير}   — عدد تحذيراته\n" +
"┝━━━━━━━━━━━━━━━\n" +
"┇ 💡 مثال:\n" +
"┇ رانك كنية ستايل {اسم} 『{اللقب}』[{لفل}]\n" +
"┇ رانك كنية ستايل {اسم} ⭐ لفل {لفل}\n" +
"┇ رانك كنية ستايل {اللقب} | {لفل} 🔥\n" +
"┝━━━━━━━━━━━━━━━\n" +
"┇ 🗑️ لإزالة الستايل:\n" +
"┇ رانك كنية ستايل مسح\n" +
"●─────── ✾ ───────●";

function nicknameModeMsg(isOn, curStyle) {
  return (
    "●─────── ✾ ───────●\n" +
    " ⦿ ⟬ وضع كنية الرانك 🏷️ ⟭ ⦿\n" +
    "┝━━━━━━━━━━━━━━━\n" +
    `┇ الحالة: ${isOn ? "✅ مفعّل" : "❌ معطّل"}\n` +
    `┇ 🎨 الستايل: ${curStyle || "افتراضي"}\n` +
    "┝━━━━━━━━━━━━━━━\n" +
    "┇ رانك كنية تشغيل ← لتفعيله\n" +
    "┇ رانك كنية ايقاف ← لإيقافه\n" +
    "┇ رانك كنية ستايل ← لضبط الشكل\n" +
    "┇ رانك كنية ضبط   ← لتحديث كنيات الجميع فوراً\n" +
    "●─────── ✾ ───────●"
  );
}

function backgroundSetMsg(isDefault) {
  if (isDefault) {
    return (
      "●─────── ✾ ───────●\n" +
      " ⦿ ⟬ الخَلفيَّةُ الافتراضيَّة 🖼️ ⟭ ⦿\n" +
      "┝━━━━━━━━━━━━━━━\n" +
      "┇ ✅ تم إعادة تعيين الخلفية\n" +
      "┇ 🎲 ستُستخدم خلفية عشوائية الآن\n" +
      "●─────── ✾ ───────●"
    );
  }
  return (
    "●─────── ✾ ───────●\n" +
    " ⦿ ⟬ تَمَّ تَعيينُ الخَلفيَّة 🖼️ ⟭ ⦿\n" +
    "┝━━━━━━━━━━━━━━━\n" +
    "┇ ✅ تم حفظ الخلفية الشخصية\n" +
    "┇ 🎨 ستُستخدم في بطاقة رانكك\n" +
    "┝━━━━━━━━━━━━━━━\n" +
    "┇ 💡 رانك خلفية افتراضي — للإلغاء\n" +
    "●─────── ✾ ───────●"
  );
}

// ══════════════════════════════════════════
// الخلفية الشخصية
// ══════════════════════════════════════════
function getUserBg(uid) {
  try {
    return JSON.parse(
      fs.readFileSync(USERS_DB_PATH, "utf8") || "{}"
    )[String(uid)]?.rankBackground || null;
  } catch {
    return null;
  }
}

function setUserBg(uid, url) {
  try {
    let data = {};
    try {
      data = JSON.parse(fs.readFileSync(USERS_DB_PATH, "utf8") || "{}");
    } catch {}

    if (!data[String(uid)]) data[String(uid)] = {};

    if (url === null)
      delete data[String(uid)].rankBackground;
    else
      data[String(uid)].rankBackground = url;

    fs.ensureDirSync(path.dirname(USERS_DB_PATH));
    fs.writeFileSync(USERS_DB_PATH, JSON.stringify(data, null, 2));
  } catch (e) {
    console.log("[RANK BG ERROR]", e.message);
  }
}

// ══════════════════════════════════════════
// حظر الرانك
// ══════════════════════════════════════════
function isRankBanned(uid) {
  try {
    return JSON.parse(
      fs.readFileSync(RANK_BAN_PATH, "utf8") || "{}"
    )[String(uid)] === true;
  } catch {
    return false;
  }
}

// ══════════════════════════════════════════
// تكلفة الترقية
// ══════════════════════════════════════════
function getUpgradeCost(currentLevel) {
  if (currentLevel < 10) return currentLevel * 1000;
  if (currentLevel < 20) return currentLevel * 2000;
  if (currentLevel < 30) return currentLevel * 3000;
  if (currentLevel < 40) return currentLevel * 4000;
  if (currentLevel < 60) return currentLevel * 5000;
  if (currentLevel < 80) return currentLevel * 7000;
  return currentLevel * 10000;
}

// ══════════════════════════════════════════
// كنية الرانك الافتراضية
// ══════════════════════════════════════════
function buildRankNickname(title, level) {
  return `☬〘${title}〙⌘『${level}』☬`;
}

// ══════════════════════════════════════════
// الكنية المخصصة
// ══════════════════════════════════════════
function buildCustomNickname(template, vars) {
  return template
    .replace(/{اسم}/g, vars.name || "")
    .replace(/{يوزر}/g, vars.vanity || "")
    .replace(/{اللقب}/g, vars.title || "")
    .replace(/{لفل}/g, String(vars.level || 1))
    .replace(/{جنس}/g, vars.gender || "")
    .replace(/{بنك}/g, Number(vars.bank || 0).toLocaleString())
    .replace(/{محفظة}/g, Number(vars.money || 0).toLocaleString())
    .replace(/{رصيد}/g, Number((vars.money || 0) + (vars.bank || 0)).toLocaleString())
    .replace(/{تحذير}/g, String(vars.warns || 0));
}

// ══════════════════════════════════════════
// الألقاب المزخرفة
// ══════════════════════════════════════════
function getRankTitle(level, gender) {
  const f =
    gender === 1 ||
    gender === "FEMALE" ||
    gender === "أنثى" ||
    gender === "Female" ||
    gender === "Nữ";

  if (f) {
    if (level >= 100) return { title: "✦ نَاجِيَةٌ فَوقَ الخَيَال ✦", key: "lvl100", ...TS.lvl100 };
    if (level >= 95)  return { title: "♾️ سَيِّدَةُ الأَبَدِيَّة ♾️", key: "lvl95", ...TS.lvl95 };
    if (level >= 90)  return { title: "⚡ إِلَهَةُ الظَّلَام ⚡", key: "lvl90", ...TS.lvl90 };
    if (level >= 85)  return { title: "🌌 حَاكِمَةُ الكَوْن 🌌", key: "lvl85", ...TS.lvl85 };
    if (level >= 80)  return { title: "🩸 أُسطُورَةُ الدَّم 🩸", key: "lvl80", ...TS.lvl80 };
    if (level >= 75)  return { title: "👑 مَلِكَةُ الآلِهَة 👑", key: "lvl75", ...TS.lvl75 };
    if (level >= 70)  return { title: "💀 سَيِّدَةُ الفَنَاء 💀", key: "lvl70", ...TS.lvl70 };
    if (level >= 65)  return { title: "🌑 أَمِيرَةُ الظَّلَام 🌑", key: "lvl65", ...TS.lvl65 };
    if (level >= 60)  return { title: "🌙 حَارِسَةُ اللَّيل 🌙", key: "lvl60", ...TS.lvl60 };
    if (level >= 55)  return { title: "⚡ سَاحِرَةُ البَرق ⚡", key: "lvl55", ...TS.lvl55 };
    if (level >= 50)  return { title: "آلَنِآجّيَةّ آلَوٌحًيَدٍةّ", key: "lvl50", ...TS.lvl50 };
    if (level >= 45)  return { title: "♧ سيدة الأرواح ♧", key: "lvl45", ...TS.lvl45 };
    if (level >= 40)  return { title: "✧ ملكة الدماء ✧", key: "lvl40", ...TS.lvl40 };
    if (level >= 35)  return { title: "✧ ساحرة الظلام ✧", key: "lvl35", ...TS.lvl35 };
    if (level >= 30)  return { title: "♕ الإمبراطورة ♕", key: "lvl30", ...TS.lvl30 };
    if (level >= 25)  return { title: "★ قائدة الفيلق ★", key: "lvl25", ...TS.lvl25 };
    if (level >= 20)  return { title: "★ قائدة الفرسان ★", key: "lvl20", ...TS.lvl20 };
    if (level >= 15)  return { title: "★ الفارسة المقدسة ★", key: "lvl15", ...TS.lvl15 };
    if (level >= 10)  return { title: "★ الفارسة ★", key: "lvl10", ...TS.lvl10 };
    if (level >= 5)   return { title: "✦ المتدربة ✦", key: "lvl5", ...TS.lvl5 };
    return { title: "✦ المستجدة الصاعدة ✦", key: "lvl1", ...TS.lvl1 };
  } else {
    if (level >= 100) return { title: "✦ نَاجٍ فَوقَ الخَيَال ✦", key: "lvl100", ...TS.lvl100 };
    if (level >= 95)  return { title: "♾️ سَيِّدُ الأَبَدِيَّة ♾️", key: "lvl95", ...TS.lvl95 };
    if (level >= 90)  return { title: "⚡ إِلَهُ الظَّلَام ⚡", key: "lvl90", ...TS.lvl90 };
    if (level >= 85)  return { title: "🌌 حَاكِمُ الكَوْن 🌌", key: "lvl85", ...TS.lvl85 };
    if (level >= 80)  return { title: "🩸 أُسطُورَةُ الدَّم 🩸", key: "lvl80", ...TS.lvl80 };
    if (level >= 75)  return { title: "👑 مَلِكُ الآلِهَة 👑", key: "lvl75", ...TS.lvl75 };
    if (level >= 70)  return { title: "💀 سَيِّدُ الفَنَاء 💀", key: "lvl70", ...TS.lvl70 };
    if (level >= 65)  return { title: "🌑 أَمِيرُ الظَّلَام 🌑", key: "lvl65", ...TS.lvl65 };
    if (level >= 60)  return { title: "🌙 حَارِسُ اللَّيل 🌙", key: "lvl60", ...TS.lvl60 };
    if (level >= 55)  return { title: "⚡ سَاحِرُ البَرق ⚡", key: "lvl55", ...TS.lvl55 };
    if (level >= 50)  return { title: "آلَنِآجّيَ آلَوٌحًيَدٍ", key: "lvl50", ...TS.lvl50 };
    if (level >= 45)  return { title: "♧ سيد الأرواح ♧", key: "lvl45", ...TS.lvl45 };
    if (level >= 40)  return { title: "✧ ملك الدماء ✧", key: "lvl40", ...TS.lvl40 };
    if (level >= 35)  return { title: "✧ ساحر الظلام ✧", key: "lvl35", ...TS.lvl35 };
    if (level >= 30)  return { title: "♕ الإمبراطور ♕", key: "lvl30", ...TS.lvl30 };
    if (level >= 25)  return { title: "★ قائد الفيلق ★", key: "lvl25", ...TS.lvl25 };
    if (level >= 20)  return { title: "★ قائد الفرسان ★", key: "lvl20", ...TS.lvl20 };
    if (level >= 15)  return { title: "★ الفارس المقدس ★", key: "lvl15", ...TS.lvl15 };
    if (level >= 10)  return { title: "★ الفارس ★", key: "lvl10", ...TS.lvl10 };
    if (level >= 5)   return { title: "✦ المتدرب ✦", key: "lvl5", ...TS.lvl5 };
    return { title: "✦ مستجد الصاعد ✦", key: "lvl1", ...TS.lvl1 };
  }
}

// ══════════════════════════════════════════
// تحميل صورة
// ══════════════════════════════════════════
async function loadImg(url) {
  try {
    const res = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 10000,
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    if (!res.headers["content-type"]?.includes("image"))
      return null;

    const tmp = path.join(process.cwd(), "cache", `tmp_${Date.now()}.png`);
    fs.ensureDirSync(path.dirname(tmp));
    fs.writeFileSync(tmp, Buffer.from(res.data));

    const img = await loadImage(tmp);
    fs.remove(tmp).catch(() => {});
    return img;
  } catch {
    return null;
  }
}

// ══════════════════════════════════════════
// أدوات الرسم
// ══════════════════════════════════════════
function circle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.closePath();
}

function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ══════════════════════════════════════════
// بناء بطاقة الرانك
// ══════════════════════════════════════════
async function buildRankCard({
  targetID,
  name,
  level,
  exp,
  levelUpExp,
  money,
  rankText,
  rankInfo,
  customBg
}) {
  const W = 900;
  const H = 500;

  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  const bgUrl = customBg || backgrounds[Math.floor(Math.random() * backgrounds.length)];
  const bg = await loadImg(bgUrl);

  if (bg) {
    ctx.drawImage(bg, 0, 0, W, H);
  } else {
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, "#0f0c29");
    g.addColorStop(0.5, "#302b63");
    g.addColorStop(1, "#24243e");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  const overlay = ctx.createLinearGradient(0, 0, 0, H);
  overlay.addColorStop(0, "rgba(0,0,0,0.4)");
  overlay.addColorStop(1, "rgba(0,0,0,0.92)");
  ctx.fillStyle = overlay;
  ctx.fillRect(0, 0, W, H);

  // إحداثيات صورة البروفايل (أفاتار) في مكانها الدقيق والمحدد
  const ax = 150;
  const ay = 230;
  const r = 100;

  const avatar = await loadImg(`https://graph.facebook.com/${targetID}/picture?height=512&width=512`);

  if (avatar) {
    ctx.save();
    circle(ctx, ax, ay, r);
    ctx.clip();
    ctx.drawImage(avatar, ax - r, ay - r, r * 2, r * 2);
    ctx.restore();
  }

  // التوهج والإطار حول الأفاتار باللون الخاص باللفل لجمالية التصميم
  ctx.strokeStyle = rankInfo.color;
  ctx.lineWidth = 7;
  ctx.shadowColor = rankInfo.glow;
  ctx.shadowBlur = 30;

  circle(ctx, ax, ay, r);
  ctx.stroke();
  ctx.shadowBlur = 0; // تصفير التوهج حتى لا يؤثر على النصوص

  // رسم اسم المستخدم
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 44px Arial";
  ctx.fillText(name, 300, 110);

  // [تعديل]: جعل اللقب باللون الأبيض الناصع بناءً على طلبك
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 30px Arial";
  ctx.fillText(rankInfo.title, 300, 165);

  // رسم اللفل الحالي
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 34px Arial";
  ctx.fillText(`LEVEL ${level}`, 300, 235);

  // خلفية شريط الخبرة (شفافة وخلفية)
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  rrect(ctx, 300, 270, 470, 38, 18);
  ctx.fill();

  // [تعديل]: شريط الخبرة باللون الأبيض الناصع المتوهج
  const progress = Math.min(exp / levelUpExp, 1);
  ctx.fillStyle = "#ffffff"; 
  ctx.save();
  ctx.shadowColor = rankInfo.glow; // الحفاظ على توهج اللفل مع اللون الأبيض للشريط
  ctx.shadowBlur = 15;
  rrect(ctx, 300, 270, 470 * progress, 38, 18);
  ctx.fill();
  ctx.restore();

  // نص نقاط الخبرة XP
  ctx.fillStyle = "#ffffff";
  ctx.font = "20px Arial";
  ctx.fillText(`${exp} / ${levelUpExp} XP`, 300, 330);

  // رسم رصيد المال الإجمالي
  ctx.fillStyle = "#ffcc00";
  ctx.font = "bold 32px Arial";
  ctx.fillText(`$ ${money.toLocaleString()}`, 300, 400);

  // رسم الترتيب الحالي في المجموعة
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 24px Arial";
  ctx.fillText(`RANK ${rankText}`, 700, 70);

  return canvas.toBuffer("image/png");
}

// ══════════════════════════════════════════
// RUN
// ══════════════════════════════════════════
module.exports.run = async function({ api, event, args, Users, Economy, Exp, Threads }) {
  const { threadID, messageID, senderID, mentions } = event;
  const body = event.body || "";

  try {
    const sub = args[0]?.toLowerCase();

    // ══════════════════════════════════════
    // ترقية (الميزة الجديدة والمطلوبة)
    // ══════════════════════════════════════
    if (sub === "ترقية") {
      const xpData = await Exp.check(senderID);
      const currentLevel = xpData?.data?.currentLevel || 1;
      const costPerLevel = 20000;

      // الحالة 1: رانك ترقية [عدد] - تنفيذ شراء المستويات
      if (args[1] && !isNaN(args[1])) {
        const levelsToBuy = parseInt(args[1]);
        if (levelsToBuy <= 0) {
          return api.sendMessage("⚠️ | يرجى تحديد عدد مستويات صحيح أكبر من صفر للترقية!", threadID, messageID);
        }

        const totalCost = levelsToBuy * costPerLevel;
        const bankBalanceR = await Economy.getBalance(senderID, "bank");
        const bankBalance = (typeof bankBalanceR === "number" ? bankBalanceR : bankBalanceR?.data || 0);

        if (bankBalance < totalCost) {
          return api.sendMessage(`❌ | رصيدك في البنك غير كافٍ!\n💰 تكلفة ترقية [ ${levelsToBuy} ] مستويات هي: ${totalCost.toLocaleString()} $\n🏦 رصيدك الحالي في البنك: ${bankBalance.toLocaleString()} $`, threadID, messageID);
        }

        // الخصم من البنك وإضافة المستويات
        await Economy.decrease(totalCost, senderID, "bank");

        // تعديل البيانات محلياً في ملف الخبرة الخاص بالسورس عبر النواة
        const nextLevel = currentLevel + levelsToBuy;

        // جلب ملف النواة وتحديث الحقلين المستهدفين للخبرة واللفل
        if (global.data && typeof global.data.exp === "object") {
          if (!global.data.exp[senderID]) global.data.exp[senderID] = { exp: 0, currentLevel: 1 };
          global.data.exp[senderID].currentLevel = nextLevel;
          global.data.exp[senderID].exp = 0; // تصفير الخبرة الحالية عند الترقية المدفوعة
        }

        // حفظ ملف الـ exp.json في قاعدة البيانات إن أمكن، أو الاعتماد على الحفظ التلقائي للـ controller
        try {
          const EXP_FILE = path.join(process.cwd(), "database", "exp.json");
          if (fs.existsSync(EXP_FILE)) {
            let fileData = fs.readJsonSync(EXP_FILE);
            if (!fileData[senderID]) fileData[senderID] = {};
            fileData[senderID].currentLevel = nextLevel;
            fileData[senderID].exp = 0;
            fs.writeJsonSync(EXP_FILE, fileData, { spaces: 2 });
          }
        } catch(e) { console.log(e); }

        let ui = {};
        try {
          const r = await Users.find(senderID);
          if (r?.data?.data) ui = r.data.data;
        } catch {}
        const rankInfo = getRankTitle(nextLevel, ui.gender);

        return api.sendMessage(`●─────── ✾ ───────●\n ⦿ ⟬ نَجَاحُ التَّرْقِيَةِ ⚡ ⟭ ⦿\n┝━━━━━━━━━━━━━━━\n┇ 🎉 مبروك! تم ترقيتك بنجاح\n┇ 🔼 المستويات المضافة: +${levelsToBuy}\n┇ 🌟 المستوى الجديد: [ ${nextLevel} ]\n┇ 🏷️ اللقب الحالي: ${rankInfo.title}\n┇ 💸 تم خصم: ${totalCost.toLocaleString()} $ من البنك\n●─────── ✾ ───────●`, threadID, messageID);
      }

      // الحالة 2: رانك ترقية (عرض قائمة المستويات الـ 7 القادمة)
      let upgradeMsg = "●─────── ✾ ───────●\n ⦿ ⟬ قَائِمَةُ التَّرْقِيَاتِ 🔼 ⟭ ⦿\n┝━━━━━━━━━━━━━━━\n";
      let ui = {};
      try {
        const r = await Users.find(senderID);
        if (r?.data?.data) ui = r.data.data;
      } catch {}

      for (let i = 1; i <= 7; i++) {
        const targetLvl = currentLevel + i;
        const cost = i * costPerLevel;
        const titleInfo = getRankTitle(targetLvl, ui.gender);
        upgradeMsg += `┇ 🌟 لفل [ ${targetLvl} ] ↜ +${i} مستوى\n┇ 🏷️ اللقب: ${titleInfo.title}\n┇ 💰 التكلفة: ${cost.toLocaleString()} $\n⊱ ────────────── ⊰\n`;
      }
      upgradeMsg += `💡 للترقية، اكتب:\nرانك ترقية [عدد المستويات]\nمثال: رانك ترقية 3\n●─────── ✾ ───────●`;
      return api.sendMessage(upgradeMsg, threadID, messageID);
    }

    // ══════════════════════════════════════
    // خلفية
    // ══════════════════════════════════════
    if (sub === "خلفية") {
      const isDefault = body.includes("افتراضي");

      if (isDefault) {
        setUserBg(senderID, null);
        return api.sendMessage(backgroundSetMsg(true), threadID, messageID);
      }

      const att = event.messageReply?.attachments?.[0];
      const imgUrl = att?.url || att?.previewUrl || att?.thumbnailUrl;

      if (!imgUrl) {
        return api.sendMessage("⚠️ | رد على صورة ثم اكتب:\nرانك خلفية", threadID, messageID);
      }

      setUserBg(senderID, imgUrl);
      return api.sendMessage(backgroundSetMsg(false), threadID, messageID);
    }

    // ══════════════════════════════════════
    // جوائز
    // ══════════════════════════════════════
    if (sub === "جوائز") {
      let txt = "●─────── ✾ ───────●\n ⦿ ⟬ جَوَائِزُ الرَّانك ✿ ⟭ ⦿\n┝━━━━━━━━━━━━━━━\n";
      for (const [lvl, bx] of Object.entries(BX_MILESTONES)) {
        txt += `┇ 🏆 لفل ${lvl} ↜ ${bx} Bx\n`;
      }
      txt += "●─────── ✾ ───────●";
      return api.sendMessage(txt, threadID, messageID);
    }

    // ══════════════════════════════════════
    // كنية
    // ══════════════════════════════════════
    if (sub === "كنية") {
      const action = args[1]?.toLowerCase();
      const threadData = await Threads.getData(threadID) || {};

      if (action === "تشغيل") {
        await Threads.update(threadID, { rankNicknameMode: true });
        return api.sendMessage("✅ | تم تفعيل كنية الرانك تلقائياً", threadID, messageID);
      }

      if (action === "ايقاف") {
        await Threads.update(threadID, { rankNicknameMode: false });
        return api.sendMessage("🔴 | تم تعطيل كنية الرانك تلقائياً", threadID, messageID);
      }

      if (action === "ستايل") {
        const style = args.slice(2).join(" ");
        if (!style) {
          return api.sendMessage(styleHelpMsg, threadID, messageID);
        }
        if (style === "مسح") {
          await Threads.update(threadID, { rankNicknameStyle: null });
          return api.sendMessage("🗑️ | تم حذف الستايل المخصص والرجوع للافتراضي", threadID, messageID);
        }

        await Threads.update(threadID, { rankNicknameStyle: style });
        return api.sendMessage(`✅ | تم حفظ الستايل بنجاح:\n\n${style}`, threadID, messageID);
      }

      if (action === "ضبط") {
        const info = await api.getThreadInfo(threadID);
        const members = info.participantIDs;

        api.sendMessage(`⏳ | جاري بدء تحديث كنيات لـ (${members.length}) عضو بناءً على الرانك...\n⏱️ الوقت المتوقع: ${members.length * 5} ثانية.`, threadID);

        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < members.length; i++) {
          const uid = members[i];

          setTimeout(async () => {
            try {
              const xp = await Exp.check(uid);
              const level = xp?.data?.currentLevel || 1;

              let ui = {};
              try {
                const r = await Users.find(uid);
                if (r?.data?.data) ui = r.data.data;
              } catch {}

              const name = ui.name || (await Users.getNameUser(uid));
              const rankInfo = getRankTitle(level, ui.gender);

              let nextNickname = "";
              if (threadData.rankNicknameStyle) {
                const cashR = await Economy.getBalance(uid, "money");
                const bankR = await Economy.getBalance(uid, "bank");
                const mData = (typeof cashR === "number" ? cashR : cashR?.data || 0);
                const bData = (typeof bankR === "number" ? bankR : bankR?.data || 0);

                nextNickname = buildCustomNickname(threadData.rankNicknameStyle, {
                  name,
                  level,
                  title: rankInfo.title,
                  gender: (ui.gender === 1 ? "أنثى" : "ذكر"),
                  money: mData,
                  bank: bData,
                  vanity: uid,
                  warns: ui.warns || 0
                });
              } else {
                nextNickname = buildRankNickname(rankInfo.title, level);
              }

              await api.changeNickname(nextNickname, threadID, uid);
              successCount++;
            } catch (err) {
              failCount++;
            }

            if (i === members.length - 1) {
              api.sendMessage(`●─────── ✾ ───────●\n ⦿ ⟬ تَقْرِيرُ الضَّبْطِ 🏷️ ⟭ ⦿\n┝━━━━━━━━━━━━━━━\n┇ ✅ تم تحديث: ${successCount}\n┇ ❌ فشل تحديث: ${failCount}\n●─────── ✾ ───────●`, threadID);
            }
          }, i * 5000);
        }
        return;
      }

      return api.sendMessage(
        nicknameModeMsg(threadData?.rankNicknameMode, threadData?.rankNicknameStyle),
        threadID,
        messageID
      );
    }

    // ══════════════════════════════════════
    // بحث
    // ══════════════════════════════════════
    if (sub === "بحث") {
      return api.sendMessage(searchHelpMsg, threadID, messageID);
    }

    // ══════════════════════════════════════
    // توب
    // ══════════════════════════════════════
    if (sub === "توب") {
      const info = await api.getThreadInfo(threadID);
      const members = info.participantIDs;
      let leaderboard = [];

      for (const uid of members) {
        try {
          const xp = await Exp.check(uid);
          if (xp && xp.data) {
            leaderboard.push({
              uid,
              level: xp.data.currentLevel || 1,
              exp: xp.data.exp || 0
            });
          }
        } catch {}
      }

      leaderboard.sort((a, b) => b.level - a.level || b.exp - a.exp);
      const top10 = leaderboard.slice(0, 10);

      let topMsg = "●─────── ✾ ───────●\n ⦿ ⟬ تَوبُ المًصَنَّفِينْ 🏆 ⟭ ⦿\n┝━━━━━━━━━━━━━━━\n";
      const medals = ["🥇", "🥈", "🥉", "🏅", "🏅", "🏅", "🏅", "🏅", "🏅", "🏅"];

      for (let idx = 0; idx < top10.length; idx++) {
        const user = top10[idx];
        const uName = await Users.getNameUser(user.uid);
        topMsg += `┇ ${medals[idx]} ${idx + 1}. ${uName}\n┇ 🌟 المستَوى: ${user.level} | ${user.exp} XP\n┝━━━━━━━━━━━━━━━\n`;
      }
      topMsg += "👑 كُن الأفضل وتفاعل لتتصدر القائمة!\n●─────── ✾ ───────●";
      return api.sendMessage(topMsg, threadID, messageID);
    }

    // ══════════════════════════════════════
    // بطاقة الرانك الأساسية
    // ══════════════════════════════════════
    let targetID = senderID;
    const mentionIDs = Object.keys(mentions || {});
    if (mentionIDs.length) targetID = mentionIDs[0];

    if (isRankBanned(targetID)) {
      return api.sendMessage("🚫 | هذا الشخص محظور من نظام الرانك", threadID, messageID);
    }

    const xp = await Exp.check(targetID);
    const level = xp?.data?.currentLevel || 1;
    const exp = xp?.data?.exp || 0;
    const levelUpExp = xp?.data?.levelUpExp || 500;

    let ui = {};
    try {
      const r = await Users.find(targetID);
      if (r?.data?.data) ui = r.data.data;
    } catch {}

    const name = ui.name || (await Users.getNameUser(targetID));
    const cashR = await Economy.getBalance(targetID, "money");
    const bankR = await Economy.getBalance(targetID, "bank");

    const money =
      (typeof cashR === "number" ? cashR : cashR?.data || 0) +
      (typeof bankR === "number" ? bankR : bankR?.data || 0);

    const rankInfo = getRankTitle(level, ui.gender);
    let rankText = "#1";

    try {
      const info = await api.getThreadInfo(threadID);
      const index = info.participantIDs.indexOf(targetID);
      rankText = index !== -1 ? `#${index + 1}` : "N/A";
    } catch {}

    const customBg = getUserBg(targetID);
    const buffer = await buildRankCard({
      targetID,
      name,
      level,
      exp,
      levelUpExp,
      money,
      rankText,
      rankInfo,
      customBg
    });

    const filePath = path.join(process.cwd(), "cache", `rank_${Date.now()}.png`);
    fs.ensureDirSync(path.dirname(filePath));
    fs.writeFileSync(filePath, buffer);

    return api.sendMessage(
      { body: "🪐 | بطاقة الرانك الشخصية الأسطورية", attachment: fs.createReadStream(filePath) },
      threadID,
      () => fs.remove(filePath),
      messageID
    );

  } catch (e) {
    console.log(e);
    return api.sendMessage(`❌ | حدث خطأ غير متوقع:\n${e.message}`, threadID, messageID);
  }
};

// ══════════════════════════════════════════
// HANDLE REPLY
// ══════════════════════════════════════════
module.exports.handleReply = async function({ api, event, handleReply, Users, Economy, Exp, Threads }) {
  return;
};

// ══════════════════════════════════════════
// HANDLE EVENT
// ══════════════════════════════════════════
module.exports.handleEvent = async function({ api, event, Users, Exp, Threads }) {
  return;
};
