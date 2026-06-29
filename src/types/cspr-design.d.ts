declare module "@make-software/cspr-design" {
  import type React from "react";

  export enum PrecisionCase {
    full = "full",
    short = "short",
  }

  export interface CsprProps {
    motes?: string | null;
    precisionCase?: PrecisionCase;
    hideCsprCurrency?: boolean;
  }
  export function CSPR(props: CsprProps): React.JSX.Element;

  export interface BadgeProps {
    label: string | React.ReactNode;
    variation?: "green" | "violet" | "blue" | "gray" | "fillBlueGradient" | string;
    textColor?: string;
    capitalize?: boolean;
    lineHeight?: "xxs" | "xs" | "sm";
  }
  export const Badge: React.ForwardRefExoticComponent<BadgeProps & React.RefAttributes<HTMLDivElement>>;

  export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    color?: "primaryBlue" | "primaryRed" | "secondaryBlue" | "secondaryRed" | "utility";
    height?: "24" | "36" | "40";
    width?: "100" | "120" | "140" | "176" | "100%";
    hasOutline?: boolean;
  }
  export const Button: React.ForwardRefExoticComponent<ButtonProps & React.RefAttributes<HTMLButtonElement>>;

  export interface BodyTextProps {
    scale?: 1 | 2 | 3 | 4 | 5;
    color?: string;
    children?: React.ReactNode;
    [key: string]: unknown;
  }
  export const BodyText: React.FC<BodyTextProps>;

  export interface FlexRowProps {
    gap?: number;
    align?: "center" | "flex-start" | "flex-end";
    children?: React.ReactNode;
    [key: string]: unknown;
  }
  export const FlexRow: React.FC<FlexRowProps>;

  export interface FlexColumnProps {
    gap?: number;
    itemsSpacing?: number;
    children?: React.ReactNode;
    [key: string]: unknown;
  }
  export const FlexColumn: React.FC<FlexColumnProps>;

  export interface AddressProps {
    hash: string | null | undefined;
    name?: string;
    hashLength?: number;
    [key: string]: unknown;
  }
  export const Address: React.ForwardRefExoticComponent<AddressProps & React.RefAttributes<HTMLDivElement>>;

  export interface ThemeConfigType {
    light: Record<string, unknown>;
    dark: Record<string, unknown>;
  }
  export const themeConfig: ThemeConfigType;

  export function motesToCSPR(motes: string): string;
  export const CSPR_DECIMALS: number;
  export const MOTES_PER_CSPR_RATE: string;
}
