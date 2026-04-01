export function cn(...classes: (string | undefined | null | boolean)[]): string {
	return classes.filter(Boolean).join(' ')
}

export function formatTime(seconds: number): string {
	const m = Math.floor(seconds / 60)
	const s = Math.floor(seconds % 60)
	return `${m}:${s.toString().padStart(2, '0')}`
}

export function formatDuration(seconds: number): string {
	const safe = Number.isFinite(seconds) ? Math.max(0, seconds) : 0
	return formatTime(safe)
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

export function generateUseridSuggestions(userid: string): string[] {
	const year = new Date().getFullYear()
	const rand3 = Math.floor(Math.random() * 900) + 100
	const rand2 = Math.floor(Math.random() * 90) + 10
	return [
		`${userid}_${rand3}`,
		`${userid}.${rand2}`,
		`${userid}_${year}`,
	]
}

export function getInitial(name: string): string {
	return name ? name[0].toUpperCase() : '?'
}

export function getAvatarColor(name: string): string {
	const colors = [
		'linear-gradient(135deg, #7C3AED, #A855F7)',
		'linear-gradient(135deg, #06B6D4, #0891B2)',
		'linear-gradient(135deg, #10B981, #059669)',
		'linear-gradient(135deg, #F59E0B, #D97706)',
		'linear-gradient(135deg, #EF4444, #DC2626)',
	]
	const source = name || 'U'
	const index = source.charCodeAt(0) % colors.length
	return colors[index]
}
