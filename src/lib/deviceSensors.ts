"use client";

/**
 * ─── Device Sensors & Motion Controller Hub ───
 * Module kết hợp cảm biến phần cứng Điện thoại di động (Con quay hồi chuyển + Cảm biến gia tốc)
 * và Bộ điều khiển giả lập PC để mang lại trải nghiệm tương tác chân thực như ngoài đời:
 * 
 * 1. Con quay hồi chuyển (Gyroscope / Orientation):
 *    - Nghiêng điện thoại chúc xuống (pitch > 20°) -> Tự động rót chất lỏng (Tilt to Pour)
 *    - Nghiêng điện thoại trái/phải (roll) -> Lắc đung đưa con lắc vật lý hoặc xoay camera giải phẫu Sinh học
 * 
 * 2. Cảm biến gia tốc (Accelerometer / Motion):
 *    - Lắc điện thoại (Shake Gesture) -> Lắc trộn dung dịch hóa học / truyền xung lực con lắc
 *    - Rung phản hồi xúc giác (Haptic Vibration) khi phản ứng xảy ra hoặc khi thao tác thành công
 * 
 * 3. Fallback mượt mà trên Desktop:
 *    - Hỗ trợ phím tắt và bộ kích hoạt mô phỏng cho người dùng dùng máy tính không có cảm biến
 */

export interface SensorData {
  /** Có cảm biến phần cứng thực tế đang hoạt động không */
  isSupported: boolean;
  /** Đã cấp quyền truy cập cảm biến chưa (dành cho iOS 13+ / Android Chrome) */
  permissionGranted: boolean;
  /** Độ nghiêng chúc trước/sau (-90° đến 90°): > 20° nghĩa là đang cầm dốc bình rót */
  pitch: number;
  /** Độ nghiêng nghiêng trái/phải (-90° đến 90°) */
  roll: number;
  /** Hướng xoay ngang la bàn (0° đến 360°) */
  yaw: number;
  /** Đang ở tư thế nghiêng rót chất lỏng tự nhiên (Pitch chúc xuống > 18°) */
  isPourTilted: boolean;
  /** Cường độ nghiêng rót chuẩn hóa (0.0 đến 1.0) */
  pourIntensity: number;
  /** Phát hiện vừa có cử chỉ lắc điện thoại (Shake) */
  isShaking: boolean;
  /** Cường độ gia tốc hiện tại */
  motionMagnitude: number;
  /** Thời điểm nhận dữ liệu cuối cùng */
  lastUpdated: number;
}

export type SensorListener = (data: SensorData) => void;

class DeviceSensorManager {
  private static instance: DeviceSensorManager;

  private data: SensorData = {
    isSupported: false,
    permissionGranted: false,
    pitch: 0,
    roll: 0,
    yaw: 0,
    isPourTilted: false,
    pourIntensity: 0,
    isShaking: false,
    motionMagnitude: 0,
    lastUpdated: 0,
  };

  private listeners: Set<SensorListener> = new Set();
  private isListening: boolean = false;

  // Shake detection state
  private lastX: number | null = null;
  private lastY: number | null = null;
  private lastZ: number | null = null;
  private lastShakeTime: number = 0;
  private shakeTimeout: any = null;

  private constructor() {
    if (typeof window !== "undefined") {
      this.checkSupport();
    }
  }

  public static getInstance(): DeviceSensorManager {
    if (!DeviceSensorManager.instance) {
      DeviceSensorManager.instance = new DeviceSensorManager();
    }
    return DeviceSensorManager.instance;
  }

  private checkSupport() {
    const hasOrientation = "DeviceOrientationEvent" in window;
    const hasMotion = "DeviceMotionEvent" in window;
    this.data.isSupported = hasOrientation || hasMotion;
  }

  /**
   * Yêu cầu cấp quyền cảm biến (bắt buộc trên iOS Safari 13+, tự động trên Android Chrome)
   */
  public async requestPermission(): Promise<boolean> {
    if (typeof window === "undefined") return false;

    try {
      // iOS 13+ permission request
      const DeviceOrientationEventAny = window.DeviceOrientationEvent as any;
      if (
        DeviceOrientationEventAny &&
        typeof DeviceOrientationEventAny.requestPermission === "function"
      ) {
        const response = await DeviceOrientationEventAny.requestPermission();
        if (response === "granted") {
          this.data.permissionGranted = true;
          this.startListening();
          this.triggerHaptic([30, 50]);
          return true;
        } else {
          this.data.permissionGranted = false;
          return false;
        }
      }

      // Android / Standard Browsers: không yêu cầu popup permission
      this.data.permissionGranted = true;
      this.startListening();
      this.triggerHaptic(40);
      return true;
    } catch (e) {
      console.warn("Sensor permission error:", e);
      // Fallback
      this.data.permissionGranted = true;
      this.startListening();
      return true;
    }
  }

  public startListening() {
    if (this.isListening || typeof window === "undefined") return;

    window.addEventListener("deviceorientation", this.handleOrientation, true);
    window.addEventListener("devicemotion", this.handleMotion, true);
    this.isListening = true;
    this.notify();
  }

  public stopListening() {
    if (!this.isListening || typeof window === "undefined") return;

    window.removeEventListener("deviceorientation", this.handleOrientation, true);
    window.removeEventListener("devicemotion", this.handleMotion, true);
    this.isListening = false;
  }

  private handleOrientation = (e: DeviceOrientationEvent) => {
    // beta: độ nghiêng trước-sau (-180 đến 180).
    // Ở tư thế cầm điện thoại đứng tự nhiên: beta ~ 60° đến 80°.
    // Khi dốc điện thoại chúc xuống để đổ: beta giảm xuống < 40° hoặc âm.
    const rawBeta = e.beta ?? 0;
    const rawGamma = e.gamma ?? 0;
    const rawAlpha = e.alpha ?? 0;

    // Chuẩn hóa góc nghiêng rót (Pitch tilt)
    // Coi góc 65° là tư thế cầm thẳng đứng bình thường
    // Càng chúc đầu điện thoại xuống thì độ dốc rót càng tăng
    const pourAngleDelta = 65 - rawBeta; 
    const isPourTilted = pourAngleDelta > 18; // Chúc xuống hơn 18° là bắt đầu rót
    const pourIntensity = isPourTilted
      ? Math.min(1.0, Math.max(0.0, (pourAngleDelta - 18) / 35))
      : 0;

    this.data.pitch = Math.round(rawBeta * 10) / 10;
    this.data.roll = Math.round(rawGamma * 10) / 10;
    this.data.yaw = Math.round(rawAlpha * 10) / 10;
    this.data.isPourTilted = isPourTilted;
    this.data.pourIntensity = pourIntensity;
    this.data.lastUpdated = Date.now();

    this.notify();
  };

  private handleMotion = (e: DeviceMotionEvent) => {
    const acc = e.accelerationIncludingGravity || e.acceleration;
    if (!acc || acc.x === null || acc.y === null || acc.z === null) return;

    const x = acc.x;
    const y = acc.y;
    const z = acc.z;

    const magnitude = Math.sqrt(x * x + y * y + z * z);
    this.data.motionMagnitude = Math.round(magnitude * 10) / 10;

    if (this.lastX !== null && this.lastY !== null && this.lastZ !== null) {
      const deltaX = Math.abs(x - this.lastX);
      const deltaY = Math.abs(y - this.lastY);
      const deltaZ = Math.abs(z - this.lastZ);

      const delta = deltaX + deltaY + deltaZ;
      const now = Date.now();

      // Ngưỡng lắc (Shake Threshold): delta > 16m/s² và cách lần lắc trước > 400ms
      if (delta > 16 && now - this.lastShakeTime > 400) {
        this.lastShakeTime = now;
        this.data.isShaking = true;
        this.triggerHaptic([40, 60, 40]);

        if (this.shakeTimeout) clearTimeout(this.shakeTimeout);
        this.shakeTimeout = setTimeout(() => {
          this.data.isShaking = false;
          this.notify();
        }, 600);
      }
    }

    this.lastX = x;
    this.lastY = y;
    this.lastZ = z;
    this.data.lastUpdated = Date.now();
    this.notify();
  };

  /**
   * Kích hoạt rung phản hồi xúc giác Haptic (hỗ trợ Android Chrome, PWA)
   */
  public triggerHaptic(pattern: number | number[] = 40) {
    if (typeof window !== "undefined" && "navigator" in window && "vibrate" in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        // Safe ignore on unsupported devices
      }
    }
  }

  /**
   * Giả lập cử chỉ lắc trên máy tính (Desktop Simulator)
   */
  public simulateShake() {
    this.data.isShaking = true;
    this.triggerHaptic([50, 70, 50]);
    this.notify();

    if (this.shakeTimeout) clearTimeout(this.shakeTimeout);
    this.shakeTimeout = setTimeout(() => {
      this.data.isShaking = false;
      this.notify();
    }, 600);
  }

  /**
   * Giả lập góc nghiêng rót trên máy tính (Desktop Simulator)
   */
  public simulatePour(intensity: number = 0.8) {
    this.data.isPourTilted = intensity > 0;
    this.data.pourIntensity = intensity;
    this.data.pitch = 30; // Chúc đầu xuống
    this.notify();
  }

  /**
   * Cập nhật trực tiếp dữ liệu cảm biến nhận được từ Điện thoại từ xa (Remote Controller)
   */
  public updateRemoteData(remote: {
    pitch?: number;
    roll?: number;
    yaw?: number;
    isPourTilted?: boolean;
    pourIntensity?: number;
    isShaking?: boolean;
  }) {
    if (remote.pitch !== undefined) this.data.pitch = remote.pitch;
    if (remote.roll !== undefined) this.data.roll = remote.roll;
    if (remote.yaw !== undefined) this.data.yaw = remote.yaw;
    if (remote.isPourTilted !== undefined) this.data.isPourTilted = remote.isPourTilted;
    if (remote.pourIntensity !== undefined) this.data.pourIntensity = remote.pourIntensity;
    if (remote.isShaking !== undefined && remote.isShaking) {
      this.data.isShaking = true;
      if (this.shakeTimeout) clearTimeout(this.shakeTimeout);
      this.shakeTimeout = setTimeout(() => {
        this.data.isShaking = false;
        this.notify();
      }, 700);
    }
    this.data.lastUpdated = Date.now();
    this.notify();
  }

  public subscribe(listener: SensorListener): () => void {
    this.listeners.add(listener);
    // Tự động kích hoạt lắng nghe khi có component đầu tiên đăng ký
    if (this.listeners.size === 1 && !this.isListening) {
      this.startListening();
    }
    listener(this.getData());

    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) {
        this.stopListening();
      }
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.getData()));
  }

  public getData(): SensorData {
    return { ...this.data };
  }
}

export const deviceSensors = DeviceSensorManager.getInstance();

