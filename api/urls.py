from django.urls import path
from . import views

urlpatterns = [
    # Auth
    path('register', views.register),
    path('login', views.login),
    path('me', views.me),

    # Courses
    path('courses', views.courses),
    path('courses/<int:pk>', views.course_detail),

    # Teachers
    path('teachers', views.teachers),
    path('teachers/<int:pk>', views.teacher_detail),

    # Enrollments
    path('enrollments', views.enrollments),
    path('enrollments/<int:pk>', views.enrollment_delete),

    # Feedbacks
    path('feedbacks', views.feedbacks),

    # Teacher applications
    path('teacher-applications', views.teacher_applications),
    path('teacher-applications/<int:pk>/status', views.application_status),

    # Notifications
    path('notifications', views.notifications),
    path('notifications/<int:pk>/read', views.notification_read),

    # Users (admin/manager)
    path('users', views.users),
    path('users/<int:pk>', views.user_detail),

    # Students
    path('students', views.students),
    path('students/<int:pk>', views.student_detail),

    # Payments
    path('payments', views.payments),
    path('payments/<int:pk>', views.payment_detail),

    # Attendance
    path('attendance', views.attendance),

    # Stats
    path('admin/stats', views.admin_stats),
    path('manager/stats', views.manager_stats),
    path('teacher/stats', views.teacher_stats),
    path('student/stats', views.student_stats),

    # Course payments & Activity
    path('course-payments/<int:course_id>', views.course_payments),
    path('activity', views.activity),

    # Admin teachers list
    path('admin/teachers-list', views.admin_teachers_list),

    # Manager students list (with enrollments)
    path('manager/students-list', views.manager_students_list),

    # Teacher my courses
    path('teacher/my-courses', views.teacher_my_courses),

    # Assignments & Submissions
    path('assignments', views.assignments),
    path('assignments/<int:pk>', views.assignment_detail),
    path('submissions', views.submissions),
    path('submissions/<int:pk>', views.submission_detail),
]
