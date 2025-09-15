/**
 * NDVI Sanity Check Utilities
 * Validates NDVI data against parcel GeoJSON area
 */

/**
 * Calculate NDVI histogram from image data
 * @param {Buffer} ndviBuffer - NDVI image buffer (GeoTIFF format)
 * @returns {Object} Histogram data and statistics
 */
export async function calculateNDVIHistogram(ndviBuffer) {
  try {
    // For demo purposes, we'll simulate NDVI analysis
    // In production, you'd use libraries like geotiff.js or sharp
    
    const result = {
      histogram: {},
      statistics: {
        min: -1,
        max: 1,
        mean: 0,
        median: 0,
        stdDev: 0,
        validPixels: 0,
        totalPixels: 0
      },
      healthCategories: {
        water: 0,        // NDVI < 0
        bareGround: 0,   // 0 <= NDVI < 0.2
        sparseVeg: 0,    // 0.2 <= NDVI < 0.4
        moderateVeg: 0,  // 0.4 <= NDVI < 0.6
        denseVeg: 0      // NDVI >= 0.6
      }
    };

    // Simulate NDVI data analysis
    // In real implementation, you would:
    // 1. Parse GeoTIFF using geotiff.js
    // 2. Extract pixel values
    // 3. Calculate actual histogram
    
    const simulatedNDVIValues = generateSimulatedNDVIData(1000); // 1000 sample pixels
    
    // Calculate histogram
    const bins = 20;
    const binSize = 2 / bins; // NDVI range is -1 to 1
    
    for (let i = 0; i < bins; i++) {
      result.histogram[i] = 0;
    }
    
    let sum = 0;
    const validValues = [];
    
    simulatedNDVIValues.forEach(value => {
      if (value >= -1 && value <= 1) {
        const binIndex = Math.min(Math.floor((value + 1) / binSize), bins - 1);
        result.histogram[binIndex]++;
        
        sum += value;
        validValues.push(value);
        result.statistics.validPixels++;
        
        // Categorize vegetation health
        if (value < 0) {
          result.healthCategories.water++;
        } else if (value < 0.2) {
          result.healthCategories.bareGround++;
        } else if (value < 0.4) {
          result.healthCategories.sparseVeg++;
        } else if (value < 0.6) {
          result.healthCategories.moderateVeg++;
        } else {
          result.healthCategories.denseVeg++;
        }
      }
      result.statistics.totalPixels++;
    });
    
    // Calculate statistics
    if (validValues.length > 0) {
      result.statistics.mean = sum / validValues.length;
      
      // Calculate median
      validValues.sort((a, b) => a - b);
      const mid = Math.floor(validValues.length / 2);
      result.statistics.median = validValues.length % 2 === 0 
        ? (validValues[mid - 1] + validValues[mid]) / 2
        : validValues[mid];
      
      // Calculate standard deviation
      const variance = validValues.reduce((acc, val) => 
        acc + Math.pow(val - result.statistics.mean, 2), 0) / validValues.length;
      result.statistics.stdDev = Math.sqrt(variance);
      
      result.statistics.min = Math.min(...validValues);
      result.statistics.max = Math.max(...validValues);
    }
    
    return result;
  } catch (error) {
    throw new Error(`NDVI histogram calculation failed: ${error.message}`);
  }
}

/**
 * Generate simulated NDVI data for testing
 * @param {number} pixelCount - Number of pixels to simulate
 * @returns {Array} Array of NDVI values
 */
function generateSimulatedNDVIData(pixelCount) {
  const values = [];
  
  for (let i = 0; i < pixelCount; i++) {
    // Simulate realistic NDVI distribution
    // Most values should be in vegetation range (0.2 - 0.8)
    const rand = Math.random();
    
    if (rand < 0.05) {
      // 5% water/shadow (negative values)
      values.push(-0.5 + Math.random() * 0.5);
    } else if (rand < 0.15) {
      // 10% bare ground/urban (0 - 0.2)
      values.push(Math.random() * 0.2);
    } else if (rand < 0.35) {
      // 20% sparse vegetation (0.2 - 0.4)
      values.push(0.2 + Math.random() * 0.2);
    } else if (rand < 0.70) {
      // 35% moderate vegetation (0.4 - 0.6)
      values.push(0.4 + Math.random() * 0.2);
    } else {
      // 30% dense vegetation (0.6 - 1.0)
      values.push(0.6 + Math.random() * 0.4);
    }
  }
  
  return values;
}

/**
 * Calculate expected NDVI characteristics based on parcel area and type
 * @param {Object} parcelData - Parcel information including GeoJSON and type
 * @returns {Object} Expected NDVI characteristics
 */
export function calculateExpectedNDVI(parcelData) {
  const area = calculateParcelArea(parcelData.location);
  const projectType = parcelData.type || 'nature';
  
  const expectations = {
    area: area,
    projectType: projectType,
    expectedMean: 0.5,
    expectedRange: { min: 0.2, max: 0.8 },
    expectedVegetationCoverage: 0.7, // 70% vegetation coverage
    tolerances: {
      meanDeviation: 0.2,
      vegetationCoverageDeviation: 0.3
    }
  };
  
  // Adjust expectations based on project type
  switch (projectType) {
    case 'agroforestry':
      expectations.expectedMean = 0.6;
      expectations.expectedRange = { min: 0.3, max: 0.9 };
      expectations.expectedVegetationCoverage = 0.8;
      break;
    case 'nature':
      expectations.expectedMean = 0.7;
      expectations.expectedRange = { min: 0.4, max: 0.9 };
      expectations.expectedVegetationCoverage = 0.85;
      break;
    case 'cookstove':
      expectations.expectedMean = 0.4;
      expectations.expectedRange = { min: 0.1, max: 0.7 };
      expectations.expectedVegetationCoverage = 0.5;
      break;
    case 'methane':
      expectations.expectedMean = 0.3;
      expectations.expectedRange = { min: 0.0, max: 0.6 };
      expectations.expectedVegetationCoverage = 0.4;
      break;
  }
  
  return expectations;
}

/**
 * Calculate parcel area from GeoJSON
 * @param {Object} geoJson - GeoJSON geometry
 * @returns {number} Area in hectares
 */
function calculateParcelArea(geoJson) {
  if (!geoJson || !geoJson.coordinates) {
    return 0;
  }
  
  if (geoJson.type === 'Polygon') {
    // Simple area calculation using shoelace formula
    const coords = geoJson.coordinates[0];
    let area = 0;
    
    for (let i = 0; i < coords.length - 1; i++) {
      area += coords[i][0] * coords[i + 1][1];
      area -= coords[i + 1][0] * coords[i][1];
    }
    
    area = Math.abs(area) / 2;
    
    // Convert from square degrees to hectares (rough approximation)
    // 1 degree ≈ 111 km at equator
    const areaInSquareMeters = area * 111000 * 111000;
    const areaInHectares = areaInSquareMeters / 10000;
    
    return areaInHectares;
  }
  
  return 0;
}

/**
 * Validate NDVI data against parcel expectations
 * @param {Buffer} ndviBuffer - NDVI image buffer
 * @param {Object} parcelData - Parcel data with location and type
 * @returns {Object} Validation result
 */
export async function validateNDVIData(ndviBuffer, parcelData) {
  try {
    const histogram = await calculateNDVIHistogram(ndviBuffer);
    const expectations = calculateExpectedNDVI(parcelData);
    
    const result = {
      isValid: false,
      histogram: histogram,
      expectations: expectations,
      anomalies: [],
      warnings: [],
      score: 0,
      analysis: {
        meanWithinRange: false,
        vegetationCoverageOK: false,
        distributionNormal: false
      }
    };
    
    // Check mean NDVI
    const meanDifference = Math.abs(histogram.statistics.mean - expectations.expectedMean);
    result.analysis.meanWithinRange = meanDifference <= expectations.tolerances.meanDeviation;
    
    if (!result.analysis.meanWithinRange) {
      result.anomalies.push(
        `Mean NDVI (${histogram.statistics.mean.toFixed(3)}) deviates significantly from expected (${expectations.expectedMean.toFixed(3)})`
      );
    }
    
    // Check vegetation coverage
    const totalVegetation = histogram.healthCategories.sparseVeg + 
                           histogram.healthCategories.moderateVeg + 
                           histogram.healthCategories.denseVeg;
    const vegetationCoverage = totalVegetation / histogram.statistics.validPixels;
    
    const coverageDifference = Math.abs(vegetationCoverage - expectations.expectedVegetationCoverage);
    result.analysis.vegetationCoverageOK = coverageDifference <= expectations.tolerances.vegetationCoverageDeviation;
    
    if (!result.analysis.vegetationCoverageOK) {
      result.anomalies.push(
        `Vegetation coverage (${(vegetationCoverage * 100).toFixed(1)}%) differs from expected (${(expectations.expectedVegetationCoverage * 100).toFixed(1)}%)`
      );
    }
    
    // Check for unusual distribution patterns
    const waterPercentage = histogram.healthCategories.water / histogram.statistics.validPixels;
    if (waterPercentage > 0.3) {
      result.warnings.push(`High water/shadow coverage (${(waterPercentage * 100).toFixed(1)}%) detected`);
    }
    
    const bareGroundPercentage = histogram.healthCategories.bareGround / histogram.statistics.validPixels;
    if (bareGroundPercentage > 0.4) {
      result.warnings.push(`High bare ground coverage (${(bareGroundPercentage * 100).toFixed(1)}%) detected`);
    }
    
    // Check standard deviation (too low might indicate artificial data)
    if (histogram.statistics.stdDev < 0.1) {
      result.warnings.push('NDVI values show unusually low variation - possible data quality issue');
    }
    
    // Overall validation
    const validChecks = Object.values(result.analysis).filter(Boolean).length;
    result.isValid = validChecks >= 2; // At least 2 out of 3 checks should pass
    
    // Calculate score for PDI
    result.score = calculateNDVIScore(result.analysis, result.anomalies.length, result.warnings.length);
    
    return result;
  } catch (error) {
    return {
      isValid: false,
      histogram: null,
      expectations: null,
      anomalies: [`NDVI validation error: ${error.message}`],
      warnings: [],
      score: 0,
      analysis: {
        meanWithinRange: false,
        vegetationCoverageOK: false,
        distributionNormal: false
      }
    };
  }
}

/**
 * Calculate NDVI validation score for PDI
 * @param {Object} analysis - Analysis results
 * @param {number} anomalyCount - Number of anomalies detected
 * @param {number} warningCount - Number of warnings
 * @returns {number} Score between 0 and 1
 */
function calculateNDVIScore(analysis, anomalyCount, warningCount) {
  let score = 0;
  
  // Base score for each passed analysis
  if (analysis.meanWithinRange) score += 0.4;
  if (analysis.vegetationCoverageOK) score += 0.4;
  if (analysis.distributionNormal) score += 0.2;
  
  // Penalty for anomalies
  score -= anomalyCount * 0.1;
  
  // Minor penalty for warnings
  score -= warningCount * 0.05;
  
  return Math.max(0, Math.min(1, score));
}

/**
 * Generate NDVI validation report
 * @param {Object} validationResult - Result from validateNDVIData
 * @returns {string} Human-readable report
 */
export function generateNDVIReport(validationResult) {
  if (!validationResult) {
    return 'NDVI validation failed - no data available';
  }
  
  let report = `NDVI Validation Report\n`;
  report += `========================\n\n`;
  
  if (validationResult.histogram) {
    const stats = validationResult.histogram.statistics;
    report += `Statistics:\n`;
    report += `- Mean NDVI: ${stats.mean.toFixed(3)}\n`;
    report += `- Range: ${stats.min.toFixed(3)} to ${stats.max.toFixed(3)}\n`;
    report += `- Standard Deviation: ${stats.stdDev.toFixed(3)}\n`;
    report += `- Valid Pixels: ${stats.validPixels}\n\n`;
    
    const health = validationResult.histogram.healthCategories;
    const total = stats.validPixels;
    report += `Vegetation Health Distribution:\n`;
    report += `- Water/Shadow: ${(health.water/total*100).toFixed(1)}%\n`;
    report += `- Bare Ground: ${(health.bareGround/total*100).toFixed(1)}%\n`;
    report += `- Sparse Vegetation: ${(health.sparseVeg/total*100).toFixed(1)}%\n`;
    report += `- Moderate Vegetation: ${(health.moderateVeg/total*100).toFixed(1)}%\n`;
    report += `- Dense Vegetation: ${(health.denseVeg/total*100).toFixed(1)}%\n\n`;
  }
  
  report += `Validation Status: ${validationResult.isValid ? 'PASSED' : 'FAILED'}\n`;
  report += `Score: ${(validationResult.score * 100).toFixed(1)}%\n\n`;
  
  if (validationResult.anomalies.length > 0) {
    report += `Anomalies Detected:\n`;
    validationResult.anomalies.forEach(anomaly => {
      report += `- ${anomaly}\n`;
    });
    report += `\n`;
  }
  
  if (validationResult.warnings.length > 0) {
    report += `Warnings:\n`;
    validationResult.warnings.forEach(warning => {
      report += `- ${warning}\n`;
    });
  }
  
  return report;
}