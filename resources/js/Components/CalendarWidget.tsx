import * as React from "react";
import { Widget, WidgetContent } from "@/Components/ui/widget";
import { Label } from "@/Components/ui/label";

export function CalendarWidget() {
  const now = new Date();

  const day = now.toLocaleDateString("ru-RU", { weekday: "short" });
  const month = now.toLocaleDateString("ru-RU", { month: "short" });
  const date = now.getDate().toString().padStart(2, "0");

  return (
    <Widget className="w-full">
      <WidgetContent className="mx-auto flex-col items-start">
        <div className="flex w-full items-center justify-center gap-2">
          <Label className="text-primary text-lg font-semibold capitalize">{day}</Label>
          <Label className="text-lg font-semibold capitalize">{month}</Label>
        </div>
        <Label className="text-5xl font-bold text-center w-full mt-1">{date}</Label>
      </WidgetContent>
    </Widget>
  );
}
