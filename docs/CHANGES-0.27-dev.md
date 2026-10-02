<div dir="rtl">

# تغییرات دور 0.27-dev (فاز ۳ + رفع باگ)

## دسترسی عمومی
- سایت عمومی هیچ ورودی لازم ندارد و رایگان است: `middleware` فقط `/admin` و `/api/admin` را می‌گیرد. ورود فقط برای ادمین است.

## درخت: layout خودکار (پایان مختصات دستی)
- `presentation/treeLayout.ts` بازنویسی شد: بسته‌بندی قطعی lane بر اساس clade و سن، بدون هم‌پوشانی برچسب‌ها، با ارتفاع پویا. پشتیبانی از ۴۰+ گونه. تست: `tests/tree-layout.test.ts`.
- اتصال‌های gene flow حالا سن خودشان را دارند (`eventAgeMa`).

## محتوا: ۱۴ ← ۲۶ گونه (موج ۱ + دنیسووان‌ها)
Ar. kadabba، A. anamensis، Kenyanthropus platyops، A. garhi، P. aethiopicus، A. sediba، H. rudolfensis، H. antecessor، H. naledi، Denisovans (informal)، H. floresiensis، H. luzonensis. هر کدام با منبع اصلی داوری‌شده (DOI) + صفحه‌ی Smithsonian، specimen شاخص، سایت تاریخ‌گذاری‌شده، evidence و claim با عدم‌قطعیت.
- specimenهای شاخصی که نبودند اضافه شدند: Lucy (A.L. 288-1)، Taung 1، Ardi (ARA-VP-6/500)، Turkana Boy (KNM-WT 15000).
- ۳۲ منبع جدید، ۲۳ publication جدید، ۱۵ سایت جدید، ۱۷ specimen، ۱۶ claim، ۲ مجموعه‌ی فرضیه‌ی رقیب (منشأ floresiensis؛ anamensis→afarensis).
- روابط: common→kadabba→ramidus→anamensis→afarensis؛ aethiopicus→boisei؛ gene flow دنیسووان→ساپینس و نئاندرتال↔دنیسووان.
- تصویر گونه‌های جدید: صفحه‌ی schematic صادقانه («تصویر در انتظار، نه عکس فسیل»). تصویر واقعی از CMS جایگزین می‌شود.

## باگ‌ها
- `certainty:'high'` برای همه‌ی گونه‌ها hardcode بود → حالا برای هر گونه جدا تعیین شده.
- وضعیت taxonomy برای ergaster/heidelbergensis/rudolfensis/Kenyanthropus = `debated`.
- مختصات غار Denisova اصلاح شد (87E → 84.68E).
- روابط با منبع خاص خودشان (قبلاً همه به ایندکس کلی Smithsonian).

## migration (شناسه‌های بازنشسته)
`rel-common-ardipithecus-3` → `rel-kadabba-ardipithecus-3` · `rel-ardipithecus-afarensis-4` → `rel-anamensis-afarensis-4` · `rel-afarensis-boisei-6` → `rel-aethiopicus-boisei-6`. fingerprint جدید: `fa6a819490ab2197f5adb8b3dc75eb8a`.

## وضعیت QA در این محیط
سبز: validate:data (۰ خطا، ۰ هشدار)، همه‌ی ۱۸ audit، asset audit. اجرا نشده (اینجا Next/vitest نصب نیست): `npm install && npm run qa:release && npm run test:e2e` روی سیستم خودتان.

## قدم بعدی
نمای لیستی درخت برای موبایل · اسکریپت bump نسخه (0.27.0) · تصاویر واقعی برای ۱۲ گونه‌ی جدید · بازبینی علمی.
</div>
