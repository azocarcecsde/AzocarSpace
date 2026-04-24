import React, { useState, useEffect } from 'react';
import { X, Users, Check, Trash2, KeyRound } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function ProjectSettingsModal({ project, onClose }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembers();
  }, []);

  async function fetchMembers() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('project_members')
        .select('*')
        .eq('project_id', project.id);
      
      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const updateMemberStatus = async (memberId, newStatus) => {
    try {
      const { error } = await supabase
        .from('project_members')
        .update({ status: newStatus })
        .eq('id', memberId);
      
      if (error) throw error;
      setMembers(members.map(m => m.id === memberId ? { ...m, status: newStatus } : m));
    } catch (error) {
      alert('Error actualizando estado.');
      console.error(error);
    }
  };

  const removeMember = async (memberId) => {
    if (!window.confirm("¿Seguro que deseas expulsar a este usuario del proyecto?")) return;
    try {
      const { error } = await supabase
        .from('project_members')
        .delete()
        .eq('id', memberId);
      
      if (error) throw error;
      setMembers(members.filter(m => m.id !== memberId));
    } catch (error) {
      alert('Error eliminando miembro.');
      console.error(error);
    }
  };

  const pendingMembers = members.filter(m => m.status === 'pending');
  const approvedMembers = members.filter(m => m.status === 'approved');

  return (
    <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-md transition-all">
      <div className="bg-white dark:bg-[#0F172A] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800">
        
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#1E293B]/50">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Gestión de Equipo</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Proyecto: {project.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500 dark:text-slate-400">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Invite Code Box */}
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-6 rounded-xl border border-blue-200/50 dark:border-blue-500/20 text-center">
            <KeyRound size={32} className="mx-auto text-blue-500 mb-3" />
            <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-1">Código de Invitación</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Comparte este código con tu equipo para que puedan solicitar acceso.</p>
            <div className="inline-block bg-white dark:bg-[#0B1120] border-2 border-dashed border-blue-400 px-6 py-3 rounded-lg">
              <span className="text-3xl font-extrabold tracking-widest text-slate-800 dark:text-white select-all">{project.invite_code || 'SIN CÓDIGO'}</span>
            </div>
          </div>

          {/* Pending Requests */}
          {pendingMembers.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <span className="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 px-2 py-0.5 rounded-full text-xs">{pendingMembers.length}</span>
                Solicitudes Pendientes
              </h3>
              <div className="space-y-3">
                {pendingMembers.map(member => (
                  <div key={member.id} className="flex items-center justify-between bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 p-4 rounded-xl">
                    <span className="font-medium text-slate-700 dark:text-slate-200">{member.user_email}</span>
                    <div className="flex gap-2">
                      <button onClick={() => removeMember(member.id)} className="px-3 py-1.5 rounded-lg text-sm font-bold text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors border border-slate-200 dark:border-slate-700">Rechazar</button>
                      <button onClick={() => updateMemberStatus(member.id, 'approved')} className="px-3 py-1.5 rounded-lg text-sm font-bold bg-emerald-500 hover:bg-emerald-600 text-white transition-colors shadow-sm shadow-emerald-500/20 flex items-center gap-1"><Check size={16}/> Aprobar</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Approved Members */}
          <div>
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
              <Users size={16} className="text-blue-500"/> Equipo Actual
            </h3>
            {loading ? (
              <p className="text-sm text-slate-500">Cargando equipo...</p>
            ) : (
              <div className="space-y-3">
                {/* Dueño (Tú) */}
                <div className="flex items-center justify-between bg-slate-50 dark:bg-[#1E293B]/50 border border-slate-200 dark:border-slate-700 p-4 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold shadow-sm">Tú</div>
                    <span className="font-bold text-slate-700 dark:text-slate-200">Creador (Tú)</span>
                  </div>
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-md">Dueño</span>
                </div>

                {/* Otros miembros */}
                {approvedMembers.map(member => (
                  <div key={member.id} className="flex items-center justify-between bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 p-4 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold">{member.user_email.charAt(0).toUpperCase()}</div>
                      <span className="font-medium text-slate-700 dark:text-slate-200">{member.user_email}</span>
                    </div>
                    <button onClick={() => removeMember(member.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors" title="Expulsar">
                      <Trash2 size={18}/>
                    </button>
                  </div>
                ))}

                {approvedMembers.length === 0 && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4 bg-slate-50 dark:bg-[#0F172A] rounded-xl border border-dashed border-slate-200 dark:border-slate-700">Aún no hay miembros en este proyecto.</p>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
