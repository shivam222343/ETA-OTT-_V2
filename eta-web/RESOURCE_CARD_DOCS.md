# Modern Academic Resource Card

A professional, minimal resource card component designed for academic repositories with sharp corners, clean layout, and elegant dark/light theme support.

## 🎨 Design Philosophy

- **Sharp Corners**: Absolutely no border radius anywhere
- **Clean Rectangular Layout**: Structured, academic aesthetic
- **Strong Visual Hierarchy**: Clear distinction between title, category, and metadata
- **Elegant Contrast**: Perfect balance in both light and dark themes
- **Minimal & Refined**: No excessive gradients or glows

## 📐 Layout Structure

```
┌─────────────────────────────────────┐
│                                     │
│          [ICON SQUARE]              │  ← Centered, sharp-edged icon container
│                                     │
│            RESOURCE                 │  ← Uppercase label
│                                     │
│   Computer Networks –               │  ← Bold title (2 lines max)
│      Lecture Notes                  │
│                                     │
├─────────────────────────────────────┤  ← Thin divider
│                                     │
│  │ COMPUTER NETWORKS                │  ← Category with accent bar
│                                     │
│  2/17/2026              [4.5 MB]    │  ← Date + File size badge
│                                     │
└─────────────────────────────────────┘
```

## 🎯 Key Features

### Visual Design
- ✅ Perfect sharp corners (0px border radius)
- ✅ Subtle gradient backgrounds
- ✅ Thin borders for definition
- ✅ Soft shadows for elevation
- ✅ Hover animations with lift effect
- ✅ Left border accent on hover

### Typography
- **Font**: Inter, SF Pro, or modern sans-serif
- **Title**: 18px, bold, line-clamp-2
- **Labels**: 10-11px, uppercase, letter-spaced
- **Metadata**: 12px, muted colors

### Theme Support
- **Dark Mode**: Deep navy/charcoal gradients
- **Light Mode**: Soft gray/white gradients
- **Auto-switching**: Respects system preferences

## 📦 Component Props

```typescript
interface ResourceCardProps {
    resource: {
        _id: string;
        title: string;
        type: 'pdf' | 'video' | 'web' | 'file';
        courseId?: {
            name: string;
        };
        category?: string;
        createdAt?: string;
        uploadedAt?: string;
        file?: {
            sizeBytes: number;
        };
        fileSize?: number;
    };
    onClick?: () => void;
}
```

## 🚀 Usage

### Basic Usage

```jsx
import ResourceCard from './components/ResourceCard';

function MyComponent() {
    const resource = {
        _id: '1',
        title: 'Computer Networks – Lecture Notes',
        type: 'pdf',
        courseId: { name: 'Computer Networks' },
        createdAt: '2026-02-17T00:00:00Z',
        file: { sizeBytes: 4718592 }
    };

    return (
        <ResourceCard 
            resource={resource}
            onClick={() => console.log('Clicked!')}
        />
    );
}
```

### Grid Layout

```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {resources.map((resource) => (
        <ResourceCard
            key={resource._id}
            resource={resource}
            onClick={() => handleClick(resource)}
        />
    ))}
</div>
```

## 🎨 Customization

### Colors

The card uses Tailwind CSS classes and respects your theme configuration:

- **Primary Color**: Used for accents, icons, and hover states
- **Card Background**: `from-card to-card/95` (light) / `from-gray-900 to-gray-900/95` (dark)
- **Borders**: `border-border/50` (light) / `border-gray-800` (dark)
- **Text**: `text-foreground` (light) / `text-gray-100` (dark)

### Spacing

All spacing follows a consistent 4px grid:
- Padding: `p-6` (24px)
- Icon size: `w-20 h-20` (80px)
- Gaps: `gap-4` (16px)

## 🎭 States

### Default
- Clean, minimal appearance
- Subtle shadows
- Muted colors for metadata

### Hover
- Lifts up 4px (`y: -4`)
- Enhanced shadow
- Border color intensifies
- Icon background brightens
- Left accent bar appears
- Title color shifts to primary

### Active/Click
- Slight scale down (`scale: 0.98`)
- Provides tactile feedback

## 📱 Responsive Design

- **Mobile**: Single column, full width
- **Tablet**: 2 columns (md:grid-cols-2)
- **Desktop**: 3 columns (lg:grid-cols-3)
- **Min Height**: 320px for consistency

## 🎬 Animations

All animations use `framer-motion` for smooth, performant transitions:

```jsx
whileHover={{ 
    y: -4, 
    boxShadow: '0 12px 24px rgba(0, 0, 0, 0.3)' 
}}
whileTap={{ scale: 0.98 }}
```

## 🔧 Technical Details

### Dependencies
- `lucide-react`: Icons
- `framer-motion`: Animations
- `tailwindcss`: Styling

### File Size Formatting
- Bytes: `< 1 KB`
- Kilobytes: `1 KB - 1 MB`
- Megabytes: `> 1 MB`

### Date Formatting
- Format: `MM/DD/YYYY`
- Example: `02/17/2026`

## 🎨 Design Tokens

### Shadows
```css
/* Default */
shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1)

/* Hover (Light) */
0 4px 6px -1px rgba(0, 0, 0, 0.1),
0 2px 4px -1px rgba(0, 0, 0, 0.06),
0 12px 24px -4px rgba(0, 0, 0, 0.15)

/* Hover (Dark) */
0 4px 6px -1px rgba(0, 0, 0, 0.3),
0 2px 4px -1px rgba(0, 0, 0, 0.2),
0 12px 24px -4px rgba(0, 0, 0, 0.4)
```

### Transitions
```css
transition-all duration-300
transition-colors duration-300
transition-transform duration-300
```

## 📊 Accessibility

- ✅ Semantic HTML structure
- ✅ Keyboard navigable (cursor-pointer)
- ✅ High contrast ratios
- ✅ Clear focus states
- ✅ Screen reader friendly

## 🎯 Best Practices

1. **Consistent Titles**: Keep titles concise (2 lines max)
2. **Proper Categories**: Use clear, descriptive category names
3. **File Sizes**: Always provide accurate file sizes
4. **Dates**: Use ISO format for consistency
5. **Icons**: Match icon to resource type

## 🚦 Demo

To see the cards in action:

```bash
# Navigate to demo page
/resource-card-demo
```

The demo includes:
- 6 sample resources
- Theme toggle (light/dark)
- Design specifications
- Responsive grid layout

## 📝 Notes

- **No Border Radius**: Enforced via CSS (`border-radius: 0 !important`)
- **Sharp Aesthetic**: Every element maintains rectangular form
- **Academic Feel**: Professional, structured, minimal
- **Production Ready**: Optimized for performance and accessibility

## 🎨 Color Palette Reference

### Dark Theme
- Background: `from-gray-950 via-gray-900 to-gray-950`
- Card: `from-gray-900 to-gray-900/95`
- Border: `border-gray-800`
- Text: `text-gray-100`
- Muted: `text-gray-400`

### Light Theme
- Background: `from-gray-50 via-white to-gray-50`
- Card: `from-card to-card/95`
- Border: `border-border/50`
- Text: `text-foreground`
- Muted: `text-muted-foreground`

---

**Created with precision for modern academic interfaces** ✨
