import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

interface ConfettiBurstProps {
  triggerKey: number;
}

const PARTICLES = [
  { emoji: '🐝', left: '12%', dx: -30 },
  { emoji: '🍯', left: '24%', dx: 20 },
  { emoji: '⭐', left: '38%', dx: -15 },
  { emoji: '🎉', left: '50%', dx: 10 },
  { emoji: '🐝', left: '64%', dx: 25 },
  { emoji: '✨', left: '76%', dx: -20 },
  { emoji: '👑', left: '88%', dx: 15 }
];

export const ConfettiBurst: React.FC<ConfettiBurstProps> = ({ triggerKey }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!triggerKey) return;
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true
    }).start();
  }, [triggerKey]);

  if (!triggerKey) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {PARTICLES.map((p, idx) => {
        const translateY = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [20, -160 - (idx % 3) * 35]
        });
        const translateX = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, p.dx]
        });
        const opacity = anim.interpolate({
          inputRange: [0, 0.2, 0.8, 1],
          outputRange: [0, 1, 1, 0]
        });
        const scale = anim.interpolate({
          inputRange: [0, 0.3, 1],
          outputRange: [0.5, 1.35, 0.9]
        });

        return (
          <Animated.View
            key={idx}
            style={[
              styles.particle,
              {
                left: p.left as any,
                opacity,
                transform: [{ translateY }, { translateX }, { scale }]
              }
            ]}
          >
            <Text style={styles.emoji}>{p.emoji}</Text>
          </Animated.View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 120,
    left: 0,
    right: 0,
    height: 200,
    zIndex: 999
  },
  particle: {
    position: 'absolute',
    bottom: 0
  },
  emoji: {
    fontSize: 28
  }
});
