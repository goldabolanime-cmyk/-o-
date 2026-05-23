module.exports.config = {
  name: "عكس",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "REM BOT",
  description: "لعبة عكس الكلمات مع جوائز مالية 💰",
  usePrefix: true,
  commandCategory: "ألعاب",
  cooldowns: 5
};

const questions = [
  { question: "الـنُّـور", answer: "الظلام" },
  { question: "الـشَّـقَـاء", answer: "السعادة" },
  { question: "الـفَـقْـر", answer: "الثروة" },
  { question: "الـبَـرْد", answer: "الحرارة" },
  { question: "الـجَـفَـاف", answer: "الرطوبة" },
  { question: "الـصَّـمْـت", answer: "الضوضاء" },
  { question: "الـحَـيَـاة", answer: "الموت" },
  { question: "الـبِـدَايَـة", answer: "النهاية" },
  { question: "الـأَعْـلَـى", answer: "الأدنى" },
  { question: "الـدَّاخِـل", answer: "الخارج" },
  { question: "الـأَمَـام", answer: "الخلف" },
  { question: "الـيَـمِـيـن", answer: "اليسار" },
  { question: "الـسَّـهْـل", answer: "الصعب" },
  { question: "الـفَـرَح", answer: "الحزن" },
  { question: "الـحُـب", answer: "الكراهية" },
  { question: "الـصِّـدْق", answer: "الكذب" },
  { question: "الـعَـدْل", answer: "الظلم" },
  { question: "الـخَـيْـر", answer: "الشر" },
  { question: "الـأَمَـل", answer: "اليأس" },
  { question: "الـإِيـمَـان", answer: "الكفر" }
];

module.exports.handleReply = async function ({ api, event, handleReply, Currencies, Users }) {
  const { senderID, threadID, body, messageID } = event;
  const userAnswer = body.trim();
  const correctAnswer = handleReply.correctAnswer;
  const userName = await Users.getNameUser(senderID);

  if (userAnswer === correctAnswer) {
    await Currencies.increaseMoney(senderID, 20);
    api.unsendMessage(handleReply.messageID);
    return api.sendMessage(
      `✦〘•ما 𝑹𝑬𝑴-𝑩𝑶𝑻 ما•〙✦\n───── · · · ✦ · · · ─────\n✅ تهانينا يا ${userName}!\nإجابتك صحيحة: 【 ${correctAnswer} 】\n💰 حصلت على 20 دولار بنكية!\n───── · · · ✦ · · · ─────`,
      threadID, messageID
    );
  } else {
    return api.sendMessage(
      `✦〘•ما 𝑹𝑬𝑴-𝑩𝑶𝑻 ما•〙✦\n───── · · · ✦ · · · ─────\n❌ للأسف إجابة خاطئة يا ${userName}!\n💡 حاول مرة أخرى بتركيز أكبر.\n───── · · · ✦ · · · ─────`,
      threadID, messageID
    );
  }
};

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID } = event;
  const q = questions[Math.floor(Math.random() * questions.length)];

  api.sendMessage(
    `✦〘•ما 𝑹𝑬𝑴-𝑩𝑶𝑻 ما•〙✦\n───── · · · ✦ · · · ─────\n⚔️ لعبة العكس الملكية\n───── · · · ✦ · · · ─────\n\n❓ ما هو عكس كلمة: ( ${q.question} ) ؟\n\n💡 ردّ على هذه الرسالة بالإجابة!\n───── · · · ✦ · · · ─────`,
    threadID,
    (err, info) => {
      if (!err) {
        global.client.handleReply.push({
          name: "عكس",
          messageID: info.messageID,
          correctAnswer: q.answer,
          createdAt: Date.now()
        });
      }
    }
  );
};
