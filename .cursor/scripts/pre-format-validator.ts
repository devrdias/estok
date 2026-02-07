import { SharedUtils } from './shared-utils';

/**
 * PreFormatValidator validates changed files against pre-format rules
 * Ensures code meets quality standards before formatting is applied
 */
class PreFormatValidator {
  private static readonly TEMP_PROMPT_FILE = 'temp-validation-prompt.txt';

  private changedFiles: string[] = [];
  private rules: string = '';

  constructor() {
    this.loadRules();
    this.getChangedFiles();
  }

  /**
   * Loads pre-format validation rules from .cursor/validation/
   * @throws Process exits with code 1 if rules cannot be loaded
   */
  private loadRules(): void {
    try {
      this.rules = SharedUtils.loadValidationRule('pre-format-validation.md');
      console.log('📋 Loaded pre-format validation rules\n');
    } catch (error) {
      console.error('❌ Failed to load pre-format validation rules from .cursor/validation/pre-format-validation.md:', error);
      process.exit(1);
    }
  }

  /**
   * Detects and filters changed files compared to master branch
   * Only includes files that exist on disk
   * @throws Process exits with code 1 if git operations fail
   */
  private getChangedFiles(): void {
    try {
      this.changedFiles = SharedUtils.getAndFilterChangedFiles({
        verbose: false,
        checkExists: true,
        displayInfo: true
      });
    } catch (error) {
      console.error('❌ Failed to detect changed files from git (compared to master branch):', error);
      process.exit(1);
    }
  }

  /**
   * Builds the AI prompt for validation
   * Combines rules and files into a structured prompt
   * @returns Formatted validation prompt string
   */
  private buildValidationPrompt(): string {
    const filesList: string = this.changedFiles.join('\n');

    return `VALIDATION CONTEXT:
- Changed files to validate: ${this.changedFiles.length} files
- Validation scope: Files changed in current branch compared to master

VALIDATION RULES (includes instructions and output format):
${this.rules}

FILES TO VALIDATE:
${filesList}

TASK:
Perform pre-format validation on the files listed above following the "Validation Instructions" section in the VALIDATION RULES.`;
  }

  /**
   * Executes validation on all changed files
   * Uses AI to check files against pre-format rules
   * @returns Promise<boolean> - true if validation passed, false if failed
   */
  public async validate(): Promise<boolean> {
    if (this.changedFiles.length === 0) {
      console.log('✅ No changed files to validate.\n');
      return true;
    }

    console.log(`🔍 Pre-format validation: checking ${this.changedFiles.length} changed files...\n`);

    try {
      const prompt: string = this.buildValidationPrompt();

      console.log('🤖 Running AI validation (this may take 30-40 seconds)...');
      console.log('═'.repeat(80));
      console.log('');

      // Execute cursor-agent and measure execution time
      const { result: output, executionTime } = await SharedUtils.measureExecutionTime<string>(async () => {
        return await SharedUtils.executeCursorAgent(
          prompt,
          PreFormatValidator.TEMP_PROMPT_FILE,
          true // capture output
        );
      });

      // Check if validation passed
      const validationPassed: boolean = output.includes('VALIDATION PASSED');
      const validationFailed: boolean = output.includes('VALIDATION FAILED');

      if (validationPassed && !validationFailed) {
        console.log('');
        console.log('═'.repeat(80));
        console.log('✅ All validation rules passed!');
        console.log(`⏱️  Validation time: ${SharedUtils.formatExecutionTime(executionTime)}\n`);
        return true;
      }

      if (validationFailed) {
        console.log('');
        console.log('═'.repeat(80));
        console.log('');
        console.error('❌ VALIDATION FAILED\n');

        // Extract and display the error details from the output
        const errorSection: string = output.split('VALIDATION FAILED')[1] || output;
        console.error(errorSection.trim());
        console.error('\n');
        console.error('═'.repeat(80));
        console.error(`\n⏱️  Validation time: ${SharedUtils.formatExecutionTime(executionTime)}`);
        console.error('💡 Fix these issues before formatting\n');

        return false;
      }

      // If neither PASSED nor FAILED is found, show the full output and fail
      console.log('');
      console.log(output);
      console.log('');
      console.error('⚠️  Warning: Could not determine validation result');
      console.error(`⏱️  Validation time: ${SharedUtils.formatExecutionTime(executionTime)}`);
      console.error('Please review the output above\n');
      return false;

    } catch (error) {
      console.error('❌ Pre-format validation execution failed during cursor-agent call:', error);
      process.exit(1);
    }
  }
}

/**
 * Main execution function
 * Runs validation and exits with appropriate code
 */
async function main(): Promise<void> {
  const validator: PreFormatValidator = new PreFormatValidator();
  const isValid: boolean = await validator.validate();

  if (!isValid) {
    process.exit(1);
  }

  process.exit(0);
}

// Run if called directly
if (require.main === module) {
  main().catch((error: Error) => {
    console.error('❌ Pre-format validation process failed with unexpected error:', error);
    process.exit(1);
  });
}

export { PreFormatValidator };
