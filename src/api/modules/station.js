import request from '../request'

export default {
  getStations() {
    return request.get('/stations')
  },
  createStation(data) {
    return request.post('/stations', data)
  },
  updateStation(id, data) {
    return request.put(`/stations/${id}`, data)
  },
  deleteStation(id) {
    return request.delete(`/stations/${id}`)
  }
}