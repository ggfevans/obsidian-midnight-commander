# Security Policy

## Supported Versions

We actively maintain and provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.2.x   | :white_check_mark: |
| 0.1.x   | :x:                |

## Security Considerations

### Plugin Security Model

This Obsidian plugin follows security best practices:

- **No external network requests** - The plugin operates entirely locally
- **No sensitive data storage** - Only stores user preferences in Obsidian's settings
- **No file system access outside Obsidian vault** - Respects Obsidian's sandbox model
- **No execution of external commands** - All operations use Obsidian's official APIs

### Data Privacy

- **Local operation only** - All file operations occur within your local Obsidian vault
- **No telemetry or analytics** - We don't collect any usage data
- **No cloud services** - The plugin doesn't communicate with external services
- **User-controlled settings** - All configuration remains in your local Obsidian settings

### File Operation Safety

- **Standard Obsidian APIs** - Uses official `FileManager` methods for all file operations
- **Confirmation dialogs** - Destructive operations require user confirmation
- **Trash integration** - Deleted files go to system/local trash, not permanent deletion
- **Link preservation** - File moves/renames update internal Obsidian links automatically

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please follow these steps:

### 1. Do Not Disclose Publicly
Please **do not** create a public GitHub issue for security vulnerabilities.

### 2. Contact Us Securely
Send a detailed report to:
- **Email**: [Create issue with "Security" label on GitHub repository]
- **Subject**: `[SECURITY] Obsidian Midnight Commander Vulnerability Report`

### 3. Include These Details
- **Description** of the vulnerability
- **Steps to reproduce** the issue
- **Potential impact** and affected versions
- **Suggested mitigation** if you have one
- **Your contact information** for follow-up questions

### 4. Response Timeline
- **24 hours**: Acknowledgment of your report
- **72 hours**: Initial assessment and severity classification  
- **7 days**: Detailed response with timeline for fix
- **30 days**: Security fix released (target, may vary by complexity)

### 5. Responsible Disclosure
We follow responsible disclosure practices:
- We'll work with you to understand and resolve the issue
- We'll credit you in the fix announcement (unless you prefer anonymity)
- We'll coordinate the disclosure timeline with you
- We'll notify users through appropriate channels once a fix is available

## Security Best Practices for Users

### Installation
- Install only from the official Obsidian Community Plugins directory
- Verify the plugin author and repository before installation
- Review plugin permissions and capabilities

### Updates
- Keep the plugin updated to the latest version
- Review changelogs for security-related fixes
- Enable auto-updates if available in Obsidian

### Configuration
- Review plugin settings and permissions regularly
- Use least-privilege principles for file access
- Report suspicious behavior immediately

### Vault Security
- Keep regular backups of your Obsidian vault
- Use encryption for sensitive notes
- Be cautious when sharing vault configurations

## Third-Party Dependencies

This plugin uses the following third-party dependencies:

- **React** - UI framework (maintained by Meta)
- **TypeScript** - Type safety (maintained by Microsoft)  
- **@tanstack/react-virtual** - Virtual scrolling (well-maintained OSS)
- **fuse.js** - Fuzzy search (well-maintained OSS)

We regularly audit and update dependencies to address security vulnerabilities.

## Security Audits

- **Code review** - All code changes require review
- **Dependency scanning** - Automated security scanning of dependencies
- **Static analysis** - ESLint rules include security-focused checks
- **Manual testing** - Security-focused testing for each release

## Contact Information

For security-related questions or concerns:
- GitHub Issues (for general security questions)
- Security Label Issues (for vulnerability reports)

---

**Last Updated**: January 2025  
**Version**: 1.0