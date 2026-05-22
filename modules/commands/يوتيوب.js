const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const qs = require('qs');

const CACHE_DIR = path.join(process.cwd(), 'cache', 'ytb');
const MAX_FILE_BYTES = 50 * 1024 * 1024;

// ══════════════════════════════════════════
// CONFIG
// ══════════════════════════════════════════
module.exports.config = {
  name: "يوتيوب",
  aliases: ["ytb", "youtube", "yt"],
  version: "20.4.1",
  hasPermssion: 0,
  credits: "Yamada KJ / تعديل عبدو",
  description: "بحث وتحميل من يوتيوب (صوت/فيديو) مع دعم نظام الرد التفاعلي بالزخرفة الأسطورية",
  commandCategory: "نظام",
  usages: "[فيديو / صوت / بحث] + [اسم المقطع أو الرابط]",
  cooldowns: 5
};

// ══════════════════════════════════════════
// الزخرفة التلقائية المعتمدة
// ══════════════════════════════════════════
const BOX = (title, lines, footer = null) => {
  let m = `●─────── ✾ ───────●\n ⦿ ⟬ ${title} ⟭ ⦿\n⊱ ────────────── ⊰\n`;
  for (const l of lines) { 
    if (!l && l !== 0) { m += `\n`; } 
    else { m += `  ⟣ ${l}\n`; } 
  }
  if (footer) { 
    m += `⊱ ────────────── ⊰\n`; 
    for (const f of footer) { 
      if (!f && f !== 0) { m += `\n`; } 
      else { m += `  ⟣ ${f}\n`; } 
    } 
  }
  return m + '●─────── ✾ ───────●';
};

// ══════════════════════════════════════════
// دالات البحث والتحميل الخلفية
// ══════════════════════════════════════════
async function searchYouTube(query, max = 6) {
  const { data: html } = await axios.get(
    `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
    {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 12000,
    }
  );

  const jsonMatch = html.match(/var ytInitialData = ({.+?});<\/script>/s) || html.match(/var ytInitialData = ({.+?});/s);

  if (jsonMatch) {
    try {
      const ytData = JSON.parse(jsonMatch[1]);
      const contents = ytData?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];

      const videos = [];
      for (const section of contents) {
        for (const item of section.itemSectionRenderer?.contents || []) {
          if (videos.length >= max) break;
          const vr = item.videoRenderer;
          if (!vr?.videoId) continue;

          const title = vr.title?.runs?.[0]?.text || vr.title?.simpleText || '—';
          const channel = vr.ownerText?.runs?.[0]?.text || vr.shortBylineText?.runs?.[0]?.text || '—';
          const dur = vr.lengthText?.simpleText || '—';

          videos.push({
            videoId: vr.videoId,
            title: title.length > 65 ? title.slice(0, 65) + '…' : title,
            channel: channel.length > 35 ? channel.slice(0, 35) + '…' : channel,
            duration: dur,
            url: `https://www.youtube.com/watch?v=${vr.videoId}`,
            thumbnail: `https://i.ytimg.com/vi/${vr.videoId}/mqdefault.jpg`,
          });
        }
      }
      if (videos.length) return videos;
    } catch {}
  }

  const videos = [];
  const re = /"videoId":"([^"]{11})"[^}]{0,200}?"text":"([^"]+)"/g;
  let m;
  while ((m = re.exec(html)) !== null && videos.length < max) {
    if (videos.find(v => v.videoId === m[1])) continue;
    const title = m[2].replace(/\\u0026/g, '&').replace(/\\\//g, '/');
    videos.push({
      videoId: m[1],
      title: title.length > 65 ? title.slice(0, 65) + '…' : title,
      channel: '—', duration: '—',
      url: `https://www.youtube.com/watch?v=${m[1]}`,
      thumbnail: `https://i.ytimg.com/vi/${m[1]}/mqdefault.jpg`,
    });
  }
  return videos;
}

async function savenow(url, format = '480') {
  const opts = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': '*/*',
    },
    timeout: 20000,
  };

  const r1 = await axios.get(
    `https://p.savenow.to/ajax/download.php?button=1&start=1&end=1&format=${format}&iframe_source=https://www.y2down.app,&url=${encodeURIComponent(url)}`,
    opts
  );

  const progressUrl = r1.data?.progress_url;
  const title = r1.data?.title || 'video';
  if (!progressUrl) throw new Error(`savenow: لا progress_url`);

  for (let i = 0; i < 50; i++) {
    await new Promise(r => setTimeout(r, 1500));
    try {
      const r2 = await axios.get(progressUrl, { ...opts, timeout: 10000 });
      const d = r2.data;

      if (d.success === 1 && d.progress === 1000 && d.download_url)
        return { downloadUrl: d.download_url, title, quality: format };

      if (d.success === 0 && d.text) {
        const txt = (d.text || '').toLowerCase();
        const isWorking = txt.includes('download') || txt.includes('process') || txt.includes('initial') || txt.includes('convert') || txt.includes('wait') || txt.includes('writing') || txt.includes('metadata') || txt.includes('mux') || txt.includes('remux') || txt.includes('render') || txt.includes('encod');
        if (!isWorking) throw new Error(d.text);
      }
    } catch (e) {
      if (e.code === 'ECONNRESET' || e.code === 'ETIMEDOUT') continue;
      throw e;
    }
  }
  throw new Error('savenow: انتهت مهلة الانتظار (75s)');
}

async function ssvid(url) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Content-Type': 'application/x-www-form-urlencoded',
    'x-requested-with': 'XMLHttpRequest',
    'origin': 'https://ssvid.net',
    'referer': 'https://ssvid.net/youtube-to-mp4',
  };

  const info = await axios.post(
    'https://ssvid.net/api/ajax/search',
    qs.stringify({ query: url, cf_token: '', vt: 'youtube' }),
    { headers, timeout: 20000 }
  ).then(r => r.data);

  const mp3Obj = info?.links?.mp3 || info?.mp3 || null;
  if (!mp3Obj || !Object.keys(mp3Obj).length)
    throw new Error(`ssvid: لا روابط mp3`);

  const firstMp3 = Object.values(mp3Obj)[0];
  if (!firstMp3?.k) throw new Error('ssvid: k مفقود');

  const conv = await axios.post(
    'https://ssvid.net/api/ajax/convert',
    qs.stringify({ vid: info.vid, k: firstMp3.k }),
    { headers, timeout: 20000 }
  ).then(r => r.data);

  const dlink = conv?.dlink || conv?.download_url || conv?.url;
  if (!dlink) throw new Error(`ssvid: لا رابط تحميل`);
  return { downloadUrl: dlink, title: info.title || 'audio', quality: '~48kbps' };
}

async function fetchMedia(url, format) {
  if (format === 'mp3') {
    try { return await ssvid(url); } catch { return await savenow(url, 'mp3'); }
  } else {
    try { return await savenow(url, '480'); } catch { return await savenow(url, '360'); }
  }
}

async function downloadFile(dlUrl, ext) {
  await fs.ensureDir(CACHE_DIR);
  const fp = path.join(CACHE_DIR, `yt_${Date.now()}.${ext}`);
  const r = await axios.get(dlUrl, {
    responseType: 'arraybuffer',
    timeout: 120000,
    maxContentLength: MAX_FILE_BYTES,
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
  });
  await fs.writeFile(fp, Buffer.from(r.data));
  if ((await fs.stat(fp)).size === 0) throw new Error('الملف المحمّل فارغ');
  return fp;
}

// ══════════════════════════════════════════
// EXECUTE RUN
// ══════════════════════════════════════════
module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;

  const send = (body, attachment = null) =>
    new Promise(res =>
      api.sendMessage(
        attachment ? { body, attachment } : { body },
        threadID, (err, info) => res(err ? null : info), messageID
      )
    );

  const react = e => api.setMessageReaction(e, messageID, () => {}, true);
  const sub = (args[0] || '').trim();

  // ── مساعدة عند طلب الأمر بدون وسائط ──
  if (!sub) {
    return send(BOX('يُوتِيُوبُ 📺', [
      '📹 .يوتيوب فيديو [بحث/رابط]',
      '🎵 .يوتيوب صوت  [بحث/رابط]',
      '🔍 .يوتيوب بحث  [كلمات]',
    ]));
  }

  const isVideo = sub === 'فيديو';
  const isAudio = sub === 'صوت';
  const isSearch = sub === 'بحث';

  if (!isVideo && !isAudio && !isSearch) {
    return send(BOX('⚠️ أَمْرٌ غَيْرُ صَحِيحٍ', [
      'الأوامر المتاحة: فيديو | صوت | بحث',
      'مثال: .يوتيوب فيديو اسم الأغنية',
    ]));
  }

  const input = args.slice(1).join(' ').trim();
  if (!input) return send(BOX('⚠️ نَقْصٌ', ['أدخل كلمات البحث أو رابط المقطع!']));

  const isUrl = /youtu\.?be|youtube\.com\/(?:watch|shorts)/.test(input);
  const format = isAudio ? 'mp3' : 'mp4';

  // ── 1. أمر البحث المباشر (إحصائيات وروابط) ──
  if (isSearch) {
    react('🔍');
    try {
      const videos = await searchYouTube(input, 6);
      if (!videos.length) {
        react('❌');
        return send(BOX('❌ لا نَتَائِجَ', [`لم يُعثر على: ${input}`]));
      }

      const thumbs = [];
      for (const v of videos) {
        try {
          const r = await axios.get(v.thumbnail, { responseType: 'stream', timeout: 6000 });
          thumbs.push(r.data);
        } catch {}
      }

      const lines = [];
      videos.forEach((v, i) => {
        lines.push(`${i + 1}. ${v.title}`);
        lines.push(`   👤 ${v.channel} | ⏱️ ${v.duration}`);
        lines.push('');
      });

      const info = await send(
        BOX(`بَحْثٌ: ${input} 🔍`, lines, [
          'رد برقم + نوع للتحميل المباشر',
          'مثال: 1 فيديو  أو  2 صوت',
        ]),
        thumbs.length ? thumbs : null
      );
      react('✅');

      global.client.handleReply.push({
        name: "يوتيوب",
        messageID: info.messageID,
        author: senderID,
        type: 'yt_search',
        videos
      });

    } catch (e) {
      react('❌');
      send(BOX('❌ خَطَأٌ فِي الْبَحْثِ', [`السبب: ${e.message.slice(0, 100)}`]));
    }
    return;
  }

  // ── 2. تحميل عبر رابط يوتيوب مباشر ──
  if (isUrl) {
    react('📥');
    const typeLabel = isAudio ? 'الصوت 🎵' : 'الفيديو 📹';
    const waitMsg = await send(BOX(`تَحْمِيلٌ 📥`, [
      `النوع: ${typeLabel}`,
      '⏳ جاري معالجة الرابط والتحميل...',
    ]));
    const delWait = () => { if (waitMsg?.messageID) api.unsendMessage(waitMsg.messageID).catch(() => {}); };

    try {
      const result = await fetchMedia(input, format);
      delWait();
      const filePath = await downloadFile(result.downloadUrl, format);
      const sizeMB = ((await fs.stat(filePath)).size / 1024 / 1024).toFixed(2);

      await send(
        BOX(`✅ تَمَّ التَّحْمِيلُ ${isAudio ? '🎵' : '📹'}`, [
          `📖 ${result.title}`,
          `📁 ${result.quality} | ${sizeMB} MB`,
        ]),
        fs.createReadStream(filePath)
      );
      react('✅');
      setTimeout(() => fs.remove(filePath).catch(() => {}), 8000);

    } catch (e) {
      delWait();
      react('❌');
      send(BOX('❌ فَشَلَ التَّحْمِيلُ', [`السبب: ${e.message.slice(0, 120)}`]));
    }
    return;
  }

  // ── 3. طلب (فيديو/صوت) + كلمات بحث ──
  react('🔍');
  try {
    const videos = await searchYouTube(input, 6);
    if (!videos.length) {
      react('❌');
      return send(BOX('❌ لا نَتَائِجَ', [`لم يُعثر على: ${input}`]));
    }

    const thumbs = [];
    for (const v of videos) {
      try {
        const r = await axios.get(v.thumbnail, { responseType: 'stream', timeout: 6000 });
        thumbs.push(r.data);
      } catch {}
    }

    const lines = [];
    videos.forEach((v, i) => {
      lines.push(`${i + 1}. ${v.title}`);
      lines.push(`   👤 ${v.channel} | ⏱️ ${v.duration}`);
      lines.push('');
    });

    const info = await send(
      BOX(`نَتَائِجُ ${isAudio ? '🎵' : '📹'}: ${input}`, lines, [
        `رد برقم النتيجة (1-${videos.length}) لبدء التحميل`,
      ]),
      thumbs.length ? thumbs : null
    );
    react('✅');

    global.client.handleReply.push({
      name: "يوتيوب",
      messageID: info.messageID,
      author: senderID,
      type: 'yt_results',
      videos,
      format
    });

  } catch (e) {
    react('❌');
    send(BOX('❌ خَطَأٌ فِي الْبَحْثِ', [`السبب: ${e.message.slice(0, 100)}`]));
  }
};

// ══════════════════════════════════════════
// ON REPLY (نظام تفاعل الردود الذكي)
// ══════════════════════════════════════════
module.exports.handleReply = async function ({ api, event, handleReply }) {
  const { threadID, messageID, senderID, body } = event;

  if (senderID !== handleReply.author) {
    return api.sendMessage('⚠️ عذراً، هذا الاختيار خاص بصاحب الأمر الأصلي فقط!', threadID, messageID);
  }

  const input = (body || '').trim();
  const { type, videos } = handleReply;

  const send = (body, attachment = null) =>
    new Promise(res =>
      api.sendMessage(
        attachment ? { body, attachment } : { body },
        threadID, (err, info) => res(err ? null : info), messageID
      )
    );

  const react = e => api.setMessageReaction(e, messageID, () => {}, true);

  // 🛠️ جلب ميكانيكية التحميل والرفع المشتركة
  const startDownloadWorkflow = async (video, format) => {
    const typeLabel = format === 'mp3' ? 'الصوت 🎵' : 'الفيديو 📹';
    react('📥');

    const waitMsg = await send(BOX(`تَحْمِيلٌ 📥`, [
      `📖 ${video.title}`,
      `النوع: ${typeLabel}`,
      '⏳ جاري سحب المقطع من خوادم اليوتيوب...',
    ]));
    const delWait = () => { if (waitMsg?.messageID) api.unsendMessage(waitMsg.messageID).catch(() => {}); };

    try {
      const result = await fetchMedia(video.url, format);
      delWait();
      const filePath = await downloadFile(result.downloadUrl, format);
      const sizeMB = ((await fs.stat(filePath)).size / 1024 / 1024).toFixed(2);

      await send(
        BOX(`✅ تَمَّ التَّحْمِيلُ ${format === 'mp3' ? '🎵' : '📹'}`, [
          `📖 ${result.title}`,
          `👤 ${video.channel} | ⏱️ ${video.duration}`,
          `📁 ${result.quality} | ${sizeMB} MB`,
        ]),
        fs.createReadStream(filePath)
      );
      react('✅');
      setTimeout(() => fs.remove(filePath).catch(() => {}), 8000);

    } catch (e) {
      delWait();
      react('❌');
      send(BOX('❌ فَشَلَ التَّحْمِيلُ', [`السبب: ${e.message.slice(0, 120)}`]));
    }
  };

  // التعامل مع البحث العام (رقم + نوع مثل: 1 صوت أو 3 فيديو)
  if (type === 'yt_search') {
    const parts = input.split(/\s+/);
    const idx = parseInt(parts[0]);
    const mode = (parts[1] || 'فيديو');
    const format = mode === 'صوت' ? 'mp3' : 'mp4';

    if (isNaN(idx) || idx < 1 || idx > videos.length) {
      return send(BOX('⚠️ تَنْبِيهٌ', [
        `يرجى كتابة رقم النتيجة يليه النوع بشكل صحيح`,
        'مثال: 1 فيديو أو 2 صوت',
      ]));
    }
    return startDownloadWorkflow(videos[idx - 1], format);
  }

  // التعامل مع نتائج الفلترة المسبقة (رقم فقط)
  if (type === 'yt_results') {
    const idx = parseInt(input);
    if (isNaN(idx) || idx < 1 || idx > videos.length) {
      return send(BOX('⚠️ تَنْبِيهٌ', [`يرجى إدخال رقم صحيح من 1 إلى ${videos.length}`]));
    }
    return startDownloadWorkflow(videos[idx - 1], handleReply.format);
  }
};
