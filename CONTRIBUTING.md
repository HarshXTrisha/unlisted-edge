# Contributing to Unlisted Trading Platform

Thank you for your interest in contributing to the Unlisted Trading Platform! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Reporting Issues
- Use GitHub Issues to report bugs or request features
- Provide detailed information including steps to reproduce
- Include relevant logs, screenshots, or error messages
- Check existing issues to avoid duplicates

### Submitting Changes
1. **Fork the repository**
2. **Create a feature branch** from `main`
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes** following our coding standards
4. **Test your changes** thoroughly
5. **Commit with clear messages**
   ```bash
   git commit -m "feat: add new KYC validation feature"
   ```
6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Create a Pull Request** with detailed description

## 📋 Development Guidelines

### Code Style
- **TypeScript**: Use TypeScript for all new code
- **ESLint**: Follow the existing ESLint configuration
- **Prettier**: Code formatting is handled automatically
- **Naming**: Use descriptive names for variables and functions

### Commit Messages
Follow conventional commit format:
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

### Testing
- Write tests for new features
- Ensure all existing tests pass
- Aim for good test coverage
- Test both happy path and error scenarios

### Security
- Never commit sensitive data (API keys, passwords)
- Follow security best practices
- Report security issues privately
- Validate all user inputs

## 🏗️ Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Git

### Local Development
```bash
# Clone your fork
git clone https://github.com/yourusername/unlisted-trading-platform.git
cd unlisted-trading-platform

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
npm run migrate

# Start development servers
npm run dev:full
```

### Running Tests
```bash
# Run all tests
npm test

# Run specific test file
npm test -- server/tests/kycRoutes.test.js

# Run tests in watch mode
npm run test:watch
```

## 📁 Project Structure

Understanding the codebase:

```
src/
├── app/                 # Next.js pages (App Router)
├── components/          # Reusable React components
├── store/              # Redux store and slices
├── utils/              # Utility functions
└── config/             # Configuration files

server/
├── routes/             # Express API routes
├── middleware/         # Express middleware
├── services/           # Business logic
├── migrations/         # Database migrations
├── seeds/              # Database seed data
└── tests/              # Backend tests
```

## 🎯 Areas for Contribution

### High Priority
- **Bug fixes** - Check GitHub Issues for bugs
- **Documentation** - Improve existing docs or add new ones
- **Testing** - Add test coverage for existing features
- **Performance** - Optimize slow queries or components

### Medium Priority
- **UI/UX improvements** - Enhance user experience
- **New features** - Implement features from the roadmap
- **Accessibility** - Improve accessibility compliance
- **Mobile responsiveness** - Enhance mobile experience

### Low Priority
- **Code refactoring** - Improve code quality
- **Developer experience** - Improve development workflow
- **Monitoring** - Add logging and monitoring features

## 🔍 Code Review Process

### For Contributors
- Ensure your PR has a clear description
- Link related issues in the PR description
- Respond to feedback promptly
- Keep PRs focused and reasonably sized

### Review Criteria
- **Functionality** - Does it work as expected?
- **Code Quality** - Is it readable and maintainable?
- **Testing** - Are there adequate tests?
- **Security** - Are there any security concerns?
- **Performance** - Does it impact performance?
- **Documentation** - Is documentation updated if needed?

## 🚀 Release Process

### Versioning
We follow [Semantic Versioning](https://semver.org/):
- **MAJOR** - Breaking changes
- **MINOR** - New features (backward compatible)
- **PATCH** - Bug fixes (backward compatible)

### Release Workflow
1. Features are merged to `main` branch
2. Releases are tagged and deployed automatically
3. Release notes are generated from commit messages
4. Production deployment happens via Vercel

## 📞 Getting Help

### Community
- **GitHub Discussions** - General questions and discussions
- **GitHub Issues** - Bug reports and feature requests
- **Code Reviews** - Get feedback on your contributions

### Documentation
- **README.md** - Getting started guide
- **ARCHITECTURE.md** - System architecture
- **DEPLOYMENT.md** - Deployment instructions
- **KYC_SYSTEM_SUMMARY.md** - KYC system details

## 🏆 Recognition

Contributors are recognized in:
- **README.md** - Contributors section
- **Release notes** - Feature acknowledgments
- **GitHub** - Contributor graphs and statistics

## 📜 Code of Conduct

### Our Standards
- **Be respectful** - Treat everyone with respect
- **Be inclusive** - Welcome diverse perspectives
- **Be constructive** - Provide helpful feedback
- **Be professional** - Maintain professional communication

### Unacceptable Behavior
- Harassment or discrimination
- Trolling or insulting comments
- Publishing private information
- Spam or off-topic content

### Enforcement
- Issues will be addressed promptly
- Violations may result in temporary or permanent bans
- Report issues to project maintainers

## 🙏 Thank You

Your contributions make this project better for everyone. Whether you're fixing bugs, adding features, improving documentation, or helping other users, every contribution is valuable and appreciated!

---

**Happy coding! 🚀**