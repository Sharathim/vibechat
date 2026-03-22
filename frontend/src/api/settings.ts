import client from './client'

export const settingsApi = {
	getSettings: () =>
		client.get('/api/settings'),

	updatePrivacy: (data: Record<string, any>) =>
		client.put('/api/settings/privacy', data),

	updateNotifications: (data: Record<string, any>) =>
		client.put('/api/settings/notifications', data),

	updateAppearance: (theme: string) =>
		client.put('/api/settings/appearance', { theme }),

	changeName: (name: string) =>
		client.put('/api/settings/account/name', { name }),

	changeUsername: (username: string) =>
		client.put('/api/settings/account/username', { username }),

	changePassword: (currentPassword: string, newPassword: string) =>
		client.put('/api/settings/account/password', {
			current_password: currentPassword,
			new_password: newPassword,
		}),

	changeEmail: (email: string) =>
		client.put('/api/settings/account/email', { email }),

	deleteAccount: (password: string) =>
		client.delete('/api/settings/account', {
			data: { password }
		}),

	getBlocked: () =>
		client.get('/api/settings/blocked'),

	blockUser: (userId: number) =>
		client.post(`/api/settings/blocked/${userId}`),

	unblockUser: (userId: number) =>
		client.delete(`/api/settings/blocked/${userId}`),
}

export default settingsApi
