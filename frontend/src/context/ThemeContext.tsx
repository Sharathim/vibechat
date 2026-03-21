import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
	theme: Theme
	toggleTheme: () => void
	setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	const [theme, setThemeState] = useState<Theme>(() => {
		return (localStorage.getItem('vibechat-theme') as Theme) || 'light'
	})

	useEffect(() => {
		document.documentElement.setAttribute('data-theme', theme)
		localStorage.setItem('vibechat-theme', theme)
	}, [theme])

	const setTheme = (t: Theme) => setThemeState(t)
	const toggleTheme = () => setThemeState(t => t === 'light' ? 'dark' : 'light')

	return (
		<ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
			{children}
		</ThemeContext.Provider>
	)
}

export function useTheme() {
	const ctx = useContext(ThemeContext)
	if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
	return ctx
}
