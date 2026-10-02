<div dir="rtl">

# تغییرات دور 0.26.1 (بازبینی عمیق + رفع باگ + تکمیل فاز ۲)

## امنیت و یکپارچگی CMS
- **باگ جدی:** آپلود/ویرایش یک پیش‌نویس با نقش پرتره/آواتار، تصویر *منتشرشده‌ی فعلی* را از سایت برمی‌داشت. حالا انحصار slot فقط هنگام انتشار اعمال می‌شود (`enforceSlotExclusivity`).
- همه‌ی نوشتن‌ها (ردیف + revision + slot + status) داخل تراکنش SQLite (`transaction()` در `db.ts`).
- اعتبارسنجی runtime همه‌ی enumها و فیلدها (`infrastructure/cms/mediaInput.ts`): kind، roles، publicationStatus، rightsStatus، status، slot، URL منبع (فقط http/s)، taxon و source معتبر.
- دور زدن rate-limit با جعل `X-Forwarded-For` بسته شد (راست‌ترین IP عمومی) + سقف سراسری ۵۰ تلاش/۱۵ دقیقه.
- مقایسه‌ی رمز بدون نشت طول (SHA-256 + timingSafeEqual).
- رد درخواست آپلود بزرگ‌تر از ۲۰MB قبل از بافر کردن (413)؛ پاک‌سازی فایل‌های یتیم در صورت خطا.
- API کپی: نوع value/status بررسی می‌شود (قبلاً خطای 500).
- `X-Content-Type-Options: nosniff` روی `/cms-media`.

## فاز ۲ (تکمیل)
- دکمه‌های یک‌کلیکی «Use as tree avatar» / «Use as portrait» در Media Manager (PATCH با `slot`).
- بخش «Live image slots» + نشان Portrait / Tree avatar روی کارت‌ها.
- **ماتریس کامل‌بودن گونه × چک** و ستون Tier در داشبورد ادمین (از کاتالوگ زنده).
- مدیریت خطای شبکه در ادمین؛ آزادسازی Object URL پیش‌نمایش.

## UI
- حالت Journey عملاً پنهان بود (زیر نمای دیگر و clip می‌شد) → حالا نمای انحصاری است.
- کره‌ی مهاجرت: مسیرها و نشانگرهای پشت کره دیگر از میان زمین رسم نمی‌شوند؛ zoom با چرخ ماوس دیگر صفحه را اسکرول نمی‌کند (listener غیر passive).
- پخش زمان از ۱۰۰ بیرون نمی‌زد (`time=100.2` در URL).
- استایل صفحات خطا/404/loading (کلاس‌ها تعریف نشده بودند).
- صفحه‌ی گونه: URL خراب ← 404 به‌جای 500. گالری نمونه: لینک خالی منبع حذف شد.
- Completeness: «claim با منبع» واقعاً منبع را چک می‌کند.

## داده
- مختصات Singa اصلاح شد (13.15N, 33.93E؛ قبلاً ~۲۶۵km شمالی‌تر).
- Dmanisi: ageKa با برچسب ~1.77 Ma هم‌خوان شد. fingerprint مانیفست به‌روز شد.
- `findPath` برای گره‌های ناموجود `undefined` برمی‌گرداند.

## تست
- `tests/cms-slots.test.ts` (۶ تست جدید) + تست جعل X-Forwarded-For. مجموع: ۹۷ تست سبز، ۱۸ audit سبز، type-check کامل بدون خطا.

## باقی‌مانده (پیشنهاد)
- `certainty:'high'` برای همه‌ی گونه‌ها hardcode است (`content/taxa.ts`)؛ باید به‌ازای هر گونه با منبع تعیین شود.
- Next 16 نام `middleware.ts` را به `proxy.ts` تغییر داده (هنوز کار می‌کند ولی deprecated).
- نمونه‌های شاخص غایب: Lucy (AL 288-1)، Taung 1، Turkana Boy، Ardi.
- اجرای `npm install && npm run qa:release && npm run test:e2e` روی سیستم خودتان (این محیط اینترنت و Next نداشت) و bump به 0.26.1.

</div>
