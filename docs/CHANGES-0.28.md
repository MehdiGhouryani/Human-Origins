<div dir="rtl">

# تغییرات 0.28.0

- **درخت از ۲۶ به ۱۸ گونه کم شد.** حذف‌شده‌ها: kadabba، platyops، garhi، aethiopicus، sediba، rudolfensis، antecessor، luzonensis. همه‌ی specimen/evidence/claim/site/source/publication/media اختصاصی‌شان هم پاک شد (۰ رکورد یتیم، validate:data سبز).
- **ساختار درخت:** common→ardipithecus و afarensis→boisei با شناسه‌ی جدید (`-29`، `-30`). هر گونه دقیقاً یک والد تبار دارد (تست جدید).
- **باگ شناسه‌های موقعیتی رفع شد:** IDهای روابط حالا صریح و ثابت‌اند؛ IDهای بازنشسته در `migrations/v27-to-v28.ts` و تست `relationship-ids` جلوی reuse را می‌گیرد.
- **باگ CSS:** قانون `.tree-wrap svg` آیکون‌های دکمه‌های زوم را ~۸۸۰px بزرگ می‌کرد و روی درخت می‌افتاد (دسکتاپ و موبایل). رفع شد. برچسب‌های درخت halo گرفتند تا روی خطوط خوانا باشند.
- نسخه همه‌جا 0.28.0؛ manifest و fingerprint بازتولید شد.

## باقی‌مانده (اولویت بعدی)
1. layout توپولوژیک درخت (هر زیرشاخه کنار والدش، بدون تقاطع خط) به‌جای نوارهای clade.
2. نمای لیستی درخت برای موبایل.
3. `cache()` در `/species/[id]`، `middleware.ts`→`proxy.ts`، کاهش payload کلاینت.
4. اجرای `npm install && npm run qa:release && npm run test:e2e` روی سیستم خودتان (Next اینجا نصب نبود).
</div>
