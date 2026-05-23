module.exports.config = {
  name: "عاصمة",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "REM BOT",
  description: "لعبة تخمين عواصم الدول 🌍",
  usePrefix: true,
  commandCategory: "ألعاب",
  cooldowns: 5
};

const questions = [
  { q: "ما هي عاصمة الجزائر؟", a: "الجزائر" },
  { q: "ما هي عاصمة المغرب؟", a: "الرباط" },
  { q: "ما هي عاصمة تونس؟", a: "تونس" },
  { q: "ما هي عاصمة مصر؟", a: "القاهرة" },
  { q: "ما هي عاصمة السعودية؟", a: "الرياض" },
  { q: "ما هي عاصمة فلسطين؟", a: "القدس" },
  { q: "ما هي عاصمة العراق؟", a: "بغداد" },
  { q: "ما هي عاصمة سوريا؟", a: "دمشق" },
  { q: "ما هي عاصمة الأردن؟", a: "عمان" },
  { q: "ما هي عاصمة لبنان؟", a: "بيروت" },
  { q: "ما هي عاصمة الإمارات؟", a: "أبو ظبي" },
  { q: "ما هي عاصمة قطر؟", a: "الدوحة" },
  { q: "ما هي عاصمة الكويت؟", a: "الكويت" },
  { q: "ما هي عاصمة البحرين؟", a: "المنامة" },
  { q: "ما هي عاصمة عُمان؟", a: "مسقط" },
  { q: "ما هي عاصمة اليمن؟", a: "صنعاء" },
  { q: "ما هي عاصمة ليبيا؟", a: "طرابلس" },
  { q: "ما هي عاصمة السودان؟", a: "الخرطوم" },
  { q: "ما هي عاصمة فرنسا؟", a: "باريس" },
  { q: "ما هي عاصمة إسبانيا؟", a: "مدريد" },
  { q: "ما هي عاصمة إيطاليا؟", a: "روما" },
  { q: "ما هي عاصمة ألمانيا؟", a: "برلين" },
  { q: "ما هي عاصمة بريطانيا؟", a: "لندن" },
  { q: "ما هي عاصمة روسيا؟", a: "موسكو" },
  { q: "ما هي عاصمة تركيا؟", a: "أنقرة" },
  { q: "ما هي عاصمة اليابان؟", a: "طوكيو" },
  { q: "ما هي عاصمة الصين؟", a: "بكين" },
  { q: "ما هي عاصمة كوريا الجنوبية؟", a: "سيول" },
  { q: "ما هي عاصمة أمريكا؟", a: "واشنطن" },
  { q: "ما هي عاصمة البرازيل؟", a: "برازيليا" },
  { q: "ما هي عاصمة الأرجنتين؟", a: "بوينس آيرس" },
  { q: "ما هي عاصمة كندا؟", a: "أوتاوا" },
  { q: "ما هي عاصمة أستراليا؟", a: "كانبرا" },
  { q: "ما هي عاصمة الهند؟", a: "نيودلهي" },
  { q: "ما هي عاصمة إيران؟", a: "طهران" }
];

module.exports.handleReply = async function ({ api, event, handleReply, Currencies }) {
  const { body, senderID, threadID, messageID } = event;
  const answer = body.trim().toLowerCase();
  const correct = handleReply.correctAnswer.toLowerCase();

  if (answer === correct) {
    await Currencies.increaseMoney(senderID, 50);
    api.unsendMessage(handleReply.messageID);
    return api.sendMessage(
      `✦〘•ما 𝑹𝑬𝑴-𝑩𝑶𝑻 ما•〙✦\n───── · · · ✦ · · · ─────\n✅ أحسنت! إجابة صحيحة 🎉\n💰 ربحت 50 دولار بنكية!\n───── · · · ✦ · · · ─────`,
      threadID, messageID
    );
  } else {
    return api.sendMessage(
      `✦〘•ما 𝑹𝑬𝑴-𝑩𝑶𝑻 ما•〙✦\n───── · · · ✦ · · · ─────\n❌ إجابة خاطئة! حاول مرة أخرى.\n───── · · · ✦ · · · ─────`,
      threadID, messageID
    );
  }
};

module.exports.run = async function ({ api, event }) {
  const { threadID } = event;
  const item = questions[Math.floor(Math.random() * questions.length)];

  api.sendMessage(
    `✦〘•ما 𝑹𝑬𝑴-𝑩𝑶𝑻 ما•〙✦\n───── · · · ✦ · · · ─────\n🌍 تـحـدي الـعـواصـم\n───── · · · ✦ · · · ─────\n\n❓ ${item.q}\n\n💡 ردّ على هذه الرسالة بالإجابة!\n💰 الجائزة: 50 دولار بنكية\n───── · · · ✦ · · · ─────`,
    threadID,
    (err, info) => {
      if (!err) {
        global.client.handleReply.push({
          name: "عاصمة",
          messageID: info.messageID,
          correctAnswer: item.a,
          createdAt: Date.now()
        });
      }
    }
  );
};
