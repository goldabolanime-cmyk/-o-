const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "تصنيف",
  version: "1.0.0",
  hasPermssion: 2, // 👑 متاح للمطورين فقط بناءً على تهيئة الاندكس
  credits: "Abdou",
  description: "تغيير تصنيف وصلاحية أي أمر في البوت وحفظها تلقائياً",
  commandCategory: "المطور",
  usages: "[اسم الأمر] [0 أو 1 أو 2]",
  cooldowns: 3
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;

  const configPath = path.join(__dirname, "..", "..", "config.json");

  // ──✨ الزخارف الموحدة الفخمة لـ ريم بوت ✨──
  const header = "╭────── ⟪ 𝑹𝑬𝑴-𝑩𝑶𝑻 ⟫ ──────╮";
  const footer = "╰────────────────────────╯";
  const divider = " ────────── ⌬ ──────────";

  // 1. التحقق من المدخلات
  if (args.length < 2) {
    return api.sendMessage(
      `${header}\n` +
      `       ⚙️ تـصـنـيـف الأوامـر ⚙️\n` +
      `${divider}\n` +
      `💡 | الاستخدام الصحيح للأمر:\n` +
      `👈 .تصنيف [إسم الأمر] [رقم التصنيف]\n\n` +
      `📊 | الأرقام المتاحة بالتوافق مع النواة:\n` +
      `🔹 [ 0 ] ↜ متاح للجميع مجاناً\n` +
      `🔹 [ 1 ] ↜ مسؤولين ومشرفين المجموعات\n` +
      `🔹 [ 2 ] ↜ مطوري البوت فقط\n` +
      `${footer}`, 
      threadID, messageID
    );
  }

  const commandName = args[0].toLowerCase();
  const newPermission = parseInt(args[1]);

  // 2. التحقق من صحة رقم التصنيف المدخل
  if (isNaN(newPermission) || ![0, 1, 2].includes(newPermission)) {
    return api.sendMessage("❌ | رقم التصنيف غير صالح! يرجى اختيار إما 0 أو 1 أو 2 فقط.", threadID, messageID);
  }

  // 3. التحقق من وجود الأمر في ذاكرة البوت الحالية
  if (!global.client.commands.has(commandName)) {
    return api.sendMessage(`❌ | لا يوجد أمر مفعّل في البوت باسم "${commandName}".`, threadID, messageID);
  }

  try {
    // 4. جلب نسخة الأمر الحالية لتحديث الذاكرة المؤقتة (RAM)
    const cmd = global.client.commands.get(commandName);
    const configData = cmd.config || cmd.default?.config;

    if (!configData) {
      return api.sendMessage(`❌ | بنية أمر "${commandName}" لا تدعم تعديل التكوين.`, threadID, messageID);
    }

    // تحويل الأرقام الحالية والجديدة إلى نصوص واضحة في الرسالة
    const getRoleName = (permLevel) => {
      if (permLevel === 2) return "المطورين 👑";
      if (permLevel === 1) return "مسؤولي المجموعات 🛡️";
      return "الجميع 👤";
    };

    const oldPermission = configData.hasPermssion ?? 0;
    const oldRole = getRoleName(oldPermission);
    const newRole = getRoleName(newPermission);

    // 5. تحديث الصلاحية في الذاكرة الحية فوراً (بدون إعادة تشغيل)
    configData.hasPermssion = newPermission;

    // 6. الحفظ التلقائي والدائم داخل ملف config.json لمنع الضياع
    let currentConfig = {};
    if (fs.existsSync(configPath)) {
      currentConfig = fs.readJsonSync(configPath);
    }

    // إذا كان هناك قسم مخصص لتجاوزات الأوامر أو نقوم بتحديثه مباشرة
    if (!currentConfig.commandConfig) currentConfig.commandConfig = {};
    if (!currentConfig.commandConfig[commandName]) currentConfig.commandConfig[commandName] = {};

    currentConfig.commandConfig[commandName].hasPermssion = newPermission;
    fs.writeJsonSync(configPath, currentConfig, { spaces: 2 });

    // 7. إرسال رسالة النجاح المزخرفة
    const successMsg = 
      `${header}\n` +
      `      ⚙️ تـم تـعـديـل الـتـصـنـيـف ⚙️\n` +
      `${divider}\n` +
      `🔹 🪬 الأ مـر ↜ [ ${commandName} ]\n` +
      `🔹 ⏳ مِـن تـصـنـيـف ↜ ${oldRole}\n` +
      `🔹 🚀 إلـى تـصـنـيـف ↜ ${newRole}\n` +
      `${divider}\n` +
      `✅ | تم تحديث الصلاحية بنجاح وتطبيقها في الـ index وحفظها بالملفات.\n` +
      `${footer}`;

    return api.sendMessage(successMsg, threadID, messageID);

  } catch (error) {
    console.error("[PERMISSION CMD ERROR]", error);
    return api.sendMessage(`❌ | حدث خطأ أثناء محاولة حفظ التصنيف الجديد:\n${error.message}`, threadID, messageID);
  }
};
