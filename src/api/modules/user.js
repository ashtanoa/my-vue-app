import request from '../request'

export default {
  getUsers() {
    return request.get('/users')
  },
  getUser(id) {
    return request.get(`/users/${id}`)
  },
  createUser(data) {
    return request.post('/users', data)
  },
  updateUser(id, data) {
    return request.put(`/users/${id}`, data)
  },
  deleteUser(id) {
    return request.delete(`/users/${id}`)
  }
}