import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { CategorySuggestionService } from "@/lib/ai/category-suggestion-service"

export async function POST(request: NextRequest) {
    try {
        // Parse request body
        const body = await request.json()
        const { title, description } = body

        // Validate input
        if (!title || typeof title !== "string" || title.trim().length === 0) {
            return NextResponse.json({ error: "Title is required" }, { status: 400 })
        }

        if (!description || typeof description !== "string" || description.trim().length === 0) {
            return NextResponse.json({ error: "Description is required" }, { status: 400 })
        }

        // Fetch all categories from database
        const supabase = await createClient()
        const { data: categories, error: categoriesError } = await supabase
            .from("categories")
            .select("id, name, parent_id")
            .eq("is_active", true)

        if (categoriesError) {
            console.error("Error fetching categories:", categoriesError)
            return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 })
        }

        if (!categories || categories.length === 0) {
            return NextResponse.json({ suggestions: [] })
        }

        // Get AI suggestions
        const suggestions = await CategorySuggestionService.suggestCategories(
            title.trim(),
            description.trim(),
            categories
        )

        return NextResponse.json({ suggestions })
    } catch (error) {
        console.error("Error in suggest-categories API:", error)
        return NextResponse.json(
            { error: "An error occurred while processing your request" },
            { status: 500 }
        )
    }
}

// Optional: Add rate limiting in production
export const runtime = "edge"
export const dynamic = "force-dynamic"
