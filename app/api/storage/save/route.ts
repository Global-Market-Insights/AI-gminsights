import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Storage directory for JSON files
const STORAGE_DIR = path.join(process.cwd(), 'data', 'parsed-files');

// Ensure storage directory exists
function ensureStorageDir() {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
}

export async function POST(request: NextRequest) {
  try {
    ensureStorageDir();
    
    const body = await request.json();
    const { fileName, data } = body;

    if (!fileName || !data) {
      return NextResponse.json(
        { error: 'Missing fileName or data' },
        { status: 400 }
      );
    }

    const filePath = path.join(STORAGE_DIR, fileName);
    
    // Write data to JSON file
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    return NextResponse.json({
      success: true,
      filePath: fileName,
      message: 'File saved successfully'
    });

  } catch (error) {
    console.error('Storage API Error:', error);
    return NextResponse.json(
      { error: 'Failed to save file' },
      { status: 500 }
    );
  }
}
