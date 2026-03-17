"use client";

import type { ComponentProps, HTMLAttributes } from "react";
import { createContext, useContext } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { ChevronRightIcon } from "lucide-react";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface SchemaParameter {
  name: string;
  type: string;
}

interface SchemaDisplayContextType {
  method: HttpMethod;
  path: string;
  parameters?: SchemaParameter[];
}

const SchemaDisplayContext = createContext<SchemaDisplayContextType>({
  method: "GET",
  path: "",
});

export type SchemaDisplayProps = HTMLAttributes<HTMLDivElement> & {
  method: HttpMethod;
  path: string;
  parameters?: SchemaParameter[];
};

export const SchemaDisplay = ({
  method,
  path,
  parameters,
  className,
  children,
  ...props
}: SchemaDisplayProps) => {
  return (
    <SchemaDisplayContext.Provider value={{ method, path, parameters }}>
      <div
        className={cn(
          "overflow-hidden rounded-lg border bg-background",
          className
        )}
        {...props}
      >
        {children ?? (
          <>
            <div className="flex items-center gap-3 border-b px-4 py-3">
              <SchemaDisplayMethod />
              <SchemaDisplayPath />
            </div>

            <SchemaDisplayContent>
              {parameters && parameters.length > 0 && (
                <SchemaDisplayParameters />
              )}
            </SchemaDisplayContent>
          </>
        )}
      </div>
    </SchemaDisplayContext.Provider>
  );
};

const methodStyles: Record<HttpMethod, string> = {
  DELETE: "bg-red-100 text-red-700",
  GET: "bg-green-100 text-green-700",
  PATCH: "bg-yellow-100 text-yellow-700",
  POST: "bg-blue-100 text-blue-700",
  PUT: "bg-orange-100 text-orange-700",
};

export const SchemaDisplayMethod = () => {
  const { method } = useContext(SchemaDisplayContext);

  return (
    <Badge
      className={cn("font-mono text-xs", methodStyles[method])}
      variant="secondary"
    >
      {method}
    </Badge>
  );
};

export const SchemaDisplayPath = ({
  className,
}: HTMLAttributes<HTMLSpanElement>) => {
  const { path } = useContext(SchemaDisplayContext);

  const highlightedPath = path.replaceAll(
    /\{([^}]+)\}/g,
    '<span class="text-blue-600">{$1}</span>'
  );

  return (
    <span
      className={cn("font-mono text-sm", className)}
      dangerouslySetInnerHTML={{ __html: highlightedPath }}
    />
  );
};

export const SchemaDisplayContent = ({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("divide-y", className)} {...props}>
    {children}
  </div>
);

export const SchemaDisplayParameters = () => {
  const { parameters } = useContext(SchemaDisplayContext);

  return (
    <Collapsible defaultOpen>
      <CollapsibleTrigger className="group flex w-full items-center gap-2 px-4 py-3 hover:bg-muted/50">
        <ChevronRightIcon className="size-4 transition-transform group-data-[state=open]:rotate-90" />
        <span className="text-sm font-medium">Parameters</span>
        <Badge className="ml-auto text-xs" variant="secondary">
          {parameters?.length}
        </Badge>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="divide-y border-t">
          {parameters?.map((param) => (
            <div key={param.name} className="px-4 py-2 text-sm">
              <span className="font-mono">{param.name}</span>
              <Badge className="ml-2 text-xs" variant="outline">
                {param.type}
              </Badge>
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};  
