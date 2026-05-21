// ╔══════════════════════════════════════════╗
// ║             💍 MARRIAGE SYSTEM 💍        ║
// ╚══════════════════════════════════════════╝

const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "زوجني",
  version: "1.2.0",
  hasPermssion: 0,
  credits: "Abdou",
  description: "يزوجك شخص عشوائي من المجموعة مع إرسال صور البروفايلات منفصلة",
  commandCategory: "ترفيه",
  usages: " ",
  cooldowns: 30
};

module.exports.run = async function ({ api, event, args, Users, Economy }) {
  const { threadID, messageID, senderID } = event;
  const cost = 100;

  try {
    // 1. التحقق من الرصيد باستخدام نظام الاقتصاد الخاص ببوتك
    const cashR = await Economy.getBalance(senderID, "money");
    const userMoney = (typeof cashR === "number" ? cashR : cashR?.data || 0);

    if (userMoney < cost) {
      return api.sendMessage("رصيدك لا يكفي لتكاليف المراسيم ؛-؛", threadID, messageID);
    }

    // 2. جلب معلومات المجموعة وجلب الأعضاء (بنية Baileys/Rio)
    const threadInfo = await api.getThreadInfo(threadID);
    // تصفية الأعضاء (استثناء صاحب الأمر والبوت نفسه)
    const participants = threadInfo.participantIDs.filter(
      id => id !== senderID && id !== api.getCurrentUserID()
    );

    if (participants.length === 0) {
      return api.sendMessage("أنت وحيد هنا، لا يوجد من يتزوجك ؛-؛", threadID, messageID);
    }

    // 3. اختيار الشريك العشوائي
    const partnerID = participants[Math.floor(Math.random() * participants.length)];

    // 4. خصم المبلغ من المحفظة
    await Economy.decreaseMoney(senderID, cost);

    // 5. جلب الأسماء من قاعدة بيانات البوت
    const name1 = await Users.getNameUser(senderID);
    const name2 = await Users.getNameUser(partnerID);

    // 6. تجهيز مسارات بروفايل الواتساب (باستخدام دالة جلب الأفاتار الخاصة بـ api البوت)
    let imgUrl1, imgUrl2;
    try {
      imgUrl1 = await api.getProfilePicture(senderID);
    } catch {
      imgUrl1 = "https://i.ibb.co/GvrMLCBc/image-0.jpg"; // خلفية بديلة في حال عدم وجود صورة
    }

    try {
      imgUrl2 = await api.getProfilePicture(partnerID);
    } catch {
      imgUrl2 = "https://i.ibb.co/GvrMLCBc/image-0.jpg";
    }

    const path1 = path.join(process.cwd(), "cache", `p1_${senderID}.png`);
    const path2 = path.join(process.cwd(), "cache", `p2_${partnerID}.png`);

    fs.ensureDirSync(path.dirname(path1));

    // تحميل الصور وحفظها في الكاش
    const getImg1 = (await axios.get(imgUrl1, { responseType: "arraybuffer" })).data;
    fs.writeFileSync(path1, Buffer.from(getImg1));

    const getImg2 = (await axios.get(imgUrl2, { responseType: "arraybuffer" })).data;
    fs.writeFileSync(path2, Buffer.from(getImg2));

    // 7. صياغة رسالة الزواج بالزخرفة الاحترافية
    const msg = {
      body: `●─────── ✾ ───────●\n ⦿ ⟬ 💍 𝐌𝐀𝐑𝐑𝐈𝐀𝐆𝐄 💍 ⟭ ⦿\n⊱ ────────────── ⊰\n ⟣ 👤 الزوج: @${senderID.split("@")[0]}\n ⟣ 👤 الزوجة: @${partnerID.split("@")[0]}\n⊱ ────────────── ⊰\n 📜 تَمَّت المَرَاسِيم بِنَجَاح\n 💰 التكلفة: ${cost}$\n●─────── ✾ ───────●\nستختفي هذه الذكرى بعد 30 ثانية ؛-؛`,
      mentions: [
        { tag: `@${senderID.split("@")[0]}`, id: senderID },
        { tag: `@${partnerID.split("@")[0]}`, id: partnerID }
      ],
      attachment: [fs.createReadStream(path1), fs.createReadStream(path2)]
    };

    // 8. إرسال الرسالة مع ميزة الحذف التلقائي بعد 30 ثانية
    return api.sendMessage(msg, threadID, (err, info) => {
      setTimeout(async () => {
        try {
          if (info?.messageID) await api.unsendMessage(info.messageID);
        } catch {}
        if (fs.existsSync(path1)) fs.unlinkSync(path1);
        if (fs.existsSync(path2)) fs.unlinkSync(path2);
      }, 30000);
    }, messageID);

  } catch (e) {
    console.error(e);
    return api.sendMessage("تعذر إتمام المراسيم في الوقت الحالي ؛-؛", threadID, messageID);
  }
};
