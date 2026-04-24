import {
  brainlight,
  cardiogram,
  chatbot,
  fahrenheit,
  heartlight,
  hypertension,
  kidneylight,
  liverlight,
  lungs,
  lungslight,
  novideo,
  oxygenvitals,
} from "@/src/assets/images/admin/Livedata";
import Image from "next/image";
import { useSelector } from "react-redux";
import { useEffect, useState, useRef, useCallback } from "react";
import KBVitals from "@/src/utils/Socket/KBVitals";
import vitalSocketService from "@/src/utils/Socket/VitalSocket";
import { CODEBLUE_VITALS } from "@/src/constants/configs/apiConfig";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
} from "recharts";
import SpeedometerDemo from "../../common/SpeedometerDemo";

interface ChildProps {
  ambRegNo: string | undefined;
  cameraTopic: string | undefined;
}

interface VitalsDataProps {
  ambulanceRegisterNo: string | null;
}

interface Vital {
  time: string;
  systolic: number;
  diastolic: number;
  heartRate: number;
  spo2: number;
  respiratoryRate: number;
  skinTemp: number;
  hrv: number;
}

interface DashboardVitals {
  bloodPressure: {
    sys: number;
    dia: number;
    unit: string;
  };
  heartRate: {
    value: number;
    unit: string;
  };
  respiratoryRate: {
    value: number;
    unit: string;
  };
  spo2: {
    value: number;
    unit: string;
  };
  temperature: {
    value: number;
    unit: string;
  };
}

interface WaveformData {
  waveform: {
    channel: number;
    dataPoints: number[];
    sampleRate: number;
    waveformName: string;
  };
  patientMrn: string;
}

export default function VitalsData({ ambRegNo, cameraTopic }: ChildProps) {
  const [data, setData] = useState<Vital[]>([]);
  const [loading, setLoading] = useState(true);
  const [dashboardVitals, setDashboardVitals] =
    useState<DashboardVitals | null>(null);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pendingSamplesRef = useRef<number[]>([]); 
  const prevYRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const fetchVitalsData = useCallback(async () => {
    setLoading(true);
    try {
      const authToken = sessionStorage.getItem("authToken");
      const response = await fetch(
        `${CODEBLUE_VITALS}vitals/recentData?ambulance_register_no=${ambRegNo}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      );
      const result = await response.json();

      if (result.success) {
        const vitalsData = result.data.vitals.map((vital: any) => ({
          formatted_time: vital.formatted_time,
          systolic_bp: vital.systolic_bp,
          diastolic_bp: vital.diastolic_bp,
          heart_rate: vital.heart_rate,
          spo2: vital.spo2,
          respiratory_rate: vital.respiratory_rate,
          temperature: vital.temperature,
          heart_rate_variability: vital.heart_rate_variability,
        }));
        setData(vitalsData);
      }
    } catch (error) {
      console.error("Error fetching vitals data:", error);
    } finally {
      setLoading(false);
    }
  }, [ambRegNo]);

  const handleKBSocketData = (newData: Vital[]) => {
    // console.log("rr", newData);

    setData((prevData: any) => {
      const newKBArray = [...prevData, newData];
      // // console.log(newKBArray);
      return newKBArray.slice(1);
    });
  };

  // Handle dashboard vitals from WebSocket
  const handleDashboardVitals = (vitalsData: any) => {
    // console.log("Dashboard Vitals received:", vitalsData);
    
    const vitalsArray = vitalsData?.data?.vitals || vitalsData?.vitals;
    
    if (!vitalsArray || !Array.isArray(vitalsArray)) {
      if (vitalsData?.dashboardVitals) {
        setDashboardVitals(vitalsData.dashboardVitals);
      }
      return;
    }

    // Helper to find parameter by parameterId or parameterName
    const findParam = (idOrNames: (number | string)[]) => {
      return vitalsArray.find((v: any) => 
        idOrNames.includes(v.parameterId) || idOrNames.includes(v.parameterName)
      );
    };

    // Extract specific parameters
    const spo2 = findParam([251, "SpO2"]);                    
    const heartRate = findParam([259, "PR"]);                 
    const respiratory = findParam([258, "RR"]);               
    const temp = findParam([1051, "T1", 1052, "T2"]);         
    const bpSys = findParam([351, "NIBP-S"]);                  
    const bpDia = findParam([352, "NIBP-D"]);                  

    // Build the DashboardVitals object
    const parsed: DashboardVitals = {
      spo2: {
        value: spo2?.value ?? -1,
        unit: spo2?.unit || "%",
      },
      heartRate: {
        value: heartRate?.value ?? -1,
        unit: heartRate?.unit || "bpm",
      },
      respiratoryRate: {
        value: respiratory?.value ?? -1,
        unit: respiratory?.unit || "rpm",
      },
      temperature: {
        value: temp?.value ?? -1,
        unit: temp?.unit || "C",
      },
      bloodPressure: {
        sys: bpSys?.value ?? -1,
        dia: bpDia?.value ?? -1,
        unit: bpSys?.unit || "mmHg",
      },
    };

    setDashboardVitals(parsed);
  };

  // Handle waveform data from WebSocket
  const handleWaveformData = (waveData: any) => {
    // Supports both direct waveform payload and wrapped payload: { type, data }
    let parsedWaveData = waveData;
    if (typeof parsedWaveData === "string") {
      try {
        parsedWaveData = JSON.parse(parsedWaveData);
      } catch {
        return;
      }
    }

    const payload = parsedWaveData?.data?.waveform ? parsedWaveData.data : parsedWaveData;
    const packetType = String(parsedWaveData?.type ?? "waveform").toLowerCase();
    const waveformName = String(payload?.waveform?.waveformName ?? "").toLowerCase();
    const dataPoints = payload?.waveform?.dataPoints;

    if (
      packetType !== "waveform" ||
      waveformName !== "ecg_ii" ||
      !Array.isArray(dataPoints)
    ) {
      return;
    }

    if (dataPoints.length > 0) {
      pendingSamplesRef.current.push(...dataPoints);
      setWaveformData(dataPoints);

      const newChartData = dataPoints.map(
        (value: number, index: number) => ({
          time: index,
          value: value,
        }),
      );
      setChartData(newChartData);
    }
  };

  // Add waveform samples programmatically (can be used elsewhere)
  const addWaveformData = (samples: number[] | Float32Array) => {
    pendingSamplesRef.current.push(...Array.from(samples));
  };

  useEffect(() => {
    // Connect to vital WebSocket
    vitalSocketService.connect();

    // Listen for dashboard vitals
    vitalSocketService.on("vitals", handleDashboardVitals);

    // Listen for waveform data
    vitalSocketService.on("waveform", handleWaveformData);

    // Existing KB Vitals socket
    KBVitals.emit("join_vital_room", ambRegNo);
    KBVitals.on("vitals_data", handleKBSocketData);

    return () => {
      vitalSocketService.off("vitals", handleDashboardVitals);
      vitalSocketService.off("waveform", handleWaveformData);
      KBVitals.removeListener("vitals_data");
    };
  }, [ambRegNo]);

  // Canvas animation loop for ECG waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const c: HTMLCanvasElement = canvas;
    const cx: CanvasRenderingContext2D = ctx;

    const w = 600;
    const h = 180;
    c.width = w;
    c.height = h;
    cx.fillStyle = "#ffffff";
    cx.fillRect(0, 0, w, h);
    cx.imageSmoothingEnabled = false;
    prevYRef.current = null;

    const SAMPLE_RATE = 256;
    const DISPLAY_SECONDS = 4;

    const SCALE_WINDOW = SAMPLE_RATE * DISPLAY_SECONDS * 2;
    let runMin = Infinity;
    let runMax = -Infinity;
    const scaleHistory: number[] = [];

    const updateScale = (sample: number) => {
      scaleHistory.push(sample);
      if (scaleHistory.length > SCALE_WINDOW) {
        scaleHistory.shift();
      }
      runMin = Math.min(...scaleHistory);
      runMax = Math.max(...scaleHistory);
    };

    const PADDING = 0.08;
    const sampleToY = (sample: number, h: number): number => {
      const range = runMax - runMin || 1;
      const norm = (sample - runMin) / range;
      const padded = PADDING + norm * (1 - 2 * PADDING);
      return h * (1 - padded);
    };

    let lastTime: number | null = null;
    let fractionalPx = 0;

    const drawFrame = (now: number) => {
      const midY = h / 2;

      if (lastTime === null) lastTime = now;
      const deltaMs = now - lastTime;
      lastTime = now;

      const pixelsPerMs = w / (DISPLAY_SECONDS * 1000);
      fractionalPx += deltaMs * pixelsPerMs;
      const advancePx = Math.floor(fractionalPx);
      fractionalPx -= advancePx;

      if (advancePx <= 0) {
        rafRef.current = requestAnimationFrame(drawFrame);
        return;
      }

      cx.drawImage(c, 0, 0, w, h, -advancePx, 0, w, h);

      cx.fillStyle = "#ffffff";
      cx.fillRect(w - advancePx - 1, 0, advancePx + 2, h);

      // Draw grid lines in the cleared area
      cx.strokeStyle = "#1cff23";
      cx.lineWidth = 0.3;

      const stripLeft = w - advancePx;
      const gridSpacingX = 100;
      const gridSpacingY = 30;

      // Vertical grid lines
      const firstGridX = Math.ceil(stripLeft / gridSpacingX) * gridSpacingX;
      for (let x = firstGridX; x < w; x += gridSpacingX) {
        cx.beginPath();
        cx.moveTo(x, 0);
        cx.lineTo(x, h);
        cx.stroke();
      }

      // Horizontal grid lines
      for (let y = 0; y < h; y += gridSpacingY) {
        cx.beginPath();
        cx.moveTo(stripLeft, y);
        cx.lineTo(w, y);
        cx.stroke();
      }

      const samplesNeeded = advancePx;
      const pending = pendingSamplesRef.current;

      cx.beginPath();
      cx.strokeStyle = "#ff0000";
      cx.lineWidth = 1.5;

      let firstPoint = true;

      for (let col = 0; col < samplesNeeded; col++) {
        const x = stripLeft + col;

        let sample: number;
        if (pending.length > 0) {
          sample = pending.shift()!;
          updateScale(sample);
        } else {
          sample = runMin !== Infinity ? (runMin + runMax) / 2 : 0;
        }

        const y =
          runMin === Infinity
            ? midY
            : sampleToY(sample, h);

        if (firstPoint) {
          cx.moveTo(stripLeft - 1, prevYRef.current ?? midY);
          firstPoint = false;
        }
        cx.lineTo(x, y);
        prevYRef.current = y;
      }

      cx.stroke();

      rafRef.current = requestAnimationFrame(drawFrame);
    };

    rafRef.current = requestAnimationFrame(drawFrame);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const [storedCameraTopic, setStoredCameraTopic] = useState<string | null>(
    null,
  );
  useEffect(() => {
    if (cameraTopic) {
      setStoredCameraTopic(cameraTopic);
      setLoading(false);
    }
  }, [cameraTopic]);

  useEffect(() => {
    if (ambRegNo) {
      fetchVitalsData();
    }
  }, [ambRegNo, fetchVitalsData]);

  const sanitize = (val: number | string | undefined | null): string => {
    const n = parseFloat(String(val ?? "-1"));
    if (isNaN(n) || n === -1) return "0";
    return String(val);
  };

  return (
    <div className="flex flex-col gap-3 w-full pb-10">
      {/* Vitals cards*/}
      <div className="w-full h-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4 lg:gap-6">
        {/* SPO2 Card */}
        <div className="w-full bg-gradient-to-br from-[#6B95A4] to-[#4A7686] rounded-xl shadow-md p-4 flex flex-col justify-center relative overflow-hidden min-h-[120px]">
          {/* Icon */}
          <div className="absolute top-2 right-2 opacity-90">
            <Image
              src={oxygenvitals.src}
              alt="SPO2"
              width={56}
              height={56}
              className="w-12 h-12 md:w-14 md:h-14"
            />
          </div>

          {/* Content */}
          <div className="flex flex-col gap-1 md:gap-2 mt-4 md:mt-6">
            <p className="text-white/80 text-xs md:text-sm font-semibold tracking-wider uppercase">
              Oxygen Level
            </p>

            <p className="text-white font-bold text-2xl md:text-3xl lg:text-4xl tracking-wide leading-none">
              {dashboardVitals?.spo2?.value
                ? sanitize(dashboardVitals.spo2.value)
                : (data as any).length > 0
                  ? sanitize((data as any)[(data as any).length - 1].spo2)
                  : "0"}
              <span className="text-lg md:text-xl lg:text-2xl ml-1 font-semibold">
                %
              </span>
            </p>
          </div>
        </div>

        {/* Heart Rate Card */}
        <div className="w-full bg-[#E8A0AB] rounded-xl shadow-md p-4 flex flex-col justify-center relative overflow-hidden min-h-[120px]">
          <div className="absolute top-2 right-2 opacity-90">
            <Image
              src={cardiogram.src}
              alt="Heart Rate"
              width={64}
              height={64}
              className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16"
            />
          </div>
          <div className="mt-4 md:mt-6">
            <p className="text-white/80 text-xs md:text-sm font-semibold tracking-wider uppercase">
              Heart Rate
            </p>
            <p className="text-white font-bold text-2xl md:text-3xl lg:text-4xl tracking-wide leading-none">
              {dashboardVitals?.heartRate?.value
                ? sanitize(dashboardVitals.heartRate.value)
                : (data as any).length > 0
                  ? sanitize((data as any)[(data as any).length - 1].heart_rate)
                  : "0"}
              <span className="text-sm md:text-base ml-1">bpm</span>
            </p>
          </div>
        </div>

        {/* Respiratory Rate Card */}
        <div className="w-full bg-[#4D644599] rounded-xl shadow-md p-4 flex flex-col justify-center relative overflow-hidden min-h-[120px]">
          <div className="absolute top-2 right-2 opacity-90">
            <Image
              src={lungs.src}
              alt="Respiratory"
              width={64}
              height={64}
              className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16"
            />
          </div>
          <div className="mt-4 md:mt-6">
            <p className="text-white/80 text-xs md:text-sm font-semibold tracking-wider uppercase">
              Respiratory Rate
            </p>
            <p className="text-white font-bold text-2xl md:text-3xl lg:text-4xl tracking-wide leading-none">
              {dashboardVitals?.respiratoryRate?.value
                ? sanitize(dashboardVitals.respiratoryRate.value)
                : (data as any).length > 0
                  ? sanitize((data as any)[(data as any).length - 1].respiratory_rate)
                  : "0"}{" "}
              <span className="text-sm md:text-base">
                {dashboardVitals?.respiratoryRate?.unit || "bpm"}
              </span>
            </p>
          </div>
        </div>

        {/* Temperature Card */}
        <div className="w-full bg-[#125D95B2] rounded-xl shadow-md p-4 flex flex-col justify-center relative overflow-hidden min-h-[120px]">
          <div className="absolute top-2 right-2 opacity-90">
            <Image
              src={fahrenheit.src}
              alt="Temperature"
              width={64}
              height={64}
              className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16"
            />
          </div>
          <div className="mt-4 md:mt-6">
            <p className="text-white/80 text-xs md:text-sm font-semibold tracking-wider uppercase">
              Temperature
            </p>
            <p className="text-white font-bold text-2xl md:text-3xl lg:text-4xl tracking-wide leading-none">
              {dashboardVitals?.temperature?.value !== undefined &&
              dashboardVitals?.temperature?.value !== null &&
              dashboardVitals?.temperature?.value !== -1
                ? dashboardVitals.temperature.unit === "C"
                  ? `${((dashboardVitals.temperature.value * 9) / 5 + 32).toFixed(2)}`
                  : `${dashboardVitals.temperature.value.toFixed(2)}`
                : (data as any)?.length > 0 &&
                    parseFloat(
                      (data as any)[(data as any).length - 1].temperature,
                    ) !== -1
                  ? `${parseFloat(
                      (data as any)[(data as any).length - 1].temperature,
                    ).toFixed(2)}`
                  : "0.00"}
              <span className="text-sm md:text-base ml-1">°F</span>
            </p>
          </div>
        </div>

        {/* Blood Pressure Card */}
        <div className="w-full bg-[#B3BE3C] rounded-xl shadow-md p-4 flex flex-col justify-center relative overflow-hidden min-h-[120px]">
          <div className="absolute top-2 right-2 opacity-90">
            <Image
              src={hypertension.src}
              alt="Blood Pressure"
              width={64}
              height={64}
              className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16"
            />
          </div>
          <div className="mt-4 md:mt-6">
            <div className="flex flex-col gap-1">
              <p className="text-white/80 text-xs md:text-sm font-semibold tracking-wider uppercase">
                Blood Pressure
              </p>
            </div>
            <p className="text-white font-bold text-xl md:text-2xl lg:text-3xl tracking-wide leading-none">
              {dashboardVitals?.bloodPressure
                ? `${sanitize(dashboardVitals.bloodPressure.sys)}/${sanitize(dashboardVitals.bloodPressure.dia)}`
                : data && data.length > 0
                  ? `${sanitize((data as any)[data.length - 1].systolic_bp)}/${sanitize((data as any)[data.length - 1].diastolic_bp)}`
                  : "0/0"}{" "}
              <span className="text-sm md:text-base">mmHg</span>
            </p>
          </div>
        </div>
      </div>

      {/* Camera and Charts Section - Responsive */}
      <div className="flex flex-col lg:flex-row h-auto lg:h-[95%] w-full gap-3 md:gap-4">
        {/* Camera Feed */}
        <div className="w-full lg:w-[55%] bg-black rounded-lg overflow-hidden">
          <div className="w-full h-[300px] md:h-[400px] lg:h-full flex flex-col">
            <div className="relative h-full w-full bg-gray-700">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="text-white">Loading...</div>
                </div>
              ) : storedCameraTopic ? (
                <iframe
                  src={`${storedCameraTopic}`}
                  className="absolute top-0 left-0 w-full h-full"
                  allowFullScreen
                ></iframe>
              ) : (
                <div className="text-white flex flex-col justify-center items-center h-full gap-2">
                  <span>
                    <Image
                      src={novideo.src}
                      alt="No video"
                      width={40}
                      height={40}
                      className="w-10 h-10"
                    />
                  </span>
                  <p>No camera topic available.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Charts and Critical Warning Section */}
        <div className="w-full lg:w-[45%] min-w-0 flex flex-col gap-3">
          {/* Waveform/HRV Chart */}
          <div className="bg-white rounded-lg shadow-md p-3 md:p-4">
            <div className="flex flex-col justify-center items-center w-full">
              {/* <div className="w-full">
                <div className="text-black font-bold text-xl md:text-2xl flex justify-center mb-2">
                  {(data as any).length > 0
                    ? `${
                        (data as any)[(data as any).length - 1]
                          .heart_rate_variability
                      }`
                    : "-"}
                </div>
              </div> */}
              <div className="w-full min-w-0 flex justify-center items-center">
                {/* Canvas-based ECG renderer for low-latency waveform */}
                <canvas
                  id="ecgCanvas"
                  ref={canvasRef}
                  className="block rounded-md"
                  style={{ width: "100%", height: "180px", display: "block" }}
                />
              </div>
            </div>
          </div>

          {/* Critical Warning Section */}
          <div className="h-auto lg:h-[42%] bg-gradient-to-b from-[#FFFFFF] via-[#e9e0f9] to-[#e9e0f9] vitalgradient-border-box rounded-lg p-3 md:p-4">
            <div className="flex flex-col gap-2">
              <span className="capitalize text-base md:text-lg font-semibold">
                Critical Warning
              </span>
              <div className="flex flex-row gap-4 sm:gap-6 md:gap-8 lg:gap-12 justify-center items-center mt-2 md:mt-4">
                <span>
                  <Image
                    src={heartlight.src}
                    alt="Heart"
                    width={56}
                    height={56}
                    className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14"
                  />
                </span>
                <span>
                  <Image
                    src={lungslight.src}
                    alt="Lungs"
                    width={56}
                    height={56}
                    className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14"
                  />
                </span>
                <span>
                  <Image
                    src={kidneylight.src}
                    alt="Kidney"
                    width={56}
                    height={56}
                    className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14"
                  />
                </span>
                <span>
                  <Image
                    src={liverlight.src}
                    alt="Liver"
                    width={56}
                    height={56}
                    className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14"
                  />
                </span>
                <span>
                  <Image
                    src={brainlight.src}
                    alt="Brain"
                    width={56}
                    height={56}
                    className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14"
                  />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* <div className=" h-[38vh]  flex flex-row gap-3">
        <div className="w-[40%] bg-[#C9DEE20D] shadow-xl ">
          <SpeedometerDemo />
        </div>
        <div className="w-[85%] bg-white flex flex-col gap-3">
          <div className="flex justify-end pt-2 items-center gap-2">
            <div className="border border-gray-400 text-sm shadow-xl m-0 rounded-md ">
              <div className="border-[#A9CCE2] border-r-4 py-1 px-2 m-0 rounded-md">
                Your Personalized Health Assistant, Anytime, Anywhere
              </div>
            </div>
            <div className="p-1">
              <img src={chatbot.src} alt="" className="w-10 h-10" />
            </div>
          </div>
          <div className="flex justify-end pt-1 items-center gap-2">
            <div className="border border-gray-400 text-sm shadow-xl m-0 rounded-md ">
              <div className="border-[#A9CCE2] border-r-4 py-1 px-2 m-0 rounded-md">
                {`Let’s`} Start Improving Your Health!{" "}
              </div>
            </div>
            <div className="p-1">
              <img src={chatbot.src} alt="" className="w-10 h-10" />
            </div>
          </div>
          <div className="flex justify-end pt-1 items-center gap-2">
            <div className="border border-gray-400 text-sm shadow-xl m-0 rounded-md ">
              <div className="border-[#A9CCE2] border-r-4 py-1 px-2 m-0 rounded-md">
                Hiiii
              </div>
            </div>
            <div className="p-1">
              <img src={chatbot.src} alt="" className="w-10 h-10" />
            </div>
          </div>
        </div>
      </div> */}
    </div>
  );
}
