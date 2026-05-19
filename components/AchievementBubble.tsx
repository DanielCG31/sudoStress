import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

type AchievementItem = {
  nombre?: string;
  titulo?: string;
  xp_recompensa?: number;
};

type Props = {
  visible: boolean;
  achievements: AchievementItem[];
  onDismiss: () => void;
};

const formatAchievementName = (achievement: AchievementItem) =>
  achievement.nombre ?? achievement.titulo ?? "Logro";

export default function AchievementBubble({
  visible,
  achievements,
  onDismiss,
}: Props) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      Animated.timing(anim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start();
      return;
    }

    Animated.spring(anim, {
      toValue: 1,
      damping: 14,
      stiffness: 180,
      mass: 0.7,
      useNativeDriver: true,
    }).start();

    const timeout = setTimeout(() => {
      onDismiss();
    }, 3500);

    return () => clearTimeout(timeout);
  }, [anim, onDismiss, visible]);

  if (!visible || achievements.length === 0) return null;

  const totalXp = achievements.reduce(
    (sum, achievement) => sum + (achievement.xp_recompensa ?? 0),
    0,
  );
  const firstNames = achievements.slice(0, 3).map(formatAchievementName);
  const extraCount = Math.max(0, achievements.length - firstNames.length);

  return (
    <View pointerEvents="box-none" style={styles.overlay}>
      <Animated.View
        style={[
          styles.bubble,
          {
            opacity: anim,
            transform: [
              {
                translateY: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-24, 0],
                }),
              },
              {
                scale: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.96, 1],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.glow} />
        <View style={styles.iconWrap}>
          <Ionicons name="trophy" size={18} color="#FFF7E6" />
        </View>

        <View style={styles.content}>
          <Text style={styles.kicker}>Logro desbloqueado</Text>
          <Text style={styles.title} numberOfLines={2}>
            {firstNames.join(" · ")}
            {extraCount > 0 ? ` +${extraCount}` : ""}
          </Text>
          <Text style={styles.meta}>
            {achievements.length} nuevo(s){" "}
            {achievements.length === 1 ? "logro" : "logros"}
            {totalXp > 0 ? ` · +${totalXp} XP` : ""}
          </Text>
        </View>

        <Pressable onPress={onDismiss} hitSlop={10} style={styles.closeBtn}>
          <Ionicons name="close" size={16} color="#fff" />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: -50,
    left: 12,
    right: 12,
    zIndex: 999,
    elevation: 20,
  },
  bubble: {
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: "rgba(19, 20, 30, 0.94)",
    borderWidth: 1,
    borderColor: "#7c3aed",
    shadowColor: "#000",
    shadowOpacity: 0.24,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  glow: {
    position: "absolute",
    top: 0,
    right: -20,
    width: 84,
    height: 84,
    borderRadius: 50,
    backgroundColor: "rgba(250, 21, 238, 0.12)",
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(250, 21, 238, 0.16)",
    marginRight: 12,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  kicker: {
    color: "#7c3aed",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  meta: {
    color: "#CBD5E1",
    fontSize: 12,
    marginTop: 1,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    marginLeft: 10,
  },
});
