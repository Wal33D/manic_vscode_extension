# MapEditorMessage

## Properties

| Name | Type | Description |
|------|------|-------------|
| `command` | `"undo" | "redo" | "paint" | "copy" | "paste" | "validateMap" | "getTemplates" | "applyTemplate" | "exportMap" | "importMap" | "getStatistics" | "fixValidationIssue"` |  |
| `tiles` | `{ row: number; col: number; tileId: number; }[] | undefined` |  |
| `description` | `string | undefined` |  |
| `selection` | `{ startRow: number; startCol: number; endRow: number; endCol: number; } | undefined` |  |
| `clipboardData` | `{ tiles: number[][]; heights: number[][]; width: number; height: number; } | undefined` |  |
| `templateId` | `string | undefined` |  |
| `issue` | `unknown` |  |
| `fix` | `string | undefined` |  |
| `format` | `"json" | "text" | undefined` |  |
| `data` | `string | undefined` |  |

