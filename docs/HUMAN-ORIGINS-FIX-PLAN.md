# Human Origins: گزارش بررسی فنی کد و برنامه فازبندی‌شده اصلاحات

> نسخه بررسی‌شده: `human-origins@0.32.5` (Next 16 / React 19 / motion 12)
> روش بررسی: بررسی خط‌به‌خط کامپوننت‌های صفحه اصلی، state/URL، گراف، Inspector، Compare، صفحات گونه و CSS؛ به‌علاوه اجرای واقعی `buildExplorerBootstrap` روی `contentCatalog`.
> محدودیت: محیط بررسی به اینترنت دسترسی نداشت؛ نصب پکیج و اجرای مرورگر/Playwright ممکن نبود.

## خلاصه مدیریتی

1. علامت خرابی دکمه‌ها بسیار مشخص است: بیشتر کنترل‌ها `onClick` جاوااسکریپتی هستند، اما Compare که لینک است کار می‌کند. مظنون اصلی این است که صفحه hydrate نمی‌شود و chunkهای JS در محیط dev به علت `allowedDevOrigins` بلاک می‌شوند.
2. حتی بعد از hydrate شدن، state و URL چند باگ قطعی دارند. لینک‌هایی مثل Map range و Return to tree URL را عوض می‌کنند اما UI را sync نمی‌کنند.
3. Tree، Timeline، Migration و Evidence هم در منوی بالا هستند و هم زیر هدر تکرار شده‌اند.
4. پنل نمایه پیش‌فرض بسته است، درحالی‌که هدف باید نمایش Neanderthal در دسکتاپ باشد.
5. نوار گونه‌ها ۱۸ گونه دارد، اما گراف فقط ۱۱ گونه مسیر اصلی را رسم می‌کند؛ بنابراین انتخاب ۷ گونه در نوار هیچ node متناظری در گراف ندارد.
6. Compare مشکلات مقیاس، ادعای علمی بدون منبع، overlap ناقص و responsive دارد.
7. فقط دو صفحه species محتوای علمی کامل دارند: `afarensis` و `sahelanthropus`.
8. CSS بدهی زیادی دارد: ۵۶۰۲ خط، ۷ تعریف برای hero و ۷۲ کلاس بلااستفاده.

## شواهد اجرای داده

```text
species 18: common, sahelanthropus, orrin, ardipithecus, anamensis, afarensis,
africanus, habilis, boisei, robustus, ergaster, erectus, heidelbergensis,
neanderthal, naledi, sapiens, denisovan, floresiensis

graph taxa 11: sahelanthropus, orrin, ardipithecus, anamensis, afarensis,
africanus, habilis, erectus, heidelbergensis, neanderthal, sapiens

default: neanderthal
relationships: 20, dangling relationships: 0
bootstrap JSON: approximately 287KB
species pages with content: afarensis, sahelanthropus
```

نتیجه: داده‌ها سالم‌اند؛ مشکل اصلی در UI، state، navigation و پیکربندی runtime است.

---

## فهرست باگ‌ها

شدت‌ها: **S1** بلاک‌کننده، **S2** عملکرد اصلی، **S3** UX/کیفیت، **S4** بدهی فنی.

### Hydration و زیرساخت

| ID | شدت | وضعیت | محل | شرح |
|---|---:|---|---|---|
| BUG-01 | S1 (dev) | CONFIRMED-DEV | `next.config.ts`, `package.json` | روی `127.0.0.1` و IP شبکه، Next درخواست‌های با Origin غیرمجاز (از جمله WebSocket HMR) را 403 می‌کند و دکمه‌ها hydrate نمی‌شوند. chunk های JS بدون خطا لود می‌شوند. روی `localhost` و production مشکلی نیست. افزودن hostnameها به `allowedDevOrigins` آزموده و رفع شد. |
| BUG-02 | S2 | VERIFY | `app/page.tsx`, `ExplorerShell` | کل bootstrap حدود ۲۸۷KB به props کلاینت فرستاده می‌شود و روی موبایل/شبکه کند hydration را عقب می‌اندازد. **وضعیت:** معماری و اندازه تأیید شد: داده‌ی سریال‌شده‌ی صفحه‌ی اصلی حدود 339KB. |
| BUG-03 | S3 | DESIGN-TRADEOFF | `infrastructure/cms/live.ts` | audit کامل catalog در هر request اجرا می‌شود و عمدی است (جلوگیری از محتوای stale بعد از publish). اندازه‌گیری: TTFB صفحه‌ی اصلی حدود 40 تا 150ms. تغییر لازم نیست مگر بودجه نقض شود. |

تست تشخیصی BUG-01: در DevTools، خطاهای `ChunkLoadError` یا blocked `/_next/static/chunks` را بررسی کنید؛ صفحه را با `localhost:3000` و IP شبکه مقایسه کنید. اگر localhost کار کرد و IP نه، این باگ تأیید شده است.

### State و URL

| ID | شدت | وضعیت | محل | شرح |
|---|---:|---|---|---|
| BUG-10 | S1 | CONFIRMED | `useExplorerController.ts:16` | `useState(initialState)` فقط بار اول خوانده می‌شود. Soft navigation به `/?species=...&mode=...` state کلاینت را تغییر نمی‌دهد. **تأیید مرورگری:** Map range آدرس را عوض می‌کند، تب فعال Tree می‌ماند. **FIXED (فاز ۱):** تأیید با `tests/e2e/url-state.spec.ts` و ماتریس کلیک. |
| BUG-11 | S2 | CONFIRMED | `state.ts`, controller | `writeExplorerUrl` hash را حذف می‌کند؛ `/#about` بعد از حدود ۱۲۰ms به URL دیگری تبدیل می‌شود. **تأیید مرورگری:** `/#about` بعد از بارگذاری هش را از دست می‌دهد. **FIXED (فاز ۱):** تأیید با `tests/e2e/url-state.spec.ts` و ماتریس کلیک. |
| BUG-12 | S2 | CONFIRMED | `SiteHeader.tsx` | Explore و Evolution Tree عملاً یک حالت‌اند و Explore بعد از mount به tree تبدیل می‌شود. **تأیید مرورگری:** روی `/` برچسب فعال هدر «Evolution Tree» است. **FIXED (فاز ۱):** تأیید با `tests/e2e/url-state.spec.ts` و ماتریس کلیک. |
| BUG-13 | S2 | CONFIRMED | `SiteHeader.tsx` | لینک‌های header `<a>` معمولی‌اند و full reload انجام می‌دهند؛ انتخاب گونه و context از بین می‌رود. **تأیید مرورگری:** لینک‌های هدر بارگذاری کامل انجام می‌دهند. **FIXED (فاز ۱):** تأیید با `tests/e2e/url-state.spec.ts` و ماتریس کلیک. |
| BUG-14 | S3 | CONFIRMED | `SiteHeader.tsx` | activeLabel برای Journey تنظیم می‌شود اما Journey در navItems نیست. **وضعیت:** Journey به هدر منتقل می‌شود در فاز ۲؛ در فاز ۱ هنوز باز نشده است. **FIXED (فاز ۲):** Journey در هدر است و برچسب فعال دارد؛ `navigation.spec.ts`. |
| BUG-15 | S3 | CONFIRMED | `SpeciesJourney.tsx` | Back to atlas context به `#about` footer می‌رود، نه یک About واقعی. **FIXED (فاز ۲):** لینک «Back to atlas context» به `/?species=<id>` می‌رود؛ `navigation.spec.ts`. |
| BUG-16 | — | REJECTED | controller | در مرورگر تأیید نشد: Back بعد از تغییر گونه URL و انتخاب را درست برمی‌گرداند. ساده‌سازی listener دستی (فاز ۱) همچنان انجام می‌شود تا منبع حقیقت یکی باشد. **فاز ۱:** listener دستی `popstate` حذف شد و منبع حقیقت URL است؛ Back/Forward در `url-state.spec.ts` تست می‌شود. |

### Navigation و تکرار دکمه‌ها

| ID | شدت | وضعیت | محل | شرح |
|---|---:|---|---|---|
| BUG-20 | S2 | CONFIRMED | `SiteHeader`, `ExplorerShell` | Tree، Timeline، Migration و Evidence در دو ناحیه تکرار شده‌اند. **FIXED (فاز ۲):** هر مقصد یک‌بار نمایش داده می‌شود: هدر Species، Journey، Evidence، About؛ تب‌ها Tree، Timeline، Migration، Compare. |
| BUG-21 | S3 | CONFIRMED | `ExplorerShell` | Compare تنها `<Link>` در کنار buttonهاست و رفتار/styling متفاوت دارد. **FIXED (فاز ۲):** Compare یک تب با همان کلاس و رفتار بقیه‌ی تب‌هاست؛ تا فاز ۵ به صفحه‌ی `/compare` می‌رود. |
| BUG-22 | — | REJECTED | `app/globals.css` (خط ۷۴۴) | ادعای اولیه نادرست است: `.mode-tabs button` قانون `cursor: pointer` دارد. |
| BUG-23 | S3 | CONFIRMED | `app/compare/page.tsx` | Compare header اصلی سایت را ندارد. **FIXED (فاز ۵):** Compare حالت explorer است و هدر سایت را دارد؛ `compare.spec.ts`. |

### گراف و انتخاب گونه

| ID | شدت | وضعیت | محل | شرح |
|---|---:|---|---|---|
| BUG-30 | S2 | REVISED (مصوب) | `TaxonNavigator`, `EvolutionGraph` | نوار ۱۸ گونه را نشان می‌دهد و همه کلیک‌پذیرند؛ گراف ۱۱ گونه می‌ماند. مشکل واقعی فقط برچسب‌گذاری گونه‌های خارج از گراف است (فاز ۴). **FIXED (فاز ۴):** هر ۱۸ chip کار می‌کند و گونه‌ی خودش را انتخاب می‌کند؛ ۷ گونه‌ی خارج از گراف برچسب «Outside graph» دارند؛ گراف ۱۱ گره دارد؛ `species-selection.spec.ts`. |
| BUG-31 | S2 | CONFIRMED | `EvolutionGraph.tsx:163` | اگر species انتخاب‌شده در graph نباشد، هیچ node قابل focus با roving tabindex باقی نمی‌ماند. **FIXED (فاز ۴):** اگر گونه‌ی انتخاب‌شده روی گراف نیست، اولین گره (قدیمی‌ترین) `tabindex=0` دارد؛ کیبورد وارد گراف می‌شود؛ تست در `species-selection.spec.ts`. |
| BUG-32 | S2 | CONFIRMED | `GRAPH_COMPACT_WIDTH=820` | با Inspector باز، عرض graph در لپ‌تاپ‌های رایج زیر ۸۲۰ می‌رود و graph ناخواسته به List تبدیل می‌شود. **FIXED (فاز ۳):** آستانه‌ی گراف ۶۰۰ است؛ اندازه‌گیری مرورگری: در ۱۰۲۴px گراف ۶۱۹px و ۱۱ گره، در ۱۲۸۰px و بالاتر ۸۰۱px به بالا. |
| BUG-33 | S3 | CONDITIONAL | `ExplorerShell`, `FamilyView` | FamilyView در tree-shell و در تب Relationships همان Inspector رندر می‌شود؛ `id="family-title"` فقط وقتی تکراری است که Inspector روی Relationships و حالت tree باشد (تأیید مرورگری). **FIXED (فاز ۳):** تب Relationships از Inspector حذف شد؛ `#family-title` فقط در tree-shell است. |
| BUG-34 | S3 | CONFIRMED | graph caption | View full page لینک معمولی است و با بقیه navigation رفتار یکسان ندارد. |
| BUG-35 | S3 | DESIGN-DEFAULT (مصوب) | Timeline | کلیک روی ردیف Timeline انتخاب را عوض می‌کند و کاربر در Timeline می‌ماند. **FIXED (فاز ۴):** کلیک روی ردیف Timeline گونه را انتخاب می‌کند و کاربر در Timeline می‌ماند؛ تست در `species-selection.spec.ts`. |
| BUG-36 | S4 | CONFIRMED | graph | برای هر node clipPath جدا ساخته می‌شود و می‌تواند بهینه‌تر شود. |

### Inspector و نمایه گونه

| ID | شدت | وضعیت | محل | شرح |
|---|---:|---|---|---|
| BUG-40 | S2 | CONFIRMED | `ExplorerShell.tsx:31` | `inspectorOpen=false` است؛ نمایه پیش‌فرض Neanderthal نمایش داده نمی‌شود. **FIXED (فاز ۳):** در دسکتاپ پروفایل همیشه باز است با Neanderthal؛ `profile.spec.ts`. |
| BUG-41 | S3 | CONFIRMED | `Inspector.tsx` | ۶ تب در ستون ۴۲۰px اسکرول افقی می‌سازد؛ نیاز کاربر ۳ تب است. **FIXED (فاز ۳):** سه تب Overview، Evidence، Lifestyle؛ `profile.spec.ts`. |
| BUG-42 | S3 | CONFIRMED | `Inspector.tsx` | CTA Explore هم بالا و هم پایین تکرار شده است؛ باید یک CTA در پایین بماند. **FIXED (فاز ۳):** یک CTA در پایین پروفایل: «Explore full species profile». |
| BUG-43 | S3 | CONFIRMED | `AnimatePresence` | کل پنل با هر انتخاب exit و دوباره mount می‌شود و باعث پرش و blank شدن موقت می‌شود. **FIXED (فاز ۳):** پروفایل mount می‌ماند و فقط محتوای keyed فید می‌شود؛ تست «no remount» در `profile.spec.ts`. |
| BUG-44 | S3 | CORRECTED | `globals.css`, `atlas.css` | breakpoint ۴۱۵px وجود ندارد؛ `415px` عرض یک ستون grid است. مشکل واقعی: breakpointهای ۴۲۰px (`atlas.css`) و ۳۸۰px (`globals.css`) در دو فایل جدا با ترتیب cascade پراکنده‌اند؛ یک مقیاس واحد لازم است (فاز ۳). **FIXED (فاز ۳):** مقیاس explorer: ۱۲۸۰ / ۱۰۲۴ / ۷۶۸ با بلوک یکتای `.workspace.with-inspector`؛ قواعد قدیمی باقی‌مانده در فاز ۷ حذف می‌شوند. |

### Compare

| ID | شدت | وضعیت | محل | شرح |
|---|---:|---|---|---|
| BUG-50 | S2 | CONFIRMED | `CompareMatrix.tsx` | scale نمودار ۰ تا ۱۶۰۰ است، اما ticks با ۳۰۰، ۱۰۰۰ و ۱۶۰۰ هم‌خوان نیستند؛ ۱۷۵۰cc Neanderthal از bar بیرون می‌زند. **FIXED (فاز ۵):** مقیاس ۳۰۰ تا ۱۸۰۰ cm³ با clamp؛ تیک‌ها بر اساس مقدار جای می‌گیرند؛ تست واحد و `compare.spec.ts`. |
| BUG-51 | S2 | CONFIRMED | `CompareMatrix.tsx` | متن Direct ancient genome sequences recovered برای هر taxon دارای tag Genetics چاپ می‌شود، بدون اینکه رکورد منبع‌دار بررسی شود. **FIXED (فاز ۵):** genetics فقط از رکوردهای منبع‌دار (sourceIds) ذکر می‌شود؛ جمله‌ی ثابت حذف شد. |
| BUG-52 | S3 | CONFIRMED | `CompareMatrix.tsx` | overlap فقط بین دو گونه اول محاسبه می‌شود، حتی اگر سه گونه انتخاب شده باشد. **FIXED (فاز ۵):** overlap برای همه‌ی جفت‌های انتخاب‌شده با بازه‌ی مشترک محاسبه می‌شود؛ تست واحد. |
| BUG-53 | S3 | CORRECTED | `CompareMatrix.tsx` | با انتخاب گونه‌ی چهارم، **اولین** گونه‌ی انتخاب‌شده (نه آخرین) بدون هیچ پیامی حذف می‌شود (تأیید مرورگری). **FIXED (فاز ۵):** در سقف سه، افزودن غیرفعال (`aria-disabled`) و پیام زنده‌ی وضعیت نشان داده می‌شود؛ هیچ گونه‌ای بی‌خبر حذف نمی‌شود؛ `compare.spec.ts`. |
| BUG-54 | S3 | NOT-REPRODUCED (page) | `CompareMatrix.tsx` | در ۳۹۰px اسکرول افقی صفحه صفر است. اسکرول داخلی گرید هنوز بررسی نشده است (فاز ۵). **FIXED (فاز ۵):** جدول در ناحیه‌ی اسکرول افقی (با scroll-snap) است و صفحه در ۳۹۰px اسکرول ندارد؛ دکمه‌ی حذف روی تصویر کارت قرار گرفت؛ `compare.spec.ts`. |
| BUG-55 | S3 | CONFIRMED | `CompareMatrix.tsx` | انتخاب‌ها در URL ذخیره نمی‌شوند و با refresh از بین می‌روند. **FIXED (فاز ۵):** انتخاب مقایسه در URL است: `mode=compare&cmp=a,b,c` و قابل اشتراک؛ `compare.spec.ts`. |

### صفحات species

| ID | شدت | وضعیت | شرح |
|---|---:|---|---|
| BUG-60 | S2 | CONFIRMED | فقط `afarensis` و `sahelanthropus` در `content/species-pages/index.ts` صفحه محتوایی دارند؛ ۱۶ species دیگر incomplete record هستند. |
| BUG-61 | S3 | DROPPED (مصوب) | species pages | شرح مبهم بود و روشن نشد؛ از فهرست حذف شد. |
| BUG-62 | S4 | PARTIAL | `app/species/[id]/page.tsx` | `loadDossier` با `cache()` پیچیده شده، پس metadata و صفحه در یک request یک‌بار می‌سازند. هر request همچنان bootstrap کامل و audit را اجرا می‌کند. |

### CSS و کیفیت فنی

| ID | شدت | وضعیت | شرح |
|---|---:|---|---|
| BUG-70 | S4 | CONFIRMED | `globals.css` حدود ۵۶۰۲ خط، ۳۵ media query و ۱۷ `!important` دارد؛ hero هفت بار تعریف شده است. |
| BUG-71 | S4 | CONFIRMED | حدود ۷۰ کلاس CSS در TSX استفاده نمی‌شوند، از جمله graph-v2، tree-wrap و mobile-species-dock. |
| BUG-72 | — | REJECTED | `.topbar` | ادعای اولیه نادرست است: در مرورگر `position: sticky` و `z-index: 5` است. |
| BUG-73 | S3 | CONFIRMED | prop `release` در Hero استفاده نمی‌شود و بخشی از copy hard-coded است. |
| BUG-74 | S3 | PARTIAL | `components/MigrationGlobe.tsx` | یادداشت «Corridors show Homo sapiens dispersals only» وجود دارد. مشکل باقی‌مانده: مسیرهای sapiens برای سایر گونه‌ها برجسته و قابل کلیک‌اند (فاز ۴). **FIXED (فاز ۴):** corridor ها فقط وقتی H. sapiens انتخاب است رسم می‌شوند؛ تست در `species-selection.spec.ts`. |

---

### یافته‌های تکمیلی (بررسی دوم، ۲۰۲۶-۱۰-۱۰)

| ID | شدت | وضعیت | محل | شرح |
|---|---:|---|---|---|
| BUG-80 | S2 | CONFIRMED | `components/CompareMatrix.tsx` (`overlapStatus`) | متن «Direct chronological overlap documented in fossil records» از بازه‌های start/end محاسبه می‌شود، نه از رکورد منبع؛ با قاعده‌ی «no source → no factual claim» در تضاد است. فقط دو گونه‌ی اول بررسی می‌شوند (BUG-52). (تأیید مرورگری) **FIXED (فاز ۵):** متن overlap فقط درباره‌ی تاریخ‌گذاری است و ادعای تماس یا نسب ندارد؛ `compare.spec.ts`. |
| BUG-81 | S4 | CONFIRMED (latent) | `components/Inspector.tsx` (شاخه‌ی `!m`) | اگر گونه تصویر نداشته باشد، Inspector هیچ لینکی به صفحه‌ی گونه ندارد. **FIXED (فاز ۳):** fallback بدون تصویر CTA دارد. |
| BUG-82 | S3 | CONFIRMED | `tests/e2e/responsive.spec.ts` (خط ۶۲–۶۵) | در ۳۹۰px هفت هدف لمسی زیر ۴۴px است؛ آستانه‌ی تست ۳۶px است. (تأیید مرورگری) **FIXED (فاز ۳):** هدف‌های لمسی ≥ ۴۴px؛ آستانه‌ی `responsive.spec.ts` از ۳۶ به ۴۴. |
| BUG-83 | S3 | CONFIRMED | `components/Hero.tsx` | نقل‌قول «We are not a single line…» بدون منبع و با انتساب به «Human Origins» است. |
| BUG-84 | S3 | CONFIRMED | `components/SpeciesJourney.tsx` | متن پنج فصل برای همه‌ی گونه‌ها یکسان است (جز توضیح فصل اول). |

## معماری هدف

```text
Header: Brand | Species | Evidence | About | Search | EN | Menu
Hero
Explorer mode bar: Tree | Timeline | Migration | Compare
  Stage: graph/timeline/globe/compare
  Profile: portrait, name, 3 tabs, one Explore CTA at bottom
Footer/About
```

Tree، Timeline، Migration و Compare نباید در header تکرار شوند. Journey از mode bar حذف شود و محتوای آن به species page یا بخش Evidence journey منتقل شود. Evidence و About باید مقصد واقعی داشته باشند، نه hash مبهم.

### Breakpoint هدف

| عرض | رفتار |
|---|---|
| 1280 به بالا | graph + profile ۴۲۰px، profile همیشه باز، Neanderthal پیش‌فرض |
| 1024 تا 1279 | graph + profile حدود ۳۶۰px، profile باز |
| 768 تا 1023 | تک‌ستونه، profile به drawer یا sheet |
| زیر ۷۶۸ | bottom sheet یا پنل زیر graph |

آستانه graph map/list از ۸۲۰ به حدود ۶۰۰ کاهش یابد تا با profile کنار هم، graph بی‌دلیل List نشود.

---

## برنامه فازبندی اصلاحات

### فاز ۰: بازتولید و hydration

**هدف:** مطمئن شدن از اینکه JS اجرا می‌شود و همه دکمه‌ها تست می‌شوند.

1. تنظیم `allowedDevOrigins` از متغیر محیطی `ALLOWED_DEV_ORIGINS` (hostname بدون پورت) با پیش‌فرض `localhost` و `*.run.app`؛ IP ثابت در کد نوشته نشود.
2. افزودن error boundary کلاینت اطراف ExplorerShell.
3. ساخت `tests/e2e/click-matrix.spec.ts` برای viewportهای 360، 390، 768، 820، 1024، 1280، 1366 و 1440.
4. تست pageerror، console error، hydration، همه mode buttons، همه ۱۸ species chip (با باز شدن Inspector)، graph nodes (۱۱ گره)، play، scrubber، globe و CTAها. CTA پروفایل هر گونه‌ی غیر-inferred باید به `/species/<id>` با پاسخ ۲۰۰ برود.
5. پاک‌سازی ارجاعات بازنشسته: ROADMAP در `docs/ARCHITECTURE.md`، اشاره به «retired plan» در کامنت‌های species و dossier، و ارجاع‌های D-xx در کد و داده‌های تولیدی (`images:build`).
6. ساخت `package-lock.json` و commit آن (CI با `npm ci` اجرا می‌شود).

**پذیرش:** hydration و click matrix در هر ۸ viewport سبز و بدون page error؛ `npm ci` در کپی تمیز اجرا شود.

### فاز ۱: یکپارچه‌سازی URL و state

> **وضعیت (فاز ۱):** انجام شد. تست‌ها: `tests/e2e/url-state.spec.ts` (Map range، Return to tree، Back/Forward، `/#about`، برچسب هدر، لینک‌های هدر بدون reload) و ماتریس کلیک (با Map range و Return to tree در هر viewport).

1. استفاده از `useSearchParams`/Next router به‌عنوان source of truth.
2. حذف listener دستی popstate.
3. استفاده از `router.replace` برای time/mode و `router.push` برای species.
4. حفظ hash و جلوگیری از overwrite کردن URL در اولین mount.
5. تبدیل header links به Next Link و active state بر اساس pathname و params.

**پذیرش:** Map range، Return to tree، Back/Forward و deep link بدون reload و با UI همگام کار کنند؛ `/#about` حفظ شود.

### فاز ۲: اصلاح navigation

> **وضعیت (فاز ۲):** انجام شد. هدر: Species، Journey، Evidence، About. تب‌ها: Tree، Timeline، Migration، Compare با نقش `tablist` و کیبورد استاندارد. Evidence مقصد `/?mode=evidence` و About مقصد `/about` است. تست‌ها: `navigation.spec.ts` (۷)، `url-state.spec.ts` (۵) و ماتریس کلیک با تب‌ها و هدر. Compare تا فاز ۵ صفحه‌ی `/compare` باقی می‌ماند.

1. header فقط Species، Journey، Evidence و About داشته باشد. (مصوب مالک: Journey به منوی بالا منتقل شد.)
2. mode bar زیر hero فقط Tree، Timeline، Migration و Compare داشته باشد.
3. mode bar با `role=tablist/tab` و keyboard navigation ساخته شود.
4. Journey و Evidence از mode bar حذف شوند؛ Journey از طریق هدر و Evidence از طریق هدر یا `?mode=evidence` باز شود.
5. `/compare` به explorer با `mode=compare` redirect شود، یا shell compare را داخل خود stage رندر کند.
6. `/about` و `/evidence` مقصدهای واقعی باشند.

**پذیرش:** هیچ مقصدی در صفحه دو بار نمایش داده نشود و هر چهار mode قابل کلیک و shareable باشند.

### فاز ۳: پنل profile و responsive layout

> **وضعیت (فاز ۳):** انجام شد. دسکتاپ: پروفایل همیشه باز (۴۲۰px از ۱۲۸۰، ۳۶۰px در ۱۰۲۴–۱۲۷۹)، گراف map. زیر ۱۰۲۴: bottom sheet که با انتخاب گونه باز می‌شود، با دکمه یا Esc بسته می‌شود و فوکوس را برمی‌گرداند. تست‌ها: `profile.spec.ts` (۱۰)، `click-matrix` (۸ viewport)، `responsive.spec` با آستانه‌ی ۴۴px.

1. در دسکتاپ profile همیشه باز با default Neanderthal باشد.
2. پنل با ۳ تب: Overview، Evidence، Lifestyle.
3. Specimens، Genetics و Relationships به species page یا Evidence ادغام شوند.
4. فقط یک CTA در پایین profile: `Explore full species profile`.
5. profile ثابت بماند و فقط محتوای آن crossfade شود.
6. در tablet/mobile از drawer یا bottom sheet با Esc، focus management و close استفاده شود.
7. grid breakpointها صریح و بدون specificity conflict نوشته شوند؛ مقیاس CSS فقط سه مقدار 768، 1024 و 1280 داشته باشد (جدول «Breakpoint هدف» مبنا).
8. هدف‌های لمسی اصلی حداقل 44×44px باشند (منوی باز کردن، mode tabs، play، world، تب‌ها، zoom، CTA). آستانه‌ی `tests/e2e/responsive.spec.ts` از 36 به 44 برود.

**پذیرش:** در 1440، 1366، 1280 و 1024 profile با Neanderthal دیده شود و graph map بماند؛ در 820، 768، 390 و 360 sheet یا drawer قابل استفاده باشد؛ دقیقاً ۳ تب و ۱ CTA وجود داشته باشد؛ همه‌ی هدف‌های لمسی ≥ 44px باشند.

### فاز ۴: هماهنگی species chips و graph

> **وضعیت (فاز ۴):** انجام شد. گراف همان ۱۱ گونه است و تغییری نکرده. هر ۱۸ chip با کلیک گونه‌ی خودش را انتخاب می‌کند (هدر پروفایل به `/species/<id>` می‌رود)، ۷ گونه‌ی خارج از گراف برچسب دارند، گره‌ی قابل فوکوس گراف همیشه یکی است، جست‌وجو و Timeline در همان صفحه انتخاب می‌کنند، و corridor ها فقط برای H. sapiens هستند. تست‌ها: `species-selection.spec.ts` (۷).

1. نوار گونه‌ها همه‌ی ۱۸ گونه را نشان می‌دهد و همه کلیک‌پذیرند. گراف همان ۱۱ گونه‌ی `mainPathTaxonIds` (`bootstrap.graph.taxonIds`) می‌ماند و در این فازها تغییری در گراف داده نمی‌شود. (مصوب مالک)
2. گونه‌های خارج از گراف با نشانه‌ی «خارج از گراف» مشخص شوند. انتخاب هر یک Inspector و پروفایل را باز می‌کند و دکمه‌های پروفایل (Explore، Map range، Return to tree) باید با کلیک کار کنند.
3. roving tabindex وقتی selected در graph نیست به اولین node معتبر fallback کند.
4. یک handler واحد انتخاب species برای chip، node، timeline، FamilyView و search ساخته شود.
5. کلیک Timeline فقط selection را عوض کند و کاربر را ناخواسته از Timeline بیرون نبرد.

**پذیرش:** هر chip، node متناظر و profile درست را انتخاب کند؛ هیچ selected state بی‌اثر نماند.

### فاز ۵: بازسازی Compare

> **وضعیت (فاز ۵):** انجام شد. Compare یک mode از explorer است (`mode=compare&cmp=…`) و هدر سایت را دارد؛ `/compare` به آن redirect می‌شود. مقیاس مغز ۳۰۰ تا ۱۸۰۰ با clamp؛ genetics فقط از رکوردهای منبع‌دار؛ overlap برای همه‌ی جفت‌ها بدون ادعای تماس؛ سقف سه گونه با پیام و بدون حذف خودکار؛ جدول در ناحیه‌ی اسکرول با scroll-snap. تست‌ها: `compare.spec.ts` (۶)، `compare-matrix.test.ts` (۵)، `url-state.test.ts` (۱۳).

1. Compare به mode داخل explorer منتقل شود یا با shell واحد باز شود.
2. query قابل share: `mode=compare&cmp=sapiens,neanderthal,erectus`.
3. scale مغز از ۳۰۰ تا ۱۸۰۰ و با clamp محاسبه شود تا ۱۷۵۰ داخل bar بماند.
4. حذف ادعاهای بدون sourceId؛ نمایش genetics فقط از recordهای واقعی و منبع‌دار.
5. overlap برای تمام جفت‌های انتخاب‌شده محاسبه شود.
6. limit سه species با feedback و aria-disabled مشخص شود.
7. موبایل به کارت‌های عمودی/scroll-snap تبدیل شود.

**پذیرش:** scale درست، URL قابل اشتراک، بدون ادعای unsourced و بدون overflow در 390px.

### فاز ۶: species pages

اولویت محتوا: Neanderthal، Sapiens، Erectus، Heidelbergensis، Habilis، Africanus، Anamensis، Ardipithecus و Orrin. هر ادعا باید reference داشته باشد و audit species pages سبز بماند. Journey به بخش Evidence journey صفحه species منتقل شود.

**پذیرش:** حداقل Neanderthal و Sapiens صفحه کامل داشته باشند؛ در نهایت ۱۱ گونه main path تکمیل شوند.

### فاز ۷: CSS، accessibility و performance

1. حذف ۷۲ کلاس مرده و اضافه کردن dead-CSS audit به QA.
2. تقسیم globals.css به token/layout/header/hero/explorer/profile/compare.
3. یک تعریف پایه برای هر selector و media query کنار همان component.
4. `<defs>` مشترک برای graph clipPaths.
5. کاهش aria-live برای جلوگیری از اعلام هر tick زمان.
6. lazy-load کردن source/publication data برای Evidence و payload core کمتر از ۸۰KB.
7. Map range فقط برای taxonهایی که site/range واقعی دارند.

**پذیرش:** CSS زیر ۲۵۰۰ خط، dead class صفر، Lighthouse accessibility حداقل ۹۵، TBT موبایل زیر ۲۰۰ms و HTML gzip زیر ۱۵۰KB.

### فاز ۸: QA انتشار

- `npm run qa:release`
- `npm run test:e2e`
- تست Safari iOS، Firefox، keyboard-only، drag/pinch graph و zoom
- بازبینی visual بعد از تأیید layout جدید
- ثبت changelog و bump نسخه به 0.33.0

**پذیرش:** (پیشنهاد مصوب) `npm run qa:release` با exit 0؛ `npm run test:e2e` سبز در همه‌ی viewportهای فاز ۰؛ changelog ثبت و نسخه به 0.33.0 bump شده باشد.

---

## ترتیب اجرا و تخمین

| فاز | تخمین | خروجی |
|---|---:|---|
| ۰ | ۰.۵ تا ۱ روز | دکمه‌ها واقعاً اجرا می‌شوند و test matrix داریم |
| ۱ | ۱.۵ تا ۲ روز | URL، لینک‌ها و Back/Forward درست |
| ۲ | ۱ روز | navigation بدون تکرار |
| ۳ | ۲ تا ۳ روز | graph + profile کنار هم |
| ۴ | ۱ روز | همه انتخاب‌های species هماهنگ |
| ۵ | ۱.۵ تا ۲ روز | Compare دقیق و responsive |
| ۶ | برای هر species حدود ۱ تا ۲ روز محتوا | صفحات اختصاصی کامل |
| ۷ | ۲ روز | CSS و performance تمیز |
| ۸ | ۱ روز | release gate |

فازهای ۵ و ۶ پس از فاز ۲ می‌توانند موازی اجرا شوند، اما فاز ۰ تا ۴ باید به ترتیب انجام شوند.

---

## تغییرات مصوب مالک

- **۲۰۲۶-۱۰-۱۰ (فاز ۰، بند ۰.۱):** Journey به منوی بالا منتقل شد (فاز ۲). مقیاس ریسپانسیو همین جدول است و هدف‌های لمسی ≥ 44px شدند (فاز ۳). گراف ثابت به ۱۱ گونه؛ همه‌ی ۱۸ گونه در نوار کلیک‌پذیرند (فاز ۴). پذیرش فاز ۸ اضافه شد. BUG-80 تا BUG-84 افزوده شدند. وضعیت BUG-01، 03، 16، 22، 30، 33، 35، 44، 53، 54، 61، 62، 71، 72 و 74 بر اساس آزمایش‌های مرورگری اصلاح شد. ارجاع‌های بازنشسته و lockfile و متغیر `ALLOWED_DEV_ORIGINS` به فاز ۰ افزوده شدند.
- **۲۰۲۶-۱۰-۱۰ (فاز ۰، ادامه):** پیش‌فرض dev شامل `127.0.0.1` شد، چون Playwright از آن استفاده می‌کند؛ مالک با ادامه‌ی کار این را پذیرفت. baseURL تست‌های e2e به `localhost` رفت، چون کوکی ادمین در production `Secure` است و مرورگر روی `127.0.0.1` آن را نگه نمی‌دارد. تست `admin-slots` شرط ورود را به مسیر دقیق `/admin` تغییر داد، چون الگوی قبلی `/admin/login` را هم پذیرفته و تست را زودتر از ساخته‌شدن کوکی ادامه می‌داد. تست `species index` انتظار ۲۶ را به ۱۸ تاکسون کاتالوگ اصلاح کرد. ماتریس کلیک `tests/e2e/click-matrix.spec.ts` اضافه شد و روی ۸ viewport پاس شد.
- **۲۰۲۶-۱۰-۱۰ (فاز ۱):** URL منبع حقیقت شد: state از `useSearchParams` همگام می‌شود، تغییرات صفحه با History API نوشته می‌شوند و hash حفظ می‌شود، و listener دستی `popstate` حذف شد. تغییر گونه بلافاصله یک history entry می‌سازد. هدر با `next/link` کار می‌کند، برچسب فعال از route و URL محاسبه می‌شود، و «Evolution Tree» (همان Explore) حذف شد. BUG-10، 11، 12 و 13 بسته شدند.
- **۲۰۲۶-۱۰-۱۰ (فاز ۲):** هدر به Species، Journey، Evidence و About تغییر کرد؛ Journey و Evidence از mode bar حذف شدند؛ mode bar یک `tablist` با کیبورد استاندارد شد؛ Compare به صفحه‌ی `/compare` می‌رود؛ `/about` صفحه‌ی واقعی شد؛ لینک «Back to atlas context» به گونه می‌رود. BUG-14، 15، 20 و 21 بسته شدند.
- **۲۰۲۶-۱۰-۱۰ (فاز ۳):** پروفایل روی دسکتاپ همیشه باز و روی باریک bottom sheet است؛ سه تب و یک CTA؛ ژنتیک در Evidence و تب Relationships/Specimens حذف شد؛ محتوای پروفایل crossfade بدون remount؛ آستانه‌ی گراف ۶۰۰؛ هدف‌های لمسی ۴۴px. BUG-32، 33، 40–44، 81 و 82 بسته شدند.
- **۲۰۲۶-۱۰-۱۰ (فاز ۴):** نوار گونه‌ها هر ۱۸ گونه را نشان می‌دهد و ۷ گونه‌ی خارج از گراف برچسب دارند؛ گراف ۱۱ گونه می‌ماند. انتخاب از نتیجه‌ی جست‌وجو و از Timeline در همان صفحه انجام می‌شود (بدون ترک Timeline). گره‌ی قابل فوکوس گراف همیشه یکی است. corridor ها فقط برای H. sapiens رسم می‌شوند. BUG-30، 31، 35 و 74 بسته شدند.
- **۲۰۲۶-۱۰-۱۰ (فاز ۵):** Compare به mode explorer تبدیل شد و انتخاب آن در URL است (`cmp`). `/compare` به آن redirect می‌شود. مقیاس مغز clamp شد، genetics فقط از رکوردهای منبع‌دار نمایش داده می‌شود، overlap همه‌ی جفت‌ها را پوشش می‌دهد و بدون ادعای تماس است، سقف سه گونه با پیام کار می‌کند، و جدول در موبایل در ناحیه‌ی اسکرول قرار دارد. دکمه‌ی حذف کارت که زیر تصویر قرار داشت و با کلیک واقعی پیدا شد اصلاح شد. BUG-23، 50–55 و 80 بسته شدند.
- **۲۰۲۶-۱۰-۱۰ (فاز ۵، ادامه):** تست ماتریس کلیک در ۱۴۴۰px یک race واقعی را نشان داد: نوشتن معوق URL (پس از کلیک روی تب) ناوبری لینک Journey را که بلافاصله بعد از آن زده می‌شد خنثی می‌کرد. دو اصلاح: نوشتن URL هر ناوبری بیرونی را که بعد از آخرین نوشتن رخ داده بپذیرد، و نوشتن معوق قبل از هر کلیک روی لینک انجام شود. تست رگرسیون در `url-state.spec.ts` اضافه شد.

