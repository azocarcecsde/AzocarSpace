import React, { useState, useEffect, useContext } from 'react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import TaskCard from './TaskCard';
import TaskModal from './TaskModal';
import { supabase } from '../lib/supabaseClient';
import { Plus, Moon, Sun, ArrowLeft, Edit2, Trash2 } from 'lucide-react';
import { ThemeContext } from '../App';

export default function KanbanBoard({ session, project, onBack }) {
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const [tasks, setTasks] = useState([]);
  const [columns, setColumns] = useState([]); // Array de objetos {id, title, position}
  const [editingColumn, setEditingColumn] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    fetchData();
  }, [project.id]);

  async function fetchData() {
    try {
      setLoading(true);
      // Fetch columns
      const { data: colsData, error: colsError } = await supabase
        .from('columns')
        .select('*')
        .eq('project_id', project.id)
        .order('position', { ascending: true });

      if (colsError) throw colsError;

      // Si no hay columnas, crear las por defecto
      if (!colsData || colsData.length === 0) {
        const defaultCols = ['Backlog', 'To Do', 'In Progress', 'Done'].map((title, i) => ({
          title, position: i, project_id: project.id, user_id: session.user.id
        }));
        const { data: insertedCols } = await supabase.from('columns').insert(defaultCols).select();
        setColumns(insertedCols || []);
      } else {
        setColumns(colsData);
      }

      // Fetch tasks
      const { data, error } = await supabase
        .from('tasks')
        .select(`*, checklists ( id, is_completed, title ), attachments ( id ), comments ( id )`)
        .eq('project_id', project.id)
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
    draggedTask.status = destination.droppableId; // droppableId ahora es el col.title
    setTasks(updatedTasks);

    try {
      await supabase.from('tasks').update({ status: destination.droppableId }).eq('id', draggableId);
    } catch (error) {
      fetchData();
    }
  };

  const createDummyTask = async () => {
    if (columns.length === 0) return;
    const newTask = {
      title: 'Nueva Tarea',
      description: '',
      status: columns[0].title,
      priority: 'Media',
      user_id: session.user.id,
      project_id: project.id
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

  const addColumn = async () => {
    const newTitle = `Nueva Columna ${columns.length + 1}`;
    const { data, error } = await supabase.from('columns').insert([{
      title: newTitle,
      position: columns.length,
      project_id: project.id,
      user_id: session.user.id
    }]).select();

    if (!error && data) {
      setColumns([...columns, data[0]]);
    }
  };

  const saveColumnName = async (colId, oldName, newName) => {
    if (oldName === newName || !newName.trim()) {
      setEditingColumn(null);
      return;
    }
    
    // Update tasks status to new column name
    setTasks(tasks.map(t => t.status === oldName ? { ...t, status: newName.trim() } : t));
    
    // Optimistic UI for column
    setColumns(columns.map(c => c.id === colId ? { ...c, title: newName.trim() } : c));
    setEditingColumn(null);

    // Update DB
    await supabase.from('columns').update({ title: newName.trim() }).eq('id', colId);
    await supabase.from('tasks').update({ status: newName.trim() }).eq('status', oldName).eq('project_id', project.id);
  };

  const deleteColumn = async (colId, colTitle) => {
    if (!window.confirm(`¿Seguro que quieres borrar la columna "${colTitle}" y TODAS sus tareas?`)) return;

    setColumns(columns.filter(c => c.id !== colId));
    setTasks(tasks.filter(t => t.status !== colTitle));

    await supabase.from('columns').delete().eq('id', colId);
    await supabase.from('tasks').delete().eq('status', colTitle).eq('project_id', project.id);
  };

  return (
    <div className="p-6 overflow-x-auto h-screen relative bg-slate-50 dark:bg-[#0B1120] transition-colors duration-500">
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-500/5 dark:from-blue-600/10 to-transparent pointer-events-none"></div>
      
      <div className="flex items-center justify-between mb-10 max-w-[1400px] mx-auto relative z-10">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 rounded-xl glass hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent drop-shadow-sm">{project.name}</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">Gestión de proyecto</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className="p-2.5 rounded-full glass hover:scale-105 transition-transform text-slate-700 dark:text-slate-300 shadow-sm">
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={createDummyTask} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 font-semibold">
              <Plus size={20} /> Nueva Tarea
            </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center mt-32 text-slate-500 dark:text-slate-400 font-semibold text-xl animate-pulse">Cargando tablero...</div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-6 h-[calc(100vh-140px)] items-start max-w-[1400px] mx-auto pb-6 relative z-10">
            {columns.map((col) => {
              const colTasks = tasks.filter(t => t.status === col.title);

              return (
                <div key={col.id} className="glass-card rounded-2xl w-[340px] min-w-[340px] flex flex-col max-h-full">
                  <div className="p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-700/50 group">
                    
                    {editingColumn === col.id ? (
                      <input 
                        autoFocus
                        defaultValue={col.title}
                        onBlur={(e) => saveColumnName(col.id, col.title, e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && saveColumnName(col.id, col.title, e.target.value)}
                        className="font-bold text-slate-900 dark:text-white bg-white dark:bg-[#0F172A] px-2 py-1 rounded w-full outline-none border border-blue-500 shadow-sm"
                      />
                    ) : (
                      <div className="flex items-center gap-2 w-full cursor-pointer overflow-hidden" onClick={() => setEditingColumn(col.id)}>
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 truncate">{col.title}</h3>
                        <Edit2 size={14} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      </div>
                    )}

                    <div className="flex items-center gap-2 ml-2">
                      <button 
                        onClick={() => deleteColumn(col.id, col.title)}
                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity p-1"
                        title="Borrar columna"
                      >
                        <Trash2 size={16} />
                      </button>
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                        {colTasks.length}
                      </span>
                    </div>
                  </div>
                  
                  <Droppable droppableId={col.title}>
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
            
            <button onClick={addColumn} className="min-w-[340px] h-[64px] rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-blue-500 hover:text-blue-500 dark:hover:border-blue-400 dark:hover:text-blue-400 flex items-center justify-center gap-2 font-bold transition-all bg-white/30 dark:bg-[#1E293B]/30 hover:bg-white/50 dark:hover:bg-[#1E293B]/50">
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
          onDelete={(taskId) => {
            setTasks(tasks.filter(t => t.id !== taskId));
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
}
