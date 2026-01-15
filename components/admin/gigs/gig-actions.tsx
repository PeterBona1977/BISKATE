"use client"

import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface GigDeleteDialogProps {
  gigTitle: string
  onConfirmDelete: () => void
}

export function GigDeleteDialog({ gigTitle, onConfirmDelete }: GigDeleteDialogProps) {
  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Apagar Biskate</AlertDialogTitle>
        <AlertDialogDescription>
          Tem certeza que deseja apagar o biskate <strong>"{gigTitle}"</strong>? Esta ação não pode ser desfeita.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancelar</AlertDialogCancel>
        <AlertDialogAction onClick={onConfirmDelete} className="bg-red-600 hover:bg-red-700">
          Apagar
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  )
}
