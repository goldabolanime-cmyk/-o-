module.exports.config = {
  name: "نكتة",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "REM BOT",
  description: "جرعة ضحك مع صورة عشوائية 🤣",
  usePrefix: true,
  commandCategory: "ترفيه",
  cooldowns: 5
};

module.exports.run = async function ({ api, event }) {
  const axios = require("axios");
  const fs = require("fs-extra");

  const reactions = ["🤣", "😂", "😆", "😜", "💀", "😭"];
  api.setMessageReaction(reactions[Math.floor(Math.random() * reactions.length)], event.messageID, () => {}, true);

  const links = [
    "https://i.imgur.com/SmrAxPV.jpg",
    "https://i.imgur.com/WNXgwgX.jpg",
    "https://i.imgur.com/ILucq55.jpg",
    "https://i.imgur.com/CF8qAAo.jpg",
    "https://i.imgur.com/gqukE0K.jpg"
  ];

  const jokes = [
    "واحد وزوجته متخانقين ترك لها ورقة: صحيني الساعة 6 ونصف. صحي الساعة 10 لقى ورقة: الساعة 6 ونص يلا إصحى 😂",
    "مرة واحد شاف أخوه التوأم قال له: انت فين من الصبح؟ أمي جعلتني أتحمم مرتين يا أخي.",
    "حرامي دخل يسرق البيت وجد العجوز بردانة شغّل عليها المكيف وهرب 😂",
    "واحد غبي اشتغل في الصين سواق تكسي وكل ما حد يوقفه يقله: أنا لسه منزلك قبل كدة، أنت نسيت؟",
    "محشش ومرتو قاعدين، قالت: نفسي أعرف ليش الناس بتحكي عنا نكت؟ قال: لأن رأسنا مثل هذه الطاولة، ودق دقتين، قالت زوجته: مين؟",
    "واحد سأل رفيقه: عارف أوفى حيوان؟ قال: الكلب. قال: لا، النملة! مرات الفيل يلي مات وفضلت تدفن فيه طول حياتها.",
    "زوجة قالت لزوجها: عليك أن تطرد السائق الذي حاول قتلي مرتين! قال: لا تحزني، امنحيه الفرصة الثالثة 😂",
    "سائح يسأل مرشداً: هل ولد أحد العظماء في هذه المدينة؟ قال: لا، هنا الجميع يولدون صغاراً.",
    "صديق سأل صديقه: أين يذهب القمر آخر الشهر؟ قال: يذهب يستلم راتبه.",
    "خروف يسأل خروفاً: مرّ عيدين وما ذبحوك؟ قال: مسجّل بشهادة ميلادي حمار 😂",
    "واحد بخيل راح عند أمه يزورها، لقى كلمة 'ادفع' مكتوبة على الباب، راح لافف وقال: أبقى أزورها في البيت.",
    "أب: تحبوني ولا تحبون أمكم أكثر؟ الأولاد: نحبكم كلكم. الأب: لو أنا رحت مكة وأمكم للمدينة؟ الأولاد: نروح مكة. الأب: يعني تحبون أمكم؟ الأولاد: لا، بس نحب مكة 😂",
    "مدرس يضرب طالباً: أنا بضربك لأني بحبك! الطالب: للأسف، كان نفسي أنا كمان بحبك 😂",
    "فتاة لحبيبها: عندما نتزوج أريد أن تشركني في مشاكلك. قال: ليس عندي مشاكل. قالت: أعرف، لأننا لم نتزوج بعد 😂"
  ];

  const joke = jokes[Math.floor(Math.random() * jokes.length)];
  const imgUrl = links[Math.floor(Math.random() * links.length)];

  if (!fs.existsSync(__dirname + "/cache")) fs.mkdirSync(__dirname + "/cache", { recursive: true });
  const imgPath = __dirname + `/cache/joke_${event.senderID}.jpg`;

  try {
    const res = await axios.get(imgUrl, { responseType: "arraybuffer" });
    fs.writeFileSync(imgPath, Buffer.from(res.data, "binary"));

    return api.sendMessage({
      body: `✦〘•ما 𝑹𝑬𝑴-𝑩𝑶𝑻 ما•〙✦\n───── · · · ✦ · · · ─────\n🤣 جـرعـة ضـحـك\n───── · · · ✦ · · · ─────\n\n${joke}\n\n───── · · · ✦ · · · ─────`,
      attachment: fs.createReadStream(imgPath)
    }, event.threadID, () => {
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }, event.messageID);
  } catch (e) {
    return api.sendMessage(
      `✦〘•ما 𝑹𝑬𝑴-𝑩𝑶𝑻 ما•〙✦\n───── · · · ✦ · · · ─────\n🤣 جرعة ضحك\n───── · · · ✦ · · · ─────\n\n${joke}\n\n───── · · · ✦ · · · ─────`,
      event.threadID, event.messageID
    );
  }
};
