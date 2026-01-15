"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, AlertCircle } from "lucide-react"

interface MapMarker {
    id: string
    lat: number
    lng: number
    type: 'online' | 'responder'
    label?: string
}

interface EmergencyMapProps {
    clientLat: number
    clientLng: number
    providers?: MapMarker[]
    apiKey?: string
}

declare global {
    interface Window {
        google: any
    }
}

export function EmergencyMap({ clientLat, clientLng, providers, apiKey }: EmergencyMapProps) {
    const mapRef = useRef<HTMLDivElement>(null)
    const [map, setMap] = useState<any>(null)
    const markersRef = useRef<any[]>([])
    const [clientMarker, setClientMarker] = useState<any>(null)
    const [directionsRenderer, setDirectionsRenderer] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)
    const [isLoaded, setIsLoaded] = useState(false)

    useEffect(() => {
        if (!apiKey) {
            setError("Google Maps API Key missing. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env.local")
            return
        }

        const loadScript = () => {
            if (window.google && window.google.maps) {
                setIsLoaded(true)
                return
            }

            if (document.getElementById("google-maps-script")) {
                const checkInterval = setInterval(() => {
                    if (window.google && window.google.maps) {
                        setIsLoaded(true)
                        clearInterval(checkInterval)
                    }
                }, 100)
                return
            }

            const script = document.createElement("script")
            script.id = "google-maps-script"
            // Using standard loading without the modern loading=async parameter to avoid internal importLibrary triggers
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry,places`
            script.async = true
            script.defer = true
            script.onload = () => setIsLoaded(true)
            script.onerror = () => setError("Failed to load Google Maps script.")
            document.head.appendChild(script)
        }

        loadScript()
    }, [apiKey])

    useEffect(() => {
        if (isLoaded && mapRef.current && !map) {
            const initMap = () => {
                const google = window.google
                if (!google || !google.maps) throw new Error("Google Maps não carregado")

                const newMap = new google.maps.Map(mapRef.current, {
                    center: { lat: clientLat, lng: clientLng },
                    zoom: 14,
                    disableDefaultUI: true,
                    // REMOVED mapId to avoid triggering AdvancedMarker/Dynamic logic
                    styles: [
                        {
                            "featureType": "all",
                            "elementType": "labels.text.fill",
                            "stylers": [{ "color": "#7c93a3" }, { "lightness": "-10" }]
                        }
                    ]
                })

                const cMarker = new google.maps.Marker({
                    position: { lat: clientLat, lng: clientLng },
                    map: newMap,
                    title: "Sua Localização",
                    icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 10,
                        fillColor: "#4F46E5",
                        fillOpacity: 1,
                        strokeWeight: 2,
                        strokeColor: "#FFFFFF",
                    },
                })

                const renderer = new google.maps.DirectionsRenderer({
                    map: newMap,
                    suppressMarkers: true,
                    polylineOptions: {
                        strokeColor: "#EF4444",
                        strokeWeight: 5,
                        strokeOpacity: 0.8
                    }
                })

                setMap(newMap)
                setClientMarker(cMarker)
                setDirectionsRenderer(renderer)
            }

            try {
                initMap()
            } catch (err: any) {
                console.error("Error initializing map:", err)
                setError(`Erro ao carregar mapa: ${err.message}`)
            }
        }
    }, [isLoaded, clientLat, clientLng])

    useEffect(() => {
        if (map && providers) {
            const updateMarkers = () => {
                const google = window.google
                if (!google || !google.maps) return

                // Clear existing provider markers
                if (markersRef.current) {
                    markersRef.current.forEach((m: any) => m.setMap(null))
                }
                markersRef.current = []

                providers.forEach((p) => {
                    const isResponder = p.type === 'responder'
                    const pMarker = new google.maps.Marker({
                        position: { lat: p.lat, lng: p.lng },
                        map: map,
                        icon: {
                            path: isResponder
                                ? "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" // Map Pin
                                : "M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99z", // Car icon
                            fillColor: isResponder ? "#EF4444" : "#10B981",
                            fillOpacity: 1,
                            strokeWeight: 1,
                            scale: isResponder ? 1.5 : 1.2,
                            anchor: new google.maps.Point(12, 12)
                        },
                        title: p.label || (isResponder ? "Responder" : "Disponível")
                    })
                    markersRef.current.push(pMarker)
                })

                // If exactly one responder is selected/focused, show directions
                const focusedResponder = providers.find(p => p.type === 'responder')
                if (focusedResponder) {
                    const directionsService = new google.maps.DirectionsService()
                    directionsService.route(
                        {
                            origin: { lat: focusedResponder.lat, lng: focusedResponder.lng },
                            destination: { lat: clientLat, lng: clientLng },
                            travelMode: google.maps.TravelMode.DRIVING,
                        },
                        (result: any, status: any) => {
                            if (status === google.maps.DirectionsStatus.OK && directionsRenderer) {
                                directionsRenderer.setDirections(result)
                            }
                        }
                    )
                } else if (directionsRenderer) {
                    directionsRenderer.setDirections({ routes: [] })
                }
            }
            updateMarkers()
        }
    }, [map, providers, clientLat, clientLng, directionsRenderer])

    if (error) return (
        <div className="flex flex-col items-center justify-center h-full bg-gray-50 border-2 border-dashed rounded-xl p-8 text-center gap-3">
            <AlertCircle className="h-10 w-10 text-red-500" />
            <p className="text-sm font-medium text-gray-900">{error}</p>
            <p className="text-xs text-gray-500">Live tracking requires a valid Maps API Key.</p>
        </div>
    )

    if (!isLoaded) return (
        <div className="flex items-center justify-center h-full bg-gray-50 rounded-xl">
            <Loader2 className="h-8 w-8 animate-spin text-red-400" />
        </div>
    )

    return <div ref={mapRef} className="w-full h-full rounded-xl overflow-hidden shadow-inner" />
}
