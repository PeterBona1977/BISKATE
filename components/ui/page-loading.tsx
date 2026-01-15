import { Loader2 } from "lucide-react"

export function PageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
        <p className="mt-2 text-sm text-gray-600">A carregar...</p>
      </div>
    </div>
  )
}
