import request from '../request'

export default {
  getLines() {
    return request.get('/lines')
  },
  createLine(data) {
    return request.post('/lines', data)
  },
  updateLine(id, data) {
    return request.put(`/lines/${id}`, data)
  },
  deleteLine(id) {
    return request.delete(`/lines/${id}`)
  }
}