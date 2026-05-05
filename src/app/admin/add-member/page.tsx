// AdminSidebar provided by AppShell
import AddMemberForm from './AddMemberForm';

export default function AddMemberPage() {
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
