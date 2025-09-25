import { theme } from '../src/theme/index';

const tintColorLight = theme.colors.primary;
const tintColorDark = theme.colors.primary;

export const Colors = {
  light: {
    text: '#000000', // textLight equivalent
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
