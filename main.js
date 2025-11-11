const { SkyWayContext, SkyWayRoom, SkyWayStreamFactory } = window.SkyWayRoom;

const log = (msg) => {
  document.getElementById("log").textContent += msg + "\n";
  document.getElementById("log").scrollTop = document.getElementById("log").scrollHeight;
  console.log(msg);
};

let context, room, me;

document.getElementById("start").addEventListener("click", async () => {
  try {
    log("Context作成中...");
    context = await SkyWayContext.Create({
      apiKey: "10232c12-2b1d-4bcb-b424-944877352c03" // ←RidoさんのAPIキー
    });

    log("マイク取得中...");
    const { audio } = await SkyWayStreamFactory.createMicrophoneAudioStream();

    log("ルーム作成または参加中...");
    room = await SkyWayRoom.FindOrCreate(context, {
      type: "p2p",
      name: "webtelephone-room"
    });

    me = await room.join();
    document.getElementById("my-id").textContent = me.id;
    document.getElementById("disconnect").disabled = false;
    log("あなたのID: " + me.id);

    await me.publish(audio);
    log("音声を公開しました。");

    room.onStreamPublished.add(async ({ publication, member }) => {
      if (member.id === me.id) return;
      log("相手の音声を購読します...");
      const { stream } = await me.subscribe(publication.id);
      document.getElementById("remoteAudio").srcObject = stream;
    });

    room.onMemberJoined.add(({ member }) => log("相手が参加: " + member.id));
    room.onMemberLeft.add(({ member }) => log("相手が退出: " + member.id));

    log("初期化完了。別のタブや端末で同じURLを開くと通話できます。");

  } catch (e) {
    console.error(e);
    log("エラー: " + (e.message || e));
  }
});

document.getElementById("disconnect").addEventListener("click", async () => {
  if (!me || !room) {
    log("接続されていません。");
    return;
  }
  try {
    await me.leave();
    room = null;
    me = null;
    document.getElementById("my-id").textContent = "未接続";
    document.getElementById("disconnect").disabled = true;
    document.getElementById("remoteAudio").srcObject = null;
    log("切断しました。");
  } catch (e) {
    console.error(e);
    log("切断エラー: " + (e.message || e));
  }
});
