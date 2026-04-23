import React, { useState, useEffect } from 'react';
import { X, Calendar, Paperclip, MessageSquare, Plus, Trash2, Check } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { supabase } from '../lib/supabaseClient';

export default function TaskModal({ task, onClose, onUpdate, session }) {
  const [editedTask, setEditedTask] = useState({ ...task });
  const [newLabel, setNewLabel] = useState('');
  const [newSubtask, setNewSubtask] = useState('');
  const [checklists, setChecklists] = useState(task.checklists || []);
  const [comments, setComments] = useState(task.comments || []);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  const priorities = ['Baja', 'Media', 'Alta', 'Urgente'];
  const statuses = ['Backlog', 'To Do', 'In Progress', 'Done']; // Idealmente dinámico, pero aquí mostramos básicos

  const handleSave = async () => {
    setLoading(true);
    try {
      // Guardar Tarea principal
      const { data, error } = await supabase
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
        .eq('id', task.id)
        .select();

      if (error) throw error;
      onUpdate({ ...editedTask, checklists, comments });
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error guardando la tarea');
    } finally {
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
  }

  return (
    <div className="fixed inset-0 bg-kanban-dark/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <input 
            type="text" 
            value={editedTask.title}
            onChange={e => setEditedTask({...editedTask, title: e.target.value})}
            className="text-2xl font-bold text-kanban-dark bg-transparent border-none outline-none w-full focus:ring-0 placeholder-gray-300"
            placeholder="Título de la tarea..."
          />
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 flex gap-8">
          <div className="flex-1 space-y-6">
            
            {/* Etiquetas */}
            <div>
              <label className="text-sm font-semibold text-gray-500 mb-2 block">Etiquetas</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {(editedTask.labels || []).map(label => (
                  <span key={label} className="bg-kanban-soft/30 text-kanban-dark px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                    {label}
                    <button onClick={() => removeLabel(label)} className="hover:text-red-500"><X size={14}/></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" value={newLabel} onChange={e => setNewLabel(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && addLabel()}
                  placeholder="Nueva etiqueta..."
                  className="border border-gray-200 rounded px-3 py-1 text-sm outline-none focus:border-kanban-primary"
                />
                <button onClick={addLabel} className="bg-kanban-light px-3 py-1 rounded text-sm text-kanban-dark hover:bg-kanban-soft transition-colors">Añadir</button>
              </div>
            </div>

            {/* Descripción */}
            <div>
              <label className="text-sm font-semibold text-gray-500 mb-2 block">Descripción</label>
              <textarea 
                value={editedTask.description || ''}
                onChange={e => setEditedTask({...editedTask, description: e.target.value})}
                className="w-full h-32 border border-gray-200 rounded-lg p-3 outline-none focus:border-kanban-primary resize-none text-sm text-gray-700 bg-gray-50/50"
                placeholder="Añade detalles o usa Markdown..."
              />
            </div>

            {/* Checklist */}
            <div>
              <label className="text-sm font-semibold text-gray-500 mb-2 block">Checklist ({checklists.filter(c=>c.is_completed).length}/{checklists.length})</label>
              
              {checklists.length > 0 && (
                <div className="w-full bg-gray-100 h-2 rounded-full mb-4">
                  <div className="bg-green-500 h-2 rounded-full transition-all" style={{width: `${(checklists.filter(c=>c.is_completed).length / checklists.length)*100}%`}}></div>
                </div>
              )}

              <div className="space-y-2 mb-3">
                {checklists.map(item => (
                  <div key={item.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <button onClick={() => toggleSubtask(item.id, item.is_completed)} className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${item.is_completed ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                        {item.is_completed && <Check size={14} className="text-white"/>}
                      </button>
                      <span className={`text-sm ${item.is_completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>{item.title}</span>
                    </div>
                    <button onClick={() => deleteSubtask(item.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity"><Trash2 size={16}/></button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" value={newSubtask} onChange={e => setNewSubtask(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && addSubtask()}
                  placeholder="Nuevo elemento..."
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-kanban-primary flex-1"
                />
                <button onClick={addSubtask} className="bg-gray-100 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-200 transition-colors"><Plus size={18}/></button>
              </div>
            </div>

          </div>

          {/* Sidebar */}
          <div className="w-64 space-y-6">
            
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Estado</label>
              <select 
                value={editedTask.status} onChange={e => setEditedTask({...editedTask, status: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 outline-none"
              >
                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Prioridad</label>
              <select 
                value={editedTask.priority} onChange={e => setEditedTask({...editedTask, priority: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 outline-none"
              >
                {priorities.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Asignado a</label>
              <input 
                type="text" value={editedTask.assigned_to || ''} onChange={e => setEditedTask({...editedTask, assigned_to: e.target.value})}
                placeholder="Nombre o Email"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Fechas</label>
              <div className="space-y-2">
                <div>
                  <span className="text-[10px] text-gray-400">Inicio</span>
                  <input type="date" value={editedTask.start_date || ''} onChange={e => setEditedTask({...editedTask, start_date: e.target.value})} className="w-full border border-gray-200 rounded-lg px-2 py-1 text-sm bg-gray-50"/>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400">Fin (Deadline)</span>
                  <input type="date" value={editedTask.end_date || ''} onChange={e => setEditedTask({...editedTask, end_date: e.target.value})} className="w-full border border-gray-200 rounded-lg px-2 py-1 text-sm bg-gray-50"/>
                </div>
              </div>
            </div>

            <button onClick={() => alert('Sube un archivo a Supabase Storage (Pendiente integrar SDK storage)')} className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm transition-colors">
              <Paperclip size={16}/> Adjuntar archivo
            </button>

          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors">Cancelar</button>
          <button onClick={handleSave} disabled={loading} className="px-5 py-2 rounded-lg text-sm font-medium bg-kanban-primary text-white hover:bg-kanban-dark transition-colors disabled:opacity-50">
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}
