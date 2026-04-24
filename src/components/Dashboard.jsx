import React, { useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Plus, FolderKanban, Moon, Sun, ArrowRight, Clock, Trash2, Edit2 } from 'lucide-react';
import { ThemeContext } from '../App';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Dashboard({ session, onSelectProject, onLogout }) {
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newProjectName, setNewProjectName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState(null);

  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);

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
      // Generamos un invite_code aleatorio al crear
      const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      const { data, error } = await supabase
        .from('projects')
        .insert([{ name: newProjectName.trim(), user_id: session.user.id, invite_code: inviteCode }])
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

  const handleJoinProject = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    try {
      // 1. Buscar el proyecto por código
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('id')
        .ilike('invite_code', joinCode.trim())
        .single();

      if (projectError || !projectData) {
        alert('Código de proyecto no válido o no existe.');
        return;
      }

      // 2. Crear la solicitud pendiente
      const { error: joinError } = await supabase
        .from('project_members')
        .insert([{
          project_id: projectData.id,
          user_id: session.user.id,
          user_email: session.user.email,
          role: 'member',
          status: 'pending'
        }]);

      if (joinError) {
        if (joinError.code === '23505') alert('Ya enviaste una solicitud para este proyecto o ya eres miembro.');
        else throw joinError;
      } else {
        alert('¡Solicitud enviada! Espera a que el creador del proyecto te apruebe el acceso.');
        setIsJoining(false);
        setJoinCode('');
      }
    } catch (error) {
      console.error(error);
      alert('Error al procesar la solicitud.');
    }
  };

  const handleRenameProject = async (e, id, oldName, newName) => {
    if (e) e.stopPropagation();
    if (oldName === newName || !newName.trim()) {
      setEditingProjectId(null);
      return;
    }
    setProjects(projects.map(p => p.id === id ? { ...p, name: newName.trim() } : p));
    setEditingProjectId(null);
    await supabase.from('projects').update({ name: newName.trim() }).eq('id', id);
  };

  const handleDeleteProject = async (e, id, name) => {
    e.stopPropagation();
    if (!window.confirm(`¿Estás seguro de que deseas eliminar el proyecto "${name}" y todo su contenido? Esta acción es irreversible.`)) return;
    
    setProjects(projects.filter(p => p.id !== id));
    await supabase.from('projects').delete().eq('id', id);
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
            <div className="glass-card p-6 rounded-2xl flex flex-col justify-center border-blue-200 dark:border-blue-900/50 h-[200px]">
              <form onSubmit={handleCreateProject}>
                <input 
                  autoFocus
                  type="text" 
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Nombre del proyecto..."
                  className="w-full bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white outline-none focus:border-blue-500 mb-4 font-medium shadow-inner"
                />
                <div className="flex gap-3">
                  <button type="button" onClick={() => setIsCreating(false)} className="flex-1 px-4 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-bold transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700">Cancelar</button>
                  <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-all shadow-md shadow-blue-500/20">Crear</button>
                </div>
              </form>
            </div>
          ) : (
            <button 
              onClick={() => setIsCreating(true)}
              className="glass-card p-8 rounded-2xl flex flex-col items-center justify-center gap-4 border-dashed border-2 border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all group h-[200px]"
            >
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform shadow-sm">
                <Plus size={24} />
              </div>
              <span className="font-bold text-slate-600 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Nuevo Proyecto</span>
            </button>
          )}

          {/* Card Unirse con Código */}
          {isJoining ? (
            <div className="glass-card p-6 rounded-2xl flex flex-col justify-center border-purple-200 dark:border-purple-900/50 h-[200px]">
              <form onSubmit={handleJoinProject}>
                <input 
                  autoFocus
                  type="text" 
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="Ej: AZO-X7B9M"
                  className="w-full bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white outline-none focus:border-purple-500 mb-4 font-medium shadow-inner uppercase"
                />
                <div className="flex gap-3">
                  <button type="button" onClick={() => setIsJoining(false)} className="flex-1 px-4 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-bold transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700">Cancelar</button>
                  <button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold transition-all shadow-md shadow-purple-500/20">Solicitar</button>
                </div>
              </form>
            </div>
          ) : (
            <button 
              onClick={() => setIsJoining(true)}
              className="glass-card p-8 rounded-2xl flex flex-col items-center justify-center gap-4 border-dashed border-2 border-slate-300 dark:border-slate-700 hover:border-purple-500 dark:hover:border-purple-500 hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-all group h-[200px]"
            >
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform shadow-sm">
                <ArrowRight size={24} />
              </div>
              <span className="font-bold text-slate-600 dark:text-slate-300 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Unirse a Proyecto</span>
            </button>
          )}

          {/* Lista de Proyectos */}
          {loading ? (
            <div className="text-slate-500 dark:text-slate-400 animate-pulse font-bold p-8">Cargando tus espacios...</div>
          ) : (
            projects.map(project => {
              const isOwner = project.user_id === session.user.id;
              
              return (
              <div 
                key={project.id}
                onClick={() => {
                  if (editingProjectId !== project.id) onSelectProject(project);
                }}
                className={`glass-card p-6 rounded-2xl hover:-translate-y-1 hover:shadow-xl dark:hover:shadow-blue-900/20 transition-all group h-[200px] flex flex-col justify-between border border-slate-200 dark:border-slate-700/80 relative ${editingProjectId !== project.id ? 'cursor-pointer' : ''}`}
              >
                
                {isOwner && editingProjectId !== project.id && (
                  <button 
                    onClick={(e) => handleDeleteProject(e, project.id, project.name)}
                    className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all z-20"
                    title="Eliminar Proyecto"
                  >
                    <Trash2 size={18} />
                  </button>
                )}

                <div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white mb-4 shadow-sm relative ${isOwner ? 'bg-gradient-to-br from-blue-500 to-purple-600' : 'bg-gradient-to-br from-emerald-500 to-teal-600'}`}>
                    <FolderKanban size={20} />
                  </div>
                  
                  {/* Título o Input de Edición */}
                  {editingProjectId === project.id ? (
                    <input 
                      autoFocus
                      defaultValue={project.name}
                      onBlur={(e) => handleRenameProject(null, project.id, project.name, e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleRenameProject(null, project.id, project.name, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xl font-bold bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white px-2 py-1 -ml-2 rounded-lg border border-blue-500 outline-none w-full shadow-inner"
                    />
                  ) : (
                    <div className="flex items-center gap-2 group/edit w-full pr-8">
                      <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{project.name}</h3>
                      {isOwner && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setEditingProjectId(project.id); }}
                          className="opacity-0 group-hover/edit:opacity-100 text-slate-400 hover:text-blue-500 transition-opacity p-1"
                          title="Renombrar Proyecto"
                        >
                          <Edit2 size={14} />
                        </button>
                      )}
                    </div>
                  )}
                  {!isOwner && <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full mt-2 inline-block">Colaborativo</span>}
                </div>
                
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-sm text-slate-500 dark:text-slate-400 font-bold">
                  <span className="flex items-center gap-1.5"><Clock size={14}/> {format(parseISO(project.created_at), 'd MMM yyyy', { locale: es })}</span>
                  <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all text-blue-500" />
                </div>
              </div>
            );
            })
          )}

        </div>
      </div>
    </div>
  );
}
