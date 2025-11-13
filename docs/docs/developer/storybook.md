---
sidebar_position: 8
---

# Storybook Component Library

**Storybook** is an open-source tool for developing UI components in isolation. Our Estate Management Platform uses Storybook to build, test, and document all React components.

## 🎯 What is Storybook?

Storybook provides an isolated environment where you can:
- **Develop components** without running the full application
- **Test all states** (loading, error, success, empty, etc.)
- **Document components** with auto-generated docs
- **Ensure accessibility** with built-in WCAG compliance testing
- **Test responsiveness** across different viewport sizes
- **Support dark mode** with theme switching

## 🚀 Quick Start

### Running Storybook

```bash
cd frontend
npm run storybook
```

Storybook will start on **http://localhost:6006**

### Building Storybook

To build a static version for deployment:

```bash
npm run build-storybook
```

Output will be in `storybook-static/` directory.

## 📁 Project Structure

```
frontend/
├── .storybook/
│   ├── main.ts          # Storybook configuration
│   └── preview.ts       # Global decorators and parameters
├── src/
│   ├── components/
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Button.stories.tsx  # Component stories
│   │       ├── Input.tsx
│   │       ├── Input.stories.tsx
│   │       ├── Card.tsx
│   │       └── Card.stories.tsx
│   └── stories/
│       └── Introduction.mdx        # Welcome page
```

## 🎨 Installed Addons

### Essential Addons

| Addon | Purpose | Usage |
|-------|---------|-------|
| **@storybook/addon-essentials** | Core addons bundle | Controls, Actions, Docs, Viewport |
| **@storybook/addon-interactions** | Interactive testing | Test user interactions |
| **@storybook/addon-a11y** | Accessibility testing | WCAG compliance checking |
| **storybook-dark-mode** | Dark mode toggle | Test light/dark themes |
| **@storybook/addon-links** | Navigation between stories | Link related components |

### Addon Features

**Controls Panel**
- Dynamically modify component props
- Test all prop combinations
- See real-time updates

**Actions Panel**
- Monitor event handlers (onClick, onChange, etc.)
- Track user interactions
- Debug event flows

**Accessibility Tab**
- Automatic WCAG violation detection
- Color contrast checking
- Keyboard navigation testing
- Screen reader compatibility

**Viewport Toolbar**
- Test responsive designs
- Predefined viewports: Mobile (375px), Tablet (768px), Desktop (1440px), Wide (1920px)
- Custom viewport sizes

**Dark Mode Toggle**
- Switch between light and dark themes
- Test theme compatibility
- Ensure readability in both modes

## ✍️ Writing Stories

### Basic Story Structure

Create a `.stories.tsx` file next to your component:

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { MyComponent } from './MyComponent';

const meta = {
  title: 'UI/MyComponent',
  component: MyComponent,
  parameters: {
    layout: 'centered', // or 'padded', 'fullscreen'
  },
  tags: ['autodocs'], // Enable auto-generated documentation
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger'],
      description: 'The visual style variant',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the component',
    },
  },
} satisfies Meta<typeof MyComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

// Stories
export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Click me',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled',
  },
};

// Complex story with render function
export const AllVariants: Story = {
  render: () => (
    <div className="flex gap-4">
      <MyComponent variant="primary">Primary</MyComponent>
      <MyComponent variant="secondary">Secondary</MyComponent>
      <MyComponent variant="danger">Danger</MyComponent>
    </div>
  ),
};
```

### Story Naming Conventions

- **PascalCase** for story exports: `Primary`, `WithError`, `AllStates`
- **Descriptive names**: Clearly indicate what the story demonstrates
- **Group related stories**: Use the same `title` prefix

### Story Types

**1. Default Story**
```typescript
export const Default: Story = {
  args: {
    label: 'Default example',
  },
};
```

**2. Variant Stories**
```typescript
export const Primary: Story = { args: { variant: 'primary' } };
export const Secondary: Story = { args: { variant: 'secondary' } };
export const Danger: Story = { args: { variant: 'danger' } };
```

**3. State Stories**
```typescript
export const Loading: Story = { args: { loading: true } };
export const Disabled: Story = { args: { disabled: true } };
export const WithError: Story = { args: { error: 'Error message' } };
```

**4. Composite Stories** (using `render`)
```typescript
export const FormExample: Story = {
  render: () => (
    <form className="space-y-4">
      <Input label="Email" type="email" />
      <Input label="Password" type="password" />
      <Button type="submit">Submit</Button>
    </form>
  ),
};
```

## 🧩 Component Categories

### UI Components

**Purpose**: Reusable, generic UI elements

**Examples**:
- Button
- Input
- Card
- Badge
- Modal
- Dropdown
- Tooltip

**Location**: `src/components/ui/*.tsx`

### Layout Components

**Purpose**: Page structure and navigation

**Examples**:
- Header
- Sidebar
- Footer
- Layout wrapper

**Location**: `src/components/layout/*.tsx`

### Feature Components

**Purpose**: Business-specific functionality

**Examples**:
- PropertyCard
- DocumentList
- AnnouncementCard
- MaintenanceRequestForm

**Location**: `src/components/features/*.tsx`

## ♿ Accessibility Testing

All components **must** pass accessibility checks before merging.

### Using the A11y Addon

1. Open a story in Storybook
2. Click the **Accessibility** tab
3. Review violations (if any)
4. Fix issues in your component
5. Verify the story passes all checks

### Common Accessibility Issues

| Issue | Fix |
|-------|-----|
| Missing `aria-label` | Add descriptive label for screen readers |
| Insufficient color contrast | Adjust colors to meet WCAG AA (4.5:1) |
| Missing form labels | Add `<label>` elements with proper `htmlFor` |
| Keyboard inaccessible | Ensure all interactive elements are keyboard navigable |
| Missing alt text | Add `alt` attributes to images |

### Accessibility Checklist

- ✅ All interactive elements are keyboard accessible
- ✅ Color contrast meets WCAG AA (4.5:1 for text, 3:1 for large text)
- ✅ Proper ARIA labels and roles
- ✅ Form inputs have associated labels
- ✅ Focus indicators are clearly visible
- ✅ Images have alt text
- ✅ Headings follow logical hierarchy (h1 → h2 → h3)

## 📱 Responsive Design Testing

### Using Viewport Toolbar

1. Click the **viewport icon** in the toolbar
2. Select a predefined viewport:
   - **Mobile**: 375px (iPhone SE)
   - **Tablet**: 768px (iPad)
   - **Desktop**: 1440px (Laptop)
   - **Wide**: 1920px (Desktop Monitor)

3. Or create a custom viewport size

### Mobile-First Approach

Design components mobile-first, then enhance for larger screens:

```tsx
<div className="
  flex flex-col        // Mobile: stack vertically
  md:flex-row          // Tablet+: horizontal layout
  gap-2                // Mobile: 8px gap
  md:gap-4             // Tablet+: 16px gap
">
  {/* Content */}
</div>
```

## 🌓 Dark Mode Support

### Testing Dark Mode

Use the **dark mode toggle** in the toolbar to switch themes.

### Implementing Dark Mode

Use Tailwind's `dark:` variant:

```tsx
<div className="
  bg-white             // Light mode
  dark:bg-gray-900     // Dark mode
  text-gray-900        // Light mode text
  dark:text-white      // Dark mode text
">
  Content
</div>
```

### Dark Mode Checklist

- ✅ All components have dark mode styles
- ✅ Text remains readable (sufficient contrast)
- ✅ Images/icons work in both modes
- ✅ Borders are visible in both modes
- ✅ Focus indicators are visible in both modes

## 🧪 Interactive Testing

Use `@storybook/test` for interaction testing:

```typescript
import { expect, userEvent, within } from '@storybook/test';

export const ClickInteraction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Find the button
    const button = canvas.getByRole('button', { name: /click me/i });

    // Click it
    await userEvent.click(button);

    // Assert the result
    await expect(canvas.getByText('Clicked!')).toBeInTheDocument();
  },
};
```

## 📖 Auto-Generated Documentation

Enable auto-docs by adding `tags: ['autodocs']` to your meta:

```typescript
const meta = {
  title: 'UI/MyComponent',
  component: MyComponent,
  tags: ['autodocs'], // ← Enables auto-docs
} satisfies Meta<typeof MyComponent>;
```

### What Gets Auto-Generated

- **Component Props Table**: Extracted from TypeScript types
- **Description**: From JSDoc comments
- **Default Values**: Automatically detected
- **Controls**: Interactive prop controls
- **Stories**: All your defined stories

### Adding JSDoc Comments

```typescript
export interface ButtonProps {
  /**
   * The variant of the button
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'danger';

  /**
   * Button contents
   */
  children: React.ReactNode;

  /**
   * Click handler
   */
  onClick?: () => void;
}
```

## 🎯 Best Practices

### Component Development

1. **Create the component** with TypeScript and proper types
2. **Add JSDoc comments** for all props
3. **Create comprehensive stories** covering all states
4. **Test accessibility** using the a11y addon
5. **Test responsiveness** across viewports
6. **Test dark mode** compatibility

### Story Organization

- **One file per component**: `Button.tsx` → `Button.stories.tsx`
- **Group related components**: Use common title prefix (e.g., `UI/Button`, `UI/Input`)
- **Show all variants**: Create stories for each variant
- **Show all states**: loading, error, success, disabled, etc.
- **Show real examples**: Demonstrate actual use cases

### Performance

- **Lazy load heavy components**: Use dynamic imports
- **Optimize images**: Use appropriate formats and sizes
- **Minimize bundle size**: Only import what you need
- **Use production builds** for performance testing

## 🔧 Configuration

### Customizing Storybook

Edit `.storybook/main.ts`:

```typescript
const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx|mdx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
    // Add more addons here
  ],
  framework: '@storybook/react-vite',
};
```

### Global Decorators

Edit `.storybook/preview.ts` to add global decorators:

```typescript
import { Preview } from '@storybook/react';

const preview: Preview = {
  decorators: [
    (Story) => (
      <div className="p-4">
        <Story />
      </div>
    ),
  ],
};
```

## 🚢 Deployment

### Deploy to GitHub Pages

```bash
# Build Storybook
npm run build-storybook

# Deploy to GitHub Pages (example)
npx gh-pages -d storybook-static
```

### Deploy to Netlify/Vercel

1. Set build command: `npm run build-storybook`
2. Set publish directory: `storybook-static`
3. Deploy!

### Deploy Alongside Docusaurus

Build both and serve from the same domain:

```
your-domain.com/              # Main app
your-domain.com/docs/         # Docusaurus
your-domain.com/storybook/    # Storybook
```

## 📚 Resources

### Official Documentation
- [Storybook Docs](https://storybook.js.org/docs)
- [Storybook Tutorials](https://storybook.js.org/tutorials/)
- [Storybook Addons](https://storybook.js.org/addons)

### Accessibility
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [A11y Project](https://www.a11yproject.com/)
- [WebAIM](https://webaim.org/)

### Design Systems
- [Material Design](https://material.io)
- [Ant Design](https://ant.design)
- [Chakra UI](https://chakra-ui.com)

## 🤝 Contributing

When adding new components to Storybook:

1. ✅ Create component with TypeScript
2. ✅ Add comprehensive JSDoc comments
3. ✅ Create `.stories.tsx` with multiple examples
4. ✅ Ensure all accessibility checks pass
5. ✅ Test across all viewports
6. ✅ Test dark mode
7. ✅ Add unit tests for the component
8. ✅ Update this documentation if needed

## 💡 Tips & Tricks

### Keyboard Shortcuts

- `F` - Toggle fullscreen
- `S` - Toggle sidebar
- `D` - Toggle dark mode
- `A` - Toggle addons panel
- `/` - Search stories

### Quick Navigation

- Use the search bar (`/`) to quickly find components
- Use the sidebar tree to browse categories
- Bookmark frequently used stories

### Debug Mode

Add `?debug=true` to the URL to enable debug mode with extra logging.

---

**Ready to explore?** Start Storybook with `npm run storybook` and visit [http://localhost:6006](http://localhost:6006)! 🎉
