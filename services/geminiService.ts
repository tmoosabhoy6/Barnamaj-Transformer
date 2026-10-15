import { GoogleGenAI, Type } from "@google/genai";
import { TransformedData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are a highly specialized data processing engine for the Karbala Daily Barnamaj system. 
Your task is to take raw, messy text pasted from an ERP website table and transform it into a strict JSON structure based on specific business logic.

**Core Logic & Rules:**

1.  **Group Name Formatting (MANDATORY - Mapped to 'tourId' field):**
    *   **"FH" Rule:** Any group name containing "Faiz E Husaini", "Fayz E Husayni", "Faize Husaini", "Faiz E Husainy" MUST be converted to "FH" followed by their location.
        *   "Faiz E Husaini UAE Travels LLC" -> "FH UAE"
        *   "Faize Husaini Trust Tanzania" -> "FH TANZANIA"
        *   "Fayz E Husayni Trust Mumbai" -> "FH MUMBAI"
        *   "Faiz E Husainy Kenya" -> "FH KENYA"
        *   "Faize Husaini Kuwait" -> "FH KUWAIT"
    *   **"Al" Rule:** If a name starts with "Al " (case-insensitive), keep the first **two** words.
        *   "Al Anwar Tours" -> "Al Anwar"
        *   "Al Husain Travels" -> "Al Husain"
    *   **Default Rule:** For all other names, keep **ONLY the first word**.
        *   "Shahi International Tours" -> "Shahi"
        *   "Golden Tour" -> "Golden"
        *   "Maimoon Tour And Travels" -> "Maimoon"
        *   "Zavvare Panjetan Travels" -> "Zavvare"
        *   "Almas International" -> "Almas"
    *   **Consolidation:** When consolidating flights, join these formatted names with "/".

2.  **Tour Codes Extraction (Mapped to 'tourCodes' field):**
    *   Extract the numeric ID from the Tour ID column (usually looks like "NKERP/TOUR/2025/7536").
    *   **Rule:** Remove the prefix (e.g. "NKERP/TOUR/2025/") and keep ONLY the final ID part (e.g. "7536").
    *   **Consolidation:** Join these IDs with "/" separator (e.g. "7536/7537").

3.  **Consolidation (Arrivals & Departures):**
    *   Consolidate rows based on **Flight Code**.
    *   **Pax:** Sum "No. Of Pax".
    *   **Time:** Use the time if identical; otherwise "Please check exact flight times online".
    *   **Time Formatting (CRITICAL):** MUST return ONLY the time in "HH:MM AM/PM" format. REMOVE any dates from the time string.
    *   **NA Flight Rule:** If the Flight Code is "NA" (does not exist), you MUST set the time value to " NA" (space then NA).
    *   **Route:** "Baghdad Airport"->"BA", "Najaf Airport"->"NA". **EXCLUDE Saffron Airport entries entirely.**
    *   **Transport:** For Arrivals/Departures, include rows even if Transport is "No".

4.  **Subvenue Transfers:**
    *   **karbalaToNajaf:** Sum "No. Of Pax" for rows where Route is "KARBALA-NAJAF" AND Transport is "Yes".
    *   **najafToKarbala:** Sum "No. Of Pax" for rows where Route is "NAJAF-KARBALA" AND Transport is "Yes".
    *   **CRITICAL EXCLUSION:** Any Subvenue row that is marked as "No" under the transport column MUST BE EXCLUDED from the final pax counts. Strictly enforce this.

5.  **Date Extraction:**
    *   Extract the primary date found in the flight rows (e.g., "05-12-2025").

**Output Schema:**
Return a JSON object adhering to this structure.
`;

export const processERPData = async (rawData: string): Promise<TransformedData> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: `Here is the raw ERP data:\n\n${rawData}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            processingDate: { type: Type.STRING, description: "The main date of operations found in data" },
            arrivals: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  tourCodes: { type: Type.STRING, description: "Consolidated Tour IDs like 7536/7537" },
                  tourId: { type: Type.STRING, description: "Formatted Group Names like FH UAE/Al Anwar" },
                  pax: { type: Type.INTEGER },
                  route: { type: Type.STRING },
                  flight: { type: Type.STRING },
                  time: { type: Type.STRING },
                }
              }
            },
            departures: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  tourCodes: { type: Type.STRING },
                  tourId: { type: Type.STRING },
                  pax: { type: Type.INTEGER },
                  route: { type: Type.STRING },
                  flight: { type: Type.STRING },
                  time: { type: Type.STRING },
                }
              }
            },
            subvenue: {
              type: Type.OBJECT,
              properties: {
                karbalaToNajaf: { type: Type.INTEGER },
                najafToKarbala: { type: Type.INTEGER },
              }
            }
          }
        }
      }
    });

    if (!response.text) {
      throw new Error("No response from AI");
    }

    const rawResult = JSON.parse(response.text);
    
    // Validate and sanitize data to ensure no undefined values bubble up to UI
    const data: TransformedData = {
      processingDate: rawResult.processingDate || "Unknown Date",
      arrivals: Array.isArray(rawResult.arrivals) ? rawResult.arrivals : [],
      departures: Array.isArray(rawResult.departures) ? rawResult.departures : [],
      subvenue: rawResult.subvenue || { karbalaToNajaf: 0, najafToKarbala: 0 }
    };

    return data;
  } catch (error) {
    console.error("Error processing data with Gemini:", error);
    throw error;
  }
};

const RESOLVE_WEBHOOK_URL = "https://n8n.srv1180208.hstgr.cloud/webhook/c66bf48a-86c3-418e-8eda-0bd434eeee65";

// Helper to strictly format time to "HH:MM AM/PM"
const formatToTableTime = (raw: string): string | null => {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  
  // If it's explicitly a "Check" or error message, fail early
  if (trimmed.toLowerCase().includes('check') || trimmed.toLowerCase().includes('error')) return null;

  // Try regex for pure time strings first (e.g., 14:30, 2:30 PM) to avoid timezone/date parsing issues
  const timeMatch = trimmed.match(/^(\d{1,2})[:.](\d{2})(?:\s*(AM|PM))?$/i);
  if (timeMatch) {
    let h = parseInt(timeMatch[1]);
    const m = parseInt(timeMatch[2]);
    const ampm = timeMatch[3]?.toUpperCase();

    if (ampm === 'PM' && h < 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    
    // Construct date in local time to use toLocaleTimeString
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  // Fallback to standard Date parsing (handles ISO strings)
  const date = new Date(trimmed);
  if (!isNaN(date.getTime())) {
     return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  // Final Fallback: append dummy date
  const d2 = new Date(`2000-01-01 ${trimmed}`);
  if (!isNaN(d2.getTime())) {
      return d2.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  return null;
};

export const resolveFlightTimes = async (
  requests: { flight: string, type: 'arrival' | 'departure' }[],
  date: string
): Promise<Record<string, string>> => {
  try {
    const response = await fetch(RESOLVE_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        date,
        flights: requests
      })
    });

    if (!response.ok) {
      console.error("Webhook resolution failed", response.statusText);
      return {};
    }

    let result = await response.json();
    
    // Check if the result is a double-encoded JSON string and parse it if necessary
    if (typeof result === 'string') {
        try {
            result = JSON.parse(result);
        } catch (e) {
            console.error("Error parsing double-encoded JSON:", e);
        }
    }

    const formattedResult: Record<string, string> = {};

    console.log("Raw Webhook Response:", JSON.stringify(result));

    // Helper to add to result map with normalization
    const addToResult = (key: string, value: string) => {
        const formattedTime = formatToTableTime(value);
        if (formattedTime) {
            const trimmedKey = key.trim();
            formattedResult[trimmedKey] = formattedTime;
            // Robust matching: allow looking up by code without spaces (e.g. "G9 371" -> "G9371")
            formattedResult[trimmedKey.replace(/\s+/g, '')] = formattedTime;
        }
    };

    const processItem = (item: any) => {
        if (!item || typeof item !== 'object') return;

        // Pattern 1: { results: [ ... ] } - This matches your specific log structure
        if (Array.isArray(item.results)) {
             item.results.forEach((resItem: any) => {
                const flightVal = resItem?.flight;
                let flightNum = null;

                // Handle string flight ("FZ221") OR object flight ({"number": "G9 371"})
                if (typeof flightVal === 'string') {
                    flightNum = flightVal;
                } else if (flightVal && typeof flightVal === 'object') {
                    flightNum = flightVal.number || flightVal.code;
                }

                const timeVal = resItem?.time;
                
                if (flightNum && timeVal) {
                    addToResult(String(flightNum), String(timeVal));
                }
             });
             return; 
        }

        // Pattern 2: Flat object { flight: "...", time: "..." } or { flight: { number: "..." }, time: "..." }
        const flightKey = Object.keys(item).find(k => k.toLowerCase().includes('flight') || k.toLowerCase() === 'code');
        const timeKey = Object.keys(item).find(k => k.toLowerCase().includes('time'));

        if (flightKey && timeKey) {
            let fCode = item[flightKey];
            // If flight is an object, look inside it
            if (fCode && typeof fCode === 'object') {
                 fCode = fCode.number || fCode.code;
            }
            
            const fTime = item[timeKey];
            if (fCode && fTime) {
                addToResult(String(fCode), String(fTime));
            }
        }
    };

    if (Array.isArray(result)) {
        result.forEach(processItem);
    } else {
        processItem(result);
    }
    
    return formattedResult;
  } catch (error) {
    console.error("Error resolving times via webhook:", error);
    return {};
  }
};