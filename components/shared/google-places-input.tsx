"use client"

import { useEffect, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { MapPin } from "lucide-react"

interface GooglePlacesInputProps {
    value: string
    onChange: (value: string, details?: { concelho?: string; distrito?: string }) => void
    placeholder?: string
    disabled?: boolean
    className?: string
}

export function GooglePlacesInput({
    value,
    onChange,
    placeholder = "Digite a localização...",
    disabled = false,
    className = ""
}: GooglePlacesInputProps) {
    const inputRef = useRef<HTMLInputElement>(null)
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
    const [isLoaded, setIsLoaded] = useState(false)

    useEffect(() => {
        // Check if Google Maps is already loaded
        if (typeof google !== 'undefined' && google.maps && google.maps.places) {
            setIsLoaded(true)
            return
        }

        // Load Google Maps script
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
        if (!apiKey) {
            console.error("Google Maps API key is missing")
            return
        }

        const script = document.createElement('script')
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=pt-PT`
        script.async = true
        script.defer = true
        script.onload = () => setIsLoaded(true)
        document.head.appendChild(script)

        return () => {
            // Cleanup script if component unmounts
            if (script.parentNode) {
                script.parentNode.removeChild(script)
            }
        }
    }, [])

    useEffect(() => {
        if (!isLoaded || !inputRef.current) return

        // Initialize autocomplete with restrictions to Portugal
        autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
            componentRestrictions: { country: 'pt' }, // Restrict to Portugal
            fields: ['address_components', 'formatted_address', 'geometry'],
            types: ['(regions)'] // Focus on regions, cities, municipalities
        })

        // Add listener for place selection
        const listener = autocompleteRef.current.addListener('place_changed', () => {
            const place = autocompleteRef.current?.getPlace()
            if (!place || !place.address_components) return

            let concelho = ''
            let distrito = ''
            let formattedLocation = ''

            // Parse address components to extract concelho and distrito
            place.address_components.forEach((component) => {
                const types = component.types

                // administrative_level_2 is typically the Concelho (Municipality)
                if (types.includes('administrative_area_level_2')) {
                    concelho = component.long_name
                }

                // administrative_level_1 is typically the Distrito (District)
                if (types.includes('administrative_area_level_1')) {
                    distrito = component.long_name
                }

                // locality can also be useful
                if (types.includes('locality') && !concelho) {
                    concelho = component.long_name
                }
            })

            // Create formatted location string
            if (concelho && distrito) {
                formattedLocation = `${concelho}, ${distrito}`
            } else if (place.formatted_address) {
                formattedLocation = place.formatted_address
            }

            onChange(formattedLocation, { concelho, distrito })
        })

        return () => {
            if (listener) {
                google.maps.event.removeListener(listener)
            }
        }
    }, [isLoaded, onChange])

    return (
        <div className="relative">
            <Input
                ref={inputRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                className={className}
            />
            <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
    )
}
