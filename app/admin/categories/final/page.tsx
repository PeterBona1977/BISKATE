import type { Metadata } from "next"
import CategoriesManagementFinal from "@/components/admin/categories-management-final"

export const metadata: Metadata = {
  title: "Gestão de Categorias | BISKATE Admin",
  description: "Sistema completo de gestão de categorias de serviços",
}

export default function CategoriesFinalPage() {
  return (
    <div className="container mx-auto py-6">
      <CategoriesManagementFinal />
    </div>
  )
}
