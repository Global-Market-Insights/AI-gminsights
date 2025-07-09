import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Storage directory for JSON files
const STORAGE_DIR = path.join(process.cwd(), 'data', 'parsed-files');

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('fileName');

    if (!fileName) {
      return NextResponse.json(
        { error: 'Missing fileName parameter' },
        { status: 400 }
      );
    }

    const filePath = path.join(STORAGE_DIR, fileName);
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    const data = fs.readFileSync(filePath, 'utf8');
    const parsedData = JSON.parse(data);

    return NextResponse.json(parsedData);

  } catch (error) {
    console.error('Load API Error:', error);
    return NextResponse.json(
      { error: 'Failed to load file' },
      { status: 500 }
    );
  }
}
