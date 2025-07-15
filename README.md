# React Native Markdown Parser

A React Native component for rendering GitHub-flavored Markdown, including images, video, tables, and more.

## Features

- GitHub-flavored Markdown (GFM) support
- Images and video embedding
- Tables, lists, blockquotes, code blocks
- Custom styles via props

## Installation

```sh
npm install react-native-markdown-parser marked react-native-video
```

## Usage

```tsx
import { MarkdownParser } from 'react-native-markdown-parser';

export default function MyScreen() {
  const markdown = `
  # Hello Markdown
  - List item
  - [Link](https://example.com)
  \`\`\`js
  console.log('code!');
  \`\`\`
  `;
  return <MarkdownParser markdownText={markdown} />;
}
```

## Props

- `markdownText: string` (required) — The Markdown content to render.
- `customStyles?: MarkdownStyles` — Optional custom styles for Markdown elements.

## Customization

Override any style by passing a `customStyles` prop:

```tsx
<MarkdownParser
  markdownText={markdown}
  customStyles={{
    heading: { color: 'tomato' },
    code: { backgroundColor: '#222' },
  }}
/>
```

## License

MIT
