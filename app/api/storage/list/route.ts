import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Storage directory for JSON files
const STORAGE_DIR = path.join(process.cwd(), 'data', 'parsed-files');

export async function GET(request: NextRequest) {
  try {
    if (!fs.existsSync(STORAGE_DIR)) {
      return NextResponse.json({ files: [] });
    }

    const files = fs.readdirSync(STORAGE_DIR)
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const filePath = path.join(STORAGE_DIR, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          created: stats.birthtime,
          modified: stats.mtime,
          size: stats.size
        };
      })
      .sort((a, b) => b.modified.getTime() - a.modified.getTime());

    return NextResponse.json({ files });

  } catch (error) {
    console.error('List API Error:', error);
    return NextResponse.json(
      { error: 'Failed to list files' },
      { status: 500 }
    );
  }
}
