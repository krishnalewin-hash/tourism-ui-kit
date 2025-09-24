#!/usr/bin/env node
/**
 * Build Script for Modular Client Configurations
 * 
 * This script combines modular client configurations into single JSON files
 * for CDN distribution while maintaining the modular structure for development.
 */

import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class ClientConfigBuilder {
  constructor() {
    this.clientsDir = join(__dirname, 'clients');
    this.buildDir = join(__dirname, 'clients', '_build');
  }

  async build() {
    console.log('🔧 Building client configurations...');
    
    try {
      // Ensure build directory exists
      await this.ensureBuildDir();
      
      // Get all client directories
      const clientDirs = await this.getClientDirectories();
      
      // Build each client
      for (const clientDir of clientDirs) {
        await this.buildClient(clientDir);
      }
      
      console.log('✅ Client configuration build complete!');
      
    } catch (error) {
      console.error('❌ Build failed:', error);
      process.exit(1);
    }
  }

  async ensureBuildDir() {
    try {
      await fs.mkdir(this.buildDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, ignore
    }
  }

  async getClientDirectories() {
    const entries = await fs.readdir(this.clientsDir, { withFileTypes: true });
    return entries
      .filter(entry => entry.isDirectory() && !entry.name.startsWith('_'))
      .map(entry => entry.name);
  }

  async buildClient(clientName) {
    const clientDir = join(this.clientsDir, clientName);
    const manifestPath = join(clientDir, 'manifest.json');
    
    console.log(`📦 Building ${clientName}...`);
    
    try {
      // Check if manifest exists
      let manifest;
      try {
        const manifestContent = await fs.readFile(manifestPath, 'utf8');
        manifest = JSON.parse(manifestContent);
      } catch (error) {
        console.log(`   ℹ️  No manifest found for ${clientName}, using default file structure`);
        return this.buildClientWithoutManifest(clientName);
      }

      // Load all files defined in manifest
      const combinedConfig = {};
      
      for (const [configType, fileName] of Object.entries(manifest.files)) {
        const filePath = join(clientDir, fileName);
        try {
          const content = await fs.readFile(filePath, 'utf8');
          const data = JSON.parse(content);
          Object.assign(combinedConfig, data);
        } catch (error) {
          console.log(`   ⚠️  Could not load ${fileName} for ${clientName}:`, error.message);
        }
      }

      // Add metadata
      combinedConfig._meta = {
        client: clientName,
        buildTime: new Date().toISOString(),
        version: manifest.version || '1.0.0',
        source: 'modular'
      };

      // Write bundled config
      const buildPath = join(this.buildDir, `${clientName}.json`);
      await fs.writeFile(buildPath, JSON.stringify(combinedConfig, null, 2));
      
      console.log(`   ✅ Built ${clientName}.json (${Object.keys(combinedConfig).length} sections)`);
      
    } catch (error) {
      console.error(`   ❌ Failed to build ${clientName}:`, error.message);
    }
  }

  async buildClientWithoutManifest(clientName) {
    const clientDir = join(this.clientsDir, clientName);
    const standardFiles = ['config.json', 'pricing.json', 'catalog.json', 'branding.json'];
    
    const combinedConfig = {};
    let filesFound = 0;
    
    for (const fileName of standardFiles) {
      const filePath = join(clientDir, fileName);
      try {
        const content = await fs.readFile(filePath, 'utf8');
        const data = JSON.parse(content);
        Object.assign(combinedConfig, data);
        filesFound++;
      } catch (error) {
        // File doesn't exist, skip
      }
    }

    if (filesFound > 0) {
      // Add metadata
      combinedConfig._meta = {
        client: clientName,
        buildTime: new Date().toISOString(),
        version: '1.0.0',
        source: 'modular-no-manifest'
      };

      // Write bundled config
      const buildPath = join(this.buildDir, `${clientName}.json`);
      await fs.writeFile(buildPath, JSON.stringify(combinedConfig, null, 2));
      
      console.log(`   ✅ Built ${clientName}.json (${filesFound} files combined)`);
    } else {
      console.log(`   ⚠️  No standard files found for ${clientName}`);
    }
  }
}

// Run if called directly
const builder = new ClientConfigBuilder();
builder.build();

export default ClientConfigBuilder;