import * as Location from 'expo-location';
import { roundCoordinate } from './signing';

const LOCATION_TIMEOUT_MS = 8_000;

export interface Coordinates {
  latitude: number | null;
  longitude: number | null;
}

const NONE: Coordinates = { latitude: null, longitude: null };

/** Best-effort position for the check-in. A refusal or timeout means "no location", never a failure. */
export async function currentCoordinates(): Promise<Coordinates> {
  try {
    const { granted } = await Location.requestForegroundPermissionsAsync();
    if (!granted) return NONE;
    const position = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), LOCATION_TIMEOUT_MS)),
    ]);
    if (!position) return NONE;
    return {
      latitude: roundCoordinate(position.coords.latitude),
      longitude: roundCoordinate(position.coords.longitude),
    };
  } catch {
    return NONE;
  }
}
