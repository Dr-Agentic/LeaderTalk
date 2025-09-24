import { theme } from '../src/styles/theme';

const tintColorLight = theme.colors.primary;
const tintColorDark = theme.colors.primary;

export const Colors = {
  light: {
    text: theme.colors.textLight,
    background: theme.colors.foreground,
    tint: tintColorLight,
    tabIconDefault: theme.colors.disabled,
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: theme.colors.foreground,
    background: theme.colors.background,
    tint: tintColorDark,
    tabIconDefault: theme.colors.disabled,
    tabIconSelected: tintColorDark,
  },
};
