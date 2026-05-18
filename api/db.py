import sqlite3
import bcrypt
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / 'db.sqlite3'

def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_conn()
    c = conn.cursor()

    c.execute('''CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firstName TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user'
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        category TEXT,
        center TEXT,
        rating REAL DEFAULT 0,
        students TEXT DEFAULT '0',
        duration TEXT,
        day TEXT,
        time TEXT,
        price INTEGER DEFAULT 0,
        description TEXT,
        image TEXT DEFAULT ''
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS teachers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        subject TEXT,
        experience TEXT,
        students TEXT DEFAULT '0',
        rating REAL DEFAULT 0,
        bio TEXT DEFAULT '',
        image TEXT DEFAULT ''
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS enrollments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        course_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(course_id) REFERENCES courses(id)
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS feedbacks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        course_id INTEGER,
        rating INTEGER DEFAULT 5,
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(course_id) REFERENCES courses(id)
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS teacher_applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT,
        phone TEXT,
        subject TEXT,
        experience TEXT,
        message TEXT,
        cv_filename TEXT DEFAULT '',
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        message TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')

    # Eski DB uchun migration
    for migration in [
        "ALTER TABLE teacher_applications ADD COLUMN phone TEXT",
        "ALTER TABLE teacher_applications ADD COLUMN cv_filename TEXT DEFAULT ''",
        "ALTER TABLE courses ADD COLUMN teacher_app_id INTEGER DEFAULT NULL",
        "ALTER TABLE courses ADD COLUMN teacher_user_id INTEGER DEFAULT NULL",
        "ALTER TABLE submissions ADD COLUMN file_path TEXT DEFAULT NULL",
    ]:
        try:
            c.execute(migration)
        except Exception:
            pass

    c.execute('''CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        course_id INTEGER,
        amount INTEGER DEFAULT 0,
        method TEXT DEFAULT 'Naqd',
        status TEXT DEFAULT 'paid',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(course_id) REFERENCES courses(id)
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        course_id INTEGER,
        date TEXT,
        status INTEGER DEFAULT 1,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(course_id) REFERENCES courses(id)
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_id INTEGER,
        title TEXT NOT NULL,
        description TEXT,
        deadline TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(course_id) REFERENCES courses(id)
    )''')

    c.execute('''CREATE TABLE IF NOT EXISTS submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        assignment_id INTEGER,
        student_id INTEGER,
        content TEXT,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        grade INTEGER DEFAULT NULL,
        feedback TEXT,
        status TEXT DEFAULT 'pending',
        FOREIGN KEY(assignment_id) REFERENCES assignments(id),
        FOREIGN KEY(student_id) REFERENCES users(id)
    )''')

    conn.commit()

    # Demo foydalanuvchilarni yaratish
    demo_users = [
        ('Admin', 'admin@kurstanla.uz', 'admin123', 'admin'),
        ('Manager', 'manager@educore.uz', '123456', 'manager'),
        ('Teacher', 'teacher@educore.uz', '123456', 'teacher'),
        ('Student', 'student@educore.uz', '123456', 'user'),
    ]
    for firstName, email, pw, role in demo_users:
        c.execute("SELECT id FROM users WHERE email = ?", (email,))
        if not c.fetchone():
            hashed = bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()
            c.execute("INSERT INTO users (firstName, email, password, role) VALUES (?, ?, ?, ?)",
                      (firstName, email, hashed, role))
    conn.commit()

    # Kurslarni seed qilish
    c.execute("SELECT COUNT(*) FROM courses")
    if c.fetchone()[0] == 0:
        courses = [
            ("IELTS Intensive", "Til", "Registon LC", 4.9, "320 talaba", "4 oy", "Seshanba", "14:00", 1200000, "IELTS imtihoniga tayyorlov kursi."),
            ("Frontend Dasturlash", "IT", "PDP Academy", 4.8, "280 talaba", "5 oy", "Dushanba", "16:00", 1500000, "HTML, CSS, JavaScript va React asoslari."),
            ("Grafik Dizayn Pro", "Dizayn", "Najot Ta'lim", 4.7, "190 talaba", "3 oy", "Payshanba", "15:00", 950000, "Photoshop, Illustrator va brending asoslari."),
            ("Matematika Abituriyent", "Fan", "Everest", 4.8, "210 talaba", "6 oy", "Dushanba", "09:00", 800000, "Abituriyentlar uchun matematika kursi."),
            ("SMM Professional", "IT", "IT Live", 4.6, "160 talaba", "2 oy", "Payshanba", "18:00", 700000, "SMM, reklama va kontent reja."),
            ("Arab Tili Asoslari", "Til", "Hilol Education", 4.9, "145 talaba", "5 oy", "Chorshanba", "10:00", 850000, "Arab tili alifbo va grammatika asoslari."),
            ("Python Dasturlash", "IT", "Najot Ta'lim", 4.9, "350 talaba", "5 oy", "Juma", "10:00", 1300000, "Python asoslari, OOP va amaliy loyihalar."),
            ("Backend NodeJS", "IT", "PDP Academy", 4.8, "200 talaba", "4 oy", "Chorshanba", "17:00", 1400000, "NodeJS, Express, API va database."),
            ("Java Dasturlash", "IT", "IT Center", 4.7, "170 talaba", "5 oy", "Seshanba", "11:00", 1350000, "Java Core, OOP va backend asoslari."),
            ("Flutter Mobil Ilovalar", "IT", "PDP Academy", 4.8, "190 talaba", "5 oy", "Dushanba", "17:30", 1500000, "Android va iOS ilovalar yaratish."),
            ("Kiberxavfsizlik Asoslari", "IT", "IT Live", 4.7, "120 talaba", "3 oy", "Juma", "15:00", 1250000, "Tarmoq xavfsizligi va himoya usullari."),
            ("Data Analyst", "IT", "Najot Ta'lim", 4.8, "160 talaba", "4 oy", "Shanba", "10:30", 1450000, "Excel, SQL, Power BI va tahlil."),
            ("Sun'iy Intellekt Asoslari", "IT", "AI Academy", 4.9, "130 talaba", "6 oy", "Payshanba", "16:30", 1800000, "AI va machine learning tushunchalari."),
            ("Kompyuter Savodxonligi", "IT", "Digital Start", 4.5, "260 talaba", "2 oy", "Dushanba", "08:30", 500000, "Word, Excel va internet asoslari."),
            ("Rus Tili Boshlang'ich", "Til", "Cambridge LC", 4.6, "180 talaba", "3 oy", "Seshanba", "09:00", 650000, "Rus tilini 0 dan o'rganish."),
            ("Ingliz Tili Beginner", "Til", "Everest", 4.7, "240 talaba", "4 oy", "Dushanba", "10:00", 750000, "Ingliz tilini boshlang'ich darajadan o'rganish."),
            ("Koreys Tili", "Til", "Korea Study", 4.8, "120 talaba", "5 oy", "Chorshanba", "14:00", 900000, "TOPIK imtihoniga tayyorlov."),
            ("UI/UX Dizayn", "Dizayn", "Najot Ta'lim", 4.9, "180 talaba", "4 oy", "Chorshanba", "18:30", 1400000, "Figma, prototip va mobil/web dizayn."),
            ("3D Max Dizayn", "Dizayn", "Design School", 4.8, "90 talaba", "4 oy", "Dushanba", "18:00", 1300000, "Interyer va 3D modellashtirish."),
            ("C++ Foundation", "IT", "Sam IT School", 4.6, "140 talaba", "4 oy", "Payshanba", "12:00", 1100000, "C++ sintaksisi va algoritmlar."),
            ("Biologiya Abituriyent", "Fan", "BioMed Academy", 4.7, "125 talaba", "6 oy", "Juma", "15:30", 800000, "Biologiyadan imtihonga tayyorlov."),
            ("Kimyo Abituriyent", "Fan", "Everest", 4.6, "110 talaba", "6 oy", "Payshanba", "14:30", 850000, "Kimyo nazariya va masalalar."),
            ("Fizika Abituriyent", "Fan", "Registon LC", 4.6, "130 talaba", "6 oy", "Seshanba", "16:00", 850000, "DTM va testlarga tayyorlov."),
            ("Mental Arifmetika", "Fan", "Smart Kids", 4.7, "150 talaba", "4 oy", "Shanba", "09:30", 600000, "Bolalar uchun tez hisoblash kursi."),
            ("Turk Tili", "Til", "Istanbul Academy", 4.6, "95 talaba", "3 oy", "Juma", "11:00", 700000, "Turk tili so'zlashuv va grammatika."),
        ]
        c.executemany(
            "INSERT INTO courses (title,category,center,rating,students,duration,day,time,price,description) VALUES (?,?,?,?,?,?,?,?,?,?)",
            courses
        )

    # O'qituvchilarni seed qilish
    c.execute("SELECT COUNT(*) FROM teachers")
    if c.fetchone()[0] == 0:
        teachers = [
            ("Jasur Toshmatov", "IT / Python", "5 yil", "320 talaba", 4.9, "Python va Django mutaxassisi"),
            ("Malika Yusupova", "Til / IELTS", "7 yil", "410 talaba", 4.8, "IELTS 8.5 ball egasi"),
            ("Bobur Karimov", "IT / Frontend", "4 yil", "280 talaba", 4.7, "React va Vue.js ustasi"),
            ("Nilufar Hasanova", "Dizayn / UI-UX", "6 yil", "190 talaba", 4.9, "Figma va Adobe XD eksperti"),
            ("Sardor Mirzayev", "IT / Java", "8 yil", "350 talaba", 4.8, "Java backend arxitektori"),
            ("Zulfiya Rahimova", "Fan / Matematika", "10 yil", "500 talaba", 4.9, "Oliy matematika o'qituvchisi"),
            ("Otabek Sobirov", "IT / Flutter", "3 yil", "160 talaba", 4.6, "Cross-platform mobile ilovalar"),
            ("Kamola Nazarova", "Til / Rus tili", "9 yil", "380 talaba", 4.8, "Rus tili va adabiyoti"),
        ]
        c.executemany(
            "INSERT INTO teachers (name,subject,experience,students,rating,bio) VALUES (?,?,?,?,?,?)",
            teachers
        )

    # Test teacher applications (20 ta) — email pattern bilan tekshirish
    c.execute("SELECT COUNT(*) FROM teacher_applications WHERE email LIKE '%@test.uz' AND status='accepted'")
    if c.fetchone()[0] == 0:
        test_apps = [
            ('Alisher Nazarov',       'a.nazarov@test.uz',       '+998901234501', 'IT / Python',               '3 yil',  "Python, Django va FastAPI bo'yicha tajribali muallim.",    'accepted'),
            ('Barno Qodirova',        'b.qodirova@test.uz',      '+998901234502', 'Til / IELTS',               '5 yil',  "IELTS Band 8.5. Speaking va Writing ixtisoslashuvi.",      'accepted'),
            ('Sardor Umarov',         's.umarov@test.uz',        '+998901234503', 'IT / JavaScript',           '4 yil',  "React, Vue, TypeScript bo'yicha frontend mutaxassis.",     'accepted'),
            ('Dilnoza Tursunova',     'd.tursunova@test.uz',     '+998901234504', 'Dizayn / Figma',            '2 yil',  "UI/UX dizayn va prototiplash, Figma expert.",              'accepted'),
            ('Mansur Xolmatov',       'm.xolmatov@test.uz',      '+998901234505', 'IT / Java',                 '6 yil',  "Java Spring Boot, microservices arxitekturasi.",           'accepted'),
            ('Lobar Ergasheva',       'l.ergasheva@test.uz',     '+998901234506', 'Fan / Matematika',          '8 yil',  "Oliy matematika va DTM imtihonlariga tayyorlash.",         'accepted'),
            ('Behruz Askarov',        'b.askarov@test.uz',       '+998901234507', 'IT / Flutter',              '3 yil',  "Dart va Flutter bilan iOS/Android ilovalar yaratish.",     'accepted'),
            ('Gulnora Sultonova',     'g.sultonova@test.uz',     '+998901234508', 'Til / Ingliz tili',         '9 yil',  "Cambridge sertifikati. Grammatika va leksikologiya.",      'accepted'),
            ('Jahongir Razzaqov',     'j.razzaqov@test.uz',      '+998901234509', 'Marketing / SMM',           '4 yil',  "Instagram, Facebook va TikTok SMM strategiyalari.",       'accepted'),
            ('Mohira Islomova',       'm.islomova@test.uz',      '+998901234510', 'Fan / Biologiya',           '7 yil',  "Tibbiyot va biologiya fanlari bo'yicha tajribali muallim.",'accepted'),
            ('Temur Abdullayev',      't.abdullayev@test.uz',    '+998901234511', 'IT / Backend NodeJS',       '5 yil',  "Node.js, Express, REST API va MongoDB.",                  'accepted'),
            ('Sitora Xasanova',       's.xasanova@test.uz',      '+998901234512', 'Dizayn / UI-UX',            '4 yil',  "Figma, Adobe XD, brending va dizayn tizimi.",             'accepted'),
            ('Farrux Normatov',       'f.normatov@test.uz',      '+998901234513', 'IT / Data Science',         '3 yil',  "Python, Pandas, NumPy, Power BI tahlil.",                 'accepted'),
            ('Nargiza Saidova',       'n.saidova@test.uz',       '+998901234514', 'Til / Rus tili',            '6 yil',  "Rus tili ona-tilli darajasida. C1 sertifikat.",            'accepted'),
            ('Ulugbek Kalandarov',    'u.kalandarov@test.uz',    '+998901234515', "IT / Kiberxavfsizlik",      '5 yil',  "Network security, ethical hacking va CTF.",               'accepted'),
            ('Hulkar Toshpulatova',   'h.toshpulatova@test.uz',  '+998901234516', 'Fan / Fizika',              '10 yil', "Umumiy fizika va DTM fizika olimpiadasi.",                'accepted'),
            ('Aziz Mirzaev',          'a.mirzaev@test.uz',       '+998901234517', "IT / Sun'iy Intellekt",     '4 yil',  "ML, Deep Learning, TensorFlow va PyTorch.",               'accepted'),
            ('Maftuna Yusupova',      'm2.yusupova@test.uz',     '+998901234518', 'Til / Koreys tili',         '3 yil',  "TOPIK II sertifikati. Koreys tili va madaniyati.",         'accepted'),
            ('Sherzod Murodov',       'sh.murodov@test.uz',      '+998901234519', 'IT / C++ va Algoritmlar',   '6 yil',  "Competitive programming va ACM ICPC murabbiyi.",          'accepted'),
            ('Ziyoda Rahmatullayeva', 'z.rahmatullayeva@test.uz', '+998901234520', 'Marketing / Digital',      '2 yil',  "SEO, kontekstli reklama va analitika.",                   'accepted'),
        ]
        c.executemany(
            "INSERT INTO teacher_applications (name,email,phone,subject,experience,message,status) VALUES (?,?,?,?,?,?,?)",
            test_apps
        )

    # O'qituvchi arizalarini kurslarga biriktirish (faqat bo'sh bo'lganlarga)
    unassigned = [r[0] for r in c.execute(
        "SELECT id FROM courses WHERE teacher_app_id IS NULL ORDER BY id"
    ).fetchall()]
    apps = [r[0] for r in c.execute(
        "SELECT id FROM teacher_applications WHERE status='accepted' ORDER BY id"
    ).fetchall()]
    for course_id, app_id in zip(unassigned, apps):
        c.execute("UPDATE courses SET teacher_app_id=? WHERE id=?", (app_id, course_id))

    # Test o'qituvchi foydalanuvchilari (20 ta, role='teacher')
    c.execute("SELECT COUNT(*) FROM users WHERE role='teacher' AND email LIKE '%@ttest.uz'")
    if c.fetchone()[0] == 0:
        teacher_users = [
            ('Jasur Toshmatov',    'jasur.t@ttest.uz'),
            ('Malika Yusupova',    'malika.y@ttest.uz'),
            ('Bobur Karimov',      'bobur.k@ttest.uz'),
            ('Nilufar Hasanova',   'nilufar.h@ttest.uz'),
            ('Sardor Mirzayev',    'sardor.m@ttest.uz'),
            ('Zulfiya Rahimova',   'zulfiya.r@ttest.uz'),
            ('Otabek Sobirov',     'otabek.s@ttest.uz'),
            ('Kamola Nazarova',    'kamola.n@ttest.uz'),
            ('Alisher Karimov',    'alisher.k@ttest.uz'),
            ('Dilnoza Ergasheva',  'dilnoza.e@ttest.uz'),
            ('Mansur Yusupov',     'mansur.yu@ttest.uz'),
            ('Lobar Mirzayeva',    'lobar.mi@ttest.uz'),
            ('Behruz Qodirov',     'behruz.q@ttest.uz'),
            ('Gulnora Abdullayeva','gulnora.a@ttest.uz'),
            ('Jahongir Xolmatov',  'jahongir.x@ttest.uz'),
            ('Mohira Razzaqova',   'mohira.rz@ttest.uz'),
            ('Temur Sobirov',      'temur.so@ttest.uz'),
            ('Sitora Tursunova',   'sitora.tu@ttest.uz'),
            ('Farrux Islomov',     'farrux.is@ttest.uz'),
            ('Nargiza Sultonova',  'nargiza.su@ttest.uz'),
        ]
        pw_hash = bcrypt.hashpw(b'123456', bcrypt.gensalt()).decode()
        for name, email in teacher_users:
            try:
                c.execute("INSERT INTO users (firstName,email,password,role) VALUES (?,?,?,?)",
                          (name, email, pw_hash, 'teacher'))
            except Exception:
                pass

    # Test o'quvchi foydalanuvchilari (50 ta, role='user')
    c.execute("SELECT COUNT(*) FROM users WHERE role='user' AND email LIKE 'std%@ttest.uz'")
    if c.fetchone()[0] == 0:
        student_data = [
            ('Abdullayev Jasur',     'std01@ttest.uz'),
            ('Karimova Malika',      'std02@ttest.uz'),
            ('Toshmatov Bobur',      'std03@ttest.uz'),
            ("Xo'jayeva Nilufar",    'std04@ttest.uz'),
            ('Mirzayev Sardor',      'std05@ttest.uz'),
            ('Rahimova Zulfiya',     'std06@ttest.uz'),
            ('Sobirov Otabek',       'std07@ttest.uz'),
            ('Nazarova Kamola',      'std08@ttest.uz'),
            ('Yusupov Asilbek',      'std09@ttest.uz'),
            ('Hasanova Dilnoza',     'std10@ttest.uz'),
            ('Aliyev Umid',          'std11@ttest.uz'),
            ('Qosimova Maftuna',     'std12@ttest.uz'),
            ('Normatov Sherzod',     'std13@ttest.uz'),
            ('Ergasheva Shahnoza',   'std14@ttest.uz'),
            ('Tursunov Behruz',      'std15@ttest.uz'),
            ('Qodirov Murod',        'std16@ttest.uz'),
            ('Islomova Gulnora',     'std17@ttest.uz'),
            ('Holiqov Nurbek',       'std18@ttest.uz'),
            ('Xolmatov Eldor',       'std19@ttest.uz'),
            ('Sultonova Barno',      'std20@ttest.uz'),
            ('Razzaqov Davron',      'std21@ttest.uz'),
            ('Abdullayeva Muslima',  'std22@ttest.uz'),
            ('Karimov Nodir',        'std23@ttest.uz'),
            ('Mirzayeva Ozoda',      'std24@ttest.uz'),
            ('Toshmatov Sanjar',     'std25@ttest.uz'),
            ('Yusupova Feruza',      'std26@ttest.uz'),
            ('Askarov Abdulla',      'std27@ttest.uz'),
            ('Tursunova Nasiba',     'std28@ttest.uz'),
            ('Hasanov Hamid',        'std29@ttest.uz'),
            ('Ergasheva Umida',      'std30@ttest.uz'),
            ('Qodirov Laziz',        'std31@ttest.uz'),
            ('Islomov Mirzo',        'std32@ttest.uz'),
            ('Holiqova Dildora',     'std33@ttest.uz'),
            ('Xolmatova Yulduz',     'std34@ttest.uz'),
            ('Sultonov Ismoil',      'std35@ttest.uz'),
            ('Razzaqova Mavluda',    'std36@ttest.uz'),
            ('Abdullayev Aziz',      'std37@ttest.uz'),
            ('Karimova Sevinch',     'std38@ttest.uz'),
            ('Toshpulatov Ulmas',    'std39@ttest.uz'),
            ('Yusupov Ulugbek',      'std40@ttest.uz'),
            ('Askarov Sherzod',      'std41@ttest.uz'),
            ('Tursunov Zafar',       'std42@ttest.uz'),
            ('Hasanova Hulkar',      'std43@ttest.uz'),
            ('Ergashev Doniyor',     'std44@ttest.uz'),
            ('Qodirova Sabohat',     'std45@ttest.uz'),
            ('Islomov Firdavs',      'std46@ttest.uz'),
            ('Holiqova Aziza',       'std47@ttest.uz'),
            ('Xolmatov Baxtiyor',    'std48@ttest.uz'),
            ('Sultonova Mohira',     'std49@ttest.uz'),
            ('Razzaqov Mansur',      'std50@ttest.uz'),
        ]
        pw_hash2 = bcrypt.hashpw(b'123456', bcrypt.gensalt()).decode()
        for name, email in student_data:
            try:
                c.execute("INSERT INTO users (firstName,email,password,role) VALUES (?,?,?,?)",
                          (name, email, pw_hash2, 'user'))
            except Exception:
                pass

    # Test enrollments: har bir o'quvchini 3 ta kursga yozish
    student_ids = [r[0] for r in c.execute(
        "SELECT id FROM users WHERE role='user' AND email LIKE 'std%@ttest.uz' ORDER BY id"
    ).fetchall()]
    course_ids = [r[0] for r in c.execute(
        "SELECT id FROM courses ORDER BY id"
    ).fetchall()]
    if student_ids and course_ids:
        n = len(course_ids)
        for i, sid in enumerate(student_ids):
            existing_count = c.execute(
                "SELECT COUNT(*) FROM enrollments WHERE user_id=?", (sid,)
            ).fetchone()[0]
            if existing_count == 0:
                for j in range(3):
                    cid = course_ids[(i * 3 + j) % n]
                    try:
                        c.execute("INSERT INTO enrollments (user_id,course_id) VALUES (?,?)", (sid, cid))
                    except Exception:
                        pass

    # Test to'lovlar: yozilganlarning ~60% to'lagan, ~20% kutilmoqda, ~20% qarz
    METHODS = ['Naqd', 'Karta', 'Payme', 'Click']
    unpaid_enrs = c.execute("""
        SELECT e.user_id, e.course_id, c.price
        FROM enrollments e
        JOIN courses c ON e.course_id = c.id
        JOIN users u ON e.user_id = u.id
        WHERE u.email LIKE 'std%@ttest.uz'
          AND NOT EXISTS (SELECT 1 FROM payments p WHERE p.user_id=e.user_id AND p.course_id=e.course_id)
        ORDER BY e.user_id
    """).fetchall()
    for idx, (uid, cid, price) in enumerate(unpaid_enrs):
        r = idx % 5
        if r < 3:      # 60% — to'ladi
            c.execute(
                "INSERT INTO payments (user_id,course_id,amount,method,status) VALUES (?,?,?,?,?)",
                (uid, cid, price or 1000000, METHODS[idx % 4], 'paid')
            )
        elif r == 3:   # 20% — kutilmoqda
            c.execute(
                "INSERT INTO payments (user_id,course_id,amount,method,status) VALUES (?,?,?,?,?)",
                (uid, cid, (price or 1000000) // 2, METHODS[idx % 4], 'pending')
            )
        # r == 4 → to'lov yo'q (qarzdor)

    conn.commit()
    conn.close()
