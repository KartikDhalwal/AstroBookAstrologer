import { View, Text } from "react-native";

const styles = {
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#7F1D1D",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
    marginTop: 10,
    marginBottom: 4,
  },
  body: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 22,
    marginBottom: 6,
  },
};
export const parseAstroHTML = (html = "") => {
  if (!html) return [];

  let clean = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/h[45]>/gi, "\n\n")
    .replace(/<[^>]+>/g, "") // remove ALL tags
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const blocks = clean.split("\n\n");

  return blocks.map(text => {
    if (text.length < 40 && text === text.toUpperCase()) {
      return { type: "title", text };
    }

    if (text.length < 60) {
      return { type: "subtitle", text };
    }

    return { type: "body", text };
  });
};

const AstroTextRenderer = ({ html }) => {
  const blocks = parseAstroHTML(html);

  return (
    <View>
      {blocks.map((b, i) => (
        <Text
          key={`${b.type}-${i}`}
          style={styles[b.type]}
        >
          {b.text}
        </Text>
      ))}
    </View>
  );
};

export default AstroTextRenderer;
