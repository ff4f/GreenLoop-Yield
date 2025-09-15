import ExifReader from 'exifreader';

/**
 * Utility functions for EXIF/GPS validation
 */

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in meters
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Extract GPS coordinates from EXIF data
 * @param {Object} exifData - EXIF data from ExifReader
 * @returns {Object|null} GPS coordinates or null if not found
 */
export function extractGPSCoordinates(exifData) {
  try {
    const gpsLat = exifData['GPS Latitude'];
    const gpsLatRef = exifData['GPS Latitude Reference'];
    const gpsLon = exifData['GPS Longitude'];
    const gpsLonRef = exifData['GPS Longitude Reference'];

    if (!gpsLat || !gpsLon) {
      return null;
    }

    // Convert DMS to decimal degrees
    let latitude = convertDMSToDD(gpsLat.description);
    let longitude = convertDMSToDD(gpsLon.description);

    // Apply hemisphere corrections
    if (gpsLatRef && gpsLatRef.value[0] === 'S') {
      latitude = -latitude;
    }
    if (gpsLonRef && gpsLonRef.value[0] === 'W') {
      longitude = -longitude;
    }

    return { latitude, longitude };
  } catch (error) {
    console.error('Error extracting GPS coordinates:', error);
    return null;
  }
}

/**
 * Convert DMS (Degrees, Minutes, Seconds) to Decimal Degrees
 * @param {string} dms - DMS string
 * @returns {number} Decimal degrees
 */
function convertDMSToDD(dms) {
  const parts = dms.match(/(\d+)°\s*(\d+)'\s*([\d.]+)"/); 
  if (!parts) {
    // Try alternative format
    const altParts = dms.split(/[°'"\s]+/).filter(p => p.length > 0);
    if (altParts.length >= 3) {
      const degrees = parseFloat(altParts[0]);
      const minutes = parseFloat(altParts[1]);
      const seconds = parseFloat(altParts[2]);
      return degrees + minutes/60 + seconds/3600;
    }
    throw new Error(`Invalid DMS format: ${dms}`);
  }
  
  const degrees = parseFloat(parts[1]);
  const minutes = parseFloat(parts[2]);
  const seconds = parseFloat(parts[3]);
  
  return degrees + minutes/60 + seconds/3600;
}

/**
 * Extract timestamp from EXIF data
 * @param {Object} exifData - EXIF data from ExifReader
 * @returns {Date|null} Timestamp or null if not found
 */
export function extractTimestamp(exifData) {
  try {
    // Try different timestamp fields
    const dateTimeOriginal = exifData['DateTime Original'];
    const dateTime = exifData['DateTime'];
    const dateTimeDigitized = exifData['DateTime Digitized'];
    
    const timestampField = dateTimeOriginal || dateTime || dateTimeDigitized;
    
    if (!timestampField) {
      return null;
    }

    // Parse EXIF timestamp format: "YYYY:MM:DD HH:MM:SS"
    const timestampStr = timestampField.description || timestampField.value;
    const [datePart, timePart] = timestampStr.split(' ');
    const [year, month, day] = datePart.split(':');
    const [hour, minute, second] = timePart.split(':');
    
    return new Date(year, month - 1, day, hour, minute, second);
  } catch (error) {
    console.error('Error extracting timestamp:', error);
    return null;
  }
}

/**
 * Validate photo EXIF data against parcel location and time constraints
 * @param {Buffer} imageBuffer - Image file buffer
 * @param {Object} parcelData - Parcel data with location info
 * @param {Date} uploadTime - Time when photo was uploaded
 * @returns {Object} Validation result
 */
export async function validatePhotoEXIF(imageBuffer, parcelData, uploadTime = new Date()) {
  try {
    // Extract EXIF data
    const exifData = ExifReader.load(imageBuffer);
    
    const result = {
      isValid: false,
      hasGPS: false,
      hasTimestamp: false,
      gpsValid: false,
      timestampValid: false,
      distance: null,
      timeDifference: null,
      errors: [],
      warnings: [],
      gpsCoordinates: null,
      timestamp: null
    };

    // Extract GPS coordinates
    const gpsCoords = extractGPSCoordinates(exifData);
    if (gpsCoords) {
      result.hasGPS = true;
      result.gpsCoordinates = gpsCoords;
      
      // Validate GPS location against parcel
      if (parcelData.location && parcelData.location.coordinates) {
        const parcelCoords = getParcelCenterCoordinates(parcelData.location);
        const distance = calculateDistance(
          gpsCoords.latitude, gpsCoords.longitude,
          parcelCoords.latitude, parcelCoords.longitude
        );
        
        result.distance = distance;
        
        // Check if within 1km radius
        if (distance <= 1000) {
          result.gpsValid = true;
        } else {
          result.errors.push(`Photo location is ${Math.round(distance)}m from parcel center (max 1000m allowed)`);
        }
      } else {
        result.warnings.push('Parcel location data not available for GPS validation');
      }
    } else {
      result.errors.push('No GPS coordinates found in photo EXIF data');
    }

    // Extract and validate timestamp
    const timestamp = extractTimestamp(exifData);
    if (timestamp) {
      result.hasTimestamp = true;
      result.timestamp = timestamp;
      
      // Check if within ±24 hours of upload time
      const timeDifference = Math.abs(uploadTime.getTime() - timestamp.getTime());
      const maxTimeDifference = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      
      result.timeDifference = timeDifference;
      
      if (timeDifference <= maxTimeDifference) {
        result.timestampValid = true;
      } else {
        const hoursDiff = Math.round(timeDifference / (60 * 60 * 1000));
        result.errors.push(`Photo timestamp is ${hoursDiff} hours from upload time (max 24 hours allowed)`);
      }
    } else {
      result.errors.push('No timestamp found in photo EXIF data');
    }

    // Overall validation
    result.isValid = result.gpsValid && result.timestampValid;
    
    return result;
  } catch (error) {
    return {
      isValid: false,
      hasGPS: false,
      hasTimestamp: false,
      gpsValid: false,
      timestampValid: false,
      distance: null,
      timeDifference: null,
      errors: [`EXIF validation error: ${error.message}`],
      warnings: [],
      gpsCoordinates: null,
      timestamp: null
    };
  }
}

/**
 * Get center coordinates from parcel GeoJSON
 * @param {Object} geoJson - GeoJSON geometry
 * @returns {Object} Center coordinates
 */
function getParcelCenterCoordinates(geoJson) {
  if (geoJson.type === 'Point') {
    return {
      longitude: geoJson.coordinates[0],
      latitude: geoJson.coordinates[1]
    };
  }
  
  if (geoJson.type === 'Polygon') {
    // Calculate centroid of polygon
    const coordinates = geoJson.coordinates[0]; // First ring
    let sumLat = 0, sumLon = 0;
    
    for (const coord of coordinates) {
      sumLon += coord[0];
      sumLat += coord[1];
    }
    
    return {
      longitude: sumLon / coordinates.length,
      latitude: sumLat / coordinates.length
    };
  }
  
  // Default fallback
  return { longitude: 0, latitude: 0 };
}

/**
 * Calculate EXIF validation score for PDI
 * @param {Object} validationResult - Result from validatePhotoEXIF
 * @returns {number} Score between 0 and 1
 */
export function calculateEXIFScore(validationResult) {
  if (!validationResult) return 0;
  
  let score = 0;
  
  // Base score for having GPS data
  if (validationResult.hasGPS) {
    score += 0.3;
  }
  
  // Base score for having timestamp
  if (validationResult.hasTimestamp) {
    score += 0.2;
  }
  
  // Bonus for valid GPS (within 1km)
  if (validationResult.gpsValid) {
    score += 0.3;
  }
  
  // Bonus for valid timestamp (within 24h)
  if (validationResult.timestampValid) {
    score += 0.2;
  }
  
  return Math.min(score, 1.0);
}