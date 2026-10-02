<div dir="rtl">

# بازبینی 0.27-dev: باگ‌ها، موبایل، بهینه‌سازی

## اعمال‌شده در این نسخه
| # | مشکل | شدت | رفع |
|---|---|---|---|
| 1 | درخت با ۲۶ گونه (viewBox 1120×1276) داخل کادر ۴۶۸px فشرده می‌شد → **برچسب‌ها ~۴px روی دسکتاپ و موبایل** | 🔴 | درخت در مقیاس خوانا (≈۱۰.۷px) رندر و داخل پنل اسکرول می‌شود (`globals.css`، لایه‌ی 0.27) |
| 2 | تب‌های Tree/Timeline/…/Evidence روی موبایل از صفحه بیرون می‌زدند (اسکرول افقی کل صفحه) | 🔴 | تب‌ها اسکرول افقی دارند، `overflow-x` صفحه بسته شد |
| 3 | چرخ موس روی درخت و کره، اسکرول صفحه را قفل می‌کرد | 🟠 | زوم فقط با Ctrl/⌘ + چرخ یا pinch (`EvolutionTree.tsx`، `MigrationGlobe.tsx`) |
| 4 | کشیدن کره روی موبایل اسکرول صفحه را می‌گرفت/لغو می‌شد | 🟠 | `touch-action: pan-y` |
| 5 | فونت ورودی‌ها < 16px → **زوم خودکار iOS هنگام ورود رمز ادمین و جستجو** | 🟠 | 16px روی موبایل |
| 6 | ۱۲۳ قاعده‌ی فونت ۷–۹px (ناخوانا) | 🟠 | کف 10px |
| 7 | تب‌های Inspector و دکمه‌ها ۲۱–۳۱px (هدف لمسی کوچک) | 🟡 | حداقل 36px روی موبایل؛ timebar و legend روی موبایل wrap/scroll |
| 8 | ترتیب گونه‌ها = ترتیب اضافه‌شدن، نه سن (kadabba بعد از ramidus؛ «oldest first» در /species غلط بود؛ قبلی/بعدی هم) | 🟠 | مرتب‌سازی بر اساس سن در bootstrap |
| 9 | متن تکراری «Possible / debated · debated» در صفحه‌ی گونه | 🟡 | فقط وقتی اطلاعات اضافه دارد؛ high → well supported |
| 10 | «1 linked records» | 🟡 | جمع/مفرد |
| 11 | لاگین ادمین: خطای شبکه هیچ پیامی نشان نمی‌داد؛ autocomplete نداشت | 🟡 | پیام خطا + `autoComplete="current-password"` |
| 12 | تست `bootstrap-contract` قدیمی بود (19 به‌جای 34) و fail می‌شد | 🟡 | به تعداد سایت‌ها وابسته شد |

وضعیت: **۱۰۹ تست واحد سبز**، همه‌ی auditهای داده سبز. `next build` و e2e اینجا اجرا نشد (Next نصب نیست) → `npm install && npm run qa:release && npm run test:e2e`.

## انجام‌نشده (قدم بعدی، به ترتیب اولویت)
1. **حذف گونه‌های کم‌اهمیت** (۲۶ → ۲۰): پیشنهاد حذف `kadabba, platyops, garhi, rudolfensis, antecessor, luzonensis` به‌همراه specimen/site/evidence/claim/source/media اختصاصی‌شان، و یال جدید common→ardipithecus با شناسه‌ی جدید (شناسه‌ی بازنشسته reuse نشود). ergaster به‌خاطر Turkana Boy و فرضیه‌ی رقیب می‌ماند.
2. **باگ پنهان شناسه‌ها:** `rel-…-${index+1}` موقعیتی است؛ حذف/درج هر یال، ID بقیه و ارجاع‌های `relationship-hypotheses.ts` (مثل `rel-erectus-floresiensis-24`) را می‌شکند. قبل از (۱) باید IDها صریح و ثابت شوند.
3. نمای لیستی درخت برای موبایل (الان diagram با اسکرول افقی است).
4. payload کلاینت ~۳۰۵KB: `materialEntities`، `taxonNames`، `occurrences` در UI استفاده نمی‌شوند (~۵۰KB).
5. `/species/[id]` در generateMetadata و page دوبار bootstrap می‌سازد → `cache()` از React.
6. Next 16: `middleware.ts` منسوخ و `proxy.ts` جایگزین است.
7. ناهماهنگی نسخه: پوشه v26، zip v27-dev، package 0.25.3.
</div>
