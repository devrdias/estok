import { execSync } from 'child_process';
import { readFileSync, readdirSync, existsSync, writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';

/**
 * Interface for git change details
 */
export interface GitChanges {
  currentBranch: string;
  committedFiles: string[];
  stagedFiles: string[];
  unstagedFiles: string[];
  allFiles: string[];
}

/**
 * Interface for execSync options
 */
interface ExecSyncOptions {
  cwd: string;
  encoding?: BufferEncoding;
  stdio?: 'pipe' | 'inherit';
}

/**
 * Interface for file filtering options
 */
export interface FileFilterOptions {
  verbose?: boolean;
  patterns?: RegExp[];
  checkExists?: boolean;
  displayInfo?: boolean;
}

/**
 * Shared utilities for cursor-agent scripts
 */
export class SharedUtils {
  private static readonly DEFAULT_BRANCH = 'master';

  /**
   * Get the .cursor/rules directory path
   */
  static getRulesDirectory(): string {
    return join(process.cwd(), '.cursor', 'rules');
  }

  /**
   * Get the .cursor directory path
   */
  static getCursorDirectory(): string {
    return join(process.cwd(), '.cursor');
  }

  /**
   * Get the .cursor/validation directory path
   */
  static getValidationDirectory(): string {
    return join(process.cwd(), '.cursor', 'validation');
  }

  /**
   * Load a single rule file from .cursor/rules/
   */
  static loadSingleRule(ruleFileName: string): string {
    const rulesDir: string = this.getRulesDirectory();
    const rulePath: string = join(rulesDir, ruleFileName);

    if (!existsSync(rulePath)) {
      throw new Error(`Rule file not found at path: ${rulePath}. Ensure the file exists in .cursor/rules/ directory.`);
    }

    return readFileSync(rulePath, 'utf-8');
  }

  /**
   * Load a single validation rule file from .cursor/validation/
   */
  static loadValidationRule(ruleFileName: string): string {
    const validationDir: string = this.getValidationDirectory();
    const rulePath: string = join(validationDir, ruleFileName);

    if (!existsSync(rulePath)) {
      throw new Error(`Validation rule file not found at path: ${rulePath}. Ensure the file exists in .cursor/validation/ directory.`);
    }

    return readFileSync(rulePath, 'utf-8');
  }

  /**
   * Load all rule files from .cursor/rules/
   */
  static loadAllRules(verbose: boolean = false): string[] {
    const rulesDir: string = this.getRulesDirectory();
    const rules: string[] = [];

    try {
      const ruleFiles: string[] = readdirSync(rulesDir)
        .filter(file => file.endsWith('.md'))
        .sort();

      if (verbose) {
        console.log('📋 Loading review rules...');
      }

      for (const ruleFile of ruleFiles) {
        const rulePath: string = join(rulesDir, ruleFile);
        const ruleContent: string = readFileSync(rulePath, 'utf-8');
        rules.push(`# ${ruleFile.replace('.md', '')}\n${ruleContent}`);

        if (verbose) {
          console.log(`  ✓ Loaded: ${ruleFile}`);
        }
      }

      if (verbose) {
        console.log(`  📊 Total rules loaded: ${rules.length}\n`);
      }

      return rules;
    } catch (error) {
      throw new Error(`Failed to load rule files from .cursor/rules/ directory: ${error}`);
    }
  }

  /**
   * Get all changed files compared to master branch
   */
  static getChangedFiles(verbose: boolean = false): GitChanges {
    try {
      const currentBranch: string = execSync('git branch --show-current', { encoding: 'utf-8' }).trim();

      if (verbose) {
        console.log('🔍 Detecting changed files...');
        console.log(`  📍 Current branch: ${currentBranch}`);
      }

      // Get all types of changed files
      const committedFiles: string[] = this.execGit(`git diff --name-only ${SharedUtils.DEFAULT_BRANCH}...HEAD`);
      const stagedFiles: string[] = this.execGit('git diff --name-only --cached');
      const unstagedFiles: string[] = this.execGit('git diff --name-only');
      const untrackedFiles: string[] = this.execGit('git ls-files --others --exclude-standard');

      // Combine all changed files and remove duplicates
      const allFiles: string[] = Array.from(new Set([...committedFiles, ...stagedFiles, ...unstagedFiles, ...untrackedFiles]));

      return {
        currentBranch,
        committedFiles,
        stagedFiles,
        unstagedFiles,
        allFiles
      };
    } catch (error) {
      throw new Error(`Failed to detect changed files from git (git commands failed): ${error}`);
    }
  }

  /**
   * Execute git command and return array of file paths
   * Splits output by newlines and filters empty lines
   * @param command - Git command to execute
   * @returns Array of file paths from git command output
   * @private
   */
  private static execGit(command: string): string[] {
    const output: string = execSync(command, { encoding: 'utf-8' });
    return output
      .split('\n')
      .filter(line => line.trim())
      .map(line => line.trim());
  }

  /**
   * Filter files by pattern matching
   */
  static filterFiles(files: string[], patterns: RegExp[], checkExists: boolean = false): string[] {
    let filtered: string[] = files.filter(file =>
      patterns.some(pattern => pattern.test(file))
    );

    if (checkExists) {
      filtered = filtered.filter(file => existsSync(file));
    }

    return filtered;
  }

  /**
   * Execute cursor-agent with a prompt
   */
  static async executeCursorAgent(
    prompt: string,
    tempFileName: string = 'temp-prompt.txt',
    captureOutput: boolean = false
  ): Promise<string> {
    const tempFile: string = join(this.getCursorDirectory(), tempFileName);

    try {
      // Write prompt to temp file to avoid shell escaping issues
      writeFileSync(tempFile, prompt, 'utf-8');

      // Execute cursor-agent with the prompt file
      const options: ExecSyncOptions = {
        cwd: process.cwd()
      };

      if (captureOutput) {
        // Capture output and suppress terminal display
        options.encoding = 'utf-8';
        options.stdio = 'pipe'; // Shorthand for ['pipe', 'pipe', 'pipe']
      } else {
        // Stream output directly to terminal
        options.stdio = 'inherit';
      }

      const output: string | Buffer = execSync(
        `cursor-agent --print --output-format=text "$(cat ${tempFile})"`,
        options
      );

      return captureOutput ? output.toString() : '';
    } finally {
      // Clean up temp file
      if (existsSync(tempFile)) {
        unlinkSync(tempFile);
      }
    }
  }

  /**
   * Display verbose file change information
   */
  static displayFileChangeInfo(
    changes: GitChanges,
    filteredFiles: string[],
    filterPredicate: (file: string) => boolean
  ): void {
    console.log(`  📁 Found ${filteredFiles.length} files:`);
    console.log(`    📝 Committed changes: ${changes.committedFiles.filter(filterPredicate).length}`);
    console.log(`    📋 Staged changes: ${changes.stagedFiles.filter(filterPredicate).length}`);
    console.log(`    📄 Unstaged changes: ${changes.unstagedFiles.filter(filterPredicate).length}`);

    // Calculate untracked files by exclusion
    const trackedFiles: Set<string> = new Set([...changes.committedFiles, ...changes.stagedFiles, ...changes.unstagedFiles]);
    const untrackedCount: number = changes.allFiles.filter(f => !trackedFiles.has(f) && filterPredicate(f)).length;
    if (untrackedCount > 0) {
      console.log(`    ✨ Untracked files: ${untrackedCount}`);
    }

    filteredFiles.forEach(file => {
      let status: string = '';
      if (changes.committedFiles.includes(file)) status += ' [committed]';
      if (changes.stagedFiles.includes(file)) status += ' [staged]';
      if (changes.unstagedFiles.includes(file)) status += ' [unstaged]';
      if (!status) status = ' [untracked]'; // New untracked files
      console.log(`    - ${file}${status}`);
    });
    console.log('');
  }

  /**
   * Measure execution time of a function
   */
  static async measureExecutionTime<T>(fn: () => Promise<T>): Promise<{ result: T; executionTime: number }> {
    const startTime: number = Date.now();
    const result: T = await fn();
    const endTime: number = Date.now();
    const executionTime: number = endTime - startTime;

    return { result, executionTime };
  }

  /**
   * Format execution time for display
   */
  static formatExecutionTime(milliseconds: number): string {
    const seconds: number = Math.floor(milliseconds / 1000);
    const ms: number = milliseconds % 1000;
    return `${seconds}.${ms.toString().padStart(3, '0')}s`;
  }

  /**
   * Get file patterns for validation and review
   * Returns patterns that match TypeScript and JavaScript files in:
   * - .cursor/ directory (automation scripts)
   */
  static getValidationFilePatterns(): RegExp[] {
    return [
      /^\.cursor\/.*\.(js|ts)$/
    ];
  }

  /**
   * Get and filter changed files with optional display
   * Unified method for getting changed files with filtering and display options
   *
   * @param options Configuration options
   * @returns Array of filtered file paths
   */
  static getAndFilterChangedFiles(options: FileFilterOptions = {}): string[] {
    const {
      verbose = false,
      patterns = this.getValidationFilePatterns(),
      checkExists = false,
      displayInfo = false
    } = options;

    try {
      // Get all changed files from git
      const changes: GitChanges = this.getChangedFiles(verbose);

      // Filter files by patterns
      const filteredFiles: string[] = this.filterFiles(
        changes.allFiles,
        patterns,
        checkExists
      );

      // Optionally display detailed file change information
      if (displayInfo) {
        this.displayFileChangeInfo(
          changes,
          filteredFiles,
          (file) => patterns.some(pattern => pattern.test(file))
        );
      }

      return filteredFiles;
    } catch (error) {
      throw new Error(`Failed to get and filter changed files from git: ${error}`);
    }
  }
}

