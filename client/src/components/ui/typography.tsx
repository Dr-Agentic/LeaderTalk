import { cn } from "@/lib/utils";
import React from "react";

interface TypographyProps {
  children: React.ReactNode;
  className?: string;
}

// H1 - Main Heading (Libre Franklin) 
export function H1({ children, className }: TypographyProps) {
  return (
    <h1 className={cn("text-3xl lg:text-4xl font-franklin font-extrabold tracking-tight text-foreground", className)}>
      {children}
    </h1>
  );
}

// H2 - Section Heading (Playfair Display)
export function H2({ children, className }: TypographyProps) {
  return (
    <h2 className={cn("text-2xl lg:text-3xl font-playfair text-foreground leading-tight", className)}>
      {children}
    </h2>
  );
}

// H3 - Subsection Heading (Work Sans - Bold)
export function H3({ children, className }: TypographyProps) {
  return (
    <h3 className={cn("text-heading-3 font-sans text-foreground font-bold", className)}>
      {children}
    </h3>
  );
}

// H4 - Small Heading (Work Sans - Semibold)
export function H4({ children, className }: TypographyProps) {
  return (
    <h4 className={cn("text-lg font-sans font-semibold text-foreground", className)}>
      {children}
    </h4>
  );
}

// Paragraph - Large (Work Sans)
export function LargeParagraph({ children, className }: TypographyProps) {
  return (
    <p className={cn("text-body-large font-sans text-foreground", className)}>
      {children}
    </p>
  );
}

// Paragraph - Default (Work Sans)
export function Paragraph({ children, className }: TypographyProps) {
  return (
    <p className={cn("text-body font-sans text-foreground", className)}>
      {children}
    </p>
  );
}

// Small text for captions, metadata, etc.
export function SmallText({ children, className }: TypographyProps) {
  return (
    <p className={cn("text-sm font-sans text-muted-foreground", className)}>
      {children}
    </p>
  );
}

// Lead text for introductions and important content
export function Lead({ children, className }: TypographyProps) {
  return (
    <p className={cn("text-body-large font-sans text-foreground leading-relaxed", className)}>
      {children}
    </p>
  );
}

// Muted text for secondary information
export function Muted({ children, className }: TypographyProps) {
  return (
    <p className={cn("text-body font-sans text-muted-foreground", className)}>
      {children}
    </p>
  );
}

// Blockquote for featured quotes or testimonials
export function BlockQuote({ children, className }: TypographyProps) {
  return (
    <blockquote className={cn("border-l-4 border-primary pl-4 italic font-playfair text-body-large", className)}>
      {children}
    </blockquote>
  );
}