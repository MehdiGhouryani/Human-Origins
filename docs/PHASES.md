<div dir="rtl">

# Human Origins: فازبندی ادامه‌ی تکمیل

> این سند **برنامه‌ی اجرایی** است: چه چیزی، به چه ترتیبی، با چه معیار پذیرشی.
> «چرا» و تحلیل کمبودها در [`ROADMAP.md`](./ROADMAP.md) است؛ قواعد فنی در [`ARCHITECTURE.md`](./ARCHITECTURE.md).
> وضعیت پایه‌ی واقعی: release `0.29.0` · schema `4.2.0` · ۱۸ گونه. این سند تاریخی است؛ گزارش تازه و وضعیت اصلاحات در [`REVIEW-0.29-deep.md`](./REVIEW-0.29-deep.md) است.

---

## ۰. هدف پروژه در یک جمله

یک **اطلس پژوهشیِ تعاملی از تکامل انسان** که هر جمله‌ی واقعی‌اش به منبع برمی‌گردد (claim → evidence → source)، عدم‌قطعیت را **کیفی** نشان می‌دهد (بدون نمره‌ی جعلی)، فرضیه‌های رقیب را کنار هم می‌گذارد و بازسازی را هرگز جای عکس فسیل جا نمی‌زند.

**بازدیدکننده** باید بتواند: درخت/زمان/مهاجرت را بگردد → روی یک گونه کلیک کند → صفحه‌ی کامل آن گونه را با شواهد، نمونه‌ها، سایت‌ها و منابع ببیند.
**ادمین** باید بتواند: بدون کدنویسی تصویر و متن را مدیریت کند، و هیچ چیزی بدون عبور از audit منتشر نشود.

---

## ۱. بررسی وضعیت (بعد از این دور)

| حوزه | وضعیت | توضیح |
|---|---|---|
| مدل داده / اثبات / عدم‌قطعیت / گراف | ✅ قوی | ۱۸ audit سبز، ۷۶ تست قبلی + ۱۰ تست جدید |
| صفحه‌ی اصلی (درخت، timeline، کره، evidence) | ✅ | |
| **صفحه‌ی اختصاصی گونه `/species/[id]`** | ✅ **جدید** | قبلاً دکمه‌ی Inspector به 404 می‌رفت |
| **فهرست گونه‌ها `/species`** | ✅ **جدید** | گروه‌بندی + نشان کامل‌بودن |
| SEO (metadata، OG، canonical، JSON-LD، sitemap، robots) | ✅ **جدید** | نیازمند `SITE_URL` در production |
| امنیت ادمین | 🟡 → ✅ بهتر | rate-limit، رد رمز پیش‌فرض در production، چک Origin، HSTS |
| استقرار | 🟡 | `build:standalone`، اسکریپت بک‌آپ؛ راهنمای هاست هنوز تست‌نشده روی سرور واقعی |
| CI | ✅ **جدید** | GitHub Actions: `qa:release` + e2e |
| **پوشش محتوا** | 🔴 **بزرگ‌ترین کمبود** | ۱۴ گونه، یک تصویر برای هر گونه، ۱۱ گونه بدون claim |
| layout درخت | 🔴 | مختصات دستی؛ افزودن گونه = کار دستی |
| سیستم slot تصاویر در UI/CMS | 🟡 | مدل آماده، UI ادمین هنوز نه |
| موبایل | 🟡 | صفحه‌ی گونه responsive است؛ درخت روی موبایل هنوز ضعیف |

### باگ/ناهماهنگی‌هایی که در بررسی پیدا و رفع شد
- `.nvmrc` روی Node `20.9.0` بود ولی پروژه Node ≥ 22.5 لازم دارد (`node:sqlite`) → به `22` اصلاح شد.
- لینک «Open the full … page» به صفحه‌ای می‌رفت که وجود نداشت → صفحه ساخته شد.
- `ARCHITECTURE.md` از `shot.mjs` و `infrastructure/media/variants.ts` به‌عنوان بدهی نام می‌برد که دیگر در repo نیستند → سند اصلاح شد.

### محاسبه‌ی کامل‌بودن (امروز)
صفحه‌ی هر گونه Tier را **از داده محاسبه می‌کند** (ROADMAP §8). امروز **همه‌ی ۱۴ گونه Tier ۰** هستند، چون هیچ‌کدام آواتار درختِ جدا از پرتره ندارند (شرط Tier ۱). نئاندرتال/ساپینس/ارکتوس بقیه‌ی شرط‌ها را تقریباً دارند؛ پس **سریع‌ترین برد = تصویر آواتار جدا برای این سه گونه**.

---

## ۲. کارهایی که در این دور انجام شد (۰.۲۶-dev)

| # | کار | فایل‌ها |
|---|---|---|
| 1 | مدل خواندنیِ صفحه‌ی گونه (خالص، قابل تست): تبار، gene flow، هم‌زمان‌ها، سایت‌ها با روش تاریخ‌گذاری، منابع، قبلی/بعدی، **Tier محاسبه‌شده**، JSON-LD | `features/explorer/dossier.ts` |
| 2 | صفحه‌ی `/species/[id]`: پرتره + اعتبار تصویر، نوار زمان، حقایق، جایگاه در درخت، هم‌زمان‌ها، سایت‌ها (لینک به کره)، گالری (اگر تصویر اضافه باشد)، EvidenceGraph، فرضیه‌های رقیب، نمونه‌ها، Source Intelligence، چک‌لیست کامل‌بودن، ناوبری قبلی/بعدی، 404 برای id نامعتبر | `app/species/[id]/page.tsx`، `app/species/layout.tsx`، `app/species/species.css` |
| 3 | صفحه‌ی `/species` (فهرست گروه‌بندی‌شده) | `app/species/page.tsx` |
| 4 | SEO: `metadataBase`، `generateMetadata` با OG از پرتره، `sitemap.xml`، `robots.txt` | `app/layout.tsx`، `app/sitemap.ts`، `app/robots.ts`، `infrastructure/site/url.ts` |
| 5 | امنیت ورود: ۵ تلاش ناموفق / ۱۵ دقیقه → 429؛ رمز پیش‌فرض در production هرگز پذیرفته نمی‌شود (503 با پیام روشن)؛ چک Origin برای همه‌ی درخواست‌های تغییردهنده‌ی `/api/admin`؛ HSTS فقط در production | `infrastructure/cms/rateLimit.ts`، `auth.ts`، `app/api/admin/login/route.ts`، `middleware.ts`، `next.config.ts` |
| 6 | استقرار: `npm run build:standalone`، `npm run backup:cms` (snapshot امن SQLite با `VACUUM INTO` + کپی media) | `next.config.ts`، `scripts/backup-cms.mjs` |
| 7 | CI | `.github/workflows/ci.yml` |
| 8 | تست: ۶ تست dossier + ۴ تست امنیت + ۴ تست e2e صفحه‌ی گونه | `tests/species-dossier.test.ts`، `tests/admin-security.test.ts`، `tests/e2e/species.spec.ts` |

**این بخش تاریخی است:** نسخه‌ی جاری پروژه اکنون `0.29.0` است؛ از گزارش `REVIEW-0.29-deep.md` برای وضعیت فعلی استفاده کنید.

---

## ۳. فازها

اندازه‌ها نسبی‌اند: **S** ≈ یک جلسه · **M** ≈ ۲–۳ جلسه · **L** ≈ ۴+ جلسه. هر فاز فقط وقتی «تمام» است که `npm run qa:release` و `npm run test:e2e` سبز باشند.

### فاز ۱: تثبیت و انتشار ۰.۲۶.۰ (S) ← **قدم بعدی**
- [ ] روی سیستم خودتان: `npm install` → `npm run qa:release` → `npm run test:e2e` (این محیط اینترنت/Next نداشت؛ کد با type-check محدود، رندر سروری واقعی هر ۱۴ صفحه و اجرای همه‌ی تست‌ها بررسی شده، اما `next build` اجرا نشده).
- [ ] اسکریپت `scripts/bump-version.mjs` (امروز ۸ جا دستی است؛ چک‌لیست در ARCHITECTURE §9) و bump به `0.26.0`.
- [ ] push به GitHub تا CI اولین بار اجرا شود.
- [ ] تنظیم `SITE_URL` و `CMS_ADMIN_PASSWORD` روی هاست.
- **پذیرش:** CI سبز؛ `/species/neanderthal` روی production باز می‌شود؛ ورود با رمز پیش‌فرض در production رد می‌شود.

### فاز ۲: سیستم تصاویر و slotها (M) · ROADMAP M1
- [ ] UI ادمین: انتخاب slot هنگام آپلود (`tree-icon` / `portrait` / `species` / `tools` / `features` / `gallery`)، «تعویض آواتار» یک‌کلیکی (تابع `assignMediaSlot()` آماده است).
- [ ] دو نقش جدید `tools` و `feature` + فیلدهای `caption` و `sortOrder` (با migration note و fingerprint جدید).
- [ ] صفحه‌ی گونه بخش‌های «ابزارها» و «ویژگی‌ها» را بر اساس نقش نشان دهد (امروز همه در «Images» می‌آیند).
- [ ] ماتریس کامل‌بودن «گونه × slot» در داشبورد ادمین (از `computeCompleteness` استفاده کند).
- [ ] ایمپورت از URL فقط برای میزبان‌های مجاز (ضد SSRF) برای حذف ۱۲ hotlink ویکی‌مدیا.
- **پذیرش:** حداقل ۳ گونه (نئاندرتال، ساپینس، ارکتوس) به **Tier ۱** برسند؛ سناریوی آپلود → انتشار در e2e.

### فاز ۳: تکمیل درخت و layout خودکار (L) · ROADMAP M3
- [ ] موتور layout قطعی (x = زمان، y = lane بر اساس clade)، بدون هم‌پوشانی برچسب، ≥ ۴۰ گره، جمع/باز کردن clade.
- [ ] موج ۱ گونه‌ها (هر کدام با حداقل یک منبع تأییدشده): A. anamensis، A. sediba، A. garhi، K. platyops، P. aethiopicus، H. rudolfensis، H. antecessor، H. naledi، H. floresiensis، H. luzonensis، Ar. kadabba.
- [ ] دنیسووان‌ها (informal) + یال‌های gene-flow.
- [ ] انتخاب فرضیه‌ی رقیب در UI؛ افزودن فرضیه‌ها به گراف تحقیقاتی.
- [ ] نمای لیستی درخت برای موبایل.
- **پذیرش:** ≥ ۲۵ گونه بدون تداخل؛ افزودن گونه بدون نوشتن مختصات؛ صفحه‌ی گونه برای همه‌ی گونه‌های جدید خودکار ساخته شود (الان هست).

### فاز ۴: عمق محتوا، موج‌موج (L، تکرارشونده) · ROADMAP M4
- [ ] هر موج ۳–۵ گونه تا **Tier ۲**: specimen، سایت با روش تاریخ‌گذاری، ≥ ۳ claim با عدم‌قطعیت، تصاویر species/tools/features.
- [ ] فیلد «مقاله‌ی گونه» (متن بلند، هر ادعا با منبع) و نمایش آن در صفحه‌ی گونه.
- [ ] پر کردن `collections` (موزه‌ها)، افزودن publications با DOI تأییدشده.
- **پذیرش:** چک‌لیست «Record completeness» صفحه‌ی گونه سبز؛ audit بدون warning.

### فاز ۵: تجربه‌ی کاربری (M) · ROADMAP M5 + M7
- [ ] نوار عدم‌قطعیت روی timeline، مهاجرت در سطح segment، hover «هم‌زمان‌ها».
- [ ] design system (توکن‌ها از `globals.css` جدا شوند؛ CSS فعلی فشرده و تک‌خطی است)، موبایل کامل درخت.
- [ ] axe در CI، visual regression، بودجه‌ی عملکرد (LCP، اندازه‌ی bootstrap؛ امروز کل کاتالوگ به کلاینت می‌رود).
- [ ] تصمیم زبان: نسخه‌ی فارسی RTL (اگر بله، قبل از فاز ۴ تا متن‌ها دوباره‌کاری نشوند).

### فاز ۶: CMS v2 (M) · ROADMAP M6
- [ ] حساب کاربری + نقش (admin / editor / reviewer)؛ rate-limit مشترک بین چند instance.
- [ ] بک‌آپ زمان‌بندی‌شده (cron روی `npm run backup:cms`)، آداپتر object storage برای هاست serverless.
- [ ] تصویر برای specimen/site؛ ویرایش «مقاله‌ی گونه» در ادمین.

### فاز ۷: انتشار نهایی (M) · ROADMAP M8
- [ ] بازبینی علمی (Tier ۳ و نشان «بازبینی‌شده»)، content freeze، دامنه و SSL، مانیتورینگ خطا.

**ترتیب پیشنهادی:** فاز ۱ → (فاز ۲ ∥ شروع فاز ۳) → فاز ۴ موج‌موج → فاز ۵/۶ → فاز ۷.

---

## ۴. تصمیم‌هایی که از شما لازم است (بدون این‌ها فازهای ۲ تا ۵ کند می‌شوند)

1. **تصاویر:** چه کسی تأمین می‌کند؟ سبک `tree-icon`؟ بازسازی AI قابل‌قبول است (با برچسب «بازسازی»)؟
2. **هاست:** VPS/کانتینر با دیسک پایدار (پیشنهاد) یا serverless؟
3. **زبان:** نسخه‌ی فارسی لازم است؟
4. **دامنه‌ی درخت:** فقط هومینین‌ها یا میوسن هم؟
5. **بازبین علمی** در دسترس است؟

---

## ۵. راهنمای سریع استقرار (VPS / کانتینر)

```bash
npm ci
SITE_URL=https://your-domain NEXT_OUTPUT=standalone npm run build      # SITE_URL لازم است هنگام build
cp -r public .next/standalone/ && cp -r .next/static .next/standalone/.next/
SITE_URL=https://your-domain CMS_ADMIN_PASSWORD='…' TRUST_PROXY=1 \
CMS_DB_PATH=/data/cms.sqlite CMS_MEDIA_DIR=/data/media \
node .next/standalone/server.js
```
- `/data` باید دیسک **پایدار و قابل‌نوشتن** باشد. بک‌آپ: `CMS_DB_PATH=… CMS_MEDIA_DIR=… npm run backup:cms -- /backups/$(date +%F)`.
- فقط پشت reverse proxy مورداعتماد `TRUST_PROXY=1` بگذارید؛ proxy باید هدرهای `X-Forwarded-For` و `X-Forwarded-Host` را بازنویسی کند.
- rate-limit در حافظه‌ی همان process است؛ اگر چند instance دارید، تا فاز ۶ دسترسی `/admin` را در سطح هاست هم محدود کنید.

---

## ۶. قواعد ثابت (از ROADMAP §12، بدون تغییر)
بدون منبع ادعای واقعی نداریم · نمره‌ی عددی اطمینان نداریم · بازسازی ≠ عکس فسیل · IDها append-only · مختصات فقط در `presentation/` · هیچ انتشاری بدون `qa:release` / `validateCatalog`.

</div>
