import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const authAPI = {
  login:    data => api.post('/login', data),
  register: data => api.post('/register', data),
  me:       ()   => api.get('/me'),
}

export const coursesAPI = {
  list:   (params) => api.get('/courses', { params }),
  get:    id       => api.get(`/courses/${id}`),
  create: data     => api.post('/courses', data),
  update: (id, d)  => api.put(`/courses/${id}`, d),
  delete: id       => api.delete(`/courses/${id}`),
}

export const studentsAPI = {
  list:   (params) => api.get('/students', { params }),
  get:    id       => api.get(`/students/${id}`),
  create: data     => api.post('/students', data),
  update: (id, d)  => api.put(`/students/${id}`, d),
  delete: id       => api.delete(`/students/${id}`),
}

export const teachersAPI = {
  list:   (params) => api.get('/teachers', { params }),
  get:    id       => api.get(`/teachers/${id}`),
  create: data     => api.post('/teachers', data),
  update: (id, d)  => api.put(`/teachers/${id}`, d),
  delete: id       => api.delete(`/teachers/${id}`),
}

export const enrollmentsAPI = {
  list:   ()       => api.get('/enrollments'),
  create: data     => api.post('/enrollments', data),
  delete: id       => api.delete(`/enrollments/${id}`),
}

export const attendanceAPI = {
  list:   (params) => api.get('/attendance', { params }),
  mark:   data     => api.post('/attendance', data),
  update: (id, d)  => api.put(`/attendance/${id}`, d),
}

export const paymentsAPI = {
  list:   (params) => api.get('/payments', { params }),
  create: data     => api.post('/payments', data),
  update: (id, d)  => api.put(`/payments/${id}`, d),
}

export const statsAPI = {
  admin:   () => api.get('/admin/stats'),
  manager: () => api.get('/manager/stats'),
  teacher: () => api.get('/teacher/stats'),
  student: () => api.get('/student/stats'),
}

export const applicationsAPI = {
  list:         (params)   => api.get('/teacher-applications', { params }),
  updateStatus: (id, status) => api.put(`/teacher-applications/${id}/status`, { status }),
}

export const adminTeachersAPI = {
  list: () => api.get('/admin/teachers-list'),
}

export const managerStudentsAPI = {
  list: () => api.get('/manager/students-list'),
}

export const coursePaymentsAPI = {
  get: courseId => api.get(`/course-payments/${courseId}`),
}

export const activityAPI = {
  list: () => api.get('/activity'),
}

export const teacherCoursesAPI = {
  myList: () => api.get('/teacher/my-courses'),
}

export const assignmentsAPI = {
  list:   (params) => api.get('/assignments', { params }),
  create: data     => api.post('/assignments', data),
  update: (id, d)  => api.put(`/assignments/${id}`, d),
  delete: id       => api.delete(`/assignments/${id}`),
}

export const submissionsAPI = {
  list:   (params)   => api.get('/submissions', { params }),
  submit: (formData) => api.post('/submissions', formData),
  grade:  (id, d)    => api.put(`/submissions/${id}`, d),
}

export const usersAPI = {
  list:   (params) => api.get('/users', { params }),
  update: (id, d)  => api.put(`/users/${id}`, d),
  delete: id       => api.delete(`/users/${id}`),
}

export default api
