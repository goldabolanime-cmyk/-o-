// ══════════════════════════════════════════
// CONFIG
// ══════════════════════════════════════════
module.exports.config = {
  name: "طرد",
  version: "5.0.0",
  hasPermssion: 0, // مخصص للمشرفين والمطورين
  credits: "Abdou",
  description: "نظام طرد مضحك + نظام الطرد الكاتم الذكي (التحكم عبر كنية البوت والمراقبة في الخلفية)",
  commandCategory: "إدارة المجموعات",
  usages: "[بالرد على شخص] أو [كاتم تشغيل بالرد] أو [كاتم الكل] أو [كاتم ايقاف بالرد/الكل]",
  cooldowns: 2
};

// ══════════════════════════════════════════
// MONITOR (نظام مراقبة رسائل المكتومين تلقائياً)
// ══════════════════════════════════════════
module.exports.handleEvent = async function({ api, event }) {
  const { threadID, senderID, messageID } = event;

  // التأكد من وجود كاش التتبع وتواجد العضو فيه
  if (!global.client.kickMute || !global.client.kickMute[threadID] || !global.client.kickMute[threadID][senderID]) return;

  let userData = global.client.kickMute[threadID][senderID];
  userData.warns += 1; // زيادة عدد الإنذارات

  if (userData.warns === 1) {
    return api.sendMessage(`⚠️ ┃ تنبيه عاجل!\nلقد تم وضعك في حالة (طرد كاتم) وحاولت التحدث.\n🚫 الإنذار الأول (1/3). كل من سيرسل رسالة وهو مكتوم سيتم تحذيره!`, threadID, messageID);
  } 
  else if (userData.warns === 2) {
    return api.sendMessage(`🚨 ┃ تحذير أخير!\nأنت تخترق نظام الكتم الآن وعقوبتك تقترب.\n🚫 الإنذار الثاني (2/3). السقوط القادم هو الطرد الفوري!`, threadID, messageID);
  } 
  else if (userData.warns >= 3) {
    // حذف بيانات التتبع قبل الطرد لمنع التعليق
    delete global.client.kickMute[threadID][senderID];

    api.sendMessage(`💥 ┃ الإنذار الثالث والأخير!\nبما أنك لم تحترم القوانين واستمررت في إرسال الرسائل، سيتم تطبيق العقوبة الآن.. طرد فوري!`, threadID, () => {
      api.removeUserFromGroup(senderID, threadID, (err) => {
        if (err) console.error("فشل الطرد التلقائي للمكتوم:", err);
      });
    }, messageID);
  }
};

// ══════════════════════════════════════════
// RUN (العمل الأساسي عند كتابة الأمر)
// ══════════════════════════════════════════
module.exports.run = async function ({ api, event, args, Users }) {
  const { threadID, messageID, messageReply, senderID } = event;
  const botID = api.getCurrentUserID();

  // تهيئة كاش الذاكرة الحية
  if (!global.client.kickMute) global.client.kickMute = {};
  if (!global.client.kickMute[threadID]) global.client.kickMute[threadID] = {};
  if (!global.client.kickMute[threadID].botData) global.client.kickMute[threadID].botData = { oldNickname: "", isGlobal: false };

  // جلب معلومات المجموعة والرتب
  const threadInfo = await api.getThreadInfo(threadID);
  const adminIDs = threadInfo.adminIDs.map(a => String(a.id));

  // التحقق من رتبة المنفذ (يجب أن يكون أدمن)
  if (!adminIDs.includes(String(senderID))) {
    return api.sendMessage("👑 ┃ عذراً، صلاحية استخدام هذا الأمر والتحكم بالطرد مخصصة لأدمن المجموعة فقط!", threadID, messageID);
  }

  const action = args[0];
  const subAction = args[1];

  // 🌐 [أولاً: أنظمة الطرد الكاتم (تشغيل / إيقاف)]
  if (action === "كاتم") {

    // جلب اسم البوت الحالي أو كنيته داخل المجموعة لاستخدامها في التغيير
    const botName = await Users.getNameUser(botID) || "البوت";
    const currentBotNickname = threadInfo.nicknames[botID] || botName;

    // 📢 [أ] حالة كتم المجموعة بالكامل (طرد كاتم الكل / المجموعه)
    if (subAction === "الكل" || subAction === "المجموعه" || subAction === "مجموعه") {

      // حفظ كنية البوت الأصلية قبل التعديل لضمان استعادتها لاحقاً
      if (!global.client.kickMute[threadID].botData.oldNickname) {
        global.client.kickMute[threadID].botData.oldNickname = currentBotNickname;
      }
      global.client.kickMute[threadID].botData.isGlobal = true;

      // تصفية وإضافة جميع الأعضاء لقائمة المراقبة بالخلفية دون لمس كنياتهم
      let targetMembers = threadInfo.participantIDs.filter(id => !adminIDs.includes(String(id)) && String(id) !== String(botID));

      for (const id of targetMembers) {
        global.client.kickMute[threadID][id] = { warns: 0 };
      }

      // تعديل كنية البوت نفسه فقط بالرموز بدون أقواس
      return api.changeNickname(`🚫 ${global.client.kickMute[threadID].botData.oldNickname} 🚫`, threadID, botID, (err) => {
        if (err) console.error("فشل تعديل كنية البوت:", err);
        return api.sendMessage(`╭──⟪ 🚫 **طـرد كـاتـم: الـمـجـمـوعـة كـامـلـة** ⟫──╮\n\n⚙️ ┃ الحالة: تم تفعيل الكتم العام على جميع الأعضاء بنجاح وتعديل كنية البوت!\n\n💬 ┃ فحوى النظام:\nأي عضو سيتحدث من الآن (باستثناء الإدارة) سيتم تحذيره تلقائياً حتى الإنذار الثالث ⟻ ثم طرد فوري ومباشر!`, threadID, messageID);
      });
    }

    // 🔓 [ب] حالة إلغاء كتم المجموعة بالكامل أو كتم الأفراد (طرد كاتم ايقاف)
    if (subAction === "ايقاف") {
      const savedBotNick = global.client.kickMute[threadID].botData.oldNickname || currentBotNickname;

      // تفريغ كاش المراقبة بالكامل للمجموعة
      global.client.kickMute[threadID] = {}; 

      // إعادة تعيين كنية البوت وتزيينها بالرموز بدون أقواس
      return api.changeNickname(`✅️ ${savedBotNick} ✅️`, threadID, botID, (err) => {
        if (err) return api.sendMessage("❌ ┃ فشل في إعادة تعيين كنية البوت الأصلية.", threadID, messageID);
        return api.sendMessage(`╭──⟪ ✅ **طـرد كـاتـم: إيـقـاف الـكـل** ⟫──╮\n\n🔓 ┃ تم إيقاف مراقبة الكتم بالكامل وإعادة ضبط كنية البوت بنجاح!`, threadID, messageID);
      });
    }

    // 🎯 [ج] حالة تشغيل الكتم الفردي بالرد على شخص محدد
    if (!messageReply) {
      return api.sendMessage("⚠️ ┃ لتطبيق الكتم على عضو محدد يرجى الرد على رسالته، أو اكتب `طرد كاتم الكل` لتطبيقه على الجميع.", threadID, messageID);
    }

    const victimID = messageReply.senderID;
    const victimName = await Users.getNameUser(victimID) || "العضو";

    if (!subAction || subAction === "تشغيل") {
      // حفظ كنية البوت الأصلية
      if (!global.client.kickMute[threadID].botData.oldNickname) {
        global.client.kickMute[threadID].botData.oldNickname = currentBotNickname;
      }

      // وضع الضحية تحت مراقبة الإنذارات في الخلفية
      global.client.kickMute[threadID][victimID] = { warns: 0 };

      // تعديل كنية البوت نفسه للإشارة إلى تفعيل النظام
      return api.changeNickname(`🚫 ${global.client.kickMute[threadID].botData.oldNickname} 🚫`, threadID, botID, (err) => {
        if (err) return api.sendMessage("❌ ┃ فشل في تعديل كنية البوت، تأكد من الصلاحيات.", threadID, messageID);
        return api.sendMessage(`╭──⟪ 🚫 **طـرد كـاتـم: تـشـغـيـل** ⟫──╮\n\n👤 ┃ المستهدف: ${victimName}\n⚙️ ┃ الحالة: تم قفل المراقبة في الخلفية بنجاح وتغيير كنية البوت!\n\n💬 ┃ فحوى النظام:\nإذا أرسل هذا العضو رسالة سيحذر بالترتيب:\n1️⃣ الإنذار الأول\n2️⃣ الإنذار الثاني\n3️⃣ الإنذار الثالث ⟻ طرد فوري ومباشر!`, threadID, messageID);
      });
    }
  }

  // 2️⃣ [ثانياً: نظام الطرد العادي والمضحك]
  if (!messageReply) {
    return api.sendMessage("╮──────⟢ـ\n┆ ⚠️ يـجب أن تـرد عـلى رسـالـة الـشخص المـستهدف!\n╯──────⟢ـ", threadID, messageID);
  }

  const victimID = messageReply.senderID;
  const victimName = await Users.getNameUser(victimID) || "العضو";

  // إذا رد المشرف على البوت نفسه (البوت يطرد نفسه)
  if (String(victimID) === String(botID)) {
    return api.sendMessage("🫡 ┃ علم وينفذ.. سأطرد نفسي فوراً، وداعاً!", threadID, () => {
      api.removeUserFromGroup(botID, threadID);
    }, messageID);
  }

  const kickRoasts = [
    `🏃‍♂️💨 طـيـران إلـى الـخـارج! يا ${victimName}، الـجروب لـلأسـاطـير ولـيـس لـلـمـزهرية مـثـلك!`,
    `🚪🚮 تـم تـنـظـيـف الـمـجـمـوعة مـن الـفـيروسـات.. وداعـاً يـا ${victimName} دون رجـعـة!`,
    `🚀💥 وجـهـك لا يـُنـاسـب مـعـايـير الـهـيـبـة هـنـا، تـم إطـلاقـك إلـى كـوكـب الـمـطـروديـن يـا ${victimName}!`,
    `🤫🚷 بـمـا أنـك تـحـب الـمـشـاهـدة بـصـمـت، اذهب وشـاهـد الـجروب مـن الـخـارج بـشـكـل أفـضـل!`,
    `🧹🤡 عـذراً يـا ${victimName}، انـتـهـت صـلاحـيـة إقـامـتـك الـمـجـانـيـة فـي مـجـتـمـع الـكـبـار!`,
    `🦖🚫 لـقـد تـم طـردك لأن وجـودك يـسـبـب هـبـوطـاً حـاداً فـي مـسـتـوى ذكـاء الـمـجـمـوعة!`,
    `🎈💨 مـنـفـوخ عـلـى الـفـاضـي.. خـروج نـهـائـي لـلـتـهـويـة وإصـلاح مـلامـح الـجـبـهـة!`,
    `🕳️🛹 الـى الـلـقـاء يـا ${victimName}، ابـحـث عـن جـروب آخـر يـتـحـمـل كـمـيـة الـتـفـاهـة الـتـي تـمـلـكـها!`,
    `📸❌ تـم حـذفك بـنـجـاح.. لـقـد كـنـت خـطـأً إمـلائـيـاً فـي قـائـمـة الأعـضـاء لـديـنـا!`,
    `🧯🔥 ابلع الـبـوكـس الـطـائـر! جـاري قـذفـك خـارج الـمـحـادثـة لـتـبـريـد جـبـهـتـك الـمـشـتـعـلـة!`
  ];

  const randomKickMessage = kickRoasts[Math.floor(Math.random() * kickRoasts.length)];

  return api.sendMessage(`╮──────⟢ـ 『 💥 **إشـعـار الـطـرد** 』\n┆\n┆ ${randomKickMessage}\n┆\n╯──────⟢ـ`, threadID, () => {
    api.removeUserFromGroup(victimID, threadID, (err) => {
      if (err) return api.sendMessage("❌ ┃ فشل في طرد العضو، تأكد من صلاحيات البوت المشرف.", threadID, messageID);
    });
  }, messageID);
};
