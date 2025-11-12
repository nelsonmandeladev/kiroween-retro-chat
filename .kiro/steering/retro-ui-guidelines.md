---
inclusion: fileMatch
fileMatchPattern: "components/**/*.tsx"
---

# Retro MSN Messenger UI Guidelines

## Design Philosophy

RetroChat recreates the nostalgic MSN Messenger aesthetic from the 2000s. Every UI element should feel authentic to that era while remaining functional and accessible.

## Color Palette

### Primary Colors

- **Window Background**: `#ECE9D8` (classic Windows XP gray)
- **Title Bar**: `#0066CC` (MSN blue)
- **Title Bar Active**: `#0054A6` (darker blue)
- **Border**: `#003D79` (navy blue)
- **Text**: `#000000` (black)
- **Link**: `#0066CC` (blue)

### Status Colors

- **Online**: `#7FBA00` (green)
- **Away**: `#FFB900` (orange)
- **Offline**: `#E81123` (red)
- **AI Friend**: `#8B5CF6` (purple)

## Typography

- **Primary Font**: System fonts (Arial, Tahoma)
- **Font Sizes**:
  - Body: `text-sm` (14px)
  - Headers: `text-base` (16px)
  - Titles: `text-lg` (18px)
- **Font Weight**: Regular (400) for body, Bold (700) for emphasis

## Component Styling

### Windows/Containers

```tsx
<div className='bg-[#ECE9D8] border-2 border-[#0054A6] rounded-sm shadow-lg'>
  <div className='bg-gradient-to-r from-[#0066CC] to-[#0054A6] px-2 py-1'>
    <h3 className='text-white text-sm font-bold'>Window Title</h3>
  </div>
  <div className='p-3'>{/* Content */}</div>
</div>
```

### Buttons

```tsx
// Primary Button
<button className="bg-[#0066CC] hover:bg-[#0054A6] text-white px-4 py-1 rounded-sm border border-[#003D79] text-sm font-medium">
  Click Me
</button>

// Secondary Button
<button className="bg-[#ECE9D8] hover:bg-[#D4D0C8] text-black px-4 py-1 rounded-sm border border-gray-400 text-sm">
  Cancel
</button>
```

### Input Fields

```tsx
<input
  className='w-full px-2 py-1 border border-gray-400 rounded-sm bg-white text-sm focus:outline-none focus:border-[#0066CC]'
  type='text'
/>
```

### Status Indicators

```tsx
// Online
<div className="w-3 h-3 rounded-full bg-[#7FBA00] border border-green-700" />

// Away
<div className="w-3 h-3 rounded-full bg-[#FFB900] border border-orange-700" />

// Offline
<div className="w-3 h-3 rounded-full bg-[#E81123] border border-red-700" />
```

## Layout Patterns

### Contact List Item

- 32px height
- Profile picture on left (24x24px)
- Display name in bold
- Status message in gray, truncated
- Status indicator (colored dot)

### Chat Window

- Fixed width: 400px (desktop)
- Title bar with contact name and status
- Message area with auto-scroll
- Input area at bottom (fixed)
- Emoticon picker button

### Message Bubble

- Sent messages: Right-aligned, blue background
- Received messages: Left-aligned, gray background
- Timestamp below in small gray text
- 8px padding, rounded corners

## Animations

- **Fade In**: New messages, notifications
- **Slide In**: Chat windows opening
- **Pulse**: Typing indicator
- **Bounce**: New message notification

Keep animations subtle and quick (200-300ms) to maintain the snappy feel of classic MSN.

## Accessibility

- Maintain color contrast ratios (WCAG AA minimum)
- Ensure all interactive elements are keyboard accessible
- Provide alt text for profile pictures
- Use semantic HTML elements
- Support screen readers with ARIA labels

## Icons

Use simple, flat icons that match the 2000s aesthetic. Avoid modern gradient or 3D effects.
