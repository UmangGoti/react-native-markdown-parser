import { marked } from "marked";
import React, { useMemo } from "react";
import type { ImageStyle, TextStyle, ViewStyle } from "react-native";
import {
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Video from "react-native-video";

/* ---------- Types ---------- */

export interface MarkdownStyles {
  container?: ViewStyle;
  heading?: TextStyle;
  paragraph?: TextStyle;
  strong?: TextStyle;
  em?: TextStyle;
  del?: TextStyle;
  link?: TextStyle;
  image?: ImageStyle;
  video?: ViewStyle;
  code?: ViewStyle;
  codeText?: TextStyle;
  codespan?: TextStyle;
  blockquote?: ViewStyle;
  list?: ViewStyle;
  listitem?: TextStyle;
  listitemContainer?: ViewStyle;
  nestedList?: ViewStyle;
  table?: ViewStyle;
  tableRow?: ViewStyle;
  tableCell?: TextStyle;
  tableHeader?: TextStyle;
  hr?: ViewStyle;
  br?: ViewStyle;
  space?: ViewStyle;
  footnote?: TextStyle;
  superscript?: TextStyle;
  subscript?: TextStyle;
  taskCheckbox?: TextStyle;
}

export interface MarkdownParserProps {
  markdownText: string;
  customStyles?: MarkdownStyles;
}

/* ---------- marked setup ---------- */

marked.setOptions({
  gfm: true,
  breaks: true,
  pedantic: false,
});

marked.use({
  extensions: [
    {
      name: "superscript",
      level: "inline",
      start(src: string) {
        return src.indexOf("^");
      },
      tokenizer(src: string) {
        const rule = /^\^([^^]+)\^/;
        const match = rule.exec(src);
        if (match) {
          return {
            type: "superscript",
            raw: match[0],
            text: match[1].trim(),
          };
        }
      },
      renderer(token: any) {
        return `<sup>${token.text}</sup>`;
      },
    },
    {
      name: "subscript",
      level: "inline",
      start(src: string) {
        return src.indexOf("~");
      },
      tokenizer(src: string) {
        const rule = /^~([^~]+)~/;
        const match = rule.exec(src);
        if (match) {
          return {
            type: "subscript",
            raw: match[0],
            text: match[1].trim(),
          };
        }
      },
      renderer(token: any) {
        return `<sub>${token.text}</sub>`;
      },
    },
    {
      name: "footnote",
      level: "inline",
      start(src: string) {
        return src.indexOf("[^");
      },
      tokenizer(src: string) {
        const rule = /^\[\^([^\]]+)\]/;
        const match = rule.exec(src);
        if (match) {
          return {
            type: "footnote",
            raw: match[0],
            text: match[1].trim(),
          };
        }
      },
      renderer(token: any) {
        return `[${token.text}]`;
      },
    },
    {
      name: "video",
      level: "inline",
      start(src: string) {
        return src.indexOf("![[video]]");
      },
      tokenizer(src: string) {
        const rule = /^!\[\[video\]\]\(([^)]+)\)/;
        const match = rule.exec(src);
        if (match) {
          return {
            type: "video",
            raw: match[0],
            href: match[1].trim(),
          };
        }
      },
      renderer(token: any) {
        return `<video src="${token.href}" controls></video>`;
      },
    },
  ],
});

/* ---------- Component ---------- */

const MarkdownParser: React.FC<MarkdownParserProps> = ({
  markdownText,
  customStyles = {},
}) => {
  // Normalize line breaks to ensure consistent parsing
  const normalizedMarkdown = markdownText.replace(/\r\n|\r/g, "\n");
  const tokens = useMemo(() => {
    const parsedTokens = marked.lexer(normalizedMarkdown);
    // Optional: Uncomment to debug token output
    // console.log("Tokens:", JSON.stringify(parsedTokens, null, 2));
    return parsedTokens;
  }, [normalizedMarkdown]);

  /* ---- render helpers ---- */

  // Inline renderer (returns strings and <Text/> nodes that can sit inside one parent <Text>)
  const renderInlineTokens = (inlineTokens: any[] = []): React.ReactNode[] =>
    inlineTokens
      .map((t, i) => {
        // Handle nested text tokens with their own tokens
        if (t.type === "text" && t.tokens) {
          return renderInlineTokens(t.tokens);
        }
        return renderToken(t, `in-${i}`);
      })
      .flat();

  // List items need special nesting support
  const renderListItems = (items: any[], ordered: boolean, level = 0) => {
    return items.map((item, index) => {
      const bullet = ordered
        ? `${index + 1}. `
        : item.task
        ? item.checked
          ? "☑ "
          : "☐ "
        : "• ";

      const nestedLists =
        item.tokens?.filter((t: any) => t.type === "list") || [];
      const contentTokens =
        item.tokens?.filter((t: any) => t.type !== "list") || [];

      return (
        <View
          key={`${level}-${index}`}
          style={[
            styles.listitemContainer,
            customStyles.listitemContainer,
            { marginLeft: 10 * level },
          ]}
        >
          <Text style={[styles.listitem, customStyles.listitem]}>
            {bullet}
            {renderInlineTokens(contentTokens)}
          </Text>

          {nestedLists.map((listToken: any, i: number) => (
            <View
              key={`nested-${level}-${index}-${i}`}
              style={[
                styles.nestedList,
                customStyles.nestedList,
                { marginLeft: 20 },
              ]}
            >
              {renderListItems(listToken.items, listToken.ordered, level + 1)}
            </View>
          ))}
        </View>
      );
    });
  };

  const renderToken = (token: any, index: string | number): React.ReactNode => {
    switch (token.type) {
      /* ----- blocks ----- */
      case "heading": {
        const fontSize =
          { 1: 32, 2: 28, 3: 24, 4: 20, 5: 16, 6: 14 }[token.depth] ?? 14;
        return (
          <Text
            key={index}
            style={[styles.heading, customStyles.heading, { fontSize }]}
          >
            {renderInlineTokens(token.tokens)}
          </Text>
        );
      }

      case "paragraph":
        return (
          <Text key={index} style={[styles.paragraph, customStyles.paragraph]}>
            {renderInlineTokens(token.tokens)}
          </Text>
        );

      /* ----- inline ----- */
      case "text":
        return token.text;

      case "strong":
        return (
          <Text key={index} style={[styles.strong, customStyles.strong]}>
            {renderInlineTokens(
              token.tokens || [{ type: "text", text: token.text }]
            )}
          </Text>
        );

      case "em":
        return (
          <Text key={index} style={[styles.em, customStyles.em]}>
            {renderInlineTokens(
              token.tokens || [{ type: "text", text: token.text }]
            )}
          </Text>
        );

      case "del":
        return (
          <Text key={index} style={[styles.del, customStyles.del]}>
            {renderInlineTokens(
              token.tokens || [{ type: "text", text: token.text }]
            )}
          </Text>
        );

      case "codespan":
        return (
          <Text key={index} style={[styles.codespan, customStyles.codespan]}>
            {token.text}
          </Text>
        );

      case "link":
        return (
          <Text
            key={index}
            style={[styles.link, customStyles.link]}
            onPress={() => Linking.openURL(token.href)}
            accessibilityRole="link"
            accessibilityLabel={token.text}
          >
            {renderInlineTokens(
              token.tokens || [{ type: "text", text: token.text }]
            )}
          </Text>
        );

      case "image":
        return (
          <Image
            key={index}
            source={{ uri: token.href }}
            style={[styles.image, customStyles.image]}
            accessibilityLabel={token.text}
          />
        );

      case "video":
        return (
          <View key={index} style={[styles.video, customStyles.video]}>
            <Video
              source={{ uri: token.href }}
              style={styles.videoPlayer}
              controls
              resizeMode="contain"
              accessibilityLabel="Video content"
              paused
            />
          </View>
        );

      case "blockquote":
        return (
          <View
            key={index}
            style={[styles.blockquote, customStyles.blockquote]}
          >
            {renderInlineTokens(token.tokens)}
          </View>
        );

      case "list":
        return (
          <View key={index} style={[styles.list, customStyles.list]}>
            {renderListItems(token.items, token.ordered)}
          </View>
        );

      case "table":
        return (
          <View key={index} style={[styles.table, customStyles.table]}>
            <View style={[styles.tableRow, customStyles.tableRow]}>
              {token.header.map((cell: any, i: number) => (
                <Text
                  key={`header-${i}`}
                  style={[
                    styles.tableCell,
                    styles.tableHeader,
                    customStyles.tableHeader,
                  ]}
                >
                  {renderInlineTokens(cell.tokens)}
                </Text>
              ))}
            </View>
            {token.rows.map((row: any[], rowIndex: number) => (
              <View
                key={`row-${rowIndex}`}
                style={[styles.tableRow, customStyles.tableRow]}
              >
                {row.map((cell: any, cellIndex: number) => (
                  <Text
                    key={`cell-${rowIndex}-${cellIndex}`}
                    style={[styles.tableCell, customStyles.tableCell]}
                  >
                    {renderInlineTokens(cell.tokens)}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        );

      case "code":
        return (
          <View key={index} style={[styles.code, customStyles.code]}>
            <Text style={[styles.codeText, customStyles.codeText]}>
              {token.text}
            </Text>
          </View>
        );

      case "hr":
        return <View key={index} style={[styles.hr, customStyles.hr]} />;

      case "br":
        return <View key={index} style={[styles.br, customStyles.br]} />;

      case "space":
        return <View key={index} style={[styles.space, customStyles.space]} />;

      case "footnote":
        return (
          <Text key={index} style={[styles.footnote, customStyles.footnote]}>
            [{token.text}]
          </Text>
        );

      case "superscript":
        return (
          <Text
            key={index}
            style={[styles.superscript, customStyles.superscript]}
          >
            {token.text}
          </Text>
        );

      case "subscript":
        return (
          <Text key={index} style={[styles.subscript, customStyles.subscript]}>
            {token.text}
          </Text>
        );

      default:
        console.warn(`Unsupported token type: ${token.type}`);
        return null;
    }
  };

  // Error boundary to catch rendering issues
  class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean }
  > {
    state = { hasError: false };

    static getDerivedStateFromError() {
      return { hasError: true };
    }

    render() {
      if (this.state.hasError) {
        return <Text style={styles.error}>Error rendering Markdown</Text>;
      }
      return this.props.children;
    }
  }

  return (
    <ErrorBoundary>
      <ScrollView
        contentContainerStyle={[styles.container, customStyles.container]}
      >
        {tokens.map((token, index) => renderToken(token, index))}
      </ScrollView>
    </ErrorBoundary>
  );
};

/* ---------- styles ---------- */

const styles = StyleSheet.create({
  container: { padding: 16 },
  error: { color: "red", fontSize: 16, padding: 16 },
  heading: { fontWeight: "700", marginVertical: 8, color: "black" },
  paragraph: { fontSize: 16, marginVertical: 4, color: "black" },
  strong: { fontWeight: "700", color: "black" },
  em: { fontStyle: "italic", color: "black" },
  del: { textDecorationLine: "line-through", color: "black" },
  link: { color: "#1a0dab", textDecorationLine: "underline" },
  image: {
    width: "100%",
    height: 200,
    resizeMode: "contain",
    marginVertical: 8,
  },
  video: { width: "100%", height: 200, marginVertical: 8 },
  videoPlayer: { width: "100%", height: "100%" },
  code: {
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderRadius: 4,
    marginVertical: 8,
  },
  codeText: { fontSize: 14, color: "black" }, // Removed specific font
  codespan: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 4,
    borderRadius: 4,
    color: "black",
  },
  blockquote: {
    borderLeftWidth: 4,
    borderLeftColor: "#ccc",
    paddingLeft: 12,
    marginVertical: 8,
    backgroundColor: "#f9f9f9",
  },
  list: { marginVertical: 8 },
  listitemContainer: { flexDirection: "column", alignItems: "flex-start" },
  listitem: { fontSize: 16, marginVertical: 2, color: "black" },
  nestedList: { marginVertical: 4 },
  table: { borderWidth: 1, borderColor: "#ccc", marginVertical: 8 },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  tableCell: { flex: 1, padding: 8, fontSize: 14, color: "black" },
  tableHeader: { fontWeight: "700", backgroundColor: "#f0f0f0" },
  hr: { borderBottomWidth: 1, borderBottomColor: "#ccc", marginVertical: 8 },
  br: { height: 8 },
  space: { height: 8 },
  footnote: { fontSize: 12, color: "#555" },
  superscript: { fontSize: 12, lineHeight: 16, position: "relative", top: -5 },
  subscript: { fontSize: 12, lineHeight: 16, position: "relative", bottom: -5 },
  taskCheckbox: { fontSize: 16 },
});

export default MarkdownParser;
