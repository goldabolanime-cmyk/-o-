const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "تصنيف",
  version: "1.0.0",
  hasPermssion: 2, // مخصص للمطورين فقط لأنه يتحكم بصلاحيات الأوامر
  credits: "Abdou",
  description: "تغيير صلاحية (hasPermssion) لأي أمر في السورس مباشرة",
  commandCategory: "المطور",
  usages: "[اسم الأمر] [0 أو 1 == أو 2 أو 3]",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  // 1️⃣ التأكد من المدخلات
  const commandName = (args[0] || "").toLowerCase();
  const newPerm = args[1];

  if (!commandName || !newPerm) {
    return api.sendMessage("⚠️ ┃ صيغة الأمر خاطئة!\n💡 ┃ الاستخدام: .تصنيف [اسم_الأمر] [الرقم]\nمثال: .تصنيف طرد 2", threadID, messageID);
  }

  // التأكد من أن الرقم المدخل صالح (0، 1، 2، 3)
  if (!["0", "1", "2", "3"].includes(newPerm)) {
    return api.sendMessage("⛔ ┃ رقم التصنيف غير صالح! يجب أن يكون (0 أو 1 أو 2 أو 3).\n0 ⟻ للجميع\n1 ⟻ للمشرفين\n2/3 ⟻ للمطورين", threadID, messageID);
  }

  // 2️⃣ تحديد مسار ملف الأمر المستهدف
  // ملاحظة: قم بتعديل مسار المجلد لو كان مجلد الأوامر عندك باسم آخر (مثل commands أو modules)
  const commandsDir = path.join(__dirname, ".."); 
  let filePath = path.join(commandsDir, `${commandName}.js`);

  // إذا لم يجده في المجلد الرئيسي، يبحث في المجلد الحالي (احتياطاً)
  if (!fs.existsSync(filePath)) {
    filePath = path.join(__dirname, `${commandName}.js`);
  }

  if (!fs.existsSync(filePath)) {
    return api.sendMessage(`❌ ┃ لم يتم العثور على ملف باسم [ ${commandName}.js ] في مجلد الأوامر.`, threadID, messageID);
  }

  try {
    // 3️⃣ قراءة محتوى الملف وتعديله بالـ Regex الذكي
    let fileContent = fs.readFileSync(filePath, "utf8");

    // ريجكس يبحث عن hasPermssion أو hasPermission ويقبض على الرقم بعدها
    const permRegex = /(hasPermssion|hasPermission)\s*:\s*[0-3]/g;

    if (!permRegex.test(fileContent)) {
      return api.sendMessage("⚠️ ┃ لم يتم العثور على سطر صلاحية مألوف داخل إعدادات هذا الأمر (config).", threadID, messageID);
    }

    // استبدال القيمة القديمة بالقيمة الجديدة بدقة
    const updatedContent = fileContent.replace(permRegex, `$1: ${newPerm}`);

    // كتابة التعديل داخل الملف
    fs.writeFileSync(filePath, updatedContent, "utf8");

    // 4️⃣ إعادة تحميل الأمر في ذاكرة البوت الحية (Reload) لتفعيل التعديل فوراً
    if (global.client && global.client.commands) {
      // حذف الكاش القديم للملف من ذاكرة الـ Node.js
      delete require.cache[require.resolve(filePath)];

      // جلب الملف المحدث
      const updatedCommand = require(filePath);

      // إعادة تسجيله في ماب الأوامر
      global.client.commands.set(updatedCommand.config.name, updatedCommand);

      // تحديث الأسماء المستعارة (Aliases) إذا وجدت
      if (updatedCommand.config.aliases) {
        for (const alias of updatedCommand.config.aliases) {
          global.client.commands.set(alias, updatedCommand);
        }
      }
    }

    return api.sendMessage(`✅ ┃ تم بنجاح تغيير تصنيف صلاحية أمر [ ${commandName} ] إلى: ${newPerm}\n⚙️ ┃ النظام قام بتحديث الملف وإعادة تحميله تلقائياً!`, threadID, messageID);

  } catch (error) {
    console.error(error);
    return api.sendMessage(`❌ ┃ حدث خطأ أثناء تعديل الملف: ${error.message}`, threadID, messageID);
  }
};
