import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data', 'reports');
const TOC_DIR = path.join(DATA_DIR, 'toc');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(TOC_DIR)) {
  fs.mkdirSync(TOC_DIR, { recursive: true });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const tocFilePath = path.join(TOC_DIR, `${slug}.json`);

    if (!fs.existsSync(tocFilePath)) {
      return NextResponse.json(
        { error: 'Table of contents not found' },
        { status: 404 }
      );
    }

    const tocData = JSON.parse(fs.readFileSync(tocFilePath, 'utf8'));
    return NextResponse.json(tocData);
  } catch (error) {
    console.error('Error loading TOC:', error);
    return NextResponse.json(
      { error: 'Failed to load table of contents' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const tocData = await request.json();
    const tocFilePath = path.join(TOC_DIR, `${slug}.json`);

    // Validate TOC data
    if (!tocData.reportId || !tocData.reportSlug || !Array.isArray(tocData.items)) {
      return NextResponse.json(
        { error: 'Invalid table of contents data' },
        { status: 400 }
      );
    }

    // Ensure the slug matches
    tocData.reportSlug = slug;
    tocData.updatedAt = new Date().toISOString();

    // Save TOC data
    fs.writeFileSync(tocFilePath, JSON.stringify(tocData, null, 2));

    return NextResponse.json(tocData);
  } catch (error) {
    console.error('Error saving TOC:', error);
    return NextResponse.json(
      { error: 'Failed to save table of contents' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const tocFilePath = path.join(TOC_DIR, `${slug}.json`);

    if (fs.existsSync(tocFilePath)) {
      fs.unlinkSync(tocFilePath);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting TOC:', error);
    return NextResponse.json(
      { error: 'Failed to delete table of contents' },
      { status: 500 }
    );
  }
}
