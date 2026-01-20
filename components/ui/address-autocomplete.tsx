
/// <reference types="@types/google.maps" />
"use client"

import React, { useEffect, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"

interface AddressAutocompleteProps {
    value: string
    onChange: (value: string) => void
    onSelect?: (place: google.maps.places.PlaceResult) => void
    placeholder?: string
    required?: boolean
    disabled?: boolean
    className?: string
    id?: string
}

declare global {
    interface Window {
        google: any
    }
}

export function AddressAutocomplete({
    value,
    onChange,
    onSelect,
    placeholder = "Enter location...",
    required = false,
    disabled = false,
    className,
    id
}: AddressAutocompleteProps) {
    const inputRef = useRef<HTMLInputElement>(null)
    const autoCompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
    const [scriptLoaded, setScriptLoaded] = useState(false)
    const [error, setError] = useState(false)

    // Function to load Google Maps script
    const loadScript = () => {
        if (window.google?.maps?.places) {
            setScriptLoaded(true)
            return
        }

        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
        if (!apiKey) {
            console.error("Google Maps API Key is missing")
            setError(true)
            return
        }

        const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]')
        if (existingScript) {
            existingScript.addEventListener('load', () => setScriptLoaded(true))
            return
        }

        const script = document.createElement("script")
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
        script.async = true
        script.defer = true
        script.onload = () => setScriptLoaded(true)
        script.onerror = () => setError(true)
        document.head.appendChild(script)
    }

    useEffect(() => {
        loadScript()
    }, [])

    useEffect(() => {
        if (!scriptLoaded || !inputRef.current || autoCompleteRef.current) return

        try {
            const options = {
                types: ["geocode"], // Allow postal codes and addresses
                fields: ["address_components", "formatted_address", "name"],
                componentRestrictions: { country: "pt" }, // Keep restricted to Portugal
            }

            autoCompleteRef.current = new window.google.maps.places.Autocomplete(
                inputRef.current,
                options
            )

            autoCompleteRef.current?.addListener("place_changed", () => {
                const place = autoCompleteRef.current?.getPlace()
                if (place) {
                    handlePlaceSelect(place)
                }
            })
        } catch (err) {
            console.error("Failed to initialize Google Maps Autocomplete", err)
        }
    }, [scriptLoaded])

    const handlePlaceSelect = (place: google.maps.places.PlaceResult) => {
        // Extract address components
        let locality = ""
        let postalTown = ""
        let municipality = ""
        let district = ""
        let country = ""

        if (place.address_components) {
            for (const component of place.address_components) {
                if (component.types.includes("locality")) {
                    locality = component.long_name
                }
                if (component.types.includes("postal_town")) {
                    postalTown = component.long_name
                }
                if (component.types.includes("administrative_area_level_2")) {
                    municipality = component.long_name
                }
                if (component.types.includes("administrative_area_level_1")) {
                    district = component.long_name
                }
                if (component.types.includes("country")) {
                    country = component.long_name
                }
            }
        }

        // Construct formatting location with preference for specificity
        // 1. Prefer "Locality, Country" or "Postal Town, Country" if available (e.g. "Ramada, Portugal")
        // 2. Fallback to "Municipality, District" (e.g. "Odivelas, Lisboa")
        // 3. Last resort: Name or Formatted Address

        let formattedLocation = ""

        // For postal codes, the 'name' is often the postal code itself (e.g. "2620-271"), so we don't want to use that as the location text alone.
        // We want the Place Name associated with it. Usually found in locality.

        const specificLocation = locality || postalTown

        if (specificLocation) {
            formattedLocation = `${specificLocation}, ${country || "Portugal"}`
        } else if (municipality && district) {
            formattedLocation = `${municipality}, ${district}`
        } else if (municipality) {
            formattedLocation = `${municipality}, Portugal`
        } else {
            formattedLocation = place.formatted_address || ""
        }

        // Update parent
        onChange(formattedLocation)
        if (onSelect) {
            onSelect(place)
        }
    }

    return (
        <div className="relative">
            <Input
                ref={inputRef}
                id={id}
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                required={required}
                disabled={disabled || !scriptLoaded || error}
                className={className}
                autoComplete="off"
            />
            {!scriptLoaded && !error && (
                <div className="absolute right-3 top-2.5">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
            )}
        </div>
    )
}
