import { SharedUtils } from './shared-utils';

/**
 * CursorAgentReviewer orchestrates code reviews using cursor-agent CLI
 * Reviews changed files against project rules from .cursor/rules/
 */
class CursorAgentReviewer {
  private static readonly TEMP_PROMPT_FILE = 'temp-prompt.txt';

  private rules: string[] = [];
  private changedFiles: string[] = [];

  constructor() {
    this.loadRules();
    this.getChangedFiles();
  }

  /**
   * Loads all review rules from .cursor/rules/ directory
   * @throws Process exits with code 1 if rules cannot be loaded
   */
  private loadRules(): void {
    try {
      this.rules = SharedUtils.loadAllRules(true);
    } catch (error) {
      console.error('❌ Failed to load review rules from .cursor/rules/ directory:', error);
      process.exit(1);
    }
  }

  /**
   * Detects and filters changed files compared to master branch
   * Includes committed, staged, unstaged, and untracked files
   * @throws Process exits with code 1 if git operations fail
   */
  private getChangedFiles(): void {
    try {
      this.changedFiles = SharedUtils.getAndFilterChangedFiles({
        verbose: true,
        checkExists: false,
        displayInfo: true
      });
    } catch (error) {
      console.error('❌ Failed to detect changed files from git (compared to master branch):', error);
      process.exit(1);
    }
  }

  /**
   * Builds the prompt for cursor-agent review
   * Combines review rules and changed files into a formatted prompt
   * @returns Formatted prompt string with rules, files, and instructions
   */
  private buildReviewPrompt(): string {
    const rulesText: string = this.rules.join('\n\n---\n\n');
    const filesList: string = this.changedFiles.join('\n');

    return `CONTEXT:
- Changed files to review: ${this.changedFiles.length} files
- Review scope: Files changed in current branch compared to master

REVIEW RULES:
${rulesText}

FILES TO REVIEW:
${filesList}

REVIEW INSTRUCTIONS:
1. Review each changed file against the provided rules
2. Focus on code quality, TypeScript standards, and security
3. Provide specific, actionable feedback
4. Use a professional but constructive tone
5. Prioritize high-severity issues
6. Include line numbers and specific examples where possible
7. Suggestions for improvement

Provide a summary at the end with:
- Total files reviewed
- Critical issues found
- Overall code quality assessment
- Priority recommendations`;
  }

  /**
   * Executes the code review process using cursor-agent
   * Measures execution time and displays review results
   * @throws Process exits with code 1 if cursor-agent execution fails
   */
  public async runReview(): Promise<void> {
    if (this.changedFiles.length === 0) {
      console.log('✅ No changed files to review.');
      return;
    }

    console.log('🚀 Starting cursor-agent review...\n');

    try {
      const prompt: string = this.buildReviewPrompt();

      console.log('🤖 Executing cursor-agent review...');
      console.log('='.repeat(50));

      // Execute cursor-agent and measure execution time
      const { executionTime } = await SharedUtils.measureExecutionTime<void>(async () => {
        await SharedUtils.executeCursorAgent(
          prompt,
          CursorAgentReviewer.TEMP_PROMPT_FILE,
          false // don't capture output, print directly
        );
      });

      console.log('\n⏱️  Review execution time:', SharedUtils.formatExecutionTime(executionTime));
      console.log('\n✨ Review completed successfully!');

    } catch (error) {
      console.error('❌ Review failed during cursor-agent execution:', error);
      process.exit(1);
    }
  }
}

// Main execution
async function main(): Promise<void> {
  const args: string[] = process.argv.slice(2);
  const command: string = args[0];

  if (command === 'changed') {
    const reviewer: CursorAgentReviewer = new CursorAgentReviewer();
    await reviewer.runReview();
  } else {
    console.log('Usage: npm run review:changed');
    console.log('This command reviews all changed files using cursor-agent CLI with rules from .cursor/rules/');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch((error: Error) => {
    console.error('❌ Review process failed with unexpected error:', error);
    process.exit(1);
  });
}

export { CursorAgentReviewer };

