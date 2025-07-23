import { DocGenerator } from '../src/documentation/docGenerator';
import * as path from 'path';

async function generateDocumentation() {
  const projectRoot = path.join(__dirname, '..');
  
  console.log('🚀 Starting documentation generation...');
  console.log(`Project root: ${projectRoot}`);
  
  try {
    const generator = new DocGenerator(projectRoot, {
      outputDir: 'docs/generated',
      exclude: ['node_modules', 'test', 'dist', 'out', '.git'],
    });
    
    await generator.generateDocs();
    
    console.log('✅ Documentation generated successfully!');
    console.log(`📁 Output directory: ${path.join(projectRoot, 'docs/generated')}`);
  } catch (error) {
    console.error('❌ Failed to generate documentation:', error);
    process.exit(1);
  }
}

// Run the generator
generateDocumentation();