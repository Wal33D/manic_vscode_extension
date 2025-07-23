# ChartConfiguration

## Properties

| Name | Type | Description |
|------|------|-------------|
| `type` | `"line" | "bar" | "pie" | "doughnut" | "radar"` |  |
| `data` | `{ labels: string[]; datasets: { label?: string | undefined; data: number[]; backgroundColor?: string | string[] | undefined; borderColor?: string | string[] | undefined; borderWidth?: number | undefined; }[]; }` |  |
| `options` | `{ responsive?: boolean | undefined; maintainAspectRatio?: boolean | undefined; plugins?: { legend?: { display?: boolean | undefined; position?: "left" | "right" | "top" | "bottom" | undefined; } | undefined; title?: { ...; } | undefined; } | undefined; scales?: { ...; } | undefined; } | undefined` |  |

