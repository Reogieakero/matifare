import { StyleSheet, View } from 'react-native';

import { Gradients } from '@/constants/theme';

type AmbientBackgroundProps = {
  color: string;
  glow?: boolean;
  ring?: boolean;
};

/**
 * Layered, low-contrast background washes. Deliberately built from gradients
 * (no blur dependency) so it renders identically on iOS, Android and web.
 */
export function AmbientBackground({ color, glow = true, ring = true }: AmbientBackgroundProps) {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.ambient, { backgroundColor: color }]}>
      {glow ? (
        <>
          <View style={[styles.wash, styles.blueWash]} />
          <View style={[styles.wash, styles.blueWashTwo]} />
          <View style={styles.speck} />
          <View style={[styles.speck, styles.speckTwo]} />
        </>
      ) : null}
      {ring ? (
        <>
          <View style={[styles.ring, styles.ringOne]} />
          <View style={[styles.ring, styles.ringTwo]} />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  ambient: {
    overflow: 'hidden',
  },
  wash: {
    position: 'absolute',
    width: 460,
    height: 460,
    borderRadius: 460,
  },
  blueWash: {
    top: -190,
    left: -170,
    backgroundImage: Gradients.blueGlow,
    transform: [{ rotate: '-16deg' }],
  },
  blueWashTwo: {
    bottom: -230,
    right: -190,
    backgroundImage: Gradients.blueGlow,
    opacity: 0.55,
    transform: [{ rotate: '18deg' }],
  },
  speck: {
    position: 'absolute',
    top: 168,
    right: 46,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(37,99,235,0.55)',
  },
  speckTwo: {
    top: 196,
    right: 72,
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,198,26,0.9)',
  },
  ring: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.05)',
  },
  ringOne: {
    width: 520,
    height: 520,
    top: -250,
    right: -200,
  },
  ringTwo: {
    width: 360,
    height: 360,
    bottom: -210,
    left: -150,
    borderColor: 'rgba(37,99,235,0.10)',
  },
});
