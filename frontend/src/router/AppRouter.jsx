import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import DashboardLayout from '../components/layout/DashboardLayout'

import Login    from '../pages/auth/Login'
import Register from '../pages/auth/Register'

import AdminDashboard      from '../pages/admin/AdminDashboard'
import AdminUsers          from '../pages/admin/AdminUsers'
import AdminCourses        from '../pages/admin/AdminCourses'
import AdminSettings       from '../pages/admin/AdminSettings'
import AdminApplications   from '../pages/admin/AdminApplications'
import AdminPayments       from '../pages/admin/AdminPayments'
import AdminTeachers       from '../pages/admin/AdminTeachers'

import ManagerDashboard  from '../pages/manager/ManagerDashboard'
import ManagerStudents   from '../pages/manager/ManagerStudents'
import ManagerEnrollments from '../pages/manager/ManagerEnrollments'
import ManagerPayments   from '../pages/manager/ManagerPayments'

import TeacherDashboard   from '../pages/teacher/TeacherDashboard'
import TeacherCourses     from '../pages/teacher/TeacherCourses'
import TeacherAttendance  from '../pages/teacher/TeacherAttendance'
import TeacherStudents    from '../pages/teacher/TeacherStudents'
import TeacherAssignments from '../pages/teacher/TeacherAssignments'

import StudentDashboard   from '../pages/student/StudentDashboard'
import StudentCourses     from '../pages/student/StudentCourses'
import StudentProgress    from '../pages/student/StudentProgress'
import StudentPayments    from '../pages/student/StudentPayments'
import StudentAssignments from '../pages/student/StudentAssignments'

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner/></div>
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to={`/${user.role}`} replace />
  return children
}

function Spinner() {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"/>
      <span className="text-gray-400 text-sm">Yuklanmoqda...</span>
    </div>
  )
}

const ROLE_PATH = { admin: '/admin', manager: '/manager', teacher: '/teacher', user: '/student', student: '/student' }

function HomeRedirect() {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner/></div>
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={ROLE_PATH[user.role] || '/student'} replace />
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect/>}/>
      <Route path="/login" element={<Login/>}/>
      <Route path="/register" element={<Register/>}/>

      {/* ADMIN */}
      <Route path="/admin" element={<ProtectedRoute roles={['admin']}><DashboardLayout role="admin"/></ProtectedRoute>}>
        <Route index element={<AdminDashboard/>}/>
        <Route path="users" element={<AdminUsers/>}/>
        <Route path="courses" element={<AdminCourses/>}/>
        <Route path="applications" element={<AdminApplications/>}/>
        <Route path="teachers" element={<AdminTeachers/>}/>
        <Route path="payments" element={<AdminPayments/>}/>
        <Route path="settings" element={<AdminSettings/>}/>
      </Route>

      {/* MANAGER */}
      <Route path="/manager" element={<ProtectedRoute roles={['manager','admin']}><DashboardLayout role="manager"/></ProtectedRoute>}>
        <Route index element={<ManagerDashboard/>}/>
        <Route path="students" element={<ManagerStudents/>}/>
        <Route path="courses" element={<ManagerEnrollments/>}/>
        <Route path="payments" element={<ManagerPayments/>}/>
      </Route>

      {/* TEACHER */}
      <Route path="/teacher" element={<ProtectedRoute roles={['teacher','admin']}><DashboardLayout role="teacher"/></ProtectedRoute>}>
        <Route index element={<TeacherDashboard/>}/>
        <Route path="courses" element={<TeacherCourses/>}/>
        <Route path="assignments" element={<TeacherAssignments/>}/>
        <Route path="attendance" element={<TeacherAttendance/>}/>
        <Route path="students" element={<TeacherStudents/>}/>
      </Route>

      {/* STUDENT */}
      <Route path="/student" element={<ProtectedRoute roles={['user','student','admin']}><DashboardLayout role="student"/></ProtectedRoute>}>
        <Route index element={<StudentDashboard/>}/>
        <Route path="courses" element={<StudentCourses/>}/>
        <Route path="assignments" element={<StudentAssignments/>}/>
        <Route path="progress" element={<StudentProgress/>}/>
        <Route path="payments" element={<StudentPayments/>}/>
      </Route>

      <Route path="*" element={<Navigate to="/" replace/>}/>
    </Routes>
  )
}
