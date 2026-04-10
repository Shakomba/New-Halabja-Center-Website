const fs = require('fs');

const data = JSON.parse(fs.readFileSync('assets/data/activities.json', 'utf8'));

const newPosts = [
  {
    id: 'scientific-trip-2025-1',
    categories: [{ en: 'Activities', ku: 'چالاکییەکان', ar: 'أنشطة' }],
    title: {
      en: 'A day for mind and soul',
      ku: 'ڕۆژێک بۆ ژیری و ڕۆح',
      ar: 'يوم للعقل والروح'
    },
    date: '2025-11-15',
    tags: {
      en: ['trip', 'science', 'students'],
      ku: ['سەیران', 'زانست', 'فێرخوازان'],
      ar: ['نزهة', 'علم', 'طلاب']
    },
    summary: {
      en: 'A different day mixed with science and a trip for a group of our students to Kurdistan Miracles Center and Astana Knowledge House.',
      ku: 'ڕۆژێکی جیاواز ئاوێتە بە زانست و سەیران بۆ پۆلێک لە فێرخوازانمان بۆ ناوەندی ئیعجازی کوردستان و مەعریفەتخانەی ئاستانە.',
      ar: 'يوم مختلف ممزوج بالعلم والنزهة لمجموعة من طلابنا إلى مركز إعجاز كردستان ودار أستانة للمعرفة.'
    },
    content: {
      en: '<p>Today, along with a group of our students, we spent a different day that was a mix of science and a trip:</p><p>First stop: Kurdistan Miracles Center; to take a trip to the city of Medina through (VR) device.</p><p>Second stop: Astana Knowledge House; to get acquainted with the world of thought and knowledge..</p><p>We are glad that alongside lessons, we can offer such experiences to our students.</p>',
      ku: '<p>ئەمڕۆ لەگەڵ پۆلێک لە فێرخوازەکانمان، ڕۆژێکی جیاوازمان بەسەربرد کە ئاوێتەیەک بوو لە زانست و سەیران:</p><p>وێستگەی یەکەم: ناوەندی ئیعجازی کوردستان؛ بۆ ئەنجامدانی گەشتێک بۆ شاری مەدینە لەڕێگەی ئامێری (VR).</p><p>وێستگەی دووەم: مەعریفەتخانەی ئاستانە؛ بۆ ئاشنابوون بە جیهانی فیکر و مەعریفە..</p><p>خۆشحاڵین کە دەتوانین لە پاڵ وانەکاندا، ئەم جۆرە ئەزموونانەش پێشکەش بە فێرخوازانمان بکەین</p>',
      ar: '<p>اليوم، مع مجموعة من طلابنا، قضينا يوماً مختلفاً كان مزيجاً من العلم والنزهة:</p><p>المحطة الأولى: مركز إعجاز كردستان؛ للقيام برحلة إلى مدينة المدينة المنورة عبر جهاز (VR).</p><p>المحطة الثانية: دار أستانة للمعرفة؛ للتعرف على عالم الفكر والمعرفة..</p><p>نحن سعداء لأننا نستطيع، إلى جانب الدروس، تقديم مثل هذه التجارب لطلابنا.</p>'
    },
    image: '/assets/img/activities/1_1.jpg',
    gallery: Array.from({length: 6}, (_, i) => '/assets/img/activities/1_' + (i+1) + '.jpg')
  },
  {
    id: 'media-department-seminar',
    categories: [{ en: 'Seminars', ku: 'کۆڕ و سیمینار', ar: 'ندوات' }],
    title: {
      en: 'Seminar for Media Department Teachers',
      ku: 'کۆڕێکی تایبەت بۆ مامۆستایانی بەشی ڕاگەیاندن',
      ar: 'ندوة خاصة لمعلمي قسم الإعلام'
    },
    date: '2025-11-12',
    tags: {
      en: ['seminar', 'media', 'teachers'],
      ku: ['کۆڕ', 'ڕاگەیاندن', 'مامۆستایان'],
      ar: ['ندوة', 'إعلام', 'معلمين']
    },
    summary: {
      en: 'Conducting a special seminar for the teachers of the media department of New Halabja Center by the respected Mamosta Omed Mohammed.',
      ku: 'ئەنجامدانی کۆڕێکی تایبەت بۆ مامۆستایانی بەشی ڕاگەیاندنی بنکەی هەڵەبجەی تازە لەلایەن بەڕێز مامۆستا ئومێد محەمەد',
      ar: 'عقد ندوة خاصة لمعلمي قسم الإعلام في مركز حلبجة الجديدة من قبل الأستاذ الفاضل أميد محمد.'
    },
    content: {
      en: '<p>Conducting a special seminar for the teachers of the media department of New Halabja Center by the respected Mamosta Omed Mohammed.</p>',
      ku: '<p>ئەنجامدانی کۆڕێکی تایبەت بۆ مامۆستایانی بەشی ڕاگەیاندنی بنکەی هەڵەبجەی تازە لەلایەن بەڕێز مامۆستا ئومێد محەمەد</p>',
      ar: '<p>عقد ندوة خاصة لمعلمي قسم الإعلام في مركز حلبجة الجديدة من قبل الأستاذ الفاضل أميد محمد.</p>'
    },
    image: '/assets/img/activities/2_1.jpg',
    gallery: Array.from({length: 3}, (_, i) => '/assets/img/activities/2_' + (i+1) + '.jpg')
  },
  {
    id: 'scientific-visit-miracles-center',
    categories: [{ en: 'Visits', ku: 'سەردانەکان', ar: 'زيارات' }],
    title: {
      en: 'Scientific visit to the Kurdistan Center for Scientific Miracles',
      ku: 'سەردانی زانستیی بۆ ناوەندی کوردستان بۆ ئیعجازی زانستی',
      ar: 'زيارة علمية لمركز كردستان للإعجاز العلمي'
    },
    date: '2025-11-08',
    tags: {
      en: ['visit', 'science', 'sisters'],
      ku: ['سەردان', 'زانست', 'خوشکان'],
      ar: ['زيارة', 'علم', 'أخوات']
    },
    summary: {
      en: 'Scientific visit by a group of teachers and students of New Halabja Center (Sisters Section) to the Kurdistan Center for Scientific Miracles in the Quran and Sunnah.',
      ku: 'سەردانی زانستیی بەشێک لە مامۆستایان و فێرخوازانی بنکەی هەڵەبجەی تازە (بەشی خوشکان) بۆ ناوەندی کوردستان بۆ ئیعجازی زانستی لەقورئان و سوننەتدا',
      ar: 'زيارة علمية من قبل مجموعة من المعلمات والطالبات في مركز حلبجة الجديدة (قسم الأخوات) إلى مركز كردستان للإعجاز العلمي في القرآن والسنة.'
    },
    content: {
      en: '<p>Scientific visit by a group of teachers and students of New Halabja Center (Sisters Section) to the Kurdistan Center for Scientific Miracles in the Quran and Sunnah.</p>',
      ku: '<p>سەردانی زانستیی بەشێک لە مامۆستایان و فێرخوازانی بنکەی هەڵەبجەی تازە (بەشی خوشکان) بۆ ناوەندی کوردستان بۆ ئیعجازی زانستی لەقورئان و سوننەتدا</p>',
      ar: '<p>زيارة علمية من قبل مجموعة من المعلمات والطالبات في مركز حلبجة الجديدة (قسم الأخوات) إلى مركز كردستان للإعجاز العلمي في القرآن والسنة.</p>'
    },
    image: '/assets/img/activities/3_1.jpg',
    gallery: Array.from({length: 11}, (_, i) => '/assets/img/activities/3_' + (i+1) + '.jpg')
  },
  {
    id: 'scientific-visit-astana',
    categories: [{ en: 'Visits', ku: 'سەردانەکان', ar: 'زيارات' }],
    title: {
      en: 'Scientific visit to Astana Knowledge House',
      ku: 'سەردانی زانستیی بۆ مەعریفەتخانەی ئاستانە',
      ar: 'زيارة علمية لدار أستانة للمعرفة'
    },
    date: '2025-11-08',
    tags: {
      en: ['visit', 'science', 'sisters'],
      ku: ['سەردان', 'زانست', 'خوشکان'],
      ar: ['زيارة', 'علم', 'أخوات']
    },
    summary: {
      en: 'Scientific visit by a group of teachers and students of New Halabja Center (Sisters Section) to Astana Knowledge House.',
      ku: 'سەردانی زانستیی بەشێک لە مامۆستایان و فێرخوازانی بنکەی هەڵەبجەی تازە (بەشی خوشکان) بۆ مەعریفەتخانەی ئاستانە',
      ar: 'زيارة علمية من قبل مجموعة من المعلمات والطالبات في مركز حلبجة الجديدة (قسم الأخوات) إلى دار أستانة للمعرفة.'
    },
    content: {
      en: '<p>Scientific visit by a group of teachers and students of New Halabja Center (Sisters Section) to Astana Knowledge House.</p>',
      ku: '<p>سەردانی زانستیی بەشێک لە مامۆستایان و فێرخوازانی بنکەی هەڵەبجەی تازە (بەشی خوشکان) بۆ مەعریفەتخانەی ئاستانە</p>',
      ar: '<p>زيارة علمية من قبل مجموعة من المعلمات والطالبات في مركز حلبجة الجديدة (قسم الأخوات) إلى دار أستانة للمعرفة.</p>'
    },
    image: '/assets/img/activities/4_1.jpg',
    gallery: Array.from({length: 6}, (_, i) => '/assets/img/activities/4_' + (i+1) + '.jpg')
  }
];

data.unshift(...newPosts);

fs.writeFileSync('assets/data/activities.json', JSON.stringify(data, null, 2), 'utf8');
console.log('Successfully updated activities.json');