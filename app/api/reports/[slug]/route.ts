import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data', 'reports');

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    
    // First, check if we have a direct file for this slug
    const reportFilePath = path.join(DATA_DIR, `${slug}.json`);
    
    if (fs.existsSync(reportFilePath)) {
      const reportData = JSON.parse(fs.readFileSync(reportFilePath, 'utf8'));
      return NextResponse.json({ success: true, report: reportData });
    }

    // If not found as a file, search through the index
    const indexPath = path.join(DATA_DIR, 'index.json');
    
    if (!fs.existsSync(indexPath)) {
      return NextResponse.json(
        { success: false, error: 'Reports index not found' },
        { status: 404 }
      );
    }

    const reportsIndex = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    const reportId = reportsIndex.find((report: any) => report.slug === slug)?.id;
    
    if (!reportId) {
      return NextResponse.json(
        { success: false, error: 'Report not found' },
        { status: 404 }
      );
    }

    const reportByIdPath = path.join(DATA_DIR, `${reportId}.json`);
    
    if (!fs.existsSync(reportByIdPath)) {
      return NextResponse.json(
        { success: false, error: 'Report file not found' },
        { status: 404 }
      );
    }

    const reportData = JSON.parse(fs.readFileSync(reportByIdPath, 'utf8'));
    return NextResponse.json({ success: true, report: reportData });
  } catch (error) {
    console.error('Error loading report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load report' },
      { status: 500 }
    );
  }
}

// Delete report by slug
export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    
    // First, check if we have a direct file for this slug
    const reportFilePath = path.join(DATA_DIR, `${slug}.json`);
    let reportId = slug;
    let actualFilePath = reportFilePath;
    
    if (!fs.existsSync(reportFilePath)) {
      // If not found as a direct file, search through the index
      const indexPath = path.join(DATA_DIR, 'index.json');
      
      if (!fs.existsSync(indexPath)) {
        return NextResponse.json(
          { success: false, error: 'Reports index not found' },
          { status: 404 }
        );
      }

      const reportsIndex = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
      const reportEntry = reportsIndex.find((report: any) => report.slug === slug);
      
      if (!reportEntry) {
        return NextResponse.json(
          { success: false, error: 'Report not found' },
          { status: 404 }
        );
      }

      reportId = reportEntry.id;
      actualFilePath = path.join(DATA_DIR, `${reportId}.json`);
      
      if (!fs.existsSync(actualFilePath)) {
        return NextResponse.json(
          { success: false, error: 'Report file not found' },
          { status: 404 }
        );
      }
    }

    // Delete the report file
    fs.unlinkSync(actualFilePath);

    // Update the index to remove the report entry
    const indexPath = path.join(DATA_DIR, 'index.json');
    if (fs.existsSync(indexPath)) {
      const reportsIndex = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
      const updatedIndex = reportsIndex.filter((report: any) => 
        report.slug !== slug && report.id !== reportId
      );
      fs.writeFileSync(indexPath, JSON.stringify(updatedIndex, null, 2));
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Report deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete report' },
      { status: 500 }
    );
  }
}

// Update report by slug
export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const updateData = await request.json();
    
    // First, search through the index to find the report ID for this slug
    const indexPath = path.join(DATA_DIR, 'index.json');
    
    if (!fs.existsSync(indexPath)) {
      return NextResponse.json(
        { success: false, error: 'Reports index not found' },
        { status: 404 }
      );
    }

    const reportsIndex = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    const reportEntry = reportsIndex.find((report: any) => report.slug === slug);
    
    if (!reportEntry) {
      return NextResponse.json(
        { success: false, error: 'Report not found' },
        { status: 404 }
      );
    }

    const reportId = reportEntry.id;
    const reportFilePath = path.join(DATA_DIR, `${reportId}.json`);
    
    if (!fs.existsSync(reportFilePath)) {
      return NextResponse.json(
        { success: false, error: 'Report file not found' },
        { status: 404 }
      );
    }

    // Read existing report
    const existingData = JSON.parse(fs.readFileSync(reportFilePath, 'utf8'));
    
    // Update report data while preserving ID and timestamps
    const updatedReport = {
      ...existingData,
      ...updateData,
      id: existingData.id || reportId, // Preserve original ID
      updatedAt: new Date().toISOString(),
      createdAt: existingData.createdAt || new Date().toISOString()
    };

    // Write updated report to file
    fs.writeFileSync(reportFilePath, JSON.stringify(updatedReport, null, 2));

    // Update index if the title or slug changed
    const reportIndex = reportsIndex.findIndex((report: any) => report.id === reportId);
    if (reportIndex >= 0) {
      reportsIndex[reportIndex] = {
        ...reportsIndex[reportIndex],
        title: updatedReport.title,
        slug: updatedReport.slug,
        category: updatedReport.category,
        updatedAt: updatedReport.updatedAt
      };
      fs.writeFileSync(indexPath, JSON.stringify(reportsIndex, null, 2));
    }

    return NextResponse.json({ 
      success: true, 
      report: updatedReport,
      message: 'Report updated successfully' 
    });
  } catch (error) {
    console.error('Error updating report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update report' },
      { status: 500 }
    );
  }
}
