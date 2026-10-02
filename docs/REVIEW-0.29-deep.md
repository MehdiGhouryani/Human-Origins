<div dir="rtl">

# Human Origins 0.29.0 · بازبینی عمیق + چک‌لیست

> **وضعیت پس از اعمال اصلاحات در این شاخه:** گارد صفحه‌های ادمین، sitemap/robots پویا و الزام SITE_URL در production، خروج visual از CI تا ثبت baseline، حذف قفل سراسری ورود، اصلاح تاریخ‌گذاری/ممیزی سازگاری، انتشار اتمیک متن با audit، متن‌های اجباری، hash سشن‌ها و ابطال پس از تغییر رمز، cache درخواست، partial fallback CMS، proxy.ts، URL-driven SSR و history، CSP، اصلاح چرخش EXIF، backup مرحله‌ای و restore غیرمخرب، و لینک‌پذیری نتایج جست‌وجو اعمال شده‌اند. **هنوز باید روی Node 22 با نصب وابستگی‌ها تست شود**؛ baselineهای visual، تست end-to-end CMS، axe در CI، محتوا/تصاویر دارای مجوز برای ۱۸ گونه، بازبینی علمی و deploy واقعی باقی‌اند. این گزارش، بخش‌های زیر را به‌عنوان snapshot یافته‌های اولیه حفظ می‌کند.

## وضعیت اصلاحات

| مورد | وضعیت فعلی |
|---|---|
| B1–B2, B4–B9, B11–B12, B14–B18, B20–B21 | اصلاح کدی/مستندی اعمال شد؛ نیازمند اجرای کامل QA و بررسی deploy |
| B3 | baselineها هنوز ثبت نشده‌اند؛ visual موقتاً از CI اصلی جدا شد |
| B10 | cache درخواست اضافه شد؛ payloadهای کم‌استفاده هنوز حذف نشده‌اند |
| B13 | build تکراری حذف، npm audit فعال و Dependabot اضافه شد؛ axe و تست e2e CMS باقی‌اند |
| B19, B22 | نیازمند منبع/مجوز و تصمیم بازبینی علمی؛ تغییر محتوایی حدسی انجام نشد |
| M1–M8 | محتوای علمی/تصاویر، تصمیم‌ها و گسترش محصول خارج از اصلاحات امنیتی فوری باقی‌اند |

# Human Origins 0.29.0 · گزارش اولیه · بازبینی عمیق + چک‌لیست

> روش: خواندن کد (CMS، auth، API، middleware، bootstrap، layout، media، CI، داده)، **اجرای واقعی** همه‌ی ۱۸ audit داده و ۸۵ تست واحد (با runner جایگزین، چون Next/tsc/vitest در محیط من نصب نبود)، و اسکریپت‌های اختصاصی برای چک سازگاری داده‌ی علمی.
> اجرا نشد: `next build`، `tsc`، ESLint، Playwright. این‌ها را روی سیستم خودتان با `npm ci && npm run qa:release && npm run test:e2e` اجرا کنید.

## نتیجه‌ی اجرا

| چک | نتیجه |
|---|---|
| ۱۸ audit داده/معماری/نسخه/مرز/گراف/provenance/uncertainty/migration/reproducibility | ✅ همه سبز (fingerprint `be39221f…`) |
| تست‌های واحد | ✅ ۸۳ سبز · ۲ تست به‌خاطر محدودیت runner من اجرا نشد (`toThrow(Class)`، `rejects.toBeInstanceOf`)، نه باگ پروژه |
| `validate:assets` | ✅ |
| هزینه‌ی هر درخواست عمومی | ~۱.۷ms audit + ~۴ms bootstrap (فعلاً OK) |
| حجم bootstrap ارسالی به کلاینت | **~۲۲۵KB JSON** |

**جمع‌بندی:** پایه‌ی معماری و مدل داده واقعاً قوی است. ولی ۴ مشکل جدی (یک حفره‌ی امنیتی، یک باگ deploy، CI که احتمالاً قرمز می‌شود، یک DoS روی ورود) و چند ناسازگاری داده‌ی علمی هست که auditها نمی‌گیرند. بزرگ‌ترین ضعف محصول همچنان **محتوا**ست: هر ۱۸ گونه Tier ۰ هستند.

---

## ۱. باگ‌ها و ضعف‌ها (به ترتیب شدت)

### 🔴 جدی

**B1 · احراز هویت ادمین فقط در layout است.**
`app/admin/(dashboard)/layout.tsx` سشن را چک می‌کند، ولی صفحه‌های `page.tsx` (داشبورد، media، copy، revisions) هیچ چکی ندارند و middleware هم فقط *وجود* کوکی را می‌بیند (`cms_session=anything` کافی است). در App Router، layout در ناوبری سمت کلاینت دوباره اجرا نمی‌شود و درخواست RSC می‌تواند فقط segment صفحه را رندر کند → افشای پیش‌نویس‌ها، متادیتای مدیا، متن‌های منتشرنشده و تاریخچه. (APIهای تغییردهنده امن‌اند، چون هر route خودش چک می‌کند.)
**رفع:** یک helper مثل `await requireAdminSession()` (redirect در صورت نامعتبر بودن) در **هر** page ادمین. بهتر: مهاجرت به `proxy.ts` در Next 16 که روی Node اجرا می‌شود و می‌تواند سشن واقعی را از SQLite چک کند.

**B2 · `sitemap.xml` / `robots.txt` موقع build با localhost ساخته می‌شوند.**
`app/sitemap.ts` و `app/robots.ts` استاتیک‌اند، پس در `next build` prerender می‌شوند. راهنمای استقرار در `PHASES.md §5` `SITE_URL` را فقط موقع **اجرا** می‌دهد → sitemap و robots در production به `http://localhost:3000` اشاره می‌کنند. `getSiteUrl()` هم در production بی‌صدا به localhost برمی‌گردد.
**رفع:** `SITE_URL` را در مرحله‌ی build هم الزامی کنید (در production بدون آن build fail شود)، یا `export const dynamic='force-dynamic'` روی sitemap/robots. راهنمای deploy را هم اصلاح کنید.

**B3 · تست visual در CI بدون baseline.**
`tests/e2e/visual.spec.ts` از `toHaveScreenshot` استفاده می‌کند، ولی پوشه‌ی `tests/e2e/__screenshots__` در repo نیست. Playwright وقتی snapshot نباشد آن را می‌نویسد و **تست را fail می‌کند** → `test:e2e` در CI قرمز می‌شود.
**رفع:** یک بار در CI یا داکر لینوکسی `npm run test:visual:update` بزنید و baselineها را commit کنید، یا تا آن موقع visual را از job اصلی جدا کنید.

**B4 · limiter سراسری ورود = قفل‌کردن ادمین (DoS).**
`adminLoginGlobalLimiter` (۵۰ خطا / ۱۵ دقیقه برای کل دنیا) *قبل از* چک رمز اعمال می‌شود. هر کسی با ۵۰ درخواست غلط، ادمین واقعی را حتی با رمز درست ۱۵ دقیقه بیرون نگه می‌دارد و می‌تواند این را مدام تکرار کند. وقتی پشت proxy نباشید، `X-Forwarded-For` کاملاً دست کلاینت است و limiter تک‌کلاینتی هم دور زده می‌شود.
**رفع:** limiter سراسری فقط تأخیر (backoff) بدهد، نه قفل؛ یا دسترسی `/admin` را در سطح هاست محدود کنید (IP allowlist / basic auth روی reverse proxy). `clientKey` فقط وقتی به XFF اعتماد کند که `TRUST_PROXY=1` تنظیم شده باشد.

### 🟠 متوسط

**B5 · ناسازگاری داده‌ی علمی که هیچ auditی نمی‌گیرد.**
- سایت `eurasia`: `ageKa: 400` با برچسب «Late Pleistocene context». Late Pleistocene یعنی ~۱۲۹ تا ۱۲ هزار سال پیش، پس ۴۰۰ka تناقض دارد. به `sapiens` (شروع ۳۰۰ka) لینک شده و `certainty: high` دارد.
- `jebel-irhoud` (۳۱۵±۳۴ka) قدیمی‌تر از شروع بازه‌ی `sapiens` (0.3 Ma) است.
- `sima-los-huesos` (۴۳۰ka) قدیمی‌تر از شروع بازه‌ی `neanderthal` (0.4 Ma) است.

**رفع:** داده اصلاح شود (مثلاً sapiens → 0.315 یا 0.35، neanderthal → 0.43 یا لینک Sima به‌عنوان «تبار اولیه»، و سن/برچسب eurasia). یک **audit جدید** هم لازم است: سن هر سایت باید داخل بازه‌ی گونه‌های مرتبطش باشد (با درنظرگرفتن ±) و برچسب دوره با سن عددی بخواند.

**B6 · یک ردیف خراب، کل CMS را از سایت حذف می‌کند.**
`getLiveContent()` اگر کاتالوگ ادغام‌شده audit را رد کند، **کل** محتوای CMS را کنار می‌گذارد و فقط `console.error` می‌زند. ادمین هیچ نشانه‌ای در داشبورد نمی‌بیند.
**رفع:** ردیف مقصر را جدا کنید (بقیه بمانند) و در داشبورد بنر قرمز «محتوای منتشرشده رد شد» نشان بدهید.

**B7 · انتشار متن (copy) از گیت audit رد نمی‌شود و اتمیک هم نیست.**
`PATCH /api/admin/copy` اول `upsertCopy` و بعد `setCopyStatus` را جدا از هم و بیرون از transaction اجرا می‌کند. `validateCatalog` هم صدا زده نمی‌شود. این خلاف قاعده‌ی «هیچ انتشاری بدون audit» است.
**رفع:** هر دو را داخل `transaction()` ببرید و قبل از publish اعتبارسنجی بزنید.

**B8 · `parseRequiredText` در واقع اجباری نیست.**
این تابع همان `parseText` است و رشته‌ی خالی را قبول می‌کند. در نتیجه `credit` و `note` موقع آپلود می‌توانند خالی باشند (فقط `alt` چک صریح دارد). نام تابع گمراه‌کننده است.
**رفع:** یک `parseRequiredText` واقعی بنویسید که رشته‌ی خالی را رد کند.

**B9 · سشن‌ها.**
توکن‌ها به‌صورت plaintext در SQLite ذخیره می‌شوند، پس هر بک‌آپ شامل سشن‌های زنده است. عمر سشن ثابت ۷ روز است، با تغییر رمز باطل نمی‌شود، و «خروج از همه‌ی دستگاه‌ها» هم وجود ندارد.
**رفع:** فقط `sha256(token)` ذخیره شود، و یک `password_version` در سشن نگه دارید تا با عوض شدن رمز همه‌ی سشن‌ها باطل شوند.

**B10 · payload و کش.**
- حدود ۲۲۵KB JSON برای هر بازدید صفحه‌ی اصلی فرستاده می‌شود. فیلدهای `materialEntities`، `taxonNames` و `occurrences` (~۳۵KB) در هیچ کامپوننتی استفاده نمی‌شوند (selectorهایشان مرده‌اند).
- `/species/[id]` هم در `generateMetadata` و هم در page، bootstrap را جداگانه می‌سازد، بدون `cache()`.
- همه‌ی صفحه‌ها `force-dynamic` هستند. هر درخواست یعنی خواندن SQLite + audit کامل + bootstrap. با بزرگ شدن کاتالوگ، خطی کندتر می‌شود.

**رفع:** حذف فیلدهای استفاده‌نشده از bootstrap، `React.cache()` برای `getLiveContent`/`loadDossier`، و در ادامه ISR + `revalidatePath` موقع publish.

**B11 · `middleware.ts` در Next 16 منسوخ است** و باید `proxy.ts` شود (در REVIEW-0.27 و CHANGES-0.28 هم آمده، هنوز انجام نشده).

**B12 · state در URL.**
SSR همیشه نئاندرتال را رندر می‌کند و بعد از hydration به گونه‌ی داخل URL می‌پرد، پس لینک اشتراکی اول گونه‌ی اشتباه را نشان می‌دهد. چون `replaceState` استفاده شده، دکمه‌ی Back بین گونه‌ها کار نمی‌کند. شناسه‌ی پیش‌فرض `'neanderthal'` هم hardcode است و اگر حذف شود `getExplorerSpeciesById` throw می‌کند و کل explorer از کار می‌افتد.
**رفع:** `searchParams` را سمت سرور بخوانید، برای تغییر گونه `pushState` بزنید، و پیش‌فرض را از اولین گونه‌ی موجود بگیرید.

**B13 · CI.**
- `qa:release` خودش `build` را اجرا می‌کند و بعد CI دوباره `npm run build` می‌زند (build دوبار).
- تست e2e برای CMS (آپلود → انتشار) وجود ندارد، با اینکه معیار پذیرش M1 است.
- axe در CI نیست.
- `.npmrc` مقدار `audit=false` دارد و Dependabot هم تنظیم نشده.

### 🟡 کم

- **B14:** ابعاد ذخیره‌شده برای عکس‌های EXIF-rotated (عکس عمودی موبایل) قبل از چرخش خوانده می‌شود، پس `width/height` جابه‌جا ذخیره می‌شوند.
- **B15:** هدر CSP وجود ندارد. `HSTS includeSubDomains` اگر زیردامنه‌ی بدون HTTPS دارید خطرناک است.
- **B16:** مدیای unpublish‌شده تا مدتی از کش `/_next/image` همچنان قابل دسترسی است.
- **B17:** نتایج جست‌وجوی غیرگونه (specimen، سایت، منبع) نمایش داده می‌شوند ولی کلیک‌پذیر نیستند.
- **B18:** markerهای پشت کره‌ی مهاجرت با کیبورد قابل دسترسی نیستند.
- **B19:** ۱۲ تصویر هنوز hotlink از Wikimedia هستند (وابستگی خارجی، و Referer کاربر به Wikimedia می‌رود).
- **B20:** بک‌آپ اتمیک نیست (DB و media جدا کپی می‌شوند) و اسکریپت restore هم وجود ندارد.
- **B21 · drift مستندات:** `ROADMAP.md` (که خودش را «تنها منبع حقیقت» می‌نامد) هنوز 0.25.3، ۱۴ گونه و ۷۶ تست می‌گوید. `PHASES.md` روی 0.26-dev مانده. واقعیت: ۱۸ گونه و 0.29.0.
- **B22 · بازبینی علمی:** یال `afarensis→boisei` با `context/medium` بعد از حذف *P. aethiopicus* جای سؤال دارد. اجداد Paranthropus به‌طور معمول از aethiopicus/africanus بحث می‌شوند. قبل از Tier ۳ لازم است.

---

## ۲. وضعیت محتوا (اندازه‌گیری‌شده)

| شاخص | مقدار |
|---|---|
| گونه | ۱۸ · **همه Tier ۰** · هیچ‌کدام آواتار درختیِ جدا از پرتره ندارند |
| بدون هیچ claim | ۷: common، sahelanthropus، orrin، habilis، boisei، robustus، heidelbergensis |
| بدون specimen | ۳: common، orrin، heidelbergensis |
| claim / evidence / source | ۱۶ / ۱۴ / ۴۶ |
| specimen / site / publication | ۲۲ / ۲۷ / ۲۱ |
| collections (موزه) | **۰** |
| مجموعه‌های فرضیه‌ی رقیب | ۲ |
| hotlink ویکی‌مدیا | ۱۲ از ۱۸ |

---

## ۳. چک‌لیست: انجام‌شده ✅

**معماری و داده**
- [x] لایه‌بندی domain / content / infrastructure / features / presentation + audit مرزها (server/client)
- [x] کاتالوگ immutable + fingerprint + اسکریپت `bump` نسخه (0.29.0 همه‌جا یکسان)
- [x] IDهای branded، append-only، و IDهای صریح و ثابت روابط + جلوگیری از reuse (`v27-to-v28`)
- [x] مدل پژوهشی: taxon / name / specimen / occurrence / site-context / publication / institution
- [x] زنجیره‌ی claim → evidence → source با نقش؛ عدم‌قطعیت کیفی (بدون نمره)؛ تفسیرهای رقیب
- [x] گراف دانش + `traverse` / `findPath` / provenance trail در UI
- [x] روش تاریخ‌گذاری + `±` واقعی؛ منطق هم‌زمانی (Coexisting)
- [x] ۲ مجموعه فرضیه‌ی رقیب رابطه؛ دنیسووان + ۳ یال gene-flow
- [x] layout درخت **قطعی و خودکار** (x = زمان، lane-packing بر اساس clade، بدون مختصات دستی) + تست
- [x] درخت از ۲۶ به ۱۸ گونه با ۰ رکورد یتیم

**UI**
- [x] درخت، Timeline، کره‌ی مهاجرت، Evidence، Journey، Inspector
- [x] صفحه‌ی `/species` و `/species/[id]` با Tier محاسبه‌شده، JSON-LD، قبلی/بعدی، 404
- [x] پاس موبایل/تبلت 0.29 (overflow، اهداف لمسی، فونت حداقل ۱۱px، منو با focus trap، کره روی موبایل)
- [x] حلقه‌ی focus سراسری، Home/End در تب‌ها، `prefers-reduced-motion`

**CMS و امنیت**
- [x] ورود با رمز، سشن منقضی‌شونده، مقایسه‌ی timing-safe، رد رمز پیش‌فرض در production
- [x] rate-limit ورود، چک Origin برای درخواست‌های تغییردهنده، HSTS، هدرهای امنیتی
- [x] آپلود با sharp (WebP، حذف EXIF، سقف حجم/پیکسل، variantها + آیکون مربعی)
- [x] draft/publish با گیت `validateCatalog`، slotهای `tree-icon` / `portrait` با انحصار، تاریخچه
- [x] سرو امن فایل‌ها (allow-list، جلوگیری از path traversal، پیش‌نویس خصوصی)

**عملیات و کیفیت**
- [x] ۱۸ audit + حدود ۸۵ تست واحد + e2e (smoke، species، responsive، visual)
- [x] GitHub Actions، `build:standalone`، `backup:cms`، `.nvmrc` = 22
- [x] SEO: metadata، OG، canonical، sitemap، robots

---

## ۴. چک‌لیست: باقی‌مانده ⬜

### فوری (قبل از هر deploy) · اندازه S
- [ ] **B1** چک سشن در هر page ادمین (یا `proxy.ts` با چک واقعی)
- [ ] **B2** الزامی کردن `SITE_URL` در build + اصلاح راهنمای deploy
- [ ] **B3** commit کردن baselineهای visual (یا جدا کردن موقت این job)
- [ ] **B4** limiter سراسری بدون قفل‌کردن + `TRUST_PROXY` + محدودیت `/admin` در سطح proxy
- [ ] **B5** اصلاح سن‌ها (eurasia، sapiens/Jebel Irhoud، neanderthal/Sima) + audit «سن سایت ⊂ بازه‌ی گونه»
- [ ] **B7, B8** transaction و audit برای copy، و `parseRequiredText` واقعی
- [ ] اجرای کامل `npm ci && npm run qa:release && npm run test:e2e` روی سیستم خودتان + تست روی iOS Safari و Android
- [ ] به‌روزرسانی `ROADMAP.md` و `PHASES.md` با اعداد واقعی 0.29 (B21)

### کوتاه‌مدت · اندازه S تا M
- [ ] `middleware.ts` → `proxy.ts` (B11)
- [ ] `cache()` و حذف `materialEntities` / `taxonNames` / `occurrences` از bootstrap (B10)
- [ ] fallback جزئی CMS + بنر خطا در داشبورد (B6)
- [ ] hash کردن توکن سشن + باطل‌شدن با تغییر رمز (B9)
- [ ] state URL سمت سرور + `pushState` (B12)
- [ ] CI: حذف build تکراری، axe، Dependabot، `audit=true` (B13)
- [ ] تست e2e برای آپلود → انتشار در CMS
- [ ] CSP، چرخش EXIF، اسکریپت restore (B14, B15, B20)

### M1 · سیستم تصاویر
- [ ] نقش‌های `tools` و `feature` + `caption` / `sortOrder` (با migration note)
- [ ] UI ادمین: انتخاب slot هنگام آپلود، ترتیب‌دهی، کراپ مربعی، پیش‌نمایش هر slot
- [ ] ماتریس کامل‌بودن «گونه × slot» در داشبورد
- [ ] ایمپورت از URL با allow-list (ضد SSRF) → حذف ۱۲ hotlink
- [ ] **آواتار جدا برای نئاندرتال، ساپینس و ارکتوس → اولین گونه‌های Tier ۱** (سریع‌ترین برد)

### M2 · صفحه‌ی گونه (تکمیل)
- [ ] بخش‌های «ابزارها» و «ویژگی‌ها» بر اساس نقش تصویر
- [ ] فیلد «مقاله‌ی گونه» (متن بلند با منبع برای هر ادعا)
- [ ] تصمیم slug یا id برای URL

### M3 · درخت
- [ ] انتخاب فرضیه‌ی رقیب در UI + افزودن فرضیه‌ها به گراف تحقیقاتی
- [ ] جمع/باز کردن clade، LOD در zoom، **نمای لیستی موبایل**
- [ ] تصمیم دامنه (پیش‌هومینین میوسن؟) و احتمالاً برگرداندن گونه‌های کلیدی (مثل *P. aethiopicus* برای منطق Paranthropus)

### M4 · عمق محتوا (بزرگ‌ترین کمبود)
- [ ] claim برای ۷ گونه‌ی بدون claim
- [ ] specimen برای common، orrin و heidelbergensis
- [ ] پر کردن `collections` (موزه‌ها)
- [ ] موج‌های ۳ تا ۵ گونه‌ای تا Tier ۲، با DOIهای تأییدشده

### M5 تا M8
- [ ] نوار عدم‌قطعیت روی timeline، مهاجرت segment-level، hover برای «هم‌زمان‌ها»، کلیک‌پذیر کردن نتایج غیرگونه
- [ ] CMS v2: کاربر و نقش (admin/editor/reviewer)، rate-limit مشترک، بک‌آپ زمان‌بندی‌شده، object storage
- [ ] design system و جدا کردن توکن‌ها از `globals.css` (۹۰KB)، بودجه‌ی عملکرد (LCP، حجم bootstrap)
- [ ] تصمیم زبان: فارسی RTL؟ (الان فقط `lang="en"`)
- [ ] بازبینی علمی (Tier ۳)، content freeze، دامنه و SSL، مانیتورینگ خطا

### تصمیم‌هایی که هنوز از شما لازم است
- [ ] زبان (فارسی؟)
- [ ] نوع هاست (VPS یا serverless)
- [ ] تأمین‌کننده و سبک تصاویر، و قابل‌قبول بودن بازسازی AI
- [ ] دسترسی به بازبین علمی
- [ ] دامنه‌ی درخت
- [ ] slug یا id در URL
- [ ] داده‌ی علمی در کد بماند یا به CMS برود

</div>
