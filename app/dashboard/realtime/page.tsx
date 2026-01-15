import { RealtimeDashboard } from "@/components/realtime/realtime-dashboard"

export default function RealtimePage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Dashboard em Tempo Real</h1>
        <p className="text-gray-600 mt-2">Monitore presença, notificações e comunicação em tempo real</p>
      </div>

      <RealtimeDashboard />
    </div>
  )
}
