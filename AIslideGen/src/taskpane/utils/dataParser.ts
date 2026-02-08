import * as XLSX from "xlsx";
import Papa from "papaparse";

export interface ParsedData {
  fileName: string;
  headers: string[];
  rows: any[][];
  columnTypes: ("number" | "string" | "date")[];
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_ROWS = 1000; // Limit rows for performance

/**
 * Check if file is a supported data file
 */
export function isSupportedDataFile(file: File): boolean {
  const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
  return [".xlsx", ".xls", ".csv"].includes(ext);
}

/**
 * Parse XLSX or CSV file into structured data
 */
export async function parseDataFile(file: File): Promise<ParsedData> {
  if (!isSupportedDataFile(file)) {
    throw new Error("Unsupported file type. Please upload .xlsx, .xls, or .csv files.");
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("File is too large. Please upload a file under 10 MB.");
  }

  const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));

  let parsedData: ParsedData;

  if (ext === ".csv") {
    parsedData = await parseCSV(file);
  } else {
    parsedData = await parseXLSX(file);
  }

  // Limit rows for performance
  if (parsedData.rows.length > MAX_ROWS) {
    parsedData.rows = parsedData.rows.slice(0, MAX_ROWS);
  }

  return parsedData;
}

/**
 * Parse CSV file using PapaParse
 */
async function parseCSV(file: File): Promise<ParsedData> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      complete: (results) => {
        try {
          const data = results.data as any[][];

          if (!data || data.length === 0) {
            reject(new Error("CSV file is empty"));
            return;
          }

          // First row is headers
          const headers = data[0].map(h => String(h || ""));
          const rows = data.slice(1).filter(row => row.some(cell => cell !== null && cell !== ""));

          if (rows.length === 0) {
            reject(new Error("No data rows found in CSV"));
            return;
          }

          const columnTypes = detectColumnTypes(rows);

          resolve({
            fileName: file.name,
            headers,
            rows,
            columnTypes,
          });
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        reject(new Error(`Failed to parse CSV: ${error.message}`));
      },
    });
  });
}

/**
 * Parse XLSX file using SheetJS
 */
async function parseXLSX(file: File): Promise<ParsedData> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array" });

  // Get first sheet
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error("No sheets found in Excel file");
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

  if (!jsonData || jsonData.length === 0) {
    throw new Error("Excel file is empty");
  }

  // First row is headers
  const headers = jsonData[0].map(h => String(h || ""));
  const rows = jsonData.slice(1).filter(row => row.some(cell => cell !== null && cell !== undefined && cell !== ""));

  if (rows.length === 0) {
    throw new Error("No data rows found in Excel file");
  }

  const columnTypes = detectColumnTypes(rows);

  return {
    fileName: file.name,
    headers,
    rows,
    columnTypes,
  };
}

/**
 * Detect column types by analyzing the data
 */
function detectColumnTypes(rows: any[][]): ("number" | "string" | "date")[] {
  if (rows.length === 0) return [];

  const numColumns = rows[0].length;
  const columnTypes: ("number" | "string" | "date")[] = [];

  for (let col = 0; col < numColumns; col++) {
    let numCount = 0;
    let strCount = 0;
    let dateCount = 0;
    let sampleSize = 0;

    // Sample up to 50 rows to detect type
    for (let row = 0; row < Math.min(rows.length, 50); row++) {
      const cell = rows[row][col];
      if (cell === null || cell === undefined || cell === "") continue;

      sampleSize++;

      // Check if it's a number
      if (typeof cell === "number" || !isNaN(Number(cell))) {
        numCount++;
      }
      // Check if it's a date
      else if (isDateString(String(cell))) {
        dateCount++;
      }
      // Otherwise it's a string
      else {
        strCount++;
      }
    }

    // Determine dominant type
    if (sampleSize === 0) {
      columnTypes.push("string");
    } else if (dateCount > sampleSize * 0.5) {
      columnTypes.push("date");
    } else if (numCount > sampleSize * 0.7) {
      columnTypes.push("number");
    } else {
      columnTypes.push("string");
    }
  }

  return columnTypes;
}

/**
 * Check if a string looks like a date
 */
function isDateString(str: string): boolean {
  const date = new Date(str);
  return !isNaN(date.getTime()) && str.length > 5;
}

/**
 * Convert parsed data to a simple object format for AI analysis
 */
export function dataToJSON(data: ParsedData): any {
  const result: any = {
    headers: data.headers,
    columnTypes: data.columnTypes,
    rows: [],
    summary: {
      rowCount: data.rows.length,
      columnCount: data.headers.length,
    },
  };

  // Convert rows to objects with header keys
  result.rows = data.rows.map((row) => {
    const obj: any = {};
    data.headers.forEach((header, i) => {
      obj[header] = row[i];
    });
    return obj;
  });

  return result;
}
