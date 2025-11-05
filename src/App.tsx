import { useEffect, useMemo, useRef, useState } from 'react';

// Single-file preview component for ATMU ONE landing + AI utilities
export default function App() {
  // ===== Lang & UI =====
  const [lang, setLang] = useState<'uz' | 'ru'>('uz');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [active, setActive] = useState<string>('');

  // ===== Refs (dialogs) =====
  const signinRef = useRef<HTMLDialogElement>(null);
  const signupRef = useRef<HTMLDialogElement>(null);
  const quizRef = useRef<HTMLDialogElement>(null);
  const mentorRef = useRef<HTMLDialogElement>(null);
  const faqRef = useRef<HTMLDialogElement>(null);
  const docsRef = useRef<HTMLDialogElement>(null);
  const schRef = useRef<HTMLDialogElement>(null);
  const planRef = useRef<HTMLDialogElement>(null);
  const smmRef = useRef<HTMLDialogElement>(null);
  const tourQaRef = useRef<HTMLDialogElement>(null);

  // ===== Portfolio & Mentor state =====
  type Portfolio = { persona: string; track: string; community: string; plan: string } | null;
  const [portfolio, setPortfolio] = useState<Portfolio>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({ q1: '', q2: '', q3: '' });
  const [quizLoading, setQuizLoading] = useState(false);

  type ChatMsg = { role: 'user' | 'assistant'; content: string };
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // ===== Gamification state (avoid TDZ) =====
  const [xp, setXp] = useState({ current: 120, target: 180, level: 3, nextBadge: 'Campus Guide' });
  const [earnedBadges, setEarnedBadges] = useState<string[]>(['Starter', 'Quiz Master', 'Mentor Talk', 'Tourist']);
  const [missions, setMissions] = useState<{ m: string; b: string; s: string }[]>([]);

  // ===== New AI modules state =====
  // FAQ
  const [faqQuery, setFaqQuery] = useState('Qabul muddati qachon tugaydi?');
  const [faqAnswer, setFaqAnswer] = useState<{ answer: string; sources: { title: string; url: string }[] } | null>(null);
  const [faqLoading, setFaqLoading] = useState(false);
  // Docs check (demo: text area o‘rniga OCR)
  const [docText, setDocText] = useState('Passport seriya: AB1234567\nDiplom ilovasi: mavjud');
  const [docResult, setDocResult] = useState<{ status: 'ok' | 'warn' | 'error'; issues: string[] } | null>(null);
  const [docLoading, setDocLoading] = useState(false);
  // Scholarship
  const [schMatches, setSchMatches] = useState<{ title: string; score: number; link: string }[]>([]);
  const [schLoading, setSchLoading] = useState(false);
  // Plan
  const [termPlan, setTermPlan] = useState<{ course: string; ects: number }[]>([]);
  const [planLoading, setPlanLoading] = useState(false);
  // SMM generator
  const [smmTheme, setSmmTheme] = useState('student life');
  const [smmTone, setSmmTone] = useState('energetic');
  const [smmOut, setSmmOut] = useState<{ script: string; caption: string; hashtags: string[] } | null>(null);
  const [smmLoading, setSmmLoading] = useState(false);
  // Tour QA
  const tourBase = 'https://www.youtube.com/embed/ysz5S6PUM-U';
  const [tourUrl, setTourUrl] = useState<string>(tourBase);
  const [tourQuery, setTourQuery] = useState('Robototexnika lab qayerda?');
  const [tourTs, setTourTs] = useState<number | undefined>(undefined);
  const [tourLoading, setTourLoading] = useState(false);

  // ===== Small fetch helper =====
  const api = async (path: string, init?: RequestInit) => {
    const url = path.startsWith('http') ? path : `${process.env.NEXT_PUBLIC_API_BASE || ''}${path}`;
    const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...init });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  };

  // ===== Inline mock API =====
  useEffect(() => {
    // @ts-ignore
    if (typeof window === 'undefined' || (window as any).__ATMU_MOCK_INSTALLED) return;
    // @ts-ignore
    (window as any).__ATMU_MOCK_INSTALLED = true;
    const originalFetch = window.fetch.bind(window);

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : (input as URL).toString();
      const method = (init?.method || 'GET').toUpperCase();
      const j = (data: any, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

      try {
        // Gamification
        if (url.includes('/api/user/points') && method === 'GET') {
          return j({ current: 120, target: 180, level: 3, nextBadge: 'Campus Guide' });
        }
        if (url.includes('/api/badges') && method === 'GET') {
          return j(['Starter', 'Quiz Master', 'Mentor Talk', 'Tourist']);
        }
        if (url.includes('/api/missions') && method === 'GET') {
          return j([
            { m: 'ATMU Virtual Tour ko‘rish', b: '+10', s: 'Boshlanmagan' },
            { m: 'STEM testni yechish', b: '+20', s: 'Jarayonda' },
            { m: 'Mentor bilan suhbat', b: '+15', s: 'Tugallandi' },
            { m: 'Kampus ekskursiyasi', b: '+50', s: 'Boshlanmagan' },
          ]);
        }
        // Portfolio analyze
        if (url.includes('/portfolio/analyze') && method === 'POST') {
          const bodyText = init?.body ? String(init.body) : '{}';
          let answers: any = {};
          try { answers = JSON.parse(bodyText).answers || {}; } catch {}
          const a1 = (answers.q1 || '').toString().toLowerCase();
          const persona = a1.includes('robot') ? 'Konstruktor' : a1.includes('marketing') ? 'Kommunikator' : a1.includes('dizayn') ? 'Vizual' : 'Analitik';
          const track = persona === 'Analitik' ? 'Data Science / AI' : persona === 'Konstruktor' ? 'IoT / Robototexnika' : persona === 'Kommunikator' ? 'Menejment / SMM' : 'UI/UX';
          const community = persona === 'Analitik' ? 'CodeGalaxy' : persona === 'Konstruktor' ? 'RoboMind' : persona === 'Kommunikator' ? 'BizTech' : 'MediaLab';
          const plan = '1-oy: Asosiy kurslar → 3-oy: Mini-loyiha → 6-oy: Pitch';
          return j({ persona, track, community, plan });
        }
        // Mentor chat
        if (url.includes('/mentor/chat') && method === 'POST') {
          const bodyText = init?.body ? String(init.body) : '{}';
          let payload: any = {};
          try { payload = JSON.parse(bodyText); } catch {}
          const q: string = (payload.message || '').toString();
          let reply = 'Savolingiz qiziqarli!';
          if (/integral|∫|dx/i.test(q)) reply = '∫ x dx = x²/2 + C. Umumiy holda: ∫ xⁿ dx = xⁿ⁺¹/(n+1) + C (n ≠ -1).';
          else if (/python|xato|error/i.test(q)) reply = 'Python xatosini tuzatish uchun traceback’ni diqqat bilan o‘qing, so‘ng `print(...)` yoki `pdb` bilan debugging qiling.';
          else if (/slm|slam|robot/i.test(q)) reply = 'SLAM uchun ROS + RTAB-Map yoki ORB-SLAM2; real vaqt uchun GPU tezlashtirish foydali.';
          return j({ reply });
        }
        // FAQ RAG
        if (url.includes('/api/faq/search') && method === 'POST') {
          return j({ answer: 'Qabul muddati 15-avgustgacha. Onlayn ariza my.gov orqali ham topshirish mumkin.', sources: [{ title: 'Qabul nizomi', url: '#' }, { title: 'ATMU Q&A', url: '#' }] });
        }
        // Doc check
        if (url.includes('/api/docs/check') && method === 'POST') {
          return j({ status: 'warn', issues: ['Passport skan sifati past (≥300dpi tavsiya).', 'Diplom muqovasining yuqori qismi kesilgan.'] });
        }
        // Scholarship
        if (url.includes('/api/scholarship/match') && method === 'POST') {
          return j({ matches: [
            { title: 'ATMU Merit', score: 0.86, link: '#' },
            { title: 'Tech Grant', score: 0.74, link: '#' },
          ] });
        }
        // Plan recommend
        if (url.includes('/api/plan/recommend') && method === 'POST') {
          return j({ termPlan: [
            { course: 'Kirishga Matematika', ects: 5 },
            { course: 'Python 1', ects: 6 },
            { course: 'Akademik yozuv', ects: 3 },
          ] });
        }
        // Tour QA
        if (url.includes('/api/tour/qa') && method === 'POST') {
          return j({ answer: 'Robototexnika lab – 2-qavat, B blok. Videoda 02:13', timestamp: 133 });
        }
        // SMM generator
        if (url.includes('/api/smm/generate') && method === 'POST') {
          return j({ script: 'ATMU talabasining bir kuni: kampusdan labga, robot yig‘ish...', caption: 'ATMUda talabalik hayoti!', hashtags: ['#ATMU', '#StudentLife', '#Tech'] });
        }

        return originalFetch(input as any, init);
      } catch (e) {
        return originalFetch(input as any, init);
      }
    };
  }, []);

  // ===== i18n =====
  const t = (key: string) => {
    const dict: Record<string, Record<string, string>> = {
      uz: {
        brand: 'ATMU ONE',
        tagline: 'Qabul & Rivojlanish platformasi',
        heroTitle1: 'Kelajakni',
        heroTitle2: 'birga',
        heroTitle3: 'quramiz',
        heroDesc: 'AI yordamida shaxsiy rivojlanish profili, mentor, jamoalar va gamifikatsiya — barchasi bitta platformada.',
        startPortfolio: 'AI‑Portfolio’ni boshlash',
        talkMentor: 'AI Mentor bilan suhbat',
        modules: '5 ta modul',
        aiTips: 'AI tavsiyalar',
        badges: 'Ball & Badge’lar',
        navPortfolio: 'AI‑Portfolio',
        navMentor: 'AI Mentor',
        navCommunities: 'Jamoalar',
        navGamify: 'Gamifikatsiya',
        navTour: 'Virtual Tour',
        navMaster: 'Master‑klasslar',
        navAdmin: 'Admin',
        signIn: 'Kirish',
        signUp: 'Ro‘yxatdan o‘tish',
        portfolioTitle: 'AI‑Portfolio',
        portfolioDesc: 'Qiziqishlar → Kuchli tomonlar → Yo‘nalish → 6 oylik rivojlanish xaritasi.',
        qTest: 'Qiziqish testi',
        qTestDesc: '10 ta tezkor savol',
        pType: 'Shaxs tipi',
        pTypeDesc: 'Analitik / Konstruktor / Kommunikator / Vizual',
        pTrack: 'Yo‘nalish tavsiyasi',
        pTrackDesc: 'AI, IoT, UI/UX, Menejment',
        pPlan: 'Reja',
        pPlanDesc: 'Kurslar, loyiha va pitch',
        mentorTitle: 'AI Mentor',
        mentorDesc: 'Matematika tushuntirish, kod xatolarini topish, eslatmalar va tayyorgarlik.',
        mMath: 'Matematika izohi',
        mCode: 'Kod tahlili',
        mExam: 'Imtihon rejasi',
        commTitle: 'ATMU Friends — Jamoalar',
        commDesc: 'Abituriyent ro‘yxatdan o‘tgach darhol jamoaga qo‘shiladi.',
        gamifyTitle: 'Gamifikatsiya',
        gamifyDesc: 'Missiyalarni bajaring, ball to‘plang, badge va sovg‘alarga ega bo‘ling.',
        mission: 'Missiya',
        score: 'Ball',
        status: 'Holat',
        m1: 'ATMU Virtual Tour ko‘rish',
        m2: 'STEM testni yechish',
        m3: 'Mentor bilan suhbat',
        m4: 'Kampus ekskursiyasi',
        notStarted: 'Boshlanmagan',
        inProgress: 'Jarayonda',
        done: 'Tugallandi',
        tourTitle: 'Virtual Tour',
        tourDesc: '360° kampus: laboratoriyalar, dars xonalari va startap zonalari.',
        masterTitle: 'Virtual Master‑klasslar',
        masterDesc: 'Google, Huawei, MIT — har oy bitta katta sessiya, qisqa kliplarga ajratiladi.',
        ctaTitle: 'Bugun boshlang',
        ctaDesc: 'AI yordamida yo‘nalishingizni toping va ATMU jamoasiga qo‘shiling.',
        footerCopy: 'Barcha huquqlar himoyalangan.',
        privacy: 'Maxfiylik',
        terms: 'Foydalanish shartlari',
        contact: 'Aloqa',
        persona: 'Shaxs tipi',
        track: 'Yo‘nalish',
        team: 'Jamoa',
        plan: '6 oylik reja',
        mentor: 'Mentor',
        adminTitle: 'CMS & Admin',
        adminDesc: 'Master‑klasslar, yangiliklar, jamoalar va badge’larni boshqarish.',
        adminOpen: 'Admin panelga o‘tish',
        email: 'Email',
        password: 'Parol',
        login: 'Kirish',
        register: 'Ro‘yxatdan o‘tish',
        // New
        askAI: 'FAQ AI',
        docsAI: 'Hujjat tekshirish',
        grantAI: 'Grant tavsiyasi',
        planAI: 'Kurs reja',
        smmAI: 'SMM AI',
        tourAI: 'Tour Q&A',
      },
      ru: {
        brand: 'ATMU ONE',
        tagline: 'Платформа приёма и развития',
        heroTitle1: 'Будущее',
        heroTitle2: 'вместе',
        heroTitle3: 'создаём',
        heroDesc: 'Профиль развития, ментор, сообщества и геймификация на одной платформе с ИИ.',
        startPortfolio: 'Запустить AI‑портфолио',
        talkMentor: 'Чат с AI‑ментором',
        modules: '5 модулей',
        aiTips: 'Рекомендации ИИ',
        badges: 'Баллы и значки',
        navPortfolio: 'AI‑портфолио',
        navMentor: 'AI‑ментор',
        navCommunities: 'Сообщества',
        navGamify: 'Геймификация',
        navTour: 'Виртуальный тур',
        navMaster: 'Мастер‑классы',
        navAdmin: 'Админ',
        signIn: 'Войти',
        signUp: 'Регистрация',
        portfolioTitle: 'AI‑портфолио',
        portfolioDesc: 'Интересы → Сильные стороны → Направление → 6‑месячный план развития.',
        qTest: 'Тест интересов',
        qTestDesc: '10 быстрых вопросов',
        pType: 'Тип личности',
        pTypeDesc: 'Аналитик / Конструктор / Коммуникатор / Визуал',
        pTrack: 'Рекомендация направления',
        pTrackDesc: 'ИИ, IoT, UI/UX, Менеджмент',
        pPlan: 'План',
        pPlanDesc: 'Курсы, проект и питч',
        mentorTitle: 'AI‑ментор',
        mentorDesc: 'Объяснение математики, поиск ошибок в коде, напоминания и подготовка.',
        mMath: 'Объяснение математики',
        mCode: 'Анализ кода',
        mExam: 'План подготовки',
        commTitle: 'ATMU Friends — Сообщества',
        commDesc: 'Абитуриент сразу попадает в команду после регистрации.',
        gamifyTitle: 'Геймификация',
        gamifyDesc: 'Выполняйте миссии, набирайте баллы и получайте награды.',
        mission: 'Миссия',
        score: 'Баллы',
        status: 'Статус',
        m1: 'Посмотреть виртуальный тур ATMU',
        m2: 'Решить STEM‑тест',
        m3: 'Чат с ментором',
        m4: 'Экскурсия по кампусу',
        notStarted: 'Не начато',
        inProgress: 'В процессе',
        done: 'Готово',
        tourTitle: 'Виртуальный тур',
        tourDesc: '360° кампус: лаборатории, аудитории и стартап‑зоны.',
        masterTitle: 'Виртуальные мастер‑классы',
        masterDesc: 'Google, Huawei, MIT — ежемесячные сессии и короткие клипы.',
        ctaTitle: 'Начните сегодня',
        ctaDesc: 'С ИИ найдите своё направление и присоединяйтесь к сообществу ATMU.',
        footerCopy: 'Все права защищены.',
        privacy: 'Конфиденциальность',
        terms: 'Условия',
        contact: 'Контакты',
        persona: 'Тип личности',
        track: 'Направление',
        team: 'Команда',
        plan: '6‑месячный план',
        mentor: 'Ментор',
        adminTitle: 'CMS и Админ',
        adminDesc: 'Управление мастер‑классами, новостями, сообществами и значками.',
        adminOpen: 'Открыть админ‑панель',
        email: 'Email',
        password: 'Пароль',
        login: 'Войти',
        register: 'Зарегистрироваться',
        // New
        askAI: 'FAQ ИИ',
        docsAI: 'Проверка документов',
        grantAI: 'Гранты',
        planAI: 'Учебный план',
        smmAI: 'SMM ИИ',
        tourAI: 'Тур Q&A',
      },
    };
    return (dict[lang] && dict[lang][key]) || key;
  };

  const communities = useMemo(
    () => [
      { name: 'CyberFox', desc: lang === 'uz' ? 'Kiberxavfsizlik' : 'Кибербезопасность', color: 'bg-slate-900 text-white' },
      { name: 'RoboMind', desc: 'IoT & Robototexnika', color: 'bg-gradient-to-r from-zinc-100 to-white' },
      { name: 'CodeGalaxy', desc: lang === 'uz' ? 'Dasturlash' : 'Программирование', color: 'bg-gradient-to-r from-violet-50 to-white' },
      { name: 'BizTech', desc: 'IT Biznes / Menejment', color: 'bg-gradient-to-r from-amber-50 to-white' },
      { name: 'MediaLab', desc: 'Media & SMM', color: 'bg-gradient-to-r from-sky-50 to-white' },
    ],
    [lang]
  );

  // ===== Active section highlighting =====
  useEffect(() => {
    const sections = ['portfolio', 'mentor', 'communities', 'gamify', 'tour', 'master', 'admin'];
    const observers: IntersectionObserver[] = [];
    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) setActive(id);
          });
        },
        { threshold: 0.4 }
      );
      io.observe(el);
      observers.push(io);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  // ===== Load gamification (API → fallback) =====
  useEffect(() => {
    (async () => {
      try {
        const points = await api('/api/user/points');
        const b = await api('/api/badges');
        const ms = await api('/api/missions');
        setXp(points);
        setEarnedBadges(Array.isArray(b) ? b : []);
        setMissions(Array.isArray(ms) ? ms : []);
      } catch {
        setMissions([
          { m: t('m1'), b: '+10', s: t('notStarted') },
          { m: t('m2'), b: '+20', s: t('inProgress') },
          { m: t('m3'), b: '+15', s: t('done') },
          { m: t('m4'), b: '+50', s: t('notStarted') },
        ]);
      }
    })();
  }, [lang]);

  // ===== Self-tests (runtime checks) =====
  useEffect(() => {
    (async () => {
      try {
        const p = await api('/api/user/points');
        console.assert(typeof p.current === 'number' && typeof p.target === 'number', 'points shape');
        console.assert(typeof p.nextBadge === 'string', 'nextBadge exists');
        const b = await api('/api/badges');
        console.assert(Array.isArray(b) && typeof (b[0] || '') === 'string', 'badges array');
        const m = await api('/api/missions');
        console.assert(Array.isArray(m) && m[0] && 'm' in m[0] && 'b' in m[0] && 's' in m[0], 'missions shape');
        const ana = await api('/portfolio/analyze', { method: 'POST', body: JSON.stringify({ answers: { q1: 'Matematika', q2: 'Dron', q3: 'Python' } }) });
        console.assert(ana && ana.persona && ana.track && ana.community && ana.plan, 'analyze');
        const chat1 = await api('/mentor/chat', { method: 'POST', body: JSON.stringify({ message: 'Integral nima?' }) });
        console.assert(chat1 && typeof chat1.reply === 'string' && /x²\/2/.test(chat1.reply), 'chat integral');
        const chat2 = await api('/mentor/chat', { method: 'POST', body: JSON.stringify({ message: 'Python xato' }) });
        console.assert(chat2 && typeof chat2.reply === 'string' && /Python/.test(chat2.reply), 'chat python');
        const nav = document.querySelector('nav');
        console.assert(!!nav, 'navbar exists');
        // New module tests
        const faq = await api('/api/faq/search', { method: 'POST', body: JSON.stringify({ query: 'qabul' }) });
        console.assert(faq && typeof faq.answer === 'string', 'faq answer');
        const d = await api('/api/docs/check', { method: 'POST', body: JSON.stringify({ text: 'demo' }) });
        console.assert(d && (d.status === 'ok' || d.status === 'warn' || d.status === 'error'), 'doc check');
        const s = await api('/api/scholarship/match', { method: 'POST', body: JSON.stringify({ portfolio: ana, meta: {} }) });
        console.assert(Array.isArray(s.matches), 'sch matches');
        const pl = await api('/api/plan/recommend', { method: 'POST', body: JSON.stringify({ persona: ana.persona, track: ana.track, interests: {} }) });
        console.assert(Array.isArray(pl.termPlan), 'term plan');
        const tq = await api('/api/tour/qa', { method: 'POST', body: JSON.stringify({ query: 'lab' }) });
        console.assert(typeof tq.timestamp === 'number', 'tour qa ts');
        const sm = await api('/api/smm/generate', { method: 'POST', body: JSON.stringify({ theme: 'student life', tone: 'energetic' }) });
        console.assert(sm && typeof sm.script === 'string', 'smm out');
      } catch (e) {
        console.warn('Self-tests failed:', e);
      }
    })();
  }, []);

  // ===== Handlers =====
  const openQuiz = () => quizRef.current?.showModal();
  const openMentor = () => mentorRef.current?.showModal();
  const openFAQ = () => faqRef.current?.showModal();
  const openDocs = () => docsRef.current?.showModal();
  const openSch = () => schRef.current?.showModal();
  const openPlan = () => planRef.current?.showModal();
  const openSMM = () => smmRef.current?.showModal();
  const openTourQA = () => tourQaRef.current?.showModal();

  const submitQuiz = async () => {
    try {
      setQuizLoading(true);
      const data = await api('/portfolio/analyze', { method: 'POST', body: JSON.stringify({ answers: quizAnswers }) });
      setPortfolio(data);
    } catch (e) {
      alert('Quiz yuborishda xatolik. API ulanishini tekshiring.');
    } finally {
      setQuizLoading(false);
    }
  };

  const sendChat = async () => {
    if (!chatInput.trim()) return;
    const newMsg: ChatMsg = { role: 'user', content: chatInput };
    setChat((v) => [...v, newMsg]);
    setChatInput('');
    try {
      setChatLoading(true);
      const data = await api('/mentor/chat', { method: 'POST', body: JSON.stringify({ message: newMsg.content, history: chat }) });
      setChat((v) => [...v, { role: 'assistant', content: data.reply || '—' }]);
    } catch {
      setChat((v) => [...v, { role: 'assistant', content: 'API ulanishi topilmadi. Demo javob: “Savolingiz qiziqarli!”' }]);
    } finally {
      setChatLoading(false);
    }
  };

  // New module handlers
  const askFAQ = async () => {
    if (!faqQuery.trim()) return;
    setFaqLoading(true);
    try {
      const data = await api('/api/faq/search', { method: 'POST', body: JSON.stringify({ query: faqQuery }) });
      setFaqAnswer(data);
    } catch (e) {
      setFaqAnswer({ answer: 'Xatolik yoki mock API topilmadi.', sources: [] });
    } finally {
      setFaqLoading(false);
    }
  };

  const checkDocs = async () => {
    if (!docText.trim()) return;
    setDocLoading(true);
    try {
      const data = await api('/api/docs/check', { method: 'POST', body: JSON.stringify({ text: docText }) });
      setDocResult(data);
    } catch (e) {
      setDocResult({ status: 'warn', issues: ['Demo: tekshiruv ishlamadi, qayta urinib ko‘ring.'] });
    } finally {
      setDocLoading(false);
    }
  };

  const runScholarship = async () => {
    setSchLoading(true);
    try {
      const data = await api('/api/scholarship/match', { method: 'POST', body: JSON.stringify({ portfolio, meta: { gpa: 3.6 } }) });
      setSchMatches(data.matches || []);
    } catch (e) {
      setSchMatches([]);
    } finally {
      setSchLoading(false);
    }
  };

  const runPlan = async () => {
    setPlanLoading(true);
    try {
      const data = await api('/api/plan/recommend', { method: 'POST', body: JSON.stringify({ persona: portfolio?.persona, track: portfolio?.track, interests: quizAnswers }) });
      setTermPlan(data.termPlan || []);
    } catch (e) {
      setTermPlan([]);
    } finally {
      setPlanLoading(false);
    }
  };

  const runTourQA = async () => {
    setTourLoading(true);
    try {
      const data = await api('/api/tour/qa', { method: 'POST', body: JSON.stringify({ query: tourQuery }) });
      setTourTs(data.timestamp);
      if (typeof data.timestamp === 'number') setTourUrl(`${tourBase}?start=${data.timestamp}`);
    } catch (e) {
      // ignore
    } finally {
      setTourLoading(false);
    }
  };

  const runSMM = async () => {
    setSmmLoading(true);
    try {
      const data = await api('/api/smm/generate', { method: 'POST', body: JSON.stringify({ theme: smmTheme, tone: smmTone }) });
      setSmmOut(data);
    } catch (e) {
      setSmmOut({ script: '', caption: '', hashtags: [] });
    } finally {
      setSmmLoading(false);
    }
  };

  const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
    const id = href.replace('#', '').replace('/', '');
    const isActive = !!active && !!id && active === id;
    return (
      <a href={href} className={`hover:text-indigo-700 ${isActive ? 'text-indigo-700 font-semibold' : 'text-gray-700'}`}>
        {children}
      </a>
    );
  };

  // ===== UI =====
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-white text-gray-900">
      {/* Navbar */}
      <nav className="sticky top-0 z-30 bg-white/70 backdrop-blur border-b border-black/5">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3 group">
            <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="2" y="2" width="20" height="20" rx="6" className="fill-indigo-600" />
              <path d="M7 15l5-6 5 6" className="stroke-white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="font-bold tracking-tight group-hover:text-indigo-700">{t('brand')}</span>
          </a>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6 text-sm">
            <NavLink href="#portfolio">{t('navPortfolio')}</NavLink>
            <NavLink href="#mentor">{t('navMentor')}</NavLink>
            <NavLink href="#communities">{t('navCommunities')}</NavLink>
            <NavLink href="#gamify">{t('navGamify')}</NavLink>
            <NavLink href="#tour">{t('navTour')}</NavLink>
            <NavLink href="#master">{t('navMaster')}</NavLink>
            <NavLink href="#admin">{t('navAdmin')}</NavLink>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            <div className="hidden md:flex rounded-xl border overflow-hidden">
              <button aria-label="UZ" onClick={() => setLang('uz')} className={`px-3 py-2 text-xs ${lang === 'uz' ? 'bg-indigo-600 text-white' : 'bg-white'}`}>UZ</button>
              <button aria-label="RU" onClick={() => setLang('ru')} className={`px-3 py-2 text-xs ${lang === 'ru' ? 'bg-indigo-600 text-white' : 'bg-white'}`}>RU</button>
            </div>
            <button onClick={() => signinRef.current?.showModal()} className="hidden md:inline px-4 py-2 rounded-xl border hover:shadow">{t('signIn')}</button>
            <button onClick={() => signupRef.current?.showModal()} className="hidden md:inline px-4 py-2 rounded-xl bg-indigo-600 text-white hover:shadow">{t('signUp')}</button>

            {/* Mobile menu */}
            <button onClick={() => setMobileOpen((v) => !v)} className="md:hidden inline-flex items-center justify-center h-10 w-10 rounded-xl border">
              <span className="sr-only">Menu</span>
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 6h16M4 12h16M4 18h16" strokeWidth="2" strokeLinecap="round" /></svg>
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="md:hidden border-t bg-white">
            <div className="px-4 py-3 flex gap-3">
              <button aria-label="UZ" onClick={() => setLang('uz')} className={`px-3 py-2 text-xs rounded-xl border ${lang === 'uz' ? 'bg-indigo-600 text-white' : 'bg-white'}`}>UZ</button>
              <button aria-label="RU" onClick={() => setLang('ru')} className={`px-3 py-2 text-xs rounded-xl border ${lang === 'ru' ? 'bg-indigo-600 text-white' : 'bg-white'}`}>RU</button>
            </div>
            <div className="px-4 pb-4 grid gap-2 text-sm">
              <a href="#portfolio" className="py-2">{t('navPortfolio')}</a>
              <a href="#mentor" className="py-2">{t('navMentor')}</a>
              <a href="#communities" className="py-2">{t('navCommunities')}</a>
              <a href="#gamify" className="py-2">{t('navGamify')}</a>
              <a href="#tour" className="py-2">{t('navTour')}</a>
              <a href="#master" className="py-2">{t('navMaster')}</a>
              <a href="#admin" className="py-2">{t('navAdmin')}</a>
              <div className="flex gap-2 pt-2">
                <button onClick={() => signinRef.current?.showModal()} className="flex-1 px-4 py-2 rounded-xl border">{t('signIn')}</button>
                <button onClick={() => signupRef.current?.showModal()} className="flex-1 px-4 py-2 rounded-xl bg-indigo-600 text-white">{t('signUp')}</button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <header className="mx-auto max-w-7xl px-4 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <p className="text-xs uppercase tracking-widest text-indigo-700 font-semibold">{t('tagline')}</p>
          <h1 className="mt-3 text-4xl md:text-5xl font-extrabold leading-tight">
            {t('heroTitle1')} <span className="text-indigo-700">{t('heroTitle2')}</span> {t('heroTitle3')}
          </h1>
          <p className="mt-4 text-gray-600 text-lg">{t('heroDesc')}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={openQuiz} className="px-5 py-3 rounded-xl bg-black text-white hover:shadow">{t('startPortfolio')}</button>
            <button onClick={openMentor} className="px-5 py-3 rounded-xl border hover:shadow">{t('talkMentor')}</button>
          </div>
          <div className="mt-6 flex flex-wrap gap-2 text-sm">
            <button onClick={openFAQ} className="px-3 py-1.5 rounded-lg border">{t('askAI')}</button>
            <button onClick={openDocs} className="px-3 py-1.5 rounded-lg border">{t('docsAI')}</button>
            <button onClick={openSch} className="px-3 py-1.5 rounded-lg border">{t('grantAI')}</button>
            <button onClick={openPlan} className="px-3 py-1.5 rounded-lg border">{t('planAI')}</button>
            <button onClick={openSMM} className="px-3 py-1.5 rounded-lg border">{t('smmAI')}</button>
            <button onClick={openTourQA} className="px-3 py-1.5 rounded-lg border">{t('tourAI')}</button>
          </div>
          <div className="mt-6 flex gap-6 text-sm text-gray-600">
            <div>⚙️ {t('modules')}</div>
            <div>🧠 {t('aiTips')}</div>
            <div>🎮 {t('badges')}</div>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -inset-4 bg-indigo-100/60 rounded-3xl blur-2xl" />
          <div className="relative rounded-3xl border bg-white p-6 shadow-sm">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="rounded-2xl border p-4">
                <div className="text-xs text-gray-500">{t('persona')}</div>
                <div className="mt-1 font-semibold">{portfolio?.persona || 'Analitik'}</div>
              </div>
              <div className="rounded-2xl border p-4">
                <div className="text-xs text-gray-500">{t('track')}</div>
                <div className="mt-1 font-semibold">{portfolio?.track || 'Data Science / AI'}</div>
              </div>
              <div className="rounded-2xl border p-4">
                <div className="text-xs text-gray-500">{t('team')}</div>
                <div className="mt-1 font-semibold">{portfolio?.community || 'CodeGalaxy'}</div>
              </div>
              <div className="rounded-2xl border p-4">
                <div className="text-xs text-gray-500">{t('plan')}</div>
                <div className="mt-1 font-semibold">{portfolio?.plan || 'Kurs → Loyiha → Pitch'}</div>
              </div>
            </div>
            <div className="mt-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-400 text-white p-4">
              <div className="text-sm">{t('mentor')}</div>
              <p className="mt-1 text-sm opacity-90">“Integral — ∫ x dx = x²/2 + C.”</p>
              <div className="mt-3 flex gap-2">
                <div className="h-2 flex-1 rounded bg-white/40" />
                <div className="h-2 w-10 rounded bg-white/80" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Portfolio features */}
      <section id="portfolio" className="mx-auto max-w-7xl px-4 py-10">
        <h2 className="text-2xl md:text-3xl font-bold">{t('portfolioTitle')}</h2>
        <p className="mt-2 text-gray-600">{t('portfolioDesc')}</p>
        <div className="mt-6 grid md:grid-cols-4 gap-4">
          {[
            { title: t('qTest'), desc: t('qTestDesc') },
            { title: t('pType'), desc: t('pTypeDesc') },
            { title: t('pTrack'), desc: t('pTrackDesc') },
            { title: t('pPlan'), desc: t('pPlanDesc') },
          ].map((f, i) => (
            <div key={i} className="rounded-2xl border p-5 bg-white hover:shadow-sm transition">
              <div className="text-indigo-700 text-sm">★</div>
              <div className="mt-2 font-semibold">{f.title}</div>
              <div className="text-sm text-gray-600">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Mentor */}
      <section id="mentor" className="mx-auto max-w-7xl px-4 py-10">
        <h2 className="text-2xl md:text-3xl font-bold">{t('mentorTitle')}</h2>
        <p className="mt-2 text-gray-600">{t('mentorDesc')}</p>
        <div className="mt-6 grid md:grid-cols-3 gap-4">
          {[t('mMath'), t('mCode'), t('mExam')].map((txt, i) => (
            <div key={i} className="rounded-2xl border p-5 bg-white">
              <div className="text-indigo-700 text-sm">●</div>
              <div className="mt-2 font-semibold">{txt}</div>
              <p className="text-sm text-gray-600">AI yordamida tezkor va aniq javoblar.</p>
            </div>
          ))}
        </div>
      </section>

      {/* Communities */}
      <section id="communities" className="mx-auto max-w-7xl px-4 py-10">
        <h2 className="text-2xl md:text-3xl font-bold">{t('commTitle')}</h2>
        <p className="mt-2 text-gray-600">{t('commDesc')}</p>
        <div className="mt-6 grid md:grid-cols-5 gap-4">
          {communities.map((c, i) => (
            <div key={i} className={`rounded-2xl p-5 border ${c.color}`}>
              <div className="text-xs text-gray-500">{lang === 'uz' ? 'Jamoa' : 'Команда'}</div>
              <div className="font-semibold">{c.name}</div>
              <div className="text-sm text-gray-600">{c.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Gamification */}
      <section id="gamify" className="mx-auto max-w-7xl px-4 py-10">
        <h2 className="text-2xl md:text-3xl font-bold">{t('gamifyTitle')}</h2>
        <p className="mt-2 text-gray-600">{t('gamifyDesc')}</p>
        <div className="mt-6 grid md:grid-cols-3 gap-4">
          <div className="rounded-2xl border bg-white p-5">
            <div className="font-semibold mb-2">Level {xp.level} — Explorer</div>
            <div className="h-2 w-full rounded bg-gray-100 overflow-hidden">
              <div className="h-full" style={{ width: `${Math.min(100, (xp.current / xp.target) * 100)}%`, background: 'rgb(79,70,229)' }} />
            </div>
            <div className="mt-2 text-xs text-gray-500">{xp.current}/{xp.target} XP</div>
            <div className="mt-4 text-sm text-gray-600">Keyingi badge: <span className="font-medium">{xp.nextBadge}</span></div>
          </div>
          <div className="rounded-2xl border bg-white p-5">
            <div className="font-semibold mb-3">Badge’lar</div>
            <div className="flex flex-wrap gap-2">
              {(earnedBadges?.length ? earnedBadges : ['Starter', 'Quiz Master', 'Mentor Talk', 'Tourist']).map((b, i) => (
                <span key={i} className="px-3 py-1 text-xs rounded-full border">{b}</span>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border bg-white p-5">
            <div className="font-semibold mb-3">{t('mission')}</div>
            <ul className="space-y-2 text-sm">
              {(missions?.length
                ? missions
                : [
                    { m: t('m1'), b: '+10', s: t('notStarted') },
                    { m: t('m2'), b: '+20', s: t('inProgress') },
                    { m: t('m3'), b: '+15', s: t('done') },
                    { m: t('m4'), b: '+50', s: t('notStarted') },
                  ]
              ).map((r, i) => (
                <li key={i} className="flex items-center justify-between rounded-xl border px-3 py-2">
                  <span>{r.m}</span>
                  <span className="text-xs text-gray-500">{r.b} · {r.s}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Tour */}
      <section id="tour" className="mx-auto max-w-7xl px-4 py-10">
        <h2 className="text-2xl md:text-3xl font-bold">{t('tourTitle')}</h2>
        <p className="mt-2 text-gray-600">{t('tourDesc')}</p>
        <div className="mt-6 rounded-3xl border bg-white overflow-hidden">
          <iframe title="ATMU Virtual Tour" src={tourUrl} className="w-full aspect-video" allowFullScreen />
        </div>
      </section>

      {/* Master-classes */}
      <section id="master" className="mx-auto max-w-7xl px-4 py-10">
        <h2 className="text-2xl md:text-3xl font-bold">{t('masterTitle')}</h2>
        <p className="mt-2 text-gray-600">{t('masterDesc')}</p>
        <div className="mt-6 grid md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border bg-white p-4">
              <div className="aspect-video rounded-xl bg-gray-100 grid place-items-center text-gray-500">Video {i}</div>
              <div className="mt-2 font-semibold">Master‑klass sarlavhasi</div>
              <div className="text-sm text-gray-600">Qisqa ta’rif va asosiy natijalar.</div>
            </div>
          ))}
        </div>
      </section>

      {/* Dev tests (basic runtime checks for API) */}
      <section id="admin" className="mx-auto max-w-7xl px-4 py-10">
        <details className="rounded-2xl border bg-white p-4 text-sm">
          <summary className="cursor-pointer font-semibold">Dev: Self‑tests</summary>
          <div id="dev-tests" className="mt-3 grid md:grid-cols-2 gap-3">
            <div className="rounded-xl border p-3">
              <div className="font-medium">/api/user/points</div>
              <pre className="text-xs text-gray-600">Kutilgan: {'{current,target,level,nextBadge}'}</pre>
            </div>
            <div className="rounded-xl border p-3">
              <div className="font-medium">/api/badges</div>
              <pre className="text-xs text-gray-600">Kutilgan: {'string[]'}</pre>
            </div>
            <div className="rounded-xl border p-3">
              <div className="font-medium">/api/missions</div>
              <pre className="text-xs text-gray-600">Kutilgan: {'{m,b,s}[]'}</pre>
            </div>
            <div className="rounded-xl border p-3">
              <div className="font-medium">POST /portfolio/analyze</div>
              <pre className="text-xs text-gray-600">Kutilgan: {'{persona,track,community,plan}'}</pre>
            </div>
            <div className="rounded-xl border p-3 md:col-span-2">
              <div className="font-medium">POST /mentor/chat</div>
              <pre className="text-xs text-gray-600">Kutilgan: {'{reply}'}</pre>
            </div>
            {/* New module tests (visible) */}
            <div className="rounded-xl border p-3">
              <div className="font-medium">POST /api/faq/search</div>
              <pre className="text-xs text-gray-600">Kutilgan: {'{answer,sources[]}'}</pre>
            </div>
            <div className="rounded-xl border p-3">
              <div className="font-medium">POST /api/docs/check</div>
              <pre className="text-xs text-gray-600">Kutilgan: {'{status,issues[]}'}</pre>
            </div>
            <div className="rounded-xl border p-3">
              <div className="font-medium">POST /api/scholarship/match</div>
              <pre className="text-xs text-gray-600">Kutilgan: {'{matches[]}'}</pre>
            </div>
            <div className="rounded-xl border p-3">
              <div className="font-medium">POST /api/plan/recommend</div>
              <pre className="text-xs text-gray-600">Kutilgan: {'{termPlan[]}'}</pre>
            </div>
            <div className="rounded-xl border p-3">
              <div className="font-medium">POST /api/tour/qa</div>
              <pre className="text-xs text-gray-600">Kutilgan: {'{answer,timestamp}'}</pre>
            </div>
            <div className="rounded-xl border p-3">
              <div className="font-medium">POST /api/smm/generate</div>
              <pre className="text-xs text-gray-600">Kutilgan: {'{script,caption,hashtags[]}'}</pre>
            </div>
          </div>
        </details>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="rounded-3xl border bg-gradient-to-r from-indigo-600 to-indigo-400 text-white p-8 md:p-12 grid md:grid-cols-2 gap-6 items-center">
          <div>
            <h3 className="text-2xl md:text-3xl font-bold">{t('ctaTitle')}</h3>
            <p className="mt-2 opacity-90">{t('ctaDesc')}</p>
          </div>
          <div className="flex md:justify-end gap-3">
            <button onClick={openQuiz} className="px-5 py-3 rounded-xl bg-black text-white">AI‑Portfolio</button>
            <button onClick={openMentor} className="px-5 py-3 rounded-xl bg-white text-indigo-700">AI Mentor</button>
          </div>
        </div>
      </section>

      {/* === Dialogs === */}
      {/* Quiz (AI‑Portfolio) */}
      <dialog ref={quizRef} className="rounded-2xl backdrop:bg-black/30 p-0 w-[560px] max-w-[95vw]">
        <form method="dialog" className="p-6 grid gap-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-bold">{t('portfolioTitle')}</h4>
            <button className="px-3 py-1 text-sm rounded-lg border">✕</button>
          </div>
          <p className="text-sm text-gray-600">{t('portfolioDesc')}</p>

          <label className="grid gap-1 text-sm">
            <span>1) Qaysi yo‘nalish sizni ko‘proq qiziqtiradi?</span>
            <select
              value={quizAnswers.q1}
              onChange={(e)=>setQuizAnswers(v=>({ ...v, q1: e.target.value }))}
              className="px-3 py-2 rounded-xl border"
              required
            >
              <option value="">Tanlang…</option>
              <option>Matematika / Data</option>
              <option>Robototexnika</option>
              <option>Marketing / Menejment</option>
              <option>Dizayn / UI‑UX</option>
            </select>
          </label>

          <label className="grid gap-1 text-sm">
            <span>2) Hozirgi ko‘nikmalaringiz?</span>
            <input
              value={quizAnswers.q2}
              onChange={(e)=>setQuizAnswers(v=>({ ...v, q2: e.target.value }))}
              placeholder="Masalan: Python, Arduino, Photoshop…"
              className="px-3 py-2 rounded-xl border"
            />
          </label>

          <label className="grid gap-1 text-sm">
            <span>3) 6 oyda qanday natijaga yetmoqchisiz?</span>
            <input
              value={quizAnswers.q3}
              onChange={(e)=>setQuizAnswers(v=>({ ...v, q3: e.target.value }))}
              placeholder="Masalan: portfel loyiham bo‘lsin, internship topay…"
              className="px-3 py-2 rounded-xl border"
            />
          </label>

          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-gray-500">Demo rejim: javoblar AI orqali tahlil qilinadi</div>
            <div className="flex gap-2">
              <button className="px-4 py-2 rounded-xl border">Bekor qilish</button>
              <button
                type="button"
                onClick={submitQuiz}
                disabled={quizLoading}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white disabled:opacity-60"
              >{quizLoading ? 'Yuborilyapti…' : 'Natijani ko‘rish'}</button>
            </div>
          </div>

          {portfolio && (
            <div className="mt-3 rounded-2xl border p-4 bg-indigo-50">
              <div className="text-sm text-indigo-700 font-semibold">Tavsiyalar</div>
              <div className="mt-2 grid md:grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">{t('persona')}: </span><span className="font-medium">{portfolio.persona}</span></div>
                <div><span className="text-gray-500">{t('track')}: </span><span className="font-medium">{portfolio.track}</span></div>
                <div><span className="text-gray-500">{t('team')}: </span><span className="font-medium">{portfolio.community}</span></div>
                <div><span className="text-gray-500">{t('plan')}: </span><span className="font-medium">{portfolio.plan}</span></div>
              </div>
            </div>
          )}
        </form>
      </dialog>

      {/* Mentor chat */}
      <dialog ref={mentorRef} className="rounded-2xl backdrop:bg-black/30 p-0 w-[720px] max-w-[95vw]">
        <form method="dialog" className="p-0">
          <div className="p-4 border-b flex items-center justify-between">
            <h4 className="text-lg font-bold">{t('mentorTitle')}</h4>
            <button className="px-3 py-1 text-sm rounded-lg border">✕</button>
          </div>
          <div className="p-4 max-h-[60vh] overflow-auto space-y-2 bg-white">
            {chat.length === 0 && (
              <div className="text-sm text-gray-500">Savol yozing: “Integral nima?”, “Python xatosi”, “SLAM nima?”</div>
            )}
            {chat.map((m, i)=> (
              <div key={i} className={`flex ${m.role==='user'?'justify-end':'justify-start'}`}>
                <div className={`rounded-2xl px-3 py-2 text-sm max-w-[80%] ${m.role==='user'?'bg-indigo-600 text-white':'bg-gray-100'}`}>{m.content}</div>
              </div>
            ))}
          </div>
          <div className="p-3 border-t flex items-center gap-2">
            <input
              value={chatInput}
              onChange={(e)=>setChatInput(e.target.value)}
              onKeyDown={(e:any)=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); sendChat(); } }}
              placeholder="Savolingizni yozing…"
              className="flex-1 px-3 py-2 rounded-xl border"
            />
            <button
              type="button"
              onClick={sendChat}
              disabled={chatLoading || !chatInput.trim()}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white disabled:opacity-60"
            >{chatLoading ? 'Yuborilmoqda…' : 'Yuborish'}</button>
          </div>
        </form>
      </dialog>

      {/* FAQ AI */}
      <dialog ref={faqRef} className="rounded-2xl backdrop:bg-black/30 p-0 w-[720px] max-w-[95vw]">
        <form method="dialog" className="p-6 grid gap-3">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-bold">{t('askAI')}</h4>
            <button className="px-3 py-1 text-sm rounded-lg border">✕</button>
          </div>
          <input value={faqQuery} onChange={(e)=>setFaqQuery(e.target.value)} className="px-3 py-2 rounded-xl border" placeholder="Savolingiz…" />
          <div className="flex gap-2 justify-end">
            <button className="px-4 py-2 rounded-xl border">Bekor</button>
            <button type="button" onClick={askFAQ} disabled={faqLoading} className="px-4 py-2 rounded-xl bg-indigo-600 text-white disabled:opacity-60">{faqLoading?'Qidirilmoqda…':'Javob olish'}</button>
          </div>
          {faqAnswer && (
            <div className="rounded-xl border p-3 bg-white">
              <div className="text-sm">{faqAnswer.answer}</div>
              <div className="mt-2 text-xs text-gray-500">Manbalar:</div>
              <ul className="text-xs list-disc pl-5">
                {faqAnswer.sources.map((s,i)=> (<li key={i}><a className="underline" href={s.url}>{s.title}</a></li>))}
              </ul>
            </div>
          )}
        </form>
      </dialog>

      {/* Docs check */}
      <dialog ref={docsRef} className="rounded-2xl backdrop:bg-black/30 p-0 w-[720px] max-w-[95vw]">
        <form method="dialog" className="p-6 grid gap-3">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-bold">{t('docsAI')}</h4>
            <button className="px-3 py-1 text-sm rounded-lg border">✕</button>
          </div>
          <textarea value={docText} onChange={(e)=>setDocText(e.target.value)} className="px-3 py-2 rounded-xl border min-h-[120px]" />
          <div className="flex gap-2 justify-end">
            <button className="px-4 py-2 rounded-xl border">Bekor</button>
            <button type="button" onClick={checkDocs} disabled={docLoading} className="px-4 py-2 rounded-xl bg-indigo-600 text-white disabled:opacity-60">{docLoading?'Tekshirilmoqda…':'Tekshirish'}</button>
          </div>
          {docResult && (
            <div className={`rounded-xl border p-3 ${docResult.status==='ok'?'bg-green-50':docResult.status==='warn'?'bg-amber-50':'bg-red-50'}`}>
              <div className="font-medium text-sm">Holat: {docResult.status.toUpperCase()}</div>
              <ul className="mt-2 text-sm list-disc pl-5">
                {docResult.issues.map((x,i)=>(<li key={i}>{x}</li>))}
              </ul>
            </div>
          )}
        </form>
      </dialog>

      {/* Scholarship */}
      <dialog ref={schRef} className="rounded-2xl backdrop:bg-black/30 p-0 w-[720px] max-w-[95vw]">
        <form method="dialog" className="p-6 grid gap-3">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-bold">{t('grantAI')}</h4>
            <button className="px-3 py-1 text-sm rounded-lg border">✕</button>
          </div>
          <div className="text-sm text-gray-600">Portfolio asosida mos grantlarni topish.</div>
          <div className="flex gap-2 justify-end">
            <button className="px-4 py-2 rounded-xl border">Bekor</button>
            <button type="button" onClick={runScholarship} disabled={schLoading} className="px-4 py-2 rounded-xl bg-indigo-600 text-white disabled:opacity-60">{schLoading?'Moslashtirilmoqda…':'Mos grantlar'}</button>
          </div>
          {schMatches.length>0 && (
            <ul className="grid gap-2 text-sm">
              {schMatches.map((m,i)=> (
                <li key={i} className="rounded-xl border p-3 flex items-center justify-between">
                  <span>{m.title}</span>
                  <span className="text-xs text-gray-500">Skor: {(m.score*100).toFixed(0)}%</span>
                </li>
              ))}
            </ul>
          )}
        </form>
      </dialog>

      {/* Plan */}
      <dialog ref={planRef} className="rounded-2xl backdrop:bg-black/30 p-0 w-[720px] max-w-[95vw]">
        <form method="dialog" className="p-6 grid gap-3">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-bold">{t('planAI')}</h4>
            <button className="px-3 py-1 text-sm rounded-lg border">✕</button>
          </div>
          <div className="text-sm text-gray-600">AI asosida semestr bo‘yicha kurs reja.</div>
          <div className="flex gap-2 justify-end">
            <button className="px-4 py-2 rounded-xl border">Bekor</button>
            <button type="button" onClick={runPlan} disabled={planLoading} className="px-4 py-2 rounded-xl bg-indigo-600 text-white disabled:opacity-60">{planLoading?'Yaratilmoqda…':'Reja yaratish'}</button>
          </div>
          {termPlan.length>0 && (
            <table className="w-full text-sm mt-2">
              <thead>
                <tr className="text-left text-gray-500"><th className="py-1">Kurs</th><th className="py-1">ECTS</th></tr>
              </thead>
              <tbody>
                {termPlan.map((r,i)=> (
                  <tr key={i} className="border-t"><td className="py-1">{r.course}</td><td className="py-1">{r.ects}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </form>
      </dialog>

      {/* SMM */}
      <dialog ref={smmRef} className="rounded-2xl backdrop:bg-black/30 p-0 w-[720px] max-w-[95vw]">
        <form method="dialog" className="p-6 grid gap-3">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-bold">{t('smmAI')}</h4>
            <button className="px-3 py-1 text-sm rounded-lg border">✕</button>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <input value={smmTheme} onChange={(e)=>setSmmTheme(e.target.value)} className="px-3 py-2 rounded-xl border" placeholder="Mavzu (masalan: student life)" />
            <input value={smmTone} onChange={(e)=>setSmmTone(e.target.value)} className="px-3 py-2 rounded-xl border" placeholder="Usul (masalan: energetic)" />
          </div>
          <div className="flex gap-2 justify-end">
            <button className="px-4 py-2 rounded-xl border">Bekor</button>
            <button type="button" onClick={runSMM} disabled={smmLoading} className="px-4 py-2 rounded-xl bg-indigo-600 text-white disabled:opacity-60">{smmLoading?'Yaratilmoqda…':'Kontent yaratish'}</button>
          </div>
          {smmOut && (
            <div className="grid gap-2 text-sm">
              <div className="rounded-xl border p-3 bg-white">
                <div className="font-medium">Script</div>
                <div className="text-gray-700 mt-1 whitespace-pre-wrap">{smmOut.script}</div>
              </div>
              <div className="rounded-xl border p-3 bg-white">
                <div className="font-medium">Caption</div>
                <div className="text-gray-700 mt-1">{smmOut.caption}</div>
                <div className="text-xs text-gray-500 mt-1">{smmOut.hashtags.join(' ')}</div>
              </div>
            </div>
          )}
        </form>
      </dialog>

      {/* Tour Q&A */}
      <dialog ref={tourQaRef} className="rounded-2xl backdrop:bg-black/30 p-0 w-[720px] max-w-[95vw]">
        <form method="dialog" className="p-6 grid gap-3">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-bold">{t('tourAI')}</h4>
            <button className="px-3 py-1 text-sm rounded-lg border">✕</button>
          </div>
          <input value={tourQuery} onChange={(e)=>setTourQuery(e.target.value)} className="px-3 py-2 rounded-xl border" placeholder="Savol (masalan: lab qayerda?)" />
          <div className="flex gap-2 justify-end">
            <button className="px-4 py-2 rounded-xl border">Bekor</button>
            <button type="button" onClick={runTourQA} disabled={tourLoading} className="px-4 py-2 rounded-xl bg-indigo-600 text-white disabled:opacity-60">{tourLoading?'Qidirilmoqda…':'Javob'}</button>
          </div>
          {typeof tourTs === 'number' && (
            <div className="text-sm text-gray-700">Video start: {tourTs}s — <a className="underline" href={tourUrl}>ko‘rish</a></div>
          )}
        </form>
      </dialog>

      {/* Footer */}
      <footer className="border-t border-black/5">
        <div className="mx-auto max-w-7xl px-4 py-8 text-sm text-gray-600 flex flex-col md:flex-row items-center justify-between gap-3">
          <div>© {new Date().getFullYear()} ATMU ONE. {t('footerCopy')}</div>
          <div className="flex gap-4">
            <a className="hover:text-indigo-700" href="#">{t('privacy')}</a>
            <a className="hover:text-indigo-700" href="#">{t('terms')}</a>
            <a className="hover:text-indigo-700" href="#">{t('contact')}</a>
          </div>
        </div>
      </footer>

      {/* Auth dialogs */}
      <dialog ref={signinRef} className="rounded-2xl backdrop:bg-black/30 p-0 w-[420px] max-w-[92vw]">
        <form method="dialog" className="p-6 grid gap-3">
          <h4 className="text-lg font-bold">{t('signIn')}</h4>
          <input name="email" type="email" required placeholder={t('email')} className="px-3 py-2 rounded-xl border" />
          <input name="password" type="password" placeholder={t('password')} className="px-3 py-2 rounded-xl border" />
          <div className="flex gap-2 justify-end">
            <button className="px-4 py-2 rounded-xl border">Cancel</button>
            <a href="/api/auth/signin" className="px-4 py-2 rounded-xl bg-indigo-600 text-white">{t('login')}</a>
          </div>
        </form>
      </dialog>

      <dialog ref={signupRef} className="rounded-2xl backdrop:bg-black/30 p-0 w-[420px] max-w-[92vw]">
        <form method="dialog" className="p-6 grid gap-3">
          <h4 className="text-lg font-bold">{t('signUp')}</h4>
          <input name="email" type="email" required placeholder={t('email')} className="px-3 py-2 rounded-xl border" />
          <input name="password" type="password" placeholder={t('password')} className="px-3 py-2 rounded-xl border" />
          <div className="flex gap-2 justify-end">
            <button className="px-4 py-2 rounded-xl border">Cancel</button>
            <a href="/api/auth/signin/email" className="px-4 py-2 rounded-xl bg-indigo-600 text-white">{t('register')}</a>
          </div>
        </form>
      </dialog>
    </div>
  );
}
