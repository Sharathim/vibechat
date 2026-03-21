import axios from 'axios'

const client = axios.create({
	baseURL: 'http://localhost:5000/api',
	withCredentials: true,
	headers: {
		'Content-Type': 'application/json',
	},
})

client.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401) {
			localStorage.removeItem('vibechat-user')
			window.location.href = '/login'
		}
		return Promise.reject(error)
	}
)

export default client
