# البحث عن نماذج سيارات قابلة لإعادة الاستخدام

تمت مراجعة المصادر التالية أثناء اختيار أصول مرخّصة للعبة. المرشحات من Sketchfab أدناه لم تُدمج؛ أُضيف نموذج Khronos CarConcept الموثق لاحقاً في قسم القرار أدناه.

| الأصل | المؤلف/المصدر | الترخيص المعلن | معلومات تقنية | التقييم |
| --- | --- | --- | --- | --- |
| [Luxury Sports Car 3D Model](https://sketchfab.com/3d-models/luxury-sports-car-3d-model-vehicle-b0f76bdd84e243a882d44858d5d43832) | PolyNeast، Sketchfab | Creative Commons Attribution (CC BY 4.0)؛ صفحة API تقول إن النموذج قابل للتنزيل، ويجب ذكر المؤلف | 3,881,546 مثلثاً و1,961,940 رأساً | تفاصيل عالية جداً، لكنه ثقيل وغير مناسب للإدراج في Android كما هو؛ يحتاج تبسيطاً/ضغطاً واختباراً، كما ينبغي التحقق من حقوق أي شعارات أو تصميم مركبة معروف مستقلة عن ترخيص الملف. |
| [Sports Car](https://sketchfab.com/3d-models/sports-car-346a369be7b740dbb350386f99ab75e9) | Cybertron B-127، Sketchfab | CC Attribution حسب صفحة النموذج | 620,600 مثلث و378,100 رأس | قابل للتنزيل وفق وصف الصفحة، لكنه ما زال ثقيلاً على هاتف منخفض المواصفات ويحتاج تخفيضاً كبيراً للمضلعات. |
| [Khronos Toy Car](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/ToyCar) | Guido Odendahl (النموذج الأصلي)، وEric Chadwick (الإضافات والتركيب) | CC0 1.0 Universal حسب README الرسمي | GLB عيّنة تركز على transmission وclearcoat وsheen في glTF | مصدر مرخّص جيد للاختبار والخامات، لكنه نموذج لعبة وليس سيارة واقعية، لذلك لا يفي وحده بطلب سيارات فائقة الواقعية. |

## الترخيص

تسمح رخصة [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/) بالمشاركة والتعديل، بما في ذلك الاستخدام التجاري، بشرط نسب الفضل للمؤلف ووضع رابط الترخيص والإشارة إلى التعديلات، ومن دون الإيحاء بتأييد المؤلف للمشروع. وقد تبقى حقوق أخرى (مثل العلامات التجارية وتصميم المركبة) ذات صلة رغم ترخيص ملف النموذج.

**قرار التنفيذ:** لم يُدرج أي من نموذجي Sketchfab شديدي الكثافة؛ تم إدراج نموذج Khronos CarConcept في `public/models/car-concept/` بعد التحقق من ملف glTF ورخصة CC BY 4.0. أُخفيت شارة المقود الخاصة بالأصل، وأُضيفت تفاصيل المصدر والترخيص إلى README. يشغل النموذج مساحة أصلية تقارب 8.6 MB ويُعبّأ ضمن APK Release حجمه نحو 11.64 MiB؛ ما يزال اختبار الأداء البصري على هواتف Android فعلية مطلوباً.


## خيار سيارة واقعية وتقنية الشبكة المحلية

- **[Khronos glTF CarConcept](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/CarConcept)**: النموذج التجريبي الرسمي يصف سيارة concept عالية الجودة، يدعم أشكال طلاء وخامات glTF حديثة، ويذكر أن نسخة glTF-KTX-BasisU-Draco حجمها 10.3 MB وذاكرة GPU نحو 14.9 MB، ونسخة WEBP نحو 9.8 MB وذاكرة GPU نحو 48.8 MB. ملف GLB أحادي من المجلد الرسمي حجمه 10,267,996 بايت بحسب GitHub API. ملف README ينسب النموذج والخامات إلى Eric Chadwick ويذكر CC BY 4.0 من Darmstadt Graphics Group GmbH؛ كما يحدد شعاري Khronos و3D Commerce منفصلين عن رخصة النموذج، لذا يجب إزالة/إخفاء أي علامة لا يراد استخدامها وعدم الإيحاء بتأييد الجهة. نسخة glTF/WEBP المستخدمة مضمّنة في هذا المشروع وتُطبّق عليها ألوان الطلاء.
- رابط README الرسمي: https://github.com/KhronosGroup/glTF-Sample-Assets/blob/main/Models/CarConcept/README.md
- Sketchfab API أكد أن بعض نماذج السيارات CC BY 4.0 وقابلة للتنزيل، لكن نقطة تنزيل ملفات Sketchfab أعادت HTTP 401 في بيئة العمل؛ لذلك لم تُستخدم تلك النماذج ولم تُتجاوز مصادقة صاحب الحساب.
- **الشبكة المحلية وAndroid**: دليل Android الرسمي https://developer.android.com/privacy-and-security/local-network-permission (محدّث 2026-07-13) يقرر أن `ACCESS_LOCAL_NETWORK` يصبح إلزامياً للتطبيقات المستهدفة Android 17 / SDK 37+؛ تطبيق targetSdk 36 الحالي لا يطلبه الآن. الدليل يوضح أن Android 16 يتيح اختبار الحماية الاختيارية، وأن بث UDP واستقبال TCP/UDP تدخل ضمن الوصول المحلي. عند رفع targetSdk إلى 37 يجب إضافة طلب runtime مناسب أو استخدام NSD service picker عند ملاءمته.

تم فحص نسخة النموذج المضمّنة وحجم APK والتوقيع؛ لا يزال الاختبار على أجهزة Android فعلية لتقييم التفاصيل ومعدل الإطارات والذاكرة مطلوباً. لم تُستخدم نماذج Sketchfab في التطبيق.
