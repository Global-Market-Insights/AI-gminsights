import { NextRequest, NextResponse } from 'next/server';
import { parseExcelFileServer, convertToFlatData } from '@/utils/excelProcessor';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an Excel file.' },
        { status: 400 }
      );
    }

    // Read file buffer
    const buffer = await file.arrayBuffer();
    
    // Use the server-side Excel processor logic
    const parsedData = parseExcelFileServer(buffer, file.name, file.size);
    const convertedData = convertToFlatData(parsedData);

    return NextResponse.json({
      success: true,
      data: convertedData
    });

  } catch (error) {
    console.error('Excel conversion error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process Excel file' 
      },
      { status: 500 }
    );
  }
}
