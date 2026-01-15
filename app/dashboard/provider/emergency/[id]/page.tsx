
import { EmergencyResponseView } from "@/components/provider/emergency-response-view"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"

export default function EmergencyDetailPage({ params }: { params: { id: string } }) {
    return (
        <div className="flex-1 flex flex-col min-h-screen bg-slate-50/50">
            <DashboardHeader />
            <div className="flex-1 p-4 md:p-8 mt-16">
                <EmergencyResponseView requestId={params.id} />
            </div>
        </div>
    )
}
