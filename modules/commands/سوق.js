const fs = require("fs-extra");
const path = require("path");

// ═══════════════════════════════════════
// 🏦 إعداد المسارات الآمنة للكاش
// ═══════════════════════════════════════
const cacheDir = path.join(__dirname, "cache");
const marketPath = path.join(cacheDir, "market_data.json");

module.exports.config = {
    name: "سوق",
    version: "6.1.0",
    hasPermssion: 0,
    credits: "Abdou / RIO BOT",
    description: "سوق ريو العظيم - اقتصاد متكامل مصلح ومحمي بالكامل مع النواة",
    commandCategory: "اقتصاد",
    usages: "[دخول/اسعار/شراء/مزاد/مشروع/تحويل/مساعدة]",
    cooldowns: 3
};

// ═══════════════════════════════════════
// ✨ زخرفة احترافية متوافقة مع ريو بوت
// ═══════════════════════════════════════
const header = (title) => `●─── ⟪ ${title} ⟫ ───●`;
const divider = () => `●─────── ⌬ ───────●`;
const row = (emoji, label, value) => `『 ${emoji} 』 ${label}↜ ${value}`;
const box = (title, rows) => `${header(title)}\n${rows}\n${divider()}`;

// ═══════════════════════════════════════
// 📦 دالة بناء البيانات الافتراضية للسوق
// ═══════════════════════════════════════
function createDefaultMarketFile() {
    if (!fs.existsSync(cacheDir)) {
        fs.ensureDirSync(cacheDir);
    }

    const natural = [];
    const factory = [];
    const raw = [];

    const naturalNames = [
        "تفاح","برتقال","موز","عنب","خوخ","تمر","رمان","ليمون","بطيخ","فراولة",
        "بطاطس","طماطم","خيار","جزر","فلفل","نعناع","ريحان","ورد","عسل","حليب",
        "بيض","سمك","دجاج","لحم","قمح","شعير","ذرة","قهوة","شاي","خشب",
        "فحم","ملح","ثلج","ماء نقي","جلد","صوف","قطن","قصب سكر","فطر","توت",
        "مانجو","أناناس","كيوي","جوز","لوز","فستق","أرز","فول","عدس","حمص"
    ];

    naturalNames.forEach((x, i) => {
        natural.push({
            id: i + 1,
            name: x,
            category: "طبيعي",
            price: Math.floor(Math.random() * 500) + 100,
            trend: "stable"
        });
    });

    const factoryNames = [
        "سيارة","حاسوب","هاتف","شاشة","ثلاجة","غسالة","دراجة","مكيف","كاميرا","سماعة",
        "ساعة","كرسي","طاولة","سرير","مصباح","روبوت","طيارة لعبة","مروحة","شاحن","لوحة",
        "ملابس","حذاء","حقيبة","خوذة","دبابة لعبة","مكيف سيارة","مولد","آلة قهوة","فرن","طابعة"
    ];

    factoryNames.forEach((x, i) => {
        factory.push({
            id: i + 51,
            name: x,
            category: "مصنع",
            price: Math.floor(Math.random() * 5000) + 1000,
            trend: "stable"
        });
    });

    const rawNames = [
        "ذهب خام", "ألماس خام", "يورانيوم", "بلاتين", "تيتانيوم",
        "نفط نادر", "كريستال أزرق", "ياقوت أحمر", "زمرد ملكي", "نيزك فضائي"
    ];

    rawNames.forEach((x, i) => {
        raw.push({
            id: i + 81,
            name: x,
            category: "خام",
            price: Math.floor(Math.random() * 50000) + 10000,
            trend: "stable"
        });
    });

    const productTypes = ["غذائي", "تقني", "صناعي", "زراعي", "عسكري", "طبي", "فاخر"];

    const data = {
        users: {},
        auctions: {},
        productTypes,
        items: {
            طبيعي: natural,
            مصنع: factory,
            خام: raw
        }
    };

    fs.writeJsonSync(marketPath, data, { spaces: 2 });
}

module.exports.onLoad = () => {
    if (!fs.existsSync(marketPath)) {
        createDefaultMarketFile();
    }
};

// ═══════════════════════════════════════
// 🚀 متحكم التشغيل الأساسي (Run)
// ═══════════════════════════════════════
module.exports.run = async function({ api, event, args, Economy, Users }) {
    const { threadID, messageID, senderID } = event;

    if (!fs.existsSync(marketPath)) {
        createDefaultMarketFile();
    }

    let market = fs.readJsonSync(marketPath);
    const action = (args[0] || "").toLowerCase();

    if (action === "دخول") {
        if (market.users[senderID]) {
            return api.sendMessage(
                box("سوق ريو", row("⚠️", "الحالة", "أنت مسجل بالفعل في النظام الاستثماري")),
                threadID, messageID
            );
        }

        market.users[senderID] = {
            inventory: [],
            joined: Date.now(),
            totalSpent: 0,
            totalEarned: 0
        };

        fs.writeJsonSync(marketPath, market, { spaces: 2 });

        return api.sendMessage(
            box("سوق ريو", [
                row("✅", "التسجيل", "تم تسجيلك بنجاح في بورصة ريو"),
                row("💡", "تنبيه", "يمكنك الآن بدء التداول واستخدام الأوامر")
            ].join("\n")),
            threadID, messageID
        );
    }

    if (action === "مساعدة") {
        const helpText = [
            row("📝", "سوق دخول", "التسجيل بالسوق والاستثمار"),
            row("📊", "سوق اسعار", "قائمة أسعار السلع المحدثة"),
            row("🔍", "سوق اسعار عرض [رقم]", "عرض مخطط بياني لمنتج محدد"),
            row("🏷️", "سوق فئة [النوع]", "عرض منتجات فئة (طبيعي/مصنع/خام)"),
            row("🛒", "سوق شراء [عدد] [رقم]", "شراء الأصول وإضافتها لمشروعك"),
            row("🏗️", "سوق مشروع عرض", "استعراض الأصول الحالية لمشروعك"),
            row("💸", "سوق مشروع بيع", "بيع أصول المشروع بالكامل للبنك"),
            row("💰", "سوق قيمة", "حساب القيمة المالية الحالية لممتلكاتك"),
            row("🔄", "سوق تحويل", "تحويل فوري للأصول وسحبها كاش تلقائي"),
            row("🔨", "سوق مزاد [السلعة]", "فتح مزاد علني تفاعلي بالمجموعة")
        ].join("\n");

        return api.sendMessage(box("دليل سوق ريو الاستثماري", helpText), threadID, messageID);
    }

    if (!market.users[senderID]) {
        return api.sendMessage("❌ | عذراً، يجب التسجيل أولاً في البورصة عبر كتابة: سوق دخول", threadID, messageID);
    }

    function updatePrices() {
        for (const cat in market.items) {
            market.items[cat].forEach(item => {
                const up = Math.random() > 0.5;
                const change = up ? (1 + Math.random() * 0.05) : (1 - Math.random() * 0.05);
                item.price = Math.max(10, Math.floor(item.price * change));
                item.trend = up ? "up" : "down";
            });
        }
    }

    if (action === "اسعار") {
        updatePrices();
        let allItems = [];
        Object.values(market.items).forEach(arr => { allItems.push(...arr); });
        allItems.sort((a, b) => b.price - a.price);

        if (args[1] === "عرض") {
            const id = parseInt(args[2]);
            const item = allItems.find(x => x.id === id);

            if (!item) return api.sendMessage("❌ | المنتج غير موجود بالسجلات.", threadID, messageID);
            const chart = generateChart(item.price);

            return api.sendMessage(
                box("تفاصيل المؤشر المالي", [
                    row("📦", "الاسم", item.name),
                    row("🏷️", "الفئة", item.category),
                    row("💰", "السعر الحالي", item.price.toLocaleString() + "$"),
                    row("📈", "الحركة", item.trend === "up" ? "صعود 📈" : "هبوط 📉"),
                    row("📊", "المخطط المالي", chart)
                ].join("\n")),
                threadID, messageID
            );
        }

        let msg = "";
        allItems.slice(0, 20).forEach(item => {
            const icon = item.trend === "up" ? "📈" : "📉";
            msg += `『 ${item.id} 』 ${item.name} ↜ ${item.price.toLocaleString()}$ ${icon}\n`;
        });

        fs.writeJsonSync(marketPath, market, { spaces: 2 });
        return api.sendMessage(box("أعلى 20 سهماً ومنتجاً في السوق", msg), threadID, messageID);
    }

    if (action === "فئة") {
        const cat = args[1];
        if (!market.items[cat]) return api.sendMessage("❌ | الفئات الصحيحة هي: [ طبيعي / مصنع / خام ]", threadID, messageID);

        let text = "";
        market.items[cat].forEach(item => {
            text += `『 ${item.id} 』 ${item.name} ↜ ${item.price.toLocaleString()}$\n`;
        });

        return api.sendMessage(box(`فئة منتجات: ${cat}`, text), threadID, messageID);
    }

    if (action === "شراء") {
        const amount = parseInt(args[1]);
        const itemID = parseInt(args[2]);

        if (isNaN(amount) || isNaN(itemID) || amount <= 0) {
            return api.sendMessage("⚠️ | الاستخدام الصحيح: سوق شراء [العدد] [رقم المنتج]", threadID, messageID);
        }

        let item = null;
        for (const cat in market.items) {
            const found = market.items[cat].find(x => x.id === itemID);
            if (found) item = found;
        }

        if (!item) return api.sendMessage("❌ | لم يتم العثور على هذا المنتج عيني.", threadID, messageID);

        const totalCost = item.price * amount;
        const userMoney = await Economy.getBalance(senderID, "money");

        if (userMoney < totalCost) {
            return api.sendMessage(`❌ | رصيدك الحالي لا يكفي لإتمام هذه الصفقة!\n💰 التكلفة الكلية: ${totalCost.toLocaleString()}$\n💵 كاشك الحالي: ${userMoney.toLocaleString()}$`, threadID, messageID);
        }

        await Economy.decrease(totalCost, senderID, "money");

        for (let i = 0; i < amount; i++) {
            market.users[senderID].inventory.push({
                id: item.id,
                name: item.name,
                category: item.category,
                price: item.price,
                boughtAt: Date.now()
            });
        }

        market.users[senderID].totalSpent += totalCost;
        fs.writeJsonSync(marketPath, market, { spaces: 2 });

        return api.sendMessage(
            box("إيصال الصفقة التجارية", [
                row("📦", "المنتج الاستثماري", item.name),
                row("🔢", "الكمية المشتراة", amount),
                row("💰", "الإجمالي المخصوم", totalCost.toLocaleString() + "$")
            ].join("\n")),
            threadID, messageID
        );
    }

    if (action === "قيمة") {
        const inv = market.users[senderID].inventory;
        const userMoney = await Economy.getBalance(senderID, "money");
        let totalAssetsValue = 0;

        inv.forEach(x => { totalAssetsValue += x.price; });

        return api.sendMessage(
            box("الميزانية الاستثمارية الكلية", [
                row("📦", "عدد أصول مشروعك", inv.length),
                row("📈", "القيمة السوقية الحالية", totalAssetsValue.toLocaleString() + "$"),
                row("🏦", "رصيد الكاش الحالي", userMoney.toLocaleString() + "$")
            ].join("\n")),
            threadID, messageID
        );
    }

    if (action === "مشروع") {
        const sub = (args[1] || "").toLowerCase();
        const inv = market.users[senderID].inventory;

        if (sub === "عرض") {
            if (inv.length <= 0) return api.sendMessage("❌ | مشروعك لا يحتوي على أي أصول حالياً.", threadID, messageID);

            let text = "";
            inv.slice(0, 50).forEach((x, i) => {
                text += `『 ${i + 1} 』 ${x.name} ↜ السعر الحالي: ${x.price.toLocaleString()}$\n`;
            });

            return api.sendMessage(box("أصول مشروعك (أول 50)", text), threadID, messageID);
        }

        if (sub === "بيع") {
            if (inv.length <= 0) return api.sendMessage("❌ | لا توجد أصول in مشروعك لبيعها وتصفيتها.", threadID, messageID);

            let totalPayout = 0;
            inv.forEach(x => { totalPayout += x.price; });

            await Economy.increase(totalPayout, senderID, "money");

            market.users[senderID].inventory = [];
            market.users[senderID].totalEarned += totalPayout;
            fs.writeJsonSync(marketPath, market, { spaces: 2 });

            return api.sendMessage(
                box("بيع المشروع بالكامل", [
                    row("💰", "الأرباح الكلية", totalPayout.toLocaleString() + "$"),
                    row("✅", "الحالة", "تم تصفية المشروع وإيداع المبلغ برصيدك")
                ].join("\n")),
                threadID, messageID
            );
        }
    }

    if (action === "تحويل") {
        const inv = market.users[senderID].inventory;
        if (inv.length <= 0) return api.sendMessage("❌ | لا تملك أي ممتلكات في البورصة لتحويلها.", threadID, messageID);

        let totalValue = 0;
        inv.forEach(x => { totalValue += x.price; });

        await Economy.increase(totalValue, senderID, "money");
        market.users[senderID].inventory = [];
        fs.writeJsonSync(marketPath, market, { spaces: 2 });

        return api.sendMessage(
            box("تحويل وتسييل الأصول", [
                row("💸", "القيمة الإجمالية", totalValue.toLocaleString() + "$"),
                row("🏦", "الحالة", "تم الإيداع المباشر في رصيد كاش البوت")
            ].join("\n")),
            threadID, messageID
        );
    }

    if (action === "مزاد") {
        const itemToAuction = args.slice(1).join(" ");
        if (!itemToAuction) return api.sendMessage("⚠️ | يجب كتابة اسم السلعة المراد إطلاق المزاد عليها عيني!", threadID, messageID);

        market.auctions[threadID] = {
            item: itemToAuction,
            owner: senderID,
            highestBid: 0,
            bidder: null,
            started: Date.now()
        };

        fs.writeJsonSync(marketPath, market, { spaces: 2 });

        const auctionNotice = await api.sendMessage(
            box("مزاد علني جديد", [
                row("📦", "السلعة المعروضة", itemToAuction),
                row("⏳", "المدة المتاحة", "60 ثانية للرد على هذه الرسالة"),
                row("💰", "أعلى مزايدة", "0$")
            ].join("\n")),
            threadID, messageID
        );

        global.client.handleReply.push({
            name: module.exports.config.name,
            messageID: auctionNotice.messageID,
            type: "auction",
            threadID,
            createdAt: Date.now(),
            isEnded: false
        });

        // ⏱️ مصلح إنهاء المزاد التلقائي والآمن بعد دقيقة كاملة دون تعليق
        setTimeout(async () => {
            let currentMarket = fs.readJsonSync(marketPath);
            const currentAuction = currentMarket.auctions[threadID];

            const replyIndex = global.client.handleReply.find(r => r.messageID === auctionNotice.messageID);
            if (replyIndex) replyIndex.isEnded = true;

            if (currentAuction) {
                if (currentAuction.highestBid === 0 || !currentAuction.bidder) {
                    api.sendMessage(`🔨 | انتهى المزاد على [ ${currentAuction.item} ] دون تقديم أي عطاءات مادية.`, threadID);
                } else {
                    const winnerName = await Users.getNameUser(currentAuction.bidder);
                    // تسليم الكاش لصاحب المزاد الأساسي حماية للاقتصاد
                    await Economy.increase(currentAuction.highestBid, currentAuction.owner, "money");

                    api.sendMessage(`🏆 | انتهى المزاد رسمياً! السلعة [ ${currentAuction.item} ] من نصيب [ ${winnerName} ] بمبلغ وقدره ${currentAuction.highestBid.toLocaleString()}$\n💰 تم تحويل المبلغ لمالك المزاد الأصلي.`, threadID);
                }
                delete currentMarket.auctions[threadID];
                fs.writeJsonSync(marketPath, currentMarket, { spaces: 2 });
            }
        }, 60000);
    }
};

// ═══════════════════════════════════════
// 📥 معالج الردود الذكي التابع للمزاد (handleReply)
// ═══════════════════════════════════════
module.exports.handleReply = async function({ api, event, handleReply, Economy, Users }) {
    const { threadID, senderID, body, messageID } = event;
    if (handleReply.type !== "auction" || handleReply.isEnded) return;

    if (!fs.existsSync(marketPath)) return;
    let market = fs.readJsonSync(marketPath);
    const auction = market.auctions[threadID];
    if (!auction) return;

    const bid = parseInt(body.trim());
    if (isNaN(bid) || bid <= 0) return;

    if (bid <= auction.highestBid) {
        return api.sendMessage(`❌ | يجب أن تكون مزايدتك أعلى من السعر القائم للمزاد وهو: ${auction.highestBid.toLocaleString()}$`, threadID, messageID);
    }

    const bidderMoney = await Economy.getBalance(senderID, "money");
    if (bidderMoney < bid) {
        return api.sendMessage(`❌ | رصيدك لا يكفي لتقديم هذا العرض المالي. كاشك الحالي: ${bidderMoney.toLocaleString()}$`, threadID, messageID);
    }

    // إرجاع أموال المزايد السابق الفورية لحمايتها من الضياع
    if (auction.bidder) {
        await Economy.increase(auction.highestBid, auction.bidder, "money");
    }

    // حجز مبلغ المزايد الحالي مؤقتاً لحين انتهاء التايمر الرسمي
    await Economy.decrease(bid, senderID, "money");

    auction.highestBid = bid;
    auction.bidder = senderID;

    fs.writeJsonSync(marketPath, market, { spaces: 2 });

    try {
        await api.unsendMessage(event.messageReply.messageID);
    } catch (e) {}

    const bidderName = await Users.getNameUser(senderID);

    const newNotice = await api.sendMessage(`🔨 | مزايدة قياسية جديدة من [ ${bidderName} ] بقيمة: ${bid.toLocaleString()}$ ✨\nقم بالرد هنا للمزايدة أعلى!`, threadID);

    // نقل البيانات للرسالة الجديدة لمتابعة الريبلاي الديناميكي
    handleReply.messageID = newNotice.messageID;
    global.client.handleReply.push(handleReply);
};

// ═══════════════════════════════════════
// 📊 توليد الرسوم البيانية الوهمية للأسهم
// ═══════════════════════════════════════
function generateChart(price) {
    let bars = "";
    const amount = Math.min(12, Math.max(1, Math.floor(price / 4000)));
    for (let i = 0; i < amount; i++) {
        bars += "▇";
    }
    return bars || "▇";
}
