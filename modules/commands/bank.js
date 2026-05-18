const fs = require("fs-extra");
const path = require("path");

const bankBansPath = path.join(process.cwd(), "database", "bank_banned_users.json");

// ══════════════════════════════════════════
// FUNCTIONS
// ══════════════════════════════════════════
function getBannedList() {
  try {
    if (!fs.existsSync(bankBansPath)) {
      fs.ensureDirSync(path.dirname(bankBansPath));
      fs.writeJsonSync(bankBansPath, []);
    }
    return fs.readJsonSync(bankBansPath);
  } catch (e) {
    return [];
  }
}

const header = (title) => `●─── ⟪ ${title} ⟫ ───●`;
const divider = () => `●─────── ⌬ ───────●`;
const row = (emoji, label, value) => `『 ${emoji} 』 ${label}↜ ${value}`;
const box = (title, rows) => `${header(title)}\n${rows}\n${divider()}`;

// ══════════════════════════════════════════
// CONFIG
// ══════════════════════════════════════════
module.exports.config = {
  name: "بنك",
  aliases: ["البنك", "bank"],
  version: "21.7.0",
  hasPermssion: 0,
  credits: "Abdou",
  description: "نظام بنكي متطور مدمج تلقائياً مع قاعدة بيانات السورس مع ميزات الحظر والتحكم 🏦",
  commandCategory: "اقتصاد",
  usages: "[ايداع/سحب/عرض/توليد/تصفير/عدالة/حظر/فك_حظر]",
  cooldowns: 3
};

// ══════════════════════════════════════════
// RUN
// ══════════════════════════════════════════
module.exports.run = async function({ api, event, args, Economy }) {
  const { threadID, messageID, senderID, type, messageReply } = event;
  const command = (args[0] || "").toLowerCase();

  const botConfig = global.config || global.client?.config || {};
  const OWNER_IDS = (botConfig.ownerBot || []).map(String);
  const isDev = OWNER_IDS.includes(String(senderID));

  try {
    let bannedUsers = getBannedList();
    if (bannedUsers.includes(String(senderID)) && !isDev) {
      return api.sendMessage(
        box("🚫 وصول مرفوض", row("⚠️", "الحالة", "حسابك محظور تماماً من إجراء أي عمليات بنكية من قبل المطور.")), 
        threadID, 
        messageID
      );
    }

    const userMoney = await Economy.getBalance(senderID, "money");
    const userBank = await Economy.getBalance(senderID, "bank");

    // ─── [ 🔨 أمر حظر مستخدم ] ───
    if (command === "حظر" && isDev) {
      let targetID = type === "message_reply" ? String(messageReply.senderID) : String(args[1]);
      if (!targetID || targetID === "undefined") return api.sendMessage("⚠️ الرجاء الرد على الشخص أو كتابة الآيدي الخاص به لحظر بنكه.", threadID, messageID);
      if (OWNER_IDS.includes(targetID)) return api.sendMessage("❌ لا يمكنك حظر مطور آخر من البنك يا عبدو!", threadID, messageID);

      if (!bannedUsers.includes(targetID)) {
        bannedUsers.push(targetID);
        fs.writeJsonSync(bankBansPath, bannedUsers);
      }
      return api.sendMessage(box("🔨 بنك الحظر", row("🔒", "الوضعية", `تم حظر الآيدي [${targetID}] من كافة العمليات البنكية بنجاح.`)), threadID, messageID);
    }

    // ─── [ 🔓 أمر فك الحظر ] ───
    if (command === "فك_حظر" && isDev) {
      let targetID = type === "message_reply" ? String(messageReply.senderID) : String(args[1]);
      if (!targetID || targetID === "undefined") return api.sendMessage("⚠️ الرجاء الرد على الشخص أو كتابة الآيدي لفك حظر بنكه.", threadID, messageID);

      if (bannedUsers.includes(targetID)) {
        bannedUsers = bannedUsers.filter(id => id !== targetID);
        fs.writeJsonSync(bankBansPath, bannedUsers);
        return api.sendMessage(box("🔓 بنك الإفراج", row("✅", "الوضعية", `تم إلغاء الحظر البنكي عن الحساب [${targetID}] بنجاح.`)), threadID, messageID);
      } else {
        return api.sendMessage("💡 هذا الحساب غير محظور في نظام البنك أصلاً.", threadID, messageID);
      }
    }

    // ─── [ 💎 أمر توليد الأموال ] ───
    if (command === "توليد" && isDev) {
      const amount = parseInt(args[1]);
      if (isNaN(amount) || amount <= 0) return api.sendMessage("⚠️ حدد المبلغ المراد توليده يا عبدو.", threadID, messageID);

      await Economy.increase(amount, senderID, "bank");
      return api.sendMessage(box("⚙️ تحديث النظام", row("💎", "الحالة", `تم توليد ${amount.toLocaleString()}$ في بنكك الخاص.`)), threadID, messageID);
    }

    // ─── [ ⚖️ أمر خصم كاش (عدالة) ] ───
    if (command === "عدالة" && isDev) {
      if (type !== "message_reply") return api.sendMessage("⚠️ رد على الشخص اللي تبي تخصم منه.", threadID, messageID);
      const amount = parseInt(args[1]);
      if (isNaN(amount) || amount <= 0) return api.sendMessage("⚠️ حدد مبلغ الخصم.", threadID, messageID);

      await Economy.decrease(amount, messageReply.senderID, "money");
      return api.sendMessage(box("⚖️ ميزان العدالة", row("✅", "النتيجة", `تم خصم ${amount.toLocaleString()}$ من كاش المستخدم.`)), threadID, messageID);
    }

    // ─── [ 🧹 تصفير شامل ] ───
    if (command === "تصفير" && isDev) {
      if (type !== "message_reply") return api.sendMessage("⚠️ رد على الشخص المراد تصفير حسابه.", threadID, messageID);
      const targetID = messageReply.senderID;

      const tMoney = await Economy.getBalance(targetID, "money");
      const tBank = await Economy.getBalance(targetID, "bank");

      await Economy.decrease(tMoney, targetID, "money");
      await Economy.decrease(tBank, targetID, "bank");
      return api.sendMessage(box("🧹 تصفير شامل", row("✅", "الحالة", "تم مسح وتصفير الكاش والبنك للمستخدم بالكامل.")), threadID, messageID);
    }

    // ─── [ 📚 مساعدة ] ───
    if (command === "مساعدة") {
      let helpMsg = `${row("📥", "بنك ايداع [المبلغ/الكل]", "لإيداع المال في الخزنة")}\n` + 
                    `${row("📤", "بنك سحب [المبلغ/الكل]", "لسحب المال للكاش")}\n` + 
                    `${row("🔍", "بنك عرض", "لعرض كشف حسابك الحالي")}`;

      if (isDev) {
        helpMsg += `\n\n${header("أوامر المطور")}\n` + 
                   `${row("🚫", "بنك حظر [رد/آيدي]", "لحظر مستخدم")}\n` + 
                   `${row("🔓", "بنك فك_حظر [رد/آيدي]", "لفك حظر")}\n` + 
                   `${row("💎", "بنك توليد [المبلغ]", "لتوليد نقود")}\n` + 
                   `${row("⚖️", "بنك عدالة [بالرد]", "للخصم من كاش عضو")}\n` + 
                   `${row("🧹", "بنك تصفير [بالرد]", "لتصفير حساب عضو")}`;
      }
      return api.sendMessage(box("📚 قائمة نظام البنك", helpMsg), threadID, messageID);
    }

    // ─── [ عرض الرصيد الافتراضي ] ───
    if (command === "عرض" || !command) {
      return api.sendMessage(box("🏦 كشف الحساب", `${row("💵", "الكاش", `${userMoney.toLocaleString()}$`)}\n${row("🏛️", "البنك", `${userBank.toLocaleString()}$`)}\n${row("💎", "الحالة", isDev ? "ま 𝑹𝑬𝑴-𝑩𝑶𝑻 ま" : "عضو")}`), threadID, messageID);
    }

    // ─── [ إيداع ] ───
    if (command === "ايداع") {
      let input = args[1] === "الكل" ? userMoney : parseInt(args[1]);
      if (isNaN(input) || input <= 0 || input > userMoney) return api.sendMessage("⚠️ رصيد الكاش الحالي الخاص بك لا يسمح بإتمام العملية.", threadID, messageID);

      await Economy.decrease(input, senderID, "money");
      const newBank = await Economy.increase(input, senderID, "bank");
      return api.sendMessage(box("📥 إيداع ناجح", `${row("💰", "المبلغ المودع", `${input.toLocaleString()}$`)}\n${row("🏛️", "رصيد البنك الجديد", `${newBank.toLocaleString()}$`)}`), threadID, messageID);
    }

    // ─── [ سحب ] ───
    if (command === "سحب") {
      let input = args[1] === "الكل" ? userBank : parseInt(args[1]);
      if (isNaN(input) || input <= 0 || input > userBank) return api.sendMessage("⚠️ رصيدك البنكي الحالي لا يسمح بإتمام العملية.", threadID, messageID);

      await Economy.decrease(input, senderID, "bank");
      const newMoney = await Economy.increase(input, senderID, "money");
      return api.sendMessage(box("📤 سحب ناجح", `${row("💰", "المبلغ المسحوب", `${input.toLocaleString()}$`)}\n${row("💵", "رصيد الكاش الجديد", `${newMoney.toLocaleString()}$`)}`), threadID, messageID);
    }

  } catch (e) {
    console.error("[BANK COMMAND CRITICAL ERROR]", e);
    api.sendMessage("❌ حدث خطأ داخلي غير متوقع في نظام البنك.", threadID, messageID);
  }
};
