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

// Get specific report title by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const titleFilePath = path.join(TITLES_DIR, `${id}.json`);
    
    if (!fs.existsSync(titleFilePath)) {
      return NextResponse.json(
        { success: false, error: 'Report title not found' },
        { status: 404 }
      );
    }
    
    const titleData = fs.readFileSync(titleFilePath, 'utf-8');
    const title = JSON.parse(titleData);
    
    return NextResponse.json({ success: true, title });
  } catch (error) {
    console.error('Error fetching report title:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch report title' },
      { status: 500 }
    );
  }
}

// Update specific report title by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const titleFilePath = path.join(TITLES_DIR, `${id}.json`);
    
    if (!fs.existsSync(titleFilePath)) {
      return NextResponse.json(
        { success: false, error: 'Report title not found' },
        { status: 404 }
      );
    }
    
    const updateData = await request.json();
    const existingData = fs.readFileSync(titleFilePath, 'utf-8');
    const existingTitle = JSON.parse(existingData);
    
    const updatedTitle: ReportTitle = {
      ...existingTitle,
      ...updateData,
      id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString()
    };
    
    // Save updated title file
    fs.writeFileSync(titleFilePath, JSON.stringify(updatedTitle, null, 2));
    
    // Update index
    const indexData = fs.readFileSync(TITLES_INDEX_FILE, 'utf-8');
    const titles = JSON.parse(indexData);
    
    const titleIndex = titles.findIndex((t: any) => t.id === id);
    if (titleIndex >= 0) {
      titles[titleIndex] = {
        id: updatedTitle.id,
        title: updatedTitle.title,
        status: updatedTitle.status,
        priority: updatedTitle.priority,
        category: updatedTitle.category,
        deadline: updatedTitle.deadline,
        assignedTo: updatedTitle.assignedTo,
        createdAt: updatedTitle.createdAt,
        updatedAt: updatedTitle.updatedAt
      };
      
      fs.writeFileSync(TITLES_INDEX_FILE, JSON.stringify(titles, null, 2));
    }
    
    return NextResponse.json({ success: true, title: updatedTitle });
  } catch (error) {
    console.error('Error updating report title:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update report title' },
      { status: 500 }
    );
  }
}

// Delete specific report title by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const titleFilePath = path.join(TITLES_DIR, `${id}.json`);
    
    if (!fs.existsSync(titleFilePath)) {
      return NextResponse.json(
        { success: false, error: 'Report title not found' },
        { status: 404 }
      );
    }
    
    // Delete title file
    fs.unlinkSync(titleFilePath);
    
    // Update index
    const indexData = fs.readFileSync(TITLES_INDEX_FILE, 'utf-8');
    const titles = JSON.parse(indexData);
    
    const filteredTitles = titles.filter((t: any) => t.id !== id);
    fs.writeFileSync(TITLES_INDEX_FILE, JSON.stringify(filteredTitles, null, 2));
    
    return NextResponse.json({ success: true, message: 'Report title deleted successfully' });
  } catch (error) {
    console.error('Error deleting report title:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete report title' },
      { status: 500 }
    );
  }
}
