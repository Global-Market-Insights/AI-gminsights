import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const PROMPTS_DIR = path.join(process.cwd(), 'data', 'prompts');
const PROMPTS_INDEX_FILE = path.join(PROMPTS_DIR, 'index.json');
const DEFAULT_CONFIG_FILE = path.join(PROMPTS_DIR, 'default-config.json');
const CURRENT_CONFIG_FILE = path.join(PROMPTS_DIR, 'current-config.json');

// Ensure directories exist
async function ensureDirectories() {
  try {
    await fs.mkdir(PROMPTS_DIR, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
}

interface PromptConfig {
  id: string;
  name: string;
  description: string;
  prompts: any[];
  createdAt: string;
  updatedAt: string;
  isDefault?: boolean;
  isActive?: boolean;
}

// GET - Load prompt configurations
export async function GET(request: NextRequest) {
  try {
    await ensureDirectories();
    
    const url = new URL(request.url);
    const configType = url.searchParams.get('type'); // 'current', 'default', 'all'
    
    if (configType === 'current') {
      try {
        const currentConfig = await fs.readFile(CURRENT_CONFIG_FILE, 'utf-8');
        return NextResponse.json({ success: true, config: JSON.parse(currentConfig) });
      } catch (error) {
        // If no current config exists, return default
        try {
          const defaultConfig = await fs.readFile(DEFAULT_CONFIG_FILE, 'utf-8');
          return NextResponse.json({ success: true, config: JSON.parse(defaultConfig) });
        } catch (defaultError) {
          return NextResponse.json({ success: false, error: 'No configuration found' }, { status: 404 });
        }
      }
    }
    
    if (configType === 'default') {
      try {
        const defaultConfig = await fs.readFile(DEFAULT_CONFIG_FILE, 'utf-8');
        return NextResponse.json({ success: true, config: JSON.parse(defaultConfig) });
      } catch (error) {
        return NextResponse.json({ success: false, error: 'Default configuration not found' }, { status: 404 });
      }
    }
    
    // Return all configurations
    try {
      const indexData = await fs.readFile(PROMPTS_INDEX_FILE, 'utf-8');
      const index = JSON.parse(indexData);
      
      const configurations = await Promise.all(
        index.configurations.map(async (configId: string) => {
          try {
            const configPath = path.join(PROMPTS_DIR, `${configId}.json`);
            const configData = await fs.readFile(configPath, 'utf-8');
            return JSON.parse(configData);
          } catch (error) {
            return null;
          }
        })
      );
      
      return NextResponse.json({ 
        success: true, 
        configurations: configurations.filter(config => config !== null),
        activeConfigId: index.activeConfigId || null
      });
    } catch (error) {
      return NextResponse.json({ success: true, configurations: [], activeConfigId: null });
    }
  } catch (error) {
    console.error('Error loading prompt configurations:', error);
    return NextResponse.json({ success: false, error: 'Failed to load configurations' }, { status: 500 });
  }
}

// POST - Save prompt configuration
export async function POST(request: NextRequest) {
  try {
    await ensureDirectories();
    
    const body = await request.json();
    const { name, description, prompts, isDefault = false } = body;
    
    if (!name || !prompts || !Array.isArray(prompts)) {
      return NextResponse.json({ success: false, error: 'Invalid configuration data' }, { status: 400 });
    }
    
    const configId = `config_${Date.now()}`;
    const timestamp = new Date().toISOString();
    
    const config: PromptConfig = {
      id: configId,
      name,
      description: description || '',
      prompts,
      createdAt: timestamp,
      updatedAt: timestamp,
      isDefault,
      isActive: false
    };
    
    // Save the configuration file
    const configPath = path.join(PROMPTS_DIR, `${configId}.json`);
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    
    // Update index
    let index;
    try {
      const indexData = await fs.readFile(PROMPTS_INDEX_FILE, 'utf-8');
      index = JSON.parse(indexData);
    } catch (error) {
      index = { configurations: [], activeConfigId: null };
    }
    
    index.configurations.push(configId);
    
    // If this is the first configuration or marked as default, make it active
    if (!index.activeConfigId || isDefault) {
      index.activeConfigId = configId;
      config.isActive = true;
      
      // Save as current config
      await fs.writeFile(CURRENT_CONFIG_FILE, JSON.stringify(config, null, 2));
    }
    
    // If marked as default, save as default config
    if (isDefault) {
      await fs.writeFile(DEFAULT_CONFIG_FILE, JSON.stringify(config, null, 2));
    }
    
    await fs.writeFile(PROMPTS_INDEX_FILE, JSON.stringify(index, null, 2));
    
    return NextResponse.json({ success: true, config });
  } catch (error) {
    console.error('Error saving prompt configuration:', error);
    return NextResponse.json({ success: false, error: 'Failed to save configuration' }, { status: 500 });
  }
}

// PUT - Update current configuration
export async function PUT(request: NextRequest) {
  try {
    await ensureDirectories();
    
    const body = await request.json();
    const { prompts, name, description } = body;
    
    if (!prompts || !Array.isArray(prompts)) {
      return NextResponse.json({ success: false, error: 'Invalid prompts data' }, { status: 400 });
    }
    
    // Load current config or create new one
    let currentConfig;
    try {
      const currentConfigData = await fs.readFile(CURRENT_CONFIG_FILE, 'utf-8');
      currentConfig = JSON.parse(currentConfigData);
    } catch (error) {
      // Create new config
      currentConfig = {
        id: `config_${Date.now()}`,
        name: name || 'Current Configuration',
        description: description || '',
        prompts: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true
      };
    }
    
    // Update the configuration
    currentConfig.prompts = prompts;
    currentConfig.updatedAt = new Date().toISOString();
    if (name) currentConfig.name = name;
    if (description !== undefined) currentConfig.description = description;
    
    // Save current config
    await fs.writeFile(CURRENT_CONFIG_FILE, JSON.stringify(currentConfig, null, 2));
    
    // Also save to the specific config file
    const configPath = path.join(PROMPTS_DIR, `${currentConfig.id}.json`);
    await fs.writeFile(configPath, JSON.stringify(currentConfig, null, 2));
    
    return NextResponse.json({ success: true, config: currentConfig });
  } catch (error) {
    console.error('Error updating prompt configuration:', error);
    return NextResponse.json({ success: false, error: 'Failed to update configuration' }, { status: 500 });
  }
}
