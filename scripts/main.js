(function () {
  const body = document.body;
  const slowLoadDelay = 700;
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  let pageLoaded = document.readyState === 'complete';
  let slowLoadTimer = 0;

  function hasConnection() {
    return !('onLine' in navigator) || navigator.onLine;
  }

  function isLikelySlowConnection() {
    if (!connection) return false;
    const effectiveType = connection.effectiveType || '';
    return connection.saveData || effectiveType.includes('2g') || Number(connection.downlink) < 1.2;
  }

  function clearSlowLoadTimer() {
    if (!slowLoadTimer) return;
    window.clearTimeout(slowLoadTimer);
    slowLoadTimer = 0;
  }

  function startSlowLoadTimer() {
    clearSlowLoadTimer();
    if (pageLoaded || !hasConnection()) return;

    const delay = isLikelySlowConnection() ? 120 : slowLoadDelay;
    slowLoadTimer = window.setTimeout(() => {
      if (!pageLoaded && hasConnection()) {
        body.classList.add('show-loader');
      }
    }, delay);
  }

  function syncConnectionState() {
    if (!hasConnection()) {
      clearSlowLoadTimer();
      body.classList.add('is-offline');
      body.classList.remove('show-loader');
      return;
    }

    body.classList.remove('is-offline');
    if (pageLoaded) {
      body.classList.remove('show-loader');
    } else {
      startSlowLoadTimer();
    }
  }

  function finishLoading() {
    pageLoaded = true;
    clearSlowLoadTimer();
    body.classList.remove('show-loader');
    syncConnectionState();
  }

  window.addEventListener('online', syncConnectionState);
  window.addEventListener('offline', syncConnectionState);
  if (connection && connection.addEventListener) {
    connection.addEventListener('change', syncConnectionState);
  }

  if (pageLoaded) {
    finishLoading();
  } else {
    window.addEventListener('load', finishLoading, { once: true });
    syncConnectionState();
  }
})();

(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealItems = Array.from(document.querySelectorAll('.section, .focus-item, .project-card, .timeline-item, .stack-card, .contact-card'));
  const scrollProgress = document.getElementById('scrollProgress');
  const navLinks = Array.from(document.querySelectorAll('.nav-links a[href^="#"]'));
  const mainNavTargets = ['about', 'projects', 'timeline']
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  let clickedNavUntil = 0;

  function setActiveNav(id) {
    navLinks.forEach((link) => {
      link.classList.toggle('active', link.getAttribute('href') === '#' + id);
    });
  }

  function updateActiveNav() {
    if (Date.now() < clickedNavUntil || !mainNavTargets.length) return;

    const aboutTop = mainNavTargets[0].offsetTop;
    const probe = window.scrollY + Math.min(window.innerHeight * 0.42, 380);
    let activeId = window.scrollY < aboutTop - 180 ? '' : mainNavTargets[0].id;

    mainNavTargets.forEach((target) => {
      if (probe >= target.offsetTop) activeId = target.id;
    });

    setActiveNav(activeId);
  }

  let scrollTicking = false;
  function updateScrollEffects() {
    const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    const progress = Math.min(window.scrollY / maxScroll, 1);

    if (scrollProgress) {
      scrollProgress.style.transform = `scaleX(${progress})`;
    }

    if (!reduceMotion) {
      const heroShift = Math.min(window.scrollY * 0.045, 30);
      const systemShift = Math.max(window.scrollY * -0.026, -22);
      document.documentElement.style.setProperty('--hero-shift', heroShift.toFixed(2) + 'px');
      document.documentElement.style.setProperty('--system-shift', systemShift.toFixed(2) + 'px');
    }

    updateActiveNav();
    scrollTicking = false;
  }

  function requestScrollUpdate() {
    if (scrollTicking) return;
    scrollTicking = true;
    window.requestAnimationFrame(updateScrollEffects);
  }

  window.addEventListener('scroll', requestScrollUpdate, { passive: true });
  window.addEventListener('resize', requestScrollUpdate);
  requestScrollUpdate();

  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      const id = link.getAttribute('href').slice(1);
      setActiveNav(id);
      clickedNavUntil = Date.now() + 1400;
    });
  });

  revealItems.forEach((item, index) => {
    item.classList.add('motion-item');
    item.style.transitionDelay = Math.min((index % 5) * 70, 280) + 'ms';
  });

  if (reduceMotion) {
    revealItems.forEach((item) => {
      item.classList.add('in-view');
      item.style.transitionDelay = '';
    });
  } else if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in-view');
        window.setTimeout(() => { entry.target.style.transitionDelay = ''; }, 1100);
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => {
      item.classList.add('in-view');
      item.style.transitionDelay = '';
    });
  }

  if (reduceMotion) return;

  const cursorRing = document.getElementById('cursorRing');
  const canUseCursor = cursorRing && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (canUseCursor) {
    let targetX = -100;
    let targetY = -100;
    let currentX = -100;
    let currentY = -100;

    function renderCursor() {
      currentX += (targetX - currentX) * 0.18;
      currentY += (targetY - currentY) * 0.18;
      cursorRing.style.setProperty('--cursor-x', currentX.toFixed(2) + 'px');
      cursorRing.style.setProperty('--cursor-y', currentY.toFixed(2) + 'px');
      window.requestAnimationFrame(renderCursor);
    }

    window.addEventListener('pointermove', (event) => {
      targetX = event.clientX;
      targetY = event.clientY;
      cursorRing.classList.add('active');
    }, { passive: true });

    window.addEventListener('pointerleave', () => {
      cursorRing.classList.remove('active');
    });

    document.querySelectorAll('a, button, .project-card, .tool').forEach((item) => {
      item.addEventListener('pointerenter', () => cursorRing.classList.add('hovering'));
      item.addEventListener('pointerleave', () => cursorRing.classList.remove('hovering'));
    });

    renderCursor();
  }

  const tiltCards = Array.from(document.querySelectorAll('.intro-photo, .project-card, .system-card, .stack-card, .contact-card'));
  tiltCards.forEach((card) => {
    card.classList.add('tilt-ready');

    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      const rotateX = (-y * 5).toFixed(2);
      const rotateY = (x * 5).toFixed(2);
      card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });

    card.addEventListener('pointerleave', () => {
      card.style.transform = '';
    });
  });

  const magneticItems = Array.from(document.querySelectorAll('.btn, .text-link, .topic-chip, .tool'));
  magneticItems.forEach((item) => {
    item.classList.add('magnetic');

    item.addEventListener('pointermove', (event) => {
      const rect = item.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      item.style.transform = `translate(${x * 0.08}px, ${y * 0.12}px)`;
    });

    item.addEventListener('pointerleave', () => {
      item.style.transform = '';
    });
  });
})();

(function () {
  const I18N = {
    en: {
      htmlLang: 'en',
      short: 'EN',
      pageTitle: 'Sam Yujoco - Technology Portfolio',
      navAbout: 'About',
      navProjects: 'Projects',
      navPath: 'Path',
      navStack: 'Stack',
      navContact: 'Contact',
      heroRole: 'ICT Student + Developer',
      status: 'Open to internships',
      lead: '18-year-old from <strong>Mindanao, Philippines</strong>, studying ICT at <strong>STI Colleges</strong>. I build web apps, school systems, and practical tools that turn real problems into working technology.',
      viewProjects: 'View projects',
      contactMe: 'Contact me',
      yearsOld: 'Years old',
      featuredBuilds: 'Featured builds',
      toolsInStack: 'Tools in stack',
      profile: 'Profile',
      available: 'available',
      nameLabel: 'Name',
      schoolLabel: 'School',
      locationLabel: 'Location',
      openToLabel: 'Open to',
      openToValue: 'Internship / Collaboration',
      lookingFor: 'What I am looking for',
      realUse: 'Technology with real use',
      story: 'I am building toward a future in <strong>government or enterprise IT</strong>, where software has to be reliable, useful, and clear for the people using it. I started with basic HTML pages and kept moving into web apps, school systems, databases, and frontend experiences that actually work.',
      focus1Title: 'School systems',
      focus1Body: 'Digital tools for attendance, records, reports, and workflows that replace slow manual processes.',
      focus2Title: 'Web applications',
      focus2Body: 'Responsive interfaces with clean layouts, useful interactions, and practical deployment.',
      focus3Title: 'Data-driven tools',
      focus3Body: 'Apps powered by APIs, databases, and real-time information for faster decisions.',
      featuredProjects: 'Featured projects',
      selectedBuilds: 'What have I been doing',
      live: 'Live',
      build: 'Build',
      deployed: 'Deployed',
      inDevelopment: 'In development',
      openSite: 'Open site',
      eqDesc: 'Real-time earthquake monitoring app that shows live seismic activity through API data, helping users track earthquakes as they happen.',
      finDesc: 'A financial web application with a clean interface for viewing and managing financial data, built with a practical web stack and deployed on Vercel.',
      timeDesc: 'A personal web app for storing memories, notes, and moments over time. It is still being refined as a long-term personal product idea.',
      libDesc: 'A digital check-in and check-out system for the school library, replacing paper logbooks with faster lookup, cleaner records, and instant attendance reporting.',
      pathTitle: 'Path',
      pathSub: 'Learning, building, improving',
      timeline1Title: 'ICT Student',
      timeline1Meta: 'STI Colleges Philippines / Current',
      timeline1Body: 'Studying ICT while building practical projects on the side, with focus on frontend, backend basics, databases, and real-world school systems.',
      timeline2Title: 'Developer and Builder',
      timeline2Meta: 'Personal projects / Ongoing',
      timeline2Body: 'Building deployed web apps like EQ Monitor and Finexus RL, then improving them through better UI, API handling, and responsive design.',
      timeline3Title: 'School System Projects',
      timeline3Meta: 'Library tools / In progress',
      timeline3Body: 'Working on digital tools that reduce manual work, improve record accuracy, and give school staff faster access to important information.',
      techStack: 'Tech stack',
      tools: 'tools',
      stackNote: 'Comfortable with HTML, CSS, JavaScript, PHP, Java, MySQL, Git, GitHub, Vercel, Firebase, React, and React Native basics.',
      contact: 'Contact',
      message: 'message',
      topicInternship: 'Internship',
      topicProject: 'Project',
      topicCollab: 'Collab',
      topicTech: 'Tech talk',
      subjectPrefix: 'Subject: ',
      sendEmail: 'Send email',
      copyEmail: 'Copy email',
      copied: 'Copied',
      openGithub: 'Open GitHub',
      footerBuilt: 'Built for future innovation.',
      typeLines: [
        'For future innovation.',
        'Made with creativity and passion.',
        'Building useful systems.',
        'Designing technology for real people.',
        'Learning one project at a time.',
        'Turning ideas into working apps.'
      ],
      messages: {
        internship: { subject: 'Internship opportunity', body: 'Hi Sam, I saw your portfolio and wanted to talk about an internship opportunity.' },
        project: { subject: 'Project inquiry', body: 'Hi Sam, I have a project idea and wanted to see if we can build something useful together.' },
        collab: { subject: 'Collaboration idea', body: 'Hi Sam, I like your work and wanted to explore a possible collaboration.' },
        tech: { subject: 'Tech talk', body: 'Hi Sam, I wanted to connect and talk about web development, school systems, or IT.' }
      }
    },
    zh: {
      htmlLang: 'zh-CN',
      short: '中文',
      pageTitle: 'Sam Yujoco - 技术作品集',
      navAbout: '关于',
      navProjects: '项目',
      navPath: '路径',
      navStack: '技术栈',
      navContact: '联系',
      heroRole: 'ICT 学生 + 开发者',
      status: '开放实习机会',
      lead: '来自<strong>菲律宾棉兰老岛</strong>的 18 岁 ICT 学生，就读于 <strong>STI Colleges</strong>。我构建网页应用、校园系统和实用工具，把真实问题转化为可运行的技术方案。',
      viewProjects: '查看项目',
      contactMe: '联系我',
      yearsOld: '岁',
      featuredBuilds: '精选作品',
      toolsInStack: '技术工具',
      profile: '个人资料',
      available: '可联系',
      nameLabel: '姓名',
      schoolLabel: '学校',
      locationLabel: '位置',
      openToLabel: '开放',
      openToValue: '实习 / 合作',
      lookingFor: '我正在寻找什么',
      realUse: '真正有用的技术',
      story: '我正在朝着<strong>政府或企业 IT</strong> 的方向前进，希望软件可靠、实用，并且对使用者清晰友好。我从基础 HTML 页面开始，逐步构建网页应用、校园系统、数据库和真正可用的前端体验。',
      focus1Title: '校园系统',
      focus1Body: '用于考勤、记录、报表和流程的数字工具，取代缓慢的人工操作。',
      focus2Title: '网页应用',
      focus2Body: '响应式界面，清晰布局、实用交互，并能稳定部署。',
      focus3Title: '数据驱动工具',
      focus3Body: '由 API、数据库和实时信息驱动的应用，帮助更快做决定。',
      featuredProjects: '精选项目',
      selectedBuilds: '我一直在做什么',
      live: '线上',
      build: '开发',
      deployed: '已部署',
      inDevelopment: '开发中',
      openSite: '打开网站',
      eqDesc: '实时地震监测应用，通过 API 数据展示最新地震活动，帮助用户追踪正在发生的地震。',
      finDesc: '一个金融网页应用，提供简洁界面来查看和管理金融数据，使用实用的 Web 技术栈并部署在 Vercel。',
      timeDesc: '用于保存回忆、笔记和重要时刻的个人网页应用，仍在持续打磨为长期产品想法。',
      libDesc: '校园图书馆数字签到签退系统，用更快的查询、清晰记录和即时考勤报表取代纸质登记本。',
      pathTitle: '成长路径',
      pathSub: '学习、构建、改进',
      timeline1Title: 'ICT 学生',
      timeline1Meta: 'STI Colleges Philippines / 当前',
      timeline1Body: '在学习 ICT 的同时构建实用项目，重点关注前端、后端基础、数据库和真实校园系统。',
      timeline2Title: '开发者与构建者',
      timeline2Meta: '个人项目 / 持续进行',
      timeline2Body: '构建并部署 EQ Monitor、Finexus RL 等网页应用，再通过更好的 UI、API 处理和响应式设计持续改进。',
      timeline3Title: '校园系统项目',
      timeline3Meta: '图书馆工具 / 进行中',
      timeline3Body: '构建减少人工工作、提升记录准确性，并让学校工作人员更快获取信息的数字工具。',
      techStack: '技术栈',
      tools: '工具',
      stackNote: '熟悉 HTML、CSS、JavaScript、PHP、Java、MySQL、Git、GitHub、Vercel、Firebase、React，以及 React Native 基础。',
      contact: '联系',
      message: '消息',
      topicInternship: '实习',
      topicProject: '项目',
      topicCollab: '合作',
      topicTech: '技术交流',
      subjectPrefix: '主题：',
      sendEmail: '发送邮件',
      copyEmail: '复制邮箱',
      copied: '已复制',
      openGithub: '打开 GitHub',
      footerBuilt: '为未来创新而构建。',
      typeLines: ['为了未来创新。', '用创意与热情打造。', '构建真正有用的系统。', '为真实的人设计技术。', '每个项目都在学习。', '把想法变成可运行的应用。'],
      messages: {
        internship: { subject: '实习机会', body: 'Hi Sam，我看到了你的作品集，想和你聊聊一个实习机会。' },
        project: { subject: '项目咨询', body: 'Hi Sam，我有一个项目想法，想看看我们能不能一起构建有用的东西。' },
        collab: { subject: '合作想法', body: 'Hi Sam，我喜欢你的作品，想探索一个可能的合作。' },
        tech: { subject: '技术交流', body: 'Hi Sam，我想联系你，聊聊 Web 开发、校园系统或 IT。' }
      }
    },
    th: {
      htmlLang: 'th',
      short: 'TH',
      pageTitle: 'Sam Yujoco - พอร์ตโฟลิโอเทคโนโลยี',
      navAbout: 'เกี่ยวกับ',
      navProjects: 'โปรเจกต์',
      navPath: 'เส้นทาง',
      navStack: 'สแต็ก',
      navContact: 'ติดต่อ',
      heroRole: 'นักเรียน ICT + นักพัฒนา',
      status: 'เปิดรับโอกาสฝึกงาน',
      lead: 'อายุ 18 ปีจาก<strong>มินดาเนา ประเทศฟิลิปปินส์</strong> กำลังเรียน ICT ที่ <strong>STI Colleges</strong> ผมสร้างเว็บแอป ระบบโรงเรียน และเครื่องมือที่ใช้งานได้จริง เพื่อเปลี่ยนปัญหาจริงให้เป็นเทคโนโลยีที่ทำงานได้',
      viewProjects: 'ดูโปรเจกต์',
      contactMe: 'ติดต่อฉัน',
      yearsOld: 'ปี',
      featuredBuilds: 'ผลงานเด่น',
      toolsInStack: 'เครื่องมือ',
      profile: 'โปรไฟล์',
      available: 'ติดต่อได้',
      nameLabel: 'ชื่อ',
      schoolLabel: 'โรงเรียน',
      locationLabel: 'ที่ตั้ง',
      openToLabel: 'เปิดรับ',
      openToValue: 'ฝึกงาน / ร่วมงาน',
      lookingFor: 'สิ่งที่ผมกำลังมองหา',
      realUse: 'เทคโนโลยีที่ใช้งานได้จริง',
      story: 'ผมกำลังสร้างเส้นทางไปสู่อนาคตในสายงาน <strong>IT ภาครัฐหรือองค์กร</strong> ที่ซอฟต์แวร์ต้องเชื่อถือได้ มีประโยชน์ และชัดเจนสำหรับผู้ใช้ ผมเริ่มจากหน้า HTML พื้นฐาน แล้วพัฒนาไปสู่เว็บแอป ระบบโรงเรียน ฐานข้อมูล และประสบการณ์หน้าเว็บที่ใช้งานได้จริง',
      focus1Title: 'ระบบโรงเรียน',
      focus1Body: 'เครื่องมือดิจิทัลสำหรับการเข้าเรียน บันทึก รายงาน และเวิร์กโฟลว์ที่แทนกระบวนการแบบแมนนวลที่ช้า',
      focus2Title: 'เว็บแอปพลิเคชัน',
      focus2Body: 'อินเทอร์เฟซ responsive ที่มีเลย์เอาต์สะอาด ใช้งานง่าย และ deploy ได้จริง',
      focus3Title: 'เครื่องมือขับเคลื่อนด้วยข้อมูล',
      focus3Body: 'แอปที่ใช้ API ฐานข้อมูล และข้อมูลแบบเรียลไทม์ เพื่อช่วยตัดสินใจได้เร็วขึ้น',
      featuredProjects: 'โปรเจกต์เด่น',
      selectedBuilds: 'ช่วงนี้ผมทำอะไรอยู่',
      live: 'ออนไลน์',
      build: 'กำลังสร้าง',
      deployed: 'Deploy แล้ว',
      inDevelopment: 'กำลังพัฒนา',
      openSite: 'เปิดเว็บไซต์',
      eqDesc: 'แอปติดตามแผ่นดินไหวแบบเรียลไทม์ แสดงกิจกรรมแผ่นดินไหวล่าสุดผ่าน API เพื่อให้ผู้ใช้ติดตามเหตุการณ์ได้ทันที',
      finDesc: 'เว็บแอปด้านการเงินที่มีอินเทอร์เฟซสะอาดสำหรับดูและจัดการข้อมูลทางการเงิน สร้างด้วย Web stack ที่ใช้งานได้จริงและ deploy บน Vercel',
      timeDesc: 'เว็บแอปส่วนตัวสำหรับเก็บความทรงจำ โน้ต และช่วงเวลาต่าง ๆ ยังพัฒนาและปรับปรุงต่อเนื่อง',
      libDesc: 'ระบบเช็กอิน/เช็กเอาต์ดิจิทัลสำหรับห้องสมุดโรงเรียน แทนสมุดลงชื่อกระดาษด้วยการค้นหาที่เร็วขึ้น บันทึกที่ชัดเจน และรายงานทันที',
      pathTitle: 'เส้นทาง',
      pathSub: 'เรียนรู้ สร้าง ปรับปรุง',
      timeline1Title: 'นักเรียน ICT',
      timeline1Meta: 'STI Colleges Philippines / ปัจจุบัน',
      timeline1Body: 'เรียน ICT พร้อมสร้างโปรเจกต์ใช้งานจริง โดยเน้น frontend, backend พื้นฐาน ฐานข้อมูล และระบบโรงเรียนจริง',
      timeline2Title: 'นักพัฒนาและนักสร้าง',
      timeline2Meta: 'โปรเจกต์ส่วนตัว / ต่อเนื่อง',
      timeline2Body: 'สร้างและ deploy เว็บแอปอย่าง EQ Monitor และ Finexus RL แล้วพัฒนาต่อด้วย UI ที่ดีขึ้น การจัดการ API และ responsive design',
      timeline3Title: 'โปรเจกต์ระบบโรงเรียน',
      timeline3Meta: 'เครื่องมือห้องสมุด / กำลังทำ',
      timeline3Body: 'สร้างเครื่องมือที่ลดงานแมนนวล เพิ่มความถูกต้องของบันทึก และช่วยให้เจ้าหน้าที่โรงเรียนเข้าถึงข้อมูลสำคัญได้เร็วขึ้น',
      techStack: 'เทคสแต็ก',
      tools: 'เครื่องมือ',
      stackNote: 'คุ้นเคยกับ HTML, CSS, JavaScript, PHP, Java, MySQL, Git, GitHub, Vercel, Firebase, React และพื้นฐาน React Native',
      contact: 'ติดต่อ',
      message: 'ข้อความ',
      topicInternship: 'ฝึกงาน',
      topicProject: 'โปรเจกต์',
      topicCollab: 'ร่วมงาน',
      topicTech: 'คุยเทค',
      subjectPrefix: 'หัวข้อ: ',
      sendEmail: 'ส่งอีเมล',
      copyEmail: 'คัดลอกอีเมล',
      copied: 'คัดลอกแล้ว',
      openGithub: 'เปิด GitHub',
      footerBuilt: 'สร้างขึ้นเพื่ออนาคตของนวัตกรรม',
      typeLines: ['เพื่ออนาคตของนวัตกรรม', 'สร้างด้วยความคิดสร้างสรรค์และแพสชัน', 'สร้างระบบที่ใช้งานได้จริง', 'ออกแบบเทคโนโลยีเพื่อผู้คนจริง', 'เรียนรู้จากทุกโปรเจกต์', 'เปลี่ยนไอเดียให้เป็นแอปที่ทำงานได้'],
      messages: {
        internship: { subject: 'โอกาสฝึกงาน', body: 'Hi Sam ผม/ฉันเห็นพอร์ตโฟลิโอของคุณและอยากคุยเรื่องโอกาสฝึกงาน' },
        project: { subject: 'สอบถามโปรเจกต์', body: 'Hi Sam ผม/ฉันมีไอเดียโปรเจกต์ และอยากดูว่าเราจะสร้างอะไรที่มีประโยชน์ร่วมกันได้ไหม' },
        collab: { subject: 'ไอเดียร่วมงาน', body: 'Hi Sam ผม/ฉันชอบผลงานของคุณ และอยากสำรวจโอกาสร่วมงานกัน' },
        tech: { subject: 'คุยเรื่องเทคโนโลยี', body: 'Hi Sam ผม/ฉันอยากติดต่อเพื่อคุยเรื่อง Web development, ระบบโรงเรียน หรือ IT' }
      }
    },
    vi: {
      htmlLang: 'vi',
      short: 'VI',
      pageTitle: 'Sam Yujoco - Portfolio Công Nghệ',
      navAbout: 'Giới thiệu',
      navProjects: 'Dự án',
      navPath: 'Lộ trình',
      navStack: 'Công nghệ',
      navContact: 'Liên hệ',
      heroRole: 'Sinh viên ICT + Lập trình viên',
      status: 'Sẵn sàng thực tập',
      lead: '18 tuổi đến từ <strong>Mindanao, Philippines</strong>, đang học ICT tại <strong>STI Colleges</strong>. Tôi xây dựng web app, hệ thống trường học và công cụ thực tế để biến vấn đề thật thành công nghệ hoạt động được.',
      viewProjects: 'Xem dự án',
      contactMe: 'Liên hệ tôi',
      yearsOld: 'tuổi',
      featuredBuilds: 'sản phẩm nổi bật',
      toolsInStack: 'công cụ',
      profile: 'Hồ sơ',
      available: 'sẵn sàng',
      nameLabel: 'Tên',
      schoolLabel: 'Trường',
      locationLabel: 'Địa điểm',
      openToLabel: 'Mở cho',
      openToValue: 'Thực tập / Hợp tác',
      lookingFor: 'Tôi đang tìm kiếm điều gì',
      realUse: 'Công nghệ có giá trị thực tế',
      story: 'Tôi đang hướng đến tương lai trong <strong>IT chính phủ hoặc doanh nghiệp</strong>, nơi phần mềm cần đáng tin cậy, hữu ích và dễ hiểu cho người dùng. Tôi bắt đầu với các trang HTML cơ bản rồi tiếp tục xây dựng web app, hệ thống trường học, cơ sở dữ liệu và trải nghiệm frontend thực sự hoạt động.',
      focus1Title: 'Hệ thống trường học',
      focus1Body: 'Công cụ số cho điểm danh, hồ sơ, báo cáo và quy trình thay thế thao tác thủ công chậm.',
      focus2Title: 'Ứng dụng web',
      focus2Body: 'Giao diện responsive với bố cục rõ ràng, tương tác hữu ích và triển khai thực tế.',
      focus3Title: 'Công cụ dữ liệu',
      focus3Body: 'Ứng dụng dùng API, cơ sở dữ liệu và thông tin thời gian thực để quyết định nhanh hơn.',
      featuredProjects: 'Dự án nổi bật',
      selectedBuilds: 'Tôi đã làm gì',
      live: 'Online',
      build: 'Đang xây',
      deployed: 'Đã triển khai',
      inDevelopment: 'Đang phát triển',
      openSite: 'Mở trang',
      eqDesc: 'Ứng dụng theo dõi động đất thời gian thực, hiển thị hoạt động địa chấn trực tiếp bằng dữ liệu API.',
      finDesc: 'Ứng dụng web tài chính với giao diện gọn gàng để xem và quản lý dữ liệu tài chính, xây dựng bằng web stack thực tế và triển khai trên Vercel.',
      timeDesc: 'Ứng dụng web cá nhân để lưu ký ức, ghi chú và khoảnh khắc theo thời gian. Vẫn đang được tinh chỉnh như một ý tưởng sản phẩm dài hạn.',
      libDesc: 'Hệ thống check-in/check-out kỹ thuật số cho thư viện trường, thay sổ giấy bằng tra cứu nhanh, hồ sơ rõ ràng và báo cáo điểm danh tức thì.',
      pathTitle: 'Lộ trình',
      pathSub: 'Học, xây dựng, cải thiện',
      timeline1Title: 'Sinh viên ICT',
      timeline1Meta: 'STI Colleges Philippines / Hiện tại',
      timeline1Body: 'Học ICT đồng thời xây dựng dự án thực tế, tập trung vào frontend, nền tảng backend, cơ sở dữ liệu và hệ thống trường học thật.',
      timeline2Title: 'Lập trình viên và người xây dựng',
      timeline2Meta: 'Dự án cá nhân / Đang tiếp tục',
      timeline2Body: 'Xây dựng và triển khai các web app như EQ Monitor và Finexus RL, rồi cải thiện bằng UI tốt hơn, xử lý API và thiết kế responsive.',
      timeline3Title: 'Dự án hệ thống trường học',
      timeline3Meta: 'Công cụ thư viện / Đang làm',
      timeline3Body: 'Xây dựng công cụ giảm thao tác thủ công, tăng độ chính xác hồ sơ và giúp nhân viên trường truy cập thông tin nhanh hơn.',
      techStack: 'Công nghệ',
      tools: 'công cụ',
      stackNote: 'Thoải mái với HTML, CSS, JavaScript, PHP, Java, MySQL, Git, GitHub, Vercel, Firebase, React và nền tảng React Native.',
      contact: 'Liên hệ',
      message: 'tin nhắn',
      topicInternship: 'Thực tập',
      topicProject: 'Dự án',
      topicCollab: 'Hợp tác',
      topicTech: 'Trao đổi tech',
      subjectPrefix: 'Chủ đề: ',
      sendEmail: 'Gửi email',
      copyEmail: 'Sao chép email',
      copied: 'Đã sao chép',
      openGithub: 'Mở GitHub',
      footerBuilt: 'Xây dựng cho đổi mới tương lai.',
      typeLines: ['Cho đổi mới tương lai.', 'Được tạo bằng sáng tạo và đam mê.', 'Xây dựng hệ thống hữu ích.', 'Thiết kế công nghệ cho con người thật.', 'Học qua từng dự án.', 'Biến ý tưởng thành ứng dụng hoạt động.'],
      messages: {
        internship: { subject: 'Cơ hội thực tập', body: 'Hi Sam, tôi đã xem portfolio của bạn và muốn trao đổi về một cơ hội thực tập.' },
        project: { subject: 'Trao đổi dự án', body: 'Hi Sam, tôi có một ý tưởng dự án và muốn xem liệu chúng ta có thể cùng xây dựng điều gì hữu ích không.' },
        collab: { subject: 'Ý tưởng hợp tác', body: 'Hi Sam, tôi thích sản phẩm của bạn và muốn trao đổi về khả năng hợp tác.' },
        tech: { subject: 'Trao đổi công nghệ', body: 'Hi Sam, tôi muốn kết nối và nói về web development, hệ thống trường học hoặc IT.' }
      }
    },
    ja: {
      htmlLang: 'ja',
      short: 'JP',
      pageTitle: 'Sam Yujoco - テクノロジーポートフォリオ',
      navAbout: '概要',
      navProjects: 'プロジェクト',
      navPath: '歩み',
      navStack: '技術',
      navContact: '連絡',
      heroRole: 'ICT 学生 + 開発者',
      status: 'インターン募集中',
      lead: '<strong>フィリピン・ミンダナオ</strong>出身の 18 歳。<strong>STI Colleges</strong> で ICT を学びながら、Web アプリ、学校向けシステム、実用的なツールを作り、現実の課題を動く技術に変えています。',
      viewProjects: 'プロジェクトを見る',
      contactMe: '連絡する',
      yearsOld: '歳',
      featuredBuilds: '注目作品',
      toolsInStack: '使用ツール',
      profile: 'プロフィール',
      available: '対応可能',
      nameLabel: '名前',
      schoolLabel: '学校',
      locationLabel: '所在地',
      openToLabel: '募集中',
      openToValue: 'インターン / コラボ',
      lookingFor: '目指していること',
      realUse: '実際に役立つテクノロジー',
      story: '私は<strong>政府機関または企業 IT</strong> の分野で、信頼できて実用的で、利用者にとって分かりやすいソフトウェアを作る未来を目指しています。基本的な HTML ページから始め、Web アプリ、学校向けシステム、データベース、実際に動くフロントエンド体験へと広げてきました。',
      focus1Title: '学校向けシステム',
      focus1Body: '出席、記録、レポート、ワークフローをデジタル化し、遅い手作業を置き換えるツール。',
      focus2Title: 'Web アプリ',
      focus2Body: '整ったレイアウト、役立つ操作性、実用的なデプロイを備えたレスポンシブ UI。',
      focus3Title: 'データ駆動ツール',
      focus3Body: 'API、データベース、リアルタイム情報を使い、より速い判断を支えるアプリ。',
      featuredProjects: '注目プロジェクト',
      selectedBuilds: 'これまで取り組んできたこと',
      live: '公開中',
      build: '制作中',
      deployed: 'デプロイ済み',
      inDevelopment: '開発中',
      openSite: 'サイトを開く',
      eqDesc: 'API データで地震活動をリアルタイム表示し、発生中の地震を追跡できるモニタリングアプリ。',
      finDesc: '金融データの閲覧と管理に使えるクリーンな UI の金融 Web アプリ。実用的な Web スタックで構築し Vercel にデプロイ。',
      timeDesc: '思い出、メモ、瞬間を保存する個人向け Web アプリ。長期的なプロダクト案として改善中。',
      libDesc: '学校図書館向けのデジタルチェックイン/チェックアウトシステム。紙の記録を高速検索、明確な記録、即時レポートに置き換えます。',
      pathTitle: '歩み',
      pathSub: '学び、作り、改善する',
      timeline1Title: 'ICT 学生',
      timeline1Meta: 'STI Colleges Philippines / 現在',
      timeline1Body: 'ICT を学びながら実用的なプロジェクトを作り、フロントエンド、バックエンド基礎、データベース、実際の学校システムに取り組んでいます。',
      timeline2Title: '開発者・ビルダー',
      timeline2Meta: '個人プロジェクト / 継続中',
      timeline2Body: 'EQ Monitor や Finexus RL などの Web アプリを構築・公開し、UI、API 処理、レスポンシブ設計を改善しています。',
      timeline3Title: '学校システム開発',
      timeline3Meta: '図書館ツール / 進行中',
      timeline3Body: '手作業を減らし、記録の正確性を上げ、学校スタッフが情報へ素早くアクセスできるツールを作っています。',
      techStack: '技術スタック',
      tools: 'ツール',
      stackNote: 'HTML、CSS、JavaScript、PHP、Java、MySQL、Git、GitHub、Vercel、Firebase、React、React Native の基礎に対応できます。',
      contact: '連絡',
      message: 'メッセージ',
      topicInternship: 'インターン',
      topicProject: 'プロジェクト',
      topicCollab: 'コラボ',
      topicTech: '技術相談',
      subjectPrefix: '件名: ',
      sendEmail: 'メール送信',
      copyEmail: 'メールをコピー',
      copied: 'コピー済み',
      openGithub: 'GitHub を開く',
      footerBuilt: '未来のイノベーションのために構築。',
      typeLines: ['未来のイノベーションのために。', '創造性と情熱で制作。', '役立つシステムを構築。', '人のための技術を設計。', 'プロジェクトごとに学ぶ。', 'アイデアを動くアプリへ。'],
      messages: {
        internship: { subject: 'インターン機会', body: 'Hi Sam、あなたのポートフォリオを見て、インターンの機会について話したいです。' },
        project: { subject: 'プロジェクト相談', body: 'Hi Sam、プロジェクトのアイデアがあり、一緒に役立つものを作れるか相談したいです。' },
        collab: { subject: 'コラボレーション案', body: 'Hi Sam、あなたの作品に興味があり、コラボの可能性を話したいです。' },
        tech: { subject: '技術相談', body: 'Hi Sam、Web 開発、学校システム、IT について話したくて連絡しました。' }
      }
    },
    hr: {
      htmlLang: 'hr',
      short: 'HR',
      pageTitle: 'Sam Yujoco - Tehnološki portfolio',
      navAbout: 'O meni',
      navProjects: 'Projekti',
      navPath: 'Put',
      navStack: 'Stack',
      navContact: 'Kontakt',
      heroRole: 'ICT student + developer',
      status: 'Otvoren za prakse',
      lead: '18-godišnjak iz <strong>Mindanaa, Filipini</strong>, studira ICT na <strong>STI Colleges</strong>. Gradim web aplikacije, školske sustave i praktične alate koji stvarne probleme pretvaraju u tehnologiju koja radi.',
      viewProjects: 'Pogledaj projekte',
      contactMe: 'Kontaktiraj me',
      yearsOld: 'godina',
      featuredBuilds: 'Istaknuti radovi',
      toolsInStack: 'Alati u stacku',
      profile: 'Profil',
      available: 'dostupan',
      nameLabel: 'Ime',
      schoolLabel: 'Škola',
      locationLabel: 'Lokacija',
      openToLabel: 'Otvoren za',
      openToValue: 'Praksu / Suradnju',
      lookingFor: 'Što tražim',
      realUse: 'Tehnologija sa stvarnom uporabom',
      story: 'Gradim put prema budućnosti u <strong>državnom ili poslovnom IT-u</strong>, gdje softver mora biti pouzdan, koristan i jasan ljudima koji ga koriste. Počeo sam s osnovnim HTML stranicama i nastavio prema web aplikacijama, školskim sustavima, bazama podataka i frontend iskustvima koja stvarno rade.',
      focus1Title: 'Školski sustavi',
      focus1Body: 'Digitalni alati za prisutnost, evidenciju, izvješća i procese koji zamjenjuju spore ručne postupke.',
      focus2Title: 'Web aplikacije',
      focus2Body: 'Responzivna sučelja s čistim rasporedom, korisnim interakcijama i praktičnom objavom.',
      focus3Title: 'Alati vođeni podacima',
      focus3Body: 'Aplikacije pokretane API-jima, bazama podataka i informacijama u stvarnom vremenu za brže odluke.',
      featuredProjects: 'Istaknuti projekti',
      selectedBuilds: 'Što sam radio',
      live: 'Uživo',
      build: 'Izrada',
      deployed: 'Objavljeno',
      inDevelopment: 'U razvoju',
      openSite: 'Otvori stranicu',
      eqDesc: 'Aplikacija za praćenje potresa u stvarnom vremenu koja prikazuje seizmičku aktivnost preko API podataka i pomaže korisnicima pratiti potrese dok se događaju.',
      finDesc: 'Financijska web aplikacija s čistim sučeljem za pregled i upravljanje financijskim podacima, izgrađena praktičnim web stackom i objavljena na Vercelu.',
      timeDesc: 'Osobna web aplikacija za spremanje uspomena, bilješki i trenutaka kroz vrijeme. Još se dorađuje kao dugoročna ideja za proizvod.',
      libDesc: 'Digitalni sustav prijave i odjave za školsku knjižnicu koji papirnate knjige zamjenjuje bržim pretraživanjem, urednijom evidencijom i trenutnim izvješćima o prisutnosti.',
      pathTitle: 'Put',
      pathSub: 'Učenje, gradnja, poboljšavanje',
      timeline1Title: 'ICT student',
      timeline1Meta: 'STI Colleges Philippines / Trenutno',
      timeline1Body: 'Studiram ICT i uz to gradim praktične projekte, s fokusom na frontend, osnove backenda, baze podataka i stvarne školske sustave.',
      timeline2Title: 'Developer i graditelj',
      timeline2Meta: 'Osobni projekti / U tijeku',
      timeline2Body: 'Gradim i objavljujem web aplikacije poput EQ Monitora i Finexus RL-a, zatim ih poboljšavam kroz bolji UI, API obradu i responzivni dizajn.',
      timeline3Title: 'Projekti školskih sustava',
      timeline3Meta: 'Knjižnični alati / U razvoju',
      timeline3Body: 'Radim na digitalnim alatima koji smanjuju ručni rad, poboljšavaju točnost evidencije i školskom osoblju daju brži pristup važnim informacijama.',
      techStack: 'Tehnološki stack',
      tools: 'alati',
      stackNote: 'Udobno radim s HTML-om, CSS-om, JavaScriptom, PHP-om, Javom, MySQL-om, Gitom, GitHubom, Vercelom, Firebaseom, Reactom i osnovama React Nativea.',
      contact: 'Kontakt',
      message: 'poruka',
      topicInternship: 'Praksa',
      topicProject: 'Projekt',
      topicCollab: 'Suradnja',
      topicTech: 'Tech razgovor',
      subjectPrefix: 'Predmet: ',
      sendEmail: 'Pošalji email',
      copyEmail: 'Kopiraj email',
      copied: 'Kopirano',
      openGithub: 'Otvori GitHub',
      footerBuilt: 'Izgrađeno za buduće inovacije.',
      typeLines: ['Za buduće inovacije.', 'Stvoreno kreativnošću i strašću.', 'Gradim korisne sustave.', 'Dizajniram tehnologiju za stvarne ljude.', 'Učim kroz svaki projekt.', 'Pretvaram ideje u aplikacije koje rade.'],
      messages: {
        internship: { subject: 'Prilika za praksu', body: 'Hi Sam, vidio sam tvoj portfolio i želim razgovarati o prilici za praksu.' },
        project: { subject: 'Upit za projekt', body: 'Hi Sam, imam ideju za projekt i želim vidjeti možemo li zajedno izgraditi nešto korisno.' },
        collab: { subject: 'Ideja za suradnju', body: 'Hi Sam, sviđa mi se tvoj rad i želim istražiti moguću suradnju.' },
        tech: { subject: 'Tech razgovor', body: 'Hi Sam, želim se povezati i razgovarati o web developmentu, školskim sustavima ili IT-u.' }
      }
    },
    sr: {
      htmlLang: 'sr-Latn',
      short: 'SR',
      pageTitle: 'Sam Yujoco - Tehnološki portfolio',
      navAbout: 'O meni',
      navProjects: 'Projekti',
      navPath: 'Put',
      navStack: 'Stack',
      navContact: 'Kontakt',
      heroRole: 'ICT student + developer',
      status: 'Otvoren za prakse',
      lead: '18-godišnjak iz <strong>Mindanaa, Filipini</strong>, studira ICT na <strong>STI Colleges</strong>. Pravim web aplikacije, školske sisteme i praktične alate koji stvarne probleme pretvaraju u tehnologiju koja radi.',
      viewProjects: 'Pogledaj projekte',
      contactMe: 'Kontaktiraj me',
      yearsOld: 'godina',
      featuredBuilds: 'Istaknuti radovi',
      toolsInStack: 'Alati u stacku',
      profile: 'Profil',
      available: 'dostupan',
      nameLabel: 'Ime',
      schoolLabel: 'Škola',
      locationLabel: 'Lokacija',
      openToLabel: 'Otvoren za',
      openToValue: 'Praksu / Saradnju',
      lookingFor: 'Šta tražim',
      realUse: 'Tehnologija sa stvarnom upotrebom',
      story: 'Gradim put ka budućnosti u <strong>državnom ili poslovnom IT-u</strong>, gde softver mora biti pouzdan, koristan i jasan ljudima koji ga koriste. Počeo sam od osnovnih HTML stranica i nastavio ka web aplikacijama, školskim sistemima, bazama podataka i frontend iskustvima koja stvarno rade.',
      focus1Title: 'Školski sistemi',
      focus1Body: 'Digitalni alati za prisustvo, evidenciju, izveštaje i procese koji zamenjuju spore ručne postupke.',
      focus2Title: 'Web aplikacije',
      focus2Body: 'Responzivni interfejsi sa čistim rasporedom, korisnim interakcijama i praktičnim objavljivanjem.',
      focus3Title: 'Alati vođeni podacima',
      focus3Body: 'Aplikacije pokretane API-jima, bazama podataka i informacijama u realnom vremenu za brže odluke.',
      featuredProjects: 'Istaknuti projekti',
      selectedBuilds: 'Šta sam radio',
      live: 'Uživo',
      build: 'Izrada',
      deployed: 'Objavljeno',
      inDevelopment: 'U razvoju',
      openSite: 'Otvori sajt',
      eqDesc: 'Aplikacija za praćenje zemljotresa u realnom vremenu koja prikazuje seizmičku aktivnost preko API podataka i pomaže korisnicima da prate zemljotrese dok se dešavaju.',
      finDesc: 'Finansijska web aplikacija sa čistim interfejsom za pregled i upravljanje finansijskim podacima, napravljena praktičnim web stackom i objavljena na Vercelu.',
      timeDesc: 'Lična web aplikacija za čuvanje uspomena, beleški i trenutaka kroz vreme. Još se dorađuje kao dugoročna ideja za proizvod.',
      libDesc: 'Digitalni sistem prijave i odjave za školsku biblioteku koji papirne evidencije zamenjuje bržom pretragom, urednijim zapisima i trenutnim izveštajima o prisustvu.',
      pathTitle: 'Put',
      pathSub: 'Učenje, izgradnja, poboljšavanje',
      timeline1Title: 'ICT student',
      timeline1Meta: 'STI Colleges Philippines / Trenutno',
      timeline1Body: 'Studiram ICT i uz to pravim praktične projekte, sa fokusom na frontend, osnove backenda, baze podataka i stvarne školske sisteme.',
      timeline2Title: 'Developer i graditelj',
      timeline2Meta: 'Lični projekti / U toku',
      timeline2Body: 'Pravim i objavljujem web aplikacije kao što su EQ Monitor i Finexus RL, zatim ih poboljšavam kroz bolji UI, API obradu i responzivni dizajn.',
      timeline3Title: 'Projekti školskih sistema',
      timeline3Meta: 'Bibliotečki alati / U razvoju',
      timeline3Body: 'Radim na digitalnim alatima koji smanjuju ručni rad, poboljšavaju tačnost evidencije i školskom osoblju daju brži pristup važnim informacijama.',
      techStack: 'Tehnološki stack',
      tools: 'alati',
      stackNote: 'Udobno radim sa HTML-om, CSS-om, JavaScriptom, PHP-om, Javom, MySQL-om, Gitom, GitHubom, Vercelom, Firebaseom, Reactom i osnovama React Nativea.',
      contact: 'Kontakt',
      message: 'poruka',
      topicInternship: 'Praksa',
      topicProject: 'Projekat',
      topicCollab: 'Saradnja',
      topicTech: 'Tech razgovor',
      subjectPrefix: 'Predmet: ',
      sendEmail: 'Pošalji email',
      copyEmail: 'Kopiraj email',
      copied: 'Kopirano',
      openGithub: 'Otvori GitHub',
      footerBuilt: 'Izgrađeno za buduće inovacije.',
      typeLines: ['Za buduće inovacije.', 'Stvoreno kreativnošću i strašću.', 'Pravim korisne sisteme.', 'Dizajniram tehnologiju za stvarne ljude.', 'Učim kroz svaki projekat.', 'Pretvaram ideje u aplikacije koje rade.'],
      messages: {
        internship: { subject: 'Prilika za praksu', body: 'Hi Sam, video sam tvoj portfolio i želim da razgovaramo o prilici za praksu.' },
        project: { subject: 'Upit za projekat', body: 'Hi Sam, imam ideju za projekat i želim da vidim možemo li zajedno da napravimo nešto korisno.' },
        collab: { subject: 'Ideja za saradnju', body: 'Hi Sam, sviđa mi se tvoj rad i želim da istražimo moguću saradnju.' },
        tech: { subject: 'Tech razgovor', body: 'Hi Sam, želim da se povežemo i razgovaramo o web developmentu, školskim sistemima ili IT-u.' }
      }
    }
  };

  const bindings = [
    ['.nav-links a[href="#about"]', 'navAbout'],
    ['.nav-links a[href="#projects"]', 'navProjects'],
    ['.nav-links a[href="#timeline"]', 'navPath'],
    ['.nav-links a[href="#stack"]', 'navStack'],
    ['.nav-links a[href="#contact"]', 'navContact'],
    ['.identity strong', 'heroRole'],
    ['.status-text', 'status'],
    ['.lead', 'lead', 'html'],
    ['.actions a[href="#projects"]', 'viewProjects'],
    ['.actions a[href="#contact"]', 'contactMe'],
    ['.metric:nth-child(1) span', 'yearsOld'],
    ['.metric:nth-child(2) span', 'featuredBuilds'],
    ['.metric:nth-child(3) span', 'toolsInStack'],
    ['.detail-card .card-title h2', 'profile'],
    ['.detail-card .mini-tag', 'available'],
    ['.info-row:nth-child(1) span:first-child', 'nameLabel'],
    ['.info-row:nth-child(2) span:first-child', 'schoolLabel'],
    ['.info-row:nth-child(3) span:first-child', 'locationLabel'],
    ['.info-row:nth-child(4) span:first-child', 'openToLabel'],
    ['.info-row:nth-child(4) span:last-child', 'openToValue'],
    ['#about .section-title h2', 'lookingFor'],
    ['#about .section-title p', 'realUse'],
    ['#about .story', 'story', 'html'],
    ['.focus-item:nth-child(1) h3', 'focus1Title'],
    ['.focus-item:nth-child(1) p', 'focus1Body'],
    ['.focus-item:nth-child(2) h3', 'focus2Title'],
    ['.focus-item:nth-child(2) p', 'focus2Body'],
    ['.focus-item:nth-child(3) h3', 'focus3Title'],
    ['.focus-item:nth-child(3) p', 'focus3Body'],
    ['#projects .section-title h2', 'featuredProjects'],
    ['#projects .section-title p', 'selectedBuilds'],
    ['.project-card:nth-child(1) .project-index', 'project1Index'],
    ['.project-card:nth-child(2) .project-index', 'project2Index'],
    ['.project-card:nth-child(3) .project-index', 'project3Index'],
    ['.project-card:nth-child(1) p', 'eqDesc'],
    ['.project-card:nth-child(2) p', 'finDesc'],
    ['.project-card:nth-child(3) p', 'timeDesc'],
    ['.project-card:nth-child(4) p', 'libDesc'],
    ['.project-card:nth-child(1) .badge', 'deployed'],
    ['.project-card:nth-child(2) .badge', 'deployed'],
    ['.project-card:nth-child(3) .badge', 'inDevelopment'],
    ['.project-card:nth-child(4) .badge', 'inDevelopment'],
    ['.project-card:nth-child(1) .text-link', 'openSite'],
    ['.project-card:nth-child(2) .text-link', 'openSite'],
    ['.project-card:nth-child(3) .text-link', 'openSite'],
    ['#timeline .section-title h2', 'pathTitle'],
    ['#timeline .section-title p', 'pathSub'],
    ['.timeline-item:nth-child(1) h3', 'timeline1Title'],
    ['.timeline-item:nth-child(1) .timeline-meta', 'timeline1Meta'],
    ['.timeline-item:nth-child(1) p', 'timeline1Body'],
    ['.timeline-item:nth-child(2) h3', 'timeline2Title'],
    ['.timeline-item:nth-child(2) .timeline-meta', 'timeline2Meta'],
    ['.timeline-item:nth-child(2) p', 'timeline2Body'],
    ['.timeline-item:nth-child(3) h3', 'timeline3Title'],
    ['.timeline-item:nth-child(3) .timeline-meta', 'timeline3Meta'],
    ['.timeline-item:nth-child(3) p', 'timeline3Body'],
    ['#stack .card-title h2', 'techStack'],
    ['#stack .mini-tag', 'tools'],
    ['.stack-note', 'stackNote'],
    ['#contact .card-title h2', 'contact'],
    ['#contact .mini-tag', 'message'],
    ['.topic-chip[data-topic="internship"]', 'topicInternship'],
    ['.topic-chip[data-topic="project"]', 'topicProject'],
    ['.topic-chip[data-topic="collab"]', 'topicCollab'],
    ['.topic-chip[data-topic="tech"]', 'topicTech'],
    ['#emailLink', 'sendEmail'],
    ['#copyEmail', 'copyEmail'],
    ['.contact-actions .wide', 'openGithub'],
    ['footer span:last-child', 'footerBuilt']
  ];

  let currentLang = 'en';
  const langSwitch = document.getElementById('languageSwitch');
  const langCurrent = document.getElementById('langCurrent');
  const langOptions = Array.from(document.querySelectorAll('.lang-option'));

  function text(key) {
    return (I18N[currentLang] && I18N[currentLang][key]) || I18N.en[key] || '';
  }

  function applyLanguage(lang, shouldSave) {
    currentLang = I18N[lang] ? lang : 'en';
    const t = I18N[currentLang];
    document.documentElement.lang = t.htmlLang;
    document.title = t.pageTitle;

    bindings.forEach(([selector, key, mode]) => {
      const el = document.querySelector(selector);
      if (!el) return;
      if (key === 'project1Index') el.textContent = '01 / ' + t.live;
      else if (key === 'project2Index') el.textContent = '02 / ' + t.live;
      else if (key === 'project3Index') el.textContent = '03 / ' + t.build;
      else if (mode === 'html') el.innerHTML = t[key];
      else el.textContent = t[key];
    });

    if (langCurrent) {
      langCurrent.textContent = t.short;
      langCurrent.setAttribute('aria-expanded', 'false');
    }

    langOptions.forEach((option) => {
      option.classList.toggle('active', option.dataset.lang === currentLang);
    });

    if (langSwitch) langSwitch.classList.remove('open');

    if (shouldSave) {
      try { localStorage.setItem('portfolio-lang', currentLang); } catch (error) {}
    }

    document.dispatchEvent(new CustomEvent('portfolio-language-change', { detail: { lang: currentLang } }));
  }

  window.portfolioI18n = {
    getLanguage: () => currentLang,
    getText: text,
    getLines: () => I18N[currentLang].typeLines,
    getMessages: () => I18N[currentLang].messages,
    applyLanguage
  };

  if (langCurrent && langSwitch) {
    langCurrent.addEventListener('click', () => {
      const isOpen = langSwitch.classList.toggle('open');
      langCurrent.setAttribute('aria-expanded', String(isOpen));
    });
  }

  langOptions.forEach((option) => {
    option.addEventListener('click', () => applyLanguage(option.dataset.lang, true));
  });

  document.addEventListener('click', (event) => {
    if (!langSwitch || langSwitch.contains(event.target)) return;
    langSwitch.classList.remove('open');
    if (langCurrent) langCurrent.setAttribute('aria-expanded', 'false');
  });

  let saved = 'en';
  try { saved = localStorage.getItem('portfolio-lang') || 'en'; } catch (error) {}
  applyLanguage(saved, false);
})();

(function () {
  const target = document.getElementById('typeText');
  if (!target) return;

  let lines = window.portfolioI18n ? window.portfolioI18n.getLines() : ['For future innovation.'];

  let line = 0;
  let char = 0;
  let deleting = false;

  document.addEventListener('portfolio-language-change', () => {
    lines = window.portfolioI18n ? window.portfolioI18n.getLines() : lines;
    line = 0;
    char = 0;
    deleting = false;
    target.textContent = '';
  });

  function tick() {
    const text = lines[line];
    target.textContent = text.slice(0, char);

    let delay = deleting ? 34 : 58;
    if (!deleting && char < text.length) {
      char += 1;
    } else if (!deleting) {
      deleting = true;
      delay = 1350;
    } else if (char > 0) {
      char -= 1;
    } else {
      deleting = false;
      line = (line + 1) % lines.length;
      delay = 260;
    }

    window.setTimeout(tick, delay);
  }

  tick();
})();

(function () {
  const actions = document.querySelector('[data-email]');
  if (!actions) return;

  const email = actions.getAttribute('data-email') || 'your@email.com';
  const emailLink = document.getElementById('emailLink');
  const copyButton = document.getElementById('copyEmail');
  const subject = document.getElementById('contactSubject');
  const body = document.getElementById('contactBody');
  const chips = Array.from(document.querySelectorAll('.topic-chip'));

  let currentTopic = 'internship';

  function setTopic(key) {
    currentTopic = key;
    const messages = window.portfolioI18n ? window.portfolioI18n.getMessages() : {};
    const message = messages[key] || messages.internship;
    chips.forEach((chip) => chip.classList.toggle('active', chip.dataset.topic === key));
    if (subject) subject.textContent = (window.portfolioI18n ? window.portfolioI18n.getText('subjectPrefix') : 'Subject: ') + message.subject;
    if (body) body.textContent = message.body;
    if (emailLink) emailLink.href = 'mailto:' + email + '?subject=' + encodeURIComponent(message.subject) + '&body=' + encodeURIComponent(message.body);
  }

  chips.forEach((chip) => {
    chip.addEventListener('click', () => setTopic(chip.dataset.topic));
  });

  if (copyButton) {
    copyButton.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(email);
      } catch (error) {
        const helper = document.createElement('textarea');
        helper.value = email;
        helper.setAttribute('readonly', '');
        helper.style.position = 'fixed';
        helper.style.left = '-999px';
        document.body.appendChild(helper);
        helper.select();
        document.execCommand('copy');
        helper.remove();
      }

      copyButton.textContent = window.portfolioI18n ? window.portfolioI18n.getText('copied') : 'Copied';
      window.setTimeout(() => {
        copyButton.textContent = window.portfolioI18n ? window.portfolioI18n.getText('copyEmail') : 'Copy email';
      }, 1300);
    });
  }

  document.addEventListener('portfolio-language-change', () => setTopic(currentTopic));

  setTopic('internship');
})();
