module.exports.config = {
  name: "طقس",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "REM BOT",
  description: "معلومات الطقس لأي مدينة في العالم 🌤️",
  usePrefix: true,
  commandCategory: "خدمات",
  usages: "[اسم المدينة] مثال: طقس الجزائر",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const axios = require("axios");
  const { threadID, messageID } = event;

  const city = args.join(" ");
  if (!city) {
    return api.sendMessage(
      `✦〘•ما 𝑹𝑬𝑴-𝑩𝑶𝑻 ما•〙✦\n───── · · · ✦ · · · ─────\n🌤️ حالة الطقس\n───── · · · ✦ · · · ─────\n\n📍 اكتب اسم المدينة بعد الأمر\nمثال: .طقس الجزائر\nأو: .طقس Cairo\n───── · · · ✦ · · · ─────`,
      threadID, messageID
    );
  }

  try {
    const url = `https://wttr.in/${encodeURIComponent(city)}?format=j1&lang=ar`;
    const res = await axios.get(url, { timeout: 10000, headers: { "User-Agent": "curl/7.68.0" } });
    const data = res.data;

    const current = data.current_condition[0];
    const location = data.nearest_area[0];

    const cityName = location.areaName[0]?.value || city;
    const country = location.country[0]?.value || "";
    const temp = current.temp_C;
    const feelsLike = current.FeelsLikeC;
    const humidity = current.humidity;
    const windSpeed = current.windspeedKmph;
    const desc = current.lang_ar?.[0]?.value || current.weatherDesc[0]?.value || "غير معروف";
    const uvIndex = current.uvIndex;
    const visibility = current.visibility;

    const weatherEmoji = getWeatherEmoji(desc);

    const msg =
      `✦〘•ما 𝑹𝑬𝑴-𝑩𝑶𝑻 ما•〙✦\n` +
      `───── · · · ✦ · · · ─────\n` +
      `${weatherEmoji} حالة الطقس\n` +
      `───── · · · ✦ · · · ─────\n\n` +
      `📍 المدينة: ${cityName}، ${country}\n` +
      `🌡️ درجة الحرارة: ${temp}°C\n` +
      `🤔 الإحساس بها: ${feelsLike}°C\n` +
      `☁️ الحالة: ${desc}\n` +
      `💧 الرطوبة: ${humidity}%\n` +
      `💨 سرعة الرياح: ${windSpeed} كم/ساعة\n` +
      `☀️ مؤشر UV: ${uvIndex}\n` +
      `👁️ مدى الرؤية: ${visibility} كم\n\n` +
      `───── · · · ✦ · · · ─────`;

    return api.sendMessage(msg, threadID, messageID);
  } catch (e) {
    return api.sendMessage(
      `✦〘•ما 𝑹𝑬𝑴-𝑩𝑶𝑻 ما•〙✦\n───── · · · ✦ · · · ─────\n❌ لم أجد معلومات الطقس لـ: ${city}\nتأكد من اسم المدينة.\n───── · · · ✦ · · · ─────`,
      threadID, messageID
    );
  }
};

function getWeatherEmoji(desc) {
  const d = desc.toLowerCase();
  if (d.includes("صافية") || d.includes("sunny") || d.includes("clear")) return "☀️";
  if (d.includes("غائم") || d.includes("cloudy") || d.includes("overcast")) return "☁️";
  if (d.includes("ضبابي") || d.includes("fog") || d.includes("mist")) return "🌫️";
  if (d.includes("مطر") || d.includes("rain") || d.includes("drizzle")) return "🌧️";
  if (d.includes("عاصفة") || d.includes("storm") || d.includes("thunder")) return "⛈️";
  if (d.includes("ثلج") || d.includes("snow")) return "❄️";
  if (d.includes("رياح") || d.includes("wind")) return "💨";
  return "🌤️";
}
