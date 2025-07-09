import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface ReportTitle {
  id: string;
  title: string;
  description?: string;
  status: 'created' | 'in-progress' | 'review' | 'published';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  category: string;
  deadline: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  estimatedPages?: number;
  clientName?: string;
  notes?: string;
}

const TITLES_DIR = path.join(process.cwd(), 'data', 'report-titles');
const TITLES_INDEX_FILE = path.join(TITLES_DIR, 'index.json');

// Ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(TITLES_DIR)) {
    fs.mkdirSync(TITLES_DIR, { recursive: true });
  }
  
  if (!fs.existsSync(TITLES_INDEX_FILE)) {
    fs.writeFileSync(TITLES_INDEX_FILE, JSON.stringify([], null, 2));
  }
}

// Get all report titles
export async function GET(request: NextRequest) {
  try {
    ensureDataDir();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const priority = searchParams.get('priority');
    
    const indexData = fs.readFileSync(TITLES_INDEX_FILE, 'utf-8');
    let titles: ReportTitle[] = JSON.parse(indexData);
    
    // Apply filters
    if (status) {
      titles = titles.filter(title => title.status === status);
    }
    if (category) {
      titles = titles.filter(title => title.category === category);
    }
    if (priority) {
      titles = titles.filter(title => title.priority === priority);
    }
    
    // Sort by deadline (upcoming first)
    titles.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
    
    return NextResponse.json({ success: true, titles });
  } catch (error) {
    console.error('Error fetching report titles:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch report titles' },
      { status: 500 }
    );
  }
}

// Create new report title
export async function POST(request: NextRequest) {
  try {
    ensureDataDir();
    
    const titleData = await request.json();
    
    // Generate unique ID
    const id = `title_${Date.now()}`;
    const timestamp = new Date().toISOString();
    
    const newTitle: ReportTitle = {
      ...titleData,
      id,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    
    // Save individual title file
    const titleFilePath = path.join(TITLES_DIR, `${id}.json`);
    fs.writeFileSync(titleFilePath, JSON.stringify(newTitle, null, 2));
    
    // Update index
    const indexData = fs.readFileSync(TITLES_INDEX_FILE, 'utf-8');
    const titles = JSON.parse(indexData);
    
    titles.push({
      id: newTitle.id,
      title: newTitle.title,
      status: newTitle.status,
      priority: newTitle.priority,
      category: newTitle.category,
      deadline: newTitle.deadline,
      assignedTo: newTitle.assignedTo,
      createdAt: newTitle.createdAt,
      updatedAt: newTitle.updatedAt
    });
    
    fs.writeFileSync(TITLES_INDEX_FILE, JSON.stringify(titles, null, 2));
    
    return NextResponse.json({ success: true, title: newTitle });
  } catch (error) {
    console.error('Error creating report title:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create report title' },
      { status: 500 }
    );
  }
}
