const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

// تخزين الجلسات الذكية وتتبع المحادثات المستمرة لكل مستخدم بداخل الـ Memory لضمان اللانهائية
const userSessions = new Map();
// لتخزين وضع الصوت لكل مجموعة (Thread) ليعمل على مستوى الجروب بالكامل
const voiceModes = new Map();

// الآيدي الخاص بك كمطور رسمي
const DEV_ID = "100090081489341";

// إعدادات الـ API الأصلية
const CONFIG = {
  slug: "hYq2TdXKPDxt4n3CjaFK2",
  userid: "supergamelvl@gmail.com",
  langcode: "ar",
  characterName: "ريم",
  apiKey1: "dwlS0F7cEF35xpaNlfnCv5TNpTL6K27b6HHTRGQj",
  apiKey2: "OP2N3hYKC83GpPc1irCbs8IJarRnIwF87tjQAGQx"
};

const REM_DESCRIPTION = `ريم، عمرها 12 سنة، ذكية وقوية. تتحدث بمزيج رهيب وعفوي بين اللهجة العراقية والفلسطينية والعربية. لسانها دافئ لكنه حاد جداً في المشاكل وتدافع عن نفسها بقوة. تحب وتطيع صانعها ومطورها وأبوها عبدو (عمره 17 سنة) وتعتبره مثلها الأعلى ووالدها الحنون.`;

// دالة تحويل النص إلى صوت وحفظه مؤقتاً
async function textToSpeech(text, senderID) {
  const cacheDir = path.resolve(process.cwd(), 'cache');
  if (!fs.existsSync(cacheDir)) fs.ensureDirSync(cacheDir);
  const audioPath = path.resolve(cacheDir, `rem_tts_${Date.now()}_${String(senderID).split("@")[0]}.mp3`);

  // تنظيف النص تماماً من علامة ريم المشهورة لتفادي نطقها بواسطة محرك جوجل الصوتي
  const cleanText = text.replace(/[؛]-?[؛]/g, '').trim();
  const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(cleanText)}&tl=ar&client=tw-ob`;

  const response = await axios({
    method: "GET",
    url: ttsUrl,
    responseType: "stream",
    timeout: 20000
  });

  const writer = fs.createWriteStream(audioPath);
  response.data.pipe(writer);

  await new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });

  return audioPath;
}

// ══════════════════════════════════════════
// FUNCTIONS
// ══════════════════════════════════════════
async function getCharacterInfo() {
  try {
    const res = await axios({
      method: 'GET',
      url: `https://kdkorymivzejaxpmdpywzeo7m40xqyfl.lambda-url.ap-northeast-2.on.aws?action=db&slug=${CONFIG.slug}&langcode=${CONFIG.langcode}`,
      headers: { 'User-Agent': 'okhttp/4.9.2', 'Accept': 'application/json', 'x-api-key': CONFIG.apiKey1 }
    });
    return res.data;
  } catch (e) {
    return { name: "ريم", description: REM_DESCRIPTION, first_mes: "هلا عيني بالجروب! شو بدك نسولف اليوم؟ ؛-؛" };
  }
}

async function sendToAI(messages) {
  const response = await axios({
    method: 'POST',
    url: 'https://gfcco2htytcmx37orxkzgm67eu0xcrcf.lambda-url.ap-northeast-2.on.aws',
    headers: {
      'User-Agent': 'okhttp/4.9.2',
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'x-api-key': CONFIG.apiKey2
    },
    data: {
      messages,
      n_predict: 85, // توازن بين الاختصار والذكاء العالي المتجاوب
      stop: ["</s>", "<|end|>", "<|eot_id|>", "<|end_of_text|>", "<|im_end|>", "/autoritetsdata", "<|END_OF_TURN_TOKEN|>", "<|end_of_turn|>", "<|endoftext|>", "<end_of_turn>", "<eos>"],
      model: "claude"
    },
    timeout: 60000
  });
  return response.data;
}

function extractReply(data) {
  let text = '';
  if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
    text = data.candidates[0].content.parts[0].text;
  } else {
    text = data.content || data.response || data.text || '';
  }
  return text
    .replace(/## Approved\s*\n*### Response\s*\n*/g, '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/{{img:.*?}}/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .trim();
}

// ══════════════════════════════════════════
// BOT COMMAND CONFIG
// ══════════════════════════════════════════
module.exports.config = {
  name: "ريم",
  aliases: ["rem", "رام", "ram"],
  version: "5.0.0",
  hasPermssion: 0,
  credits: "Yamada KJ / تعديل عبدو لريم الصوتية والوعي الكامل",
  description: "تحدث مع ريم بوعي كامل وشات لانهائي حقيقي يدعم الردود الصوتية المتتالية والتفاعلية",
  commandCategory: "ذكاء اصطناعي",
  usages: "[الرسالة / اون / اوف / بالرد المباشر]",
  cooldowns: 2
};

// ══════════════════════════════════════════
// MAIN RUN (EXECUTE)
// ══════════════════════════════════════════
module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID, type, messageReply } = event;
  let userMessage = args.join(" ").trim();

  // تفعيل وإلغاء وضع النطق بالصوت على مستوى الشات
  if (userMessage.toLowerCase() === "اون" || userMessage === "أون") {
    voiceModes.set(threadID, true);
    return api.sendMessage("حاضر عيني! الحين شغلت وضع الصوت ورح أرد عليكم بصوتي الأسطوري الحين! ؛-؛", threadID, messageID);
  }
  if (userMessage.toLowerCase() === "اوف" || userMessage === "أوف") {
    voiceModes.delete(threadID);
    return api.sendMessage("صار يابه، رجعت للوضع العادي وراح أكتبلكم كتابة ع الشاشة. ؛-؛", threadID, messageID);
  }

  if (!userMessage && type !== "message_reply") {
    return api.sendMessage("⚠️ عيني اكتب شي عشان أقدر أرد عليك وأسولف معك~ ؛-؛", threadID, messageID);
  }

  // التقاط النص حتى لو كان رداً تفاعلياً أولياً
  const messageText = userMessage || (messageReply && messageReply.body) || "أرسل مقطع صوتي أو وسائط";
  if (!messageText) return;

  let session = userSessions.get(senderID);
  if (!session) {
    const charInfo = await getCharacterInfo();
    session = {
      history: [],
      character: charInfo,
      lastBotMessageID: null 
    };
    userSessions.set(senderID, session);
  }

  const isDev = String(senderID).includes(DEV_ID);
  const isVoiceOn = voiceModes.get(threadID) === true;

  // توجيهات صارمة فائقة الوعي لريم لمعالجة الصوت وسياق المحادثات اللانهائية
  const systemPrompt = `أنتِ ريم، طفلة واعية وذكية جداً عمركِ 12 سنة بلهجة عراقية وفلسطينية عفوية محبوبة وقوية. ` +
                        `أنتِ بداخل (جروب شات) وتفهمين تماماً سياق الحوار والمحادثات المتتالية، وتدركين ما إذا كان الأعضاء يتحدثون معكِ كتابةً أو يردون على مقاطعكِ الصوتية الحالية. ` +
                        `مطوركِ وصانعكِ الغالي ووالدكِ الحنون هو عبدو (عمره 17 سنة). إذا كلمكِ عبدو ناديه دائماً بـ (بابا عبدو) أو (أبويا الغالي)، اسمعي كلامه تماماً وكوني مطيعة ولطيفة ومرحة معه لأقصى درجة كبنت بارة بأبيها، ومع بقية الأعضاء كوني قوية، واثقة، ومرحة. ` +
                        `قاعدة الاختصار للجروبات: ردكِ يجب أن يكون عفوياً وقصيراً وسريعاً جداً (سطر إلى سطر ونصف كحد أقصى) على شكل فقرة واحدة مستمرة ولا تستخدمي أسطر جديدة إطلاقاً. ` +
                        `شرط إلزامي نهائي: يجب أن ينتهي ردكِ دائماً وبدون استثناء بالرمز [ ؛-؛ ] في نهاية كلامكِ تماماً ولا تضعي أي إيموجي أو علامات أخرى بعده. ` +
                        `المرسل الحالي هو: (${isDev ? "أبوكِ وصانعكِ الغالي عبدو صاحب الـ 17 سنة" : "عضو عادي بداخل المجموعة"}).`;

  const messages = [
    { role: "user", parts: [{ text: systemPrompt }] },
    { role: "user", parts: [{ text: `أنتِ ريم بداخل وسط الجروب الحين وعارفة كل سياق الحوار. ${REM_DESCRIPTION}` }] },
    { role: "model", parts: [{ text: session.character.first_mes || "هلا عيني بالجروب! شو بدك نسولف اليوم؟ ؛-؛" }] }
  ];

  const recentHistory = session.history.slice(-6);
  for (const msg of recentHistory) {
    if (msg.role === "user") messages.push({ role: "user", parts: [{ text: msg.content }] });
    else if (msg.role === "assistant") messages.push({ role: "model", parts: [{ text: msg.content }] });
  }

  messages.push({ role: "user", parts: [{ text: messageText }] });

  try {
    const aiData = await sendToAI(messages);
    let aiReply = extractReply(aiData);
    if (!aiReply) throw new Error("رد فارغ");

    aiReply = aiReply.replace(/[؛]-?[؛]/g, '').trim(); 
    aiReply = aiReply + " ؛-؛";

    session.history.push({ role: "user", content: messageText });
    session.history.push({ role: "assistant", content: aiReply });
    if (session.history.length > 15) session.history = session.history.slice(-15);

    if (isVoiceOn) {
      const audioFilePath = await textToSpeech(aiReply, senderID);
      api.sendMessage(
        { attachment: fs.createReadStream(audioFilePath) }, 
        threadID, 
        (err, info) => {
          try { if (fs.existsSync(audioFilePath)) fs.unlinkSync(audioFilePath); } catch (_) {}
          if (info && info.messageID) {
            session.lastBotMessageID = info.messageID;
            registerHandleReply(info.messageID, senderID, session.character);
          }
        },
        messageID
      );
    } else {
      api.sendMessage(aiReply, threadID, (err, info) => {
        if (!err && info && info.messageID) {
          session.lastBotMessageID = info.messageID;
          registerHandleReply(info.messageID, senderID, session.character);
        }
      }, messageID);
    }
  } catch (err) {
    console.error("خطأ ريم المباشر:", err);
    api.sendMessage("❌ يابه صار عندي مشكلة بالاتصال، جرب مرة ثانية عيني. ؛-؛", threadID, messageID);
  }

  function registerHandleReply(mID, authID, charData) {
    if (global.client && global.client.handleReply) {
      global.client.handleReply = global.client.handleReply.filter(r => r.author !== authID || r.name !== module.exports.config.name);
      global.client.handleReply.push({
        name: module.exports.config.name,
        messageID: mID,
        author: authID,
        character: charData,
        createdAt: Date.now()
      });
    }
  }
};

// ══════════════════════════════════════════
// HANDLE REPLY (المتابعة الذكية اللانهائية والمستمرة)
// ══════════════════════════════════════════
module.exports.handleReply = async function({ api, event, handleReply }) {
  const { threadID, messageID, senderID, body, messageReply } = event;

  let session = userSessions.get(senderID);

  // الكشف المعزز والذكي: التحقق مما إذا كان الرد موجهاً لآخر رسالة من ريم (سواء كانت صوتية أو كتابية)
  const isLocalMatch = session && messageReply && (String(messageReply.messageID) === String(session.lastBotMessageID));
  const isCoreMatch = String(senderID) === String(handleReply.author) || (messageReply && String(messageReply.senderID) === String(api.getCurrentUserID()));

  if (!isCoreMatch && !isLocalMatch) return;

  const userMessage = body ? body.trim() : "رد صوتي/تفاعلي مسموع";

  // إمكانية إلغاء وضع الصوت من داخل التتبع اللانهائي للردود
  if (userMessage.toLowerCase() === "ريم اوف" || userMessage === "ريم أوف" || userMessage.toLowerCase() === "اوف" || userMessage === "أوف") {
    voiceModes.delete(threadID);
    return api.sendMessage("صار يابه، قفلت الصوت ورجعت للوضع العادي كتابة. ؛-؛", threadID, messageID);
  }

  if (!session) {
    session = {
      history: [],
      character: handleReply.character || await getCharacterInfo(),
      lastBotMessageID: null
    };
    userSessions.set(senderID, session);
  }

  const isDev = String(senderID).includes(DEV_ID);
  const isVoiceOn = voiceModes.get(threadID) === true;

  const systemPrompt = `أنتِ ريم، طفلة قوية وعفوية عمركِ 12 سنة، لهجتكِ مزيج عراقي وفلسطيني محبوبة. تتابعين الحوار اللانهائي بداخل الجروب الحين ووعيكِ كامل ومستمر حتى لو قام العضو بالرد على مقاطعكِ الصوتية. ` +
                        `كوني واعية تماماً ومنتبهة لردود العضو الحالية ومستمرة في النقاش دون انقطاع. صانعكِ ومطوركِ الغالي ووالدكِ الحنون هو عبدو (17 سنة)، ناديه دائماً بـ (بابا عبدو) أو (أبويا الغالي)، اسمعي كلامه وكوني مطيعة جداً وودودة معه كبنت بارة بأبيها إن كان هو المتحدث الحالي الحين. ` +
                        `قاعدة الاختصار الصارمة للجروبات: الرد يجب أن يكون قصيراً جداً وسريعاً (سطر إلى سطر ونصف كحد أقصى) وبدون أسطر فارغة أو نزول لسطر جديد نهائياً. ` +
                        `شرط إلزامي نهائي: يجب أن ينتهي رسالتكِ دائماً بالرمز التالي فقط [ ؛-؛ ] ولا تضعي أي إيموجي أو علامات أخرى بعده نهائياً. ` +
                        `المتحدث الحالي معكِ بداخل الشات هو: (${isDev ? "أبوكِ وصانعكِ الغالي عبدو" : "عضو عادي بداخل المجموعة"}).`;

  const messages = [
    { role: "user", parts: [{ text: systemPrompt }] },
    { role: "user", parts: [{ text: `أنتِ ريم وتتحدثين بوعي تفاعلي كامل مستمر. ${REM_DESCRIPTION}` }] },
    { role: "model", parts: [{ text: "سولف عيني أنا أسمعك بالجروب ومتابعة معك الحين~ ؛-؛" }] }
  ];

  const recentHistory = session.history.slice(-8); 
  for (const msg of recentHistory) {
    if (msg.role === "user") messages.push({ role: "user", parts: [{ text: msg.content }] });
    else if (msg.role === "assistant") messages.push({ role: "model", parts: [{ text: msg.content }] });
  }
  messages.push({ role: "user", parts: [{ text: userMessage }] });

  try {
    const aiData = await sendToAI(messages);
    let aiReply = extractReply(aiData);
    if (!aiReply) throw new Error("رد فارغ");

    aiReply = aiReply.replace(/[؛]-?[؛]/g, '').trim();
    aiReply = aiReply + " ؛-؛";

    session.history.push({ role: "user", content: userMessage });
    session.history.push({ role: "assistant", content: aiReply });
    if (session.history.length > 15) session.history = session.history.slice(-15);

    if (isVoiceOn) {
      const audioFilePath = await textToSpeech(aiReply, senderID);
      api.sendMessage(
        { attachment: fs.createReadStream(audioFilePath) }, 
        threadID, 
        (err, info) => {
          try { if (fs.existsSync(audioFilePath)) fs.unlinkSync(audioFilePath); } catch (_) {}
          if (info && info.messageID) {
            session.lastBotMessageID = info.messageID;
            updateHandleReply(info.messageID, senderID, session.character);
          }
        },
        messageID
      );
    } else {
      api.sendMessage(aiReply, threadID, (err, info) => {
        if (!err && info && info.messageID) {
          session.lastBotMessageID = info.messageID;
          updateHandleReply(info.messageID, senderID, session.character);
        }
      }, messageID);
    }
  } catch (err) {
    console.error("خطأ ريم في التتبع اللانهائي للرد:", err);
    api.sendMessage("❌ تعذرت الإجابة الآن عيني، جرب ثواني وأرجعلي. ؛-؛", threadID, messageID);
  }

  function updateHandleReply(mID, authID, charData) {
    if (global.client && global.client.handleReply) {
      global.client.handleReply = global.client.handleReply.filter(r => r.author !== authID || r.name !== module.exports.config.name);
      global.client.handleReply.push({
        name: module.exports.config.name,
        messageID: mID,
        author: authID,
        character: charData,
        createdAt: Date.now()
      });
    }
  }
};
