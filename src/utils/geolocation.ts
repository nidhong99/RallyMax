import { Venue } from "../types/database";
import { DISTRICTS } from "../constants/locations";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Calculates Great-Circle distance between two coordinates in kilometers using Haversine formula
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Resolve coordinates for a venue, falling back to its district centroid if GPS is not set
 */
export function getVenueCoordinates(venue?: Venue | null): Coordinates | null {
  if (!venue) return null;

  if (typeof venue.latitude === "number" && typeof venue.longitude === "number" && !isNaN(venue.latitude) && !isNaN(venue.longitude)) {
    return { latitude: venue.latitude, longitude: venue.longitude };
  }

  if (venue.district_code) {
    const matchedDistrict = DISTRICTS.find((d) => d.code === venue.district_code);
    if (matchedDistrict?.latitude && matchedDistrict?.longitude) {
      return { latitude: matchedDistrict.latitude, longitude: matchedDistrict.longitude };
    }
  }

  return null;
}

/**
 * Request user geolocation via browser Geolocation API
 */
export function getUserCoordinates(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      return reject(new Error("UNSUPPORTED"));
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          reject(new Error("DENIED"));
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          reject(new Error("UNAVAILABLE"));
        } else if (error.code === error.TIMEOUT) {
          reject(new Error("TIMEOUT"));
        } else {
          reject(error);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  });
}
