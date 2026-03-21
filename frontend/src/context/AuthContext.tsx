import { createContext, useContext, useState } from 'react'

interface User {
	id: number
	username: string
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
	login: (userData: User) => void
	logout: () => void
	updateUser: (updates: Partial<User>) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(() => {
		const stored = localStorage.getItem('vibechat-user')
		return stored ? JSON.parse(stored) : null
	})

	const login = (userData: User) => {
		setUser(userData)
		localStorage.setItem('vibechat-user', JSON.stringify(userData))
	}

	const logout = () => {
		setUser(null)
		localStorage.removeItem('vibechat-user')
	}

	const updateUser = (updates: Partial<User>) => {
		if (!user) return
		const updated = { ...user, ...updates }
		setUser(updated)
		localStorage.setItem('vibechat-user', JSON.stringify(updated))
	}

	return (
		<AuthContext.Provider value={{
			user,
			isLoggedIn: !!user,
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
