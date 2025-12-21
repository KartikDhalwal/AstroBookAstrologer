import React, { useRef } from "react";
import {
  Animated,
  PanResponder,
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Dimensions,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const { width, height } = Dimensions.get("window");

export default function MiniVoiceFloatingWindow({
  name,
  duration,
  restore,
}) {
  const pos = useRef(
    new Animated.ValueXY({ x: width - 160, y: 140 })
  ).current;

  const pan = PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) =>
      Math.abs(g.dx) > 2 || Math.abs(g.dy) > 2,

    onPanResponderGrant: () => {
      pos.setOffset({ x: pos.x._value, y: pos.y._value });
      pos.setValue({ x: 0, y: 0 });
    },

    onPanResponderMove: (_, g) =>
      pos.setValue({ x: g.dx, y: g.dy }),

    onPanResponderRelease: () => {
      pos.flattenOffset();
    },
  });

  return (
    <Animated.View
      {...pan.panHandlers}
      style={[styles.container, pos.getLayout()]}
    >
      <TouchableOpacity style={styles.maxBtn} onPress={restore}>
        <Icon name="arrow-expand" size={20} color="#fff" />
      </TouchableOpacity>

      <Icon name="account-voice" size={36} color="#fff" />
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.time}>{format(duration)}</Text>
    </Animated.View>
  );
}

const format = (sec) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    width: 140,
    height: 140,
    backgroundColor: "#111",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    elevation: 20,
    zIndex: 9999,
  },
  maxBtn: {
    position: "absolute",
    top: 6,
    right: 6,
  },
  name: {
    color: "#fff",
    marginTop: 6,
    fontWeight: "600",
  },
  time: {
    color: "#C9A961",
    marginTop: 4,
  },
});
