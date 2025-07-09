import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface ReportData {
  id: string;
  title: string;
  slug: string;
  metaTitle: string;
  metaKeywords: string;
  metaDescription: string;
  baseYear: number;
  forecastYear: number;
  cagr: string;
  marketSize: string;
  category: string;
  targetAudience: string;
  reportLength: string;
  createdAt: string;
  updatedAt: string;
}

const REPORTS_DIR = path.join(process.cwd(), 'data', 'reports');
const REPORTS_INDEX_FILE = path.join(REPORTS_DIR, 'index.json');

// Ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }
  
  if (!fs.existsSync(REPORTS_INDEX_FILE)) {
    fs.writeFileSync(REPORTS_INDEX_FILE, JSON.stringify([], null, 2));
  }
}

// Get all reports (index)
export async function GET() {
  try {
    ensureDataDir();
    
    const indexData = fs.readFileSync(REPORTS_INDEX_FILE, 'utf-8');
    const reports = JSON.parse(indexData);
    
    return NextResponse.json({ success: true, reports });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}

// Create new report
export async function POST(request: NextRequest) {
  try {
    ensureDataDir();
    
    const reportData = await request.json();
    
    // Generate unique ID if not provided
    const id = reportData.id || `report_${Date.now()}`;
    const timestamp = new Date().toISOString();
    
    const newReport: ReportData = {
      ...reportData,
      id,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    
    // Save individual report file
    const reportFilePath = path.join(REPORTS_DIR, `${id}.json`);
    fs.writeFileSync(reportFilePath, JSON.stringify(newReport, null, 2));
    
    // Update index
    const indexData = fs.readFileSync(REPORTS_INDEX_FILE, 'utf-8');
    const reports = JSON.parse(indexData);
    
    // Remove existing entry if updating
    const existingIndex = reports.findIndex((r: any) => r.id === id);
    if (existingIndex >= 0) {
      reports[existingIndex] = {
        id: newReport.id,
        title: newReport.title,
        slug: newReport.slug,
        category: newReport.category,
        createdAt: newReport.createdAt,
        updatedAt: newReport.updatedAt
      };
    } else {
      reports.push({
        id: newReport.id,
        title: newReport.title,
        slug: newReport.slug,
        category: newReport.category,
        createdAt: newReport.createdAt,
        updatedAt: newReport.updatedAt
      });
    }
    
    fs.writeFileSync(REPORTS_INDEX_FILE, JSON.stringify(reports, null, 2));
    
    return NextResponse.json({ success: true, report: newReport });
  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create report' },
      { status: 500 }
    );
  }
}
