const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const { exec } = require("child_process");

module.exports.config = {
  name: "ملفات",
  aliases: ["cmd", "تيربو", "مدير"],
  version: "20.95.0",
  hasPermssion: 2, // للمطورين والمسؤولين فقط لحماية السيرفر
  credits: "ايـتاشـي ساي / تعديل عبدو",
  description: "مدير ملفات متكامل ومتطور مدمج بالتيرمنال والشيل مع اختصارات ذكية للأوامر 🐚",
  commandCategory: "نظام",
  usages: "[شيل/انشاء/تغيير/حذف/عرض/رابط/كودي/تحميل/قائمة/مكتبة/تسمية/بحث/اوامر]",
  cooldowns: 5
};

// ─── إعدادات وحماية النظام ───
const OWNER_ID = "61585457137026"; // ايدي الحساب المصرح له
const baseDir = path.resolve(process.cwd(), "modules", "commands"); // مسار الأوامر لبوتك
const rootDir = process.cwd();
const protectedFiles = ['index.js', 'package.json', 'config.json'];
const protectedDirs = ['node_modules', '.git', 'database'];

function isProtected(filePath) {
  const relativePath = path.relative(rootDir, filePath);
  const fileName = path.basename(filePath);
  const dirName = relativePath.split(path.sep)[0];
  if (protectedFiles.includes(fileName)) return true;
  if (protectedDirs.includes(dirName)) return true;
  return false;
}

function getIcon(itemPath, isDirectory) {
  if (isDirectory) {
    const dirName = path.basename(itemPath);
    const icons = {
      'commands': '📦', 'node_modules': '📚', 'database': '📁', 
      'cache': '💾', 'includes': '⚙️', 'modules': '📂'
    };
    return icons[dirName] || '📁';
  } else {
    const ext = path.extname(itemPath);
    const icons = { '.js': '📄', '.json': '📋', '.txt': '📝', '.md': '📖', '.log': '📊' };
    return icons[ext] || '📃';
  }
}

function listDirectory(dirPath, showHidden = false) {
  if (!fs.existsSync(dirPath)) return null;
  const items = fs.readdirSync(dirPath);
  const result = { directories: [], files: [] };
  items.forEach(item => {
    if (!showHidden && item.startsWith('.')) return;
    if (['node_modules', '.git'].includes(item) && !showHidden) return;
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    const isProt = isProtected(fullPath);
    if (stat.isDirectory()) {
      result.directories.push({ name: item, path: fullPath, icon: getIcon(fullPath, true), protected: isProt });
    } else {
      result.files.push({ name: item, path: fullPath, icon: getIcon(fullPath, false), size: stat.size, protected: isProt });
    }
  });
  return result;
}

function unloadCommand(commandName) {
  try {
    if (global.client && global.client.commands) {
      global.client.commands.delete(commandName);
    }
  } catch (e) { console.error("Unload Error:", e); }
}

function findPath(name) {
  if (!name) return null;
  const clean = name.toLowerCase().replace(".js", "");
  const directPath = path.join(baseDir, clean + ".js");
  if (fs.existsSync(directPath)) return directPath;

  const search = (dir) => {
    if (!fs.existsSync(dir)) return null;
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        if (['node_modules', '.git', 'cache'].includes(file)) continue;
        const found = search(fullPath);
        if (found) return found;
      } else if (file.toLowerCase() === `${clean}.js` || file.toLowerCase() === name.toLowerCase()) {
        return fullPath;
      }
    }
    return null;
  };
  return search(baseDir);
}

async function smartSearch(keyword, page = 0) {
  const resultsPerPage = 8;
  const results = [];

  const searchInFile = (filePath) => {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      const fileName = path.basename(filePath);
      const relativePath = path.relative(baseDir, filePath);
      const fileNameMatch = fileName.toLowerCase().includes(keyword.toLowerCase());
      const matches = [];

      lines.forEach((line, index) => {
        if (line.toLowerCase().includes(keyword.toLowerCase())) {
          matches.push({ lineNumber: index + 1, lineContent: line.trim().substring(0, 80) });
        }
      });

      if (fileNameMatch || matches.length > 0) {
        let score = fileNameMatch ? 100 : 0;
        score += matches.length * 10;

        let commandName = "", author = "", description = "";
        const nameMatch = content.match(/name\s*:\s*["']([^"']+)["']/);
        const authorMatch = content.match(/credits\s*:\s*["']([^"']+)["']/);
        const descMatch = content.match(/description\s*:\s*["']([^"']+)["']/);

        if (nameMatch) commandName = nameMatch[1];
        if (authorMatch) author = authorMatch[1];
        if (descMatch) description = descMatch[1];

        results.push({ fileName, relativePath, fullPath: filePath, commandName, author, description, matches: matches.slice(0, 3), totalMatches: matches.length, score, isFileNameMatch: fileNameMatch });
      }
    } catch (e) {}
  };

  const scanDirectory = (dir) => {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        if (['node_modules', '.git', 'cache'].includes(file)) continue;
        scanDirectory(fullPath);
      } else if (file.endsWith('.js') || file.endsWith('.json')) {
        searchInFile(fullPath);
      }
    }
  };

  scanDirectory(baseDir);
  results.sort((a, b) => b.score - a.score);
  const totalResults = results.length;
  const startIndex = page * resultsPerPage;
  const pageResults = results.slice(startIndex, startIndex + resultsPerPage);
  return { results: pageResults, total: totalResults, page, hasMore: (startIndex + resultsPerPage) < totalResults, totalPages: Math.ceil(totalResults / resultsPerPage) };
}

async function uploadPastefy(content, title = "code.js") {
  const PASTEFY_TOKEN = "Ln2mGEWdx3KFToFbmJWO86ykEsNUCXAUUDm0zTN0XZojsd00FnfTQ7VzBmC7";
  const res = await axios.post("https://pastefy.app/api/v2/paste",
    { content, title, type: "PASTE" },
    { headers: { "Content-Type": "application/json", "Authorization": `Bearer ${PASTEFY_TOKEN}` }, timeout: 10000 }
  );
  const id = res.data?.paste?.id;
  if (!id) throw new Error("فشل الرفع");
  return `https://pastefy.app/${id}/raw`;
}

async function reloadCommand(fPath) {
  try {
    delete require.cache[require.resolve(fPath)];
    const newCommand = require(fPath);
    if (!newCommand || !newCommand.config || !newCommand.config.name) return { success: false, error: "بنية الكود غير صالحة للنواة" };
    if (global.client && global.client.commands) {
      if (global.client.commands.has(newCommand.config.name)) unloadCommand(newCommand.config.name);
      global.client.commands.set(newCommand.config.name, newCommand);
    }
    return { success: true, name: newCommand.config.name };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ══════════════════════════════════════════
// HANDLE REPLY (التنقل والتفاعل الذكي عبر الردود)
// ══════════════════════════════════════════
module.exports.handleReply = async function ({ api, event, handleReply }) {
  const { threadID, messageID, senderID, body } = event;
  if (String(senderID) !== OWNER_ID && String(senderID) !== "100090081489341") return; // التحقق من المطور

  try {
    if (handleReply.type === "search_results") {
      const userInput = body.trim().toLowerCase();
      if (["التالي", "next", "تالي"].includes(userInput)) {
        const keyword = handleReply.keyword;
        const nextPage = handleReply.page + 1;
        const searchResult = await smartSearch(keyword, nextPage);
        if (searchResult.results.length === 0) return api.sendMessage("📭 لا توجد نتائج إضافية", threadID, messageID);

        let message = `●─────── ⌬ ───────●\n ⦿ ⟬ 🔍 نتائج البحث ⟭ ⦿\n┝━━━━━━━━━━━━━━━\n┇🔎 الكلمة: ${keyword}\n┇📊 النتائج: ${searchResult.total} ملف\n┇📄 الصفحة ${nextPage+1}/${searchResult.totalPages}\n`;
        searchResult.results.forEach((result, index) => {
          const globalIndex = (nextPage * 8) + index + 1;
          message += `┝━━━━━━━━━━━━━━━\n┇ [${globalIndex}] ${result.isFileNameMatch ? '📌' : '📄'} ${result.fileName}\n┇ 📂 ${result.relativePath}\n`;
        });
        if (searchResult.hasMore) message += `┝━━━━━━━━━━━━━━━\n┇ 📌 رد بـ "التالي" للمتابعة\n`;
        message += `●─────── ⌬ ───────●`;

        return api.sendMessage(message, threadID, (err, info) => {
          if (!err) {
            global.client.handleReply.push({ name: module.exports.config.name, messageID: info.messageID, type: "search_results", keyword, page: nextPage });
          }
        }, messageID);
      }
    }

    if (handleReply.type === "directory_list") {
      const userInput = body.trim();
      if (["رجوع", "back", "عودة"].includes(userInput.toLowerCase())) {
        if (handleReply.currentPath === rootDir) return api.sendMessage("📍 أنت في المجلد الجذر بالفعل", threadID, messageID);
        const parentPath = path.dirname(handleReply.currentPath);
        const listing = listDirectory(parentPath);
        let message = `●─────── ⌬ ───────●\n ⦿ ⟬ 📂 القائمة ⟭ ⦿\n┝━━━━━━━━━━━━━━━\n┇ 📍 ${path.relative(rootDir, parentPath) || 'الجذر'}\n`;
        let counter = 1;
        listing.directories.forEach((dir) => { message += `┝━━━━━━━━━━━━━━━\n┇ [${counter}] ${dir.icon} ${dir.name}/\n`; counter++; });
        listing.files.forEach((file) => { message += `┝━━━━━━━━━━━━━━━\n┇ [${counter}] ${file.icon} ${file.name}\n`; counter++; });
        message += `┝━━━━━━━━━━━━━━━\n┇ 💡 رد برقم أو "رجوع"\n●─────── ⌬ ───────●`;
        return api.sendMessage(message, threadID, (err, info) => {
          if (!err) {
            global.client.handleReply.push({ name: module.exports.config.name, messageID: info.messageID, type: "directory_list", currentPath: parentPath, listing });
          }
        }, messageID);
      }

      if (userInput.toLowerCase().startsWith("انشاء ") || userInput.toLowerCase().startsWith("create ")) {
        const fileName = userInput.split(" ")[1];
        if (!fileName) return api.sendMessage("⚠️ الاستخدام: انشاء اسم_الملف.js", threadID, messageID);
        const newPath = path.join(handleReply.currentPath, fileName);
        fs.writeFileSync(newPath, `module.exports.config = { name: "${fileName.replace('.js','')}", version: "1.0.0", hasPermssion: 0, credits: "عبدو", description: "جديد", commandCategory: "تعديل", cooldowns: 1 };\nmodule.exports.run = async function({ api, event }) { api.sendMessage("Hello World!", event.threadID); };`, "utf8");
        return api.sendMessage(`●─────── ⌬ ───────●\n ✅ تم إنشاء وتجهيز الملف: ${fileName}\n●─────── ⌬ ───────●`, threadID, messageID);
      }

      const itemNumber = parseInt(userInput);
      if (!isNaN(itemNumber)) {
        const allItems = [...handleReply.listing.directories, ...handleReply.listing.files];
        const selectedItem = allItems[itemNumber - 1];
        if (!selectedItem) return api.sendMessage("❌ رقم غير صحيح", threadID, messageID);
        const itemStat = fs.statSync(selectedItem.path);

        if (itemStat.isDirectory()) {
          const listing = listDirectory(selectedItem.path);
          let message = `●─────── ⌬ ───────●\n ⦿ ⟬ 📂 ${selectedItem.name} ⟭ ⦿\n┝━━━━━━━━━━━━━━━\n┇ 📍 ${path.relative(rootDir, selectedItem.path)}\n`;
          let counter = 1;
          listing.directories.forEach((dir) => { message += `┝━━━━━━━━━━━━━━━\n┇ [${counter}] ${dir.icon} ${dir.name}/\n`; counter++; });
          listing.files.forEach((file) => { message += `┝━━━━━━━━━━━━━━━\n┇ [${counter}] ${file.icon} ${file.name}\n`; counter++; });
          return api.sendMessage(message, threadID, (err, info) => {
            if (!err) {
              global.client.handleReply.push({ name: module.exports.config.name, messageID: info.messageID, type: "directory_list", currentPath: selectedItem.path, listing });
            }
          }, messageID);
        }

        let message = `●─────── ⌬ ───────●\n ⦿ ⟬ ${selectedItem.icon} ${selectedItem.name} ⟭ ⦿\n┝━━━━━━━━━━━━━━━\n┇ 📏 ${(selectedItem.size / 1024).toFixed(2)} KB\n┝━━━━━━━━━━━━━━━\n┇ 💬 الأوامر المتاحة:\n┇ رابط | كود | تغيير | ريلود\n●─────── ⌬ ───────●`;
        return api.sendMessage(message, threadID, (err, info) => {
          if (!err) {
            global.client.handleReply.push({ name: module.exports.config.name, messageID: info.messageID, type: "file_actions", selectedFile: selectedItem.path, protected: selectedItem.protected });
          }
        }, messageID);
      }
    }

    if (handleReply.type === "file_actions") {
      const command = body.trim().toLowerCase();
      const filePath = handleReply.selectedFile;

      if (command === "رابط") {
        const content = fs.readFileSync(filePath, 'utf8');
        const rawLink = await uploadPastefy(content, path.basename(filePath));
        return api.sendMessage(`●─────── ⌬ ───────●\n 🌐 رابط الكود الخام:\n ${rawLink}\n●─────── ⌬ ───────●`, threadID, messageID);
      }
      if (command === "كود" || command === "عرض") {
        const code = fs.readFileSync(filePath, "utf8");
        return api.sendMessage(`●─────── ⌬ ───────●\n📄 عرض: ${path.basename(filePath)}\n┝━━━━━━━━━━━━━━━\n${code.slice(0, 1500)}\n●─────── ⌬ ───────●`, threadID, messageID);
      }
      if (command === "ريلود") {
        const result = await reloadCommand(filePath);
        return api.sendMessage(`●─────── ⌬ ───────●\n ${result.success ? "♻️ تم عمل لود بنجاح للأمر: " + result.name : "❌ فشل: " + result.error}\n●─────── ⌬ ───────●`, threadID, messageID);
      }
      if (command === "تغيير") {
        return api.sendMessage(`●─────── ⌬ ───────●\n✏️ قم بالرد على هذه الرسالة بالكود الجديد كلياً لحفظه وتحديثه.\n●─────── ⌬ ───────●`, threadID, (err, info) => {
          if (!err) {
            global.client.handleReply.push({ name: module.exports.config.name, messageID: info.messageID, type: "awaiting_code", selectedFile: filePath });
          }
        }, messageID);
      }
    }

    if (handleReply.type === "awaiting_code") {
      let newCode = body;
      if (newCode.startsWith("http")) {
        const res = await axios.get(newCode);
        newCode = typeof res.data === 'object' ? JSON.stringify(res.data, null, 2) : String(res.data);
      }
      fs.writeFileSync(handleReply.selectedFile, newCode, "utf8");
      const result = await reloadCommand(handleReply.selectedFile);
      return api.sendMessage(`●─────── ⌬ ───────●\n ✅ تم حفظ الملف وتحديثه بنجاح!\n الحالة: ${result.success ? "نشط ومفعل" : "تم الحفظ مع وجود خطأ كود"}\n●─────── ⌬ ───────●`, threadID, messageID);
    }
  } catch (error) {
    api.sendMessage(`🛑 خطأ: ${error.message}`, threadID, messageID);
  }
};

// ══════════════════════════════════════════
// EXECUTE (تنفيذ الأوامر الرئيسية للكونسول)
// ══════════════════════════════════════════
module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID, messageReply } = event;
  if (String(senderID) !== OWNER_ID && String(senderID) !== "100090081489341") return; // حماية مطلقة للأمر

  const action = args[0]?.toLowerCase();
  const target = args[1];
  const extra = args[2];

  if (!action) {
    const menu = `●─────── ⌬ ───────●\n ⦿ ⟬ ま 𝑹𝑬𝒁𝑬-𝑩𝑶𝑻 ま ⟭ \n┝━━━━━━━━━━━━━━━\n┇ 🐚 شيل\n┇ 🧭 انشاء\n┇ ✏️ تغيير\n┇ 🗑️ حذف\n┇ 👁️ عرض\n┇ 🔗 رابط\n┇ 💻 كودي\n┇ 🔄 تحميل\n┇ 📂 قائمة\n┇ 📦 مكتبة\n┇ 🏷️ تسمية\n┇ 🔍 بحث\n📋 اختصارات الأوامر الفرعية:\n┇ ➕ اوامر اضافة\n┇ ✏️ اوامر تعديل\n┝━━━━━━━━━━━━━━━\n┇ 🐙 𝑨𝒅𝒎𝒊𝒏 𝑨𝒄𝒄𝒆𝒔𝒔 𝑶𝒏𝒍𝒚\n●─────── ⌬ ───────●`;
    return api.sendMessage(menu, threadID, messageID);
  }

  try {
    // ➕ اختصار: اوامر اضافة
    if (action === "اوامر" && target === "اضافة") {
      const commandName = extra;
      if (!commandName) return api.sendMessage("⚠️ الرجاء كتابة اسم الأمر المراد إضافته.\nمثال: ملفات اوامر اضافة test", threadID, messageID);

      const fileName = commandName.endsWith(".js") ? commandName : commandName + ".js";
      const newPath = path.join(baseDir, fileName);
      if (fs.existsSync(newPath)) return api.sendMessage("⚠️ هذا الأمر موجود بالفعل في مجلد الأوامر!", threadID, messageID);

      const content = messageReply ? messageReply.body : `module.exports.config = { name: "${commandName.replace('.js','')}", version: "1.0.0", hasPermssion: 0, credits: "عبدو", description: "تم إنشاؤه عبر اختصار ملفات", commandCategory: "ألعاب", cooldowns: 1 };\nmodule.exports.run = async function({ api, event }) { api.sendMessage("تم تشغيل الأمر الجديد بنجاح!", event.threadID); };`;

      fs.writeFileSync(newPath, content, "utf8");
      const result = await reloadCommand(newPath);
      return api.sendMessage(`●─────── ⌬ ───────●\n✅ تم إضافة وتفعيل الأمر [ ${commandName} ] بنجاح!\nالحالة: ${result.success ? "نشط ومفعل في النواة" : "فشل التحميل التلقائي بسبب خطأ بنيوي"}\n●─────── ⌬ ───────●`, threadID, messageID);
    }

    // ✏️ اختصار: اوامر تعديل
    if (action === "اوامر" && target === "تعديل") {
      const commandName = extra;
      if (!commandName) return api.sendMessage("⚠️ الرجاء تحديد اسم الأمر المراد تعديله.\nمثال: ملفات اوامر تعديل test [الكود المحدث أو بالرد]", threadID, messageID);

      const fPath = findPath(commandName);
      if (!fPath) return api.sendMessage("❌ لم يتم العثور على هذا الأمر في السيرفر.", threadID, messageID);
      if (isProtected(fPath)) return api.sendMessage("🔒 هذا ملف نظام محمي ولا يمكن التعديل عليه.", threadID, messageID);

      // جلب الكود سواء تم تمريره كنص تالي أو عبر خاصية الرد على رسالة
      let newCode = args.slice(3).join(" ");
      if (messageReply) newCode = messageReply.body;

      if (!newCode) return api.sendMessage("⚠️ الرجاء كتابة الكود الجديد بعد اسم الأمر أو قم بالرد على الكود مباشرة.", threadID, messageID);

      if (newCode.startsWith("http")) {
        const res = await axios.get(newCode);
        newCode = typeof res.data === 'object' ? JSON.stringify(res.data, null, 2) : String(res.data);
      }

      fs.writeFileSync(fPath, newCode, "utf8");
      const result = await reloadCommand(fPath);
      return api.sendMessage(`●─────── ⌬ ───────●\n📝 تم تعديل وتحديث كود الأمر [ ${path.basename(fPath)} ]\nالحالة: ${result.success ? "تحديث ناجح ومفعل الآن" : "تم الحفظ ولكن النواة رفضت التشغيل بسبب خطأ كود"}\n●─────── ⌬ ───────●`, threadID, messageID);
    }

    if (["بحث", "search", "find"].includes(action)) {
      if (!target) return api.sendMessage("🔍 أكتب كلمة للبحث عنها داخل ملفات الـ commands.", threadID, messageID);
      const searchResult = await smartSearch(target, 0);
      if (searchResult.total === 0) return api.sendMessage("❌ لم يتم العثور على أي نتائج مطابقة.", threadID, messageID);

      let message = `●─────── ⌬ ───────●\n ⦿ ⟬ 🔍 نتائج البحث ⟭ ⦿\n┝━━━━━━━━━━━━━━━\n┇ 🔎 الكلمة: "${target}"\n┇ 📊 النتائج: ${searchResult.total} ملف\n`;
      searchResult.results.forEach((result, index) => {
        message += `┝━━━━━━━━━━━━━━━\n┇ [${index+1}] 📄 ${result.fileName}\n┇ 📂 ${result.relativePath}\n`;
      });
      if (searchResult.hasMore) message += `┝━━━━━━━━━━━━━━━\n┇ 📌 رد بـ "التالي" لرؤية المزيد\n`;
      message += `●─────── ⌬ ───────●`;

      return api.sendMessage(message, threadID, (err, info) => {
        if (!err) {
          global.client.handleReply.push({ name: module.exports.config.name, messageID: info.messageID, type: "search_results", keyword: target, page: 0 });
        }
      }, messageID);
    }

    if (["shell", "term", "exec", "شيل", "تيرمنال"].includes(action)) {
      const cmd = args.slice(1).join(" ");
      if (!cmd) return api.sendMessage("🐚 أكتب الأمر لتنفيذه في الشيل.", threadID, messageID);
      exec(cmd, (error, stdout, stderr) => {
        const output = stdout || stderr || "✅ تم تنفيذ أمر النظام بنجاح دون مخرجات نصية.";
        return api.sendMessage(`●─────── ⌬ ───────●\n 🐚 Terminal Out:\n\n${output.slice(0, 3500)}\n●─────── ⌬ ───────●`, threadID, messageID);
      });
      return;
    }

    if (["انشاء", "create", "new"].includes(action)) {
      if (!target) return api.sendMessage("📄 حدد اسم الملف بداخل المجلد.\nمثال: ملفات انشاء test.js", threadID, messageID);
      const newPath = path.join(baseDir, target.endsWith(".js") ? target : target + ".js");
      if (fs.existsSync(newPath)) return api.sendMessage("⚠️ الملف موجود بالفعل!", threadID, messageID);
      const content = messageReply ? messageReply.body : `module.exports.config = { name: "${target}", version: "1.0.0", hasPermssion: 0, credits: "عبدو", description: "تم إنشاؤه", commandCategory: "تخصيص", cooldowns: 1 };\nmodule.exports.run = async function({ api, event }) {};`;
      fs.writeFileSync(newPath, content, "utf8");
      await reloadCommand(newPath);
      return api.sendMessage(`✅ تم إنشاء وتفعيل الملف الجديد بنجاح في: modules/commands/${target}`, threadID, messageID);
    }

    if (["رابط", "link"].includes(action)) {
      let content = "";
      if (target) {
        const fPath = findPath(target);
        if (!fPath) return api.sendMessage("❌ الملف غير موجود.", threadID, messageID);
        content = fs.readFileSync(fPath, 'utf8');
      } else if (messageReply) {
        content = messageReply.body;
      } else return api.sendMessage("⚠️ حدد ملف أو رد على نص.", threadID, messageID);

      const link = await uploadPastefy(content);
      return api.sendMessage(`🔗 الرابط المباشر للكود:\n${link}`, threadID, messageID);
    }

    if (["مكتبة", "npm", "lib"].includes(action)) {
      if (!target) return api.sendMessage("📦 أكتب اسم حزمة npm المراد تثبيتها.", threadID, messageID);
      api.sendMessage(`⏳ جارِ تثبيت المكتبة [${target}] تلقائياً من سيرفرات npm...`, threadID);
      exec(`npm install ${target}`, (err) => {
        if (err) return api.sendMessage(`❌ فشل تثبيت المكتبة: ${err.message}`, threadID, messageID);
        return api.sendMessage(`✅ تم تثبيت المكتبة [${target}] بنجاح، يمكنك استدعاؤها الآن!`, threadID, messageID);
      });
      return;
    }

    if (["تحميل", "لود", "ريلود"].includes(action)) {
      if (target) {
        const fPath = findPath(target);
        if (!fPath) return api.sendMessage("❌ الملف غير موجود.", threadID, messageID);
        const res = await reloadCommand(fPath);
        return api.sendMessage(`${res.success ? "♻️ تم عمل ريلود للأمر: " + res.name : "❌ فشل: " + res.error}`, threadID, messageID);
      }
      return api.sendMessage("💡 أكتب اسم الملف لعمل لود له بشكل منفرد، أو استخدم الأمر الشامل لتحديث السورس.", threadID, messageID);
    }

    if (["حذف", "delete", "rm"].includes(action)) {
      const fPath = findPath(target);
      if (!fPath) return api.sendMessage("❌ الملف غير موجود.", threadID, messageID);
      if (isProtected(fPath)) return api.sendMessage("🔒 هذا ملف نظام محمي ولا يمكن حذفه.", threadID, messageID);
      const name = path.basename(fPath, ".js");
      unloadCommand(name);
      fs.unlinkSync(fPath);
      return api.sendMessage(`🗑️ تم حذف الملف [${name}.js] بالكامل وتنظيف ذاكرة النواة.`, threadID, messageID);
    }

    if (["قائمة", "list"].includes(action)) {
      const listing = listDirectory(rootDir);
      let message = `●─────── ⌬ ───────●\n ⦿ ⟬ 📂 مدير ملفات السيرفر ⟭ ⦿\n┝━━━━━━━━━━━━━━━\n┇ 📍 مسار الجذر الحالي\n`;
      let counter = 1;
      listing.directories.forEach((dir) => { message += `┝━━━━━━━━━━━━━━━\n┇ [${counter}] ${dir.icon} ${dir.name}/\n`; counter++; });
      listing.files.forEach((file) => { message += `┝━━━━━━━━━━━━━━━\n┇ [${counter}] ${file.icon} ${file.name}\n`; counter++; });
      message += `┝━━━━━━━━━━━━━━━\n┇ 💡 قم بالرد برقم المجلد لفتحه وتصفحه\n●─────── ⌬ ───────●`;

      return api.sendMessage(message, threadID, (err, info) => {
        if (!err) {
          global.client.handleReply.push({ name: module.exports.config.name, messageID: info.messageID, type: "directory_list", currentPath: rootDir, listing });
        }
      }, messageID);
    }

    return api.sendMessage("⚠️ الاختصار أو الأمر الفرعي غير مدعوم، اكتب [.ملفات] لفتح الواجهة الرئيسية.", threadID, messageID);
  } catch (err) {
    api.sendMessage(`🛑 خطأ غير متوقع: ${err.message}`, threadID, messageID);
  }
};
