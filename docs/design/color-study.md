# Application colour study

Status: five unapproved palette options. This study does not change application colours or establish a design system. Source: `apps/web/public/color-schemes.html`.

## Preview

From the repository root:

```sh
python3 -m http.server 4175 --bind 127.0.0.1 --directory apps/web/public
```

Open [the colour study](http://localhost:4175/color-schemes.html). Explore one scheme, compare two, or view all five. Each uses identical typography, layout, photography, content and controls so the comparison isolates colour.

## Options

| Scheme | Accent | Direction | Tradeoff |
| --- | --- | --- | --- |
| Evergreen | `#315B46` | Cool whites and soft sage; calm and natural | Familiar evolution of the existing app; the green supplies its character. |
| Rosewood | `#8B3F59` | Barely pink surfaces and deep rose; warm and personal | More explicitly romantic and less neutral across wedding styles. |
| Harbour | `#2F567C` | Misty whites and deep blue; clear and composed | Broadly applicable; photography and copy carry more warmth. |
| Clay | `#A04C32` | Warm whites and terracotta; sociable and spirited | Strongest warm accent; keep its use concentrated on actions and selection. |
| Graphite | `#414147` | Silver surfaces and charcoal; quiet and contemporary | Gives imagery room, with less traditional wedding character. |

Evergreen is marked as a starting recommendation in the preview, not an approved choice. Full surface, text, interaction and semantic colour values remain in the source palette objects.

## Design rationale

Taste guidance informs restrained, contextual colour use and a fair comparison without decorative layout changes. Emil guidance informs clear control states, subtle feedback and limited motion. Apple guidance informs readable system typography, spatial consistency and responsive composition. Impeccable guidance informs hierarchy, accessibility, semantic status colours and a complete review of the interactive study.

## Validation

- JavaScript syntax passed.
- The six displayed text contrast pairs for every palette exceed 4.5:1: main text, secondary text, primary button label, published status, draft status and error status.
- Independent checks of selected navigation and text on soft surfaces found a minimum contrast of 4.89:1.
- Browser checks verified all five scheme switches, success and error feedback, and semantic status display.
- Visual review found no clipping on desktop or at 390px mobile width and gave the study a ship disposition.

The JSON download browser event timed out; a downloaded file has not been verified. The dedicated checker was unavailable. These checks cover the study, not a palette rollout in the application.
