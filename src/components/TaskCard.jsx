import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Calendar, Paperclip, CheckSquare, MessageSquare } from 'lucide-react';
import { format, isPast, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export default function TaskCard({ task, index }) {
  const isDelayed = task.end_date && isPast(parseISO(task.end_date));
  
  const totalSubtasks = task.checklists?.length || 0;
  const completedSubtasks = task.checklists?.filter(c => c.is_completed).length || 0;
  const progressPercent = totalSubtasks === 0 ? 0 : Math.round((completedSubtasks / totalSubtasks) * 100);

  const priorityColors = {
    'Baja': 'bg-green-100 text-green-700',
    'Media': 'bg-blue-100 text-blue-700',
    'Alta': 'bg-orange-100 text-orange-700',
    'Urgente': 'bg-red-100 text-red-700'
  };

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-white p-4 rounded-xl shadow-sm mb-3 border border-kanban-muted/30
            hover:shadow-md transition-shadow duration-200 group
            ${snapshot.isDragging ? 'shadow-lg rotate-2 scale-105' : ''}
            ${isDelayed ? 'border-red-300 bg-red-50' : ''}
          `}
        >
          {task.labels && task.labels.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {task.labels.map((label, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-kanban-light text-kanban-dark">
                  {label}
                </span>
              ))}
            </div>
          )}

          <h4 className="font-semibold text-kanban-dark mb-1">{task.title}</h4>
          
          <p className="text-xs text-gray-500 mb-3 line-clamp-2">
            {task.description || "Sin descripción"}
          </p>

          {totalSubtasks > 0 && (
            <div className="mb-3">
              <div className="flex justify-between items-center text-xs text-gray-500 mb-1">
                <span className="flex items-center gap-1"><CheckSquare size={12}/> {completedSubtasks}/{totalSubtasks}</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="w-full bg-kanban-light rounded-full h-1.5">
                <div 
                  className="bg-kanban-primary h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
            <div className={`flex items-center gap-1 ${isDelayed ? 'text-red-500 font-medium' : ''}`}>
              <Calendar size={14} />
              {task.end_date ? format(parseISO(task.end_date), 'd MMM', { locale: es }) : 'Sin fecha'}
            </div>

            <div className="flex items-center gap-3">
              {(task.attachments?.length > 0) && (
                <div className="flex items-center gap-1">
                  <Paperclip size={14} />
                  <span>{task.attachments.length}</span>
                </div>
              )}
              {(task.comments?.length > 0) && (
                <div className="flex items-center gap-1">
                  <MessageSquare size={14} />
                  <span>{task.comments.length}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <span className={`px-2 py-1 rounded text-[10px] font-bold ${priorityColors[task.priority] || 'bg-gray-100'}`}>
              {task.priority || 'Media'}
            </span>
            {task.assigned_to && (
              <div className="w-6 h-6 rounded-full bg-kanban-primary text-white flex items-center justify-center text-[10px] font-bold">
                {task.assigned_to.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}
