import { createContext, useContext, useEffect, useState } from 'react'
import authApi from '../api/auth'

interface User {
	id: number
	userid: string
	name: string
	email: string
	avatarUrl: string | null
	rankBadge: number
	isPrivate: boolean
	bio: string
}

interface AuthContextType {
	user: User | null
	isLoggedIn: boolean
	isAuthLoading: boolean
	login: (userData: User) => void
	logout: () => void
	updateUser: (updates: Partial<User>) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

const STORAGE_KEY = 'vibechat-user'

function normalizeUser(raw: any): User {
	return {
		id: raw.id,
		userid: raw.userid || raw.username || '',
		name: raw.name,
		email: raw.email || raw.gmail || '',
		avatarUrl: raw.avatar_url ?? raw.avatarUrl ?? null,
		rankBadge: raw.rank_badge ?? raw.rankBadge ?? 0,
		isPrivate: raw.is_private ?? raw.isPrivate ?? false,
		bio: raw.bio ?? '',
	}
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null)
	const [isAuthLoading, setIsAuthLoading] = useState(true)

	useEffect(() => {
		let mounted = true

		const bootstrapAuth = async () => {
			const stored = localStorage.getItem(STORAGE_KEY)
			if (!stored) {
				if (mounted) setIsAuthLoading(false)
				return
			}

			try {
				const parsed = JSON.parse(stored)
				if (mounted) setUser(normalizeUser(parsed))
			} catch {
				localStorage.removeItem(STORAGE_KEY)
				if (mounted) setUser(null)
			}

			try {
				const response = await authApi.me()
				const validated = normalizeUser(response.data.user)
				if (!mounted) return
				setUser(validated)
				localStorage.setItem(STORAGE_KEY, JSON.stringify(validated))
			} catch {
				if (!mounted) return
				setUser(null)
				localStorage.removeItem(STORAGE_KEY)
			} finally {
				if (mounted) setIsAuthLoading(false)
			}
		}

		bootstrapAuth()

		return () => {
			mounted = false
		}
	}, [])

	const login = (userData: User) => {
		const normalized = normalizeUser(userData)
		setUser(normalized)
		localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
	}

	const logout = () => {
		setUser(null)
		localStorage.removeItem(STORAGE_KEY)
	}

	const updateUser = (updates: Partial<User>) => {
		if (!user) return
		const updated = { ...user, ...updates }
		setUser(updated)
		localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
	}

	return (
		<AuthContext.Provider value={{
			user,
			isLoggedIn: !!user,
			isAuthLoading,
			login,
			logout,
			updateUser
		}}>
			{children}
		</AuthContext.Provider>
	)
}

export function useAuth() {
	const ctx = useContext(AuthContext)
	if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
	return ctx
}
