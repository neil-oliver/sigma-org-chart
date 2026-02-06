# Sigma Plugin Template

A clean, simple template for building Sigma Computing plugins with React, TypeScript, and shadcn/ui components.

## Disclaimer

This repository is provided **as-is** as a starting point and source of inspiration for customers building their own Sigma plugins. Please be aware of the following:

- **No Warranty**: This code is provided without any warranty, express or implied. Use at your own risk.
- **Subject to Change**: We reserve the right to modify, update, or remove any part of this codebase at any time without prior notice.
- **No Support Guarantees**: Bug reports and feature requests are welcome, but we make no commitments regarding response times or whether issues will be addressed.
- **Not Production-Ready**: This template is intended as a foundation for your own development. You are responsible for testing, securing, and maintaining any code you build on top of it.
- **Self-Hosting Required**: While we use Netlify to host our internal deployments and previews, customers must host their own plugins independently. **Do not use our deploy preview URLs**—they are for internal development only and may change or become unavailable without notice.

By using this repository, you acknowledge and accept these terms.

## Features

- **Simple Data Display**: Shows row count and column information from selected data
- **Settings Panel**: Configurable background and text colors (accessible in edit mode)
- **TypeScript**: Full type safety with strict configuration and better developer experience
- **shadcn/ui Components**: Modern, accessible UI components built with Radix UI
- **Sigma Integration**: Ready-to-use Sigma plugin configuration
- **Clean Code Structure**: Easy to understand and modify for new plugins

## Getting Started

1. **Clone this template** to start building your own Sigma plugin
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Start development server**:
   ```bash
   npm start
   ```
4. **Build for production**:
   ```bash
   npm run build
   ```
5. **Type checking**:
   ```bash
   npm run type-check
   ```
6. **Linting**:
   ```bash
   npm run lint
   ```
7. **Clean cache**:
   ```bash
   npm run clean
   ```

## Plugin Configuration

The plugin is configured with the following editor panel options:

- **Source**: Select a data source element
- **Data Column**: Choose a column from the selected source
- **Settings Config**: JSON configuration for plugin settings
- **Edit Mode**: Toggle to access settings panel

## Customization

### Adding New Settings

1. Update `DEFAULT_SETTINGS` in `src/Settings.js`
2. Add new form controls to the Settings component
3. Apply the settings in your main component

### Modifying the Display

The main display logic is in `src/App.js`. Replace the simple data info display with your custom functionality.

### Styling

The template uses Tailwind CSS with shadcn/ui components. You can:
- Modify colors in `tailwind.config.js`
- Add custom styles in `src/App.css`
- Use the built-in design system components

## File Structure

```
src/
├── App.tsx              # Main plugin component (TypeScript)
├── Settings.tsx         # Settings panel component (TypeScript)
├── index.tsx            # Entry point (TypeScript)
├── types/
│   ├── sigma.ts         # Plugin type definitions
│   └── sigma-client.d.ts # Sigma client declarations
├── components/ui/       # shadcn/ui components (TypeScript)
├── lib/
│   └── utils.ts         # Utility functions (TypeScript)
└── App.css              # Clean CSS file
```

## Dependencies

- **React**: UI framework
- **TypeScript**: Type safety and developer experience
- **@sigmacomputing/plugin**: Sigma plugin SDK
- **shadcn/ui**: Component library
- **Tailwind CSS**: Styling framework
- **Lucide React**: Icons

### Plugin SDK version (when to move back to 1.1.0)

`@sigmacomputing/plugin` is **pinned to 1.0.5** in `package.json`. Version 1.1.0 is currently broken on npm (missing `dist/utils/` and `dist/react/` in the published package), so the build and type-check fail if you use `^1.0.5` and npm resolves to 1.1.0.

**When to upgrade to 1.1.0:**

1. Check that a fixed 1.1.x (or newer) has been published: look at [@sigmacomputing/plugin on npm](https://www.npmjs.com/package/@sigmacomputing/plugin) and any release notes.
2. In `package.json`, change the dependency to allow the new version, e.g. `"@sigmacomputing/plugin": "^1.1.0"` or a specific version like `"1.1.1"`.
3. Run `npm install`, then `npm run type-check` and `npm run build`. If both pass, the published package is fixed; you can remove this note from the README.

**If 1.1.0 is still broken:** keep the pin at `1.0.5` (no caret) until Sigma publishes a fix.

## Development Tips

1. **Test in Sigma**: Use the development server to test your plugin in Sigma
2. **Settings**: Always save settings to the config using `client.config.set()`
3. **Error Handling**: Add proper error boundaries and loading states
4. **Responsive Design**: Ensure your plugin works in different container sizes

## License

This template is provided as-is for building Sigma Computing plugins.
