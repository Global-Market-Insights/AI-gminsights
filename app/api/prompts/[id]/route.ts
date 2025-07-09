import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const PROMPTS_DIR = path.join(process.cwd(), 'data', 'prompts');
const PROMPTS_INDEX_FILE = path.join(PROMPTS_DIR, 'index.json');
const CURRENT_CONFIG_FILE = path.join(PROMPTS_DIR, 'current-config.json');

// GET - Load specific configuration
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const configId = params.id;
    const configPath = path.join(PROMPTS_DIR, `${configId}.json`);
    
    const configData = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(configData);
    
    return NextResponse.json({ success: true, config });
  } catch (error) {
    console.error('Error loading configuration:', error);
    return NextResponse.json({ success: false, error: 'Configuration not found' }, { status: 404 });
  }
}

// PUT - Update specific configuration
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const configId = params.id;
    const configPath = path.join(PROMPTS_DIR, `${configId}.json`);
    const body = await request.json();
    
    // Load existing config
    const existingConfigData = await fs.readFile(configPath, 'utf-8');
    const existingConfig = JSON.parse(existingConfigData);
    
    // Update config
    const updatedConfig = {
      ...existingConfig,
      ...body,
      id: configId, // Ensure ID doesn't change
      updatedAt: new Date().toISOString()
    };
    
    // Save updated config
    await fs.writeFile(configPath, JSON.stringify(updatedConfig, null, 2));
    
    // If this is the active config, update current config file
    const indexData = await fs.readFile(PROMPTS_INDEX_FILE, 'utf-8');
    const index = JSON.parse(indexData);
    
    if (index.activeConfigId === configId) {
      updatedConfig.isActive = true;
      await fs.writeFile(CURRENT_CONFIG_FILE, JSON.stringify(updatedConfig, null, 2));
    }
    
    return NextResponse.json({ success: true, config: updatedConfig });
  } catch (error) {
    console.error('Error updating configuration:', error);
    return NextResponse.json({ success: false, error: 'Failed to update configuration' }, { status: 500 });
  }
}

// DELETE - Delete specific configuration
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const configId = params.id;
    const configPath = path.join(PROMPTS_DIR, `${configId}.json`);
    
    // Load index
    const indexData = await fs.readFile(PROMPTS_INDEX_FILE, 'utf-8');
    const index = JSON.parse(indexData);
    
    // Check if this is the active config
    if (index.activeConfigId === configId) {
      return NextResponse.json({ success: false, error: 'Cannot delete active configuration' }, { status: 400 });
    }
    
    // Delete config file
    await fs.unlink(configPath);
    
    // Update index
    index.configurations = index.configurations.filter((id: string) => id !== configId);
    await fs.writeFile(PROMPTS_INDEX_FILE, JSON.stringify(index, null, 2));
    
    return NextResponse.json({ success: true, message: 'Configuration deleted' });
  } catch (error) {
    console.error('Error deleting configuration:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete configuration' }, { status: 500 });
  }
}
