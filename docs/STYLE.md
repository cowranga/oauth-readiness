# Writing style

All app text and guide text follow Composio's docs voice. Reference: https://docs.composio.dev/toolkits/managed-auth

## Rules

- Short declarative sentences. One idea per sentence.
- State facts directly: "Composio can provide the OAuth app." Not "You may find that Composio is able to...".
- No contractions: "do not", "does not", "cannot".
- Conditions: "If X, Y." Pointers: "See X for Y." or "Open X to check Y."
- Address the reader as "you". Use imperative mood for actions: "Register the app.", "Add the redirect URI."
- No filler, hedging, or framing: drop "in practice", "note that", "keep in mind", "it is worth", "basically", "simply", "really", "just".
- No repetition. Say each fact once, in the section where it belongs.
- Use exact names: OAuth app, client ID, client secret, redirect URI, scope, toolkit, auth config, connected account, admin consent.
- Bold for UI labels (**Publish app**). Code style for identifiers (`gmail.readonly`).
- No em dashes, no emojis, no marketing words.
- Headings and labels are short nouns: "Requirements", "Blockers", "Sources".

## Length targets for guide fields

| Field | Target |
|---|---|
| `verdict.summary` | 1 to 2 sentences, under 35 words. Name the deciding factor. |
| `verdict.nextStep` | 1 sentence, under 20 words. |
| `composio.note`, `customerSideGateNote`, stage `notes` | 1 to 3 sentences. |
| `whoCanConnect` | Under 15 words. |
| step `title` | 2 to 6 words, imperative. |
| step `detail` | 1 to 3 sentences. Where to go, what to enter, what you see. |
| blocker fields | 1 sentence each. |
| scope tier `effect`, requirement `detail` | 1 to 2 sentences. |
| uncertainty fields | 1 sentence each. |
| drafts `body` | Keep the structure. Cut padding, about 30% shorter. |

## Examples

Before: "You can register a public connection and, in practice, any Notion user will be able to connect without going through any review, which is great for getting started quickly."
After: "Any Notion user can connect to a public connection. Notion does not review it."

Before: "If you get stuck"
After: "Blockers"
