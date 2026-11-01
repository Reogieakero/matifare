import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import type { ColorValue } from 'react-native';

export type IconName =
  | 'arrow-right'
  | 'arrow-up-right'
  | 'check'
  | 'chevron-left'
  | 'chevron-right'
  | 'chevron-down'
  | 'close'
  | 'location'
  | 'car'
  | 'bike'
  | 'van'
  | 'shield'
  | 'sparkles'
  | 'clock'
  | 'calendar'
  | 'wallet'
  | 'bell'
  | 'swap'
  | 'route'
  | 'star'
  | 'lock'
  | 'wifi-off'
  | 'trending-up'
  | 'walk'
  | 'home'
  | 'trips'
  | 'analytics'
  | 'person'
  | 'plus'
  | 'minus'
  | 'locate'
  | 'expand'
  | 'collapse'
  | 'refresh';

type IconDefinition = {
  ios: SFSymbol;
  android: AndroidSymbol;
  web: AndroidSymbol;
};

const icons: Record<IconName, IconDefinition> = {
  'arrow-right': { ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' },
  'arrow-up-right': { ios: 'arrow.up.right', android: 'north_east', web: 'north_east' },
  check: { ios: 'checkmark', android: 'check', web: 'check' },
  'chevron-left': { ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' },
  'chevron-right': { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' },
  'chevron-down': { ios: 'chevron.down', android: 'expand_more', web: 'expand_more' },
  close: { ios: 'xmark', android: 'close', web: 'close' },
  location: { ios: 'location.fill', android: 'location_on', web: 'location_on' },
  car: { ios: 'car.fill', android: 'directions_car', web: 'directions_car' },
  bike: { ios: 'bicycle', android: 'pedal_bike', web: 'pedal_bike' },
  van: { ios: 'bus.fill', android: 'airport_shuttle', web: 'airport_shuttle' },
  shield: { ios: 'shield.fill', android: 'shield', web: 'shield' },
  sparkles: { ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' },
  clock: { ios: 'clock.fill', android: 'schedule', web: 'schedule' },
  calendar: { ios: 'calendar', android: 'calendar_month', web: 'calendar_month' },
  wallet: { ios: 'wallet.pass.fill', android: 'account_balance_wallet', web: 'account_balance_wallet' },
  bell: { ios: 'bell.fill', android: 'notifications', web: 'notifications' },
  swap: { ios: 'arrow.up.arrow.down', android: 'swap_vert', web: 'swap_vert' },
  route: { ios: 'location.circle.fill', android: 'route', web: 'route' },
  star: { ios: 'star.fill', android: 'star', web: 'star' },
  lock: { ios: 'lock.fill', android: 'lock', web: 'lock' },
  'wifi-off': { ios: 'wifi.slash', android: 'wifi_off', web: 'wifi_off' },
  'trending-up': { ios: 'arrow.up.right', android: 'trending_up', web: 'trending_up' },
  walk: { ios: 'figure.walk', android: 'directions_walk', web: 'directions_walk' },
  home: { ios: 'house.fill', android: 'home', web: 'home' },
  trips: { ios: 'list.bullet', android: 'receipt_long', web: 'receipt_long' },
  analytics: { ios: 'chart.bar.fill', android: 'bar_chart', web: 'bar_chart' },
  person: { ios: 'person.fill', android: 'person', web: 'person' },
  plus: { ios: 'plus', android: 'add', web: 'add' },
  minus: { ios: 'minus', android: 'remove', web: 'remove' },
  locate: { ios: 'location.circle.fill', android: 'my_location', web: 'my_location' },
  expand: {
    ios: 'arrow.up.left.and.arrow.down.right',
    android: 'open_in_full',
    web: 'open_in_full',
  },
  collapse: {
    ios: 'arrow.down.right.and.arrow.up.left',
    android: 'close_fullscreen',
    web: 'close_fullscreen',
  },
  refresh: { ios: 'arrow.clockwise', android: 'refresh', web: 'refresh' },
};

type IconProps = {
  name: IconName;
  size?: number;
  color: ColorValue;
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
};

export function Icon({ name, size = 20, color, weight = 'medium' }: IconProps) {
  const definition = icons[name];

  return (
    <SymbolView
      name={{ ios: definition.ios, android: definition.android, web: definition.web }}
      size={size}
      tintColor={color}
      weight={weight}
      resizeMode="scaleAspectFit"
      style={{ width: size, height: size }}
    />
  );
}
