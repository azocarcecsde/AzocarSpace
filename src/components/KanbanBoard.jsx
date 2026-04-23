import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import TaskCard from './TaskCard';
import { supabase } from '../lib/supabaseClient';
import { Plus, LogOut } from 'lucide-react';

const COLUMNS = ['Backlog', 'To Do', 'In Progress', 'Done'];

export default function KanbanBoard({ session }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  async function fetchTasks() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          checklists ( id, is_completed ),
          attachments ( id ),
          comments ( id )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error.message);
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
      const { error } = await supabase
        .from('tasks')
        .update({ status: destination.droppableId })
        .eq('id', draggableId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating task status:', error.message);
      fetchTasks(); // Revert on error
    }
  };

  const createDummyTask = async () => {
    const newTask = {
      title: 'Nueva Tarea ' + Math.floor(Math.random() * 100),
      description: 'Descripción autogenerada para pruebas',
      status: 'Backlog',
      priority: 'Media',
      user_id: session.user.id
    };

    const { data, error } = await supabase.from('tasks').insert([newTask]).select();
    if (error) {
        console.error(error);
        alert("Error al crear tarea. Verifica que las tablas y RLS estén en Supabase.");
    }
    else fetchTasks();
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-kanban-dark font-bold text-xl">Cargando tablero...</div>;
  }

  return (
    <div className="p-6 overflow-x-auto h-screen bg-kanban-light">
      <div className="flex items-center justify-between mb-8 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-kanban-dark">AzocarSpace</h1>
        <div className="flex gap-4">
            <button 
            onClick={createDummyTask}
            className="bg-kanban-primary hover:bg-kanban-dark text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm"
            >
            <Plus size={20} /> Nueva Tarea
            </button>
            <button 
            onClick={() => supabase.auth.signOut()}
            className="border border-kanban-dark text-kanban-dark hover:bg-kanban-dark hover:text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium"
            >
            <LogOut size={20} /> Salir
            </button>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-6 h-[calc(100vh-120px)] items-start max-w-7xl mx-auto">
          {COLUMNS.map((colName) => {
            const colTasks = tasks.filter(t => t.status === colName);

            return (
              <div key={colName} className="bg-kanban-soft/30 rounded-2xl w-[320px] min-w-[320px] flex flex-col max-h-full border border-kanban-muted/20 shadow-sm">
                <div className="p-4 flex items-center justify-between border-b border-kanban-muted/20">
                  <h3 className="font-bold text-kanban-dark">{colName}</h3>
                  <span className="bg-kanban-muted text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-inner">
                    {colTasks.length}
                  </span>
                </div>
                
                <Droppable droppableId={colName}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`p-4 flex-1 overflow-y-auto transition-colors rounded-b-2xl
                        ${snapshot.isDraggingOver ? 'bg-kanban-soft/50' : ''}
                      `}
                    >
                      {colTasks.map((task, index) => (
                        <TaskCard key={task.id} task={task} index={index} />
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}
