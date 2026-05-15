import { useState, useEffect, useCallback, useRef } from 'react';

export function useSensors() {
  const [motionData, setMotionData] = useState({ x: 0, y: 0, z: 0, maxG: 0, currentG: 0 });
  const [speed, setSpeed] = useState(0);
  const [location, setLocation] = useState(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [orientation, setOrientation] = useState({ alpha: 0, beta: 0, gamma: 0 });
  
  // Settings (could be passed as props later)
  const impactThreshold = 4.0; // G
  const speedThreshold = 5; // km/h (Lowered for testing as requested)
  
  // History refs to avoid re-renders
  const speedHistory = useRef([]); // stores { speed, time }
  const orientationHistory = useRef([]); // stores { angles, time }
  const lastImpactTime = useRef(0);

  const startMonitoring = useCallback(async () => {
    // Request permission for iOS 13+ devices
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      try {
        const permissionState = await DeviceMotionEvent.requestPermission();
        if (permissionState === 'granted') {
          window.addEventListener('devicemotion', handleMotion);
          window.addEventListener('deviceorientation', handleOrientation);
          setIsMonitoring(true);
        } else {
          alert("Permission to access device motion/orientation was denied.");
          return;
        }
      } catch (error) {
        console.error(error);
      }
    } else {
      window.addEventListener('devicemotion', handleMotion);
      window.addEventListener('deviceorientation', handleOrientation);
      setIsMonitoring(true);
    }

    // Start Geolocation tracking
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (position) => {
          const currentSpeed = position.coords.speed ? position.coords.speed * 3.6 : 0;
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setSpeed(currentSpeed);
          
          // Update speed history (keep last 5 seconds)
          const now = Date.now();
          speedHistory.current.push({ speed: currentSpeed, time: now });
          speedHistory.current = speedHistory.current.filter(item => now - item.time < 5000);
        },
        (error) => console.error(error),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  const stopMonitoring = useCallback(() => {
    window.removeEventListener('devicemotion', handleMotion);
    window.removeEventListener('deviceorientation', handleOrientation);
    setIsMonitoring(false);
  }, []);

  const handleMotion = (event) => {
    if (event.acceleration) {
      const { x, y, z } = event.acceleration;
      const magnitude = Math.sqrt((x||0)**2 + (y||0)**2 + (z||0)**2);
      const gForce = magnitude / 9.8;
      
      setMotionData(prev => ({
        x: x || 0,
        y: y || 0,
        z: z || 0,
        currentG: gForce,
        maxG: Math.max(prev.maxG, gForce)
      }));

      // Potential impact detected
      if (gForce > impactThreshold) {
        lastImpactTime.current = Date.now();
      }
    }
  };

  const handleOrientation = (event) => {
    const { alpha, beta, gamma } = event;
    setOrientation({ alpha, beta, gamma });
    
    // Update orientation history (keep last 2 seconds)
    const now = Date.now();
    orientationHistory.current.push({ alpha, beta, gamma, time: now });
    orientationHistory.current = orientationHistory.current.filter(item => now - item.time < 2000);
  };

  // Logic to check if an accident occurred based on all criteria
  const checkAccident = useCallback(() => {
    const now = Date.now();
    
    // 1. Check for recent impact (within last 3 seconds)
    if (now - lastImpactTime.current > 3000) return false;

    // 2. Was there any movement at all? (Avoid false positives when phone is stationary)
    const maxSpeedRecent = Math.max(...speedHistory.current.map(h => h.speed), 0);
    
    // 3. Robust detection criteria:
    // Case A: High speed impact (Significant speed drop)
    const significantSpeedDrop = maxSpeedRecent > 15 && speed < 5;
    
    // Case B: Low speed impact but high G-force (e.g. side-swipe at intersection)
    const highGForce = motionData.maxG > impactThreshold;

    // Case C: Significant orientation change during impact (Vehicle rollover)
    let significantOrientationChange = false;
    if (orientationHistory.current.length > 2) {
      const start = orientationHistory.current[0];
      const end = orientationHistory.current[orientationHistory.current.length - 1];
      const diff = Math.abs(start.beta - end.beta) + Math.abs(start.gamma - end.gamma);
      if (diff > 45) significantOrientationChange = true;
    }

    // Trigger if (Impact + Significant Speed Drop) OR (High Impact + Movement) OR (Impact + Rollover)
    if ((highGForce && significantSpeedDrop) || 
        (highGForce && maxSpeedRecent > 5) || 
        (highGForce && significantOrientationChange)) {
      return true;
    }

    return false;
  }, [speed, motionData.maxG]);

  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

  return { 
    startMonitoring, 
    stopMonitoring, 
    isMonitoring, 
    motionData, 
    speed, 
    location, 
    orientation,
    checkAccident 
  };
}
