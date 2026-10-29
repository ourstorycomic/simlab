"use client";

import { useEffect, useState, useCallback } from "react";
import { deviceSensors, SensorData } from "@/lib/deviceSensors";

export function useDeviceSensors() {
  const [sensorData, setSensorData] = useState<SensorData>(() =>
    deviceSensors.getData()
  );
  const [isMobileDevice, setIsMobileDevice] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isMobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        ) ||
        (window.matchMedia && window.matchMedia("(max-width: 768px)").matches) ||
        ("ontouchstart" in window && navigator.maxTouchPoints > 0);

      setIsMobileDevice(isMobile);
    }

    const unsubscribe = deviceSensors.subscribe((data) => {
      setSensorData(data);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const requestPermission = useCallback(async () => {
    return await deviceSensors.requestPermission();
  }, []);

  const triggerHaptic = useCallback((pattern: number | number[] = 40) => {
    deviceSensors.triggerHaptic(pattern);
  }, []);

  const simulateShake = useCallback(() => {
    deviceSensors.simulateShake();
  }, []);

  const simulatePour = useCallback((intensity: number = 0.8) => {
    deviceSensors.simulatePour(intensity);
  }, []);

  return {
    ...sensorData,
    isMobileDevice,
    requestPermission,
    triggerHaptic,
    simulateShake,
    simulatePour,
  };
}

