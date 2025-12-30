// VoiceVideoCallScreen.js (ASTROLOGER) - RESPONSIVE VERSION

import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  PermissionsAndroid,
  Platform,
  Alert,
  Image,
  Dimensions,
  StatusBar,
} from "react-native";
import axios from "axios";
import {
  createAgoraRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  RtcSurfaceView,
  VideoViewSetupMode,
} from "react-native-agora";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import LinearGradient from "react-native-linear-gradient";

import Config from "../agoraconfig";
import { api_url } from "../config/Constants";
import { useCallState } from "../context/CallStateContext";
import MiniFloatingWindow from "../MiniFloatingWindow";
import { initSocket, getSocket } from "../services/socket";
import AsyncStorage from "@react-native-async-storage/async-storage";
import InCallManager from "react-native-incall-manager";

let agoraEngine = null;

// Responsive utilities
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const isSmallDevice = SCREEN_WIDTH < 375;
const isMediumDevice = SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 768;
const isTablet = SCREEN_WIDTH >= 768;

// Responsive scale function
const scale = (size) => {
  const baseWidth = 375; // iPhone X width as base
  return (SCREEN_WIDTH / baseWidth) * size;
};

// Responsive font size
const moderateScale = (size, factor = 0.5) => {
  return size + (scale(size) - size) * factor;
};

const VoiceVideoCallScreen = ({ navigation, route }) => {
  const {
    isMinimized, setIsMinimized,
    setCallUI, setIsCallActive,
    remoteUid, setRemoteUid,
    tokenInfo, setTokenInfo
  } = useCallState();

  const booking = route?.params?.booking;
  const isVideo = route?.params?.isVideo === true;
  const channelName = route?.params?.channelName;
  // const [remoteUid, setRemoteUid] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [profile, setProfile] = useState(null);
  const [imageError, setImageError] = useState(false);

  const astrologerId =
    profile?._id ||
    booking?.astrologer?._id ||
    null;
  const [callDuration, setCallDuration] = useState(0);
  const durationRef = useRef(null);
  const endCallTriggered = useRef(false);
  const remoteUidRef = useRef(null);
  const tokenInfoRef = useRef(null); // ✅ ADD THIS

  const [remainingTime, setRemainingTime] = useState(0);
  const countdownRef = useRef(null);

  // const [tokenInfo, setTokenInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const isMinimizeRef = useRef(false);
  const BASE_URL = 'https://alb-web-assets.s3.ap-south-1.amazonaws.com/';

  const getImageUrl = (path) => {
    if (!path) return null;
  
    let fixedPath = path;
  
    // 🔧 Fix common typo automatically
    fixedPath = fixedPath.replace("amazzonaws.com", "amazonaws.com");
  
    if (fixedPath.startsWith("http")) {
      return fixedPath;
    }
  
    return `https://alb-web-assets.s3.ap-south-1.amazonaws.com/${fixedPath.replace(/^\/+/, "")}`;
  };
  

  useEffect(() => {
    loadAstrologerData();
  }, []);

  const loadAstrologerData = async () => {
    try {
      const data = await AsyncStorage.getItem('astrologerData');
      if (data) {
        setProfile(JSON.parse(data));
      }
    } catch (error) {
      console.log('Error loading astrologer data:', error);
    }
  };

  useEffect(() => {
    if (!channelName || !astrologerId) return;

    const socket = initSocket({
      userId: astrologerId,
      user_type: "astrologer",
    });
    socket.emit("call:ring:start", {
      channelName,
      bookingId: booking?._id,
      astrologerId,
      customerId: booking?.customer?._id,
    });
    console.log("📞 Ring started by astrologer:", channelName);

    const onRingEnded = (data) => {

      if (data.channelName !== channelName) return;
      if (endCallTriggered.current) return;

      endCallTriggered.current = true;

      Alert.alert(
        "Call Rejected",
        "User rejected the call.\nPlease restart the call Urgently.",
        [{ text: "OK", onPress: forceCleanup }],
        { cancelable: false }
      );
    };

    const onCallEnded = (data) => {
      console.log("📴 call:end received", data);

      if (data.channelName !== channelName) return;
      if (endCallTriggered.current) return;

      endCallTriggered.current = true;
      forceCleanup();
    };

    // ✅ LISTEN FIRST
    socket.on("call:ring:end", onRingEnded);
    socket.on("call:end", onCallEnded);

    // ✅ JOIN ROOM IMMEDIATELY (NO DELAY)
    socket.emit("call:join", {
      channelName,
      role: "astrologer",
    });

    console.log("👤 Astrologer joined room:", channelName);

    return () => {
      socket.off("call:ring:end", onRingEnded);
      socket.off("call:end", onCallEnded);
    };
  }, [channelName, astrologerId]);

  useEffect(() => {
    endCallTriggered.current = false;
  }, []);


  /* -----------------------------------------------------
        PARSE BOOKING TIME → REAL START & END DATE
  ----------------------------------------------------- */
  const parseBookingTimes = () => {
    if (!booking?.date || !booking?.fromTime || !booking?.toTime) return {};

    const bookingDate = new Date(booking.date);

    const setTime = (base, timeStr) => {
      const [h, m] = timeStr.split(":").map(Number);
      const d = new Date(base);
      d.setHours(h, m, 0, 0);
      return d;
    };

    const startTime = setTime(bookingDate, booking.fromTime);
    const endTime = setTime(bookingDate, booking.toTime);

    return { startTime, endTime };
  };

  /* -----------------------------------------------------
        REAL CLOCK–BASED COUNTDOWN
  ----------------------------------------------------- */
  const startClockCountdown = () => {
    if (countdownRef.current) return;

    const { endTime } = parseBookingTimes();
    if (!endTime) return;

    countdownRef.current = setInterval(() => {
      const now = Date.now();
      const diffSec = Math.floor((endTime.getTime() - now) / 1000);

      if (diffSec <= 0) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
        endCall();
      } else {
        setRemainingTime(diffSec);
      }
    }, 1000);
  };

  /* -----------------------------------------------------
        NORMAL CALL DURATION TIMER
  ----------------------------------------------------- */
  const startCallTimer = () => {
    if (durationRef.current) return;
    durationRef.current = setInterval(
      () => setCallDuration((p) => p + 1),
      1000
    );
  };

  const stopAllTimers = () => {
    clearInterval(durationRef.current);
    clearInterval(countdownRef.current);
    durationRef.current = null;
    countdownRef.current = null;
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  /* -----------------------------------------------------
        INIT AGORA + VALIDATE REAL CALL WINDOW
  ----------------------------------------------------- */
  useEffect(() => {
    let mounted = true;

    const setupCall = async () => {
      const granted = await requestPermissions();

      if (!granted) {
        Alert.alert(
          "Permissions Required",
          "Camera and microphone permissions are required for video calling.",
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
        return;
      }

      if (mounted) {
        initializeAgora();
      }
    };

    setupCall();

    return () => {
      mounted = false;
      stopAllTimers();
      if (!isMinimizeRef.current) {
        InCallManager.stop(); // 🔥 SAFETY

        leaveChannel();
      }
    };
  }, []);


  const requestPermissions = async () => {
    if (Platform.OS !== "android") return true;

    const result = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      PermissionsAndroid.PERMISSIONS.CAMERA,
    ]);

    const audioGranted =
      result[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] ===
      PermissionsAndroid.RESULTS.GRANTED;

    const cameraGranted =
      result[PermissionsAndroid.PERMISSIONS.CAMERA] ===
      PermissionsAndroid.RESULTS.GRANTED;

    return audioGranted && cameraGranted;
  };


  const initializeAgora = async () => {
    if (agoraEngine) {
      // Timers need to be restarted manually because they are local
      startCallTimer();
      startClockCountdown();
      setIsLoading(false);
      return;
    }


    try {
      if (!channelName) {
        Alert.alert("Error", "Channel missing");
        return;
      }

      setIsLoading(true);

      const { startTime, endTime } = parseBookingTimes();
      const now = Date.now();

      if (now < startTime.getTime()) {
        Alert.alert("Too Early", "This consultation has not started yet.");
        navigation.goBack();
        return;
      }

      if (now > endTime.getTime()) {
        Alert.alert("Expired", "This consultation window has ended.");
        navigation.goBack();
        return;
      }

      setRemainingTime(Math.floor((endTime.getTime() - now) / 1000));
      const token = await fetchToken(channelName);
      console.log({ token })
      tokenInfoRef.current = token;
      setTokenInfo(token);

      agoraEngine = createAgoraRtcEngine();
      agoraEngine.initialize({ appId: Config.appId });

      agoraEngine.setClientRole(ClientRoleType.ClientRoleBroadcaster);
      await agoraEngine.enableAudio();

      if (isVideo) {
        await agoraEngine.enableVideo();
        await agoraEngine.enableLocalVideo(true);
      }

      agoraEngine.registerEventHandler({
        onJoinChannelSuccess: async () => {
          if (isVideo) {
            await agoraEngine.enableVideo();
            await agoraEngine.enableLocalVideo(true);
            await agoraEngine.startPreview();
          }
        
          // 🔥 START CALL SESSION (screen awake + audio focus)
          InCallManager.start({
            media: isVideo ? "video" : "audio",
          });
        
          // Default routing
          InCallManager.setForceSpeakerphoneOn(isVideo);
          setIsSpeakerOn(isVideo);
        
          startCallTimer();
          startClockCountdown();
        },
        


        onUserJoined: (_, uid) => {
          setRemoteUid(uid);
        },

        onUserOffline: (_, uid) => {
          // remoteUidRef.current = null;
          setRemoteUid(null);

          if (endCallTriggered.current) return;
          endCallTriggered.current = true;

          Alert.alert(
            "User Disconnected",
            "The user has disconnected the call.\nPlease restart the call Urgently.",
            [{ text: "OK", onPress: forceCleanup }],
            { cancelable: false }
          );
        }
      });

      await agoraEngine.joinChannel(
        token.token,
        token.channelName,
        token.uid,
        {
          channelProfile: ChannelProfileType.ChannelProfileCommunication,
          clientRoleType: ClientRoleType.ClientRoleBroadcaster,
        }
      );
    } catch (err) {
      Alert.alert("Join Error", err?.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchToken = async (chan) => {
    const res = await axios.post(`${api_url}mobile/agora/token`, {
      channelName: chan,
      uid: 1,
    });
    return res.data;
  };

  /* -----------------------------------------------------
        CONTROLS
  ----------------------------------------------------- */
  const toggleMute = () => {
    agoraEngine?.muteLocalAudioStream(!isMuted);
    setIsMuted(!isMuted);
  };

  const toggleSpeaker = () => {
    const enable = !isSpeakerOn;
    InCallManager.setForceSpeakerphoneOn(enable);
    setIsSpeakerOn(enable);
  };
  

  const toggleCamera = () => {
    agoraEngine?.switchCamera();
    setIsFrontCamera(!isFrontCamera);
  };
  const getISTDate = () => {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(now.getTime() + istOffset);
    return istTime.toISOString();
  };
  const endCall = async () => {
    if (endCallTriggered.current) return;

    console.log("📞 Astrologer ending call");

    // 1️⃣ Mark as ending (but allow emit)
    endCallTriggered.current = true;

    // 2️⃣ Log to backend (non-blocking)
    // if (astrologerId) {
    //   try {
    //     await axios.post(
    //       `${api_url}mobile/call-end-logs`,
    //       {
    //         consultationId: booking?._id,
    //         endById: astrologerId,
    //         endedBy: "astrologer",
    //         endTime: getISTDate(),
    //       },
    //       { headers: { "Content-Type": "application/json" } }
    //     );
    //   } catch (e) {
    //     console.log("⚠️ call-end-logs failed", e.message);
    //   }
    // }

    // 3️⃣ Emit socket event WITHOUT waiting for ACK
    const socket = getSocket();

    if (socket?.connected) {
      socket.emit(
        "call:end",
        {
          channelName,
          bookingId: booking?._id,
          endedBy: "astrologer",
        },
        (ack) => {
          if (ack?.alreadyEnded) {
            console.log("ℹ️ Call already ended on backend");
          } else if (ack?.success) {
            console.log("✅ Call ended successfully");
          } else {
            console.warn("⚠️ Call end failed", ack);
          }
        }
      );

    }

    // 4️⃣ Force cleanup locally
    forceCleanup();
  };


  const forceCleanup = () => {
    stopAllTimers();
  
    try {
      InCallManager.stop(); // 🔥 VERY IMPORTANT
    } catch (e) {}
  
    leaveChannel();
  
    setIsMinimized(false);
    setCallUI(null);
    setIsCallActive(false);
  
    setRemoteUid(null);
    setTokenInfo(null);
  
    navigation.goBack();
  };
  

  const leaveChannel = () => {
    try {
      agoraEngine?.leaveChannel();
      agoraEngine?.release();
      agoraEngine = null;
    } catch { }
  };
  const restoreCall = () => {
    isMinimizeRef.current = false; // Reset this so cleanup works normally later
    setIsMinimized(false);
    setCallUI(null);
    setIsCallActive(true);

    navigation.navigate("VoiceVideoCallScreen", {
      booking,
      isVideo,
      channelName,
    });
  };


  /* -----------------------------------------------------
        MINIMIZE CALL
  ----------------------------------------------------- */
  const minimizeCall = () => {
    isMinimizeRef.current = true; // Prevents the useEffect cleanup from killing the call

    setIsMinimized(true);
    setIsCallActive(true);

    // Set the global UI in context
    setCallUI(
      <MiniFloatingWindow
        remoteUid={remoteUid}
        tokenInfo={tokenInfo}
        restore={restoreCall}
      />
    );

    // IMPORTANT: Navigate back to the previous screen (MainTabs/Login/etc)
    navigation.goBack();
  };



  /* -----------------------------------------------------
        LOADING
  ----------------------------------------------------- */
  if (isLoading) {
    return (
      <LinearGradient colors={["#1a1a2e", "#16213e"]} style={styles.loading}>
        <Text style={styles.loadingText}>Connecting...</Text>
      </LinearGradient>
    );
  }
  if (isMinimized) {
    return null;
  }
  /* -----------------------------------------------------
        MAIN UI
  ----------------------------------------------------- */
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      {!isMinimized && (
        <>{isVideo ? renderVideoUI() : renderVoiceUI()}</>
      )}
      {isMinimized && (
        <MiniFloatingWindow
          remoteUid={remoteUid}
          tokenInfo={tokenInfo}
          restore={restoreCall}
        />
      )}

    </View>
  );

  /* -----------------------------------------------------
        VIDEO UI
  ----------------------------------------------------- */
  function renderVideoUI() {
    return (
      <View style={{ flex: 1 }}>
        {/* Remote Video */}
        {remoteUid ? (
          <RtcSurfaceView
            // Use a key that changes only when the UID or minimized state changes
            key={`remote-view-${remoteUid}`}
            style={styles.remoteVideo}
            canvas={{
              uid: remoteUid,
              channelId: tokenInfoRef.current?.channelName || channelName
            }}
          />
        ) : (
          <View style={styles.waitScreen}>
            <Text style={styles.waitText}>Waiting for user...</Text>
          </View>
        )}

        {/* Local Video Preview */}
        <View style={styles.localVideoWrapper}>
          <RtcSurfaceView
            key="local-preview"
            style={styles.localVideo}
            canvas={{
              uid: 0, // ✅ ALWAYS 0 FOR LOCAL
              channelId: tokenInfoRef.current?.channelName,
            }}
            setupMode={VideoViewSetupMode.VideoViewSetupReplace}
            zOrderMediaOverlay
          />

        </View>

        {/* Timers */}
        <View style={styles.timerContainer}>
          <View style={styles.timerGlass}>
            <Icon name="clock-outline" size={scale(16)} color="#C9A961" />
            <Text style={styles.callTimer}>
              {formatTime(callDuration)} | Ends in: {formatTime(remainingTime)}
            </Text>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controlsContainer}>
          <View style={styles.controlsRow}>
            <ControlBtn
              icon={isMuted ? "microphone-off" : "microphone"}
              onPress={toggleMute}
              isActive={isMuted}
            />
            <ControlBtn
              icon={isSpeakerOn ? "volume-high" : "volume-medium"}
              onPress={toggleSpeaker}
              isActive={isSpeakerOn}
            />
            <ControlBtn icon="camera-switch" onPress={toggleCamera} />
            <ControlBtn icon="arrow-collapse" onPress={minimizeCall} />
            <EndButton onPress={endCall} />
          </View>
        </View>
      </View>
    );
  }

  /* -----------------------------------------------------
        VOICE UI
  ----------------------------------------------------- */
  function renderVoiceUI() {
    return (
      <LinearGradient colors={["#1a1a2e", "#16213e"]} style={styles.voiceContainer}>
        {!imageError && route?.params?.booking?.customer?.image ? (
          <Image
          source={{ uri: getImageUrl(route?.params?.booking?.customer?.image) }}
          style={styles.avatar}
          onError={(e) => {
            console.log("❌ Image load failed:", e.nativeEvent);
            setImageError(true);
          }}
        />
        
        ) : (
          <View style={styles.avatarFallback}>
          <Icon
            name="account"
            size={isTablet ? scale(110) : scale(90)}
            color="#C9A961"
          />
        </View>
        
        )}

        <Text style={styles.voiceName}>
          {route?.params?.booking?.customer?.name}
        </Text>

        <Text style={styles.voiceStatus}>
          {remoteUid ? formatTime(callDuration) : "Calling..."}
        </Text>

        <Text style={styles.voiceCountdown}>
          Ends in: {formatTime(remainingTime)}
        </Text>

        {/* Controls */}
        <View style={styles.controlsRow}>
          <ControlBtn
            icon={isMuted ? "microphone-off" : "microphone"}
            onPress={toggleMute}
            isActive={isMuted}
          />
          <ControlBtn
            icon={isSpeakerOn ? "volume-high" : "volume-medium"}
            onPress={toggleSpeaker}
            isActive={isSpeakerOn}
          />
          <ControlBtn icon="arrow-collapse" onPress={minimizeCall} />
          <EndButton onPress={endCall} />
        </View>
      </LinearGradient>
    );
  }
};

/* -----------------------------------------------------
      REUSABLE BUTTONS
----------------------------------------------------- */
const ControlBtn = ({ icon, onPress, isActive }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.75}
    style={[
      styles.controlBtn,
      isActive && styles.controlBtnActive,
    ]}
  >
    <Icon
      name={icon}
      size={scale(26)}
      color={isActive ? "#1C1C1C" : "#FFF"}
    />
  </TouchableOpacity>
);


const EndButton = ({ onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={styles.endCallBtn}
    activeOpacity={0.7}
  >
    <LinearGradient colors={["#E74C3C", "#C0392B"]} style={styles.endCallGradient}>
      <Icon name="phone-hangup" size={scale(32)} color="#FFF" />
    </LinearGradient>
  </TouchableOpacity>
);

/* -----------------------------------------------------
      RESPONSIVE STYLES
----------------------------------------------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000"
  },

  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  loadingText: {
    color: "#FFF",
    fontSize: moderateScale(20),
    fontWeight: "500",
  },

  remoteVideo: {
    width: "100%",
    height: "100%"
  },
  // avatar: {
  //   width: 40,
  //   height: 40,
  //   borderRadius: 20,
  // },

  avatarFallback: {
    width: isTablet ? scale(200) : scale(160),
    height: isTablet ? scale(200) : scale(160),
    borderRadius: isTablet ? scale(100) : scale(80),
    marginBottom: scale(20),
  
    backgroundColor: "rgba(201,169,97,0.12)",
    justifyContent: "center",
    alignItems: "center",
  
    borderWidth: scale(3),
    borderColor: "#C9A961",
  },
  

  waitScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  waitText: {
    color: "#FFF",
    fontSize: moderateScale(18),
    fontWeight: "400",
  },

  localVideoWrapper: {
    position: "absolute",
    top: Platform.OS === 'android' ? StatusBar.currentHeight + scale(10) : scale(50),
    right: scale(20),
    width: isTablet ? scale(180) : scale(120),
    height: isTablet ? scale(240) : scale(160),
    overflow: "hidden",
    // borderRadius: scale(16),
    borderWidth: 2,
    borderColor: "#C9A961",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    // shadowRadius: 4,
    marginTop: 65
  },
  localVideo: {
    width: "100%",
    height: "100%"
  },

  timerContainer: {
    position: "absolute",
    top: Platform.OS === 'android' ? StatusBar.currentHeight + scale(10) : scale(20),
    alignSelf: "center",
    zIndex: 10,
    marginTop: 20
  },
  timerGlass: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: scale(15),
    paddingVertical: scale(8),
    borderRadius: scale(20),
    alignItems: "center",
    gap: scale(6),
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  callTimer: {
    color: "#FFF",
    fontSize: moderateScale(isSmallDevice ? 14 : 16),
    fontWeight: "500",
    marginLeft: scale(4),
  },

  controlsContainer: {
    position: "absolute",
    bottom: scale(60),
    width: "100%",
    paddingHorizontal: scale(20),
  },

  controlsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: isSmallDevice ? scale(12) : scale(20),
    flexWrap: "wrap",
  },

  controlBtn: {
    width: isTablet ? scale(68) : scale(56),
    height: isTablet ? scale(68) : scale(56),
    borderRadius: isTablet ? scale(34) : scale(28),

    backgroundColor: "rgba(0,0,0,0.35)", // ✅ darker for contrast
    justifyContent: "center",
    alignItems: "center",

    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",

    // Android shadow
    elevation: 6,

    // iOS shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },

  controlBtnActive: {
    backgroundColor: "#C9A961", // ✅ solid active color
    borderColor: "#E6D39A",
    elevation: 8,
    shadowOpacity: 0.4,
  },


  endCallBtn: {
    width: isTablet ? scale(80) : scale(70),
    height: isTablet ? scale(80) : scale(70),
    borderRadius: isTablet ? scale(40) : scale(35),
    overflow: "hidden",
    elevation: 6,
    shadowColor: "#E74C3C",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 4.65,
  },
  endCallGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },

  voiceContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: scale(20),
  },
  avatar: {
    width: isTablet ? scale(200) : scale(160),
    height: isTablet ? scale(200) : scale(160),
    borderRadius: isTablet ? scale(100) : scale(80),
    marginBottom: scale(20),
    borderWidth: scale(3),
    borderColor: "#C9A961",
    backgroundColor: "rgba(201,169,97,0.1)",
  },
  voiceName: {
    color: "#FFF",
    fontSize: moderateScale(isTablet ? 30 : 26),
    marginTop: scale(10),
    fontWeight: "600",
    textAlign: "center",
  },
  voiceStatus: {
    color: "#AAA",
    fontSize: moderateScale(isTablet ? 20 : 18),
    marginTop: scale(6),
    fontWeight: "400",
  },
  voiceCountdown: {
    color: "#C9A961",
    fontSize: moderateScale(isTablet ? 22 : 20),
    marginTop: scale(10),
    fontWeight: "600",
    marginBottom: scale(40),
  },
});

export default VoiceVideoCallScreen;