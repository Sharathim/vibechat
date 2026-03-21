export function cn(...classes: (string | undefined | null | boolean)[]): string {
	return classes.filter(Boolean).join(' ')
}

export function formatTime(seconds: number): string {
	const m = Math.floor(seconds / 60)
	const s = Math.floor(seconds % 60)
	return `${m}:${s.toString().padStart(2, '0')}`
}

export function timeAgo(dateString: string): string {
	const date = new Date(dateString)
	const now = new Date()
	const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
	if (diff < 60) return 'Just now'
	if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
	if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
	if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`
	return date.toLocaleDateString()
}

export function maskEmail(email: string): string {
	const [user, domain] = email.split('@')
	const masked = user.slice(0, 2) + '****'
	return `${masked}@${domain}`
}

export function generateUsernameSuggestions(username: string): string[] {
	const year = new Date().getFullYear()
	const rand3 = Math.floor(Math.random() * 900) + 100
	const rand2 = Math.floor(Math.random() * 90) + 10
	return [
		`${username}_${rand3}`,
		`${username}.${rand2}`,
		`${username}_${year}`,
	]
}
