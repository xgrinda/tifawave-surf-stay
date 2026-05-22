import type { Database } from "@/types/database";

type PublicSchema = Database["public"];

export type TableName = keyof PublicSchema["Tables"];
export type ViewName = keyof PublicSchema["Views"];
export type FunctionName = keyof PublicSchema["Functions"];

export type Row<TTable extends TableName> =
  PublicSchema["Tables"][TTable] extends { Row: infer TRow } ? TRow : never;

export type Insert<TTable extends TableName> =
  PublicSchema["Tables"][TTable] extends { Insert: infer TInsert }
    ? TInsert
    : never;

export type Update<TTable extends TableName> =
  PublicSchema["Tables"][TTable] extends { Update: infer TUpdate }
    ? TUpdate
    : never;

export type ViewRow<TView extends ViewName> =
  PublicSchema["Views"][TView] extends { Row: infer TRow } ? TRow : never;
