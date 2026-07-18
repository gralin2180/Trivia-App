import LottieView from 'lottie-react-native';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { CONFETTI_LOTTIE_URI } from '@/constants/animations';

type ConfettiOverlayProps = {
  visible: boolean;
  onFinish?: () => void;
};

export function ConfettiOverlay({ visible, onFinish }: ConfettiOverlayProps) {
  const ref = useRef<LottieView>(null);

  useEffect(() => {
    if (visible) {
      ref.current?.play();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.overlay} pointerEvents="none">
      <LottieView
        ref={ref}
        source={{ uri: CONFETTI_LOTTIE_URI }}
        autoPlay
        loop={false}
        onAnimationFinish={onFinish}
        style={styles.lottie}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    elevation: 100,
  },
  lottie: {
    width: '100%',
    height: '100%',
  },
});
