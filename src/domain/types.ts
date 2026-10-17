import type * as v from "valibot";
import type {
  TRACKER_KINDS,
  TRACKER_VIEWS,
  SHAPE_IDS,
  daySchema,
  documentSchema,
  logItemSchema,
  optionSchema,
  trackerSchema,
} from "./schema";

export type TrackerKind = (typeof TRACKER_KINDS)[number];
export type TrackerView = (typeof TRACKER_VIEWS)[number];
export type ShapeId = (typeof SHAPE_IDS)[number];
export type Option = v.InferOutput<typeof optionSchema>;
export type Tracker = v.InferOutput<typeof trackerSchema>;
export type Day = v.InferOutput<typeof daySchema>;
export type LogItem = v.InferOutput<typeof logItemSchema>;
export type AppDocument = v.InferOutput<typeof documentSchema>;
