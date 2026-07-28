import type { Article, CommunityEvent, EmergencyAlert, Comment } from '../types';

export const INITIAL_ARTICLES: Article[] = [
  // 1. TECHNOLOGY MAGAZINE
  {
    id: 'art-tech-1',
    slug: 'la-revolucion-de-la-ia-generativa-nueva-generacion-de-procesadores-cuanticos',
    cityId: 'madrid',
    title: {
      ar: 'ثورة الذكاء الاصطناعي التوليدي: إطلاق الجيل الجديد من المعالجات الكمومية في عالم التكنولوجيا',
      es: 'La revolución de la IA generativa: Lanzamiento de la nueva generación de procesadores cuánticos',
      en: 'Generative AI Revolution: Next-Generation Quantum Chips Launched in Tech Sphere'
    },
    excerpt: {
      ar: 'تكشف كبرى شركات التقنية عن معالجات فائقة السرعة قادرة على تشغيل نماذج الذكاء الاصطناعي المعقدة محلياً دون الحاجة للسحابة.',
      es: 'Grandes empresas tecnológicas presentan procesadores ultrarrápidos capaces de ejecutar modelos complejos de IA localmente.',
      en: 'Leading tech firms unveil ultra-fast processors capable of running complex AI models locally without cloud dependence.'
    },
    content: {
      ar: 'شهد العالم الرقمي اليوم قفزة نوعية مع إعلان التحالف العالمي للتقنية عن إطلاق أول جيل من المعالجات الكمومية المدمجة للهواتف والأجهزة الشخصية.\n\nتتميز المعالجات الجديدة بقدرتها على معالجة ملايين الملاحظات الحسابية في أجزاء من الثانية مع استهلاك طاقة أقل بنسبة 60% مقارنة بالجيل السابق. ومن المتوقع أن تحدث هذه الخطوة نقلة جذريّة في مجالات التشفير، والتعلم الآلي، والمعالجة الصورية المتقدمة.',
      es: 'El mundo digital ha vivido un salto cualitativo con el anuncio de la alianza tecnológica mundial sobre el lanzamiento de chips cuánticos integrados para móviles.\n\nDestacan por procesar millones de datos en milisegundos consumiendo un 60% menos de energía. Se espera una transformación profunda en criptografía y aprendizaje automático.',
      en: 'The digital world witnessed a giant leap as the global tech alliance unveiled quantum chips for personal devices.\n\nProcessing millions of data points in milliseconds with 60% lower power consumption, this innovation promises to revolutionize cryptography and edge computing.'
    },
    category: 'tech',
    neighborhood: 'Revista de Tecnología',
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=700&q=70',
    publishedAt: 'Hace 1 hora',
    author: {
      name: 'Sami Al-Khaled',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=60&q=60',
      role: 'Editor de Tecnología e Innovación'
    },
    readTimeMinutes: 4,
    isUrgent: false,
    viewsCount: 5420,
    likesCount: 890,
    commentsCount: 14,
    seoKeywords: ['tecnología', 'inteligencia artificial', 'procesadores', 'tecnología avanzada'],
    metaDescription: 'Informe completo sobre los últimos avances en procesadores e inteligencia artificial.',
    source: 'Revista de Tecnología'
  },
  {
    id: 'art-tech-2',
    slug: 'ciberseguridad-y-nube-informe-clave-sobre-proteccion-de-datos-2026',
    cityId: 'madrid',
    title: {
      ar: 'أمن المعلومات والأنظمة السحابية: تقرير حاسم حول حماية البيانات الشخصية في 2026',
      es: 'Ciberseguridad y nube: Informe clave sobre la protección de datos personales en 2026',
      en: 'Cybersecurity & Cloud: Critical Report on Personal Data Protection in 2026'
    },
    excerpt: {
      ar: 'خبراء الأمن السيبراني ينشرون إرشادات جديدة لمنع الهجمات المعقدة واعتماد معايير التشفير بلا معرفة.',
      es: 'Expertos en ciberseguridad publican nuevas directrices para prevenir ataques complejos mediante cifrado.',
      en: 'Cybersecurity experts publish updated guidelines to counter zero-day exploits using zero-knowledge encryption.'
    },
    content: {
      ar: 'أصدر المؤتمر الدولي للأمن السيبراني وثيقته السنوية التي تشدد على ضرورة تفعيل معايير الأمان المتقدمة عبر الأجهزة الذكية والشبكات.\n\nأكد التقرير أن الاستثمار في أدوات الجدار الناري القائمة على الذكاء الاصطناعي أدى إلى خفض بنسبة 45% في الاختراقات الموجهة للمؤسسات والشركات الناشئة.',
      es: 'El congreso internacional de ciberseguridad publicó su documento anual pidiendo reforzar los estándares de seguridad.\n\nLas herramientas de protección basadas en IA han reducido un 45% las brechas corporativas.',
      en: 'The global cybersecurity conference issued its annual framework urging enhanced security protocols.\n\nAI-driven firewalls have slashed enterprise data breaches by 45% worldwide.'
    },
    category: 'tech',
    neighborhood: 'Revista de Tecnología',
    imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=700&q=70',
    publishedAt: 'Hace 3 horas',
    author: {
      name: 'Noura Al-Ali',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=60&q=60',
      role: 'Especialista en Ciberseguridad'
    },
    readTimeMinutes: 3,
    isUrgent: false,
    viewsCount: 3180,
    likesCount: 420,
    commentsCount: 6,
    seoKeywords: ['ciberseguridad', 'cifrado', 'datos', 'nube'],
    metaDescription: 'Informe clave sobre ciberseguridad y sistemas en la nube.',
    source: 'Revista de Tecnología'
  },

  // 2. SPORTS MAGAZINE
  {
    id: 'art-sports-1',
    slug: 'gran-noche-de-champions-duelo-epico-entre-gigantes-europeos',
    cityId: 'madrid',
    title: {
      ar: 'قمة دوري الأبطال: مواجهة ملحمية بين كبار القرة في ليلة كروية خيالية',
      es: 'Gran Noche de Champions: Duelo épico entre los gigantes europeos',
      en: 'Champions League Showdown: Epic Clash Between European Football Giants'
    },
    excerpt: {
      ar: 'جماهير كرة القدم تتطلع لقمة نارية تجمع بين بطل الدوري والعملاق القاري وسط استعدادات تكتيكية مكثفة.',
      es: 'Los aficionados al fútbol se preparan para un vibrante encuentro con los mejores jugadores del mundo en el terreno.',
      en: 'Football fans assemble for a thrilling encounter showcasing world-class tactics and superstar talent.'
    },
    content: {
      ar: 'تتجه أنظار عشاق الساحرة المستديرة مساء اليوم إلى الملعب الرئيسي لحضور واحدة من أهم مباريات الموسم الكروي.\n\nيدخل الفريقان اللقاء بكامل نجومهما بعد استعادة المصابين، بينما ركز المدربان خلال المؤتمر الصحفي على أهمية الضغط العالي والتحركات السريعة في الخط الأمامي لحسم بطاقة التأهل.',
      es: 'Todas las miradas se dirigen hoy al estadio principal para disputar uno de los partidos más trascendentales de la temporada.\n\nAmbos conjuntos contarán con sus alineaciones titulares tras recuperar a sus figuras clave.',
      en: 'All eyes turn to the iconic stadium tonight for one of the most defining fixtures of the football calendar.\n\nBoth squads boast fully recovered line-ups ready for a tactical battle of high intensity.'
    },
    category: 'sports',
    neighborhood: 'Deportes Internacionales',
    imageUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=700&q=70',
    publishedAt: 'Hace 2 horas',
    author: {
      name: 'Karim Al-Mansour',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=60&q=60',
      role: 'Editor de Deportes'
    },
    readTimeMinutes: 3,
    isUrgent: false,
    viewsCount: 8900,
    likesCount: 1420,
    commentsCount: 32,
    seoKeywords: ['fútbol', 'champions league', 'deportes', 'partido'],
    metaDescription: 'Cobertura completa sobre la gran noche del fútbol y la Champions League.',
    source: 'Deportes'
  },
  {
    id: 'art-sports-2',
    slug: 'final-del-torneo-internacional-de-tenis-records-historicos-superados',
    cityId: 'madrid',
    title: {
      ar: 'سباق التنس العالمي: تحطيم أرقام قياسية جديدة في نهائي البطولة الدولية',
      es: 'Final del Torneo Internacional de Tenis: Récords históricos superados',
      en: 'International Tennis Final: Historic Records Shattered in Final Match'
    },
    excerpt: {
      ar: 'أداء أسطوري في النهائي الصعب ينتهي بتتويج النجم الشاب بكأس البطولة بعد مباراة استمرت أربع ساعات.',
      es: 'Una actuación memorable en la final culmina con el campeonato del joven talento tras cuatro horas de juego.',
      en: 'An unforgettable performance in the marathon final crowns the young prodigy after four intense hours.'
    },
    content: {
      ar: 'في واحدة من أطول وأمتع المباريات في تاريخ البطولة، تمكن البطل الشاب من انتزاع اللقب بعد خمس مجموعات حابسة للأنفاس.\n\nأشاد المتابعون باللياقة البدنية العالية والضربات السريعة الدقيقة التي حسمت النقاط الحاسمة في الشوط الفاصل.',
      es: 'En una de las finales más disputadas, la joven promesa logró hacerse con el trofeo tras cinco sets inolvidables.',
      en: 'In a breathtaking five-set thriller, the rising tennis star claimed the championship trophy amidst standing ovations.'
    },
    category: 'sports',
    neighborhood: 'Deportes Internacionales',
    imageUrl: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=700&q=70',
    publishedAt: 'Hace 4 horas',
    author: {
      name: 'Tariq Al-Zahrani',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=60&q=60',
      role: 'Analista de Tenis y Deportes'
    },
    readTimeMinutes: 3,
    isUrgent: false,
    viewsCount: 4120,
    likesCount: 630,
    commentsCount: 9,
    seoKeywords: ['tenis', 'torneo', 'deportes', 'final'],
    metaDescription: 'Cobertura de la final del torneo internacional de tenis y récords superados.',
    source: 'Deportes'
  },

  // 3. POLITICS MAGAZINE
  {
    id: 'art-pol-1',
    slug: 'cumbre-internacional-del-clima-acuerdo-historico-reducir-emisiones-2030',
    cityId: 'madrid',
    title: {
      ar: 'القمة الدولية للمناخ والطاقة: اتفاق تاريخي بين الدول لخفض الانبعاثات بحلول 2030',
      es: 'Cumbre Internacional del Clima: Acuerdo histórico para reducir emisiones antes de 2030',
      en: 'Global Climate Summit: Historic Accord Reached to Slash Emissions by 2030'
    },
    excerpt: {
      ar: 'قادة الدول يوقعون على معاهدة شاملة تعزز الاستثمار في الطاقة المتجددة ودعم الاقتصاد الأخضر المستدام.',
      es: 'Líderes mundiales firman un tratado global para impulsar energías renovables y economía verde.',
      en: 'World leaders sign landmark pact to accelerate renewable energy deployment and green investments.'
    },
    content: {
      ar: 'اختتمت اليوم أعمال القمة العالمية للمناخ بإعلان الميثاق النهائي الذي حظي بتأييد إجماعي من ممثلي أكثر من 120 دولة.\n\nيتضمن الاتفاق التزاماً بتمويل مشاريع الطاقة الشمسية والرياح بمبلغ يتجاوز 500 مليار دولار، إلى جانب تقديم تسهيلات تنموية للدول النامية للتكيف مع المتغيرات المناخية.',
      es: 'La Cumbre del Clima concluyó con la declaración final respaldada por representantes de más de 120 países.\n\nEl acuerdo compromete un fondo superior a 500.000 millones de dólares para energía eólica y solar.',
      en: 'The international climate conference ended with unanimous approval of a multi-lateral framework.\n\nThe treaty pledges over $500 billion toward wind and solar projects alongside transition funds for developing nations.'
    },
    category: 'politics',
    neighborhood: 'Política e Internacional',
    imageUrl: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=700&q=70',
    publishedAt: 'Hace 2 horas',
    author: {
      name: 'Dr. Youssef Al-Hakim',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=60&q=60',
      role: 'Analista de Asuntos Políticos'
    },
    readTimeMinutes: 4,
    isUrgent: false,
    viewsCount: 6300,
    likesCount: 940,
    commentsCount: 22,
    seoKeywords: ['política', 'cumbre del clima', 'relaciones internacionales', 'acuerdo'],
    metaDescription: 'Detalles del tratado internacional de la cumbre del clima y decisiones políticas.',
    source: 'Política y Actualidad'
  },

  // 4. GENERAL NEWS
  {
    id: 'art-gen-1',
    slug: 'transporte-de-alta-velocidad-inauguracion-nueva-linea-de-tren',
    cityId: 'madrid',
    title: {
      ar: 'تطوير وسائل النقل الذكية: افتتاح خط القطار الفائق السرعة بين المدن الرئيسية',
      es: 'Transporte de alta velocidad: Inauguración de la nueva línea de tren entre principales ciudades',
      en: 'Smart Transit Growth: High-Speed Bullet Rail Line Inaugurated Connecting Major Hubs'
    },
    excerpt: {
      ar: 'مشروع بنية تحتية عملاق يعتمد على الطاقة الكهربائية النظيفة ويختصر زمن الرحلات إلى النصف.',
      es: 'Un gran proyecto de infraestructura impulsado por energía limpia que reduce los tiempos a la mitad.',
      en: 'A flagship clean-energy infrastructure initiative cutting intercity travel time in half.'
    },
    content: {
      ar: 'افتتحت وزارة النقل رسمياً خط القطار الكهربائي الفائق السرعة لربط العواصم الاقتصادية بالمدن الساحلية.\n\nيعمل القطار بخصائص التسيير الذاتي الصديقة للبيئة، حيث ينطلق بسرعة تصل إلى 320 كم/ساعة موفراً تجربة سفر آمنة ومريحة لآلاف الركاب يومياً.',
      es: 'El Ministerio de Transportes inauguró oficialmente la línea de alta velocidad para unir la capital con la costa.\n\nEl tren alcanza los 320 km/h impulsado por energía eléctrica limpia.',
      en: 'The Ministry of Transport launched the high-speed electric rail corridor linking metropolitan hubs to coastal regions.\n\nReaching speeds up to 320 km/h, the service provides zero-emission, rapid regional mobility.'
    },
    category: 'general',
    neighborhood: 'Noticias Generales',
    imageUrl: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=700&q=70',
    publishedAt: 'Hace 5 horas',
    author: {
      name: 'Mona Al-Sharif',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=60&q=60',
      role: 'Periodista de Noticias Generales'
    },
    readTimeMinutes: 3,
    isUrgent: false,
    viewsCount: 3910,
    likesCount: 510,
    commentsCount: 8,
    seoKeywords: ['tren de alta velocidad', 'transporte inteligente', 'noticias generales', 'infraestructura'],
    metaDescription: 'Inauguración de la línea de transporte de alta velocidad y detalles del servicio.',
    source: 'Noticias Generales'
  },

  // 5. ECONOMY MAGAZINE
  {
    id: 'art-econ-1',
    slug: 'auge-financiero-mercados-globales-y-startups-logran-ganancias-record',
    cityId: 'madrid',
    title: {
      ar: 'ارتفاع الأسواق المالية العالمية والشركات الناشئة تحقق مكاسب قياسية في الربع الحالي',
      es: 'Auge financiero: Mercados globales y startups logran ganancias récord este trimestre',
      en: 'Financial Rally: Global Stock Markets and Tech Startups Post Record Gains'
    },
    excerpt: {
      ar: 'مؤشرات التداول تسجل ارتفاعاً ملحوظاً مدعومة بالنمو المستمر في قطاعات التكنولوجيا والابتكار الأخضر.',
      es: 'Los índices bursátiles registran importantes subidas impulsados por la innovación y energías renovables.',
      en: 'Major stock indices surged following strong earnings reports in technology and clean energy sectors.'
    },
    content: {
      ar: 'سجلت البورصات العالمية مستويات قياسية جديدة اليوم مع انطلاق الجلسة الافتتاحية للموسم المالي.\n\nأرجعت تحليلات الخبراء هذا الارتفاع إلى زيادة ثقة المستثمرين في قطاعات التكنولوجيا، والحلول الرقمية، وتوسع التمويل الجريء للشركات الناشئة الواعدة.',
      es: 'Las bolsas globales alcanzaron nuevos máximos con la apertura de las cotizaciones financieras.\n\nAnalistas atribuyen el crecimiento a la confianza inversora en tecnología y capital riesgo.',
      en: 'Global financial markets surged to new record highs as trading opened for the quarter.\n\nMarket analysts credit the momentum to strong venture capital inflows and robust enterprise tech adoption.'
    },
    category: 'economy',
    neighborhood: 'Economía y Negocios',
    imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=700&q=70',
    publishedAt: 'Hace 3 horas',
    author: {
      name: 'Majed Al-Said',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=60&q=60',
      role: 'Analista de Mercados Financieros'
    },
    readTimeMinutes: 3,
    isUrgent: false,
    viewsCount: 2890,
    likesCount: 380,
    commentsCount: 5,
    seoKeywords: ['economía', 'mercados financieros', 'acciones', 'inversión'],
    metaDescription: 'Informe sobre los mercados financieros globales y el crecimiento económico.',
    source: 'Economía y Negocios'
  }
];

export const INITIAL_EVENTS: CommunityEvent[] = [];

export const INITIAL_ALERTS: EmergencyAlert[] = [];

export const INITIAL_COMMENTS: Comment[] = [
  {
    id: 'comm-1',
    articleId: 'art-tech-1',
    authorName: 'Ahmed Al-Tamimi',
    authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=60&q=60',
    content: '¡Increíble avance en procesadores cuánticos de IA! El futuro está más cerca de lo que pensamos.',
    createdAt: 'Hace 1 hora',
    likes: 18,
    isNeighborhoodResident: true
  },
  {
    id: 'comm-2',
    articleId: 'art-sports-1',
    authorName: 'Khaled Darwish',
    authorAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=60&q=60',
    content: 'Un partido muy emocionante y la táctica ofensiva será el factor decisivo en la segunda parte.',
    createdAt: 'Hace 30 minutos',
    likes: 9,
    isNeighborhoodResident: true
  }
];
