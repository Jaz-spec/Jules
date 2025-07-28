#!/usr/bin/env node

import { execSync } from 'child_process';
 import { readFileSync, existsSync,
realpathSync } from 'fs';
import { fileURLToPath } from 'url'; 

interface AccessibilityTask {
  type: string;
  files?: string[];
  description: string;
  prompt?: string;
}

class AccessibilityCLI {
  private currentBranch: string = '';
  private newBranch: string = '';

  constructor() {
    this.getCurrentBranch();
    this.generateBranchName();
  }

  private getCurrentBranch(): void {
    try {
      this.currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
      console.log(`📍 Current branch: ${this.currentBranch}`);
    } catch (error) {
      console.error('❌ Failed to get current branch. Are you in a git repository?');
      process.exit(1);
    }
  }

  private generateBranchName(): void {
    const timestamp = Date.now();
    this.newBranch = `accessibility-improvements-${timestamp}`;
  }

  private checkGeminiAuth(): void {
    try {
      execSync('gemini --version', { stdio: 'pipe' });
      console.log('✅ Gemini CLI available');
    } catch (error) {
      console.error('❌ Gemini CLI not found. Install with: npm install -g @google/gemini-cli');
      process.exit(1);
    }
  }

  private loadInstructions(): AccessibilityTask[] {
    try {
      const content = readFileSync('accessibility-instructions.json', 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.error('❌ Could not load accessibility-instructions.json');
      process.exit(1);
    }
  }

  private createBranch(): void {
    try {
      console.log(`🌿 Creating new branch: ${this.newBranch}`);
      execSync(`git checkout -b ${this.newBranch}`, { stdio: 'inherit' });
    } catch (error) {
      console.error('❌ Failed to create new branch');
      process.exit(1);
    }
  }

  private findRelevantFiles(): string[] {
    try {
      const gitFiles = execSync('git ls-files', { encoding: 'utf-8' })
        .split('\n')
        .filter(file => file.trim() && this.isRelevantFile(file));
      
      return gitFiles;
    } catch (error) {
      console.error('❌ Failed to get git files');
      return [];
    }
  }

  private isRelevantFile(fileName: string): boolean {
    const extensions = ['.html', '.tsx', '.jsx', '.vue', '.svelte'];
    return extensions.some(ext => fileName.endsWith(ext));
  }

  private async runGeminiTask(task: AccessibilityTask): Promise<void> {
    const targetFiles = task.files || this.findRelevantFiles();
    
    if (targetFiles.length === 0) {
      console.log(`⚠️  No relevant files found for ${task.type}`);
      return;
    }

    console.log(`🔧 Running ${task.type} on ${targetFiles.length} files...`);

    for (const file of targetFiles.slice(0, 10)) { // Limit to first 10 files to avoid rate limits
      if (!existsSync(file)) continue;
      
      const prompt = this.generatePrompt(task, file);
      
      try {
        console.log(`  Processing ${file}...`);
        execSync(`gemini "${prompt}" --file "${file}" --apply`, { 
          stdio: 'pipe',
          timeout: 30000 // 30 second timeout per file
        });
        console.log(`  ✅ ${file}`);
      } catch (error) {
        console.log(`  ⚠️  Skipped ${file} (Gemini error)`);
      }
    }
  }

  private generatePrompt(task: AccessibilityTask, file: string): string {
    const basePrompts = {
      'add-alt-text': `Review this file and add appropriate alt text to all images that are missing alt attributes. Make the alt text descriptive and meaningful for screen readers.`,
      'add-aria-labels': `Add appropriate aria-label attributes to interactive elements (buttons, links, form controls) that don't have accessible names.`,
      'fix-heading-order': `Fix the heading hierarchy in this file to ensure proper h1->h2->h3 order for screen readers.`,
      'add-skip-links': `Add skip navigation links at the beginning of the page to help keyboard users navigate efficiently.`,
      'improve-focus': `Ensure all interactive elements have visible focus indicators and proper tab order.`,
      'add-semantic-html': `Replace generic div/span elements with appropriate semantic HTML elements where possible.`
    };
    
    return task.prompt || basePrompts[task.type] || `Improve accessibility for: ${task.description}`;
  }

  private commitChanges(): boolean {
    try {
      // Check if there are any changes
      const status = execSync('git status --porcelain', { encoding: 'utf-8' });
      
      if (!status.trim()) {
        console.log('ℹ️  No changes to commit');
        return false;
      }

      console.log('📝 Committing changes...');
      execSync('git add .', { stdio: 'inherit' });
      execSync('git commit -m "feat: automated accessibility improvements via Gemini CLI"', { stdio: 'inherit' });
      return true;
    } catch (error) {
      console.error('❌ Failed to commit changes');
      return false;
    }
  }

  private pushBranch(): void {
    try {
      console.log('🚀 Pushing branch to remote...');
      execSync(`git push -u origin ${this.newBranch}`, { stdio: 'inherit' });
    } catch (error) {
      console.error('❌ Failed to push branch');
      process.exit(1);
    }
  }

  private createPR(): void {
    try {
      console.log('📋 Creating pull request...');
      
      const prBody = `
# Automated Accessibility Improvements

This PR contains accessibility improvements generated by Google Jules.

## Changes Made
- Accessibility fixes applied to HTML/JSX/Vue/Svelte files
- Generated via Jules CLI command
- Based on instructions in \`accessibility-instructions.json\`

## Files Modified
Run \`git diff ${this.currentBranch}..${this.newBranch} --name-only\` to see all changed files.

Ready for review! 🚀
      `.trim();

      execSync(`gh pr create --title "Automated Accessibility Improvements (Jules CLI)" --body "${prBody}" --base ${this.currentBranch}`, { 
        stdio: 'inherit' 
      });
      
      console.log('✅ Pull request created successfully!');
    } catch (error) {
      console.error('❌ Failed to create PR. Make sure GitHub CLI is installed and authenticated.');
      console.log('💡 You can create the PR manually at: https://github.com/your-repo/compare');
    }
  }

  private switchBackToBranch(): void {
    try {
      console.log(`🔄 Switching back to ${this.currentBranch}`);
      execSync(`git checkout ${this.currentBranch}`, { stdio: 'inherit' });
    } catch (error) {
      console.log('⚠️  Could not switch back to original branch');
    }
  }

  public async run(): Promise<void> {
    console.log('🎯 Starting Gemini CLI Accessibility Tool...\n');
    
    // Pre-flight checks
    this.checkGeminiAuth();
    
    const instructions = this.loadInstructions();
    console.log(`📋 Loaded ${instructions.length} accessibility tasks\n`);

    // Create new branch
    this.createBranch();

    try {
      // Run Gemini tasks
      for (const task of instructions) {
        await this.runGeminiTask(task);
      }

      // Commit and push changes
      const hasChanges = this.commitChanges();
      
      if (hasChanges) {
        this.pushBranch();
        this.createPR();
        console.log('\n🎉 Accessibility improvements completed!');
        console.log(`📊 Check your PR and merge when ready.`);
      } else {
        console.log('\n💡 No accessibility improvements needed at this time.');
      }

    } finally {
      // Always switch back to original branch
      this.switchBackToBranch();
    }
  }
}

// Run if called directly
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)){
  const cli = new AccessibilityCLI();
  cli.run().catch(error => {
    console.error('💥 CLI failed:', error.message);
    process.exit(1);
  });
}

export default AccessibilityCLI;