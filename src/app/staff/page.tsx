import { getAllStaff, unemployCoach } from '@/actions/staff';
import StaffList from '@/components/StaffList';

export default async function StaffPage() {
    const staff = await getAllStaff();

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-100 to-sky-100 py-8 flex flex-col items-stretch w-full">
            <div className="w-full px-4 max-w-full flex-1">
                <div className="bg-white rounded-lg p-4 shadow-sm mb-6">
                    <StaffList initialStaff={staff} onUnemploy={unemployCoach} />
                </div>
            </div>
        </div>
    );
}
