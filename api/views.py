import json
import os
import jwt
import bcrypt
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from django.core.mail import send_mail
from .db import get_conn

def jwt_encode(payload):
    return jwt.encode(payload, settings.JWT_SECRET, algorithm='HS256')

def jwt_decode(token):
    return jwt.decode(token, settings.JWT_SECRET, algorithms=['HS256'])

def get_user(request):
    auth = request.headers.get('Authorization', '')
    if not auth.startswith('Bearer '):
        return None
    try:
        payload = jwt_decode(auth[7:])
        conn = get_conn()
        user = conn.execute("SELECT * FROM users WHERE id=?", (payload['id'],)).fetchone()
        conn.close()
        return dict(user) if user else None
    except Exception:
        return None

def row_to_dict(row):
    return dict(row) if row else None

def rows_to_list(rows):
    return [dict(r) for r in rows]

# --- AUTH ---

@csrf_exempt
def register(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    data = json.loads(request.body)
    firstName = data.get('firstName', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '')
    if not firstName or not email or not password:
        return JsonResponse({'error': "Barcha maydonlarni to'ldiring"}, status=400)
    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    conn = get_conn()
    try:
        conn.execute("INSERT INTO users (firstName,email,password,role) VALUES (?,?,?,?)",
                     (firstName, email, hashed, 'user'))
        conn.commit()
        return JsonResponse({'message': "Ro'yxatdan o'tildi"})
    except Exception:
        return JsonResponse({'error': 'Bu email allaqachon mavjud'}, status=400)
    finally:
        conn.close()

@csrf_exempt
def login(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    data = json.loads(request.body)
    email = data.get('email', '')
    password = data.get('password', '')
    conn = get_conn()
    user = conn.execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
    conn.close()
    if not user:
        return JsonResponse({'error': "Email yoki parol noto'g'ri"}, status=400)
    user = dict(user)
    if not bcrypt.checkpw(password.encode(), user['password'].encode()):
        return JsonResponse({'error': "Email yoki parol noto'g'ri"}, status=400)
    token = jwt_encode({'id': user['id'], 'role': user['role']})
    return JsonResponse({
        'token': token,
        'user': {'id': user['id'], 'firstName': user['firstName'],
                 'email': user['email'], 'role': user['role']}
    })

@csrf_exempt
def me(request):
    user = get_user(request)
    if not user:
        return JsonResponse({'error': 'Unauthorized'}, status=401)
    if request.method == 'GET':
        return JsonResponse({'id': user['id'], 'firstName': user['firstName'],
                             'email': user['email'], 'role': user['role']})
    if request.method == 'PUT':
        data = json.loads(request.body)
        conn = get_conn()
        conn.execute("UPDATE users SET firstName=? WHERE id=?",
                     (data.get('firstName', user['firstName']), user['id']))
        conn.commit()
        conn.close()
        return JsonResponse({'message': 'Profil yangilandi'})
    return JsonResponse({'error': 'Method not allowed'}, status=405)

# --- COURSES ---

@csrf_exempt
def courses(request):
    conn = get_conn()
    if request.method == 'GET':
        rows = conn.execute("""
            SELECT c.*,
                   ta.name  AS teacher_name,
                   ta.subject AS teacher_subject,
                   ta.phone   AS teacher_phone,
                   ta.email   AS teacher_email
            FROM courses c
            LEFT JOIN teacher_applications ta ON c.teacher_app_id = ta.id
            ORDER BY c.id DESC
        """).fetchall()
        conn.close()
        return JsonResponse(rows_to_list(rows), safe=False)
    if request.method == 'POST':
        user = get_user(request)
        if not user or user['role'] != 'admin':
            return JsonResponse({'error': 'Ruxsat yo\'q'}, status=403)
        d = json.loads(request.body)
        conn.execute(
            "INSERT INTO courses (title,category,center,rating,students,duration,day,time,price,description,image) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
            (d.get('title'), d.get('category'), d.get('center'), d.get('rating', 0),
             d.get('students', '0'), d.get('duration'), d.get('day'), d.get('time'),
             d.get('price', 0), d.get('description'), d.get('image', ''))
        )
        conn.commit()
        conn.close()
        return JsonResponse({'message': "Kurs qo'shildi"})
    conn.close()
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def course_detail(request, pk):
    conn = get_conn()
    if request.method == 'GET':
        row = conn.execute("SELECT * FROM courses WHERE id=?", (pk,)).fetchone()
        conn.close()
        if not row:
            return JsonResponse({'error': 'Topilmadi'}, status=404)
        return JsonResponse(row_to_dict(row))
    if request.method == 'PUT':
        user = get_user(request)
        if not user or user['role'] != 'admin':
            return JsonResponse({'error': 'Ruxsat yo\'q'}, status=403)
        d = json.loads(request.body)
        teacher_app_id  = d.get('teacher_app_id')  or None
        teacher_user_id = d.get('teacher_user_id') or None
        conn.execute(
            "UPDATE courses SET title=?,category=?,center=?,rating=?,students=?,duration=?,day=?,time=?,price=?,description=?,image=?,teacher_app_id=?,teacher_user_id=? WHERE id=?",
            (d.get('title'), d.get('category'), d.get('center'), d.get('rating'),
             d.get('students'), d.get('duration'), d.get('day'), d.get('time'),
             d.get('price'), d.get('description'), d.get('image', ''),
             teacher_app_id, teacher_user_id, pk)
        )
        conn.commit()
        conn.close()
        return JsonResponse({'message': 'Kurs yangilandi'})
    if request.method == 'DELETE':
        user = get_user(request)
        if not user or user['role'] != 'admin':
            return JsonResponse({'error': 'Ruxsat yo\'q'}, status=403)
        conn.execute("DELETE FROM courses WHERE id=?", (pk,))
        conn.commit()
        conn.close()
        return JsonResponse({'message': "Kurs o'chirildi"})
    conn.close()
    return JsonResponse({'error': 'Method not allowed'}, status=405)

# --- TEACHERS ---

@csrf_exempt
def teachers(request):
    conn = get_conn()
    if request.method == 'GET':
        rows = conn.execute("SELECT * FROM teachers ORDER BY id DESC").fetchall()
        conn.close()
        return JsonResponse(rows_to_list(rows), safe=False)
    if request.method == 'POST':
        user = get_user(request)
        if not user or user['role'] != 'admin':
            return JsonResponse({'error': 'Ruxsat yo\'q'}, status=403)
        d = json.loads(request.body)
        conn.execute(
            "INSERT INTO teachers (name,subject,experience,students,rating,bio,image) VALUES (?,?,?,?,?,?,?)",
            (d.get('name'), d.get('subject'), d.get('experience'),
             d.get('students', '0'), d.get('rating', 0), d.get('bio', ''), d.get('image', ''))
        )
        conn.commit()
        conn.close()
        return JsonResponse({'message': "O'qituvchi qo'shildi"})
    conn.close()
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def teacher_detail(request, pk):
    conn = get_conn()
    if request.method == 'GET':
        row = conn.execute("SELECT * FROM teachers WHERE id=?", (pk,)).fetchone()
        conn.close()
        if not row:
            return JsonResponse({'error': 'Topilmadi'}, status=404)
        return JsonResponse(row_to_dict(row))
    if request.method == 'PUT':
        user = get_user(request)
        if not user or user['role'] != 'admin':
            return JsonResponse({'error': 'Ruxsat yo\'q'}, status=403)
        d = json.loads(request.body)
        conn.execute(
            "UPDATE teachers SET name=?,subject=?,experience=?,students=?,rating=?,bio=?,image=? WHERE id=?",
            (d.get('name'), d.get('subject'), d.get('experience'),
             d.get('students'), d.get('rating'), d.get('bio', ''), d.get('image', ''), pk)
        )
        conn.commit()
        conn.close()
        return JsonResponse({'message': "O'qituvchi yangilandi"})
    if request.method == 'DELETE':
        user = get_user(request)
        if not user or user['role'] != 'admin':
            return JsonResponse({'error': 'Ruxsat yo\'q'}, status=403)
        conn.execute("DELETE FROM teachers WHERE id=?", (pk,))
        conn.commit()
        conn.close()
        return JsonResponse({'message': "O'qituvchi o'chirildi"})
    conn.close()
    return JsonResponse({'error': 'Method not allowed'}, status=405)

# --- ENROLLMENTS ---

@csrf_exempt
def enrollments(request):
    user = get_user(request)
    if not user:
        return JsonResponse({'error': 'Unauthorized'}, status=401)
    conn = get_conn()
    if request.method == 'GET':
        rows = conn.execute(
            "SELECT e.*, c.title, c.category, c.price, c.duration, c.center FROM enrollments e JOIN courses c ON e.course_id=c.id WHERE e.user_id=?",
            (user['id'],)
        ).fetchall()
        conn.close()
        return JsonResponse(rows_to_list(rows), safe=False)
    if request.method == 'POST':
        d = json.loads(request.body)
        course_id = d.get('course_id')
        # Manager/admin may enroll any user; others enroll themselves
        if user['role'] in ('admin', 'manager') and d.get('user_id'):
            target_id = int(d['user_id'])
        else:
            target_id = user['id']
        existing = conn.execute(
            "SELECT id FROM enrollments WHERE user_id=? AND course_id=?",
            (target_id, course_id)
        ).fetchone()
        if existing:
            conn.close()
            return JsonResponse({'error': 'Allaqachon yozilgan'}, status=400)
        conn.execute("INSERT INTO enrollments (user_id,course_id) VALUES (?,?)", (target_id, course_id))
        conn.commit()
        conn.close()
        return JsonResponse({'message': 'Kursga yozildi'})
    conn.close()
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def enrollment_delete(request, pk):
    user = get_user(request)
    if not user:
        return JsonResponse({'error': 'Unauthorized'}, status=401)
    if request.method == 'DELETE':
        conn = get_conn()
        if user['role'] in ('admin', 'manager'):
            conn.execute("DELETE FROM enrollments WHERE id=?", (pk,))
        else:
            conn.execute("DELETE FROM enrollments WHERE id=? AND user_id=?", (pk, user['id']))
        conn.commit()
        conn.close()
        return JsonResponse({'message': "O'chirildi"})
    return JsonResponse({'error': 'Method not allowed'}, status=405)

# --- FEEDBACKS ---

@csrf_exempt
def feedbacks(request):
    conn = get_conn()
    if request.method == 'GET':
        course_id = request.GET.get('course_id')
        if course_id:
            rows = conn.execute(
                "SELECT f.*, u.firstName FROM feedbacks f JOIN users u ON f.user_id=u.id WHERE f.course_id=? ORDER BY f.id DESC",
                (course_id,)
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT f.*, u.firstName FROM feedbacks f JOIN users u ON f.user_id=u.id ORDER BY f.id DESC"
            ).fetchall()
        conn.close()
        return JsonResponse(rows_to_list(rows), safe=False)
    if request.method == 'POST':
        user = get_user(request)
        if not user:
            return JsonResponse({'error': 'Unauthorized'}, status=401)
        d = json.loads(request.body)
        conn.execute(
            "INSERT INTO feedbacks (user_id,course_id,rating,comment) VALUES (?,?,?,?)",
            (user['id'], d.get('course_id'), d.get('rating', 5), d.get('comment', ''))
        )
        conn.commit()
        conn.close()
        return JsonResponse({'message': 'Izoh qoldirildi'})
    conn.close()
    return JsonResponse({'error': 'Method not allowed'}, status=405)

# --- TEACHER APPLICATIONS ---

@csrf_exempt
def teacher_applications(request):
    if request.method == 'GET':
        user = get_user(request)
        if not user or user['role'] != 'admin':
            return JsonResponse({'error': 'Ruxsat yo\'q'}, status=403)
        conn = get_conn()
        status_filter = request.GET.get('status')
        if status_filter:
            rows = conn.execute(
                "SELECT * FROM teacher_applications WHERE status=? ORDER BY id DESC",
                (status_filter,)
            ).fetchall()
        else:
            rows = conn.execute("SELECT * FROM teacher_applications ORDER BY id DESC").fetchall()
        conn.close()
        return JsonResponse(rows_to_list(rows), safe=False)
    if request.method == 'POST':
        name     = request.POST.get('name', '')
        email    = request.POST.get('email', '')
        phone    = request.POST.get('phone', '')
        subject  = request.POST.get('subject', '')
        experience = request.POST.get('experience', '')
        message  = request.POST.get('message', '')
        cv_filename = ''
        if 'cv' in request.FILES:
            cv_file = request.FILES['cv']
            media_dir = os.path.join(str(settings.BASE_DIR), 'media', 'cvs')
            os.makedirs(media_dir, exist_ok=True)
            safe = f"{email}_{cv_file.name}".replace('/', '_').replace('\\', '_').replace(' ', '_')
            with open(os.path.join(media_dir, safe), 'wb') as f:
                for chunk in cv_file.chunks():
                    f.write(chunk)
            cv_filename = safe
        conn = get_conn()
        conn.execute(
            "INSERT INTO teacher_applications (name,email,phone,subject,experience,message,cv_filename) VALUES (?,?,?,?,?,?,?)",
            (name, email, phone, subject, experience, message, cv_filename)
        )
        conn.commit()
        conn.close()
        return JsonResponse({'message': 'Ariza yuborildi'})
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def application_status(request, pk):
    user = get_user(request)
    if not user or user['role'] != 'admin':
        return JsonResponse({'error': 'Ruxsat yo\'q'}, status=403)
    if request.method == 'PUT':
        d = json.loads(request.body)
        new_status = d.get('status')
        conn = get_conn()
        conn.execute("UPDATE teacher_applications SET status=? WHERE id=?", (new_status, pk))
        if new_status in ('accepted', 'rejected'):
            app = conn.execute("SELECT * FROM teacher_applications WHERE id=?", (pk,)).fetchone()
            if app:
                app = dict(app)
                if new_status == 'accepted':
                    msg = "Tabriklaymiz! EduCore o'quv markaziga o'qituvchi sifatida arizangiz qabul qilindi. Tez orada siz bilan bog'lanamiz."
                    subject = "EduCore — Arizangiz qabul qilindi ✅"
                else:
                    msg = "Arizangiz ko'rib chiqildi. Afsuski, hozircha bo'sh o'rin mavjud emas. Keyingi imkoniyatda qayta murojaat qiling."
                    subject = "EduCore — Ariza natijasi"
                conn.execute(
                    "INSERT INTO notifications (email, message) VALUES (?,?)",
                    (app['email'], msg)
                )
                try:
                    send_mail(
                        subject=subject,
                        message=f"Hurmatli {app['name']},\n\n{msg}\n\nHurmat bilan,\nEduCore jamoasi",
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=[app['email']],
                        fail_silently=True,
                    )
                except Exception:
                    pass
        conn.commit()
        conn.close()
        return JsonResponse({'message': 'Status yangilandi'})
    return JsonResponse({'error': 'Method not allowed'}, status=405)

# --- NOTIFICATIONS ---

@csrf_exempt
def notifications(request):
    if request.method == 'GET':
        user = get_user(request)
        if not user:
            return JsonResponse([], safe=False)
        conn = get_conn()
        rows = conn.execute(
            "SELECT * FROM notifications WHERE email=? ORDER BY id DESC LIMIT 20",
            (user['email'],)
        ).fetchall()
        conn.close()
        return JsonResponse(rows_to_list(rows), safe=False)
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def notification_read(request, pk):
    if request.method == 'PUT':
        conn = get_conn()
        conn.execute("UPDATE notifications SET is_read=1 WHERE id=?", (pk,))
        conn.commit()
        conn.close()
        return JsonResponse({'ok': True})
    return JsonResponse({'error': 'Method not allowed'}, status=405)

# --- USERS (admin) ---

@csrf_exempt
def users(request):
    user = get_user(request)
    if not user or user['role'] not in ('admin', 'manager'):
        return JsonResponse({'error': 'Ruxsat yo\'q'}, status=403)
    conn = get_conn()
    if request.method == 'GET':
        role_filter = request.GET.get('role')
        if role_filter:
            rows = conn.execute("SELECT id,firstName,email,role FROM users WHERE role=? ORDER BY id DESC", (role_filter,)).fetchall()
        else:
            rows = conn.execute("SELECT id,firstName,email,role FROM users ORDER BY id DESC").fetchall()
        conn.close()
        return JsonResponse(rows_to_list(rows), safe=False)
    conn.close()
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def user_detail(request, pk):
    user = get_user(request)
    if not user or user['role'] not in ('admin', 'manager'):
        return JsonResponse({'error': 'Ruxsat yo\'q'}, status=403)
    conn = get_conn()
    if request.method == 'PUT':
        d = json.loads(request.body)
        if 'role' in d:
            conn.execute("UPDATE users SET role=? WHERE id=?", (d['role'], pk))
        if 'firstName' in d:
            conn.execute("UPDATE users SET firstName=? WHERE id=?", (d['firstName'], pk))
        conn.commit()
        conn.close()
        return JsonResponse({'message': 'Yangilandi'})
    if request.method == 'DELETE':
        conn.execute("DELETE FROM users WHERE id=?", (pk,))
        conn.commit()
        conn.close()
        return JsonResponse({'message': "O'chirildi"})
    conn.close()
    return JsonResponse({'error': 'Method not allowed'}, status=405)

# --- STUDENTS (alias for users with role='user') ---

@csrf_exempt
def students(request):
    user = get_user(request)
    if not user or user['role'] not in ('admin', 'manager', 'teacher'):
        return JsonResponse({'error': 'Ruxsat yo\'q'}, status=403)
    conn = get_conn()
    if request.method == 'GET':
        rows = conn.execute(
            "SELECT id,firstName,email,role FROM users WHERE role IN ('user','student') ORDER BY id DESC"
        ).fetchall()
        conn.close()
        return JsonResponse(rows_to_list(rows), safe=False)
    if request.method == 'POST':
        if user['role'] not in ('admin', 'manager'):
            return JsonResponse({'error': 'Ruxsat yo\'q'}, status=403)
        d = json.loads(request.body)
        firstName = d.get('firstName', '').strip()
        email = d.get('email', '').strip()
        password = d.get('password', '123456')
        if not firstName or not email:
            return JsonResponse({'error': "Ism va email kiritish shart"}, status=400)
        hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
        try:
            cur = conn.execute("INSERT INTO users (firstName,email,password,role) VALUES (?,?,?,?)",
                               (firstName, email, hashed, 'user'))
            new_id = cur.lastrowid
            conn.commit()
            conn.close()
            return JsonResponse({'message': "O'quvchi qo'shildi", 'id': new_id})
        except Exception:
            conn.close()
            return JsonResponse({'error': 'Bu email allaqachon mavjud'}, status=400)
    conn.close()
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def manager_students_list(request):
    user = get_user(request)
    if not user or user['role'] not in ('admin', 'manager'):
        return JsonResponse({'error': 'Ruxsat yo\'q'}, status=403)
    conn = get_conn()
    rows = conn.execute("""
        SELECT
            u.id, u.firstName, u.email,
            COALESCE(GROUP_CONCAT(c.title, ' || '), '') AS courses,
            COUNT(e.id) AS enrollment_count
        FROM users u
        LEFT JOIN enrollments e ON e.user_id = u.id
        LEFT JOIN courses c ON e.course_id = c.id
        WHERE u.role IN ('user', 'student')
        GROUP BY u.id
        ORDER BY u.id DESC
    """).fetchall()
    conn.close()
    return JsonResponse(rows_to_list(rows), safe=False)

@csrf_exempt
def student_detail(request, pk):
    user = get_user(request)
    if not user or user['role'] not in ('admin', 'manager'):
        return JsonResponse({'error': 'Ruxsat yo\'q'}, status=403)
    conn = get_conn()
    if request.method == 'PUT':
        d = json.loads(request.body)
        if 'firstName' in d:
            conn.execute("UPDATE users SET firstName=? WHERE id=?", (d['firstName'], pk))
        if 'email' in d:
            conn.execute("UPDATE users SET email=? WHERE id=?", (d['email'], pk))
        conn.commit()
        conn.close()
        return JsonResponse({'message': 'Yangilandi'})
    if request.method == 'DELETE':
        conn.execute("DELETE FROM users WHERE id=?", (pk,))
        conn.commit()
        conn.close()
        return JsonResponse({'message': "O'chirildi"})
    conn.close()
    return JsonResponse({'error': 'Method not allowed'}, status=405)

# --- PAYMENTS ---

@csrf_exempt
def payments(request):
    user = get_user(request)
    if not user:
        return JsonResponse({'error': 'Unauthorized'}, status=401)
    conn = get_conn()
    if request.method == 'GET':
        if user['role'] in ('admin', 'manager'):
            rows = conn.execute(
                "SELECT p.*,u.firstName,c.title as course_title FROM payments p JOIN users u ON p.user_id=u.id JOIN courses c ON p.course_id=c.id ORDER BY p.id DESC"
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT p.*,c.title as course_title FROM payments p JOIN courses c ON p.course_id=c.id WHERE p.user_id=? ORDER BY p.id DESC",
                (user['id'],)
            ).fetchall()
        conn.close()
        return JsonResponse(rows_to_list(rows), safe=False)
    if request.method == 'POST':
        if user['role'] not in ('admin', 'manager'):
            return JsonResponse({'error': 'Ruxsat yo\'q'}, status=403)
        d = json.loads(request.body)
        conn.execute(
            "INSERT INTO payments (user_id,course_id,amount,method,status) VALUES (?,?,?,?,?)",
            (d.get('user_id'), d.get('course_id'), d.get('amount', 0),
             d.get('method', 'Naqd'), d.get('status', 'paid'))
        )
        conn.commit()
        conn.close()
        return JsonResponse({'message': "To'lov qo'shildi"})
    conn.close()
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def payment_detail(request, pk):
    user = get_user(request)
    if not user or user['role'] not in ('admin', 'manager'):
        return JsonResponse({'error': 'Ruxsat yo\'q'}, status=403)
    conn = get_conn()
    if request.method == 'PUT':
        d = json.loads(request.body)
        conn.execute(
            "UPDATE payments SET amount=?,method=?,status=? WHERE id=?",
            (d.get('amount'), d.get('method'), d.get('status'), pk)
        )
        conn.commit()
        conn.close()
        return JsonResponse({'message': 'Yangilandi'})
    if request.method == 'DELETE':
        conn.execute("DELETE FROM payments WHERE id=?", (pk,))
        conn.commit()
        conn.close()
        return JsonResponse({'message': "O'chirildi"})
    conn.close()
    return JsonResponse({'error': 'Method not allowed'}, status=405)

# --- ATTENDANCE ---

@csrf_exempt
def attendance(request):
    user = get_user(request)
    if not user:
        return JsonResponse({'error': 'Unauthorized'}, status=401)
    conn = get_conn()
    if request.method == 'GET':
        course_id = request.GET.get('course_id')
        date = request.GET.get('date')
        query = "SELECT a.*,u.firstName FROM attendance a JOIN users u ON a.user_id=u.id WHERE 1=1"
        params = []
        if course_id:
            query += " AND a.course_id=?"
            params.append(course_id)
        if date:
            query += " AND a.date=?"
            params.append(date)
        if user['role'] not in ('admin', 'manager', 'teacher'):
            query += " AND a.user_id=?"
            params.append(user['id'])
        rows = conn.execute(query + " ORDER BY a.id DESC", params).fetchall()
        conn.close()
        return JsonResponse(rows_to_list(rows), safe=False)
    if request.method == 'POST':
        d = json.loads(request.body)
        records = d.get('records', [])
        date = d.get('date')
        course_id = d.get('course_id')
        for rec in records:
            existing = conn.execute(
                "SELECT id FROM attendance WHERE user_id=? AND course_id=? AND date=?",
                (rec['user_id'], course_id, date)
            ).fetchone()
            if existing:
                conn.execute("UPDATE attendance SET status=? WHERE id=?", (rec['status'], existing[0]))
            else:
                conn.execute(
                    "INSERT INTO attendance (user_id,course_id,date,status) VALUES (?,?,?,?)",
                    (rec['user_id'], course_id, date, rec['status'])
                )
        conn.commit()
        conn.close()
        return JsonResponse({'message': 'Davomat saqlandi'})
    conn.close()
    return JsonResponse({'error': 'Method not allowed'}, status=405)

# --- ADMIN STATS ---

def admin_stats(request):
    user = get_user(request)
    if not user or user['role'] != 'admin':
        return JsonResponse({'error': 'Ruxsat yo\'q'}, status=403)
    conn = get_conn()
    stats = {
        'users': conn.execute("SELECT COUNT(*) FROM users WHERE role='user'").fetchone()[0],
        'courses': conn.execute("SELECT COUNT(*) FROM courses").fetchone()[0],
        'teachers': conn.execute("SELECT COUNT(*) FROM teacher_applications WHERE status='accepted'").fetchone()[0],
        'enrollments': conn.execute("SELECT COUNT(*) FROM enrollments").fetchone()[0],
        'applications': conn.execute("SELECT COUNT(*) FROM teacher_applications WHERE status='pending'").fetchone()[0],
        'revenue': conn.execute("SELECT COALESCE(SUM(amount),0) FROM payments WHERE status='paid'").fetchone()[0],
    }
    conn.close()
    return JsonResponse(stats)

def manager_stats(request):
    user = get_user(request)
    if not user or user['role'] not in ('admin', 'manager'):
        return JsonResponse({'error': 'Ruxsat yo\'q'}, status=403)
    conn = get_conn()
    stats = {
        'students': conn.execute("SELECT COUNT(*) FROM users WHERE role='user'").fetchone()[0],
        'enrollments': conn.execute("SELECT COUNT(*) FROM enrollments").fetchone()[0],
        'courses': conn.execute("SELECT COUNT(*) FROM courses").fetchone()[0],
        'revenue': conn.execute("SELECT COALESCE(SUM(amount),0) FROM payments WHERE status='paid'").fetchone()[0],
        'pending_payments': conn.execute("SELECT COUNT(*) FROM payments WHERE status='pending'").fetchone()[0],
        'monthly_enrollments': conn.execute(
            "SELECT COUNT(*) FROM enrollments WHERE created_at >= date('now','start of month')"
        ).fetchone()[0],
    }
    conn.close()
    return JsonResponse(stats)

def teacher_stats(request):
    user = get_user(request)
    if not user or user['role'] not in ('admin', 'teacher'):
        return JsonResponse({'error': 'Ruxsat yo\'q'}, status=403)
    conn = get_conn()
    stats = {
        'courses': conn.execute("SELECT COUNT(*) FROM courses").fetchone()[0],
        'students': conn.execute("SELECT COUNT(*) FROM users WHERE role='user'").fetchone()[0],
        'enrollments': conn.execute("SELECT COUNT(*) FROM enrollments").fetchone()[0],
    }
    conn.close()
    return JsonResponse(stats)

def student_stats(request):
    user = get_user(request)
    if not user:
        return JsonResponse({'error': 'Unauthorized'}, status=401)
    conn = get_conn()
    enrollments = conn.execute("SELECT COUNT(*) FROM enrollments WHERE user_id=?", (user['id'],)).fetchone()[0]
    stats = {
        'enrollments': enrollments,
        'courses': conn.execute("SELECT COUNT(*) FROM courses").fetchone()[0],
    }
    conn.close()
    return JsonResponse(stats)

# --- COURSE PAYMENTS ---

def course_payments(request, course_id):
    user = get_user(request)
    if not user or user['role'] not in ('admin', 'manager'):
        return JsonResponse({'error': 'Ruxsat yo\'q'}, status=403)
    conn = get_conn()
    course = conn.execute("SELECT * FROM courses WHERE id=?", (course_id,)).fetchone()
    if not course:
        conn.close()
        return JsonResponse({'error': 'Kurs topilmadi'}, status=404)
    course = dict(course)

    # O'qituvchi: courses.teacher_app_id → teacher_applications
    teacher = None
    if course.get('teacher_app_id'):
        teacher = conn.execute(
            "SELECT * FROM teacher_applications WHERE id=?", (course['teacher_app_id'],)
        ).fetchone()

    # Kursga yozilgan talabalar + to'lov holati
    students = conn.execute("""
        SELECT
            u.id, u.firstName, u.email,
            COALESCE(p.status, 'unpaid') AS payment_status,
            COALESCE(p.amount, 0)        AS amount,
            p.id                         AS payment_id,
            e.id                         AS enrollment_id,
            e.created_at                 AS enrolled_at
        FROM enrollments e
        JOIN users u ON e.user_id = u.id
        LEFT JOIN payments p ON p.id = (
            SELECT MAX(id) FROM payments
            WHERE user_id = u.id AND course_id = e.course_id
        )
        WHERE e.course_id = ?
        ORDER BY e.created_at DESC
    """, (course_id,)).fetchall()
    conn.close()

    return JsonResponse({
        'course':   course,
        'teacher':  dict(teacher) if teacher else None,
        'students': rows_to_list(students),
    })

# --- ADMIN TEACHERS LIST ---

def admin_teachers_list(request):
    user = get_user(request)
    if not user or user['role'] != 'admin':
        return JsonResponse({'error': 'Ruxsat yo\'q'}, status=403)
    conn = get_conn()
    rows = conn.execute("""
        SELECT
            ta.id, ta.name, ta.email, ta.phone, ta.subject, ta.experience,
            ta.cv_filename, ta.created_at, ta.status,
            c.id    AS course_id,
            c.title AS course_title,
            c.category AS course_category,
            (SELECT COUNT(*) FROM enrollments WHERE course_id = c.id) AS student_count
        FROM teacher_applications ta
        LEFT JOIN courses c ON c.teacher_app_id = ta.id
        WHERE ta.status = 'accepted'
        ORDER BY ta.id DESC
    """).fetchall()
    conn.close()
    return JsonResponse(rows_to_list(rows), safe=False)

# --- RECENT ACTIVITY ---

def activity(request):
    user = get_user(request)
    if not user or user['role'] not in ('admin', 'manager'):
        return JsonResponse([], safe=False)
    conn = get_conn()
    items = []

    enrolls = conn.execute("""
        SELECT e.id, e.created_at, u.firstName, c.title
        FROM enrollments e
        JOIN users u ON e.user_id = u.id
        JOIN courses c ON e.course_id = c.id
        ORDER BY e.id DESC LIMIT 6
    """).fetchall()
    for e in enrolls:
        e = dict(e)
        items.append({'type':'enrollment','text':f"{e['firstName']} — {e['title']} kursiga yozildi",'time':e['created_at'],'icon':'🎒','color':'green'})

    pays = conn.execute("""
        SELECT p.id, p.created_at, p.amount, p.status, u.firstName, c.title
        FROM payments p
        JOIN users u ON p.user_id = u.id
        JOIN courses c ON p.course_id = c.id
        ORDER BY p.id DESC LIMIT 6
    """).fetchall()
    for p in pays:
        p = dict(p)
        items.append({'type':'payment','text':f"To'lov: {p['firstName']} — {p['amount']:,} so'm",'time':p['created_at'],'icon':'💳','color':'blue'})

    apps = conn.execute("""
        SELECT id, created_at, name, subject, status
        FROM teacher_applications
        ORDER BY id DESC LIMIT 4
    """).fetchall()
    for a in apps:
        a = dict(a)
        items.append({'type':'application','text':f"Yangi ariza: {a['name']} — {a['subject']}",'time':a['created_at'],'icon':'📝','color':'yellow'})

    conn.close()
    items.sort(key=lambda x: x.get('time') or '', reverse=True)
    return JsonResponse(items[:12], safe=False)

# --- TEACHER MY COURSES ---

def teacher_my_courses(request):
    user = get_user(request)
    if not user or user['role'] not in ('admin', 'teacher'):
        return JsonResponse({'error': 'Ruxsat yo\'q'}, status=403)
    conn = get_conn()
    rows = conn.execute("""
        SELECT c.*,
               ta.name    AS teacher_name,
               ta.subject AS teacher_subject,
               ta.phone   AS teacher_phone
        FROM courses c
        LEFT JOIN teacher_applications ta ON c.teacher_app_id = ta.id
        WHERE c.teacher_user_id = ?
        ORDER BY c.id DESC
    """, (user['id'],)).fetchall()
    conn.close()
    return JsonResponse(rows_to_list(rows), safe=False)

# --- ASSIGNMENTS ---

@csrf_exempt
def assignments(request):
    user = get_user(request)
    if not user:
        return JsonResponse({'error': 'Unauthorized'}, status=401)
    conn = get_conn()

    if request.method == 'GET':
        if user['role'] in ('admin', 'manager', 'teacher'):
            rows = conn.execute("""
                SELECT a.*, c.title AS course_title,
                    (SELECT COUNT(*) FROM submissions s WHERE s.assignment_id = a.id) AS submission_count,
                    (SELECT COUNT(*) FROM submissions s WHERE s.assignment_id = a.id AND s.status = 'graded') AS graded_count
                FROM assignments a
                JOIN courses c ON a.course_id = c.id
                ORDER BY a.created_at DESC
            """).fetchall()
        else:
            rows = conn.execute("""
                SELECT a.*, c.title AS course_title,
                    s.id AS submission_id,
                    s.content AS sub_content,
                    s.file_path AS sub_file_path,
                    s.submitted_at AS sub_at,
                    s.grade,
                    s.feedback,
                    COALESCE(s.status, 'not_submitted') AS sub_status
                FROM assignments a
                JOIN courses c ON a.course_id = c.id
                JOIN enrollments e ON e.course_id = a.course_id AND e.user_id = ?
                LEFT JOIN submissions s ON s.assignment_id = a.id AND s.student_id = ?
                ORDER BY a.created_at DESC
            """, (user['id'], user['id'])).fetchall()
        result = rows_to_list(rows)
        for r in result:
            if r.get('sub_file_path'):
                r['sub_file_url'] = f"/media/{r['sub_file_path']}"
        conn.close()
        return JsonResponse(result, safe=False)

    if request.method == 'POST':
        if user['role'] not in ('admin', 'manager', 'teacher'):
            return JsonResponse({'error': 'Ruxsat yo\'q'}, status=403)
        d = json.loads(request.body)
        cur = conn.execute(
            "INSERT INTO assignments (course_id, title, description, deadline) VALUES (?,?,?,?)",
            (d.get('course_id'), d.get('title'), d.get('description'), d.get('deadline'))
        )
        conn.commit()
        conn.close()
        return JsonResponse({'id': cur.lastrowid, 'message': 'Topshiriq yaratildi'}, status=201)

    conn.close()
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def assignment_detail(request, pk):
    user = get_user(request)
    if not user or user['role'] not in ('admin', 'manager', 'teacher'):
        return JsonResponse({'error': 'Ruxsat yo\'q'}, status=403)
    conn = get_conn()
    if request.method == 'PUT':
        d = json.loads(request.body)
        conn.execute(
            "UPDATE assignments SET title=?, description=?, deadline=?, course_id=? WHERE id=?",
            (d.get('title'), d.get('description'), d.get('deadline'), d.get('course_id'), pk)
        )
        conn.commit()
        conn.close()
        return JsonResponse({'message': 'Yangilandi'})
    if request.method == 'DELETE':
        conn.execute("DELETE FROM submissions WHERE assignment_id=?", (pk,))
        conn.execute("DELETE FROM assignments WHERE id=?", (pk,))
        conn.commit()
        conn.close()
        return JsonResponse({'message': "O'chirildi"})
    conn.close()
    return JsonResponse({'error': 'Method not allowed'}, status=405)

# --- SUBMISSIONS ---

@csrf_exempt
def submissions(request):
    user = get_user(request)
    if not user:
        return JsonResponse({'error': 'Unauthorized'}, status=401)
    conn = get_conn()

    if request.method == 'GET':
        assignment_id = request.GET.get('assignment_id')
        if user['role'] in ('admin', 'manager', 'teacher'):
            if not assignment_id:
                conn.close()
                return JsonResponse([], safe=False)
            rows = conn.execute("""
                SELECT u.id AS student_id, u.firstName, u.email,
                    s.id AS submission_id, s.content, s.file_path, s.submitted_at,
                    s.grade, s.feedback,
                    COALESCE(s.status, 'not_submitted') AS status
                FROM assignments a
                JOIN enrollments e ON e.course_id = a.course_id
                JOIN users u ON e.user_id = u.id
                LEFT JOIN submissions s ON s.assignment_id = a.id AND s.student_id = u.id
                WHERE a.id = ?
                ORDER BY CASE WHEN s.submitted_at IS NULL THEN 1 ELSE 0 END, s.submitted_at DESC
            """, (assignment_id,)).fetchall()
        else:
            if not assignment_id:
                conn.close()
                return JsonResponse([], safe=False)
            rows = conn.execute(
                "SELECT * FROM submissions WHERE assignment_id=? AND student_id=?",
                (assignment_id, user['id'])
            ).fetchall()
        result = rows_to_list(rows)
        for r in result:
            if r.get('file_path'):
                r['file_url'] = f"/media/{r['file_path']}"
        conn.close()
        return JsonResponse(result, safe=False)

    if request.method == 'POST':
        import uuid as _uuid
        from django.conf import settings as _settings
        from pathlib import Path as _Path

        is_multipart = request.content_type and 'multipart' in request.content_type
        if is_multipart:
            assignment_id = request.POST.get('assignment_id')
            content       = request.POST.get('content', '')
            uploaded_file = request.FILES.get('file')
        else:
            d             = json.loads(request.body)
            assignment_id = d.get('assignment_id')
            content       = d.get('content', '')
            uploaded_file = None

        file_path = None
        if uploaded_file:
            import os
            ext      = os.path.splitext(uploaded_file.name)[1].lower()
            filename = f"{_uuid.uuid4()}{ext}"
            save_dir = _Path(_settings.MEDIA_ROOT) / 'submissions'
            save_dir.mkdir(parents=True, exist_ok=True)
            with open(save_dir / filename, 'wb') as f:
                for chunk in uploaded_file.chunks():
                    f.write(chunk)
            file_path = f'submissions/{filename}'

        existing = conn.execute(
            "SELECT id FROM submissions WHERE assignment_id=? AND student_id=?",
            (assignment_id, user['id'])
        ).fetchone()
        if existing:
            if file_path:
                conn.execute(
                    "UPDATE submissions SET content=?, file_path=?, submitted_at=CURRENT_TIMESTAMP, status='pending', grade=NULL, feedback=NULL WHERE id=?",
                    (content, file_path, existing[0])
                )
            else:
                conn.execute(
                    "UPDATE submissions SET content=?, submitted_at=CURRENT_TIMESTAMP, status='pending', grade=NULL, feedback=NULL WHERE id=?",
                    (content, existing[0])
                )
            conn.commit()
            conn.close()
            return JsonResponse({'message': 'Yangilandi'})

        cur = conn.execute(
            "INSERT INTO submissions (assignment_id, student_id, content, file_path, status) VALUES (?,?,?,?,'pending')",
            (assignment_id, user['id'], content, file_path)
        )
        conn.commit()
        conn.close()
        return JsonResponse({'id': cur.lastrowid, 'message': 'Topshirildi'}, status=201)

    conn.close()
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def submission_detail(request, pk):
    user = get_user(request)
    if not user or user['role'] not in ('admin', 'manager', 'teacher'):
        return JsonResponse({'error': 'Ruxsat yo\'q'}, status=403)
    conn = get_conn()
    if request.method == 'PUT':
        d = json.loads(request.body)
        conn.execute(
            "UPDATE submissions SET grade=?, feedback=?, status='graded' WHERE id=?",
            (d.get('grade'), d.get('feedback', ''), pk)
        )
        conn.commit()
        conn.close()
        return JsonResponse({'message': 'Baholandi'})
    conn.close()
    return JsonResponse({'error': 'Method not allowed'}, status=405)
