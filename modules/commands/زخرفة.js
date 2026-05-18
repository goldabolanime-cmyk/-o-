module.exports.config = {
  name: "زخرفة",
  version: "3.1.0",
  hasPermssion: 0,
  credits: "Abdou / RIO BOT",
  description: "زخرفة نصوص بـ 22 ستايل نادر ودقيق (إنجليزي)",
  commandCategory: "أدوات",
  usages: "اختر من القائمة عبر الرد بالرقم أو [التالي/السابق]",
  cooldowns: 2
};

const styles = [
  { name: "Sᴛʏʟᴇ 1", func: t => t.toUpperCase().split('').map(c => "ABCDEFGHIJKLMNOPQRSTUVWXYZ".includes(c) ? "ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀsᴛᴜᴠᴡxʏᴢ"["ABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(c)] : c).join('') },
  { name: "Sτyℓe 2", func: t => t.split('').map(c => "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".includes(c) ? "αвc∂єƒgнιנкℓмησρqяѕтυνωкуzΑΒCΔΕFɢΗɪᴊΚLΜΝΟΡQʀSΤᴜᴠWΧΥᴢ"["abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(c)] : c).join('') },
  { name: "Sƚყʅҽ 3", func: t => t.split('').map(c => "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".includes(c) ? "αвc∂єƒgнιנкℓмησρqяѕтυνωкуzΑΒCΔΕFɢΗɪᴊΚLΜΝΟΡQʀSΤᴜᴠWΧΥᴢ"["abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(c)] : c).join('') },
  { name: "𝔖𝔱𝔶𝔩𝔢 4", func: t => t.split('').map(c => "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".includes(c) ? "𝔞𝔟𝔠𝔡𝔢𝔣𝔤𝔥𝔦𝔧𝔨𝔩𝔪𝔫𝔬𝔭𝔮𝔯𝔰排列𝔲𝔳𝔴𝔵𝔶𝔷𝔄𝔅ℭ𝔇𝔈𝔉𝔊ℌℑ𝔍𝔎𝔏𝔐𝔑𝔒𝔓𝔔ℜ𝔖𝔗𝔘𝔙𝔚𝔛𝔜ℨ"["abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(c)] : c).join('') },
  { name: "𝓢𝓽𝔂𝓵𝓮 5", func: t => t.split('').map(c => "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".includes(c) ? "𝓪𝓫𝓬𝓭𝓮𝓯𝓰𝓱𝓲𝓳𝓴𝓵𝓶𝓷𝓸𝓹𝓺𝓻𝓼𝓽𝓾𝓿𝔀𝔁𝔂𝔃𝓐𝓑𝓒𝓓𝓔𝓕𝓖𝓗𝓘𝓙𝓚𝓛𝓜𝓝𝓒𝓔𝓠𝓡𝓢𝓣𝓤𝓥𝓦𝓧𝓨𝓩"["abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(c)] : c).join('') },
  { name: "𝕊𝕥𝕪𝕝𝕖 6", func: t => t.split('').map(c => "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".includes(c) ? "𝕒𝕓𝕔𝕕𝕖𝕗𝕘𝕙𝕚𝕛𝕜𝕝𝕞𝕟𝕠𝕡𝕢𝕣𝕤𝕥𝕦𝕧𝕨𝕩𝕪𝕫𝔸𝔹ℂDouble𝔼𝔽𝔾ℍ𝕀𝕁𝕂𝕃𝕄ℕstyle𝕆ℙℚℝ𝕊𝕋𝕌𝕍𝕎𝕏𝕐ℤ"["abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(c)] : c).join('') },
  { name: "丂ㄒㄚㄥ乇 7", func: t => t.toUpperCase().split('').map(c => "ABCDEFGHIJKLMNOPQRSTUVWXYZ".includes(c) ? "卂乃匚ᗪ乇千Ꮆ卄丨ﾌҜㄥ爪几ㄖ卩Ɋ尺丂ㄒㄩᐯ山乂ㄚ乙"["ABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(c)] : c).join('') },
  { name: "ֆȶʏʟɛ 8", func: t => t.split('').map(c => "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".includes(c) ? "αвc∂єƒgнιנкℓмησρqяѕтυνωкуzΑΒCΔΕFɢΗɪᴊΚLΜΝΟΡQʀSΤᴜᴠWΧΥᴢ"["abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(c)] : c).join('') },
  { name: "รtylє 9", func: t => t.split('').map(c => "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".includes(c) ? "αвc∂єƒgнιנкℓмησρqяѕтυνωкуzΑΒCΔΕFɢΗɪᴊΚLΜΝΟΡQʀSΤᴜᴠWΧΥᴢ"["abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(c)] : c).join('') },
  { name: "SƮ¥ŁE 10", func: t => t.toUpperCase().split('').map(c => "ABCDEFGHIJKLMNOPQRSTUVWXYZ".includes(c) ? "ᗩᗷᑕᗞᗴᖴǤᕼIᒎᏦᒪᗰᑎOᑭᑫᖇᔕTᑌᐯᗯ᙭Yᘔ"["ABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(c)] : c).join('') },
  { name: "sᴛʏʟᴇ 11", func: t => t.split('').map(c => "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".includes(c) ? "ᴀʙᴄᴅᴇғɢʜɪᴊᴋʟᴍɴᴏᴘǫʀsᴛᴜᴠᴡxʏᴢᴀʙᴄᴅᴇғɢʜɪᴊᴋʟᴍɴᴏᴘǫʀsᴛᴜᴠᴡxʏᴢ"["abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(c)] : c).join('') },
  { name: "𝐒𝐭𝐲𝐥𝐞 12", func: t => t.split('').map(c => "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".includes(c) ? "𝐚𝐛𝐜𝐝维护𝐞𝐟𝐠𝐡𝐢𝐣𝐤𝐥𝐦𝐧𝐨𝐩𝐪𝐫𝐬𝐭𝐮𝐯𝐰𝐱𝐲𝐳𝐀𝐁𝐂𝐃𝐄𝐅𝐆𝐇𝐈𝐉𝐊𝐋𝐌𝐍𝐎𝐏𝐐𝐑𝐒𝐓𝐔𝐕𝐖𝐗𝐘𝐙"["abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(c)] : c).join('') },
  { name: "𝘚𝘵𝘺𝘭𝘦 13", func: t => t.split('').map(c => "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".includes(c) ? "𝘢𝘣𝘤𝘥𝘦𝘧𝘨𝘩𝘪𝘫𝘬𝘭𝘮𝘯𝘰𝘱𝘲𝘳𝘴𝘵𝘶𝘷𝘸𝘹𝘺𝘻𝘈𝘉𝘊𝘋𝘌𝘍𝘎𝘏𝘐𝘑𝘒𝘓𝘔𝘕𝘖𝘗𝘘𝘙𝘚𝘛𝘜𝘝𝘞𝘟𝘠𝘡"["abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(c)] : c).join('') },
  { name: "𝙎𝙩𝙮𝙡𝙚 14", func: t => t.split('').map(c => "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".includes(c) ? "𝙖𝙗𝙘𝙙𝙚𝙛𝙜𝙝𝙞𝙟𝙠𝙡𝙢𝙣𝙤𝙥𝙦𝙧𝙨𝙩𝙪𝙫𝙬𝙭𝙮𝙯𝘼𝘽𝘾𝘿𝙀𝙁𝙂𝙃𝙄𝙅𝙆𝙇𝙈𝙉𝙊𝙋𝙌𝙍𝙎𝙏𝙐𝙑𝙒𝙓𝙔𝙕"["abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(c)] : c).join('') },
  { name: "𝚂𝚝𝚢𝚕𝚎 15", func: t => t.split('').map(c => "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".includes(c) ? "𝚊𝚋𝚌𝚍𝚎𝚏𝚐𝚑𝚒𝚓𝚔xl𝚖𝚗𝚘𝚙𝚚𝚛𝚜𝚝𝚞𝚟𝚠𝚡𝚢𝚣𝙰𝙱𝙲𝙳𝙴𝙵𝙶𝙷𝙸𝙹𝙺𝙻𝙼𝙽𝙾family𝙿𝚀𝚁𝚂𝚃𝚄规格𝚅𝚆𝚇𝚈𝚉"["abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(c)] : c).join('') },
  { name: "S̾t̾y̾l̾e̾ 16", func: t => t.split('').map(c => c + "̾").join('') },
  { name: "Sͦtͦyͦlͦeͦ 17", func: t => t.split('').map(c => c + "ͦ").join('') },
  { name: "S͟t͟y͟l͟e͟ 18", func: t => t.split('').map(c => c + "͟").join('') },
  { name: "S̷t̷y̷l̷e̷ 19", func: t => t.split('').map(c => c + "̷").join('') },
  { name: "S̴t̴y̴l̴e̴ 20", func: t => t.split('').map(c => c + "̴").join('') },
  { name: "S̾t̾y̾l̾e̾ 21", func: t => t.split('').map(c => c + "̾").join('') },
  { name: "S͎t͎y͎l͎e͎ 22", func: t => t.split('').map(c => c + "͎").join('') }
];

module.exports.run = async function({ api, event }) {
  const { threadID, messageID } = event;
  return sendList(api, threadID, 0, messageID);
};

async function sendList(api, threadID, page, messageID) {
  const itemsPerPage = 6;
  const start = page * itemsPerPage;
  const end = start + itemsPerPage;
  const currentStyles = styles.slice(start, end);

  let msg = `╮──────⟢ـ 『 **قـائـمـة الـزخـرفـة** 』\n┆\n`;
  currentStyles.forEach((s, i) => {
    msg += `┆ ${start + i + 1} - ${s.name}\n`;
  });

  msg += `┆\n`;
  if (end < styles.length) msg += `┆ اكتب [ التالي ] للمزيد\n`;
  if (page > 0) msg += `┆ اكتب [ السابق ] للعودة\n`;
  msg += `╯──────⟢ـ 『 ${start + 1}-${Math.min(end, styles.length)} / ${styles.length} 』`;

  return api.sendMessage(msg, threadID, (err, info) => {
    if (err) return;
    global.client.handleReply.push({
      name: "زخرفة",
      messageID: info.messageID,
      page: page,
      type: "choose_style"
    });
  }, messageID);
}

module.exports.handleReply = async function({ api, event, handleReply }) {
  const { threadID, messageID, body } = event;
  if (handleReply.name !== "زخرفة") return;

  if (handleReply.type === "choose_style") {
    const input = body.trim().toLowerCase();

    if (input === "التالي") {
      if ((handleReply.page + 1) * 6 >= styles.length) return;
      api.unsendMessage(handleReply.messageID);
      return sendList(api, threadID, handleReply.page + 1, messageID);
    }
    if (input === "السابق") {
      if (handleReply.page <= 0) return;
      api.unsendMessage(handleReply.messageID);
      return sendList(api, threadID, handleReply.page - 1, messageID);
    }

    const index = parseInt(input) - 1;
    if (isNaN(index) || index < 0 || index >= styles.length) {
      return api.sendMessage("⚠️ رقم غير صحيح، اختر من القائمة عيني.", threadID, messageID);
    }

    api.unsendMessage(handleReply.messageID);
    return api.sendMessage(`╮──────⟢ـ\n┆ 💡 اكتب العبارة المراد زخرفتها الآن\n╯──────⟢ـ`, threadID, (err, info) => {
      if (err) return;
      global.client.handleReply.push({
        name: "زخرفة",
        messageID: info.messageID,
        styleIndex: index,
        type: "input_text"
      });
    }, messageID);
  }

  if (handleReply.type === "input_text") {
    const selectedStyle = styles[handleReply.styleIndex];
    const decoratedText = selectedStyle.func(body);

    // إرسال الكلمة مزخرفة بمفردها لتسهيل النسخ السريع والمباشر
    api.unsendMessage(handleReply.messageID);
    return api.sendMessage(decoratedText, threadID, messageID);
  }
};
