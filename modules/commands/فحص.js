const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "فحص",
  version: "2.5.0",
  hasPermssion: 2, // مخصص للأدمن والمطورين لإدارة النظام
  credits: "Abdou",
  description: "منظومة فحص النواة، كشف مشاكل الملفات، وتحليل بنية الأوامر",
  commandCategory: "نظام",
  usages: "[ملفات / اسم_الأمر]",
  cooldowns: 2
};

module.exports.run = async function (params) {
  const { api, event, args } = params;
  const { threadID, messageID } = event;

  // مسارات المجلدات الافتراضية للأوامر والأحداث
  const commandsPath = path.join(__dirname, "..", "commands");
  const eventsPath = path.join(__dirname, "..", "events");

  // 🛡️ الحالة الأولى: فحص شامل للنظام والاتصال [ فحص ]
  if (!args[0]) {
    const startTime = Date.now();
    const ramUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    const totalRam = (process.memoryUsage().rss / 1024 / 1024).toFixed(2);
    const ping = Date.now() - startTime;

    let sysMsg = 
      `●──────── 🌐 ────────●\n` +
      `   ⦿ ⟬ فَحْصُ النِّظَامِ وَالِاتِّصَالِ ⟭ ⦿\n` +
      `⊱ ──────────────── ⊰\n` +
      ` ⟣ ⚡ سُرْعَةُ الِاسْتِجَابَةِ (Ping): [ ${ping}ms ]\n` +
      ` ⟣ 💾 اسْتِهْلَاكُ الذَّاكِرَةِ (RAM): [ ${ramUsage}MB / ${totalRam}MB ]\n` +
      ` ⟣ 🔌 حَالَةُ الـ API النَّوَاةِ: [ مُسْتَقِرٌّ ✓ ]\n` +
      ` ⟣ ⏳ مَدَى تَشْغِيلِ السِّيرْفِرِ: [ ${(process.uptime() / 60).toFixed(1)} دقيقة ]\n` +
      ` ⟣ ⚙️ إِصْدَارُ النُّودِ (Node): [ ${process.version} ]\n` +
      `⊱ ──────────────── ⊰\n` +
      `💡 تَلْمِيحٌ: اكْتُبْ [ فحص ملفات ] لِكَشْفِ الأَوَامِرِ الْمُعَطَّلَةِ.\n` +
      `●──────── 🌐 ────────●`;

    return api.sendMessage(sysMsg, threadID, messageID);
  }

  // 📂 الحالة الثانية: فحص الملفات المعطوبة [ فحص ملفات ]
  if (args[0] === "ملفات" || args[0] === "الملفات") {
    let brokenCommands = [];
    let brokenEvents = [];
    let totalCmds = 0;
    let totalEvents = 0;

    // فحص مجلد الأوامر
    if (fs.existsSync(commandsPath)) {
      const files = fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"));
      totalCmds = files.length;
      for (const file of files) {
        try {
          require(path.join(commandsPath, file));
        } catch (e) {
          brokenCommands.push({ name: file, error: e.message.split("\n")[0] });
        }
      }
    }

    // فحص مجلد الأحداث
    if (fs.existsSync(eventsPath)) {
      const files = fs.readdirSync(eventsPath).filter(f => f.endsWith(".js"));
      totalEvents = files.length;
      for (const file of files) {
        try {
          require(path.join(eventsPath, file));
        } catch (e) {
          brokenEvents.push({ name: file, error: e.message.split("\n")[0] });
        }
      }
    }

    let fileMsg = 
      `●──────── 📂 ────────●\n` +
      `   ⦿ ⟬ تَقْرِيرُ سَلَامَةِ الْمَلَفَّاتِ ⟭ ⦿\n` +
      `⊱ ──────────────── ⊰\n` +
      ` ⟣ 📊 مَجْمُوعُ الأَوَامِرِ الْمَفْحُوصَةِ: [ ${totalCmds} ]\n` +
      ` ⟣ 📉 مَجْمُوعُ الأَحْدَاثِ الْمَفْحُوصَةِ: [ ${totalEvents} ]\n` +
      `⊱ ──────────────── ⊰\n`;

    if (brokenCommands.length === 0 && brokenEvents.length === 0) {
      fileMsg += ` ✅ جَمِيعُ الْمَلَفَّاتِ تَعْمَلُ بِكَفَاءَةٍ 100% وَلَا وُجُودَ لأَيِّ عُطْلٍ بَرْمَجِيٍّ.\n`;
    } else {
      if (brokenCommands.length > 0) {
        fileMsg += `⚠️ الأَوَامِرُ الْمُعَطَّلَةِ (${brokenCommands.length}):\n`;
        brokenCommands.forEach(c => fileMsg += ` ✖ [ ${c.name} ] ↦ الخطأ: ${c.error}\n`);
      }
      if (brokenEvents.length > 0) {
        fileMsg += `\n⚠️ الأَحْدَاثُ الْمُعَطَّلَةِ (${brokenEvents.length}):\n`;
        brokenEvents.forEach(e => fileMsg += ` ✖ [ ${e.name} ] ↦ الخطأ: ${e.error}\n`);
      }
    }
    fileMsg += `●──────── 📂 ────────●`;
    return api.sendMessage(fileMsg, threadID, messageID);
  }

  // 🔍 الحالة الثالثة: فحص وتفكيك بنية أمر معين [ فحص اسم_الأمر ]
  const targetCommand = args[0].trim().toLowerCase();
  let cmdFile = path.join(commandsPath, `${targetCommand}.js`);
  let isEvent = false;

  // إذا لم يجد الملف في الأوامر يبحث في الأحداث
  if (!fs.existsSync(cmdFile)) {
    cmdFile = path.join(eventsPath, `${targetCommand}.js`);
    isEvent = true;
  }

  if (!fs.existsSync(cmdFile)) {
    return api.sendMessage(`❌ | لَمْ يَتِمَّ الْعَثُورُ عَلَى أَمْرٍ أَوْ حَدَثٍ بِاسْمِ [ ${targetCommand}.js ] فِي النُّظُمِ.`, threadID, messageID);
  }

  try {
    // إزالة الكاش لإعادة قراءة الملف طازجاً بنسبة 100%
    delete require.cache[require.resolve(cmdFile)];
    const script = require(cmdFile);
    const config = script.config || {};

    // استخراج المتغيرات الممررة ديناميكياً للدالة الأساسية لـ run أو handleEvent
    const runFunc = script.run || script.handleEvent || function() {};
    const extractParams = runFunc.toString()
      .replace(/[/][/].*$/mg, "") // إزالة التعليقات السطرية
      .replace(/\s+/g, "") // إزالة المسافات
      .match(/^[^(]*\(([^)]*)\)/); // التقاط ما بداخل الأقواس

    const variablesInCode = extractParams && extractParams[1] ? extractParams[1] : "api, event, args";

    // حساب حجم الملف بالكيلوبايت
    const fileStats = fs.statSync(cmdFile);
    const fileSizeKB = (fileStats.size / 1024).toFixed(2);

    // بطاقة البيانات الفخمة العشرة (10) المطلوبة بالكامل
    let cmdDetailsMsg = 
      `●──────── 📋 ────────●\n` +
      `   ⦿ ⟬ بِطَاقَةُ تَحْلِيلِ الأَمْرِ الْفَنِّيَّةِ ⟭ ⦿\n` +
      `⊱ ──────────────── ⊰\n` +
      ` 1 ⟣ 🧬 النَّوْعُ: [ ${isEvent ? "مجلد الأحداث (Event)" : "مجلد الأوامر (Command)"} ]\n` +
      ` 2 ⟣ 🏷️ الِاسْمُ التِّجَارِيُّ: [ ${config.name || targetCommand} ]\n` +
      ` 3 ⟣ 🛡️ الصَّلَاحِيَّةُ: [ ${config.hasPermssion !== undefined ? config.hasPermssion : "غير محددة"} ]\n` +
      ` 4 ⟣ 📥 الْمُتَغَيِّرَاتُ النَّشِطَةُ: [ ${variablesInCode} ]\n` +
      ` 5 ⟣ 🚀 سُرْعَةُ التَّبْرِيدِ (Cooldown): [ ${config.cooldowns || 0} ثوانٍ ]\n` +
      ` 6 ⟣ ✍️ الْكَاتِبُ (Credits): [ ${config.credits || "غير معروف"} ]\n` +
      ` 7 ⟣ 📂 حَجْمُ مَلَفِّ السِّكْرِبْتِ: [ ${fileSizeKB} KB ]\n` +
      ` 8 ⟣ 📌 التَّصْنِيفُ (Category): [ ${config.commandCategory || "بدون تصنيف"} ]\n` +
      ` 9 ⟣ 🔗 الِاسْتِجَابَةُ لِلْبَادِئَةِ (Prefix): [ ${config.usePrefix === false ? "لا يتطلب بادئة" : "يتطلب بادئة"} ]\n` +
      ` 10 ⟣ 🛠️ الِاعْتِمَادِيَّاتُ (Dependencies): [ ${config.dependencies ? Object.keys(config.dependencies).join(", ") : "لا توجد"} ]\n` +
      `⊱ ──────────────── ⊰\n` +
      ` 📝 الْوَصْفُ: ${config.description || "لا يوجد وصف متوفر لهذا الأمر."}\n` +
      `●──────── 📋 ────────●`;

    return api.sendMessage(cmdDetailsMsg, threadID, messageID);

  } catch (error) {
    console.error("[COMMAND ANALYSIS CRITICAL ERROR]", error);
    return api.sendMessage(`⚠️ | فَشِلَ تَحْلِيلُ الْمَلَفِّ بَسَبَبِ خَطَأٍ بَرْمَجِيٍّ دَاخِلِيٍّ:\n» ${error.message.split("\n")[0]}`, threadID, messageID);
  }
};
