// Renders the two inline marks guide text uses: **UI label** and `identifier`. Builds React elements, never HTML.
const MARK = /(\*\*[^*]+\*\*|`[^`]+`)/g;

export function Inline({ text }: { text: string }): React.ReactElement {
  return (
    <>
      {text.split(MARK).map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**") && part.length > 4) return <strong key={index}>{part.slice(2, -2)}</strong>;
        if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
          return (
            <code key={index} className="font-mono text-[0.9em]">
              {part.slice(1, -1)}
            </code>
          );
        }
        return part;
      })}
    </>
  );
}
