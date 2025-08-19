# Contributing to Obsidian Midnight Commander

First off, thank you for considering contributing to Obsidian Midnight Commander! It's people like you that make this plugin a great tool for the Obsidian community.

## 🚀 Quick Start

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/yourusername/obsidian-midnight-commander.git`
3. **Install** dependencies: `npm install`
4. **Create** a feature branch: `git checkout -b feature/your-feature-name`
5. **Make** your changes
6. **Test** your changes: `npm run build`
7. **Submit** a pull request

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Guidelines](#contributing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)

## 📜 Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## 🛠 Development Setup

### Prerequisites

- **Node.js** (v16 or higher)
- **npm** (comes with Node.js)
- **Git**
- **Obsidian** (for testing)

### Environment Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/ggfevans/obsidian-midnight-commander.git
   cd obsidian-midnight-commander
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up development build**
   ```bash
   npm run dev
   ```
   This creates a symbolic link to your Obsidian plugins folder for hot reloading.

4. **Configure Obsidian**
   - Open Obsidian
   - Go to Settings → Community plugins
   - Enable "Midnight Commander" plugin
   - The plugin will reload automatically when you make changes

### Development Scripts

```bash
# Development build with watch mode
npm run dev

# Production build
npm run build

# Run linter
npm run lint
npm run lint:fix

# Format code
npm run format
npm run format:check

# Type checking
npx tsc --noEmit
```

## 🤝 Contributing Guidelines

### Types of Contributions

We welcome various types of contributions:

- 🐛 **Bug fixes**
- ✨ **New features**
- 📚 **Documentation improvements** 
- 🎨 **UI/UX enhancements**
- ⚡ **Performance optimizations**
- 🧪 **Test coverage**
- 🔒 **Security improvements**

### Before You Start

1. **Check existing issues** - Look for existing issues or discussions about your idea
2. **Create an issue** - For significant changes, create an issue first to discuss the approach
3. **Follow branching strategy** - Use feature branches from `dev` branch
4. **Keep changes focused** - One feature/fix per pull request

### Branching Strategy

We use a feature-branch workflow:

```
main (production-ready)
  ↑
dev (integration branch)
  ↑
feature/your-feature-name (your changes)
```

- **`main`** - Production-ready code, tagged releases
- **`dev`** - Integration branch for development
- **`feature/*`** - Feature branches for new development
- **`fix/*`** - Bug fix branches
- **`docs/*`** - Documentation-only changes

## 🔄 Pull Request Process

### 1. Preparation
- Ensure your fork is up to date with the latest `dev` branch
- Create a new branch for your changes
- Write clear, concise commit messages

### 2. Development
- Follow our [coding standards](#coding-standards)
- Add/update tests for your changes
- Update documentation as needed
- Ensure your code passes all checks

### 3. Pre-submission Checklist
- [ ] Code builds without errors (`npm run build`)
- [ ] Linting passes (`npm run lint`)
- [ ] Code is formatted (`npm run format`)
- [ ] Tests pass (when available)
- [ ] Documentation is updated
- [ ] CHANGELOG.md is updated (for significant changes)

### 4. Submission
- Push your branch to your fork
- Create a pull request against the `dev` branch
- Fill out the PR template completely
- Link any related issues

### 5. Review Process
- **Automated checks** run first (CI/CD)
- **Code review** by maintainers
- **Testing** in development environment
- **Feedback** and iteration if needed
- **Merge** once approved

## 🐛 Issue Reporting

### Bug Reports

Please include:
- **Clear description** of the bug
- **Steps to reproduce** the issue
- **Expected behavior** vs actual behavior
- **Environment details** (OS, Obsidian version, plugin version)
- **Screenshots/logs** if applicable

### Feature Requests

Please include:
- **Clear description** of the proposed feature
- **Use case** - why is this needed?
- **Implementation ideas** (if any)
- **Mockups/examples** (if applicable)

### Issue Templates

Use our issue templates to ensure all necessary information is included:
- Bug Report Template
- Feature Request Template
- Documentation Issue Template

## 📝 Coding Standards

### TypeScript/JavaScript

- **TypeScript first** - Use TypeScript for all new code
- **Strict typing** - Enable strict mode, avoid `any` types
- **ESLint** - Follow ESLint configuration
- **Prettier** - Use Prettier for code formatting

### React Components

- **Functional components** with hooks
- **TypeScript interfaces** for all props
- **Descriptive component names** (PascalCase)
- **Custom hooks** for reusable logic

### File Organization

```
src/
├── components/     # Reusable UI components
├── views/         # Main view components
├── operations/    # File operation utilities
├── services/      # Business logic services
├── utils/         # Helper utilities
├── types/         # TypeScript interfaces
├── hooks/         # Custom React hooks
└── styles/        # Component-specific styles
```

### Naming Conventions

- **Files**: PascalCase for components (`FilePane.tsx`), camelCase for utilities (`fileUtils.ts`)
- **Variables**: camelCase (`selectedFiles`)
- **Functions**: camelCase (`handleFileClick`)
- **Classes**: PascalCase (`FileOperations`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`)

### Code Style

```typescript
// Good
interface FilePaneProps {
    files: TAbstractFile[];
    onFileSelect: (file: TAbstractFile) => void;
}

const FilePane: React.FC<FilePaneProps> = ({ files, onFileSelect }) => {
    const handleClick = (file: TAbstractFile) => {
        onFileSelect(file);
    };

    return (
        <div className="file-pane">
            {files.map(file => (
                <div key={file.path} onClick={() => handleClick(file)}>
                    {file.name}
                </div>
            ))}
        </div>
    );
};
```

### Documentation

- **JSDoc** comments for all public methods
- **README** updates for new features
- **Inline comments** for complex logic
- **Type annotations** instead of comments when possible

## 🧪 Testing

### Current Testing Setup
- Manual testing in Obsidian development environment
- Build verification (`npm run build`)
- Linting and formatting checks

### Future Testing Goals
- Unit tests for utility functions
- Integration tests for file operations
- Component testing for React components
- E2E testing for user workflows

### Testing Guidelines
- Test edge cases and error conditions
- Mock external dependencies (Obsidian API)
- Keep tests focused and fast
- Use descriptive test names

## 📚 Documentation

### Types of Documentation

1. **Code Documentation**
   - JSDoc comments
   - Type definitions
   - Inline comments for complex logic

2. **User Documentation**
   - README.md
   - Feature documentation
   - Troubleshooting guides

3. **Developer Documentation**
   - This CONTRIBUTING.md
   - API documentation
   - Architecture decisions

### Documentation Standards

- **Clear and concise** language
- **Code examples** where appropriate
- **Screenshots** for UI features
- **Step-by-step** instructions
- **Keep it updated** with code changes

## 🏷 Release Process

### Versioning

We follow [Semantic Versioning](https://semver.org/):
- **MAJOR** version for incompatible API changes
- **MINOR** version for backward-compatible functionality
- **PATCH** version for backward-compatible bug fixes

### Release Workflow

1. **Development** happens on `dev` branch
2. **Testing** and integration on `dev`
3. **Release PR** from `dev` to `main`
4. **Version bump** and tag creation
5. **Automated release** with GitHub Actions
6. **Obsidian plugin registry** submission

## 🤔 Questions?

### Getting Help

- **GitHub Issues** - For bugs and feature requests
- **GitHub Discussions** - For questions and community discussion
- **Discord** - Obsidian community Discord server

### Maintainer Contact

- Primary maintainer: [@ggfevans](https://github.com/ggfevans)
- Response time: Usually within 48 hours

## 🙏 Recognition

Contributors are recognized in:
- **CHANGELOG.md** - For significant contributions
- **README.md** - Contributors section
- **Release notes** - Major feature contributions

---

Thank you for contributing to Obsidian Midnight Commander! Your efforts help make file management in Obsidian better for everyone. 🎉