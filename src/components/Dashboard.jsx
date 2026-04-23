import React, { useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Plus, FolderKanban, Moon, Sun, ArrowRight, Clock } from 'lucide-react';
import { ThemeContext } from '../App';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Dashboard({ session, onSelectProject, onLogout }) {
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newProjectName, setNewProjectName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error.message);
    } finally {
      setLoading(false);
    }
  }

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([{ name: newProjectName.trim(), user_id: session.user.id }])
        .select();

      if (error) throw error;
      
      setProjects([data[0], ...projects]);
      setNewProjectName('');
      setIsCreating(false);
    } catch (error) {
      alert('Error creando el proyecto');
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] transition-colors duration-500 p-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-blue-500/5 dark:bg-blue-600/10 blur-[100px] pointer-events-none"></div>
      
      <div className="max-w-[1200px] mx-auto relative z-10">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent drop-shadow-sm mb-1">Mis Espacios</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Gestiona todos tus proyectos desde aquí</p>
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={toggleTheme}
              className="p-3 rounded-full glass hover:scale-105 transition-transform text-slate-700 dark:text-slate-300"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button 
              onClick={onLogout} 
              className="glass-card text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 px-5 py-2.5 rounded-xl font-semibold transition-all"
            >
              Salir
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Card Crear Nuevo */}
          {isCreating ? (
            <div className="glass-card p-6 rounded-2xl flex flex-col justify-center border-blue-200 dark:border-blue-900/50">
              <form onSubmit={handleCreateProject}>
                <input 
                  autoFocus
                  type="text" 
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Nombre del proyecto..."
                  className="w-full bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white outline-none focus:border-blue-500 mb-4"
                />
                <div className="flex gap-3">
                  <button type="button" onClick={() => setIsCreating(false)} className="flex-1 px-4 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-medium transition-colors">Cancelar</button>
                  <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">Crear</button>
                </div>
              </form>
            </div>
          ) : (
            <button 
              onClick={() => setIsCreating(true)}
              className="glass-card p-8 rounded-2xl flex flex-col items-center justify-center gap-4 border-dashed border-2 border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all group h-[200px]"
            >
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                <Plus size={24} />
              </div>
              <span className="font-bold text-slate-600 dark:text-slate-300">Nuevo Proyecto</span>
            </button>
          )}

          {/* Lista de Proyectos */}
          {loading ? (
            <div className="text-slate-500 dark:text-slate-400 animate-pulse col-span-2">Cargando proyectos...</div>
          ) : (
            projects.map(project => (
              <div 
                key={project.id}
                onClick={() => onSelectProject(project)}
                className="glass-card p-6 rounded-2xl cursor-pointer hover:-translate-y-1 hover:shadow-xl dark:hover:shadow-blue-900/20 transition-all group h-[200px] flex flex-col justify-between border border-slate-200 dark:border-slate-700/80"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white mb-4 shadow-sm">
                    <FolderKanban size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{project.name}</h3>
                </div>
                
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-sm text-slate-500 dark:text-slate-400 font-medium">
                  <span className="flex items-center gap-1.5"><Clock size={14}/> {format(parseISO(project.created_at), 'd MMM yyyy', { locale: es })}</span>
                  <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all text-blue-500" />
                </div>
              </div>
            ))
          )}

        </div>
      </div>
    </div>
  );
}
