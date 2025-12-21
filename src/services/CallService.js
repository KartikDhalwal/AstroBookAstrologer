// services/CallService.js
import {
  createAgoraRtcEngine,
  ChannelProfileType,
  ClientRoleType,
} from "react-native-agora";

let engine = null;

export const CallService = {
  async init(appId) {
    if (engine) return engine;

    engine = createAgoraRtcEngine();
    engine.initialize({ appId });
    engine.setClientRole(ClientRoleType.ClientRoleBroadcaster);
    await engine.enableAudio();

    return engine;
  },

  get() {
    return engine;
  },

  async join(token, channelName, uid, isVideo) {
    if (!engine) return;

    if (isVideo) {
      await engine.enableVideo();
      await engine.enableLocalVideo(true);
    }

    await engine.joinChannel(token, channelName, uid, {
      channelProfile: ChannelProfileType.ChannelProfileCommunication,
      clientRoleType: ClientRoleType.ClientRoleBroadcaster,
    });
  },

  leave() {
    try {
      engine?.leaveChannel();
      engine?.release();
      engine = null;
    } catch {}
  },
};
