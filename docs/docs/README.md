# Estate Management Platform Documentation

This directory contains the comprehensive documentation for the Estate Management Platform, built with [Docusaurus](https://docusaurus.io/).

## Documentation Structure

Our documentation is organized into three main sections:

### 📖 User Guide
End-user documentation for platform users:
- Getting started
- Feature guides
- Role-specific documentation
- Troubleshooting

### 👨‍💻 Developer Documentation
Technical documentation for developers:
- Setup and installation
- Architecture and design
- Development guidelines
- Testing strategies
- Contributing guidelines

### 📡 API Reference
Complete API documentation:
- Authentication
- All API endpoints
- Request/response examples
- Error handling

## Local Development

### Prerequisites
- Node.js >= 18

### Installation
```bash
cd docs
npm install
```

### Start Development Server
```bash
npm start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

### Build
```bash
npm run build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

### Deploy
```bash
npm run serve
```

Serves the built website locally.

## Contributing to Documentation

### Adding New Pages

1. Create a new `.md` or `.mdx` file in the appropriate directory
2. Add frontmatter:
```md
---
sidebar_position: 1
title: Page Title
---

# Page Title

Content here...
```

3. Update `sidebars.ts` if needed
4. Test locally with `npm start`
5. Submit a pull request

### Style Guide

- Use clear, concise language
- Include code examples where appropriate
- Add screenshots for UI-related documentation
- Use proper heading hierarchy (H1 -> H2 -> H3)
- Link to related documentation
- Keep examples up-to-date

### File Organization

```
docs/
├── docs/                    # Documentation content
│   ├── user-guide/         # User documentation
│   ├── developer/          # Developer documentation
│   └── api/                # API reference
├── blog/                    # Changelog/blog posts
├── src/                     # Custom React components
├── static/                  # Static assets
├── docusaurus.config.ts    # Docusaurus configuration
└── sidebars.ts             # Sidebar structure
```

## Search

Documentation includes local search. To enable Algolia search:

1. Sign up for Algolia DocSearch
2. Update `docusaurus.config.ts` with your credentials

## Deployment

The documentation can be deployed to:

- GitHub Pages
- Netlify
- Vercel
- Any static hosting service

### GitHub Pages

```bash
npm run deploy
```

See [Docusaurus deployment docs](https://docusaurus.io/docs/deployment) for more options.

## Support

- **Documentation Issues**: [GitHub Issues](https://github.com/Coded-Shogun/native-property/issues)
- **Docusaurus Help**: [Docusaurus Documentation](https://docusaurus.io/docs)
