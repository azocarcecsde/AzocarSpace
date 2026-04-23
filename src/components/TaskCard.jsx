import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Calendar, Paperclip, CheckSquare, MessageSquare } from 'lucide-react';
import { format, isPast, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export default function TaskCard({ task, index, onClick }) {
  const isDelayed = task.end_date && isPast(parseISO(task.end_date));
  
  const totalSubtasks = task.checklists?.length || 0;
  const completedSubtasks = task.checklists?.filter(c => c.is_completed).length || 0;
  const progressPercent = totalSubtasks === 0 ? 0 : Math.round((completedSubtasks / totalSubtasks) * 100);

  const priorityColors = {
    'Baja': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30',
    'Media': 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border-blue-200 dark:border-blue-500/30',
    'Alta': 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200 dark:border-amber-500/30',
    'Urgente': 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-red-200 dark:border-red-500/30'
  };

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={`bg-white dark:bg-[#0F172A] p-5 rounded-xl shadow-sm mb-4 border 
            hover:shadow-md dark:hover:shadow-black/50 transition-all duration-200 group cursor-pointer
            ${snapshot.isDragging ? 'shadow-xl dark:shadow-blue-900/20 rotate-2 scale-105 ring-2 ring-blue-500' : 'border-slate-200 dark:border-slate-700/80'}
            ${isDelayed ? 'border-red-300 dark:border-red-500/50 bg-red-50/50 dark:bg-red-900/10' : ''}
          `}
        >
          {task.labels && task.labels.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {task.labels.map((label, idx) => (
                <span key={idx} className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {label}
                </span>
              ))}
            </div>
          )}

          <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-1.5 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{task.title}</h4>
          
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 leading-relaxed">
            {task.description || "Sin descripción detallada..."}
          </p>

          {totalSubtasks > 0 && (
            <div className="mb-4 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-700/50">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                <span className="flex items-center gap-1.5"><CheckSquare size={14}/> Tareas</span>
                <span className={progressPercent === 100 ? 'text-emerald-500 dark:text-emerald-400' : ''}>{progressPercent}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                <div 
                  className={`h-1.5 rounded-full transition-all duration-500 ${progressPercent === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400 mb-3">
            <div className={`flex items-center gap-1.5 ${isDelayed ? 'text-red-500 dark:text-red-400 font-bold bg-red-50 dark:bg-red-500/10 px-2 py-1 rounded-md' : ''}`}>
              <Calendar size={14} />
              {task.end_date ? format(parseISO(task.end_date), 'd MMM', { locale: es }) : 'Sin fecha'}
            </div>

            <div className="flex items-center gap-3">
              {(task.attachments?.length > 0) && (
                <div className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
                  <Paperclip size={14} />
                  <span>{task.attachments.length}</span>
                </div>
              )}
              {(task.comments?.length > 0) && (
                <div className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
                  <MessageSquare size={14} />
                  <span>{task.comments.length}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider border ${priorityColors[task.priority] || priorityColors['Media']}`}>
              {task.priority || 'Media'}
            </span>
            {task.assigned_to && (
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 text-white flex items-center justify-center text-[11px] font-bold shadow-sm" title={task.assigned_to}>
                {task.assigned_to.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}
