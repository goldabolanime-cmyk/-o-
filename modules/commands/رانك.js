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
  version: "15.0.0",
  hasPermssion: 0,
  credits: "Yamada KJ / Abdou",
  description: "نظام رانك احترافي متكامل",
  commandCategory: "اقتصاد",
  usages: "[ترقية/كنية/بحث/خلفية/جوائز]",
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
// الخلفيات
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

    fs.writeFileSync(
      USERS_DB_PATH,
      JSON.stringify(data, null, 2)
    );

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

function setRankBan(uid, banned) {
  try {
    let data = {};

    try {
      data = JSON.parse(fs.readFileSync(RANK_BAN_PATH, "utf8") || "{}");
    } catch {}

    if (banned)
      data[String(uid)] = true;
    else
      delete data[String(uid)];

    fs.ensureDirSync(path.dirname(RANK_BAN_PATH));

    fs.writeFileSync(
      RANK_BAN_PATH,
      JSON.stringify(data, null, 2)
    );

  } catch (e) {
    console.log("[RANK BAN ERROR]", e.message);
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
// HELPERS
// ══════════════════════════════════════════
function registerReply(messageID, data) {
  try {
    global.client.handleReply.push({
      name: module.exports.config.name,
      messageID,
      ...data
    });
  } catch {}
}

function deleteReply(messageID) {
  try {
    const index = global.client.handleReply.findIndex(
      x => x.messageID == messageID
    );

    if (index !== -1)
      global.client.handleReply.splice(index, 1);

  } catch {}
}

// ══════════════════════════════════════════
// COOLDOWN
// ══════════════════════════════════════════
const _nickCooldown = new Map();

function _setCooldown(pid, threadID) {
  _nickCooldown.set(
    `${String(pid)}:${String(threadID)}`,
    Date.now()
  );
}

function _hasCooldown(pid, threadID, ms = 10000) {
  const key = `${String(pid)}:${String(threadID)}`;

  const ts = _nickCooldown.get(key);

  if (!ts) return false;

  if (Date.now() - ts < ms)
    return true;

  _nickCooldown.delete(key);

  return false;
}

// ══════════════════════════════════════════
// لقب الرانك
// ══════════════════════════════════════════
function buildRankNickname(title, level) {
  return `☬〘${title}〙⌘『${level}』☬`;
}

// ══════════════════════════════════════════
// ستايل الكنية
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
// ألوان الرتب
// ══════════════════════════════════════════
const TS = {
  lvl100: { color: "#ffd700", glow: "#ff8c00" },
  lvl95:  { color: "#6c5ce7", glow: "#a29bfe" },
  lvl90:  { color: "#dfe6e9", glow: "#636e72" },
  lvl85:  { color: "#a8e6cf", glow: "#27ae60" },
  lvl80:  { color: "#ff6b6b", glow: "#d63031" },
  lvl75:  { color: "#ffeaa7", glow: "#fdcb6e" },
  lvl70:  { color: "#55efc4", glow: "#00b894" },
  lvl65:  { color: "#74b9ff", glow: "#0984e3" },
  lvl60:  { color: "#a29bfe", glow: "#6c5ce7" },
  lvl55:  { color: "#fd79a8", glow: "#e84393" },
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
};

// ══════════════════════════════════════════
// الرتب
// ══════════════════════════════════════════
function getRankTitle(level, gender) {

  const female =
    gender === 1 ||
    gender === "FEMALE" ||
    gender === "Female" ||
    gender === "أنثى";

  if (female) {

    if (level >= 100)
      return { title: "✦ نَاجِيَةٌ فَوقَ الخَيَال ✦", key: "lvl100", ...TS.lvl100 };

    if (level >= 90)
      return { title: "⚡ إِلَهَةُ الظَّلَام ⚡", key: "lvl90", ...TS.lvl90 };

    if (level >= 75)
      return { title: "👑 مَلِكَةُ الآلِهَة 👑", key: "lvl75", ...TS.lvl75 };

    if (level >= 50)
      return { title: "آلَنِآجّيَةّ آلَوٌحًيَدٍةّ", key: "lvl50", ...TS.lvl50 };

    if (level >= 30)
      return { title: "♕ الإمبراطورة ♕", key: "lvl30", ...TS.lvl30 };

    if (level >= 15)
      return { title: "★ الفارسة المقدسة ★", key: "lvl15", ...TS.lvl15 };

    if (level >= 5)
      return { title: "✦ المتدربة ✦", key: "lvl5", ...TS.lvl5 };

    return { title: "✦ المستجدة الصاعدة ✦", key: "lvl1", ...TS.lvl1 };

  } else {

    if (level >= 100)
      return { title: "✦ نَاجٍ فَوقَ الخَيَال ✦", key: "lvl100", ...TS.lvl100 };

    if (level >= 90)
      return { title: "⚡ إِلَهُ الظَّلَام ⚡", key: "lvl90", ...TS.lvl90 };

    if (level >= 75)
      return { title: "👑 مَلِكُ الآلِهَة 👑", key: "lvl75", ...TS.lvl75 };

    if (level >= 50)
      return { title: "آلَنِآجّيَ آلَوٌحًيَدٍ", key: "lvl50", ...TS.lvl50 };

    if (level >= 30)
      return { title: "♕ الإمبراطور ♕", key: "lvl30", ...TS.lvl30 };

    if (level >= 15)
      return { title: "★ الفارس المقدس ★", key: "lvl15", ...TS.lvl15 };

    if (level >= 5)
      return { title: "✦ المتدرب ✦", key: "lvl5", ...TS.lvl5 };

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
// رسم الدائرة
// ══════════════════════════════════════════
function circle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.closePath();
}

// ══════════════════════════════════════════
// مستطيل دائري
// ══════════════════════════════════════════
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
// بناء الكارت
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

  const bgUrl =
    customBg ||
    backgrounds[Math.floor(Math.random() * backgrounds.length)];

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
  overlay.addColorStop(1, "rgba(0,0,0,0.95)");
  ctx.fillStyle = overlay;
  ctx.fillRect(0, 0, W, H);

  const ax = 150;
  const ay = 230;
  const r = 100;

  const avatar = await loadImg(
    `https://graph.facebook.com/${targetID}/picture?height=512&width=512`
  );

  if (avatar) {
    ctx.save();
    circle(ctx, ax, ay, r);
    ctx.clip();
    ctx.drawImage(avatar, ax - r, ay - r, r * 2, r * 2);
    ctx.restore();
  } else {
    ctx.fillStyle = "#2c3e50";
    circle(ctx, ax, ay, r);
    ctx.fill();
  }

  ctx.strokeStyle = rankInfo.color;
  ctx.lineWidth = 6;
  ctx.shadowColor = rankInfo.glow;
  ctx.shadowBlur = 20;
  circle(ctx, ax, ay, r);
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.fillStyle = "#fff";
  ctx.font = "bold 45px Arial";
  ctx.fillText(name, 300, 120);

  ctx.fillStyle = rankInfo.color;
  ctx.font = "bold 28px Arial";
  ctx.fillText(rankInfo.title, 300, 170);

  ctx.fillStyle = "#fff";
  ctx.font = "bold 30px Arial";
  ctx.fillText(`LVL ${level}`, 300, 240);

  ctx.fillStyle = "rgba(255,255,255,0.15)";
  rrect(ctx, 300, 270, 450, 35, 15);
  ctx.fill();

  const progress = Math.min(exp / levelUpExp, 1);
  const bar = ctx.createLinearGradient(300, 0, 750, 0);
  bar.addColorStop(0, rankInfo.color);
  bar.addColorStop(1, rankInfo.glow);
  ctx.fillStyle = bar;
  rrect(ctx, 300, 270, 450 * progress, 35, 15);
  ctx.fill();

  ctx.fillStyle = "#fff";
  ctx.font = "18px Arial";
  ctx.fillText(`${exp} / ${levelUpExp} XP`, 300, 330);

  ctx.fillStyle = "#ffb800";
  ctx.font = "bold 32px Arial";
  ctx.fillText(`$ ${money.toLocaleString()}`, 300, 400);

  ctx.fillStyle = "#fff";
  ctx.font = "bold 22px Arial";
  ctx.fillText(`Rank ${rankText}`, 700, 70);

  return canvas.toBuffer("image/png");
}

// ══════════════════════════════════════════
// تطبيق الكنية
// ══════════════════════════════════════════
async function applyRankNickname({
  api,
  threadID,
  targetID,
  Users,
  Exp,
  Threads,
  Economy
}) {

  try {

    const data = await Threads.getData(threadID);

    if (!data?.rankNicknameMode)
      return false;

    const xpData = await Exp.check(targetID);

    const level = xpData?.data?.currentLevel || 1;

    let userInfo = {};

    try {
      const r = await Users.find(targetID);
      if (r?.data?.data) userInfo = r.data.data;
    } catch {}

    const rankInfo = getRankTitle(level, userInfo.gender);

    let nickname;

    if (data?.rankNicknameStyle) {

      let money = 0;
      let bank = 0;

      try {
        const cr = await Economy.getBalance(targetID, "money");
        const br = await Economy.getBalance(targetID, "bank");
        money = typeof cr === "number" ? cr : cr?.data || 0;
        bank = typeof br === "number" ? br : br?.data || 0;
      } catch {}

      nickname = buildCustomNickname(data.rankNicknameStyle, {
        name: userInfo.name || "",
        vanity: userInfo.vanity || "",
        title: rankInfo.title,
        level,
        gender: userInfo.gender || "",
        money,
        bank,
        warns: 0
      });

    } else {
      nickname = buildRankNickname(rankInfo.title, level);
    }

    _setCooldown(targetID, threadID);

    await api.changeNickname(nickname, threadID, targetID);

    return true;

  } catch {
    return false;
  }
}

// ══════════════════════════════════════════
// RUN
// ══════════════════════════════════════════
module.exports.run = async function({
  api,
  event,
  args,
  Users,
  Economy,
  Exp,
  Threads
}) {

  const {
    threadID,
    messageID,
    senderID,
    mentions,
    body
  } = event;

  try {

    const sub = args[0]?.toLowerCase();

    // ══════════════════════════════════════
    // خلفية
    // ══════════════════════════════════════
    if (sub === "خلفية") {

      const isDefault = body.includes("افتراضي");

      if (isDefault) {
        setUserBg(senderID, null);
        return api.sendMessage("✅ | تم حذف الخلفية الشخصية", threadID, messageID);
      }

      const att = event.messageReply?.attachments?.[0];
      const imgUrl = att?.url || att?.previewUrl || att?.thumbnailUrl;

      if (!imgUrl) {
        return api.sendMessage(
          "⚠️ | رد على صورة ثم اكتب:\nرانك خلفية",
          threadID,
          messageID
        );
      }

      setUserBg(senderID, imgUrl);

      return api.sendMessage("✅ | تم تعيين الخلفية الشخصية", threadID, messageID);
    }

    // ══════════════════════════════════════
    // جوائز
    // ══════════════════════════════════════
    if (sub === "جوائز") {

      let txt =
        "●─────── ✾ ───────●\n" +
        " ⦿ ⟬ جَوَائِزُ الرَّانك ✿ ⟭ ⦿\n" +
        "┝━━━━━━━━━━━━━━━\n";

      for (const [lvl, bx] of Object.entries(BX_MILESTONES)) {
        txt += `┇ 🏆 لفل ${lvl} ↜ ${bx} Bx\n`;
      }

      txt += "●─────── ✾ ───────●";

      return api.sendMessage(txt, threadID, messageID);
    }

    // ══════════════════════════════════════
    // ترقية
    // ══════════════════════════════════════
    if (["ترقية", "ترقيه", "upgrade"].includes(sub)) {

      const xp = await Exp.check(senderID);
      const level = xp?.data?.currentLevel || 1;
      const cost = getUpgradeCost(level);

      const cashR = await Economy.getBalance(senderID, "money");
      const bankR = await Economy.getBalance(senderID, "bank");

      const cash = typeof cashR === "number" ? cashR : cashR?.data || 0;
      const bank = typeof bankR === "number" ? bankR : bankR?.data || 0;

      const total = cash + bank;

      if (total < cost) {
        return api.sendMessage(
          `❌ | تحتاج ${(cost - total).toLocaleString()}$ إضافية`,
          threadID,
          messageID
        );
      }

      let remain = cost;

      if (cash >= remain) {
        await Economy.decrease(remain, senderID, "money");
      } else {
        await Economy.decrease(cash, senderID, "money");
        remain -= cash;
        await Economy.decrease(remain, senderID, "bank");
      }

      const lvExp = xp?.data?.levelUpExp || 500;
      const curExp = xp?.data?.exp || 0;

      await Exp.increase(senderID, lvExp - curExp);

      const newLevel = level + 1;

      let rewardText = "";

      const bxReward = BX_MILESTONES[newLevel] || 0;

      if (bxReward > 0) {
        addUserBeatrix(String(senderID), bxReward);
        rewardText = `\n🎁 حصلت على ${bxReward} Bx`;
      }

      await applyRankNickname({
        api,
        threadID,
        targetID: senderID,
        Users,
        Exp,
        Threads,
        Economy
      });

      return api.sendMessage(
        `✅ | تمت الترقية إلى لفل ${newLevel}${rewardText}`,
        threadID,
        messageID
      );
    }

    // ══════════════════════════════════════
    // كنية
    // ══════════════════════════════════════
    if (sub === "كنية") {

      const action = args[1]?.toLowerCase();
      const threadData = await Threads.getData(threadID);

      if (action === "تشغيل" || action === "on") {

        await Threads.update(threadID, { rankNicknameMode: true });

        return api.sendMessage("✅ | تم تفعيل كنية الرانك", threadID, messageID);
      }

      if (action === "ايقاف" || action === "off") {

        await Threads.update(threadID, { rankNicknameMode: false });

        return api.sendMessage("🔴 | تم إيقاف كنية الرانك", threadID, messageID);
      }

      if (action === "ستايل") {

        const style = args.slice(2).join(" ");

        if (!style) {
          return api.sendMessage("⚠️ | اكتب ستايل صالح", threadID, messageID);
        }

        if (style === "مسح" || style === "حذف") {

          await Threads.update(threadID, { rankNicknameStyle: null });

          return api.sendMessage("🗑️ | تم حذف الستايل", threadID, messageID);
        }

        await Threads.update(threadID, { rankNicknameStyle: style });

        return api.sendMessage(
          `✅ | تم حفظ الستايل\n\n${style}`,
          threadID,
          messageID
        );
      }

      return api.sendMessage(
        `الحالة: ${threadData?.rankNicknameMode ? "مفعلة ✅" : "معطلة ❌"}`,
        threadID,
        messageID
      );
    }

    // ══════════════════════════════════════
    // بطاقة الرانك
    // ══════════════════════════════════════
    let targetID = senderID;

    const mentionIDs = Object.keys(mentions || {});

    if (mentionIDs.length) targetID = mentionIDs[0];

    if (isRankBanned(targetID)) {
      return api.sendMessage(
        "🚫 | هذا الشخص محظور من الرانك",
        threadID,
        messageID
      );
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

    const name = ui.name || await Users.getNameUser(targetID);

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

    await applyRankNickname({
      api,
      threadID,
      targetID,
      Users,
      Exp,
      Threads,
      Economy
    });

    return api.sendMessage(
      {
        body: "🪐 | بطاقة الرانك",
        attachment: fs.createReadStream(filePath)
      },
      threadID,
      () => fs.remove(filePath),
      messageID
    );

  } catch (e) {

    console.log(e);

    return api.sendMessage(
      `❌ | خطأ:\n${e.message}`,
      threadID,
      messageID
    );
  }
};

// ══════════════════════════════════════════
// HANDLE REPLY
// ══════════════════════════════════════════
module.exports.handleReply = async function() {
  return;
};

// ══════════════════════════════════════════
// EVENT
// ══════════════════════════════════════════
module.exports.handleEvent = async function({
  api,
  event,
  Users,
  Exp,
  Threads,
  Economy
}) {

  const {
    threadID,
    logMessageType,
    logMessageData
  } = event;

  // عضو جديد
  if (logMessageType === "log:subscribe") {

    for (const p of logMessageData?.addedParticipants || []) {

      const uid = p.userFbId || p.id;

      if (!uid || uid == api.getCurrentUserID()) continue;

      setTimeout(async () => {

        await applyRankNickname({
          api,
          threadID,
          targetID: uid,
          Users,
          Exp,
          Threads,
          Economy
        });

      }, 2000);
    }
  }

  // حماية الكنية
  if (logMessageType === "log:user-nickname") {

    const { participant_id, nickname } = logMessageData;

    if (String(event.author) === String(api.getCurrentUserID())) return;

    if (_hasCooldown(participant_id, threadID)) return;

    try {

      const data = await Threads.getData(threadID);

      if (!data?.rankNicknameMode) return;

      const xp = await Exp.check(participant_id);
      const level = xp?.data?.currentLevel || 1;

      let ui = {};

      try {
        const r = await Users.find(participant_id);
        if (r?.data?.data) ui = r.data.data;
      } catch {}

      const rankInfo = getRankTitle(level, ui.gender);

      let correct;

      if (data?.rankNicknameStyle) {

        correct = buildCustomNickname(data.rankNicknameStyle, {
          name: ui.name || "",
          vanity: ui.vanity || "",
          title: rankInfo.title,
          level,
          gender: ui.gender || "",
          money: 0,
          bank: 0,
          warns: 0
        });

      } else {
        correct = buildRankNickname(rankInfo.title, level);
      }

      if (nickname !== correct) {

        _setCooldown(participant_id, threadID);

        await api.changeNickname(correct, threadID, participant_id);
      }

    } catch {}
  }
};
