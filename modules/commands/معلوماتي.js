module.exports.config = {
  name: "معلوماتي",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Abdou",
  description: "يعرض ملفك الشخصي وإحصائياتك في البوت والمجموعة بكامل تفاصيلها",
  commandCategory: "الخدمات",
  usages: "",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args, Users, Economy, Exp, Threads }) {
  const { threadID, messageID, senderID } = event;

  // 1. جلب بيانات اسم المستخدم والآيدي
  const userName = await Users.getNameUser(senderID);
  const userID = String(senderID);

  // 2. جلب بيانات الإحصائيات (الخبرة والمستوى)
  const userExp = await Exp.check(senderID);
  const currentLevel = userExp.data.currentLevel || 1;
  const currentExp = userExp.data.exp || 0;
  const nextLevelExp = userExp.data.levelUpExp || 500;

  // حساب نسبة التقدم ورسم شريط التقدم 📊
  const progressPercent = Math.floor((currentExp / nextLevelExp) * 100) || 0;
  const totalBars = 10;
  const filledBars = Math.round((progressPercent / 100) * totalBars);
  const emptyBars = totalBars - filledBars;
  const progressBar = "▓".repeat(filledBars) + "░".repeat(emptyBars);

  // 3. جلب الاقتصاد (الرصيد الكلي)
  const money = await Economy.getBalance(senderID, "money") || 0;
  const bank = await Economy.getBalance(senderID, "bank") || 0;
  const totalBalance = money + bank;

  // 4. تحديد نوع الحساب والدور في الجروب
  let accountType = "user"; 
  let groupRole = "👤 عضو";

  // التحقق من دور الأدمن والمطورين
  const config = global.client.config || {};
  const ownerBot = (config.ownerBot || []).map(String);

  if (ownerBot.includes(userID)) {
    accountType = "Developer / Owner 👑";
    groupRole = "👑 مطور البوت الرئيسي";
  }

  // جلب اسم الجروب ونوع الحساب إذا كان في جروب
  let groupName = "الدردشة الخاصة";
  if (event.isGroup) {
    try {
      const threadInfo = await new Promise((resolve, reject) => {
        api.getThreadInfo(threadID, (err, info) => {
          if (err) reject(err);
          else resolve(info);
        });
      });
      groupName = threadInfo.threadName || "مجموعة بدون اسم";

      // التحقق من الأدمن داخل الجروب
      const adminIDs = (threadInfo.adminIDs || []).map(a => String(a.id));
      if (adminIDs.includes(userID) && !ownerBot.includes(userID)) {
        groupRole = "🛡️ مسؤول المجموعة";
      }
    } catch (e) {
      groupName = "مجموعة عامة";
    }
  }

  // 5. تحديد مستوى التفاعل بناءً على المستوى الحالي
  let interaction = "⚡ عادي";
  if (currentLevel > 20) interaction = "🔥 نشط";
  if (currentLevel > 50) interaction = "🏆 أسطوري";
  if (currentLevel > 80) interaction = "👑 ملك التفاعل";

  // 6. صياغة الرسالة النهائية المزخرفة بدقة
  const msg = 
`┐───────────────┌
  🪪 ملـفّك الشـخصي
┘───────────────└

  ◈ الاسـم      ›  ${userName}
  ◈ الآيـدي     ›  ${userID}
  ◈ نـوع الحـساب ›  ${accountType}

  ‣ الجـنس      ›  ذكر ♂
  ‣ صـديق       ›  نعم ✓
  ‣ عـيد ميـلاد  ›  ليس اليوم

  ·  ·  ·  ·  ·  ·  ·
   🎀 الجَروب : ${groupName}
  ·  ·  ·  ·  ·  ·  ·
  ◆ الـدور       ›  ${groupRole}
  ◆ رسـائل كـروب  ›  يتم الحساب تلقائياً...

  ·  ·  ·  ·  ·  ·  ·
  🪸 الإحصـائيات
  ·  ·  ·  ·  ·  ·  ·
  ◇ رصـيد        ›  ${totalBalance.toLocaleString()} 🪙
  ◇ مسـتوى       ›  ${currentLevel} ✦
  ◇ خبـرة        ›  ${currentExp} نقطة
  ◇ تـقدم        ›  [ ${progressBar} ] ${progressPercent}%
  ◇ تفـاعلـك      ›  ${interaction}

✦───────────────✦
  🔗『  Bot 』
✦───────────────✦`;

  // إرسال الملف الشخصي كاملاً للمستخدم مع عمل منشن له
  return api.sendMessage({
    body: msg,
    mentions: [{
      tag: userName,
      id: senderID
    }]
  }, threadID, messageID);
};
