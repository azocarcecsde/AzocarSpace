import React, { useState, useEffect, useContext } from 'react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import TaskCard from './TaskCard';
import TaskModal from './TaskModal';
import { supabase } from '../lib/supabaseClient';
import { Plus, LogOut, Edit2, Moon, Sun } from 'lucide-react';
import { ThemeContext } from '../App';

export default function KanbanBoard({ session }) {
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const [tasks, setTasks] = useState([]);
  const [columns, setColumns] = useState(['Backlog', 'To Do', 'In Progress', 'Done']);
  const [editingColumn, setEditingColumn] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const { data: colsData, error: colsError } = await supabase.from('columns').select('*').order('position', { ascending: true });
      if (!colsError && colsData && colsData.length > 0) {
        setColumns(colsData.map(c => c.title));
      }

      const { data, error } = await supabase
        .from('tasks')
        .select(`*, checklists ( id, is_completed, title ), attachments ( id ), comments ( id )`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching data:', error.message);
    } finally {
      setLoading(false);
    }
  }

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const updatedTasks = Array.from(tasks);
    const draggedTaskIndex = updatedTasks.findIndex(t => t.id === draggableId);
    if (draggedTaskIndex === -1) return;

    const draggedTask = updatedTasks[draggedTaskIndex];
    draggedTask.status = destination.droppableId;
    setTasks(updatedTasks);

    try {
      await supabase.from('tasks').update({ status: destination.droppableId }).eq('id', draggableId);
    } catch (error) {
      fetchData();
    }
  };

  const createDummyTask = async () => {
    const newTask = {
      title: 'Nueva Tarea',
      description: '',
      status: columns[0] || 'Backlog',
      priority: 'Media',
      user_id: session.user.id
    };

    const { data, error } = await supabase.from('tasks').insert([newTask]).select();
    if (error) {
        alert("Error al crear tarea.");
    } else {
        fetchData().then(() => {
          setSelectedTask({...newTask, id: data[0].id, checklists: [], comments: [], attachments: []});
        });
    }
  };

  const saveColumnName = async (oldName, newName) => {
    if (oldName === newName || !newName.trim()) {
      setEditingColumn(null);
      return;
    }
    const newCols = [...columns];
    const index = newCols.indexOf(oldName);
    newCols[index] = newName.trim();
    setColumns(newCols);
    setEditingColumn(null);

    setTasks(tasks.map(t => t.status === oldName ? { ...t, status: newName.trim() } : t));
    await supabase.from('tasks').update({ status: newName.trim() }).eq('status', oldName);
  };

  return (
    <div className="p-6 overflow-x-auto h-screen relative bg-slate-50 dark:bg-[#0B1120] transition-colors duration-500">
      {/* Background gradients */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-500/5 dark:from-blue-600/10 to-transparent pointer-events-none"></div>
      
      <div className="flex items-center justify-between mb-10 max-w-[1400px] mx-auto relative z-10">
        <div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent drop-shadow-sm">AzocarSpace</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">Tu espacio de trabajo inteligente</p>
        </div>
        
        <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme}
              className="p-2.5 rounded-full glass hover:scale-105 transition-transform text-slate-700 dark:text-slate-300 shadow-sm"
              title="Cambiar tema"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button 
              onClick={createDummyTask} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 font-semibold"
            >
              <Plus size={20} /> Nueva Tarea
            </button>
            <button 
              onClick={() => supabase.auth.signOut()} 
              className="glass-card text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all font-semibold"
            >
              <LogOut size={20} /> Salir
            </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center mt-32 text-slate-500 dark:text-slate-400 font-semibold text-xl animate-pulse">Cargando tu espacio...</div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-6 h-[calc(100vh-140px)] items-start max-w-[1400px] mx-auto pb-6 relative z-10">
            {columns.map((colName) => {
              const colTasks = tasks.filter(t => t.status === colName);

              return (
                <div key={colName} className="glass-card rounded-2xl w-[340px] min-w-[340px] flex flex-col max-h-full">
                  <div className="p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-700/50 group">
                    
                    {editingColumn === colName ? (
                      <input 
                        autoFocus
                        defaultValue={colName}
                        onBlur={(e) => saveColumnName(colName, e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && saveColumnName(colName, e.target.value)}
                        className="font-bold text-slate-900 dark:text-white bg-white dark:bg-[#0F172A] px-2 py-1 rounded w-full outline-none border border-blue-500 shadow-sm"
                      />
                    ) : (
                      <div className="flex items-center gap-2 w-full cursor-pointer" onClick={() => setEditingColumn(colName)}>
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 flex-1 truncate">{colName}</h3>
                        <Edit2 size={14} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    )}

                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold px-3 py-1 rounded-full ml-2 border border-slate-200 dark:border-slate-700">
                      {colTasks.length}
                    </span>
                  </div>
                  
                  <Droppable droppableId={colName}>
                    {(provided, snapshot) => (
                      <div ref={provided.innerRef} {...provided.droppableProps} className={`p-4 flex-1 overflow-y-auto transition-colors rounded-b-2xl ${snapshot.isDraggingOver ? 'bg-slate-50/50 dark:bg-slate-800/30' : ''}`}>
                        {colTasks.map((task, index) => (
                          <TaskCard key={task.id} task={task} index={index} onClick={() => setSelectedTask(task)} />
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
            
            <button 
              onClick={() => setColumns([...columns, 'Nueva Columna'])} 
              className="min-w-[340px] h-[64px] rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-blue-500 hover:text-blue-500 dark:hover:border-blue-400 dark:hover:text-blue-400 flex items-center justify-center gap-2 font-bold transition-all bg-white/30 dark:bg-[#1E293B]/30 hover:bg-white/50 dark:hover:bg-[#1E293B]/50"
            >
              <Plus size={20} /> Añadir Columna
            </button>
          </div>
        </DragDropContext>
      )}

      {selectedTask && (
        <TaskModal 
          task={selectedTask} 
          session={session}
          onClose={() => setSelectedTask(null)} 
          onUpdate={(updatedTask) => {
            setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
          }}
        />
      )}
    </div>
  );
}
