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

or with Yarn:

```sh
yarn add react-native-markdown-parser marked react-native-video
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


## Usage

```tsx
import MarkdownParser from 'react-native-markdown-parser';

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
```

## License

MIT
