import React, { useRef } from "react";
import {
  Animated,
  PanResponder,
  TouchableOpacity,
  View,
  StyleSheet,
  Dimensions,
} from "react-native";
import { RtcSurfaceView } from "react-native-agora";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function MiniFloatingWindow({ remoteUid, tokenInfo, restore }) {
  const pos = useRef(new Animated.ValueXY({ x: SCREEN_WIDTH - 150, y: 120 })).current;

  const pan = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2;
    },

    onPanResponderGrant: () => {
      pos.setOffset({ x: pos.x._value, y: pos.y._value });
      pos.setValue({ x: 0, y: 0 });
    },

    onPanResponderMove: (evt, gestureState) => {
      pos.setValue({ x: gestureState.dx, y: gestureState.dy });
    },

    onPanResponderRelease: () => {
      pos.flattenOffset();

      const finalX = pos.x._value < SCREEN_WIDTH / 2 - 65 ? 20 : SCREEN_WIDTH - 150;

      const finalY = Math.min(
        Math.max(pos.y._value, 50),
        SCREEN_HEIGHT - 250
      );

      Animated.spring(pos, {
        toValue: { x: finalX, y: finalY },
        useNativeDriver: false,
      }).start();
    },
  });

  return (
    <Animated.View {...pan.panHandlers} style={[styles.container, pos.getLayout()]}>
      
      {/*  MAXIMIZE BUTTON */}
      <TouchableOpacity style={styles.maxBtn} onPress={restore}>
        <Icon name="arrow-expand" size={22} color="#fff" />
      </TouchableOpacity>

      {/* Remote Video */}
      {remoteUid ? (
        <RtcSurfaceView
          style={{ flex: 1 }}
          canvas={{ uid: remoteUid, channelId: tokenInfo?.channelName }}
        />
      ) : (
        <View style={styles.waitBox}>
          <Icon name="account" size={36} color="#fff" />
        </View>
      )}

      {/* Local Preview */}
      <View style={styles.localPreview}>
        <RtcSurfaceView
          style={{ width: "100%", height: "100%" }}
          canvas={{ uid: 0, channelId: tokenInfo?.channelName }}
          zOrderMediaOverlay
          zOrderOnTop
        />
      </View>

    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    width: 130,
    height: 180,
    backgroundColor: "#000",
    borderRadius: 12,
    overflow: "hidden",
    zIndex: 9999,
    elevation: 20,
  },

  maxBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 6,
    borderRadius: 20,
  },

  waitBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  localPreview: {
    position: "absolute",
    bottom: 6,
    right: 6,
    width: 40,
    height: 55,
    backgroundColor: "#000",
    borderRadius: 6,
    overflow: "hidden",
  },
});
