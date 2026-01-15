
import { EmergencyRequestsListView } from "@/components/provider/emergency-requests-list-view"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"

export default function ManageEmergenciesPage() {
    return (
        <div className="flex-1 flex flex-col min-h-screen bg-slate-50/50">
            <DashboardHeader />
            <div className="flex-1 p-4 md:p-8 mt-16 max-w-7xl mx-auto w-full">
                <EmergencyRequestsListView />
            </div>
        </div>
    )
}
