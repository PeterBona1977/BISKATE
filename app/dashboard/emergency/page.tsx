
import { ClientEmergencyListView } from "@/components/dashboard/client-emergency-list-view"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "As Minhas Emergências | GigHub",
    description: "Gerencie os seus pedidos de emergência e acompanhe em tempo real.",
}

export default function ClientEmergencyPage() {
    return (
        <div className="container mx-auto py-8">
            <ClientEmergencyListView />
        </div>
    )
}
