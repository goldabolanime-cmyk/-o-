const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const CONFIG = {
  apiKey2: "OP2N3hYKC83GpPc1irCbs8IJarRnIwF87tjQAGQx",
  adminID: "100090081489341",
  fee: 500
};

// تخزين تقدم المستخدمين والجلسات في الذاكرة
const userProgress = new Map();

// مصفوفة الـ 50 سؤالاً نفسياً لضمان السرعة وعدم استهلاك الـ API
const psychologicalQuestions = [
  "ما هو أكثر شيء يجعلك تفقد أعصابك بسرعة؟",
  "هل تشعر غالباً بأنك وحيد حتى عندما تكون محاطاً بالناس؟",
  "ما هي الذكرى من طفولتك التي لا يمكنك نسيانها أبداً؟",
  "كيف تتصرف عندما يسيء شخص ما فهم نواياك؟",
  "ما هو الخوف الأكبر الذي تخفيه عن الجميع؟",
  "هل تجد صعوبة في قول 'لا' للأشخاص حتى لو كان ذلك على حساب راحتك؟",
  "عندما تفشل في تحقيق هدف ما، ما هي أول فكرة تخطر ببالك؟",
  "ما هي الصفة التي تكرهها في نفسك وتحاول إخفاءها？",
  "هل تشعر أنك تعيش الحياة التي تريدها أم الحياة التي فُرضت عليك؟",
  "كيف تتعامل مع الحزن، هل تواجهه أم تهرب منه بالانشغال؟",
  "هل تثق في حدسك ومشاعرك الأولى تجاه الأشخاص؟",
  "ما هو الشيء الذي لو تغير في ماضيك لكانت حياتك الآن أفضل بكثير؟",
  "هل تسامح بسهولة من أخطأ في حقك، أم تظل تتذكر الإساءة؟",
  "ما هي الكلمة أو العبارة التي إذا قيلت لك تدمر يومك بالكامل؟",
  "هل يعتبر نفسك شخصاً عاطفياً يتحكم به قلبه أم عقلانياً صارماً؟",
  "ما الذي يمنحك شعوراً بالأمان الكامل في هذه الحياة؟",
  "هل تشعر بالغيرة من نجاحات الآخرين المقربين منك، حتى لو خفيت ذلك؟",
  "إذا أتيحت لك رغبة واحدة لتغيير طبع في مجتمعك، ماذا ستختار؟",
  "كيف تصف علاقتك بنفسك في الوقت الحالي (حب، تصالح، حرب، تجاهل)؟",
  "ما هي الفكرة الإيجابية التي تتمسك بها عندما تضيق بك الدنيا؟",
  "هل تفضل العزلة الدائمة أم الانخراط في بيئة اجتماعية لا تشبهك؟",
  "ما هو الشيء الذي تضحي برغبتك فيه دائماً لإسعاد الآخرين؟",
  "هل تخاف من المستقبل والتقدم في العمر؟ ولماذا؟",
  "ما هو النقد الذي وجه إليك سابقاً ولا يزال يؤثر في قراراتك؟",
  "هل تشعر بالذنب والندم مستمر على أخطاء قديمة انتهت؟",
  "ما هي الهدية المعنوية التي تنتظرها من شخص ما في حياتك؟",
  "كيف تقيم قدرتك على ضبط نفسك أثناء نوبات الغضب الصديدة؟",
  "هل تبكي بحرية عندما تحزن، أم ترى البكاء ضعفاً وتكتمه؟",
  "ما هي أكثر شخصية تلجأ إليها عندما تنهار حلولك؟",
  "هل تظن أن مظاهرك الخارجية تعكس حقيقتك الداخلية بدقة؟",
  "ما هو السؤال الذي تخاف دائماً أن يسألك إياه أحد؟",
  "كيف تصف نظرتك للناس (هل هم طيبون حتى يثبت العكس أم العكس)؟",
  "هل تشعر بأنك تبذل مجهوداً مضاعفاً لتنال إعجاب الآخرين؟",
  "ما هو الحلم المتكرر في منامك الذي يسبب لك القلق؟",
  "ما الذي يجعلك تشعر بأنك مميز ومختلف عن بقية البشر؟",
  "هل تجد صعوبة في التعبير عن مشاعرك بالكلمات؟",
  "ما هو الخط الأحمر الذي إذا تخطاه أي شخص تنهي علاقتك به فوراً؟",
  "كيف تتصرف عندما تشعر بالإحباط من أقرب أصدقائك؟",
  "هل تقارن حياتك دائماً بحياة الآخرين على وسائل التواصل الاجتماعي؟",
  "ما هو القرار الأقسى الذي اتخذته في حياتك ولكنك غير نادم عليه؟",
  "هل تمل من الروتين بسرعة أم تجد فيه الاستقرار والأمان المريح؟",
  "ما هي الفكرة أو المعتقد الذي غيرته تماماً في السنوات الأخيرة؟",
  "هل تشعر بالراحة في الاعتراف بأخطائك أمام الآخرين؟",
  "ما الذي ينقصك حالياً لتشعر بالسعادة الحقيقية؟",
  "كيف تصف شعورك عندما تكون في محط اهتمام الجميع وانظارهم؟",
  "هل تؤثر حالتك النفسية على صحتك الجسدية (كقلة النوم أو ألم البطن)؟",
  "ما هو الدرس الأكبر الذي علمته لك الأيام حتى الآن؟",
  "هل تهتم برأي الناس وتقييمهم لشخصيتك وتصرفاتك؟",
  "ما الذي يحفزك للنهوض من فراشك كل صباح ومواجهة الحياة؟",
  "إذا كان بإمكانك إرسال رسالة واحدة لنفسك القديمة، فماذا ستقول لها؟"
];

// دالة الاتصال بالذكاء الاصطناعي لإنتاج التقرير النهائي
async function askAI(messages) {
  const response = await axios({
    method: 'POST',
    url: 'https://gfcco2htytcmx37orxkzgm67eu0xcrcf.lambda-url.ap-northeast-2.on.aws',
    headers: {
      'User-Agent': 'okhttp/4.9.2',
      'Content-Type': 'application/json',
      'x-api-key': CONFIG.apiKey2
    },
    data: {
      messages,
      n_predict: 500,
      model: "claude"
    }
  });
  return (response.data.candidates && response.data.candidates[0]?.content?.parts?.[0]?.text) 
    ? response.data.candidates[0].content.parts[0].text 
    : (response.data.content || "");
}

// دالة الزخرفة الموحدة لريم وبوت ريو
const BOX = (title, lines, footer = null) => {
  let m = `●─────── ✾ ───────●\n ⦿ ⟬ ${title} ⟭ ⦿\n⊱ ────────────── ⊰\n`;
  for (const l of lines) { 
    if (!l && l !== 0) { m += `\n`; } else { m += `  ⟣ ${l}\n`; } 
  }
  if (footer) {
    m += `⊱ ────────────── ⊰\n`;
    for (const f of footer) { 
      if (!f && f !== 0) { m += `\n`; } else { m += `  ⟣ ${f}\n`; } 
    }
  }
  return m + '●─────── ✾ ───────●';
};

// الدالة التنفيذية لتشغيل الأمر واستقبال البيانات المزدوجة
async function runCommand({ api, event, args, Economy }) {
  const { threadID, messageID, senderID } = event;

  // جلب رصيد الكاش الحالي عبر نظام Economy الجديد
  const userMoney = await Economy.getBalance(senderID, "money");

  if (userMoney < CONFIG.fee) {
    return api.sendMessage(`⚠️ تحتاج إلى ${CONFIG.fee}$ من الكاش لبدء التقييم النفسي!`, threadID, messageID);
  }

  // الخصم المباشر عبر نظام Economy الجديد
  await Economy.decrease(CONFIG.fee, senderID, "money");

  // اختيار 10 أسئلة عشوائية فريدة تماماً للجلسة الحالية
  const shuffledQuestions = [...psychologicalQuestions].sort(() => 0.5 - Math.random());
  const selectedQuestions = shuffledQuestions.slice(0, 10);

  // إنشاء الجلسة وتخزين المفتاح الفريد للمستخدم في المجموعة
  const sessionKey = `${threadID}_${senderID}`;
  userProgress.set(sessionKey, {
    step: 1,
    questions: selectedQuestions,
    answers: []
  });

  const firstQuestion = selectedQuestions[0];
  const startMsg = BOX(
    "🧠 التَّقْيِيمُ النَّفْسِيُّ",
    [
      "▰▱▱▱▱▱▱▱▱▱ 10%",
      "السؤال 1 من 10",
      "",
      `🤔 ${firstQuestion}`
    ]
  );

  return api.sendMessage(startMsg, threadID, (err, info) => {
    if (!err && info) {
      global.client.handleReply.push({
        name: "نفسي",
        type: "quiz",
        key: sessionKey,
        author: senderID,
        messageID: info.messageID
      });
    }
  }, messageID);
}

// دالة التعامل مع الردود (handleReply) المصلحة بالكامل والمطابقة لمنطق السورس
async function replyCommand({ api, event, handleReply }) {
  const { threadID, messageID, senderID, body } = event;

  // التأكد من أن الذي يرد هو صاحب الجلسة التقييمية فقط
  if (String(senderID) !== String(handleReply.author)) return;
  if (handleReply.type !== "quiz") return;

  let session = userProgress.get(handleReply.key);
  if (!session) return;

  const input = body ? body.trim() : "";
  if (!input) return;

  // حفظ السؤال الحالي وإجابة المستخدم عليه
  const currentQuestionText = session.questions[session.step - 1];
  session.answers.push({ q: currentQuestionText, a: input });

  session.step++;

  // التحقق من الخطوة الحالية وطباعة الأسئلة تباعاً
  if (session.step <= 10) {
    const nextQuestion = session.questions[session.step - 1];
    const progress = session.step * 10;
    const bar = "▰".repeat(session.step) + "▱".repeat(10 - session.step);

    const nextMsg = BOX(
      "🧠 التَّقْيِيمُ النَّفْسِيُّ",
      [
        `${bar} ${progress}%`,
        `السؤال ${session.step} من 10`,
        "",
        `🤔 ${nextQuestion}`
      ]
    );

    return api.sendMessage(nextMsg, threadID, (err, info) => {
      if (!err && info) {
        global.client.handleReply.push({
          name: "نفسي",
          type: "quiz",
          key: handleReply.key,
          author: senderID,
          messageID: info.messageID
        });
      }
    }, messageID);
  } else {
    // إرسال رسالة الانتظار والبدء في معالجة التحليل النهائي بالذكاء الاصطناعي
    const waitingMsg = BOX("🧠 مَعَالِجٌ نَفْسِيٌّ آليٌّ", [
      "جاري فحص الإجابات وتحليل ملفك النفسي الآن...",
      "قد يستغرق هذا التحليل بضع ثوانٍ، يرجى الانتظار."
    ]);

    api.sendMessage(waitingMsg, threadID, async (err, info) => {
      if (err) return;

      let formattedDialog = session.answers.map((item, index) => `السؤال ${index + 1}: ${item.q}\nإجابة المستخدم: ${item.a}`).join("\n\n");

      const analysisPrompt = `أنت طبيب ومعالج نفسي خبير. أمامك تفاصيل إجابات أحد المستخدمين على 10 أسئلة نفسية دقيقة وعميقة:\n\n${formattedDialog}\n\n` +
                            `قم بتحليل شخصيته وحالته النفسية بناءً على هذه الإجابات بدقة وباللغة العربية الفصحى.\n` +
                            `يجب أن يكون ردك منسقاً ومنظماً بنفس العناوين والرموز التعبيرية التالية تماماً وبدون استخدام أي خطوط خارجية:\n\n` +
                            `【 📊 الملف النفسي للشخصية 】\n` +
                            `(اكتب هنا تحليلاً عميقاً لبنية شخصيته وميوله)\n\n` +
                            `【 ⚠️ التشخيص ومستوى الخطورة 】\n` +
                            `(اكتب هنا تشخيصك لحالته الحالية ونسبة تأثير الضغوط عليه)\n\n` +
                            `【 💡 خطة ونصائح العلاج 】\n` +
                            `(اكتب هنا خطوات عملية ونصائح سلوكية ليتبعها in حياته)\n\n` +
                            `【 ✉️ رسالة الطبيب إليك 】\n` +
                            `(اكتب هنا رسالة قصيرة، دافئة، ومحفزة تلمس قلبه)`;

      try {
        const report = await askAI([{ role: "user", parts: [{ text: analysisPrompt }] }]);

        // حذف رسالة الانتظار المؤقتة للترتيب
        try { api.unsendMessage(info.messageID); } catch(e) {}

        const finalMsg = BOX(
          "🧠 تَقْرِيرُكَ النَّفْسِيُّ الشَّامِلُ",
          [report],
          ["⚠️ التقرير للتوعية والتسلية فقط — استشر متخصصاً عند الحاجة 💙"]
        );

        api.sendMessage(finalMsg, threadID, messageID);
      } catch (aiError) {
        console.error("خطأ في الاتصال بالذكاء الاصطناعي النفسي:", aiError);
        api.sendMessage("❌ عذراً، تعذر إنتاج التقرير النفسي بسبب مشكلة في الاتصال بالخادم. حاول لاحقاً.", threadID, messageID);
      } finally {
        userProgress.delete(handleReply.key); // تنظيف الذاكرة بشكل نهائي
      }
    });
  }
}

// 📤 التصدير المزدوج الكامل والمثالي لضمان التوافق التام مع سورس ريو
module.exports = {
  config: {
    name: "نفسي",
    version: "2.1.0",
    role: 0,
    author: "Abdou",
    description: "تقييم نفسي متطور وسريع باختيار 10 أسئلة متوازية عشوائية وتحليلها بالذكاء الاصطناعي",
    category: "ترفيه",
    usages: "ابدأ",
    cooldown: 5
  },

  onCall: runCommand,
  onReply: replyCommand,
  run: runCommand,
  handleReply: replyCommand
};
