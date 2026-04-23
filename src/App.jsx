import { useState, useEffect, createContext } from 'react'
import { supabase } from './lib/supabaseClient'
import KanbanBoard from './components/KanbanBoard'
import Dashboard from './components/Dashboard'
import { Moon, Sun, ArrowRight } from 'lucide-react'

export const ThemeContext = createContext()

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  
  const [isDarkMode, setIsDarkMode] = useState(false)
  
  // Navigation State
  const [currentProject, setCurrentProject] = useState(null)

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDarkMode(true)
      document.documentElement.classList.add('dark')
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (!session) setCurrentProject(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
      setIsDarkMode(false)
    } else {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
      setIsDarkMode(true)
    }
  }

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        alert("¡Registro exitoso! Ya puedes iniciar sesión.")
        setIsLogin(true)
      }
    } catch (error) {
      alert(error.error_description || error.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0B1120]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-500 dark:text-slate-400 font-medium">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0B1120] relative overflow-hidden transition-colors duration-500">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/20 dark:bg-blue-600/10 blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/20 dark:bg-purple-600/10 blur-[100px] pointer-events-none"></div>

        <button onClick={toggleTheme} className="absolute top-6 right-6 p-3 rounded-full glass hover:scale-105 transition-transform text-slate-700 dark:text-slate-300 z-10">
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <div className="glass p-10 rounded-3xl shadow-2xl w-full max-w-md relative z-10 border border-white/40 dark:border-white/10">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3 drop-shadow-sm">AzocarSpace</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Eleva tu productividad al siguiente nivel</p>
          </div>
          
          <form onSubmit={handleAuth} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Correo Electrónico</label>
              <input className="w-full px-4 py-3 bg-white/50 dark:bg-[#0F172A]/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white" type="email" placeholder="tu@email.com" value={email} required onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Contraseña</label>
              <input className="w-full px-4 py-3 bg-white/50 dark:bg-[#0F172A]/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white" type="password" placeholder="••••••••" value={password} required onChange={(e) => setPassword(e.target.value)} />
            </div>
            <button disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg hover:shadow-blue-500/30 flex items-center justify-center gap-2 group disabled:opacity-50">
              {loading ? 'Procesando...' : (isLogin ? 'Ingresar a mi espacio' : 'Crear cuenta ahora')}
              {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>
          
          <div className="mt-8 text-center border-t border-slate-200 dark:border-slate-700/50 pt-6">
            <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors">
              {isLogin ? '¿Nuevo aquí? Regístrate gratis' : '¿Ya tienes cuenta? Inicia sesión'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {!currentProject ? (
        <Dashboard 
          session={session} 
          onSelectProject={setCurrentProject}
          onLogout={() => supabase.auth.signOut()}
        />
      ) : (
        <KanbanBoard 
          session={session} 
          project={currentProject}
          onBack={() => setCurrentProject(null)}
        />
      )}
    </ThemeContext.Provider>
  )
}

export default App
