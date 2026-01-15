"use client"

import type React from "react"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export interface Column<T> {
  header: string
  accessorKey: keyof T | ((row: T) => React.ReactNode)
  cell?: (row: T) => React.ReactNode
  className?: string
}

interface AdminTableProps<T> {
  data: T[]
  columns: Column<T>[]
  title?: string
  itemsPerPage?: number
  isLoading?: boolean
  emptyMessage?: string
  totalItems?: number
  actions?: React.ReactNode
}

export function AdminTable<T extends { id: string }>({
  data,
  columns,
  title,
  itemsPerPage = 10,
  isLoading = false,
  emptyMessage = "Nenhum item encontrado",
  totalItems,
  actions,
}: AdminTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = Math.ceil((data.length || 0) / itemsPerPage)

  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentData = data.slice(startIndex, endIndex)

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando dados...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      {title && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{title}</CardTitle>
            {totalItems !== undefined && <Badge variant="outline">{totalItems} itens</Badge>}
            {actions}
          </div>
        </CardHeader>
      )}
      <CardContent>
        {data.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column, index) => (
                    <TableHead key={index} className={column.className}>
                      {column.header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentData.map((row) => (
                  <TableRow key={row.id}>
                    {columns.map((column, index) => (
                      <TableCell key={index} className={column.className}>
                        {column.cell
                          ? column.cell(row)
                          : typeof column.accessorKey === "function"
                            ? column.accessorKey(row)
                            : String(row[column.accessorKey] || "")}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">{emptyMessage}</p>
          </div>
        )}
      </CardContent>
      {data.length > itemsPerPage && (
        <CardFooter className="flex items-center justify-between border-t px-6 py-4">
          <div className="text-sm text-gray-500">
            Mostrando {startIndex + 1}-{Math.min(endIndex, data.length)} de {data.length} itens
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => goToPage(1)} disabled={currentPage === 1}>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  )
}
