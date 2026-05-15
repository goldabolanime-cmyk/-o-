# Facebook Messenger Bot

## Project Overview
بوت فيسبوك ماسنجر مبني على بنية GoatBot v2 بإصدار 20.

## Owner / المالك
- **Owner ID**: `100090081489341`
- يتم تعريفه في `config.json` تحت مفتاح `ownerBot` و `adminBot`

## Project Structure / بنية المشروع
```
├── config.json                          ← إعدادات البوت (الأوانر، البريفكس...)
├── index.js                             ← نقطة تشغيل البوت
├── modules/
│   ├── commands/                        ← أوامر البوت
│   │   └── رانك.js                     ← أمر الرانك الاحترافي
│   └── events/                         ← أحداث البوت
├── database/
│   ├── controllers/
│   │   └── beatrix.controllers.js      ← تحكم بقاعدة بيانات البيتريكس
│   ├── data/
│   │   └── beatrix.json                ← بيانات البيتريكس
│   ├── users.json                      ← بيانات المستخدمين
│   └── rank_bans.json                  ← قائمة حظر الرانك
└── cache/                              ← ملفات مؤقتة (صور الرانك)
```

## User Preferences
- اللغة العربية في الأوامر
- إصدار البوت: v20
- الأوانر: 100090081489341
