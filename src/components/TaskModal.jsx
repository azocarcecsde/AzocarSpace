import React, { useState } from 'react';
import { X, Calendar, Paperclip, MessageSquare, Plus, Trash2, Check, LayoutDashboard, Flag, User, FileText, ListTodo } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function TaskModal({ task, onClose, onUpdate, onDelete, session }) {
  const [editedTask, setEditedTask] = useState({ ...task });
  const [newLabel, setNewLabel] = useState('');
  const [newSubtask, setNewSubtask] = useState('');
  const [checklists, setChecklists] = useState(task.checklists || []);
  const [loading, setLoading] = useState(false);

  const priorities = ['Baja', 'Media', 'Alta', 'Urgente'];
  const statuses = ['Backlog', 'To Do', 'In Progress', 'Done']; // Si es dinámico se pasa por props

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          title: editedTask.title,
          description: editedTask.description,
          start_date: editedTask.start_date,
          end_date: editedTask.end_date,
          priority: editedTask.priority,
          status: editedTask.status,
          labels: editedTask.labels,
          assigned_to: editedTask.assigned_to
        })
        .eq('id', task.id);

      if (error) throw error;
      onUpdate({ ...editedTask, checklists });
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error guardando la tarea');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar esta tarea permanentemente?")) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', task.id);
      if (error) throw error;
      onDelete(task.id);
    } catch (err) {
      console.error(err);
      alert('Error al borrar la tarea');
      setLoading(false);
    }
  };

  const addLabel = () => {
    if (!newLabel.trim()) return;
    const labels = editedTask.labels || [];
    if (!labels.includes(newLabel.trim())) {
      setEditedTask({ ...editedTask, labels: [...labels, newLabel.trim()] });
    }
    setNewLabel('');
  };

  const removeLabel = (label) => {
    setEditedTask({ ...editedTask, labels: editedTask.labels.filter(l => l !== label) });
  };

  const addSubtask = async () => {
    if (!newSubtask.trim()) return;
    try {
      const { data, error } = await supabase
        .from('checklists')
        .insert([{
          task_id: task.id,
          user_id: session.user.id,
          title: newSubtask.trim(),
          is_completed: false
        }])
        .select();
      if (error) throw error;
      setChecklists([...checklists, data[0]]);
      setNewSubtask('');
    } catch (err) {
      console.error(err);
    }
  };

  const toggleSubtask = async (subtaskId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('checklists')
        .update({ is_completed: !currentStatus })
        .eq('id', subtaskId);
      if (error) throw error;
      setChecklists(checklists.map(c => c.id === subtaskId ? { ...c, is_completed: !currentStatus } : c));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteSubtask = async (subtaskId) => {
     try {
       const { error } = await supabase.from('checklists').delete().eq('id', subtaskId);
       if (error) throw error;
       setChecklists(checklists.filter(c => c.id !== subtaskId));
     } catch (err) { console.error(err); }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-md transition-all">
      <div className="bg-white dark:bg-[#0F172A] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800">
        
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#1E293B]/50">
          <input 
            type="text" 
            value={editedTask.title}
            onChange={e => setEditedTask({...editedTask, title: e.target.value})}
            className="text-2xl font-bold text-slate-800 dark:text-white bg-transparent border-none outline-none w-full focus:ring-0 placeholder-slate-300 dark:placeholder-slate-600"
            placeholder="Título de la tarea..."
          />
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500 dark:text-slate-400">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-8">
          <div className="flex-1 space-y-8">
            
            <div className="bg-slate-50 dark:bg-[#1E293B]/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                 <Flag size={16} className="text-blue-500"/> Etiquetas
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {(editedTask.labels || []).map(label => (
                  <span key={label} className="bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1.5 border border-blue-200 dark:border-blue-500/30">
                    {label}
                    <button onClick={() => removeLabel(label)} className="hover:text-blue-900 dark:hover:text-blue-200"><X size={14}/></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" value={newLabel} onChange={e => setNewLabel(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && addLabel()}
                  placeholder="Nueva etiqueta..."
                  className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-blue-500 dark:text-white transition-colors"
                />
                <button onClick={addLabel} className="bg-slate-200 dark:bg-slate-700 px-4 py-1.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">Añadir</button>
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                 <FileText size={16} className="text-purple-500"/> Descripción
              </label>
              <textarea 
                value={editedTask.description || ''}
                onChange={e => setEditedTask({...editedTask, description: e.target.value})}
                className="w-full h-32 bg-slate-50 dark:bg-[#1E293B]/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm text-slate-700 dark:text-slate-200 transition-all shadow-inner"
                placeholder="Añade detalles o usa Markdown..."
              />
            </div>

            <div className="bg-slate-50 dark:bg-[#1E293B]/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center justify-between">
                 <span className="flex items-center gap-2"><ListTodo size={16} className="text-emerald-500"/> Checklist</span>
                 <span className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 px-2 py-1 rounded-md">{checklists.filter(c=>c.is_completed).length}/{checklists.length}</span>
              </label>
              
              {checklists.length > 0 && (
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full mb-4 overflow-hidden">
                  <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{width: `${(checklists.filter(c=>c.is_completed).length / checklists.length)*100}%`}}></div>
                </div>
              )}

              <div className="space-y-2.5 mb-4">
                {checklists.map(item => (
                  <div key={item.id} className="flex items-center justify-between group p-2 hover:bg-white dark:hover:bg-[#0F172A] rounded-lg transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                    <div className="flex items-center gap-3">
                      <button onClick={() => toggleSubtask(item.id, item.is_completed)} className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${item.is_completed ? 'bg-emerald-500 border-emerald-500' : 'border border-slate-300 dark:border-slate-600 hover:border-emerald-500'}`}>
                        {item.is_completed && <Check size={14} className="text-white"/>}
                      </button>
                      <span className={`text-sm font-medium ${item.is_completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-200'}`}>{item.title}</span>
                    </div>
                    <button onClick={() => deleteSubtask(item.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 p-1 transition-opacity"><Trash2 size={16}/></button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" value={newSubtask} onChange={e => setNewSubtask(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && addSubtask()}
                  placeholder="Nuevo elemento..."
                  className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-emerald-500 flex-1 dark:text-white transition-colors"
                />
                <button onClick={addSubtask} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-lg transition-colors shadow-sm"><Plus size={18}/></button>
              </div>
            </div>

          </div>

          <div className="w-full md:w-72 space-y-6">
            
            <div className="bg-slate-50 dark:bg-[#1E293B]/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2"><LayoutDashboard size={14}/> Estado</label>
              <input 
                type="text" 
                value={editedTask.status} 
                onChange={e => setEditedTask({...editedTask, status: e.target.value})}
                disabled
                className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-slate-100 dark:bg-[#0B1120] text-slate-500 dark:text-slate-400 outline-none font-medium"
              />
            </div>

            <div className="bg-slate-50 dark:bg-[#1E293B]/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2"><Flag size={14}/> Prioridad</label>
              <select 
                value={editedTask.priority} onChange={e => setEditedTask({...editedTask, priority: e.target.value})}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#0F172A] dark:text-white outline-none focus:ring-2 focus:ring-amber-500 transition-shadow font-medium"
              >
                {priorities.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div className="bg-slate-50 dark:bg-[#1E293B]/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2"><User size={14}/> Asignado a</label>
              <input 
                type="text" value={editedTask.assigned_to || ''} onChange={e => setEditedTask({...editedTask, assigned_to: e.target.value})}
                placeholder="Nombre o Email"
                className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-[#0F172A] dark:text-white outline-none focus:ring-2 focus:ring-purple-500 transition-shadow font-medium"
              />
            </div>

            <div className="bg-slate-50 dark:bg-[#1E293B]/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2"><Calendar size={14}/> Fechas</label>
              <div className="space-y-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Inicio</span>
                  <input type="date" value={editedTask.start_date || ''} onChange={e => setEditedTask({...editedTask, start_date: e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-[#0F172A] dark:text-white outline-none focus:border-blue-500 font-medium color-scheme-light dark:color-scheme-dark"/>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Fin (Deadline)</span>
                  <input type="date" value={editedTask.end_date || ''} onChange={e => setEditedTask({...editedTask, end_date: e.target.value})} className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-[#0F172A] dark:text-white outline-none focus:border-red-500 font-medium color-scheme-light dark:color-scheme-dark"/>
                </div>
              </div>
            </div>

            <button onClick={() => alert('Pendiente integrar SDK storage de Supabase para subidas completas')} className="w-full flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 py-3 rounded-xl text-sm font-bold transition-all shadow-sm">
              <Paperclip size={16}/> Adjuntar archivo
            </button>

          </div>
        </div>

        <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-[#1E293B]/80 flex justify-between items-center rounded-b-2xl backdrop-blur-md">
          <button onClick={handleDelete} disabled={loading} className="px-4 py-2.5 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2 transition-colors disabled:opacity-50">
            <Trash2 size={16}/> Eliminar Tarea
          </button>
          
          <div className="flex gap-3">
            <button onClick={onClose} className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancelar</button>
            <button onClick={handleSave} disabled={loading} className="px-6 py-2.5 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 flex items-center gap-2">
              {loading ? 'Guardando...' : <><Check size={18}/> Guardar Cambios</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
