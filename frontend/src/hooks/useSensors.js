import { useState, useEffect, useCallback } from 'react';

export function useSensors() {
  const [motionData, setMotionData] = useState({ x: 0, y: 0, z: 0, maxG: 0 });
  const [speed, setSpeed] = useState(0);
  const [location, setLocation] = useState(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const startMonitoring = useCallback(async () => {
    // Request permission for iOS 13+ devices
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      try {
        const permissionState = await DeviceMotionEvent.requestPermission();
        if (permissionState === 'granted') {
          window.addEventListener('devicemotion', handleMotion);
          setIsMonitoring(true);
        } else {
          alert("Permission to access device motion was denied.");
          return;
        }
      } catch (error) {
        console.error(error);
      }
    } else {
      // Non-iOS 13+ devices
      window.addEventListener('devicemotion', handleMotion);
      setIsMonitoring(true);
    }

    // Start Geolocation tracking
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          // Speed is in meters/second. Convert to km/h.
          const speedKmh = position.coords.speed ? position.coords.speed * 3.6 : 0;
          setSpeed(speedKmh);
        },
        (error) => console.error(error),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  const stopMonitoring = useCallback(() => {
    window.removeEventListener('devicemotion', handleMotion);
    setIsMonitoring(false);
  }, []);

  const handleMotion = (event) => {
    if (event.acceleration) {
      const { x, y, z } = event.acceleration;
      // Calculate total force magnitude vector
      const magnitude = Math.sqrt((x||0)**2 + (y||0)**2 + (z||0)**2);
      
      // Convert to G-force approximation (1G ~= 9.8 m/s^2)
      const gForce = magnitude / 9.8;
      
      setMotionData(prev => ({
        x: x || 0,
        y: y || 0,
        z: z || 0,
        maxG: Math.max(prev.maxG, gForce)
      }));
    }
  };

  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

  return { startMonitoring, stopMonitoring, isMonitoring, motionData, speed, location };
}
