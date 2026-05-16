module.exports.config = {
  name: "فحص",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Abdou",
  description: "كشف المعرفات الممررة للأوامر في ريم بوت V20",
  commandCategory: "نظام",
  cooldowns: 1
};

module.exports.run = async function(params) {
  const { api, event } = params;

  // طباعة المفاتيح الممررة مباشرة داخل دالة الـ run للأوامر
  const paramKeys = Object.keys(params);

  // طباعة المفاتيح الموجودة في كائن الـ global الأساسي للبوت
  const globalKeys = Object.keys(global || {});
  const clientKeys = Object.keys(global.client || {});

  let msg = "🔍 ┋ نـتـائـج فـحـص الـنـواة:\n";
  msg += "───── · · · ✦ · · · ─────\n\n";
  msg += `📥 ┋ المتغيرات الممررة للأمر:\n[ ${paramKeys.join(", ")} ]\n\n`;
  msg += `🌐 ┋ مفاتيح الـ Global الأساسية:\n[ ${globalKeys.filter(k => !k.startsWith("_")).slice(0, 15).join(", ")}... ]\n\n`;
  msg += `⚙️ ┋ مفاتيح الـ Client المتوفرة:\n[ ${clientKeys.join(", ")} ]\n\n`;
  msg += "───── · · · ✦ · · · ─────\n";
  msg += "📝 افتح كونسول ريبلت الأسود لتفقد التفاصيل كاملة إذا كانت الرسالة طويلة.";

  // طباعة دقيقة في الكونسول لتقرأها بوضوح
  console.log("===== [ ريم بوت V20 - فحص المعرفات الممررة ] =====");
  console.log("Params:", paramKeys);
  console.log("===============================================");

  return api.sendMessage(msg, event.threadID, event.messageID);
};
