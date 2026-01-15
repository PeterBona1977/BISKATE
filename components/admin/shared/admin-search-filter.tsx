"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Search, X, Filter } from "lucide-react"

export interface FilterOption<T extends string = string> {
  label: string
  value: T
  options?: { label: string; value: string }[]
}

interface AdminSearchFilterProps<T extends string = string> {
  placeholder?: string
  filters?: FilterOption<T>[]
  onSearch: (term: string) => void
  onFilterChange?: (filter: T, value: string) => void
  className?: string
  debounceMs?: number
}

export function AdminSearchFilter<T extends string = string>({
  placeholder = "Pesquisar...",
  filters,
  onSearch,
  onFilterChange,
  className = "",
  debounceMs = 300,
}: AdminSearchFilterProps<T>) {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({})
  const [showFilters, setShowFilters] = useState(false)

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      onSearch(searchTerm)
    }, debounceMs)

    return () => {
      clearTimeout(handler)
    }
  }, [searchTerm, onSearch, debounceMs])

  const handleFilterChange = (filterName: T, value: string) => {
    setActiveFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }))

    if (onFilterChange) {
      onFilterChange(filterName, value)
    }
  }

  const clearFilter = (filterName: string) => {
    setActiveFilters((prev) => {
      const newFilters = { ...prev }
      delete newFilters[filterName]
      return newFilters
    })

    if (onFilterChange && filterName in activeFilters) {
      onFilterChange(filterName as T, "")
    }
  }

  const clearAllFilters = () => {
    setActiveFilters({})
    setSearchTerm("")
    onSearch("")

    if (filters && onFilterChange) {
      filters.forEach((filter) => {
        onFilterChange(filter.value, "")
      })
    }
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder={placeholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-7 w-7 p-0"
                  onClick={() => {
                    setSearchTerm("")
                    onSearch("")
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {filters && filters.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-1"
              >
                <Filter className="h-4 w-4" />
                <span>Filtros</span>
                {Object.keys(activeFilters).length > 0 && (
                  <span className="ml-1 rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
                    {Object.keys(activeFilters).length}
                  </span>
                )}
              </Button>
            )}
            {Object.keys(activeFilters).length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                Limpar
              </Button>
            )}
          </div>

          {showFilters && filters && filters.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filters.map((filter) => (
                <div key={filter.value} className="flex flex-col space-y-1">
                  <label className="text-sm font-medium">{filter.label}</label>
                  <div className="flex items-center space-x-2">
                    <Select
                      value={activeFilters[filter.value] || "all"} // Updated default value to "all"
                      onValueChange={(value) => handleFilterChange(filter.value, value)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Selecionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem> // Updated value prop to "all"
                        {filter.options?.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {activeFilters[filter.value] && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => clearFilter(filter.value)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
