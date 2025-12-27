"use client"

import { useState, useEffect, useCallback } from "react"

// Shared state for the current tab/window to keep instances in sync
let globalFavorites: string[] = []
let listeners: Array<(favs: string[]) => void> = []

function notifyListeners() {
    listeners.forEach(l => l([...globalFavorites]))
}

export function useFavorites() {
    const [favorites, setFavorites] = useState<string[]>([])

    // Initialize from global variable or localStorage
    useEffect(() => {
        if (globalFavorites.length === 0) {
            const saved = typeof window !== 'undefined' ? localStorage.getItem("sports-oracle-favorites") : null
            if (saved) {
                try {
                    globalFavorites = JSON.parse(saved)
                } catch (e) {
                    console.error("Failed to parse favorites", e)
                }
            }
        }
        setFavorites([...globalFavorites])

        const listener = (newFavs: string[]) => {
            setFavorites(newFavs)
        }
        listeners.push(listener)

        // Sync from other tabs/windows
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === "sports-oracle-favorites" && e.newValue) {
                try {
                    globalFavorites = JSON.parse(e.newValue)
                    notifyListeners()
                } catch (err) {
                    console.error("Sync error", err)
                }
            }
        }
        window.addEventListener("storage", handleStorageChange)

        return () => {
            listeners = listeners.filter(l => l !== listener)
            window.removeEventListener("storage", handleStorageChange)
        }
    }, [])

    const toggleFavorite = useCallback((eventId: string) => {
        if (globalFavorites.includes(eventId)) {
            globalFavorites = globalFavorites.filter(id => id !== eventId)
        } else {
            globalFavorites = [...globalFavorites, eventId]
        }

        localStorage.setItem("sports-oracle-favorites", JSON.stringify(globalFavorites))
        notifyListeners()
    }, [])

    const isFavorite = useCallback((eventId: string) => {
        return favorites.includes(eventId)
    }, [favorites])

    return {
        favorites,
        toggleFavorite,
        isFavorite
    }
}
