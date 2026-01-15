"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Search, Zap } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronRight, ChevronDown } from "lucide-react"

interface Category {
    id: string
    name: string
    parent_id: string | null
    subcategories?: Category[]
}

interface ServiceSelectorProps {
    userId?: string
    initialSelectedServices: string[]
    onSave?: () => void
    onSelectionChange?: (services: string[]) => void
    hideSaveButton?: boolean
    showEmergencyOptions?: boolean
}

interface ServiceItemProps {
    category: Category
    level?: number
    selectedServices: string[]
    emergencyServices: string[]
    onToggle: (id: string) => void
    onEmergencyToggle: (id: string) => void
    searchQuery: string
}

const ServiceItem = ({ category, level = 0, selectedServices, emergencyServices, onToggle, onEmergencyToggle, searchQuery }: ServiceItemProps) => {
    const isLeaf = !category.subcategories || category.subcategories.length === 0
    const [isOpen, setIsOpen] = useState(false)
    const isSelected = selectedServices.includes(category.id)
    const hasEmergency = emergencyServices.includes(category.id)

    // Auto-expand if searching
    useEffect(() => {
        if (searchQuery) setIsOpen(true)
    }, [searchQuery])

    if (isLeaf) {
        return (
            <div className="flex items-center justify-between py-1 ml-6 gap-2">
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id={`cat-${category.id}`}
                        checked={isSelected}
                        onCheckedChange={() => onToggle(category.id)}
                    />
                    <label
                        htmlFor={`cat-${category.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                        {category.name}
                    </label>
                </div>
                {isSelected && (
                    <div className="flex items-center space-x-1">
                        <Checkbox
                            id={`emergency-${category.id}`}
                            checked={hasEmergency}
                            onCheckedChange={() => onEmergencyToggle(category.id)}
                        />
                        <Label htmlFor={`emergency-${category.id}`} className="text-xs flex items-center gap-1 cursor-pointer">
                            <Zap className="h-3 w-3" />
                            Emergency
                        </Label>
                    </div>
                )}
            </div>
        )
    }

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
            <div className="flex items-center py-1">
                <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full justify-start p-0 h-auto hover:bg-transparent">
                        {isOpen ? <ChevronDown className="h-4 w-4 mr-1 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 mr-1 text-muted-foreground" />}
                        <span className="font-semibold">{category.name}</span>
                    </Button>
                </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="pl-4 border-l ml-2 border-gray-100 dark:border-gray-800">
                {category.subcategories?.map((sub) => (
                    <ServiceItem
                        key={sub.id}
                        category={sub}
                        level={level + 1}
                        selectedServices={selectedServices}
                        emergencyServices={emergencyServices}
                        onToggle={onToggle}
                        onEmergencyToggle={onEmergencyToggle}
                        searchQuery={searchQuery}
                    />
                ))}
            </CollapsibleContent>
        </Collapsible>
    )
}

export function ServiceSelector({ userId, initialSelectedServices, onSave, onSelectionChange, hideSaveButton, showEmergencyOptions = true }: ServiceSelectorProps) {
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [selectedServices, setSelectedServices] = useState<string[]>(initialSelectedServices || [])
    const [emergencyServices, setEmergencyServices] = useState<string[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const { toast } = useToast()

    useEffect(() => {
        fetchCategories()
        if (showEmergencyOptions && userId) {
            fetchEmergencyServices()
        }
    }, [userId, showEmergencyOptions])

    useEffect(() => {
        setSelectedServices(initialSelectedServices || [])
    }, [initialSelectedServices])

    const fetchCategories = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase.from("categories").select("id, name, parent_id").order("name")

            if (error) throw error

            // Transform flat list to hierarchy
            const categoriesMap = new Map()
            const rootCategories: Category[] = []

            // First pass: create nodes
            data.forEach((cat) => {
                categoriesMap.set(cat.id, { ...cat, subcategories: [] })
            })

            // Second pass: link parents/children
            data.forEach((cat) => {
                if (cat.parent_id) {
                    const parent = categoriesMap.get(cat.parent_id)
                    if (parent) {
                        parent.subcategories.push(categoriesMap.get(cat.id))
                    }
                } else {
                    rootCategories.push(categoriesMap.get(cat.id))
                }
            })

            setCategories(rootCategories)
        } catch (error: any) {
            console.error("Error fetching categories:", error)
            toast({
                title: "Error",
                description: "Could not load services.",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const fetchEmergencyServices = async () => {
        if (!userId) return

        try {
            const { data, error } = await supabase
                .from("provider_emergency_services")
                .select("category_id")
                .eq("provider_id", userId)
                .eq("accepts_emergency", true)

            if (error) throw error

            setEmergencyServices(data?.map(d => d.category_id) || [])
        } catch (error: any) {
            console.error("Error fetching emergency services:", error)
        }
    }

    const handleToggleService = (serviceId: string) => {
        const newSelection = selectedServices.includes(serviceId)
            ? selectedServices.filter((id) => id !== serviceId)
            : [...selectedServices, serviceId];

        setSelectedServices(newSelection);

        // If unchecking a service, also remove it from emergency services
        if (!newSelection.includes(serviceId)) {
            setEmergencyServices(prev => prev.filter(id => id !== serviceId))
        }

        if (onSelectionChange) {
            onSelectionChange(newSelection);
        }
    }

    const handleToggleEmergency = (serviceId: string) => {
        setEmergencyServices(prev =>
            prev.includes(serviceId)
                ? prev.filter(id => id !== serviceId)
                : [...prev, serviceId]
        )
    }

    const handleSave = async () => {
        try {
            setSaving(true)

            // Update profile with new skills (service IDs)
            const { error: profileError } = await supabase
                .from("profiles")
                .update({ skills: selectedServices })
                .eq("id", userId)

            if (profileError) throw profileError

            // Save emergency services if enabled
            if (showEmergencyOptions && userId) {
                // Delete all existing emergency services for this provider
                const { error: deleteError } = await supabase
                    .from("provider_emergency_services")
                    .delete()
                    .eq("provider_id", userId)

                if (deleteError) throw deleteError

                // Insert new emergency services
                if (emergencyServices.length > 0) {
                    const emergencyRecords = emergencyServices.map(categoryId => ({
                        provider_id: userId,
                        category_id: categoryId,
                        accepts_emergency: true
                    }))

                    const { error: emergencyError } = await supabase
                        .from("provider_emergency_services")
                        .insert(emergencyRecords)

                    if (emergencyError) throw emergencyError
                }
            }

            toast({
                title: "Services updated",
                description: "Your services and emergency preferences have been successfully updated.",
            })

            // Refresh local state explicitly
            if (showEmergencyOptions && userId) {
                fetchEmergencyServices()
            }

            if (onSave) onSave()

        } catch (error: any) {
            console.error("Error saving services:", error)
            toast({
                title: "Error",
                description: "Could not save services.",
                variant: "destructive",
            })
        } finally {
            setSaving(false)
        }
    }

    // Helper to filter categories based on search
    const filterCategories = (cats: Category[]): Category[] => {
        if (!searchQuery) return cats

        const lowerQuery = searchQuery.toLowerCase()

        return cats
            .map((cat) => {
                const matchesRequest = cat.name.toLowerCase().includes(lowerQuery)
                const subcategories = cat.subcategories ? filterCategories(cat.subcategories) : []

                if (matchesRequest || subcategories.length > 0) {
                    return { ...cat, subcategories }
                }
                return null
            })
            .filter((cat): cat is Category => cat !== null)
    }

    const filteredCategories = filterCategories(categories)

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    <span>My Services</span>
                    {!hideSaveButton && (
                        <Button onClick={handleSave} disabled={saving} size="sm">
                            {saving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save Selection"
                            )}
                        </Button>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search services..."
                            className="pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <ScrollArea className="h-[400px] rounded-md border p-4">
                        {loading ? (
                            <div className="flex justify-center items-center h-full">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : filteredCategories.length === 0 ? (
                            <div className="text-center text-muted-foreground py-8">
                                No services found.
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {filteredCategories.map((cat) => (
                                    <ServiceItem
                                        key={cat.id}
                                        category={cat}
                                        level={0}
                                        selectedServices={selectedServices}
                                        emergencyServices={emergencyServices}
                                        onToggle={handleToggleService}
                                        onEmergencyToggle={handleToggleEmergency}
                                        searchQuery={searchQuery}
                                    />
                                ))}
                            </div>
                        )}
                    </ScrollArea>

                    <div className="text-sm text-muted-foreground">
                        {selectedServices.length} service{selectedServices.length !== 1 ? "s" : ""} selected
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
