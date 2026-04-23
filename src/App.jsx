import { useState, useEffect } from 'react'
import { supabase } from './lib/supabaseClient'
import KanbanBoard from './components/KanbanBoard'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

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
    return <div className="min-h-screen flex items-center justify-center bg-kanban-light text-kanban-dark">Cargando...</div>
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-kanban-light p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-kanban-muted/20">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-kanban-dark mb-2">AzocarSpace</h1>
            <p className="text-kanban-muted">Inicia sesión para ver tus tareas</p>
          </div>
          
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-kanban-dark mb-1">Email</label>
              <input
                className="w-full px-4 py-2 border border-kanban-muted/50 rounded-lg focus:ring-2 focus:ring-kanban-primary focus:border-kanban-primary outline-none transition-all"
                type="email"
                placeholder="tu@email.com"
                value={email}
                required
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-kanban-dark mb-1">Contraseña</label>
              <input
                className="w-full px-4 py-2 border border-kanban-muted/50 rounded-lg focus:ring-2 focus:ring-kanban-primary focus:border-kanban-primary outline-none transition-all"
                type="password"
                placeholder="••••••••"
                value={password}
                required
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button
              disabled={loading}
              className="w-full bg-kanban-primary hover:bg-kanban-dark text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-md disabled:opacity-50"
            >
              {loading ? 'Cargando...' : (isLogin ? 'Ingresar' : 'Registrarse')}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <button 
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-kanban-primary hover:text-kanban-dark font-medium transition-colors"
            >
              {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return <KanbanBoard session={session} />
}

export default App
