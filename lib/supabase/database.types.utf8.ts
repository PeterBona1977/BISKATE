export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    is_provider: boolean | null
                    provider_status: string | null
                    provider_bio: string | null
                    provider_website: string | null
                    provider_phone: string | null
                    provider_experience_years: number | null
                    provider_hourly_rate: number | null
                    provider_availability: any | null
                    provider_application_date: string | null
                    updated_at: string | null
                    bio: string | null
                    website: string | null
                    phone: string | null
                    location: string | null
                    hourly_rate: number | null
                    provider_rejection_reason: string | null
                    full_name: string | null
                    avatar_url: string | null
                    email: string | null
                    role: string | null
                }
                Insert: {
                    id: string
                    is_provider?: boolean | null
                    provider_status?: string | null
                    provider_bio?: string | null
                    provider_website?: string | null
                    provider_phone?: string | null
                    provider_experience_years?: number | null
                    provider_hourly_rate?: number | null
                    provider_availability?: any | null
                    provider_application_date?: string | null
                    updated_at?: string | null
                    bio?: string | null
                    website?: string | null
                    phone?: string | null
                    location?: string | null
                    hourly_rate?: number | null
                    provider_rejection_reason?: string | null
                    full_name?: string | null
                    avatar_url?: string | null
                    email?: string | null
                    role?: string | null
                }
                Update: {
                    id?: string
                    is_provider?: boolean | null
                    provider_status?: string | null
                    provider_bio?: string | null
                    provider_website?: string | null
                    provider_phone?: string | null
                    provider_experience_years?: number | null
                    provider_hourly_rate?: number | null
                    provider_availability?: any | null
                    provider_application_date?: string | null
                    updated_at?: string | null
                    bio?: string | null
                    website?: string | null
                    phone?: string | null
                    location?: string | null
                    hourly_rate?: number | null
                    provider_rejection_reason?: string | null
                    full_name?: string | null
                    avatar_url?: string | null
                    email?: string | null
                    role?: string | null
                }
            }
            categories: {
                Row: {
                    id: string
                    name: string
                    slug: string
                    description: string | null
                    icon_name: string | null
                }
                Insert: {
                    id?: string
                    name: string
                    slug: string
                    description?: string | null
                    icon_name?: string | null
                }
                Update: {
                    id?: string
                    name?: string
                    slug?: string
                    description?: string | null
                    icon_name?: string | null
                }
            }
            subcategories: {
                Row: {
                    id: string
                    category_id: string
                    name: string
                    slug: string
                    description: string | null
                }
                Insert: {
                    id?: string
                    category_id: string
                    name: string
                    slug: string
                    description?: string | null
                }
                Update: {
                    id?: string
                    category_id?: string
                    name?: string
                    slug?: string
                    description?: string | null
                }
            }
            services: {
                Row: {
                    id: string
                    subcategory_id: string
                    name: string
                    slug: string
                    description: string | null
                }
                Insert: {
                    id?: string
                    subcategory_id: string
                    name: string
                    slug: string
                    description?: string | null
                }
                Update: {
                    id?: string
                    subcategory_id?: string
                    name?: string
                    slug?: string
                    description?: string | null
                }
            }
            provider_services: {
                Row: {
                    id: string
                    provider_id: string
                    service_id: string
                }
                Insert: {
                    id?: string
                    provider_id: string
                    service_id: string
                }
                Update: {
                    id?: string
                    provider_id?: string
                    service_id?: string
                }
            }
            provider_specialties: {
                Row: {
                    id: string
                    provider_id: string
                    specialty_name: string
                    experience_level: string
                    years_experience: number
                }
                Insert: {
                    id?: string
                    provider_id: string
                    specialty_name: string
                    experience_level: string
                    years_experience: number
                }
                Update: {
                    id?: string
                    provider_id?: string
                    specialty_name?: string
                    experience_level?: string
                    years_experience?: number
                }
            }
            provider_documents: {
                Row: {
                    id: string
                    provider_id: string
                    document_type: string
                    document_name: string
                    document_url: string
                    status: string
                }
                Insert: {
                    id?: string
                    provider_id: string
                    document_type: string
                    document_name: string
                    document_url: string
                    status: string
                }
                Update: {
                    id?: string
                    provider_id?: string
                    document_type?: string
                    document_name?: string
                    document_url?: string
                    status?: string
                }
            }
            portfolio_items: {
                Row: {
                    id: string
                    provider_id: string
                    title: string
                    description: string | null
                    project_url: string | null
                    completion_date: string | null
                    client_name: string | null
                    image_url: string | null // Keep for backward compatibility/types
                    technologies: string[] | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    provider_id: string
                    title: string
                    description?: string | null
                    project_url?: string | null
                    completion_date?: string | null
                    client_name?: string | null
                    image_url?: string | null
                    technologies?: string[] | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    provider_id?: string
                    title?: string
                    description?: string | null
                    project_url?: string | null
                    completion_date?: string | null
                    client_name?: string | null
                    image_url?: string | null
                    technologies?: string[] | null
                    created_at?: string
                }
            }
            portfolio_media: {
                Row: {
                    id: string
                    portfolio_item_id: string
                    url: string
                    media_type: 'image' | 'video' | 'pdf'
                    file_name: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    portfolio_item_id: string
                    url: string
                    media_type: 'image' | 'video' | 'pdf'
                    file_name?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    portfolio_item_id?: string
                    url?: string
                    media_type?: 'image' | 'video' | 'pdf'
                    file_name?: string | null
                    created_at?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            initialize_provider_stats: {
                Args: {
                    provider_uuid: string
                }
                Returns: void
            }
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

