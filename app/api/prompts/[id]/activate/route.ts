import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const PROMPTS_DIR = path.join(process.cwd(), 'data', 'prompts');
const PROMPTS_INDEX_FILE = path.join(PROMPTS_DIR, 'index.json');
const CURRENT_CONFIG_FILE = path.join(PROMPTS_DIR, 'current-config.json');

// POST - Activate a specific configuration
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const configId = params.id;
    const configPath = path.join(PROMPTS_DIR, `${configId}.json`);
    
    // Load the configuration to activate
    const configData = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(configData);
    
    // Update index to set this as active
    let index;
    try {
      const indexData = await fs.readFile(PROMPTS_INDEX_FILE, 'utf-8');
      index = JSON.parse(indexData);
    } catch (error) {
      index = { configurations: [], activeConfigId: null };
    }
    
    // Update active config
    const previousActiveId = index.activeConfigId;
    index.activeConfigId = configId;
    
    // Update the config to mark it as active
    config.isActive = true;
    config.updatedAt = new Date().toISOString();
    
    // Save updated config
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    
    // If there was a previous active config, mark it as inactive
    if (previousActiveId && previousActiveId !== configId) {
      try {
        const previousConfigPath = path.join(PROMPTS_DIR, `${previousActiveId}.json`);
        const previousConfigData = await fs.readFile(previousConfigPath, 'utf-8');
        const previousConfig = JSON.parse(previousConfigData);
        previousConfig.isActive = false;
        await fs.writeFile(previousConfigPath, JSON.stringify(previousConfig, null, 2));
      } catch (error) {
        // Previous config might not exist, continue
      }
    }
    
    // Save as current config
    await fs.writeFile(CURRENT_CONFIG_FILE, JSON.stringify(config, null, 2));
    
    // Save updated index
    await fs.writeFile(PROMPTS_INDEX_FILE, JSON.stringify(index, null, 2));
    
    return NextResponse.json({ success: true, config, message: 'Configuration activated' });
  } catch (error) {
    console.error('Error activating configuration:', error);
    return NextResponse.json({ success: false, error: 'Failed to activate configuration' }, { status: 500 });
  }
}
