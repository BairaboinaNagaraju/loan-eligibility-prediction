import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, UserCheck, UserX, Mail, Phone, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, search],
    queryFn: () => api.get(`/admin/users?page=${page}&limit=20${search ? `&search=${search}` : ''}`).then(r => r.data.data),
  });

  const deactivate = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/users/${id}/deactivate`),
    onSuccess: () => { toast.success('User deactivated'); qc.invalidateQueries({ queryKey: ['admin-users'] }); },
    onError: () => toast.error('Failed to deactivate user'),
  });

  const users = data?.users || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="font-display font-bold text-3xl text-white">User Management</h1>
        <p className="text-slate-400 mt-1">{pagination?.total || 0} total users</p>
      </div>

      <div className="glass-card p-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, email, or phone..."
            className="input-field pl-10" />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}</div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-white/10">
                <tr className="text-slate-500 text-xs uppercase">
                  <th className="p-4 text-left">User</th>
                  <th className="p-4 text-left">Contact</th>
                  <th className="p-4 text-left">Role</th>
                  <th className="p-4 text-left">KYC</th>
                  <th className="p-4 text-left">Status</th>
                  <th className="p-4 text-left">Applications</th>
                  <th className="p-4 text-left">Joined</th>
                  <th className="p-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((user: any, i: number) => (
                  <motion.tr key={user.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    className="hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {user.fullName?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="font-medium text-white">{user.fullName}</p>
                          <p className="text-xs text-slate-400 truncate max-w-[160px]">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1 text-xs text-slate-400"><Mail className="w-3 h-3" />{user.isEmailVerified ? 'Verified' : 'Unverified'}</div>
                        {user.phone && <div className="flex items-center gap-1 text-xs text-slate-400"><Phone className="w-3 h-3" />{user.phone}</div>}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        user.role === 'ADMIN' ? 'bg-amber-500/20 text-amber-400' :
                        user.role === 'LOAN_OFFICER' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-slate-500/20 text-slate-400'
                      }`}>{user.role}</span>
                    </td>
                    <td className="p-4">
                      <span className={user.kycStatus === 'VERIFIED' ? 'badge-approved' : user.kycStatus === 'SUBMITTED' ? 'badge-review' : 'badge-pending'}>
                        {user.kycStatus}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${user.isActive ? 'badge-approved' : 'badge-rejected'}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4 text-slate-300">{user._count?.applications || 0}</td>
                    <td className="p-4 text-slate-400 text-xs">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="p-4">
                      {user.isActive && (
                        <button onClick={() => deactivate.mutate(user.id)}
                          className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Deactivate user">
                          <UserX className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center gap-2">
          {[...Array(pagination.pages)].map((_, i) => (
            <button key={i} onClick={() => setPage(i + 1)}
              className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${page === i + 1 ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-white/10'}`}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
