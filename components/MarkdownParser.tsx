import { marked } from "marked";
import React, { useMemo } from "react";
import {
  Image,
  ImageStyle,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import Video from "react-native-video";

// Define custom style types
interface MarkdownStyles {
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

interface MarkdownParserProps {
  markdownText: string;
  customStyles?: MarkdownStyles;
}

export type { MarkdownParserProps, MarkdownStyles };

// Configure marked for GFM support
marked.setOptions({
  gfm: true,
  breaks: true,
  pedantic: false,
});

// Define custom extensions for marked
const markedExtensions = {
  extensions: [
    {
      name: "superscript",
      level: "inline",
      start(src) {
        return src.indexOf("^");
      },
      tokenizer(src, tokens) {
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
      renderer(token) {
        return `<sup>${token.text}</sup>`;
      },
    },
    {
      name: "subscript",
      level: "inline",
      start(src) {
        return src.indexOf("~");
      },
      tokenizer(src, tokens) {
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
      renderer(token) {
        return `<sub>${token.text}</sub>`;
      },
    },
    {
      name: "footnote",
      level: "inline",
      start(src) {
        return src.indexOf("[^");
      },
      tokenizer(src, tokens) {
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
      renderer(token) {
        return `[${token.text}]`;
      },
    },
    {
      name: "video",
      level: "inline",
      start(src) {
        return src.indexOf("![[video]]");
      },
      tokenizer(src, tokens) {
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
      renderer(token) {
        return `<video src="${token.href}" controls></video>`;
      },
    },
  ],
};

// Apply the extensions
marked.use(markedExtensions);

const MarkdownParser: React.FC<MarkdownParserProps> = ({
  markdownText,
  customStyles = {},
}) => {
  // Parse Markdown into tokens
  const tokens = useMemo(() => marked.lexer(markdownText), [markdownText]);

  // Function to render nested lists
  const renderListItems = (items: any[], ordered: boolean, level = 0) => {
    return items.map((item, index) => {
      const bullet = ordered
        ? `${index + 1}. `
        : item.task
        ? item.checked
          ? "☑ "
          : "☐ "
        : "• ";

      // Find any nested list tokens inside this item's tokens
      const nestedLists = item.tokens?.filter((t: any) => t.type === "list");
      const contentTokens = item.tokens?.filter((t: any) => t.type !== "list");

      return (
        <View
          key={`${level}-${index}`}
          style={[
            styles.listitemContainer,
            customStyles.listitemContainer,
            { marginLeft: 1 * level },
          ]}
        >
          <Text style={[styles.listitem, customStyles.listitem]}>
            {bullet}
            {renderTokens(contentTokens)}
          </Text>
          {nestedLists &&
            nestedLists.map((listToken: any, i: number) => (
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

  // Render individual token
  const renderToken = (token: any, index: string | number) => {
    switch (token.type) {
      case "heading":
        const fontSize =
          { 1: 32, 2: 28, 3: 24, 4: 20, 5: 16, 6: 14 }[token.depth] || 14;
        return (
          <Text
            key={index}
            style={[styles.heading, customStyles.heading, { fontSize }]}
          >
            {renderTokens(token.tokens)}
          </Text>
        );

      case "paragraph":
        return (
          <Text key={index} style={[styles.paragraph, customStyles.paragraph]}>
            {renderTokens(token.tokens)}
          </Text>
        );

      case "text":
        return <Text key={index}>{token.text}</Text>;

      case "strong":
        return (
          <Text key={index} style={[styles.strong, customStyles.strong]}>
            {renderChildren(token)}
          </Text>
        );

      case "em":
        return (
          <Text key={index} style={[styles.em, customStyles.em]}>
            {renderTokens(token.tokens)}
          </Text>
        );

      case "del":
        return (
          <Text key={index} style={[styles.del, customStyles.del]}>
            {renderTokens(token.tokens)}
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
            {renderTokens(token.tokens)}
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
              controls={true}
              resizeMode="contain"
              accessibilityLabel="Video content"
              paused={true}
            />
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

      case "codespan":
        return (
          <Text key={index} style={[styles.codespan, customStyles.codespan]}>
            {token.text}
          </Text>
        );

      case "blockquote":
        return (
          <View
            key={index}
            style={[styles.blockquote, customStyles.blockquote]}
          >
            {renderTokens(token.tokens)}
          </View>
        );

      case "list":
        return (
          <View key={index} style={[styles.list, customStyles.list]}>
            {renderListItems(token.items, token.ordered)}
          </View>
        );

      case "list_item":
        const bullet = token.ordered
          ? `${token.index + 1}. `
          : token.task
          ? token.checked
            ? "☑ "
            : "☐ "
          : "• ";
        return (
          <Text key={index} style={[styles.listitem, customStyles.listitem]}>
            {bullet}
            {renderTokens(token.tokens)}
          </Text>
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
                  {renderTokens(cell.tokens)}
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
                    {renderTokens(cell.tokens)}
                  </Text>
                ))}
              </View>
            ))}
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

  // Helper to render inline tokens
  const renderTokens = (tokens: any[]) => {
    if (!tokens) return null;
    return tokens.map((t, i) => renderToken(t, `${i}`));
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.container, customStyles.container]}
    >
      {tokens.map((token, index) => renderToken(token, index))}
    </ScrollView>
  );
};

// Base styles
const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  heading: {
    fontWeight: "bold",
    marginVertical: 8,
  },
  paragraph: {
    fontSize: 16,
    marginVertical: 4,
  },
  strong: {
    fontWeight: "bold",
  },
  em: {
    fontStyle: "italic",
  },
  del: {
    textDecorationLine: "line-through",
  },
  link: {
    color: "#1a0dab",
    textDecorationLine: "underline",
  },
  image: {
    width: "100%",
    height: 200,
    resizeMode: "contain",
    marginVertical: 8,
  },
  video: {
    width: "100%",
    height: 200,
    marginVertical: 8,
  },
  videoPlayer: {
    width: "100%",
    height: "100%",
  },
  code: {
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderRadius: 4,
    marginVertical: 8,
  },
  codeText: {
    fontFamily: "Courier New",
    fontSize: 14,
  },
  codespan: {
    fontFamily: "Courier New",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  blockquote: {
    borderLeftWidth: 4,
    borderLeftColor: "#ccc",
    paddingLeft: 12,
    marginVertical: 8,
  },
  list: {
    marginVertical: 8,
  },
  listitemContainer: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  listitem: {
    fontSize: 16,
    marginVertical: 2,
  },
  nestedList: {
    marginVertical: 4,
  },
  table: {
    borderWidth: 1,
    borderColor: "#ccc",
    marginVertical: 8,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  tableCell: {
    flex: 1,
    padding: 8,
    fontSize: 14,
  },
  tableHeader: {
    fontWeight: "bold",
    backgroundColor: "#f0f0f0",
  },
  hr: {
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    marginVertical: 8,
  },
  br: {
    height: 8,
  },
  space: {
    height: 8,
  },
  footnote: {
    fontSize: 12,
    color: "#555",
  },
  superscript: {
    fontSize: 12,
    lineHeight: 16,
    position: "relative",
    top: -5,
  },
  subscript: {
    fontSize: 12,
    lineHeight: 16,
    position: "relative",
    bottom: -5,
  },
  taskCheckbox: {
    fontSize: 16,
  },
});

export default MarkdownParser;
