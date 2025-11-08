'use client'

import { useState, useCallback, useRef } from 'react'

export interface LocationData {
  latitude: number
  longitude: number
  address?: string
}

interface UseLocationOptions {
  maxRetries?: number
  retryDelay?: number
  timeout?: number
  enableHighAccuracy?: boolean
}

export const useLocation = (options: UseLocationOptions = {}) => {
  const {
    maxRetries = 3,
    retryDelay = 2000,
    timeout = 15000,
    enableHighAccuracy = true,
  } = options

  const [location, setLocation] = useState<LocationData | null>(null)
  const [locationError, setLocationError] = useState<string>('')
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const retryCountRef = useRef(0)
  const abortControllerRef = useRef<AbortController | null>(null)

  const getAddressFromCoordinates = async (
    latitude: number,
    longitude: number
  ): Promise<string> => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          signal: controller.signal,
          headers: {
            'User-Agent': 'JiraClone/1.0',
          },
        }
      )

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error('Failed to fetch address')
      }

      const data = await response.json()
      return data.display_name || ''
    } catch (error) {
      console.warn('Failed to get address:', error)
      return ''
    }
  }

  const getCurrentLocation = useCallback(
    (retryAttempt = 0): Promise<LocationData> => {
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          const error = new Error(
            'Geolocation is not supported by this browser. Please use a modern browser with location support.'
          )
          setLocationError(error.message)
          reject(error)
          return
        }

        setIsLoadingLocation(true)
        setLocationError('')

        // Cancel previous request if any
        if (abortControllerRef.current) {
          abortControllerRef.current.abort()
        }

        const geolocationOptions: PositionOptions = {
          enableHighAccuracy,
          timeout,
          maximumAge: 60000, // Cache for 1 minute
        }

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const { latitude, longitude } = position.coords

              // Validate coordinates
              if (
                !latitude ||
                !longitude ||
                isNaN(latitude) ||
                isNaN(longitude) ||
                latitude < -90 ||
                latitude > 90 ||
                longitude < -180 ||
                longitude > 180
              ) {
                throw new Error('Invalid location coordinates received')
              }

              // Try to get address (non-blocking)
              let address = ''
              try {
                address = await getAddressFromCoordinates(latitude, longitude)
              } catch (error) {
                console.warn('Address lookup failed, continuing without address:', error)
              }

              const locationData: LocationData = {
                latitude,
                longitude,
                address,
              }

              setLocation(locationData)
              setIsLoadingLocation(false)
              retryCountRef.current = 0
              resolve(locationData)
            } catch (error) {
              setIsLoadingLocation(false)
              const errorMessage =
                error instanceof Error
                  ? error.message
                  : 'Failed to process location data'
              setLocationError(errorMessage)
              reject(new Error(errorMessage))
            }
          },
          (error) => {
            setIsLoadingLocation(false)
            let errorMessage = 'Failed to get location.'

            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage =
                  'Location access denied. Please enable location permissions in your browser settings and try again.'
                break
              case error.POSITION_UNAVAILABLE:
                errorMessage =
                  'Location information unavailable. Please check your GPS/network connection and try again.'
                break
              case error.TIMEOUT:
                errorMessage =
                  'Location request timed out. Please check your connection and try again.'
                break
              default:
                errorMessage = 'Failed to get location. Please try again.'
            }

            // Retry logic
            if (retryAttempt < maxRetries) {
              setLocationError(
                `${errorMessage} Retrying... (${retryAttempt + 1}/${maxRetries})`
              )
              setTimeout(() => {
                getCurrentLocation(retryAttempt + 1)
                  .then(resolve)
                  .catch(reject)
              }, retryDelay)
            } else {
              setLocationError(errorMessage)
              retryCountRef.current = 0
              reject(new Error(errorMessage))
            }
          },
          geolocationOptions
        )
      })
    },
    [maxRetries, retryDelay, timeout, enableHighAccuracy]
  )

  const clearLocation = useCallback(() => {
    setLocation(null)
    setLocationError('')
    retryCountRef.current = 0
  }, [])

  const refreshLocation = useCallback(() => {
    clearLocation()
    return getCurrentLocation()
  }, [clearLocation, getCurrentLocation])

  return {
    location,
    locationError,
    isLoadingLocation,
    getCurrentLocation,
    clearLocation,
    refreshLocation,
  }
}
