const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "بنك",
  version: "20.85.0",
  hasPermssion: 0,
  credits: "Abdou / REM BOT V20",
  description: "نظام بنكي متطور مدمج تلقائياً مع قاعدة بيانات السورس المحمية",
  commandCategory: "اقتصاد",
  usages: "[ايداع/سحب/عرض/توليد/تصفير/عدالة]",
  cooldowns: 3
};

const header = (title) => `●─── ⟪ ${title} ⟫ ───●`;
const divider = () => `●─────── ⌬ ───────●`;
const row = (emoji, label, value) => `『 ${emoji} 』 ${label}↜ ${value}`;
const box = (title, rows) => `${header(title)}\n${rows}\n${divider()}`;

// استخدام مجلد الـ database الموضح في صورة ريبلت
const bankDataPath = path.join(process.cwd(), "database", "rem_bank_system.json");

function getBankDB() {
  if (!fs.existsSync(bankDataPath)) {
    fs.ensureDirSync(path.dirname(bankDataPath));
    fs.writeJsonSync(bankDataPath, {});
  }
  return fs.readJsonSync(bankDataPath);
}

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID, type, messageReply } = event;
  const command = (args[0] || "").toLowerCase();

  // جلب المطور
  const botConfig = global.config || global.client?.config || {};
  const OWNER_IDS = botConfig.ownerBot || [];
  const isDev = OWNER_IDS.includes(String(senderID));

  // محاولة ربط الكاش بالنواة إن وُجدت
  const nativeCurrencies = global.model?.Currencies || global.Currencies;

  try {
    let db = getBankDB();
    if (!db[senderID]) db[senderID] = { cash: 5000, bank: 0, banned: false };

    if (nativeCurrencies && typeof nativeCurrencies.getData === "function") {
      try {
        let nativeData = await nativeCurrencies.getData(senderID) || {};
        if(nativeData.money !== undefined) db[senderID].cash = nativeData.money;
      } catch(e) {}
    }

    if (db[senderID].banned === true && !isDev) {
      return api.sendMessage(box("🚫 وصول مرفوض", row("⚠️", "الحالة", "حسابك محظور من العمليات البنكية.")), threadID, messageID);
    }

    const save = () => fs.writeJsonSync(bankDataPath, db);

    const modifyCash = async (id, amount, isIncrease = true) => {
      if (!db[id]) db[id] = { cash: 5000, bank: 0, banned: false };
      if (isIncrease) {
        db[id].cash += amount;
        if (nativeCurrencies && typeof nativeCurrencies.increaseMoney === "function") {
          try { await nativeCurrencies.increaseMoney(id, amount); } catch(e){}
        }
      } else {
        db[id].cash = Math.max(0, db[id].cash - amount);
        if (nativeCurrencies && typeof nativeCurrencies.decreaseMoney === "function") {
          try { await nativeCurrencies.decreaseMoney(id, amount); } catch(e){}
        }
      }
      save();
    };

    // --- [ أوامر المطور ] ---
    if (command === "توليد" && isDev) {
      const amount = parseInt(args[1]);
      if (isNaN(amount) || amount <= 0) return api.sendMessage("⚠️ حدد المبلغ المراد توليده يا عبدو.", threadID, messageID);
      db[senderID].bank += amount;
      save();
      return api.sendMessage(box("⚙️ تحديث النظام", row("💎", "الحالة", `تم توليد ${amount.toLocaleString()}$ في بنكك.`)), threadID, messageID);
    }

    if (command === "عدالة" && isDev) {
      if (type !== "message_reply") return api.sendMessage("⚠️ رد على الشخص اللي تبي تخصم منه.", threadID, messageID);
      const amount = parseInt(args[1]);
      if (isNaN(amount) || amount <= 0) return api.sendMessage("⚠️ حدد مبلغ الخصم.", threadID, messageID);
      await modifyCash(messageReply.senderID, amount, false);
      return api.sendMessage(box("⚖️ ميزان العدالة", row("✅", "النتيجة", `تم خصم ${amount.toLocaleString()}$ من كاش المستخدم.`)), threadID, messageID);
    }

    if (command === "تصفير" && isDev) {
      if (type !== "message_reply") return api.sendMessage("⚠️ رد على الضحية لتصفير حسابه.", threadID, messageID);
      const targetID = messageReply.senderID;
      if (!db[targetID]) db[targetID] = { cash: 0, bank: 0, banned: false };
      await modifyCash(targetID, db[targetID].cash, false);
      db[targetID].bank = 0;
      save();
      return api.sendMessage(box("🧹 تصفير شامل", row("✅", "الحالة", "تم مسح الكاش والبنك للمستخدم بنجاح.")), threadID, messageID);
    }

    // --- [ الأوامر العامة ] ---
    if (command === "مساعدة") {
      return api.sendMessage(box("📚 قائمة الأوامر", `${row("📥", "بنك ايداع", "لإيداع المال")}\n${row("📤", "بنك سحب", "لسحب المال")}\n${row("🔍", "بنك عرض", "لعرض الرصيد")}`), threadID, messageID);
    }

    if (command === "عرض" || !command) {
      return api.sendMessage(box("🏦 كشف الحساب", `${row("💵", "الكاش", `${db[senderID].cash.toLocaleString()}$`)}\n${row("🏛️", "البنك", `${db[senderID].bank.toLocaleString()}$`)}\n${row("💎", "الحالة", isDev ? "ま 𝑹𝑬𝑴-𝑩𝑶𝑻 ま" : "عضو")}`), threadID, messageID);
    }

    if (command === "ايداع") {
      let money = db[senderID].cash;
      let input = args[1] === "الكل" ? money : parseInt(args[1]);
      if (isNaN(input) || input <= 0 || input > money) return api.sendMessage("⚠️ رصيد الكاش الحالي لا يسمح.", threadID, messageID);
      db[senderID].bank += input;
      await modifyCash(senderID, input, false);
      return api.sendMessage(box("📥 إيداع ناجح", row("💰", "المبلغ المودع", `${input.toLocaleString()}$`)), threadID, messageID);
    }

    if (command === "سحب") {
      let bMoney = db[senderID].bank;
      let input = args[1] === "الكل" ? bMoney : parseInt(args[1]);
      if (isNaN(input) || input <= 0 || input > bMoney) return api.sendMessage("⚠️ رصيدك البنكي الحالي لا يسمح.", threadID, messageID);
      db[senderID].bank -= input;
      await modifyCash(senderID, input, true);
      return api.sendMessage(box("📤 سحب ناجح", row("💰", "المبلغ المسحوب", `${input.toLocaleString()}$`)), threadID, messageID);
    }

  } catch (e) {
    console.error(e);
  }
};
