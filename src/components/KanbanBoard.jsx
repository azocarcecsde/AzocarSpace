import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import TaskCard from './TaskCard';
import TaskModal from './TaskModal';
import { supabase } from '../lib/supabaseClient';
import { Plus, LogOut, Edit2, Check } from 'lucide-react';

export default function KanbanBoard({ session }) {
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
      // Fetch columns if table exists (silently fail and fallback to default if not)
      const { data: colsData, error: colsError } = await supabase.from('columns').select('*').order('position', { ascending: true });
      if (!colsError && colsData && colsData.length > 0) {
        setColumns(colsData.map(c => c.title));
      }

      // Fetch tasks
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
        // Open modal automatically for the new task
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

    // Update tasks that had the old status to the new status
    setTasks(tasks.map(t => t.status === oldName ? { ...t, status: newName.trim() } : t));
    
    // In a real scenario, you'd also update the 'columns' table and the 'tasks' table in DB
    await supabase.from('tasks').update({ status: newName.trim() }).eq('status', oldName);
  };

  return (
    <div className="p-6 overflow-x-auto h-screen bg-kanban-light relative">
      <div className="flex items-center justify-between mb-8 max-w-[1400px] mx-auto">
        <h1 className="text-3xl font-bold text-kanban-dark">AzocarSpace</h1>
        <div className="flex gap-4">
            <button onClick={createDummyTask} className="bg-kanban-primary hover:bg-kanban-dark text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm">
            <Plus size={20} /> Nueva Tarea
            </button>
            <button onClick={() => supabase.auth.signOut()} className="border border-kanban-dark text-kanban-dark hover:bg-kanban-dark hover:text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium">
            <LogOut size={20} /> Salir
            </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center mt-20 text-kanban-dark font-bold text-xl">Cargando tablero...</div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-6 h-[calc(100vh-120px)] items-start max-w-[1400px] mx-auto pb-6">
            {columns.map((colName) => {
              const colTasks = tasks.filter(t => t.status === colName);

              return (
                <div key={colName} className="bg-kanban-soft/30 rounded-2xl w-[320px] min-w-[320px] flex flex-col max-h-full border border-kanban-muted/20 shadow-sm">
                  <div className="p-4 flex items-center justify-between border-b border-kanban-muted/20 group">
                    
                    {editingColumn === colName ? (
                      <input 
                        autoFocus
                        defaultValue={colName}
                        onBlur={(e) => saveColumnName(colName, e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && saveColumnName(colName, e.target.value)}
                        className="font-bold text-kanban-dark bg-white px-2 py-1 rounded w-full outline-none border border-kanban-primary"
                      />
                    ) : (
                      <div className="flex items-center gap-2 w-full cursor-pointer" onClick={() => setEditingColumn(colName)}>
                        <h3 className="font-bold text-kanban-dark flex-1 truncate">{colName}</h3>
                        <Edit2 size={14} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    )}

                    <span className="bg-kanban-muted text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-inner ml-2">
                      {colTasks.length}
                    </span>
                  </div>
                  
                  <Droppable droppableId={colName}>
                    {(provided, snapshot) => (
                      <div ref={provided.innerRef} {...provided.droppableProps} className={`p-4 flex-1 overflow-y-auto transition-colors rounded-b-2xl ${snapshot.isDraggingOver ? 'bg-kanban-soft/50' : ''}`}>
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
            
            {/* Add Column Button */}
            <button onClick={() => setColumns([...columns, 'Nueva Columna'])} className="min-w-[320px] h-[58px] rounded-2xl border-2 border-dashed border-kanban-muted/50 text-kanban-muted hover:border-kanban-primary hover:text-kanban-primary flex items-center justify-center gap-2 font-bold transition-colors bg-white/30">
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
