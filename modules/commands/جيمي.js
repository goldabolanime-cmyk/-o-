const axios = require('axios');

// دالة تنسيق الرسائل المخصصة للأمر
const BOX = (title, lines) => {
  let m = `●─────── ⌬ ───────●\n ⦿ ⟬ ${title} ⟭ ⦿\n┝━━━━━━━━━━━━━━━\n`;
  for (const l of lines) {
    const lineText = typeof l === 'object' ? JSON.stringify(l) : l;
    m += `┇ ${lineText}\n`;
  }
  return m + '\n●─────── ⌬ ───────●';
};

module.exports.config = {
  name: "جيبي",
  version: "2.2.5",
  hasPermssion: 0,
  credits: "Yamada KJ",
  description: "ذكاء اصطناعي بنظام استخراج نص ذكي ودعم محادثات مستمرة",
  commandCategory: "ذكاء اصطناعي",
  usages: "[السؤال]",
  cooldowns: 2
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;
  const prompt = args.join(" ").trim();

  if (!prompt) {
    return api.sendMessage(BOX("تنبيه ⚠️", ["اكتب سؤالك للبدء"]), threadID, messageID);
  }

  // تمرير التنفيذ إلى معالج الذكاء الاصطناعي الخاص بالنواة
  return await module.exports.handleGPT(api, event, prompt);
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
  // التحقق من أن الشخص الذي رد على البوت هو نفس صاحب السؤال الأصلي
  if (String(event.senderID) !== String(handleReply.author)) return;

  // الاستمرار في المحادثة بنفس النص المكتوب في الرد
  return await module.exports.handleGPT(api, event, event.body);
};

module.exports.handleGPT = async function (api, event, text) {
  const { threadID, messageID, senderID } = event;

  try {
    const res = await axios.post(
      'https://viscodev.x10.mx/GPT-4/api.php',
      JSON.stringify({ 
        message: text, 
        chat_id: "user_" + senderID, 
        message_id: messageID 
      }),
      { headers: { 'Content-Type': 'application/json' }, timeout: 30000 }
    );

    // --- نظام استخراج النص الذكي المستقر ---
    let aiMsg = "";
    const d = res.data;

    if (typeof d === 'string') {
      aiMsg = d;
    } else if (d && d.response) {
      aiMsg = typeof d.response === 'object' ? (d.response.text || JSON.stringify(d.response)) : d.response;
    } else if (d && d.message) {
      aiMsg = d.message;
    } else if (d && d.data) {
      aiMsg = typeof d.data === 'string' ? d.data : JSON.stringify(d.data);
    } else {
      aiMsg = JSON.stringify(d);
    }
    // -------------------------------------

    return api.sendMessage(BOX("جيبي 🤖", [aiMsg.trim()]), threadID, (err, info) => {
      if (!err && info) {
        // دفع بيانات الرد إلى مصفوفة الكاش المؤقتة للنواة للمتابعة الفورية
        global.client.handleReply.push({
          name: module.exports.config.name,
          messageID: info.messageID,
          author: senderID
        });
      }
    }, messageID);

  } catch (error) {
    console.error("[GPT-4 API ERROR]", error.message);
    return api.sendMessage(BOX("خطأ ❌", ["السيرفر لا يستجيب حالياً أو أن الرابط معطل."]), threadID, messageID);
  }
};
