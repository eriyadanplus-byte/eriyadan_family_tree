// AdminSidebar provided by AppShell
import { requireRole } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AddMemberForm from './AddMemberForm';

export default async function AddMemberPage() {
  let hasPermission = false;
  try {
    await requireRole(['super_admin', 'editor', 'contributor']);
    hasPermission = true;
  } catch (error) {
    redirect('/login');
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-wider">ADD MEMBER</h1>
        <p className="text-zinc-400 mt-2">Add a new family member to the tree</p>
      </div>

      <div className="bg-[#111116] border border-white/5 rounded-2xl p-6">
        <AddMemberForm />
      </div>
    </div>
  );
}
