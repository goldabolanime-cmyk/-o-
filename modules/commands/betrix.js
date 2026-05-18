const axios = require("axios");
const moment = require("moment-timezone");

// دالة الزخرفة الموحدة لريم بوت
const BOX = (title, lines, footer = null) => {
  let m = `●─────── ✾ ───────●\n ⦿ ⟬ ${title} ⟭ ⦿\n⊱ ────────────── ⊰\n`;
  for (const l of lines) { 
    if (!l && l !== 0) { m += `\n`; } else { m += `  ⟣ ${l}\n`; } 
  }
  if (footer) {
    m += `⊱ ────────────── ⊰\n`;
    for (const f of footer) { 
      if (!f && f !== 0) { m += `\n`; } else { m += `  ⟣ ${f}\n`; } 
    }
  }
  return m + '●─────── ✾ ───────●';
};

module.exports.config = {
  name: "بيتريكس",
  aliases: ["بورصة", "باكس"],
  version: "2.0.1",
  hasPermssion: 0,
  credits: "Abdou / ريم بوت",
  description: "نظام بورصة بيتريكس المتطور مع مخطط بياني ذكي وديناميكي وإصلاح الردود",
  commandCategory: "اقتصاد",
  usages: "[سوق/تحويل]",
  cooldowns: 5
};

// تهيئة بيانات السوق العالمية عند إقلاع البوت إذا لم تكن موجودة
if (!global.bx_market) {
  global.bx_market = {
    price: 142704.17,
    oldPrice: 142700.00,
    history: [142650, 142800, 142750, 142710, 142690, 142704, 142720, 142680, 142704.17],
    lastUpdate: Date.now()
  };
}

// دالة ذكية لرسم مبيان متساوي يعتمد على حركة الأسعار التاريخية
function generateSmartChart(history, currentPrice, oldPrice) {
  const chartLength = 9; // عدد النقاط المعروضة أفقياً
  const recentHistory = history.slice(-chartLength);

  const max = Math.max(...recentHistory, currentPrice);
  const min = Math.min(...recentHistory, currentPrice);
  const range = max - min === 0 ? 1 : max - min;

  const rows = 4;
  let chartLines = ["", "", "", ""];
  const dotColor = currentPrice >= oldPrice ? "🟢" : "🔴";

  for (let i = 0; i < recentHistory.length; i++) {
    const val = recentHistory[i];
    // حساب موقع السهم عمودياً بشكل دقيق ومتساوي
    const activeRow = rows - 1 - Math.round(((val - min) / range) * (rows - 1));

    for (let r = 0; r < rows; r++) {
      if (r === activeRow) {
        chartLines[r] += (i === recentHistory.length - 1) ? dotColor : "🔹";
      } else {
        chartLines[r] += "  ➖";
      }
    }
  }
  return chartLines.join("\n");
}

// ══════════════════════════════════════════
// HANDLE REPLY (معالجة عمليات البيع والشراء)
// ══════════════════════════════════════════
module.exports.handleReply = async function({ api, event, handleReply, Currencies }) {
    const { threadID, messageID, senderID, body } = event;
    if (handleReply.author != senderID) return;

    const userDataFull = await Currencies.getData(senderID);
    const userData = userDataFull.data || {};

    if (userData.اقتصاد_باند === true) {
        return api.sendMessage(BOX("🚫 حَظْرٌ مَلَكِي", ["عذراً، لقد تم حظرك من نظام البنك والبيتريكس بواسطة المطور."]), threadID, messageID);
    }

    const userMoney = userDataFull.money || 0;
    const userBx = userData.بيتريكس || 0;
    const currentPrice = global.bx_market.price;
    const input = body ? body.trim() : "";

    // خطوة اختيار نوع العملية (شراء أم بيع)
    if (handleReply.step == "choose") {
        if (input == "1") {
            // حذف الرسالة السابقة بعد التأكد من صحة الاختيار لتجنب تعليق الـ Push
            try { api.unsendMessage(handleReply.messageID); } catch(e) {}

            return api.sendMessage(BOX("شِرَاءُ البِيتْريكس 📥", ["يرجى إرسال الكمية المراد شراؤها الآن عبر الرد على هذه الرسالة.", "مثال: 0.5 أو 10"]), threadID, (err, info) => {
                global.client.handleReply.push({ name: this.config.name, messageID: info.messageID, author: senderID, step: "buy" });
            }, messageID);
        } else if (input == "2") {
            try { api.unsendMessage(handleReply.messageID); } catch(e) {}

            return api.sendMessage(BOX("بَيْعُ البِيتْريكس 📤", ["يرجى إرسال الكمية المراد بيعها الآن عبر الرد على هذه الرسالة.", "مثال: 0.2 أو 1"]), threadID, (err, info) => {
                global.client.handleReply.push({ name: this.config.name, messageID: info.messageID, author: senderID, step: "sell" });
            }, messageID);
        } else {
            return api.sendMessage("⚠️ خيار غير صحيح! يرجى الرد برقم [1] للشراء أو [2] للبيع.", threadID, messageID);
        }
    }

    // خطوة تنفيذ الشراء
    if (handleReply.step == "buy") {
        const amount = parseFloat(input);
        if (isNaN(amount) || amount <= 0) return api.sendMessage("⚠️ كمية غير صالحة! يرجى كتابة رقم صحيح وموجب.", threadID, messageID);
        const totalCost = amount * currentPrice;
        if (userMoney < totalCost) return api.sendMessage(`❌ رصيدك من الأموال لا يكفي! تحتاج إلى: ${Math.floor(totalCost).toLocaleString()}$`, threadID, messageID);

        try { api.unsendMessage(handleReply.messageID); } catch(e) {}

        await Currencies.decreaseMoney(senderID, Math.floor(totalCost));
        userData.بيتريكس = Number((userBx + amount).toFixed(4));
        await Currencies.setData(senderID, { data: userData });
        return api.sendMessage(`✅ تم شراء ${amount} ✿ من عملة البيتريكس بنجاح!\n💰 التكلفة الإجمالية: ${Math.floor(totalCost).toLocaleString()}$`, threadID, messageID);
    }

    // خطوة تنفيذ البيع
    if (handleReply.step == "sell") {
        const amount = parseFloat(input);
        if (isNaN(amount) || amount <= 0) return api.sendMessage("⚠️ كمية غير صالحة! يرجى كتابة رقم صحيح وموجب.", threadID, messageID);
        if (amount > userBx) return api.sendMessage(`⚠️ رصيدك من البيتريكس لا يكفي! تملك حالياً: ${userBx} ✿`, threadID, messageID);
        const totalGain = amount * currentPrice;

        try { api.unsendMessage(handleReply.messageID); } catch(e) {}

        await Currencies.increaseMoney(senderID, Math.floor(totalGain));
        userData.بيتريكس = Number((userBx - amount).toFixed(4));
        await Currencies.setData(senderID, { data: userData });
        return api.sendMessage(`✅ تم بيع ${amount} ✿ واستلمت مقابلها نقداً: ${Math.floor(totalGain).toLocaleString()}$`, threadID, messageID);
    }
};

// ══════════════════════════════════════════
// MAIN RUN (المعالج الأساسي للأمر)
// ══════════════════════════════════════════
module.exports.run = async function({ api, event, args, Currencies }) {
    const { threadID, messageID, senderID } = event;
    const type = args[0] ? args[0].trim() : "";

    const userDataFull = await Currencies.getData(senderID);
    const userData = userDataFull.data || {};

    if (userData.اقتصاد_باند === true) {
        return api.sendMessage(BOX("🚫 حَظْرٌ مَلَكِي", ["عذراً، لقد تم حظرك من نظام البنك والبيتريكس بواسطة المطور."]), threadID, messageID);
    }

    // تحديث ديناميكي لأسعار البورصة بشكل دوري عند تفعيل الأمر
    global.bx_market.oldPrice = global.bx_market.price;
    const change = (Math.random() * 400 - 190); 
    global.bx_market.price = Number((global.bx_market.price + change).toFixed(2));

    // إضافة السعر الجديد للمصفوفة التاريخية وتحديث قيمتها
    global.bx_market.history.push(global.bx_market.price);
    if (global.bx_market.history.length > 15) global.bx_market.history.shift();

    const percent = ((global.bx_market.price - global.bx_market.oldPrice) / global.bx_market.oldPrice * 100).toFixed(2);
    const trend = percent >= 0 ? "📈 +" : "📉 ";

    const userBx = userData.بيتريكس || 0;
    const currentPrice = global.bx_market.price;
    const totalValueInS = Number((userBx * currentPrice).toFixed(2));

    // الواجهة الرئيسية: عند كتابة .بيتريكس فقط
    if (!type) {
        return api.sendMessage(BOX("✿ نِظَامُ البِيتْريكس 🪙", [
          `سعر البيتريكس الحالي: ${currentPrice.toLocaleString()} $ / للواحدة`,
          `رصيدك من الباكس: ${userBx.toLocaleString()} ✿`,
          `القيمة الإجمالية بالدولار: ${totalValueInS.toLocaleString()} $`,
          ``,
          `• بيتريكس سوق ↜ لعرض المبيان المطور للبورصة`,
          `• بيتريكس تحويل ↜ للبيع والشراء الفوري`
        ]), threadID, messageID);
    }

    // واجهة السوق: عرض المخطط البياني والتحليلات المتقدمة
    if (type == "سوق") {
        const smartGraph = generateSmartChart(global.bx_market.history, currentPrice, global.bx_market.oldPrice);
        const currentTime = moment.tz("Africa/Casablanca").format("hh:mm:ss A");

        return api.sendMessage(`●─────── ✾ ───────●
 ⦿ ⟬ ✿ سُوقُ البِيتْريكس 💹 ⟭ ⦿
⊱ ───────────────── ⊰
  ⟣ 💰 السعر الحالي: ${currentPrice.toLocaleString()} $
  ⟣ 📊 معدل التغير: [ ${trend}${percent}% ]
⊱ ───────────────── ⊰
📊 المخطط المبياني لحركة السوق:
${smartGraph}
⊱ ───────────────── ⊰
  ⟣ 🔄 توقيت المغرب: ${currentTime}
●─────── ✾ ───────●`, threadID, messageID);
    }

    // واجهة التداول والاستدعاء بالرد
    if (type == "تحويل") {
        return api.sendMessage(BOX("تَدَاوُلُ البِيتْريكس 💱", [
          "1️⃣ ↜ شراء عملة البيتريكس",
          "2️⃣ ↜ بيع عملة البيتريكس",
          "",
          "💡 يرجى الرد على هذه الرسالة برقم العملية المطلوبة."
        ]), threadID, (err, info) => {
            global.client.handleReply.push({ name: this.config.name, messageID: info.messageID, author: senderID, step: "choose" });
        }, messageID);
    }
};
